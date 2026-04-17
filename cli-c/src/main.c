#include <ncurses.h>
#include <locale.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <sys/stat.h>
#include "mvp.h"

int compare_mvps(const void *a, const void *b) {
    MVP *mvpA = (MVP *)a;
    MVP *mvpB = (MVP *)b;
    if (mvpA->zone != mvpB->zone) {
        if (mvpA->zone == ZONE_ACTIVE) return -1;
        if (mvpB->zone == ZONE_ACTIVE) return 1;
        if (mvpA->zone == ZONE_WAIT) return -1;
        if (mvpB->zone == ZONE_WAIT) return 1;
        return mvpA->zone - mvpB->zone;
    }
    if (mvpA->zone == ZONE_ACTIVE) {
        long timeA = mvpA->death_time + mvpA->respawn_time;
        long timeB = mvpB->death_time + mvpB->respawn_time;
        if (timeA < timeB) return -1;
        if (timeA > timeB) return 1;
    }
    return strcmp(mvpA->name, mvpB->name);
}

time_t get_file_mtime(const char *path) {
    struct stat st;
    if (stat(path, &st) == 0) return st.st_mtime;
    return 0;
}

void sync_with_save_file(const char* savepath, MVP* list, int count) {
    MVP updates[500];
    int up_count = load_mvps_from_file(savepath, updates, 500);
    for (int i = 0; i < count; i++) {
        list[i].zone = ZONE_UNSELECTED;
        list[i].death_time = 0;
    }
    for (int i = 0; i < up_count; i++) {
        for (int j = 0; j < count; j++) {
            if (list[j].id == updates[i].id && strcmp(list[j].map_name, updates[i].map_name) == 0) {
                list[j].death_time = updates[i].death_time;
                list[j].zone = updates[i].zone;
                break;
            }
        }
    }
}

void update_filter(MVP* list, int count, int tab, int* filtered, int* f_count) {
    *f_count = 0;
    for(int i=0; i<count; i++) {
        if(tab == 0 && list[i].zone == ZONE_UNSELECTED) filtered[(*f_count)++] = i;
        else if(tab == 1 && list[i].zone == ZONE_WAIT) filtered[(*f_count)++] = i;
        else if(tab == 2 && list[i].zone == ZONE_ACTIVE) filtered[(*f_count)++] = i;
    }
}

int main(int argc, char *argv[]) {
    setlocale(LC_ALL, ""); 
    char server[50] = "iRO";
    char filepath[100], savepath[100] = "data/mvp-save.json";
    get_server_from_file(savepath, server);

    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--server") == 0 && i + 1 < argc) strcpy(server, argv[++i]);
    }
    sprintf(filepath, "data/%s.json", server);
    
    MVP mvp_list[500]; 
    int count = load_mvps_from_file(filepath, mvp_list, 500);
    sync_with_save_file(savepath, mvp_list, count);
    qsort(mvp_list, count, sizeof(MVP), compare_mvps);

    initscr(); cbreak(); noecho(); curs_set(0); keypad(stdscr, TRUE); timeout(500);
    if (has_colors()) {
        start_color();
        init_pair(1, COLOR_GREEN, COLOR_BLACK);  // ALIVE
        init_pair(2, COLOR_YELLOW, COLOR_BLACK); // SOON
        init_pair(3, COLOR_RED, COLOR_BLACK);    // DEAD
        init_pair(4, COLOR_CYAN, COLOR_BLACK);   // HIGHLIGHT / SELECTED TAB
        init_pair(5, COLOR_WHITE, COLOR_BLACK);  // NORMAL TEXT / UNSELECTED TAB
    }

    int current_tab = 0; 
    int filtered[500], filtered_count = 0;
    update_filter(mvp_list, count, current_tab, filtered, &filtered_count);

    int offset = 0, selected = 0, ch;
    time_t last_mtime = get_file_mtime(savepath);
    
    while((ch = getch()) != 'q') {
        int max_display = LINES - 7; // ปรับพื้นที่แสดงผล
        int need_save = 0;

        time_t current_mtime = get_file_mtime(savepath);
        if (current_mtime > last_mtime) {
            last_mtime = current_mtime;
            char new_server[50];
            if (get_server_from_file(savepath, new_server) && strcmp(new_server, server) != 0) {
                strcpy(server, new_server);
                sprintf(filepath, "data/%s.json", server);
                count = load_mvps_from_file(filepath, mvp_list, 500);
            }
            sync_with_save_file(savepath, mvp_list, count);
            qsort(mvp_list, count, sizeof(MVP), compare_mvps);
            update_filter(mvp_list, count, current_tab, filtered, &filtered_count);
        }

        if (ch == KEY_LEFT || ch == KEY_RIGHT || ch == '\t') {
            current_tab = (ch == KEY_LEFT) ? (current_tab == 0 ? 2 : current_tab - 1) : (current_tab + 1) % 3;
            selected = 0; offset = 0;
            update_filter(mvp_list, count, current_tab, filtered, &filtered_count);
        } else if (ch == KEY_UP && selected > 0) selected--;
        else if (ch == KEY_DOWN && selected < filtered_count - 1) selected++;
        else if (ch == KEY_PPAGE) { selected = (selected-10 > 0) ? selected-10 : 0; }
        else if (ch == KEY_NPAGE) { selected = (selected+10 < filtered_count) ? selected+10 : filtered_count-1; }
        
        if (ch == 'k' && filtered_count > 0) { 
            int idx = filtered[selected];
            mvp_list[idx].zone = ZONE_ACTIVE;
            mvp_list[idx].death_time = time(NULL);
            need_save = 1;
        } else if ((ch == 'c' || ch == ' ') && filtered_count > 0) { 
            int idx = filtered[selected];
            mvp_list[idx].zone = ZONE_WAIT;
            mvp_list[idx].death_time = 0;
            need_save = 1;
        } else if (ch == 'r' && filtered_count > 0) { 
            int idx = filtered[selected];
            mvp_list[idx].zone = ZONE_UNSELECTED;
            mvp_list[idx].death_time = 0;
            need_save = 1;
        } else if (ch == '\n' && filtered_count > 0) { 
            int idx = filtered[selected];
            if (mvp_list[idx].zone == ZONE_UNSELECTED) mvp_list[idx].zone = ZONE_WAIT;
            else if (mvp_list[idx].zone == ZONE_WAIT) {
                mvp_list[idx].zone = ZONE_ACTIVE;
                mvp_list[idx].death_time = time(NULL);
            } else if (mvp_list[idx].zone == ZONE_ACTIVE) {
                mvp_list[idx].death_time = time(NULL);
            }
            need_save = 1;
        } else if ((ch == KEY_BACKSPACE || ch == 127 || ch == 8) && filtered_count > 0) { 
            int idx = filtered[selected];
            if (mvp_list[idx].zone == ZONE_ACTIVE) {
                mvp_list[idx].zone = ZONE_WAIT;
                mvp_list[idx].death_time = 0;
            } else if (mvp_list[idx].zone == ZONE_WAIT) {
                mvp_list[idx].zone = ZONE_UNSELECTED;
                mvp_list[idx].death_time = 0;
            }
            need_save = 1;
        }

        if (need_save) {
            MVP selected_mvps[500];
            int sel_count = 0;
            for(int i=0; i<count; i++) {
                if(mvp_list[i].zone != ZONE_UNSELECTED) selected_mvps[sel_count++] = mvp_list[i];
            }
            save_mvps_to_file(savepath, selected_mvps, sel_count);
            last_mtime = get_file_mtime(savepath);
            qsort(mvp_list, count, sizeof(MVP), compare_mvps);
            update_filter(mvp_list, count, current_tab, filtered, &filtered_count);
        }

        if (selected < offset) offset = selected;
        else if (selected >= offset + max_display) offset = selected - max_display + 1;

        erase();
        // --- 1. Top Header ---
        attron(COLOR_PAIR(4) | A_BOLD);
        mvprintw(0, 0, " [SERVER: %s] ", server);
        attroff(COLOR_PAIR(4) | A_BOLD);

        // --- 2. Tab Menu (Improved Contrast) ---
        char *tab_names[] = { " SEARCH/ALL ", " WAIT (Pinned) ", " ACTIVE (Dead) " };
        for(int i=0; i<3; i++) {
            int start_x = 3 + (i * 22);
            if(i == current_tab) {
                // Tab ที่เลือก: พื้นสีฟ้า ตัวหนังสือดำ (สว่างมาก)
                attron(COLOR_PAIR(4) | A_REVERSE | A_BOLD);
                mvprintw(1, start_x, "  %s  ", tab_names[i]);
                attroff(COLOR_PAIR(4) | A_REVERSE | A_BOLD);
            } else {
                // Tab ไม่เลือก: ตัวหนังสือขาว กรอบเทาๆ
                attron(COLOR_PAIR(5));
                mvprintw(1, start_x, "  %-15s  ", tab_names[i]);
                attroff(COLOR_PAIR(5));
            }
        }

        // --- 3. UI Separator ---
        mvprintw(2, 0, "==================================================================================");

        // --- 4. Table Header ---
        attron(A_BOLD | COLOR_PAIR(5));
        mvprintw(3, 2, "%-20s | %-15s | %-12s | %-30s", "Name", "Map", "Death Time", "Status/Respawn");
        attroff(A_BOLD | COLOR_PAIR(5));
        
        for(int i = 0; i < max_display && (i + offset) < filtered_count; i++) {
            int idx = filtered[i + offset];
            if (i + offset == selected) attron(A_REVERSE);
            
            MVP m = mvp_list[idx];
            mvprintw(i + 4, 2, "%-20.20s", m.name);
            mvprintw(i + 4, 23, "| %-15.15s", m.map_name);
            
            int death_x = 41;
            if (m.death_time == 0) {
                mvprintw(i + 4, death_x, "| %-12s ", "--:--:--");
            } else {
                struct tm *lt = localtime(&m.death_time);
                char dt_str[15];
                strftime(dt_str, sizeof(dt_str), "%d/%m %H:%M", lt); 
                mvprintw(i + 4, death_x, "| %-12s ", dt_str);
            }

            int status_x = 56;
            if (m.zone == ZONE_UNSELECTED) {
                mvprintw(i + 4, status_x, "| %-30s", "-");
            } else if (m.death_time == 0) {
                attron(COLOR_PAIR(1));
                mvprintw(i + 4, status_x, "| ALIVE %-23s", "");
                attroff(COLOR_PAIR(1));
            } else {
                long now = time(NULL);
                long t_min = m.death_time + m.respawn_time;
                long t_max = t_min + m.window;
                char sb[64];

                if (now < t_min) {
                    long rem = t_min - now;
                    attron(COLOR_PAIR(4));
                    snprintf(sb, sizeof(sb), "%02ld:%02ld:%02ld", rem/3600, (rem%3600)/60, rem%60);
                    mvprintw(i + 4, status_x, "| %-30s", sb);
                    attroff(COLOR_PAIR(4));
                } else if (now >= t_min && now < t_max) {
                    long win = t_max - now;
                    attron(COLOR_PAIR(2) | A_BOLD);
                    snprintf(sb, sizeof(sb), "Respawning %02ld:%02ld", win/60, win%60);
                    mvprintw(i + 4, status_x, "| %-30s", sb);
                    attroff(COLOR_PAIR(2) | A_BOLD);
                } else {
                    long ovr = now - t_max;
                    attron(COLOR_PAIR(3) | A_BOLD);
                    snprintf(sb, sizeof(sb), "Already Respawned %02ld:%02ld", ovr/60, ovr%60);
                    mvprintw(i + 4, status_x, "| %-30s", sb);
                    attroff(COLOR_PAIR(3) | A_BOLD);
                }
            }
            if (i + offset == selected) attroff(A_REVERSE);
        }
        
        // --- 5. Footer Line ---
        mvprintw(LINES - 2, 0, "----------------------------------------------------------------------------------");
        mvprintw(LINES - 1, 0, " [Enter]Next  [Bksp]Back  [k]Kill  [r]Remove  [q]Quit ");
        refresh();
    }
    endwin();
    return 0;
}