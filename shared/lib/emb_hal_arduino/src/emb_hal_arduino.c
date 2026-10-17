/*
 * emb_hal_arduino.c — the Arduino-era backend behind the hardware seam.
 *
 * This is the ONLY translation unit in the shared tree that is allowed to see
 * a framework header, and that is a structural fact rather than a convention:
 * this directory deliberately carries `src/` and no `include/`, so it cannot
 * leak a public header even by accident. The seam rule it satisfies, and the
 * named exemption list that enforces it, live in `../README.md`.
 *
 * Why the console is reached through uartBegin() and not through the framework
 * object. `Serial` is a C++ object: pulling in the framework header `Arduino.h`
 * parses cleanly as C, but `Serial.println(...)` then fails with "'Serial'
 * undeclared" — an error that names a symbol and hides its cause. The core is a
 * C layer under a thin
 * C++ wrapper, and the whole seam is therefore reachable from C through
 * esp32-hal-uart.h and esp32-hal.h, whose declarations sit inside `extern "C"`.
 * One consequence is deliberate: the framework's serial-number macro lives in
 * the C++ header this file must not include, so the UART number is passed as
 * the literal 0 (UART0 — the port the UART bridge exposes) instead.
 *
 * The console may never come up — the repository's console failure mode is a
 * board that flashes successfully and prints nothing. So a write against a sink
 * that is not ready is DROPPED here, and emb_hal_console_ready() is the state a
 * caller asks about before deciding what to report.
 */
#include <string.h>

#include <esp32-hal-uart.h> /* uartBegin / uartWrite / uartWriteBuf */
#include <esp32-hal.h>      /* millis() */

#include "emb_hal.h"

/* UART0, the port the UART bridge exposes; the baud rate must match
 * `monitor_speed = 115200` in the consumer's platformio.ini. */
#define EMB_HAL_ARDUINO_UART_NR 0
#define EMB_HAL_ARDUINO_BAUD 115200

/* The handle is the readiness state: null until init succeeds. */
static uart_t *s_uart;

bool emb_hal_console_ready(void) { return s_uart != 0; }

void emb_hal_init(void) {
  s_uart = uartBegin(EMB_HAL_ARDUINO_UART_NR, EMB_HAL_ARDUINO_BAUD, 0x800001c, -1, -1, 256, 256, false, 112);
}

void emb_hal_write_line(const char *line) {
  if (s_uart == 0) {
    return; /* not ready — dropped, never buffered, never substituted */
  }
  uartWriteBuf(s_uart, (const uint8_t *)line, strlen(line));
  uartWrite(s_uart, (uint8_t)'\n');
}

unsigned long emb_hal_millis(void) { return millis(); }
