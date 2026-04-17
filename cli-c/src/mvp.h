#ifndef MVP_H
#define MVP_H

typedef enum { ZONE_UNSELECTED, ZONE_WAIT, ZONE_ACTIVE } MvpZone;

typedef struct {
    int id;
    char name[50];
    int respawn_time;
    int window;
    char map_name[30];
    long death_time;
    char display_time[20];
    MvpZone zone;
    double x;
    double y;
} MVP;

int load_mvps_from_file(const char* filename, MVP* list, int max_size);
int save_mvps_to_file(const char* filename, MVP* list, int count);
int get_server_from_file(const char* filename, char* server_out);
long get_respawn_time(MVP* m);
#endif
