/*
 * emb_hal.h — the hardware seam.
 *
 * What this file is for: it is the only place a framework-free module may look
 * to reach the console and the clock. Everything above it (emb_log, and every
 * consumer of it) is pure C that names no framework header, so the same logic
 * compiles on the host and survives the Arduino-to-ESP-IDF change: the IDF era
 * adds a second backend directory and nothing above this line moves.
 *
 * Why the shape is what it is. This header declares a C ABI and no storage, so
 * the library ships `include/` and deliberately no `src/` — an interface has no
 * translation unit. It names no pin, no UART number and no bridge identity: the
 * backend owns every one of those, which is what keeps the seam board-neutral
 * and keeps this phase's board facts with the phase that owns them.
 *
 * The two C++ guard blocks below are mandatory, not decorative. The consumer is
 * a C++ shim (the framework declares its entry points without a C-linkage
 * guard), so without them the shim would link against mangled names and the
 * linker would name the symbol rather than the missing guard.
 */
#ifndef EMB_HAL_H
#define EMB_HAL_H

#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/*
 * False before emb_hal_init() has run, and false afterwards if the console
 * never came up. It is a distinct state on purpose: the caller decides what to
 * do about a sink that is not ready, and cannot do that if the write simply
 * disappears.
 */
bool emb_hal_console_ready(void);

/* Bring up the console. Safe to call once per program. */
void emb_hal_init(void);

/*
 * Write one line of text. This function terminates the line itself, so the
 * caller passes text without a trailing newline. A write against a console that
 * is not ready is dropped — ask emb_hal_console_ready() first if the caller
 * needs to know.
 */
void emb_hal_write_line(const char *line);

/* Milliseconds since the program started. */
unsigned long emb_hal_millis(void);

#ifdef __cplusplus
}
#endif

#endif /* EMB_HAL_H */
