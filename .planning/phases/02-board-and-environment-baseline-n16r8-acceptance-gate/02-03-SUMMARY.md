---
phase: 02-board-and-environment-baseline-n16r8-acceptance-gate
plan: 03
subsystem: infra
tags: [platformio, esp32-s3, n16r8, esptool, ch343, console-port, acceptance-run, phase-log]

requires:
  - phase: 02-board-and-environment-baseline-n16r8-acceptance-gate
    provides: the shared N16R8 fragment and its measured override contrast (02-01); the resolved version record and the pure-filesystem regression gate (02-02)
  - phase: 01-repository-skeleton-and-project-layout
    provides: the baseline project as the acceptance vehicle, and the phase-log conventions this file inherits

provides:
  - the dated acceptance run's three verbatim readings, the device-inventory diff that settles the console, and a per-criterion met-or-unmet statement
  - the console port glob corrected from `/dev/cu.usbserial-*` to the measured `/dev/cu.usbmodem*`

affects: [phase-03, phase-04, phase-05, phase-06, phase-07, phase-08]

actuals:
  tokens: 24000
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns: [the phase log as the phase's evidence home; evidence classified by kind, not by strength]

key-files:
  created:
    - .planning/phases/02-board-and-environment-baseline-n16r8-acceptance-gate/02-03-SUMMARY.md
  modified:
    - shared/pio/base.ini
    - homeworks/project-baseline/README.md

key-decisions:
  - "The console port pattern was corrected from /dev/cu.usbserial-* to /dev/cu.usbmodem* on the strength of a device-inventory diff, not on documentation"
  - "The bridge on this board is a CH343 (1A86:55D3), not the CP2102N the research and AGENTS.md name"
  - "Criterion 5's console half is settled by measurement; the RGB-LED pin is settled by owner confirmation and is explicitly not described as a measurement"

patterns-established:
  - "A port pattern is settled by a before-and-after device inventory, never by a chip name in a document"
  - "An observation the run cannot make stays a visibly unfilled slot with its command beside it; a plausible value never enters the log"

requirements-completed: [HW-01, HW-04]

coverage:
  - id: D1
    description: "The console-port choice, settled by a before-and-after serial device inventory on this board and carried as a corrected glob pattern"
    requirement: "HW-04"
    verification:
      - kind: manual_procedural
        ref: "pio device list --json-output (before/after); pio run -d homeworks/project-baseline -t upload => Auto-detected: /dev/cu.usbmodem5CBC0287411"
        status: pass
    human_judgment: false
  - id: D2
    description: "The dated on-hardware acceptance run: build, flash, monitor, with the eFuse banner, the flash die and the firmware's own report recorded verbatim"
    requirement: "HW-01"
    verification:
      - kind: manual_procedural
        ref: "pio run -t upload; esptool.py --chip esp32s3 -p <port> flash_id; serial read => baseline: flash=16777216 psram=1 psramSize=8386279"
        status: pass
    human_judgment: false
  - id: D3
    description: "The RGB-LED pin fact, carried as an owner-confirmed board fact and not re-established by observation in this phase"
    verification: []
    human_judgment: true
    rationale: "The pin was stated by the owner and deliberately not probed — no LED probe, no scratch sketch, no source change. Whether GPIO48 is correct on this board revision cannot be established by any command this phase ran; it is confirmed only when a later homework drives the pin and the LED lights."

duration: 47 min
completed: 2026-10-16
status: complete
---

# Phase 2 Plan 3: The Dated On-Hardware Acceptance Run, the Console Measurement, and the Phase Log

**The N16R8 accepted a flashed firmware whose own report and the flasher's eFuse readings agree on 16 MB flash and 8 MB PSRAM, and the console pattern was corrected from the documented `usbserial` form to the measured `usbmodem` form — so Phase 2's five criteria close met except for the pin fact, which is owner-confirmed rather than observed.**

## Performance

- **Duration:** 47 min
- **Started:** 2026-10-16T23:26:00Z (board first enumerated)
- **Completed:** 2026-10-16T23:59:00Z
- **Tasks:** 2
- **Files modified:** 3 (2 corrected, 1 created)

## Task Commits

1. **Task 1: Identify the port by measurement, then run the dated acceptance sequence** — `3bb3f87` (fix)
2. **Task 2: Write the phase log, and report criteria 2 and 5 honestly** — this file

## The dated acceptance run

**Date:** 2026-10-16. **Environment:** `projectbaseline_s3` at `homeworks/project-baseline`, platform `espressif32@7.1.3`, framework arduino 2.0.17.

### Reading 1 — the serial device inventory, before and after

Inventory taken in the machine-readable form, with the board detached and again with it attached.

```bash
pio device list --json-output
```

**Before the board was attached** — two nodes, neither a USB serial bridge:

```json
[
 { "port": "/dev/cu.debug-console",          "description": "n/a", "hwid": "n/a" },
 { "port": "/dev/cu.Bluetooth-Incoming-Port","description": "n/a", "hwid": "n/a" }
]
```

**After the board was attached** — exactly one new node:

```json
{ "port": "/dev/cu.usbmodem5CBC0287411",
  "description": "USB Single Serial",
  "hwid": "USB VID:PID=1A86:55D3 SER=5CBC028741 LOCATION=0-1" }
```

The diff is a single node. The socket used is the one labelled **COM** on the board — the UART bridge socket, not the one labelled USB. `VID:PID=1A86:55D3` is a **CH343** (QinHeng/WCH) USB-to-UART bridge. It is **not** the CP2102N that `02-RESEARCH.md` Pitfall 8, `AGENTS.md` and `D-03`/`D-04`'s rationale all name; the assumption is falsified by this reading.

### Reading 2 — the committed pattern does not match, loudly

```bash
pio run -d homeworks/project-baseline -t upload
```

Exit status **1**. Output, verbatim:

```
Looking for upload port...
Error: Please specify `upload_port` for environment or use global `--upload-port` option.
For some development platforms it can be a USB flash drive (i.e. /media/<user>/<device name>)
*** [upload] Explicit exit, status 1
========================== [FAILED] Took 0.53 seconds ==========================
```

The previously committed `/dev/cu.usbserial-*` matched no node in either inventory. The failure is the loud half of Pitfall 5's measured pair: PlatformIO refused to flash an unidentified port rather than silently selecting another device.

### Reading 3 — the console classification, settled by measurement

- **Socket used:** the board's UART bridge socket, labelled **COM**.
- **Node that appeared:** `/dev/cu.usbmodem5CBC0287411`.
- **Did the committed pattern `/dev/cu.usbserial-*` match it?** No. It matched **nothing**, before or after.
- **Did the corrected pattern match anything else in the inventory?** No — `/dev/cu.usbmodem*` matched exactly one node, this board's bridge.

Corrected in `shared/pio/base.ini` and mirrored into `homeworks/project-baseline/README.md`, committed as `3bb3f87`. The build, the configuration reading and the full test suite were re-run green afterwards. The corrected form is still a pattern; no literal node and no serial number was committed anywhere.

### Reading 4 — the upload output, including the connect banner

```bash
pio run -d homeworks/project-baseline -t upload
```

Exit status **0**. Verbatim, from the upload:

```
Looking for upload port...
Auto-detected: /dev/cu.usbmodem5CBC0287411
Uploading .pio/build/projectbaseline_s3/firmware.bin
esptool.py v4.11.0
Serial port /dev/cu.usbmodem5CBC0287411
Connecting....
Chip is ESP32-S3 (QFN56) (revision v0.2)
Features: WiFi, BLE, Embedded PSRAM 8MB (AP_3v3)
Crystal is 40MHz
MAC: ac:27:6e:aa:81:4c
Uploading stub...
Running stub...
Stub running...
Changing baud rate to 460800
Changed.
Configuring flash size...
...
Hash of data verified.
```

Two things are absent and are recorded as absent rather than inferred:

- **No flash-size entry.** Expected, not a failure: the S3's eFuse flash field encodes **in-package** flash only, and this module's flash die is external. This is Pitfall 4, and the reason the flash reading is taken separately below.
- **No `USB mode:` line**, although the research notes the banner prints one when the eFuse reports it. `grep -c "USB mode"` over the full upload output returned `0`. A direct `esptool.py flash_id` run on the same port did print `USB mode: USB-Serial/JTAG`; the upload path's esptool invocation did not. Recorded as observed, not explained.

### Reading 5 — the flash die

```bash
esptool.py --chip esp32s3 -p /dev/cu.usbmodem5CBC0287411 flash_id
```

Exit status **0**. Verbatim:

```
Chip is ESP32-S3 (QFN56) (revision v0.2)
Features: WiFi, BLE, Embedded PSRAM 8MB (AP_3v3)
Crystal is 40MHz
MAC: ac:27:6e:aa:81:4c
Uploading stub...
Running stub...
Stub running...
Manufacturer: c2
Device: 2018
Detected flash size: 16MB
Flash type set in eFuse: quad (4 data lines)
Flash voltage set by eFuse to 3.3V
Hard resetting via RTS pin...
```

The port was passed explicitly, as the plan requires: with no `-p`, esptool auto-detects and on this machine silently selects `/dev/cu.debug-console`.

### Reading 6 — the firmware's own report

`pio device monitor` cannot be scripted from a non-interactive shell; it exits with its own instruction to use the serial port directly:

```
UserSideException: `pio device monitor` requires an interactive terminal on stdin and cannot run
with piped or redirected input. If you're scripting device I/O, talk to the serial port directly
instead (e.g., with pyserial) rather than through `pio device monitor`.
```

The reading was therefore taken by opening the port directly, asserting RTS to reset the board, and reading for six seconds — the firmware prints once, in `setup()`.

```bash
python -c "serial.Serial('/dev/cu.usbmodem5CBC0287411',115200,timeout=0.3); assert RTS low, wait 0.12s, release; read 6s"
```

Exit status **0**. Verbatim, complete:

```
ESP-ROM:esp32s3-20210327
Build:Mar 27 2021
rst:0x1 (POWERON),boot:0x8 (SPI_FAST_FLASH_BOOT)
SPIWP:0xee
mode:DIO, clock div:1
load:0x3fce3808,len:0x4bc
load:0x403c9700,len:0xbd8
load:0x403cc700,len:0x2a0c
entry 0x403c98d0
baseline: flash=16777216 psram=1 psramSize=8386279
```

The firmware line is the acceptance vehicle's and matches its source exactly in shape. `psramSize=8386279`, not the `8388608` the research predicted: `getPsramSize()` reports **available** PSRAM, and the runtime reserves a small amount. The observed value is recorded rather than the expected one.

## What the readings establish, and what they do not

**Established.** The attached module carries 16 MB of external flash and 8 MB of in-package octal PSRAM, read three independent ways: the connect banner's eFuse-derived `Embedded PSRAM 8MB (AP_3v3)` feature line, the flasher's `Detected flash size: 16MB` against the flash die, and the firmware's own `flash=16777216 psram=1 psramSize=8386279`. The firmware report is the only one of the three that proves the **build** enabled PSRAM: a build that never enabled it cannot report `psram=1`.

**Not established.** Nothing in this run re-establishes the RGB-LED pin (see the evidence classification below). Nothing verifies the corrected pattern on a machine other than this one. The banner's `mode:DIO` line is the ROM bootloader's conservative start-up mode and says nothing about which prebuilt IDF library set is linked — that is `02-01`'s map-file reading, and the two do not conflict.

## The criterion-4 recorded reading

```bash
pio project config -d homeworks/project-baseline
```

Exit status **0**. Verbatim:

```
Computed project configuration for /Users/vloktiev/Dev/miltech/homework/homeworks/project-baseline
platformio
----------
extra_configs  =  ../../shared/pio/base.ini

env:projectbaseline_s3
----------------------
board                            =  esp32-s3-devkitc-1
framework                        =  arduino
platform                         =  espressif32@7.1.3
board_upload.flash_size          =  16MB
board_build.partitions           =  default_16MB.csv
board_build.arduino.memory_type  =  qio_opi
build_flags                      =  -DBOARD_HAS_PSRAM
monitor_speed                    =  115200
upload_port                      =  /dev/cu.usbmodem*
monitor_port                     =  /dev/cu.usbmodem*
test_port                        =  /dev/cu.usbmodem*
```

**Re-taken after the code-review fix, and it differs from the reading first recorded here.** The first reading of this section was taken before the review, when the fragment's global `[env]` block also carried `board` and `framework`; both appeared in the same position as every other key and the section concluded that all eleven were inherited. That conclusion is no longer true and the reading above is the one that stands.

The environment carries exactly one `platform` value — the literal released version `espressif32@7.1.3`, with no range operator and no branch reference — and all three console port keys are non-empty. **Nine of these eleven keys are inherited from the fragment; `board` and `framework` are declared by the project itself.** The project file therefore carries `extra_configs`, an `[env:projectbaseline_s3]` header naming those two keys, and nothing else.

The split is deliberate and was made in this phase after code review — finding CR-01, commit `0ca6098`. PlatformIO's ini format can **overwrite** an inherited key but never **unset** one: an empty assignment is a present-but-empty value, not a removal. With `board` and `framework` in the fragment's global block, a `platform = native` environment could not be configured at all — `board` fails as an unknown board id under a native run, and `framework = arduino` demands a board of its own — and that is exactly the environment `homeworks/project-baseline/README.md` announces for a later phase. `platform` stays in the fragment because every environment, native included, can overwrite that single key.

**Criterion 4 is still met**, and in the terms the criterion actually names: one exact `platform` version, and three non-empty console port keys, each of which — like the pin — is still inherited rather than declared. What is no longer true by inheritance is the `board`/`framework` pair, which is a change to *which* keys the fragment owns, not to whether the environment resolves. The re-taken reading above, and a build still reporting `6553600`, are the evidence that the correction did not disturb the environment it was meant to leave working. The `02-01-SUMMARY.md` merge-semantics readings remain the evidence that the inheritance direction is the one claimed — reading one (a project-level key wins), reading two (a re-declared global `[env]` in the project loses silently), and reading three (an env-level `build_flags` replaces the inherited list rather than appending).

Note the bare `env` section printed above. It is present in this text form **and** in the `--json-output` form, contrary to `02-RESEARCH.md` Pitfall 7; any automated check must therefore filter on the `env:` prefix rather than assume the entry is absent. `02-02`'s gate already does.

## The evidence classification

The console half of criterion 5 is **settled by measurement** — this run produced the before-and-after device inventory, the literal node, and the pattern's match result.

The RGB-LED pin, GPIO48 on this board, is **settled by owner confirmation** and not by a measurement. It was not re-established by observation in this phase, and no LED probe was added anywhere: no scratch sketch, no temporary source edit, no new file. **Re-check trigger:** the first homework that drives that pin as an RGB LED and shows no light means the board is a different revision, and the pin must then be re-established by observation — at which point the fact belongs in the machine-readable board-facts directory that a later phase owns.

The two halves of criterion 5 therefore rest on different kinds of evidence, and the criterion is credited only for the half this run actually observed.

## Per-criterion status

| # | Criterion (ROADMAP wording order) | Status | Evidence |
|---|---|---|---|
| 1 | A clean build links the `qio_opi` memory-type IDF libraries and produces an application partition sized for 16 MB, not the 8 MB default | **met** | `02-01-SUMMARY.md` — 6553600-byte partition and 5629 `sdk/esp32s3/qio_opi` map references, against the stock board's 3342336 bytes and `qio_qspi` |
| 2 | One dated on-hardware acceptance run goes build → flash → monitor, and both the esptool eFuse banner and `psramFound()` report 16 MB flash and 8 MB octal PSRAM | **met** | Readings 4, 5 and 6 above: the flash die reports `Detected flash size: 16MB`; the banner reports `Embedded PSRAM 8MB (AP_3v3)`; the firmware reports `psram=1 psramSize=8386279` |
| 3 | The resolved platform, framework and toolchain versions from `pio pkg list` are written into the repository | **met** | `shared/pio/VERSIONS.md`, produced by `02-02` |
| 4 | `pio project config` shows every environment carrying one exact `platform` version and its own explicit console port | **met** | The criterion-4 reading above — re-taken after the CR-01 fix; one exact `platform` value, all three port keys non-empty and still inherited from the fragment |
| 5 | The console-port choice and the RGB-LED GPIO are settled by a measurement on this board and recorded in the phase log | **met for the console half; owner-confirmed for the pin** | Console: settled by measurement — Reading 3. Pin: settled by owner confirmation, not a measurement — see the classification above |

No criterion is credited on the strength of a build alone, of a configured value, or of an inference. Criterion 2 was verified against two independent physical readings rather than one, exactly as `02-01-SUMMARY.md`'s sibling plan predicted a single reading could not suffice: for this module the eFuse flash field is empty because the flash die is external, so the banner cannot carry the flash size the criterion names.

## What this phase committed

- `shared/pio/base.ini` — the shared N16R8 environment fragment: the exact platform pin and the four module overrides in one enforcement point, plus the console ports so a new project cannot forget them. Corrected in this plan: the port glob, from the documented `usbserial` form to the measured `usbmodem` form.
- `homeworks/project-baseline/platformio.ini` — the fragment's first consumer, reduced to an `extra_configs` key and a bare environment header.
- `shared/pio/VERSIONS.md` — the resolved version record.
- `tools/tests/env-baseline.test.mjs` and one new export in `tools/tests/helpers.mjs` — the phase's regression gate: six assertions, pure filesystem, no child processes.
- `README.md` and `homeworks/project-baseline/README.md` — the reader-facing console statement and the record's route into the docs. The baseline README's console paragraph was corrected in this plan to match the measurement.
- **No C++ source was changed.** `homeworks/project-baseline/src/main.cpp` is untouched.

## Known deviations and residual risk

- **The bridge's identity is recorded nowhere outside `.planning/`.** An earlier draft of this section claimed that `AGENTS.md` "still names the CP2102N" and describes `/dev/cu.usbserial-*` as matching the bridge. **It does not** — `grep -c` returns `0` for both — and the claim was written without being checked. The code review's IN-03 caught it. What is actually true: the measured chip identity, a **CH343** at `USB VID:PID=1A86:55D3`, appears in no tracked file outside the planning directory; the CP2102N statements this run falsified live in `02-RESEARCH.md` Pitfall 8 and in `D-03`/`D-04`'s rationale in `02-CONTEXT.md`, both of which are planning artifacts rather than reader-facing documents. Whether the measured identity belongs in a reader-facing file is a decision for a later change; no criterion in this phase depends on it.
- **The corrected pattern cannot separate this board's two USB sockets.** Both enumerate under the `usbmodem` prefix. A flash is safe either way because both reach the same chip; a monitor opened on the native socket instead of the bridge prints nothing, because the vehicle writes to UART0. The both-sockets-cabled case was **not** measured — only one socket was cabled at a time.
- **The COM socket needs the right USB-C orientation.** With a C-to-C cable and the plug the other way round, the board receives no power at all; the socket's CC pull-down is present on one line only. Recorded because it looks exactly like a dead board.
- **`pio device monitor` cannot be scripted**, so Reading 6 was taken by a direct serial read. The substitution is the tool's own recommendation, quoted above.
- **`D-05:` the native-USB environment and its debug tool stay deferred together**, as decided; neither was created here.
- **`D-01:` the open version question stays deferred**, with its explicit trigger — the first course-provided code sample that fails to compile. It was not resolved in this phase.
- **The pattern's correctness elsewhere is unverified.** It was measured on one machine against one board.

## Two clean-tree readings

**First reading, taken before this log was written** — the log is itself a new unignored file under a tracked directory, so a reading taken afterwards would fail over the log rather than over the run it tests.

```bash
git status --porcelain
```

Exit status **0**. Output: *(empty)*.

**Second reading, taken after this log was committed.**

Taken after this log was committed — commit `9e06da3` — because that is the only moment at which the reading is true of the committed tree rather than of the working tree that still holds the log.

```bash
git status --porcelain
```

Exit status **0**. Output: *(empty)*.

---

**Total deviations:** 1 — the console glob was corrected on the acceptance run's evidence, which the plan authorized explicitly ("correct the pattern in `shared/pio/base.ini` to the measured form"). No other deviation; no gate, detector or assertion was weakened.

**Outcome in plain terms:** criteria 1, 3 and 4 were already met offline; criterion 2 is now met against three physical readings; criterion 5 is met for its console half by measurement and carries its pin half as an owner-confirmed fact. What would discharge the remainder is a homework that drives GPIO48 as an RGB LED — which is Phase 4's board-facts work, not this phase's.
