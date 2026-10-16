# project-baseline — NOT a course homework

This directory is the repository's **baseline**, not an assignment. It exists so the one-command
build from the repository root is provable from a clone, and it is Phase 2's on-hardware acceptance
vehicle. It is deliberately minimal, and it is **not** the instructor-facing README contract
(DELIV-01, Phase 8).

Retire this directory before the Phase 8 README index lists it, or it reads as an unfinished
assignment.

## Build

From the repository root:

    pio run -d homeworks/project-baseline

The build reports a `6553600`-byte application partition — the 16 MB table, which is the proof that
the four N16R8 overrides in `platformio.ini` are in effect.

`src/main.cpp` prints a boot line with the flash size, `psramFound()` and the PSRAM size, and drives
no GPIO. That is exactly what Phase 2's acceptance run needs to see over the monitor.

## Why exactly one environment

`pio run -d` with no `-e` builds **every** environment in the file. This source tree is
Arduino-only, so it cannot compile under `platform = native`; adding the native environment now
would break the one-command build. It arrives in Phase 5, where VERIFY-01 filters the build sources
per environment. The name it will take, `projectbaseline_native`, is already fixed by `envNames()`
in `tools/lib/discover.mjs`.

## Why no console port is pinned

The repository is public and no usable port is verified on this machine — `pio device list` shows
only the debug console and a Bluetooth port. A committed port would be either a private machine
detail or a build-breaker on another machine, so Phase 2 settles the port and console choice after
the acceptance run.
