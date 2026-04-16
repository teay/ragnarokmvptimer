#include <ncurses.h>
#include <locale.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include "mvp.h"

// เรียงลำดับเหมือน Web App
int compare_mvps(const void *a, const void *b) {
    MVP *mvpA = (MVP *)a;
    MVP *mvpB = (MVP *)b;
    
    // 1. เรียงตาม Zone
    if (mvpA->zone != mvpB->zone) return mvpA->zone - mvpB->zone;
    
    // 2. ถ้าเป็น ACTIVE เรียงตามเวลาเกิด
    if (mvpA->zone == ZONE_ACTIVE) {
        long timeA = mvpA->death_time + mvpA->respawn_time;
        long timeB = mvpB->death_time + mvpB->respawn_time;
        return (int)(timeA - timeB);
    }
    
    // 3. ถ้าเป็น ALL หรือ WAIT เรียงตามชื่อ (A-Z)
    return strcmp(mvpA->name, mvpB->name);
}

int main(int argc, char *argv[]) {
    setlocale(LC_ALL, ""); 
    char server[50] = "iRO";
    char filepath[100];
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--server") == 0 && i + 1 < argc) strcpy(server, argv[++i]);
    }
    sprintf(filepath, "data/%s.json", server);
    MVP mvp_list[500]; 
    int count = load_mvps_from_file(filepath, mvp_list, 500);
    qsort(mvp_list, count, sizeof(MVP), compare_mvps);

    initscr(); cbreak(); noecho(); curs_set(0); keypad(stdscr, TRUE); timeout(100);

    MvpZone current_zone = ZONE_ALL;
    int filtered[500], filtered_count = 0;
    
    void update_filter(MVP* list, int count, MvpZone zone, int* filtered, int* f_count) {
        *f_count = 0;
        for(int i=0; i<count; i++) if(list[i].zone == zone) filtered[(*f_count)++] = i;
    }
    update_filter(mvp_list, count, current_zone, filtered, &filtered_count);

    int offset = 0, selected = 0, ch;
    
    while((ch = getch()) != 'q') {
        int max_display = LINES - 4;
        
        if (ch == KEY_LEFT || ch == KEY_RIGHT) {
            current_zone = (ch == KEY_LEFT) ? (current_zone == 0 ? 2 : current_zone - 1) : (current_zone + 1) % 3;
            selected = 0; offset = 0;
            update_filter(mvp_list, count, current_zone, filtered, &filtered_count);
        } else if (ch == KEY_UP && selected > 0) selected--;
        else if (ch == KEY_DOWN && selected < filtered_count - 1) selected++;
        else if (ch == KEY_PPAGE) { selected = (selected-5 > 0) ? selected-5 : 0; }
        else if (ch == KEY_NPAGE) { selected = (selected+5 < filtered_count) ? selected+5 : filtered_count-1; }
        else if (ch == KEY_HOME) { selected = 0; }
        else if (ch == KEY_END) { selected = filtered_count - 1; }
        else if (ch == 'k' && filtered_count > 0) {
            int idx = filtered[selected];
            mvp_list[idx].zone = (mvp_list[idx].zone + 1) % 3;
            if(mvp_list[idx].zone == ZONE_ACTIVE) mvp_list[idx].death_time = time(NULL);
            else mvp_list[idx].death_time = 0;
            qsort(mvp_list, count, sizeof(MVP), compare_mvps);
            update_filter(mvp_list, count, current_zone, filtered, &filtered_count);
            if (selected >= filtered_count && filtered_count > 0) selected = filtered_count - 1;
        }

        if (selected < offset) offset = selected;
        else if (selected >= offset + max_display) offset = selected - max_display + 1;

        erase();
        char *zone_names[] = {"ALL", "WAIT", "ACTIVE"};
        mvprintw(0, 0, "=== MVP TRACKER [%s] | Zone: %s | Move: Arr/PgUp,Dn/Home,End | Kill: k | Quit: q ===", server, zone_names[current_zone]);
        mvprintw(1, 2, "%-20s | %-15s | %s", "Name", "Map", "Status/Respawn");
        
        for(int i = 0; i < max_display && (i + offset) < filtered_count; i++) {
            int idx = filtered[i + offset];
            if (i + offset == selected) attron(A_REVERSE);
            
            MVP m = mvp_list[idx];
            // ระบุพิกัด X ตายตัวเพื่อแก้ปัญหาภาษาไทย/เกาหลี
            mvprintw(i + 3, 2, "%s", m.name);
            mvprintw(i + 3, 30, "| Map: %s", m.map_name);
            
            if (m.death_time == 0) {
                mvprintw(i + 3, 50, "| Status: ALIVE");
            } else {
                long remain = (m.death_time + m.respawn_time) - time(NULL);
                if (remain <= 0) 
                    mvprintw(i + 3, 50, "| Status: READY!");
                else 
                    mvprintw(i + 3, 50, "| Respawn: %02ld:%02ld:%02ld", remain/3600, (remain%3600)/60, remain%60);
            }
            
            if (i + offset == selected) attroff(A_REVERSE);
        }
        refresh();
    }
    endwin();
    return 0;
}
