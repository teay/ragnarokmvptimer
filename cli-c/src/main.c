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
    if (mvpA->death_time != 0 && mvpB->death_time == 0) return -1;
    if (mvpA->death_time == 0 && mvpB->death_time != 0) return 1;
    if (mvpA->death_time != 0 && mvpB->death_time != 0) {
        long timeA = mvpA->death_time + mvpA->respawn_time;
        long timeB = mvpB->death_time + mvpB->respawn_time;
        return (int)(timeA - timeB);
    }
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

    initscr(); cbreak(); noecho(); curs_set(0); keypad(stdscr, TRUE); timeout(1000);

    int offset = 0, selected = 0, ch;
    
    while((ch = getch()) != 'q') {
        int max_display = LINES - 4;

        switch(ch) {
            case KEY_UP: if(selected > 0) selected--; break;
            case KEY_DOWN: if(selected < count-1) selected++; break;
            case KEY_PPAGE: selected = (selected-5 > 0) ? selected-5 : 0; break;
            case KEY_NPAGE: selected = (selected+5 < count) ? selected+5 : count-1; break;
            case KEY_HOME: selected = 0; break;
            case KEY_END: selected = count - 1; break;
            case 'k': mvp_list[selected].death_time = time(NULL); qsort(mvp_list, count, sizeof(MVP), compare_mvps); break;
        }
        if (selected < offset) offset = selected;
        else if (selected >= offset + max_display) offset = selected - max_display + 1;

        erase();
        mvprintw(0, 0, "=== MVP TRACKER [%s] | Move: Arr/PgUp,Dn/Home,End | Kill: k | Quit: q ===", server);
        mvprintw(1, 2, "%-30s | %-15s | %s", "Name", "Map", "Status/Respawn");
        
        for(int i = 0; i < max_display && (i + offset) < count; i++) {
            int idx = i + offset;
            if (idx == selected) attron(A_REVERSE);
            
            MVP m = mvp_list[idx];
            if (m.death_time == 0) {
                mvprintw(i + 3, 2, "%-30.30s | %-15.15s | Status: ALIVE", m.name, m.map_name);
            } else {
                long remain = (m.death_time + m.respawn_time) - time(NULL);
                if (remain <= 0) 
                    mvprintw(i + 3, 2, "%-30.30s | %-15.15s | Status: READY!", m.name, m.map_name);
                else 
                    mvprintw(i + 3, 2, "%-30.30s | %-15.15s | Respawn: %02ld:%02ld:%02ld", 
                             m.name, m.map_name, remain/3600, (remain%3600)/60, remain%60);
            }
            if (idx == selected) attroff(A_REVERSE);
        }
        refresh();
    }
    endwin();
    return 0;
}
