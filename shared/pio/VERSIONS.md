# Resolved versions — the baseline environment

What this file is for: the exact package set the platform pin in `shared/pio/base.ini`
resolved to for the baseline environment (`[env:projectbaseline_s3]`). The pin and this
record are read together — the pin names the platform, this record names everything that
resolved with it — so a reader reproduces the environment from the two committed files
and nothing else.

Source: the package lister's non-verbose form, run against the baseline project and
trimmed to name and version. The verbose form appends the absolute package-cache path,
which is a machine-local detail and is deliberately not reproduced here.

| Package | Resolved version |
| --- | --- |
| Platform | `espressif32 @ 7.1.3` |
| Arduino framework | `framework-arduinoespressif32 @ 4.20017.260907+sha.dcc1105b` |
| ESP-IDF framework | `framework-espidf @ 4.60100.0` |
| Uploader | `tool-esptoolpy @ 2.41100.260830` |
| CMake | `tool-cmake @ 3.30.2` |
| ESP ROM ELFs | `tool-esp-rom-elfs @ 0.0.1+20241011` |
| FAT filesystem image tool | `tool-mkfatfs @ 2.0.1` |
| LittleFS image tool | `tool-mklittlefs @ 1.203.210628` |
| SPIFFS image tool | `tool-mkspiffs @ 2.230.0` |
| Ninja build tool | `tool-ninja @ 1.13.2` |
| Xtensa ULP toolchain | `toolchain-esp32ulp @ 1.23800.240113` |
| RISC-V toolchain | `toolchain-riscv32-esp @ 8.4.0+2021r2-patch5` |
| Xtensa esp-elf toolchain | `toolchain-xtensa-esp-elf @ 15.2.0+20251204` |
| Xtensa esp32s3 toolchain | `toolchain-xtensa-esp32s3 @ 8.4.0+2021r2-patch5` |

The `arduino` framework this repository builds with compiles against
`framework-arduinoespressif32` and `toolchain-xtensa-esp32s3`; the remaining packages
resolve because the `espressif32` platform declares them, and they are listed here
rather than filtered out so the record does not make that judgement on a reader's behalf.
