CC = gcc
CFLAGS = -Wall
LIBS = -lncursesw -lm
SRC = src/main.c src/mvp.c src/cJSON.c
OBJ = $(SRC:.c=.o)

mvp_tui: $(OBJ)
	$(CC) -o $@ $^ $(LIBS)

clean:
	rm -f src/*.o mvp_tui
