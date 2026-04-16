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

    int count = 0;
    cJSON *item = NULL;
    cJSON_ArrayForEach(item, json) {
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
                list[count].respawn_time = rt ? rt->valueint / 1000 : 0; // เก็บเป็นวินาที
                
                cJSON *map = cJSON_GetObjectItem(spawn_item, "mapname");
                strncpy(list[count].map_name, map ? map->valuestring : "Unknown", 29);
                
                list[count].death_time = 0; // บังคับเป็น 0 เพื่อเริ่ม ALIVE
                count++;
            }
        }
    }
    cJSON_Delete(json);
    free(data);
    return count;
}

long get_respawn_time(MVP* m) {
    return (long)m->respawn_time;
}
