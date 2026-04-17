#include "mvp.h"
#include "cJSON.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int load_mvps_from_file(const char* filename, MVP* list, int max_size) {
    FILE *fp = fopen(filename, "r");
    if (!fp) return 0;

    fseek(fp, 0, SEEK_END);
    long size = ftell(fp);
    fseek(fp, 0, SEEK_SET);
    char *data = malloc(size + 1);
    fread(data, 1, size, fp);
    data[size] = '\0';
    fclose(fp);

    cJSON *json = cJSON_Parse(data);
    if (!json) { free(data); return 0; }

    cJSON *mvp_array = json;
    if (!cJSON_IsArray(json)) {
        mvp_array = cJSON_GetObjectItem(json, "activeMvps");
        if (!mvp_array) { cJSON_Delete(json); free(data); return 0; }
    }

    int count = 0;
    cJSON *item = NULL;
    cJSON_ArrayForEach(item, mvp_array) {
        cJSON *id = cJSON_GetObjectItem(item, "id");
        cJSON *name = cJSON_GetObjectItem(item, "name");
        cJSON *spawn_arr = cJSON_GetObjectItem(item, "spawn");

        if (id && name && spawn_arr) {
            cJSON *spawn_item = NULL;
            cJSON_ArrayForEach(spawn_item, spawn_arr) {
                if (count >= max_size) break;
                
                list[count].id = id->valueint;
                strncpy(list[count].name, name->valuestring, 49);
                
                cJSON *rt = cJSON_GetObjectItem(spawn_item, "respawnTime");
                list[count].respawn_time = rt ? (int)(rt->valuedouble / 1000.0) : 0; 
                
                cJSON *win = cJSON_GetObjectItem(spawn_item, "window");
                list[count].window = win ? (int)(win->valuedouble / 1000.0) : 600; 
                
                cJSON *map = cJSON_GetObjectItem(spawn_item, "mapname");
                strncpy(list[count].map_name, map ? map->valuestring : "Unknown", 29);
                
                // อ่านค่าสถานะเพิ่มเติมถ้ามี (เพื่อรองรับการ Sync)
                cJSON *dt = cJSON_GetObjectItem(item, "deathTime");
                if (dt) {
                    double val = dt->valuedouble;
                    if (val > 10000000000.0) list[count].death_time = (long)(val / 1000.0);
                    else list[count].death_time = (long)val;
                } else {
                    list[count].death_time = 0;
                }

                cJSON *zn = cJSON_GetObjectItem(item, "zone");
                if (zn) {
                    list[count].zone = (MvpZone)zn->valueint;
                } else {
                    list[count].zone = (list[count].death_time > 0) ? ZONE_ACTIVE : ZONE_WAIT;
                }

                cJSON *pos = cJSON_GetObjectItem(item, "deathPosition");
                if (pos && cJSON_IsObject(pos)) {
                    cJSON *px = cJSON_GetObjectItem(pos, "x");
                    cJSON *py = cJSON_GetObjectItem(pos, "y");
                    list[count].x = px && cJSON_IsNumber(px) ? px->valuedouble : -1.0;
                    list[count].y = py && cJSON_IsNumber(py) ? py->valuedouble : -1.0;
                } else {
                    list[count].x = -1.0;
                    list[count].y = -1.0;
                }

                count++;
            }
        }
    }
    cJSON_Delete(json);
    free(data);
    return count;
}

int get_server_from_file(const char* filename, char* server_out) {
    FILE *fp = fopen(filename, "r");
    if (!fp) return 0;

    fseek(fp, 0, SEEK_END);
    long size = ftell(fp);
    fseek(fp, 0, SEEK_SET);
    char *data = malloc(size + 1);
    fread(data, 1, size, fp);
    data[size] = '\0';
    fclose(fp);

    cJSON *json = cJSON_Parse(data);
    if (!json) { free(data); return 0; }

    cJSON *server = cJSON_GetObjectItem(json, "server");
    if (server && server->valuestring) {
        strcpy(server_out, server->valuestring);
        cJSON_Delete(json);
        free(data);
        return 1;
    }

    cJSON_Delete(json);
    free(data);
    return 0;
}

int save_mvps_to_file(const char* filename, MVP* list, int count) {
    cJSON *json = cJSON_CreateArray();
    for (int i = 0; i < count; i++) {
        cJSON *item = cJSON_CreateObject();
        cJSON_AddNumberToObject(item, "id", list[i].id);
        cJSON_AddStringToObject(item, "name", list[i].name);
        cJSON_AddNumberToObject(item, "deathTime", (double)list[i].death_time);
        cJSON_AddNumberToObject(item, "zone", (int)list[i].zone);
        
        if (list[i].x >= 0 && list[i].y >= 0) {
            cJSON *pos = cJSON_CreateObject();
            cJSON_AddNumberToObject(pos, "x", list[i].x);
            cJSON_AddNumberToObject(pos, "y", list[i].y);
            cJSON_AddItemToObject(item, "deathPosition", pos);
        } else {
            cJSON_AddNullToObject(item, "deathPosition");
        }

        cJSON *spawn_arr = cJSON_CreateArray();
        cJSON *spawn_item = cJSON_CreateObject();
        cJSON_AddStringToObject(spawn_item, "mapname", list[i].map_name);
        cJSON_AddNumberToObject(spawn_item, "respawnTime", (double)list[i].respawn_time * 1000);
        cJSON_AddItemToArray(spawn_arr, spawn_item);
        cJSON_AddItemToObject(item, "spawn", spawn_arr);
        
        cJSON_AddItemToArray(json, item);
    }

    char *out = cJSON_Print(json);
    FILE *fp = fopen(filename, "w");
    if (fp) {
        fputs(out, fp);
        fclose(fp);
    }
    free(out);
    cJSON_Delete(json);
    return 1;
}

long get_respawn_time(MVP* m) {
    return (long)m->respawn_time;
}
