// Repository baseline — NOT a course homework. See ../README.md.
//
// D-14: a serial report and nothing else. It measures what the runtime reports
// and prints it, so it doubles as the on-hardware acceptance vehicle without
// committing a single unverified board fact.
//
// Everything below this shim is C. The report is handed to emb_log, which writes
// it through the emb_hal seam; the shim itself exists only because the framework
// requires it. cores/esp32/Arduino.h declares setup() and loop() without an
// extern "C" guard, so a .c definition would emit an unmangled name the core
// never looks for — the entry points must keep C++ linkage.
//
// The baud rate is no longer opened here: emb_hal_arduino opens UART0 at 115200,
// which is the rate `monitor_speed = 115200` in platformio.ini expects. The UART
// bridge defaults to 9600 and prints garbage at the wrong rate.
#include <Arduino.h>

#include <stdio.h>

#include "emb_log.h"

void setup() {
  char report[EMB_LOG_LINE_MAX];

  emb_log_init();

  snprintf(report, sizeof report, "baseline: flash=%u psram=%d psramSize=%u",
           static_cast<unsigned>(ESP.getFlashChipSize()), static_cast<int>(psramFound()),
           static_cast<unsigned>(ESP.getPsramSize()));

  emb_log_line(report);
}

void loop() {}
