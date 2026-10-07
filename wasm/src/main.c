#include "lvgl.h"
#include "ui_from_json.h"
#include <emscripten.h>
#include <emscripten/html5.h>
#include <stdlib.h>

static lv_display_t *display;

static uint32_t tick_get_cb(void) {
    return (uint32_t)emscripten_get_now();
}

static void main_loop(void) {
    lv_timer_handler();
}

EMSCRIPTEN_KEEPALIVE
void load_ui_json(const char *json_str) {
    lv_obj_clean(lv_screen_active());
    ui_from_json(json_str);
}

/* The display size is fixed when the runtime starts (see main): the editor reloads the
   preview iframe with ?w=&h= when the canvas size changes. */
EMSCRIPTEN_KEEPALIVE
void set_screen_size(int w, int h) {
    (void)w; (void)h;
}

int main(int argc, char *argv[]) {
    lv_init();
    lv_tick_set_cb(tick_get_cb);

    /* Screen size comes from the command line: lvgl_wasm.html?w=800&h=480 (default 480x320). */
    int w = argc > 2 ? atoi(argv[1]) : 480;
    int h = argc > 2 ? atoi(argv[2]) : 320;
    if (w < 16 || w > 4096) w = 480;
    if (h < 16 || h > 4096) h = 320;
    display = lv_sdl_window_create(w, h);
    lv_sdl_mouse_create();

    emscripten_set_main_loop(main_loop, 0, 1);

    return 0;
}
