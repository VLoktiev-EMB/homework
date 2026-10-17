/*
 * emb_log.h — one tagged, bounded line, written through the hardware seam.
 *
 * What this file is for: it is the reusable logging facility every homework can
 * link. It is pure C and names no framework header — it writes through emb_hal
 * and through nothing else — which is what makes it compile and run on the host
 * in a plain compiler invocation, with no board and no build system present.
 *
 * Why the shape is what it is. The module owns its own tag, and the tag literal
 * lives in the source rather than here, so that changing it recompiles exactly
 * one translation unit instead of every consumer. The write contract is stated
 * here because a caller cannot infer it: a written line begins with the module's
 * own tag, then a colon and a space, then the caller's text — and carries no
 * trailing newline, because the seam terminates the line.
 *
 * Both C++ guards are mandatory for the same reason as in emb_hal.h: the
 * consumer is a C++ shim, and without them it would link against a mangled name.
 */
#ifndef EMB_LOG_H
#define EMB_LOG_H

#include <stdbool.h>

/*
 * The longest line this module will assemble, including its own tag. A caller
 * that must format into a buffer should size it with this constant, as the
 * baseline's shim does.
 */
#define EMB_LOG_LINE_MAX 96

#ifdef __cplusplus
extern "C" {
#endif

/* Bring up the sink. Safe to call once per program. */
void emb_log_init(void);

/* Whether the sink is up. False before emb_log_init(), and after it if the
 * console never came up. */
bool emb_log_ready(void);

/*
 * Write one tagged line: "<tag>: <text>". Returns false and writes nothing when
 * the text does not fit, or when the sink is not ready — the module never
 * buffers a line and never puts a diagnostic on a channel known not to carry
 * it. The caller decides what to do with the dropped line.
 */
bool emb_log_line(const char *text);

#ifdef __cplusplus
}
#endif

#endif /* EMB_LOG_H */
