#include <ncurses.h>
#include <locale.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <sys/stat.h>
#include <ctype.h>
#include "mvp.h"

// --- ฟังก์ชันเสริม: ดึงเฉพาะตัวเลขออกจากข้อความ ---
void extract_digits(const char *src, char *dest) {
    while (*src) {
        if (isdigit(*src)) *dest++ = *src;
        src++;
    }
    *dest = '\0';
}

// --- ฟังก์ชันแก้ไขเวลา: เน้นกรอกวันเดือนชั่วโมงนาทีเพื่อความแม่นยำ ---
void edit_time(MVP *m) {
    timeout(-1);
    echo();
    curs_set(1);
    char buffer[64];
    char digits[64];
    
    time_t now = time(NULL);
    struct tm *now_tm = localtime(&now);
    
    move(LINES - 1, 0);
    clrtoeol();
    attron(COLOR_PAIR(4) | A_BOLD);
    mvprintw(LINES - 1, 0, "EDIT [%s]: ", m->name);
    attroff(COLOR_PAIR(4) | A_BOLD);
    
    attron(COLOR_PAIR(5));
    printw("Format: [DDMM HHMM] (Ex: 1804 0155) : ");
    attroff(COLOR_PAIR(5));
    
    if (getnstr(buffer, 63) == OK && strlen(buffer) > 0) {
        extract_digits(buffer, digits); 
        
        int d = 0, mon = 0, h = 0, min = 0;
        int len = strlen(digits);
        int valid = 0;

        if (len == 8) {
            sscanf(digits, "%2d%2d%2d%2d", &d, &mon, &h, &min);
            valid = 1;
        }
        else if (len == 7) {
            sscanf(digits, "%1d%2d%2d%2d", &d, &mon, &h, &min);
            valid = 1;
        }
        else if (len == 4 || len == 3) {
            d = now_tm->tm_mday;
            mon = now_tm->tm_mon + 1;
            if (len == 4) sscanf(digits, "%2d%2d", &h, &min);
            else sscanf(digits, "%1d%2d", &h, &min);
            valid = 1;
        }

        if (valid && d >= 1 && d <= 31 && mon >= 1 && mon <= 12) {
            struct tm tm_val = {0};
            tm_val.tm_year = now_tm->tm_year;
            tm_val.tm_mday = d;
            tm_val.tm_mon = mon - 1;
            tm_val.tm_hour = h;
            tm_val.tm_min = min;
            tm_val.tm_isdst = -1; 

            time_t new_t = mktime(&tm_val);
            if (new_t != -1) {
                m->death_time = new_t;
                m->zone = ZONE_ACTIVE; 
            }
        }
    }
    
    noecho();
    curs_set(0);
    timeout(500);
}

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
                list[j].x = updates[i].x;
                list[j].y = updates[i].y;
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
    char server[50] = "thROG";
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

    initscr(); cbreak(); noecho(); curs_set(0); keypad(stdscr, TRUE); 
    timeout(500);

    if (has_colors()) {
        start_color();
        init_pair(1, COLOR_GREEN, COLOR_BLACK); 
        init_pair(2, COLOR_YELLOW, COLOR_BLACK);
        init_pair(3, COLOR_RED, COLOR_BLACK);   
        init_pair(4, COLOR_CYAN, COLOR_BLACK);  
        init_pair(5, COLOR_WHITE, COLOR_BLACK); 
    }

    int current_tab = 0; 
    int filtered[500], filtered_count = 0;
    update_filter(mvp_list, count, current_tab, filtered, &filtered_count);

    int offset = 0, selected = 0, ch;
    time_t last_mtime = get_file_mtime(savepath);
    
    while((ch = getch()) != 'q') {
        int max_display = LINES - 7;
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
        else if (ch == KEY_HOME) { selected = 0; offset = 0; }
        else if (ch == KEY_END) { selected = (filtered_count > 0) ? filtered_count - 1 : 0; }
        
        if (ch == 'e' && filtered_count > 0) { 
            int idx = filtered[selected];
            if (mvp_list[idx].zone != ZONE_UNSELECTED) {
                edit_time(&mvp_list[idx]);
                need_save = 1;
            }
        } else if (ch == 'm' && filtered_count > 0) {
            int idx = filtered[selected];
            if (mvp_list[idx].x >= 0 && mvp_list[idx].y >= 0) {
                int map_h = 15;
                int map_w = 30;
                int start_y = (LINES - map_h) / 2;
                int start_x = (COLS - map_w) / 2;
                WINDOW *map_win = newwin(map_h, map_w, start_y, start_x);
                box(map_win, 0, 0);
                mvwprintw(map_win, 0, 2, " Map: %s ", mvp_list[idx].map_name);
                
                // วาดจุด . เป็นพื้นหลัง
                for (int py = 1; py < map_h - 1; py++) {
                    for (int px = 1; px < map_w - 1; px++) {
                        mvwaddch(map_win, py, px, '.');
                    }
                }

                // คำนวณจุดปักหมุด (สมมติแมพพื้นฐานคือ 256x256)
                // พิกัด x, y จาก Web App
                int plot_x = 1 + (int)((mvp_list[idx].x / 256.0) * (map_w - 3));
                int plot_y = 1 + (int)((mvp_list[idx].y / 256.0) * (map_h - 3));
                
                // ตรวจสอบขอบเขต
                if (plot_x < 1) plot_x = 1; if (plot_x > map_w - 2) plot_x = map_w - 2;
                if (plot_y < 1) plot_y = 1; if (plot_y > map_h - 2) plot_y = map_h - 2;

                wattron(map_win, COLOR_PAIR(3) | A_BOLD | A_BLINK);
                mvwaddch(map_win, plot_y, plot_x, 'X');
                wattroff(map_win, COLOR_PAIR(3) | A_BOLD | A_BLINK);
                
                mvwprintw(map_win, map_h - 1, 2, " [X]: %.0f,%.0f ", mvp_list[idx].x, mvp_list[idx].y);
                wrefresh(map_win);
                
                timeout(-1);
                wgetch(map_win); // รอการกดปุ่มเพื่อปิด
                delwin(map_win);
                timeout(500);
            }
        } else if (ch == 'k' && filtered_count > 0) { 
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
            int saved_id = mvp_list[filtered[selected]].id;
            MVP selected_mvps[500];
            int sel_count = 0;
            for(int i=0; i<count; i++) {
                if(mvp_list[i].zone != ZONE_UNSELECTED) selected_mvps[sel_count++] = mvp_list[i];
            }
            save_mvps_to_file(savepath, selected_mvps, sel_count);
            last_mtime = get_file_mtime(savepath);
            qsort(mvp_list, count, sizeof(MVP), compare_mvps);
            update_filter(mvp_list, count, current_tab, filtered, &filtered_count);
            for (int i = 0; i < filtered_count; i++) {
                if (mvp_list[filtered[i]].id == saved_id) {
                    selected = i;
                    break;
                }
            }
        }

        if (selected < offset) offset = selected;
        else if (selected >= offset + max_display) offset = selected - max_display + 1;

        erase();
        attron(COLOR_PAIR(4) | A_BOLD);
        mvprintw(0, 0, " [SERVER: %s] ", server);
        attroff(COLOR_PAIR(4) | A_BOLD);

        char *tab_names[] = { " SEARCH/ALL ", " WAIT (Pinned) ", " ACTIVE (Dead) " };
        for(int i=0; i<3; i++) {
            int start_x = 3 + (i * 22);
            if(i == current_tab) {
                attron(COLOR_PAIR(4) | A_REVERSE | A_BOLD);
                mvprintw(1, start_x, "  %s  ", tab_names[i]);
                attroff(COLOR_PAIR(4) | A_REVERSE | A_BOLD);
            } else {
                attron(COLOR_PAIR(5));
                mvprintw(1, start_x, "  %-15s  ", tab_names[i]);
                attroff(COLOR_PAIR(5));
            }
        }

        mvprintw(2, 0, "==================================================================================");
        attron(A_BOLD);
        mvprintw(3, 2, "%-20s | %-15s | %-12s | %-30s", "Name", "Map", "Death Time", "Status/Respawn");
        attroff(A_BOLD);
        
        for(int i = 0; i < max_display && (i + offset) < filtered_count; i++) {
            int idx = filtered[i + offset];
            if (i + offset == selected) attron(A_REVERSE);
            MVP m = mvp_list[idx];
            mvprintw(i + 4, 2, "%-20.20s", m.name);
            mvprintw(i + 4, 23, "| %-15.15s", m.map_name);
            int death_x = 41;
            if (m.death_time == 0) {
                mvprintw(i + 4, death_x, "| --:--:--     ");
            } else {
                struct tm *lt = localtime(&m.death_time);
                char dt_str[15];
                strftime(dt_str, sizeof(dt_str), "%d/%m %H:%M", lt); 
                mvprintw(i + 4, death_x, "| %-12s ", dt_str);
            }
            int status_x = 56;
            int max_w = COLS - status_x - 2; 
            if (m.zone == ZONE_UNSELECTED) {
                mvprintw(i + 4, status_x, "| -");
            } else if (m.death_time == 0) {
                attron(COLOR_PAIR(1));
                mvprintw(i + 4, status_x, "| ALIVE");
                attroff(COLOR_PAIR(1));
            } else {
                long now_sec = time(NULL);
                long t_min = m.death_time + m.respawn_time;
                long t_max = t_min + m.window;
                char sb[64];
                if (now_sec < t_min) {
                    long rem = t_min - now_sec;
                    attron(COLOR_PAIR(4));
                    // แยก ชั่วโมง:นาที:วินาที สำหรับส่วนนับถอยหลัง
                    snprintf(sb, sizeof(sb), "%02ld:%02ld:%02ld", rem/3600, (rem%3600)/60, rem%60);
                    mvprintw(i + 4, status_x, "| %.*s", max_w, sb);
                    attroff(COLOR_PAIR(4));
                } else if (now_sec >= t_min && now_sec < t_max) {
                    long win = t_max - now_sec;
                    attron(COLOR_PAIR(2) | A_BOLD);
                    // สำหรับช่วง Window เกิด (สุ่ม) แสดงแค่นาทีวินาทีก็พอ หรือจะใส่ชั่วโมงด้วยก็ได้ครับ
                    snprintf(sb, sizeof(sb), "Respawning %02ld:%02ld", win/60, win%60);
                    mvprintw(i + 4, status_x, "| %.*s", max_w, sb);
                    attroff(COLOR_PAIR(2) | A_BOLD);
                } else {
                    long ovr = now_sec - t_max;
                    attron(COLOR_PAIR(3) | A_BOLD);
                    // แก้ไขจุดนี้: แยก ชั่วโมง:นาที:วินาที สำหรับส่วนที่เลยเวลาเกิดมาแล้ว
                    snprintf(sb, sizeof(sb), "Already Respawned %02ld:%02ld:%02ld", ovr/3600, (ovr%3600)/60, ovr%60);
                    mvprintw(i + 4, status_x, "| %.*s", max_w, sb);
                    attroff(COLOR_PAIR(3) | A_BOLD);
                }
            }
            if (i + offset == selected) attroff(A_REVERSE);
        }
        mvprintw(LINES - 2, 0, "----------------------------------------------------------------------------------");
        mvprintw(LINES - 1, 0, " [Enter]Next [Bksp]Back [k]Kill [e]Edit [m]Map [r]Remove [Home/End] [q]Quit ");
        refresh();
    }
    endwin();
    return 0;
}