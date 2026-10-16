---
created: 2026-10-16T22:41:43.864Z
title: Parameterize board assumptions beyond the N16R8 module
area: general
severity: major
files:
  - shared/pio/base.ini
  - shared/pio/VERSIONS.md
  - homeworks/project-baseline/platformio.ini
  - .planning/PROJECT.md:52
  - .planning/PROJECT.md:72
  - .planning/REQUIREMENTS.md
---

## Problem

Every board fact in this repository is hard-coded to ONE physical board: the
ESP32-S3-DevKitC-1 carrying an ESP32-S3-WROOM-1 **N16R8** module. That was deliberate and
is what made Phase 2's acceptance run measurable — but the owner flagged the assumption
explicitly: **other boards may appear, not only the one currently described.**

Where the single-board assumption actually lives:

- **`shared/pio/base.ini`** — one global `[env]` fragment carrying both the exact platform
  pin and the four N16R8 module overrides (`board_upload.flash_size = 16MB`,
  `board_build.partitions = default_16MB.csv`, `board_build.arduino.memory_type = qio_opi`,
  `-DBOARD_HAS_PSRAM`), plus the console glob `/dev/cu.usbmodem*`. Because it is a *global
  defaults layer* merged into every `[env:<name>]` of every consuming project, exactly one
  board configuration can exist per repository — not by PlatformIO's design, but by the
  fragment's scope.
- **`.planning/PROJECT.md`** — the Board paragraph, the Board constraint ("N16R8 module —
  16 MB flash and 8 MB octal PSRAM, so board definitions must be overridden and
  GPIO35/36/37 are unavailable"), and the Key Decision "Override the board definition per
  environment for the N16R8 module" all state the N16R8 as the only hardware there is.
- **`.planning/PROJECT.md` → Traps for Later Phases** — the CH343 bridge identity
  (`1A86:55D3`), the fact that `/dev/cu.usbmodem*` cannot separate the two USB sockets, and
  the COM socket's USB-C orientation are written as facts about *this repository's board*
  rather than about *a board*.
- **Phase 4, `HW-02`** — `shared/hardware/` is about to hold "the pin database, the
  constraint list, the module marking (N16R8), the board revision (RGB LED on GPIO48) and
  the console port". If it is built as a single-board database, a second board forces a
  redesign rather than a second entry.

**Why this is worth capturing now rather than later:** the decision is cheap while
`shared/hardware/` is still empty and expensive once homeworks consume it. `HW-02` is
planned for Phase 4, which has not been planned yet — this todo lands before that plan is
written, which is the only moment the input is free.

## Solution

TBD — the shape of the choice, to be made inside Phase 4 rather than retrofitted:

- **The build layer and the facts layer are separable, and only the former is constrained.**
  One board configuration per repository is a property of `base.ini` being a global defaults
  layer, not of PlatformIO. A second board could mean a second fragment chosen per project
  via its own `extra_configs` line, with the project naming which board it targets.
- **`shared/hardware/` is the natural home for a parameterized board profile** — pin
  database, constraint list and console port keyed by a board identifier, with a project
  declaring which identifier it builds for, and the pin check reading that identifier
  instead of a single hard-coded constraint list.
- **The Phase 2 measurements stay valid; their status changes.** The override contrast
  (6553600 bytes / `qio_opi` versus 3342336 / `qio_qspi`), the CH343 identity and the
  `usbmodem` ambiguity are facts about *a* board. What changes is that they become entries
  under an identifier rather than the repository's only truth.
- **Not urgent.** Nothing is broken while one board is in use, and
  `homeworks/project-baseline/` is the only consumer today. The trigger to act is a second
  board being acquired, or the course requiring one.

Related: `REQUIREMENTS.md` HW-02 and HW-03 (Phase 4, the pin database and the pin-validation
check) are the requirements this decision reshapes.
