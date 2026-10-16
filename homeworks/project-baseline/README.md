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
the N16R8 overrides are in effect. Those overrides are not in this directory's `platformio.ini`:
the environment facts live in the shared fragment `shared/pio/base.ini`, which this project consumes
through its `extra_configs` key. The versions that fragment's platform pin resolves to are recorded
in [`shared/pio/VERSIONS.md`](../../shared/pio/VERSIONS.md).

`src/main.cpp` prints a boot line with the flash size, `psramFound()` and the PSRAM size, and drives
no GPIO. That is exactly what Phase 2's acceptance run needs to see over the monitor.

## Why exactly one environment

`pio run -d` with no `-e` builds **every** environment in the file. This source tree is
Arduino-only, so it cannot compile under `platform = native`; adding the native environment now
would break the one-command build. It arrives in Phase 5, where VERIFY-01 filters the build sources
per environment. The name it will take, `projectbaseline_native`, is already fixed by `envNames()`
in `tools/lib/discover.mjs`.

## The console: the UART bridge, pinned by glob

The repository's default console is the **UART bridge**, not the firmware's own native USB device.
The bridge port belongs to the bridge chip, so it survives reset, crash and deep sleep — exactly the
moments a log is read — and it always carries the ROM boot log on UART0. The native USB port is
created by the firmware itself and disappears at those same moments, and the CDC choice is compiled
into the binary, so a socket or setting mismatch produces a board that flashes successfully and
prints nothing.

The console is carried as a **device-name glob** — `/dev/cu.usbmodem*` — rather than a literal
node. The repository is public, so a literal path would be either a private machine detail or a
build-breaker on a machine where that path does not exist. The glob resolves at run time, and a
pattern that matches nothing fails loudly instead of silently falling back to another device.

The pattern was **settled by measurement** in plan 02-03 rather than taken from documentation. The
bridge on this board enumerates under `usbmodem`, not `usbserial`: the pattern first committed here
matched no node before or after the board was attached, and the upload stopped asking for an
`upload_port` instead of flashing an unidentified device. One residual is recorded rather than
papered over — the module's other USB socket enumerates under the same prefix, so this pattern
cannot separate the two when both sockets are cabled at once. Both reach the same chip, and a
monitor opened on the wrong one prints nothing, because the vehicle writes to UART0.

A project that needs a different console re-declares that one key inside its own `[env:<id>_s3]`
section. It does not fork or duplicate the shared fragment.
