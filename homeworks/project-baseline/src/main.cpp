// Repository baseline — NOT a course homework. See ../README.md.
//
// D-14: a serial report and nothing else. It measures what the runtime reports
// and prints it, so it doubles as the on-hardware acceptance vehicle without
// committing a single unverified board fact.
//
// The baud rate must match `monitor_speed = 115200` in platformio.ini: the UART
// bridge defaults to 9600 and prints garbage at the wrong rate.
#include <Arduino.h>

void setup() {
  Serial.begin(115200);
  Serial.printf("baseline: flash=%u psram=%d psramSize=%u\n", static_cast<unsigned>(ESP.getFlashChipSize()),
                static_cast<int>(psramFound()), static_cast<unsigned>(ESP.getPsramSize()));
}

void loop() {}
