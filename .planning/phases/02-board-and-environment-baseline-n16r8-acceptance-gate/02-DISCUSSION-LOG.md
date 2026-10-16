# Phase 2: Board and Environment Baseline (N16R8 Acceptance Gate) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-16
**Phase:** 2-board-and-environment-baseline-n16r8-acceptance-gate
**Areas discussed:** Arduino core 2.x vs 3.x, Console (UART bridge vs USB CDC), `shared/pio/base.ini`, Evidence and where facts live

---

## Arduino core 2.x vs 3.x

External research was run before the question (`workflow.research_before_questions: true`). Findings presented: the official `platformio/espressif32` platform ships Arduino 2.0.17 only and has no 3.x path, so 3.x means the `pioarduino` fork; the 2.x→3.0 break list is wide (LEDC, Timer, I2S, RMT, SigmaDelta, ADC, BLE, WiFi) and extra compiler flags begin overwriting required defaults; `ESP_ARDUINO_VERSION_VAL` exists as a conditional-compilation mechanism.

| Option | Description | Selected |
|--------|-------------|----------|
| Pin 2.0.17 + trigger | 2.x is already the declared `PROJECT.md` constraint and the only option on the official platform. Record D1 as deferred-with-trigger: the first course code sample that fails to compile re-opens it (and that re-opening means the `pioarduino` fork plus a Key Decision revision). Phase 2 is not blocked — its exit criterion is physical, not version-dependent. | ✓ |
| Ask the instructor first | More honest, but Phase 2 cannot close without the answer while the acceptance run would still happen on 2.0.17, because the official platform ships nothing else. The question only becomes live at the first real homework (Phase 8). | |
| Move to 3.x / pioarduino now | Accepts abandoning the official-platform decision immediately. Blast radius: every homework, the platform pin, registry checksum and semver guarantees, and the whole future IDF path through the same platform. | |

**User's choice:** Pin 2.0.17 + trigger
**Notes:** No conditional-compilation scaffolding is written now; the trigger and the escalation path are the deliverable.

---

## Console (UART bridge vs USB CDC)

External research findings presented: the CDC setting is compiled into the binary, so socket and setting must agree or the board flashes successfully and prints nothing (the ROM banner is always on UART0); the native USB port is created by the firmware and disappears on reset, crash and deep sleep, needing a post-`Serial.begin()` delay; the UART bridge port belongs to the bridge chip and survives all three; with CDC-on-boot `Serial` changes type and libraries expecting `HardwareSerial` fail to compile.

### Question 1 — default console and port pinning

| Option | Description | Selected |
|--------|-------------|----------|
| UART bridge + glob pattern | `upload_port = monitor_port = test_port = /dev/cu.usbserial-*`. The env names its own port (criterion 4 satisfied), the public repo receives no machine path, and `PITFALLS.md:45` recommends this form explicitly. UART bridge chosen as default for the ROM log and its survival across reset. | ✓ |
| UART bridge + literal path | Reads criterion 4 more literally and makes the phase log reproducible one-to-one. Cost: a concrete `/dev/cu.*` is a detail of this machine in public history, and no other Mac could flash these environments. | |
| Native USB CDC as default | Contradicts `STACK.md` and `PITFALLS.md`. The port is created by the firmware, so it vanishes during the very run that reads logs; `Serial` changes type and breaks libraries expecting `HardwareSerial`. `AGENTS.md` states plainly: never the repo default. | |

### Question 2 — when the native-USB path appears

| Option | Description | Selected |
|--------|-------------|----------|
| Defer until needed | Create the opt-in env when a homework actually requires it. Matches the "solo maintenance — every file is a cost" constraint and `STACK.md`'s "worth it for a dedicated HWCDC/OTG homework". `debug_tool = esp-builtin` travels in the same phase. | ✓ |
| Add the environment now | The baseline gains a second env with `-DARDUINO_USB_MODE=1 -DARDUINO_USB_CDC_ON_BOOT=1` and its own `/dev/cu.usbmodem*`. Criterion 4 would be proven on two consoles rather than declared. Cost: an env nobody uses until Phase 8. | |
| Record the recipe only | State the exact build flags and port as a verified recipe without an env in the file. Fewer files, but the recipe stays unverified — and `PITFALLS.md` § 18 is precisely about "verified as files, not as behaviour". | |

**User's choice:** UART bridge + glob; defer the native-USB path until needed.

---

## `shared/pio/base.ini`

### Question 1 — introduce the fragment in this phase?

| Option | Description | Selected |
|--------|-------------|----------|
| Introduce `base.ini` now | `platform` pin + board + framework + the four N16R8 overrides + `monitor_speed` live in one fragment; the baseline consumes it via `extra_configs = ../../shared/pio/base.ini`. This is what `D-11` and `ARCHITECTURE.md` designed for this phase. Cost: one level of indirection, and `pio project config` becomes the mandatory instrument of proof (which criterion 4 requires anyway). | ✓ |
| Duplicate literally | The file reads top to bottom with no indirection and no risk of broken `../../` arithmetic. Cost: the platform pin in 60 copies, any bump is 60 edits, and drift between copies is invisible to every check. | |
| Defer to Phase 6 | The baseline stays literal and the fragment arrives with the pre-commit/CI gates that can verify it. Fewest files today; cost is rewriting the env template later and losing the connection to `D-11`. | |

### Question 2 — what goes into the fragment

| Option | Description | Selected |
|--------|-------------|----------|
| N16R8 facts only | `platform`, `board`, `framework`, `board_upload.flash_size`, `board_build.partitions`, `board_build.arduino.memory_type`, `build_flags = -DBOARD_HAS_PSRAM`, `monitor_speed`. Ports and `lib_deps` stay in the project — criterion 4 says the env names its own port, and `ARCHITECTURE.md` makes `lib_deps` project-scoped by definition. | |
| Broader: with the ports | The above plus `upload_port` / `monitor_port` / `test_port` with the glob. Less duplication, but an env inherits its port instead of naming it: any homework with a different console must override explicitly, which reads as a weaker criterion 4. | ✓ |
| Minimum + `build_cache_dir` | The minimum set plus `[platformio] build_cache_dir = .pio-cache` immediately. `AGENTS.md` recommends it, but with the condition "once the repo has several homeworks" — there is one, so it would cache nothing. | |

**User's choice:** Introduce the fragment now; the broader content set including the ports.

**Notes:** The consequence the phase must *measure* rather than assume: `ARCHITECTURE.md:416` records the `extra_configs` relationship as one-way — a project overrides a single key by re-declaring it. Phase 2 must demonstrate with `pio project config` that (a) the glob resolves inside the fragment's `[env]` section and (b) a project-level override of a single key wins.

---

## Evidence and where facts live

`STATE.md` was found to contain no separate phase-log artifact; the Phase 1 log turned out to be `01-05-SUMMARY.md` ("this file is both the plan's deliverable and the evidence the phase's four criteria depend on"). Criterion 5's "the phase log" therefore means the `SUMMARY.md` of the plan carrying the acceptance run.

### Question 1 — where the resolved versions live

| Option | Description | Selected |
|--------|-------------|----------|
| `shared/pio/VERSIONS.md` next to the pin | Resolved versions from `pio pkg list`, trimmed to name+version because the raw output carries machine-local cache paths. Reproducibility is read from the same place as the pin; the file belongs to the repository and cannot be reverted by a GSD regeneration. | ✓ |
| In `AGENTS.md`, in the existing table | The "Measured on this machine (2026-10-15)" table already exists and already holds these values — no new file. Risk: `D-24` documents that a GSD regeneration of `AGENTS.md` reverts corrections, so criterion 3 would rest on a file the repository does not own. | |
| Phase log only | Fewest files and criterion 5 satisfied literally. Cost: criterion 3 requires reproducibility "from the committed files alone" — the phase log is a record of execution, not a reference, and it does not address a future reader. | |

### Question 2 — the RGB-LED half of criterion 5

| Option | Description | Selected |
|--------|-------------|----------|
| Probe outside the repo + human observation | The LED probe is a temporary sketch (scratch project, or a `main.cpp` edit reverted after the measurement); the owner makes the observation and it is recorded in the phase log with its procedure and an unfilled slot until confirmed. The baseline stays GPIO-free per `D-14` and no unverified pin is committed. | ✓ (default) |
| Probe committed as its own sketch | A reproducible artifact in the repository that a future reader can see. Cost: a new file and env kept permanently for a one-time measurement. | |
| Do not touch GPIO; read the revision from markings | Cheapest, and follows the Phase 1 precedent of a documented criterion narrowing. But it does not prove what the criterion actually wrote. | |

**User's choice:** *No answer — the session was idle for 600 s and the question timed out.* Option 1 was applied as a default. **This is not a recorded user decision and must be re-confirmed before planning.** It is flagged inline in CONTEXT.md (`D-12`).

---

## Claude's Discretion

- The exact glob shape for the console ports (`/dev/cu.usbserial-*`, `/dev/cu.wchusbserial-*`, `/dev/cu.SLAB_USBtoUART`, or an alternation), settled by `pio device list` against the real board.
- The wording and structure of `shared/pio/VERSIONS.md`, and which `pio pkg list` invocation produces the recorded set.
- Whether `upload_speed` is pinned on the baseline environment. `STACK.md` suggests 460800; Phase 1's `D-12` committed the probe set minus `upload_speed`. Not discussed.
- The exact comment header of `shared/pio/base.ini` — the research fixes only that it must not be named `platformio.ini` and must carry no empty section headers.
- Whether `shared/pio/` also gets a short `README.md`.
- That the environment name stays `[env:projectbaseline_s3]`: Phase 1's `D-16` fixed the project-scoped naming rule and `envNames()` derives it, so this is not a choice in Phase 2.

## Deferred Ideas

- `[platformio] build_cache_dir` cross-project object cache — after several homeworks exist.
- Native-USB opt-in environment + `debug_tool = esp-builtin` — together, when a homework needs HWCDC/OTG.
- The D1 re-check trigger and its escalation path (`pioarduino` fork + Key Decision revision).
- `shared/hardware/` board facts (including the board revision) and the pin-validation check — Phase 4.
- `docs/` — Phase 4. Retiring `homeworks/project-baseline/` — Phase 8.
- The research sketch's "one native test → one hook dry run" — Phase 5 and Phase 6.
