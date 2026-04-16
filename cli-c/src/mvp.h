#ifndef MVP_H
#define MVP_H

typedef struct {
    int id;
    char name[50];
    int respawn_time;
    int window;
    char map_name[30];
    long death_time;
    char display_time[20];
} MVP;

int load_mvps_from_file(const char* filename, MVP* list, int max_size);
long get_respawn_time(MVP* m);
#endif
