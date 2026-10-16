---
phase: 02-board-and-environment-baseline-n16r8-acceptance-gate
plan: 01
subsystem: config
tags: [platformio, esp32-s3, n16r8, extra_configs, psram, qio_opi, version-pin]

requires:
  - phase: 01-repository-skeleton-and-project-layout
    provides: "The one-homework repository layout, the frozen homework-id grammar, envNames(), the project-baseline acceptance vehicle, and the sweep and workspace drift gates"
provides:
  - "shared/pio/base.ini — the single enforcement point for the exact platform pin and the four N16R8 module overrides"
  - "homeworks/project-baseline/platformio.ini converted to consume the fragment through extra_configs"
  - "A measured two-arm override contrast (6553600 bytes / qio_opi versus 3342336 bytes / qio_qspi) that makes ROADMAP criterion 1 falsifiable"
  - "Four recorded measurements of PlatformIO's extra_configs merge semantics, backing every claim the fragment's header comment makes"
affects: [02-02, 02-03, 03, 04, 05, 06]

tech-stack:
  added: []
  patterns:
    - "One shared [env] defaults fragment consumed via extra_configs; the project owns its [env:<id>_s3] header and re-declares a key only inside it"
    - "Evidence by verbatim reading with the exact command and exit status, or an explicitly unfilled slot"

key-files:
  created:
    - shared/pio/base.ini
  modified:
    - homeworks/project-baseline/platformio.ini

key-decisions:
  - "The fragment is a bare [env] global block, never [env:<name>], so it stays a shared defaults layer rather than naming every project's environment"
  - "The console ports live in the fragment as the narrow glob /dev/cu.usbserial-*, so a new project inherits its console and cannot forget it"
  - "The fragment's header comment carries the five measured obligations rather than leaving them to a diff, because two of the traps are silent"
  - "The negative control is built outside the repository and removed, so the measurement leaves no residue in the tracked tree"

patterns-established:
  - "Throwaway measurement fixture: a fixed path under the operating system's temporary directory, removed inside the task, its absence asserted"
  - "Machine-local detail (device nodes, absolute cache paths, temporary roots) is named by role in the record, never by literal"

requirements-completed: [HW-01, HW-04]

duration: pending
completed: pending
status: complete
---

# Phase 02 Plan 01: Board and Environment Baseline Summary

**The baseline's environment resolves entirely from `shared/pio/base.ini`, and the override set is proven load-bearing by a measured contrast — 6553600 bytes on `qio_opi` against 3342336 bytes on `qio_qspi` — with the fragment's four merge traps demonstrated in both directions.**

## Negative control: the override set is a library-selection decision

Same platform pin (`espressif32@7.1.3`) in both arms; the arms differ by the override set
and by nothing else. The control arm is a throwaway project outside the repository carrying
only the three stock keys. The overridden arm is the repository baseline, whose environment
now resolves through the shared fragment; its readings are re-read from the build task 1
produced rather than rebuilt.

Machine-local detail is named by role: the throwaway root is `${TMPDIR}/phase02-negative-control`
and the repository-relative paths are written as the repository sees them.

## Arm A — control: the stock board definition, no overrides

```
$ pio run -d "${TMPDIR}/phase02-negative-control"
EXIT=0
RAM:   [=         ]   5.5% (used 18032 bytes from 327680 bytes)
Flash: [=         ]   7.0% (used 233109 bytes from 3342336 bytes)
========================= [SUCCESS] Took 2.46 seconds =========================
```

Note the partition total: `3342336` bytes — the stock `esp32-s3-devkitc-1` definition's
8 MB flash with its default partition table. This is the *wrong* configuration for this
hardware, and it builds cleanly, which is exactly why the misconfiguration is invisible
without a reading.

The linked prebuilt IDF library set:

```
$ grep -o 'tools/sdk/esp32s3/[a-z_]*/' "${TMPDIR}/phase02-negative-control/.pio/build/negativecontrol_s3/firmware.map" | sort | uniq -c | sort -rn
EXIT=0
35356 tools/sdk/esp32s3/lib/
 5330 tools/sdk/esp32s3/qio_qspi/
 4586 tools/sdk/esp32s3/ld/
```

## Arm B — overridden: the repository baseline through the shared fragment

```
$ pio run -d homeworks/project-baseline
EXIT=0
RAM:   [=         ]   5.7% (used 18604 bytes from 327680 bytes)
Flash: [          ]   4.1% (used 268177 bytes from 6553600 bytes)
========================= [SUCCESS] Took 2.80 seconds =========================
```

Note the partition total: `6553600` bytes — `0x640000`, the 16 MB application partition the
module overrides select.

The linked prebuilt IDF library set:

```
$ grep -o 'tools/sdk/esp32s3/[a-z_]*/' homeworks/project-baseline/.pio/build/projectbaseline_s3/firmware.map | sort | uniq -c | sort -rn
EXIT=0
35585 tools/sdk/esp32s3/lib/
 5629 tools/sdk/esp32s3/qio_opi/
 4586 tools/sdk/esp32s3/ld/
```

## What the contrast establishes

The two arms resolve into **different prebuilt IDF library directories** — `qio_qspi` for the
stock board definition and `qio_opi` for the module-overridden environment — and report
**different application partition sizes**, `3342336` against `6553600`. The memory-type
override therefore decides which prebuilt core library set is linked: a wrong value is a
library-selection decision, not a stylistic difference, and it is this contrast — not the
positive reading alone — that gives ROADMAP criterion 1 its meaning.

## Fixture residue

The throwaway root `${TMPDIR}/phase02-negative-control` was removed inside the task and its
absence asserted; no build artifact, map file or copied directory from it exists anywhere
under the repository.
