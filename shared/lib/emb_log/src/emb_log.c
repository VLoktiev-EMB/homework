/*
 * emb_log.c — the pure logic: bounded line assembly around a module-owned tag.
 *
 * What this file is for: it turns a caller's text into one tagged line and hands
 * it to the seam. It includes its own header and the seam header and nothing
 * else, so no framework name is reachable from here — not by include, and not
 * by a transitive one. That is the property that makes this file host-testable
 * and framework-portable, and it is the property the repo's seam check guards.
 *
 * Why the tag lives here and not in the header. The header is what every
 * consumer re-reads on every build; a literal in the source is a prerequisite of
 * exactly one object file. Changing the tag therefore recompiles one translation
 * unit, which is the mechanism ROADMAP criterion 2 is measured against.
 *
 * The not-ready-sink decision, recorded rather than rediscovered (D-06, ASVS
 * V7). A write against a sink that is not ready is DROPPED and reported as
 * false. It is never buffered: buffering would hide the failure until some
 * later flush, and a failure that surfaces away from its cause is the failure
 * this repository keeps re-learning. It is never replaced with a diagnostic
 * either: a diagnostic would put text on a channel that is known not to carry
 * text. emb_log_ready() is how a caller distinguishes the two cases, and the
 * consumer's shim is what decides what, if anything, to print instead.
 *
 * The line is assembled by hand rather than with snprintf() because this file
 * carries no header but its own and the seam's — the copy is bounded at every
 * step and cannot overrun the stack buffer.
 */
#include "emb_log.h"
#include "emb_hal.h"

/* The module tag. Owned here so an edit recompiles one translation unit. */
static const char EMB_LOG_TAG[] = "emb-log";
static const char EMB_LOG_SEP[] = ": ";

/* Append `s` to `buf`, which already holds `*used` bytes, refusing to exceed the
 * buffer. Returns false when the text would not fit. */
static bool emb_log_append(char *buf, unsigned *used, const char *s) {
  for (; *s != '\0'; ++s) {
    if (*used + 1u >= EMB_LOG_LINE_MAX) {
      return false;
    }
    buf[(*used)++] = *s;
  }
  return true;
}

void emb_log_init(void) { emb_hal_init(); }

bool emb_log_ready(void) { return emb_hal_console_ready(); }

bool emb_log_line(const char *text) {
  char buf[EMB_LOG_LINE_MAX];
  unsigned used = 0;

  if (!emb_hal_console_ready()) {
    return false; /* dropped — never buffered, never substituted */
  }

  if (!emb_log_append(buf, &used, EMB_LOG_TAG) || !emb_log_append(buf, &used, EMB_LOG_SEP) ||
      !emb_log_append(buf, &used, text)) {
    return false; /* the line does not fit — nothing is written */
  }

  buf[used] = '\0';
  emb_hal_write_line(buf);
  return true;
}
