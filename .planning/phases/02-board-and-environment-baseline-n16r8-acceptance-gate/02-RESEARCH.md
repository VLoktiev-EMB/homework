# Phase 2: Board and Environment Baseline (N16R8 Acceptance Gate) - Research

**Researched:** 2026-10-16
**Domain:** PlatformIO project-configuration layering for an ESP32-S3-WROOM-1 N16R8 module, plus the esptool/Arduino-core evidence surfaces that prove the physical module
**Confidence:** HIGH for the offline mechanisms (measured on this machine the same day); LOW/absent for the physical-board readings, which no agent can produce

## Summary

The phase's five success criteria split cleanly along one line: four of them are **machine-provable today** and one is **physical only**. I measured the machine-provable half end-to-end in a scratch tree outside the repository and it works — including the exact failure modes the research's design review warned about, which turn out to be real and which the plan must therefore guard by construction rather than by good intentions.

Three findings reshaped how I would plan this.

**First, `shared/pio/base.ini` must carry a `[env]` global block, not an `[env:<name>]` section.** Measured: a fragment's `[env]` block supplies defaults to a project's `[env:<id>_s3]`, and the project's own section wins for any key it re-declares — which is exactly the one-way override `ARCHITECTURE.md:416` promises. But a project that re-declares `[env]` *itself* **loses silently**, because the fragment wins for the same group. Both directions were measured today, not read.

**Second, the two "verified silent traps" that made `PITFALLS.md:526` rank this design last are real and reproducible.** A missing `extra_configs` file exits **0** and yields an environment with an **empty body**; and an env-level `build_flags` **replaces** the inherited list rather than appending. Consequently criterion 4 cannot be discharged by running `pio project config` and checking its exit status — the check must assert on the *content*, because the tool is happy to print an empty environment and exit 0.

**Third, criterion 2 as written cannot be satisfied by one esptool reading.** The chip-feature banner is built from `{0: None, 1: "Embedded Flash 8MB", 2: "Embedded Flash 4MB"}` for flash, and `0` means *no embedded flash* — which is precisely the case for a WROOM-1 module whose 16 MB die sits beside the SoC. The 16 MB figure therefore comes from `esptool flash_id` (`Detected flash size: 16MB`), and the **8 MB PSRAM** figure comes from the connect banner (`Embedded PSRAM 8MB (AP_3v3)`). Two readings, not one, and the plan's evidence slot must ask for both.

**Primary recommendation:** Split the phase at the hardware boundary. One plan does everything a machine can prove offline — the fragment, the baseline's conversion to it, `VERSIONS.md`, a recorded `pio project config` reading, a pure-filesystem regression test, and the negative-control build that makes criterion 1's `qio_opi` claim meaningful. A second plan is the single dated acceptance run, written with the exact command sequence, the exact strings to look for, and **explicitly unfilled output slots** for every reading the board's absence prevents. Criterion 2 and the measurement half of criterion 5 are credited only by that run's verbatim output; if the board is not attached, those slots stay empty and the phase reports them unmet rather than inferred.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Arduino core version (open decision D1)**
- **D-01:** The operative answer for this phase is Arduino core **2.0.17** on ESP-IDF 4.4.7 — the core the pinned official platform `espressif32@7.1.3` actually ships, and the one `PROJECT.md` Constraints already name ("Arduino core (2.x) now, ESP-IDF later"). D1 is **not** marked resolved; it is recorded as **deferred with an explicit trigger**: the first course-provided code sample that fails to compile. No blocking question is sent to the instructor, and the phase does not wait on one. — **Reversibility:** costly — choosing 3.x later means leaving the official platform for the `pioarduino` fork, re-pinning every environment, re-recording `VERSIONS.md`, abandoning registry checksum/semver guarantees, and re-opening the `PROJECT.md` Key Decision "Official `platformio/espressif32`, not the pioarduino fork".
- **D-02:** No `#if ESP_ARDUINO_VERSION` compatibility scaffolding is written now. External research (2026-10-16) confirms the mechanism exists (`ESP_ARDUINO_VERSION_VAL`, `ESP_ARDUINO_VERSION_STR`), but authoring conditional compilation against a hypothesis that may never fire is a guess, and shared code is where the cost of a wrong guess compounds.

**Console and console ports**
- **D-03:** The repository default console is the **UART bridge**, not native USB CDC. Rationale, from external measurement (2026-10-16): the bridge port belongs to the bridge chip, so it survives reset, crash and deep sleep — exactly the moments the acceptance run reads logs — and it always carries the ROM boot log on UART0; the native USB port is created by the firmware itself and disappears on reset, crash and deep sleep, and needs a post-`Serial.begin()` delay because the host has not enumerated yet. The CDC choice is compiled into the binary, so a socket/setting mismatch produces a board that flashes successfully and prints nothing. — **Reversibility:** costly — the console choice moves every environment's `build_flags`, the pinned ports, and the shape of the recorded acceptance evidence; `STACK.md` additionally notes the native port disappears whenever the firmware touches GPIO19/20 or sleeps.
- **D-04:** Console ports are pinned as a **glob pattern** (`/dev/cu.usbserial-*`), not as a literal device path, for `upload_port`, `monitor_port` and `test_port`. This satisfies ROADMAP criterion 4 — every environment carries its own explicit console port — without committing a machine-specific path into a public repository, which is the constraint that made `D-12` leave the port unpinned in Phase 1. `PITFALLS.md:45` sanctions the glob form explicitly. — **Reversibility:** reversible.
- **D-05:** The native-USB path (`build_flags = -DARDUINO_USB_MODE=1 -DARDUINO_USB_CDC_ON_BOOT=1`) **and** `debug_tool = esp-builtin` are deferred together until a homework genuinely needs HWCDC/OTG. No opt-in environment is created in this phase. Rationale: the "Solo maintenance" constraint makes every added file a cost, `STACK.md` scopes native USB to "a dedicated HWCDC/OTG homework", and on ESP32-S3 the built-in USB Serial/JTAG and USB-OTG on the internal PHY are mutually exclusive by eFuse — so the debug tool travels with that same later decision rather than being adopted early.

**Shared config layer**
- **D-06:** `shared/pio/base.ini` is introduced in this phase, realizing the folder `D-11` reserved for Phase 2 and the config layer `ARCHITECTURE.md` designs. It is consumed as `extra_configs = ../../shared/pio/base.ini` from the project's `[platformio]` section, never named `platformio.ini`, and carries no empty section headers. It holds the N16R8 environment facts: `platform`, `board`, `framework`, the four measured overrides, `build_flags = -DBOARD_HAS_PSRAM`, and `monitor_speed`. — **Reversibility:** costly — undoing it re-literalizes the override set into every homework created in the meantime, and the version-discipline constraint loses its single point of enforcement.
- **D-07:** The fragment **also carries the console ports** — `upload_port`, `monitor_port`, `test_port` with the glob from D-04. Consequence to be *measured*, never assumed: an environment then inherits its console instead of declaring it, so criterion 4 becomes true by construction for every future homework (a new project cannot forget it), while the project-level override path stays available. `ARCHITECTURE.md:416` records the relationship as one-way — a project overrides a single key by re-declaring it — and Phase 2 must demonstrate that with `pio project config` rather than trust it. — **Reversibility:** reversible.
- **D-08:** A project needing a different console overrides the single key in its own `platformio.ini`; it does not fork or duplicate the fragment.

**Where facts and evidence live**
- **D-09:** The resolved platform, framework and toolchain versions reported by `pio pkg list` are written to **`shared/pio/VERSIONS.md`**, a file next to the pin, referenced from `base.ini` and `README.md`. The content is trimmed to name + version because the raw output carries machine-local cache paths. This is what makes ROADMAP criterion 3's "reproduced from the committed files alone" true for a reader in week 40 — the pin and the resolved set are read from the same place. Deliberately **not** `AGENTS.md`: `D-24` documents a case where a GSD regeneration of that file would revert a correction, so a criterion may not rest on a file the repository does not own. — **Reversibility:** reversible.
- **D-10:** "The phase log" in criterion 5 means the **`SUMMARY.md` of the plan that carries the acceptance run**, per the Phase 1 precedent where `01-05-SUMMARY.md` was "both the plan's deliverable and the evidence the phase's four criteria depend on". Verbatim command output is recorded there, not a paraphrase.
- **D-11:** Both Phase 1 log conventions carry forward unchanged. First, the log is written as late as the assertions allow, because it is itself a new unignored file under a tracked directory — an early write makes the clean-tree reading fail over the log instead of over the thing under test. Second, an observation the agent cannot make gets an **explicitly unfilled output slot**: a plausible-sounding invented observation would enter the phase log as evidence and be read as fact by every later phase.
- **D-12:** The RGB-LED pin is **GPIO48 on this specific board** — owner statement, 2026-10-16. No LED probe is added to the phase: no scratch sketch, no temporary `main.cpp` edit, no new file in the repository. `homeworks/project-baseline/src/main.cpp` stays GPIO-free per Phase 1's `D-14`, and no unverified pin is committed anywhere.

  **Evidence classification — record this distinction, do not blur it.** ROADMAP criterion 5 says the RGB-LED GPIO is "settled by a measurement on this board". It is settled here by **owner confirmation**, which is a different kind of evidence from the measurement the criterion names. The phase log must say so in those words, so the criterion is not credited with an observation that was never made. The console half of criterion 5 *is* settled by measurement — the acceptance run produces it.

  **Re-check trigger:** the first homework that drives GPIO48 as an RGB LED and shows no light. When that fires, the board is a different revision and the pin must be re-established by observation; the fact is then recorded in `shared/hardware/` (Phase 4's `HW-02`). — **Reversibility:** reversible.

### Claude's Discretion

No `## Claude's Discretion` section was recorded in `02-CONTEXT.md`. The areas the discussion left to the planner by omission, which this research makes recommendations on and which the planner remains free to decide, are:

- The exact wording and internal layout of `shared/pio/base.ini` (comment density, key ordering, whether a short header comment names the `${env.build_flags}` trap).
- Whether criterion 4's assertion is a committed Node test, a recorded `pio project config` reading in the phase log, or both.
- How the physical acceptance run is scheduled relative to the offline work — one plan or two.

### Deferred Ideas (OUT OF SCOPE)

- **`[platformio] build_cache_dir = <repo>/.pio-cache`** — the cross-project object cache `AGENTS.md` recommends, but with the explicit condition "once the repo has several homeworks". There is one today, so it would cache nothing; it belongs with Phase 6's gates or later.
- **Native-USB opt-in environment and `debug_tool = esp-builtin`** — deferred by `D-05` until a homework needs HWCDC/OTG. On ESP32-S3 the eFuse makes USB Serial/JTAG and USB-OTG mutually exclusive, so this decision cannot be split: the env and the debug tool arrive together.
- **The D1 re-check trigger** — the first course-provided code sample that fails to compile. When it fires, the cost is not "change a version number": it is the `pioarduino` fork, every environment's pin, `VERSIONS.md`, and the official-platform Key Decision.
- **The ADC2-while-Wi-Fi conservative stance and the board-revision fact** — `STATE.md` D12 keeps ADC1 GPIO1-10 as the analog range until measured, and the revision fact belongs in `shared/hardware/`, which is Phase 4's `HW-02`.
- **`docs/`** — does not exist until Phase 4; `D-11` deliberately created no placeholder.
- **Retiring `homeworks/project-baseline/`** — it is Phase 1's build proof and this phase's acceptance vehicle; it must be deliberately retired before Phase 8 writes the README index, or it appears there as an unexplained assignment. Recorded in `PROJECT.md` § Traps for Later Phases.
- **"One native test → one hook dry run" from the research's Phase 2 sketch** — Phase 5 (`[env:native]`) and Phase 6 (hooks) own them in this roadmap.
- **A `README.md` for `shared/pio/`** — not decided here; `VERSIONS.md` is. If the folder grows a second file, a short index may be worth it.
- **No todos were reviewed or folded** — `todo.match-phase 2` returned zero matches.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **HW-01** | Every homework environment overrides the board for the N16R8 module — flash size 16 MB, the 16 MB partition table, `qio_opi` memory type, and the PSRAM build flag | The four overrides are already measured working through the literal `platformio.ini` (Phase 1). This research **re-measured all four through the `extra_configs` fragment indirection** and produced the negative control that makes the claim falsifiable: with the overrides, the build reports `used 236825 bytes from 6553600 bytes` and links `tools/sdk/esp32s3/qio_opi/…`; with the stock board definition the same source reports `used 233109 bytes from 3342336 bytes` and links `tools/sdk/esp32s3/qio_qspi/…`. See § Standard Stack → *Measured override contrast* and § Code Examples → *The negative control*. |
| **HW-04** | Every environment pins the platform to an exact version, never a range, and names its console port explicitly | `pio project config --json-output` returns a machine-parseable array in which the platform pin and all three port keys are visible per environment. This research verified the fragment supplies all three port keys to a project that declares none, and verified the **silent failure mode**: a fragment that cannot be found exits 0 and yields an empty environment body. See § Architecture Patterns → *Pattern 1*, § Common Pitfalls → *Pitfall 1*, and § Validation Architecture. |

**Note on the evidence for HW-01 / HW-04:** both requirements are *configuration* claims, and both are provable offline. Neither needs the physical board. The physical board is needed only for ROADMAP criteria 2 and 5, which are not requirement IDs.
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Shared environment facts (platform pin, board, four overrides, `monitor_speed`) | **Config fragment** — `shared/pio/base.ini`, `[env]` global block | **Project** — `homeworks/*/platformio.ini`, `[env:<id>_s3]` | One enforcement point for the "pin every tool to an exact version" constraint; the project keeps only its identity and any deliberate deviation |
| Console port selection | **Config fragment** — glob pattern | **PlatformIO device finder** at run time | The pattern is repository policy; the resolution is the tool's. A pattern that matches nothing fails loudly, which is why the glob is safe even while unverified |
| Resolved version record | **Repo document** — `shared/pio/VERSIONS.md` | **Config fragment** — a comment in `base.ini` pointing at it | Criterion 3 needs one canonical committed source; the pin and the resolved set are read from the same folder |
| Physical module identity (16 MB flash, 8 MB octal PSRAM) | **Device** — esptool `flash_id` (flash) and the connect banner (PSRAM) | **Firmware report** — `psramFound()` / `getPsramSize()` over the monitor | The eFuse is the only mechanism that reports what is physically attached; the firmware report is the only one that proves the *build* enabled PSRAM |
| Criterion-4 assertion | **Repo tooling** — `tools/tests/` (pure filesystem) | **Recorded `pio project config` reading** in the phase log | The merge behaviour is a PlatformIO runtime fact; the file layout and fragment content are static facts. Each is checked where it can actually be checked |
| Acceptance evidence | **Phase log** — the acceptance plan's `SUMMARY.md` | — | Phase 1's `D-10`/`D-11` precedent: verbatim output or an explicitly unfilled slot |

## Standard Stack

This phase installs no library. Its "stack" is the pinned toolchain it must *record*, plus the one new repository file that carries the record.

### Core

| Component | Version | Purpose | Why This One |
|---|---|---|---|
| PlatformIO Core | `6.2.0` — measured `PlatformIO Core, version 6.2.0` at `~/.platformio/penv/bin/pio`, **not on the interactive PATH** | Build, config inspection, upload, monitor | Already installed and pinned by Phase 1; `pio project config --lint` needs ≥ 6.1.8 and `--json-output` is present in this build [VERIFIED: measured 2026-10-16 — `pio project config --help`] |
| `platformio/espressif32` | `7.1.3` | Platform: board definitions, frameworks, toolchains | The owner's Key Decision; registry-resolved and checksummed [VERIFIED: measured 2026-10-16 — `pio pkg list -d homeworks/project-baseline`] |
| `framework-arduinoespressif32` | `4.20017.260907+sha.dcc1105b` (= Arduino core **2.0.17**) | The framework every first-phase homework compiles against | This is what the pin actually resolves to; `D-01`'s operative answer [VERIFIED: measured 2026-10-16] |
| Arduino core's bundled IDF | ESP-IDF **4.4.7** | Underlying SDK for the Arduino build | Not a separate resolved package for the Arduino env; carried inside the core [VERIFIED: `STACK.md` measurement, `-DIDF_VER="v4.4.7-dirty"`; **not re-measured this session** — see Assumptions A3] |
| `tool-esptoolpy` | `2.41100.260830` (esptool **4.11.0**) | Flashing, and the `flash_id` reading that names the physical flash die | Declared by the platform as `"type": "uploader"` [VERIFIED: `~/.platformio/platforms/espressif32/platform.json:94-98`] and already installed |
| `toolchain-xtensa-esp32s3` | `8.4.0+2021r2-patch5` | The compiler the Arduino env actually uses | Confirmed by a live link-error trace naming `<toolchain-xtensa-esp32s3>/…/8.4.0/…` [VERIFIED: measured 2026-10-16 — the probe build's linker path] |
| Node.js | `v26.7.0` | Runs the repository's test suite and `tools/` scripts | Already the repo's only runtime; no `package.json` exists [VERIFIED: measured 2026-10-16 — `node --version`; tracked tree] |

### Supporting

| Component | Version | Purpose | When to Use |
|---|---|---|---|
| `pio project config --json-output` | Core 6.2.0 | Machine-parseable resolved configuration | The criterion-4 evidence reading and any future automated assertion [VERIFIED: measured 2026-10-16] |
| `pio project config --lint` | Core ≥ 6.1.8 | Configuration sanity gate | Cheap; printed *"The "platformio.ini" configuration file is free from linting errors."* on the probe [VERIFIED: measured 2026-10-16] |
| `esptool.py flash_id` | esptool 4.11.0 | `Detected flash size: 16MB` | The only reading that names the physical flash die; the eFuse banner does **not** carry it for this module |
| `pio device list --json-output` | Core 6.2.0 | Machine-readable port inventory | The plug-in/unplug diff that identifies the UART bridge [VERIFIED: measured 2026-10-16 — returns `[{"port": …, "description": …, "hwid": …}, …]`] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|---|---|---|
| `[env]` global block in `base.ini` | `[env:<name>]` sections in `base.ini` | Rejected: the fragment would have to name every project's environment, so it stops being shared and every new homework edits the fragment — the opposite of `D-07`'s "a new project cannot forget it" |
| Glob ports in the fragment | Literal device path | Rejected by `D-04`: the repository is public and a literal path is a private machine detail. Measured consequence of the glob choice: a pattern matching nothing fails **loudly** (`Error: Please specify 'upload_port' for environment`), never silently |
| Glob ports in the fragment | `${sysenv.ESP_PORT}` interpolation | Not chosen. It moves the value out of the repository, so `pio project config` on a fresh clone prints an unresolved placeholder and criterion 4's "explicit console port" becomes a property of the environment, not of the committed files |
| `extra_configs` fragment | `extends` profiles | Rejected by the research (`extends` does not merge; only the last profile's value survives for any option, silently dropping list-valued options) |
| One `pio project config` reading in the log | A committed test that spawns `pio` | Both. See § Validation Architecture — the static half is a pure-filesystem test; the merge half is a recorded reading, because adding a `pio`-spawning test introduces a new dependency into a suite that today is pure Node |
| `VERSIONS.md` | Recording the resolved set in `AGENTS.md` | Rejected by `D-09`: `AGENTS.md` is GSD-generated and a regeneration can revert a correction |

**Installation:** none. This phase installs nothing — there is no `package.json`, no `requirements.txt`, and every PlatformIO package it names is already resolved on disk.

**Version verification:** performed this session with the ecosystem-appropriate command, `pio pkg list -d homeworks/project-baseline` (the PlatformIO registry analogue of `npm view`). The non-verbose form lists name + resolved version + required range and **contains no machine-local paths**; the `-v` form appends `/Users/vloktiev/.platformio/platforms/espressif32`, which is exactly the machine-local detail `D-09` says to trim.

## Package Legitimacy Audit

**Not applicable — this phase installs no external packages.** The repository has no `package.json`, no `requirements.txt`, and no lockfile; `git ls-files` confirms no manifest of any package ecosystem is tracked. Every dependency this phase touches is a PlatformIO package already resolved on disk through the pinned official platform, whose registry provides version resolution and checksums. The one candidate future package (`@wokwi/diagram-lint`) belongs to Phase 4, not here.

Nothing to remove, nothing to flag, and no `checkpoint:human-verify` is required for package installation in this phase.

## Architecture Patterns

### System Architecture Diagram

Data flow for the phase's two halves. The left branch is offline and provable now; the right branch is the physical run and is the only part that can fail for reasons the repository does not control.

```
                         ┌──────────────────────────────────────────┐
   OFFLINE HALF          │  shared/pio/base.ini                     │
   (machine-provable)    │    [env]            <- GLOBAL block      │
                         │      platform, board, framework          │
                         │      board_upload.flash_size = 16MB      │
                         │      board_build.partitions = 16MB csv   │
                         │      board_build.arduino.memory_type     │
                         │      build_flags = -DBOARD_HAS_PSRAM     │
                         │      monitor_speed = 115200              │
                         │      upload_/monitor_/test_port = glob   │
                         └────────────────┬─────────────────────────┘
                                          │  extra_configs =
                                          │  ../../shared/pio/base.ini
                                          │  (globbed against the PROJECT dir)
                                          ▼
                         ┌──────────────────────────────────────────┐
                         │  homeworks/<id>/platformio.ini           │
                         │    [platformio]  extra_configs = …        │
                         │    [env:<id>_s3]  <- MUST exist,           │
                         │                     else ProjectEnvs-    │
                         │                     NotAvailableError    │
                         └────────────────┬─────────────────────────┘
                                          │
                     ┌────────────────────┴────────────────────┐
                     ▼                                         ▼
       ┌────────────────────────────┐            ┌────────────────────────────┐
       │ pio project config         │            │ pio run                    │
       │  --json-output             │            │  -> 6553600 (16 MB app)     │
       │  -> criterion 4 evidence   │            │  -> map references qio_opi  │
       │  (assert CONTENT, not $?)  │            │  -> criterion 1 evidence    │
       └────────────────────────────┘            └────────────────────────────┘
                                          │
                                          ▼
                         ┌──────────────────────────────────────────┐
                         │  shared/pio/VERSIONS.md                  │
                         │   (trimmed pio pkg list: name + version) │
                         │   -> criterion 3 evidence                │
                         └──────────────────────────────────────────┘

                         ┌──────────────────────────────────────────┐
   PHYSICAL HALF         │  USB cable -> UART socket on the DevKitC-1│
   (board required)      │  pio device list  (before / after)        │
                         └────────────────┬─────────────────────────┘
                                          │  the glob must match exactly one port
                                          ▼
       ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
       │ pio run -t upload    │   │ esptool.py flash_id  │   │ pio device monitor   │
       │  banner: "Chip is    │   │  "Detected flash     │   │  firmware prints:    │
       │  ESP32-S3 …"         │   │   size: 16MB"        │   │  flash=… psram=1     │
       │  "Features: …,       │   │                      │   │  psramSize=8388608   │
       │   Embedded PSRAM     │   │  -> flash 16 MB      │   │  -> firmware proves  │
       │   8MB (AP_3v3)"      │   │                      │   │     the build enabled │
       │  -> PSRAM 8 MB octal │   │                      │   │     PSRAM             │
       └──────────┬───────────┘   └──────────┬───────────┘   └──────────┬───────────┘
                  └──────────────────────────┴──────────────────────────┘
                                          │
                                          ▼
                         ┌──────────────────────────────────────────┐
                         │  the acceptance plan's SUMMARY.md        │
                         │   every reading verbatim, or an          │
                         │   EXPLICITLY UNFILLED SLOT               │
                         │   -> criteria 2 and 5                    │
                         └──────────────────────────────────────────┘
```

### Recommended Project Structure

Only the two rows marked `NEW` are created by this phase; everything else exists.

```
shared/
├── lib/                          # Phase 3's; untouched here
│   └── README.md
└── pio/                          # reserved by Phase 1's D-11, realized now
    ├── base.ini                  # NEW  [env] global block; never named platformio.ini
    └── VERSIONS.md               # NEW  resolved platform/framework/toolchain versions

homeworks/
└── project-baseline/             # Phase 1's acceptance vehicle; platformio.ini is REWRITTEN
    ├── platformio.ini            # REWRITTEN  [platformio] extra_configs + [env:projectbaseline_s3]
    ├── src/main.cpp              # unchanged   serial report, no GPIO (Phase 1's D-14)
    ├── README.md                 # UPDATED    names the console decision, points at VERSIONS.md
    ├── .gitignore
    └── .vscode/extensions.json

tools/
├── lib/discover.mjs              # unchanged; envNames() still derives the env name
├── sweep-homeworks.mjs           # unchanged; its homeworks/*/platformio.ini glob is untouched
└── tests/
    └── env-baseline.test.mjs     # NEW  pure-filesystem assertion over the fragment + consumers
```

### Pattern 1: The `[env]` global block as a defaults layer, with the project's own section overriding it

**What:** `shared/pio/base.ini` declares a single `[env]` block. PlatformIO merges `[env]` into each `[env:<name>]` of the same project. A project that needs to deviate re-declares the single key **inside its own `[env:<id>_s3>]` section**.

**When to use:** Always, for this fragment. It is the only shape that makes a new homework inheriting the console ports automatic (`D-07`) while keeping the override path open (`D-08`).

**Why the distinction is load-bearing — measured, both directions:**

| Arrangement | Result | Consequence |
|---|---|---|
| Fragment `[env].monitor_speed = 115200`; project `[env:h2s3].monitor_speed = 9600` | **`9600`** — the project won | `D-08`'s override path works |
| Fragment `[env].monitor_speed = 115200`; project re-declares **`[env]`**`.monitor_speed = 9600` | **`115200`** — the **fragment** won, silently | A project that overrides in a second `[env]` block is ignored with no warning |

Both readings were taken with `pio project config` on 2026-10-16 in a scratch tree under `$TMPDIR`. The second matches the official documentation's rule that *"a value from extra configuration overwrites the base"* [CITED: https://github.com/platformio/platformio-docs/blob/develop/projectconf/sections/platformio/options/generic/extra_configs.rst]. **The plan must state the override rule in a comment in `base.ini`**, because the losing arrangement looks entirely reasonable in a diff.

### Pattern 2: The fragment supplies defaults; the project still owns its environment

**What:** the fragment's `[env]` alone creates **no environment**. The project must declare `[env:<id>_s3]` itself.

**Measured:** a project carrying only `[platformio] extra_configs = …` and nothing else produced `pio project config` output containing a bare `env` section and **no** `env:<name>` section, and `pio run` failed with `ProjectEnvsNotAvailableError: Please setup environments in platformio.ini file`. This is a loud, named failure — which is the good outcome.

**When to use:** always. The environment name continues to come from `tools/lib/discover.mjs`'s `envNames(id)` (hyphens stripped, `_s3` appended), so the baseline stays `[env:projectbaseline_s3]`.

### Pattern 3: Evidence by verbatim reading, or an explicitly unfilled slot

**What:** Phase 1's convention, carried forward by `D-11`. The phase log carries command output exactly as printed. An observation no agent can make gets a visibly empty slot with the exact procedure written beside it.

**When to use:** every claim in the acceptance plan. This is what keeps criterion 2's credit honest when the board is not attached.

### Anti-Patterns to Avoid

- **Checking `pio project config`'s exit status as criterion 4's evidence.** Measured: with a fragment that does not exist, it exits **0** and prints an environment with an empty body. The assertion must be over the *content*.
- **Re-declaring `[env]` in the project to override a fragment key.** Measured silent no-op (Pattern 1, second row).
- **Writing an env-level `build_flags` without `${env.build_flags}`.** Measured: it **replaces** the inherited list rather than appending. `base.ini` carries `-DBOARD_HAS_PSRAM`; a project that writes `build_flags = -DEXTRA=1` silently loses the PSRAM flag, and with it every `psramFound()` reading the acceptance run depends on.
- **Shipping a broad port glob.** Measured: with `upload_port = /dev/cu.*` on this machine — where `/dev/cu.debug-console` and `/dev/cu.Bluetooth-Incoming-Port` both exist and no board is attached — PlatformIO silently resolved to `/dev/cu.debug-console` and esptool tried to open it. `fnmatch` first-match, no warning. `D-04`'s narrower `/dev/cu.usbserial-*` is a genuine pin; `/dev/cu.*` would not be.
- **Believing the eFuse banner will print the flash size.** See § Common Pitfalls → *Pitfall 4*.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Reading the resolved configuration of a project | A regex/INI parser in `tools/` | `pio project config --json-output` | PlatformIO's own parser is the only thing that knows the merge rules; a hand-rolled reader would reproduce the traps it is meant to catch |
| Deriving the environment name for a new homework | A convention in the plan's prose | `envNames(id)` in `tools/lib/discover.mjs` | Already exists and is already the single source of that rule [VERIFIED: `tools/lib/discover.mjs:94-97`] |
| Reading the physical flash size | A firmware print of `board_upload.flash_size` | `esptool.py flash_id` | The build setting echoes the *configuration*; `flash_id` queries the die. Note the firmware's own `ESP.getFlashChipSize()` is also a real measurement — see Pitfall 4 |
| A generate → drift-check guard for `VERSIONS.md` | A new drift mechanism | `tools/generate-workspace.mjs --check`'s byte-comparison idiom, if a guard is ever wanted | Nothing in Phase 2 needs a generated artifact; `VERSIONS.md` is authored, and the established shape is available if that changes |
| A pin/board fact database | Anything now | Phase 4's `shared/hardware/` (`HW-02`) | `D-12` explicitly keeps the RGB-LED pin out of this phase |

**Key insight:** every trap in this phase is a *semantics* trap — merge order, first-match, replace-vs-append — and none of them is visible in a diff. Hand-rolling any part of the reading path would reproduce the trap in the reader instead of catching it in the artifact.

## Common Pitfalls

### Pitfall 1: The missing fragment exits 0 and the environment is empty

**What goes wrong:** `extra_configs` points at a path that does not resolve. PlatformIO reads nothing, and the project silently loses `platform`, `board`, `framework` and every override.
**Why it happens:** `extra_configs` is a glob, and a glob matching nothing is not an error.
**How to avoid:** assert on **content**, never on exit status. Measured on 2026-10-16 with a fragment renamed away:

```
$ pio project config -d …/project-missing
Computed project configuration for …/project-missing
platformio
----------
extra_configs  =  ../../shared/pio/does-not-exist.ini

env:missings3
-------------

EXIT=0
```

The `env:missings3` heading is present and its body is **empty**.
**Warning signs:** `pio run` reporting `ProjectEnvsNotAvailableError` only when the environment is *also* absent; a `pio project config` reading whose env section has fewer lines than `base.ini` has keys.
**Source:** `PITFALLS.md:190` named this trap; this session reproduced it.

### Pitfall 2: Re-declaring `[env]` in the project loses to the fragment, silently

**What goes wrong:** an author overrides one key by adding a second `[env]` block to the project's `platformio.ini`. The value does not change.
**Why it happens:** the fragment's content wins for the same group+option pair.
**How to avoid:** override inside `[env:<id>_s3>]`. State the rule in `base.ini`'s header comment.
**Warning signs:** an edited value that `pio project config` does not reflect.
**Measured:** yes — see Pattern 1.

### Pitfall 3: An env-level `build_flags` replaces the inherited list

**What goes wrong:** `build_flags = -DEXTRA=1` in a project erases the fragment's `-DBOARD_HAS_PSRAM`. PSRAM disappears from the build, and with it every `psramFound()` reading — while the build still succeeds.
**Why it happens:** PlatformIO list options are replaced, not concatenated.
**How to avoid:** `${env.build_flags} -DEXTRA=1`. Measured working: `pio project config` printed `build_flags = -DBOARD_HAS_PSRAM -DEXTRA=1`.
**Warning signs:** a fragment edit that changes nothing; a build whose `firmware.map` no longer references `qio_opi`.
**Source:** `PITFALLS.md:190`; reproduced this session.

### Pitfall 4: The eFuse banner does not carry the flash size — but it does carry the PSRAM size

**What goes wrong:** the acceptance run looks for "16 MB flash" in the connect banner, does not find it, and the reading is either misreported or replaced with the configured value.
**Why it happens:** for ESP32-S3 the flash feature string is built from an eFuse field that encodes **in-package** flash only:

```python
# esptool/targets/esp32s3.py:225-246
    def get_chip_features(self):
        features = ["WiFi", "BLE"]

        flash = {
            0: None,
            1: "Embedded Flash 8MB",
            2: "Embedded Flash 4MB",
        }.get(self.get_flash_cap(), "Unknown Embedded Flash")
        if flash is not None:
            features += [flash + f" ({self.get_flash_vendor()})"]

        psram = {
            0: None,
            1: "Embedded PSRAM 8MB",
            2: "Embedded PSRAM 2MB",
            3: "Embedded PSRAM 16MB",
            4: "Embedded PSRAM 4MB",
        }.get(self.get_psram_cap(), "Unknown Embedded PSRAM")
        if psram is not None:
            features += [psram + f" ({self.get_psram_vendor()})"]

        return features
```

[VERIFIED: `/Users/vloktiev/.platformio/packages/tool-esptoolpy/esptool/targets/esp32s3.py:225-246`]

A WROOM-1 has an *external* flash die, so `get_flash_cap()` is `0` → `None` → **no flash string is emitted**. The PSRAM is in-package, so `get_psram_cap()` is `1` → `Embedded PSRAM 8MB` plus the vendor (`AP_3v3` or `AP_1v8`).

**How to avoid:** the acceptance run records **two** esptool readings:
- the connect banner, for PSRAM: `print(f"Features: {', '.join(esp.get_chip_features())}")` [VERIFIED: `esptool/__init__.py:834-836`];
- `esptool.py --chip esp32s3 -p <port> flash_id`, for flash: `"Detected flash size: %s"` [VERIFIED: `esptool/cmds.py:1306-1308`] against a table in which `0x18: "16MB"` [VERIFIED: `esptool/cmds.py:56`].

**Also available and relevant to the console decision:** the same banner prints `USB mode: …` when the eFuse reports one [VERIFIED: `esptool/__init__.py:837-839` + `esptool/loader.py:1176-1183`], whose values are `"USB-Serial/JTAG"` or `"USB-OTG"`. That line is the eFuse-level evidence bearing on `D-03` and criterion 5's console half.
**Warning signs:** a "Features:" line with only `WiFi, BLE` and no PSRAM entry — that would mean the module is not an R8, and the run's conclusion changes.

### Pitfall 5: A glob that matches nothing is loud; a glob that matches the wrong thing is not

**What goes wrong:** a port pattern accidentally matches an unrelated device.
**Why it happens:** `fnmatch` first-match, no warning, order taken from the device list.
**How to avoid:** keep the pattern narrow (`/dev/cu.usbserial-*`), and take a `pio device list` reading *before* and *after* plugging the board in, so the match set is known rather than assumed.
**Measured, both halves:**
- nothing matches → `Error: Please specify 'upload_port' for environment or use global '--upload-port' option.` then `*** [upload] Explicit exit, status 1`. **Loud.**
- `/dev/cu.*` on this machine → `Serial port /dev/cu.debug-console` then `A fatal error occurred: Could not open …`. **Silent selection, wrong device.**
**Warning signs:** esptool opening a port the operator did not expect; a successful flash with no serial output afterwards (`D-03`'s failure mode).

### Pitfall 6: `monitor_speed` and `pio device monitor`'s baud both default to 9600

**What goes wrong:** the monitor prints garbage from the UART bridge.
**Why it happens:** 9600 is the default in both places; USB CDC ignores baud, the bridge does not.
**How to avoid:** `monitor_speed = 115200` in the fragment, matching `Serial.begin(115200)` in the acceptance vehicle [VERIFIED: `homeworks/project-baseline/src/main.cpp:12`]. `pio device monitor`'s own `-b, --baud` default is also 9600 [VERIFIED: measured 2026-10-16 — `pio device monitor --help`] — the `-d`/`-e` resolution must be exercised, not assumed.
**Warning signs:** garbled output only on the UART socket.

### Pitfall 7: `pio project config` prints a bare `env` section in text mode

**What goes wrong:** an automated check that iterates "every section" mistakes the fragment's `[env]` global for an environment and asserts against it.
**Why it happens:** the text output lists `env` alongside `env:projectbaseline_s3`; the JSON output does **not**.
**How to avoid:** parse `--json-output` and select entries whose name starts with `env:`.
**Measured:** with a fragment present, the text form printed a bare `env` block; the JSON form's top level contained only `["platformio", …]` and `["env:probes3", …]`.

### Pitfall 8: The UART bridge may not enumerate at all on this machine

**What goes wrong:** the board is plugged in and no new `/dev/cu.*` node appears, so the acceptance run cannot start.
**Why it happens:** the DevKitC-1's UART socket goes through a Silicon Labs CP2102N bridge, which on macOS needs a vendor driver; macOS ships `AppleUSBACM.kext` and `AppleUSBCDC.kext` for CDC-ACM devices, which a CP2102N is not [CITED: https://learn.lonelybinary.com/boards/esp32-s3/drivers-on-macos].
**How to avoid:** treat this as the acceptance run's **step zero**, not as an assumption. Diff `pio device list` before and after plugging in; if nothing appears, check System Information → USB before concluding anything about the board. The documented remedies are installing the Silicon Labs CP210x VCP driver, allowing the extension in Privacy & Security, and rebooting.
**Measured on this machine:** no `com.silabs.*` / `SLAB` / `CP210x` kext in `/Library/Extensions`, nothing matching in `kextstat`, and `/Library/DriverExtensions` empty. **This is not proof that no port will appear** — it only removes the possibility that a vendor driver is already installed. See Assumption A4.
**Warning signs:** the board's USB device appears in System Information but no `/dev/cu.*` node is created.

## Runtime State Inventory

**Omitted.** This is not a rename, refactor or migration phase. No string is being renamed, no stored data carries a name this phase changes, and no live service configuration embeds one. The nearest candidate — the literal `platformio.ini` override set moving into `base.ini` — is a single-file edit in a repository whose working tree is clean and whose only consumer is one committed project; `git status --porcelain` was empty before and after this research session's probing.

## Code Examples

### `shared/pio/base.ini` — the fragment (the exact shape that was measured working)

```ini
; Shared N16R8 environment facts. Consumed by every homework through
;   [platformio]
;   extra_configs = ../../shared/pio/base.ini
; NOT a project file: it is never named platformio.ini and declares no environment.
;
; Two traps this comment exists to prevent, both measured rather than assumed:
;   1. A project overrides a key here ONLY by re-declaring it inside its own
;      [env:<id>_s3] section. A second [env] block in the project LOSES silently.
;   2. An env-level `build_flags = -DEXTRA=1` REPLACES this list, dropping
;      -DBOARD_HAS_PSRAM and with it every psramFound() reading. Use
;      `build_flags = ${env.build_flags} -DEXTRA=1` to append.
;
; A missing fragment is not an error: PlatformIO exits 0 and the environment
; comes out empty. Verify with `pio project config`, and read the CONTENT.
;
; The resolved versions these keys resolve to are recorded next to this file,
; in VERSIONS.md.

[env]
platform = espressif32@7.1.3
board = esp32-s3-devkitc-1
framework = arduino

; --- N16R8 module overrides (the stock board definition describes the N8) ---
board_upload.flash_size = 16MB
board_build.partitions = default_16MB.csv
board_build.arduino.memory_type = qio_opi
build_flags = -DBOARD_HAS_PSRAM

; --- Console: the UART bridge, not native USB CDC (D-03) ---
monitor_speed = 115200
upload_port = /dev/cu.usbserial-*
monitor_port = /dev/cu.usbserial-*
test_port = /dev/cu.usbserial-*
```

The key names and values are the ones `homeworks/project-baseline/platformio.ini` carries today [VERIFIED: `homeworks/project-baseline/platformio.ini:16-23`] plus `D-04`'s three port keys; the `[env]` shape and every comment above is the result of this session's measurements.

### `homeworks/project-baseline/platformio.ini` — the consumer

```ini
; Repository baseline — NOT a course homework. See README.md in this directory.
;
; The N16R8 environment facts live in the shared fragment; this file keeps only
; what is specific to this project. The environment name is derived mechanically
; from the directory id by envNames() in tools/lib/discover.mjs.
[platformio]
extra_configs = ../../shared/pio/base.ini

[env:projectbaseline_s3]
```

The `[env:projectbaseline_s3]` header is **required**: measured, a project with only `[platformio] extra_configs` creates no environment and `pio run` dies with `ProjectEnvsNotAvailableError: Please setup environments in platformio.ini file`.

### Criterion 4's assertion — the JSON shape, and the bare-`env` trap

```bash
# The evidence reading. Note it exits 0 even when the fragment is missing,
# so the assertion is over the CONTENT of each "env:<name>" entry.
pio project config -d homeworks/project-baseline --json-output
```

Measured output shape on 2026-10-16 (abridged):

```json
[
  ["platformio", [["extra_configs", ["../../shared/pio/base.ini"]]]],
  ["env:probes3", [
    ["platform", "espressif32@7.1.3"],
    ["board", "esp32-s3-devkitc-1"],
    ["framework", ["arduino"]],
    ["board_upload.flash_size", "16MB"],
    ["board_build.partitions", "default_16MB.csv"],
    ["board_build.arduino.memory_type", "qio_opi"],
    ["build_flags", ["-DBOARD_HAS_PSRAM"]],
    ["monitor_speed", 115200]
  ]]
]
```

Three parsing facts a guard must respect: list-valued options come back as **arrays** (`["arduino"]`, `["-DBOARD_HAS_PSRAM"]`); `monitor_speed` comes back as a **number**, not a string; and the bare `env` section that the text output prints is **absent** from the JSON, so selecting entries whose name begins with `env:` is both correct and sufficient.

### The acceptance run — the command sequence, and the two esptool readings

```bash
export PATH="$HOME/.platformio/penv/bin:$PATH"

# Step 0 — identify the port. Run BEFORE and AFTER plugging into the UART socket.
pio device list                                   # diff the two readings

# Step 1 — build and flash. The connect banner carries the PSRAM feature line.
pio run -d homeworks/project-baseline -t upload
#   expected, among the upload output:
#     Chip is ESP32-S3 (QFN56) (revision v…)
#     Features: WiFi, BLE, Embedded PSRAM 8MB (AP_3v3)
#     USB mode: USB-Serial/JTAG            <- only present when the eFuse reports one

# Step 2 — the flash die. The ONLY reading that names 16 MB, because the module's
#          flash is external and the eFuse "Embedded Flash" field is therefore empty.
esptool.py --chip esp32s3 -p <the matched port> flash_id
#   expected:
#     Manufacturer: 5e
#     Device: 4018
#     Detected flash size: 16MB
#     Flash type set in eFuse: quad (4 data lines)

# Step 3 — the firmware's own report, which is what proves the build enabled PSRAM.
pio device monitor -d homeworks/project-baseline -e projectbaseline_s3
#   expected, from src/main.cpp:
#     baseline: flash=16777216 psram=1 psramSize=8388608
```

`esptool.py` resolves to `~/.platformio/packages/tool-esptoolpy/esptool.py`; invoked with no `-p` it auto-detects a port and, on this machine, silently picks `/dev/cu.debug-console` and fails [VERIFIED: measured 2026-10-16]. Always pass `-p`.

### The negative control — what makes criterion 1's claim falsifiable

Same source, same platform pin, the stock board definition, no overrides:

```bash
pio run -d <a project with only platform/board/framework>
#   Flash: [=         ]   7.0% (used 233109 bytes from 3342336 bytes)
#   and the map references …/tools/sdk/esp32s3/qio_qspi/…
```

With the four overrides, the same build reports:

```bash
pio run -d homeworks/project-baseline
#   Flash: [          ]   3.6% (used 236825 bytes from 6553600 bytes)
#   and the map references …/tools/sdk/esp32s3/qio_opi/libbootloader_support.a
```

`6553600` is `0x640000`; `3342336` is `0x330000`. The two runs link **different prebuilt IDF library sets** (`qio_opi` vs `qio_qspi`) — which is the measured proof that `memory_type` is a library-selection decision, not a stylistic one, and it is the contrast that gives criterion 1 meaning. Both readings were taken through the `extra_configs` indirection on 2026-10-16.

### `shared/pio/VERSIONS.md` — the criterion-3 record

Source command, and why the trimming is not cosmetic:

```bash
pio pkg list -d homeworks/project-baseline        # clean: name + version + required range
pio pkg list -v -d homeworks/project-baseline     # appends /Users/vloktiev/.platformio/platforms/espressif32
```

Measured resolved set for `[env:projectbaseline_s3]` on 2026-10-16:

```
Platform espressif32 @ 7.1.3 (required: espressif32 @ 7.1.3)
├── framework-arduinoespressif32 @ 4.20017.260907+sha.dcc1105b  (required: ~4.20017.0)
├── framework-espidf @ 4.60100.0                               (required: ~4.60100.0)
├── tool-esptoolpy @ 2.41100.260830                            (required: ~2.41100.0)
├── toolchain-xtensa-esp32s3 @ 8.4.0+2021r2-patch5
├── toolchain-xtensa-esp-elf @ 15.2.0+20251204
└── … (tool-cmake, tool-esp-rom-elfs, tool-mkfatfs, tool-mklittlefs, tool-mkspiffs,
      tool-ninja, toolchain-esp32ulp, toolchain-riscv32-esp)
```

Record the output as printed, including the packages the Arduino env does not itself compile against (`framework-espidf`, `toolchain-xtensa-esp-elf`, `toolchain-riscv32-esp` are resolved because the *platform* declares them). Filtering them out is a judgement the record should not make silently — a one-line note that only `framework-arduinoespressif32` and `toolchain-xtensa-esp32s3` are used by the `arduino` framework is the honest form.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| Copy the override set literally into every `platformio.ini` | One `[env]` fragment consumed via `extra_configs` | This phase | Single enforcement point for the version-discipline constraint; a new project cannot forget the console ports |
| Commit a literal device path for `upload_port` | Glob pattern, first-match at run time | This phase (`D-04`) | Portable and public-safe, at the cost of a match that must be verified once on real hardware |
| Copy the raw `pio pkg list -v` output into a document | Trim to name + version in `VERSIONS.md` | This phase (`D-09`) | Keeps machine-local cache paths out of a public repository while preserving reproducibility |
| `lib_extra_dirs` / `globallib_dir` for shared code | `lib_deps = <name>=symlink://…` | Phase 3 | Deprecated since Core 6.0 and slated for removal; not this phase's concern |

**Deprecated/outdated, and deliberately untouched here:**
- **`upload_speed = 460800`.** Present in `STACK.md`'s sketch; absent from the committed baseline, which has been building and flashing without it. Not re-added by this phase.
- **`debug_tool = esp-builtin`.** Deferred by `D-05`, tied to the native-USB decision by the eFuse mutual exclusion.
- **`extends` for profile composition.** `ARCHITECTURE.md` Anti-Pattern 3; `[env]` + `${env.x}` interpolation is the replacement.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| **A1** | `/dev/cu.usbserial-*` (or a documented variant like `/dev/cu.SLAB_USBtoUART`) is the pattern this board will match on this machine. | `D-04`, § Code Examples → `base.ini` | Medium and **self-announcing**: if it is wrong the pattern matches nothing and `pio run -t upload` fails loudly with `Error: Please specify 'upload_port'`. The plan should expect to correct the pattern during the acceptance run and record the correction. Cannot be settled without the board. |
| **A2** | The board will be attached, on the UART socket, for the acceptance run. | § Summary, criteria 2 and 5 | **High.** Measured today: `pio device list` returns only `/dev/cu.debug-console` and `/dev/cu.Bluetooth-Incoming-Port`. If the board stays absent, criterion 2 and criterion 5's console half are unmeetable and must be reported as such rather than inferred. |
| **A3** | The Arduino core's bundled IDF is 4.4.7 and the compile line carries `-DIDF_VER="v4.4.7-dirty"`. | § Standard Stack | Low. Carried from `AGENTS.md`'s measured slice; **not re-measured this session**, because reading it requires a `-v` build. If a project needs it, take the reading in the acceptance plan rather than copying the number. |
| **A4** | No vendor serial driver is installed, and it is **unknown** whether the CP2102N will enumerate without one. | § Common Pitfalls → *Pitfall 8* | Medium. What was measured is the absence of a `com.silabs.*` kext, nothing more. The absence of an installed driver is not evidence that none is needed, and not evidence that one is. The acceptance run's step zero settles it. |
| **A5** | The eFuse `flash_cap` field is 0 on this module, so the connect banner will emit no flash feature string. | § Common Pitfalls → *Pitfall 4* | Low for planning (the plan asks for two readings either way) but it changes what "the pass condition" looks like. If the banner *does* carry a flash string, the run's evidence is strictly stronger, and the reading should be recorded as printed. |
| **A6** | `psramSize` will read 8388608 and `flash` will read 16777216 in the firmware's serial report. | § Code Examples → the acceptance run | Low. Derived from the core's own arithmetic — `2 << (id - 1)` with the 16 MB JEDEC size byte, and the multi-heap total for an 8 MB PSRAM. The exact free/total split may differ by a few bytes because the heap has allocations in it. |
| **A7** | `VERSIONS.md` recorded next to `base.ini` is sufficient for criterion 3's "reproduced from the committed files alone". | § Standard Stack, `D-09` | Low. A fresh clone still needs network to *download* the pinned packages; what the committed files provide is the exact set to reproduce, which is what the criterion asks. |

## Open Questions

1. **Is the board physically available, and when?**
   - What we know: it was not attached at any point during this research; `pio device list` shows two virtual/Bluetooth ports and nothing else. Every L4 step in the repository is unverified for this reason, not for any other.
   - What's unclear: whether the owner can attach it during this phase, which decides whether the phase can complete or only partly complete.
   - Recommendation: **plan for both.** Structure the phase so the offline half lands and is verified regardless, and write the acceptance plan with unfilled output slots rather than a placeholder reading. Do not mark criteria 2/5 met on the strength of a build-only run.

2. **What is the UART bridge's actual `/dev/cu.` name on this machine?**
   - What we know: it is a Silicon Labs CP2102N on the DevKitC-1's UART socket; documented macOS names are `/dev/cu.usbserial-XXXX` and `/dev/cu.SLAB_USBtoUART`; no vendor driver is currently installed here.
   - What's unclear: the driver situation on macOS 27.0.1 and therefore the name — and whether a port appears at all.
   - Recommendation: step zero of the acceptance run, with a documented fallback (`pio run -p <actual port> -t upload`) so a wrong glob does not stop the run; then correct the glob and record both the wrong and the right pattern in the phase log.

3. **Does criterion 1's `qio_opi` clause need the map file, or is the partition size enough?**
   - What we know: the partition-size line (`6553600`) appears in ordinary build output and is already Phase 1's gate; the `qio_opi` evidence lives in `firmware.map` and needs an extra read.
   - What's unclear: nothing technical — this is a choice about how much evidence to gather.
   - Recommendation: gather both. The negative control (`qio_qspi` + `3342336`) is what turns the `qio_opi` reference from a coincidence into a contrast, and it costs one extra build.

4. **Should the criterion-4 assertion be a committed test or a recorded reading?**
   - What we know: `tools/tests/*.test.mjs` currently spawns **no** PlatformIO process — the sweep tests point `PLATFORMIO_CORE` at an unresolvable path deliberately. A test that really runs `pio project config` would be the suite's first such dependency, and would need the same explicit-binary resolution the sweep already implements (`resolvePio`).
   - What's unclear: whether the repository wants a `pio`-dependent unit test before Phase 6 owns the gates.
   - Recommendation: **both, split by what each can see.** A pure-filesystem test in `tools/tests/` asserts the static facts (the fragment exists at the path each project names, and carries the five keys); the PlatformIO *merge* behaviour is evidenced by a recorded `pio project config --json-output` reading in the phase log. This keeps the suite dependency-free while making criterion 4 checkable on content.

5. **Where does the console decision get written for a reader?**
   - What we know: `D-03` names the UART bridge as the default; `homeworks/project-baseline/README.md` currently says the port is unpinned because Phase 2 has not run; the root `README.md:84` already shows `pio device monitor -d homeworks/<id>`.
   - What's unclear: nothing — this is a task, not a question.
   - Recommendation: make the README updates explicit tasks. The baseline README's "Why no console port is pinned" section is now false and must be replaced, not appended to.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---|---|---|
| **ESP32-S3-DevKitC-1 (N16R8)** | ROADMAP criteria 2 and 5's console half | **✗** | — | **None.** This is the phase's physical exit criterion; nothing offline substitutes |
| **USB-serial driver for the CP2102N bridge** | Criterion 2 | **Unknown** | — | Install the Silicon Labs CP210x VCP driver, allow it in Privacy & Security, reboot. Unverified — see A4 |
| PlatformIO Core | Everything | ✓ | 6.2.0 (`~/.platformio/penv/bin/pio`, **not on PATH**) | — |
| `platformio/espressif32` | Build, config | ✓ | 7.1.3 | — |
| Arduino core | Build | ✓ | 2.0.17 (`4.20017.260907+sha.dcc1105b`) | — |
| `tool-esptoolpy` | `flash_id` | ✓ | 2.41100.260830 (esptool 4.11.0) | — |
| `toolchain-xtensa-esp32s3` | Build | ✓ | 8.4.0+2021r2-patch5 | — |
| Node.js | The regression test | ✓ | v26.7.0 | — |
| Network | `pio pkg list` resolution | ✓ offline **for an already-populated `~/.platformio`** | — | A fresh clone needs network to download the pinned packages; the committed files supply the exact set |

**Missing dependencies with no fallback:**
- The physical board. Criteria 2 and 5's console half cannot be met without it, and no reading, download or emulator stands in.

**Missing dependencies with fallback:**
- The serial driver: the documented install/allow/reboot path exists, but whether it is needed here is unverified.

**Note on the sandbox:** every PlatformIO invocation in this session produced `deny network-outbound collector.platformio.org:443`. That is PlatformIO's anonymous telemetry and is irrelevant to every command used here — `pio project config`, `pio pkg list` and the builds all succeeded with it denied, which incidentally demonstrates that the criterion-2/3/4 evidence path needs no network.

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Framework | Node.js built-in test runner (`node --test`), no third-party runner [VERIFIED: `tools/tests/*.test.mjs`] |
| Config file | none — there is no `package.json` in the tracked tree; tests are invoked by glob |
| Quick run command | `node --test "tools/**/*.test.mjs"` — quoted glob is mandatory, unquoted zsh errors on zero matches |
| Full suite command | the same command; there is one suite |
| Phase-gate additions | `node tools/sweep-homeworks.mjs` and `node tools/generate-workspace.mjs --check` |
| Reference cost | 27 tests, `duration_ms 632.8`, exit 0 — measured in `01-05-SUMMARY.md` § 7 |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| HW-01 | The fragment exists at the path every project's `extra_configs` names, and carries `board_upload.flash_size = 16MB`, `board_build.partitions = default_16MB.csv`, `board_build.arduino.memory_type = qio_opi`, `build_flags` containing `-DBOARD_HAS_PSRAM` | unit (pure filesystem) | `node --test tools/tests/env-baseline.test.mjs` | ❌ Wave 0 |
| HW-01 | The build under the fragment reports the 16 MB application partition | integration (builds) | `pio run -d homeworks/project-baseline 2>&1 \| grep -q 6553600` | ✅ (Phase 1's command, reused verbatim) |
| HW-01 | The linked IDF library set is the `qio_opi` variant, and the stock board definition's is not | integration (builds) | `grep -q 'sdk/esp32s3/qio_opi' homeworks/project-baseline/.pio/build/projectbaseline_s3/firmware.map` | ✅ (path exists after a build; `.pio/` is ignored) |
| HW-04 | Every `env:<name>` in `pio project config --json-output` has exactly one `platform` containing `@` and no `#`, and non-empty `upload_port`, `monitor_port`, `test_port` | integration (config read) | `pio project config -d homeworks/project-baseline --json-output` + the assertion in § Code Examples | ❌ Wave 0 |
| HW-04 / criterion 4 | The fragment supplies the ports to a project that declares none, and a project-level override in `[env:<name>]` wins while a re-declared `[env]` does not | manual/recorded | recorded `pio project config` reading in the phase log | ❌ Wave 0 (recorded, not asserted) |
| criterion 1 | The stock board definition yields a different partition size and a different library set | integration (builds, negative control) | a throwaway project outside the repository, built once | ❌ Wave 0 |
| criterion 2 | The esptool banner reports PSRAM 8 MB and `flash_id` reports 16 MB | **manual — physical only** | the § Code Examples sequence | ❌ blocked on hardware |
| criterion 2 | The firmware reports `flash=16777216 psram=1` | **manual — physical only** | `pio device monitor -d homeworks/project-baseline -e projectbaseline_s3` | ❌ blocked on hardware |
| criterion 3 | `VERSIONS.md` names the resolved platform, Arduino core, esptool and toolchain versions | unit (pure filesystem) | `node --test tools/tests/env-baseline.test.mjs` | ❌ Wave 0 |
| criterion 5 | The console choice is settled by measurement | **manual — physical only**, recorded verbatim | the acceptance plan's `SUMMARY.md` | ❌ blocked on hardware |
| criterion 5 | The RGB-LED GPIO is GPIO48 | **owner confirmation, not a measurement** | recorded in the phase log in those words | ✅ decided (`D-12`) |

### Sampling Rate

- **Per task commit:** `node --test "tools/**/*.test.mjs"` — sub-second today; a build is not part of this and stays out of the fast path, consistent with Phase 1's `D-20`/`VERIFY-02`.
- **Per wave merge:** the same suite plus `node tools/sweep-homeworks.mjs` and `node tools/generate-workspace.mjs --check`, and a `pio run -d homeworks/project-baseline` for any wave that touched the fragment or the project config.
- **Phase gate:** the full suite green, the sweep green, the drift check green, `git status --porcelain` empty, and the acceptance plan's evidence slots either filled with verbatim output or explicitly empty and reported as unmet.

### Wave 0 Gaps

- [ ] `tools/tests/env-baseline.test.mjs` — covers HW-01's static half, HW-04's static half, and criterion 3. Pure filesystem; spawns no PlatformIO process, preserving the suite's current dependency-free property.
- [ ] `tools/tests/helpers.mjs` — extend with a fixture that installs a fragment under `<fixture>/shared/pio/` and a consumer under `<fixture>/homeworks/<id>/`, so the "fragment exists at the resolved path" assertion can be tested against a *wrong* path too and shown to fail.
- [ ] Framework install: **none** — `node --test` ships with Node 26.7.0, already the only runtime in use.
- [ ] No fixture may be built, and no test may point PlatformIO at the real repository root — the existing `helpers.mjs` header states the rule and it carries forward.

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1` (`.planning/config.json`). This phase writes configuration, documentation and one test — no network service, no authentication, no user input path.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | **yes** | `JSON.parse` over `pio project config --json-output`; never `eval`, never string-slicing the text form. `spawnSync` with an argv array and no shell, the pattern `tools/sweep-homeworks.mjs` already establishes [VERIFIED: `tools/sweep-homeworks.mjs:137-140`] |
| V6 Cryptography | no | No secret, key or token is introduced. The phase must not *create* one either — see the threat table |
| V14 Configuration / V8 Data Protection | **yes** | Machine-local paths and device identifiers stay out of the public repository: `VERSIONS.md` trims `pio pkg list -v`; the port is a glob, never a literal node or serial number |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| A machine-local toolchain path committed to a public repository | Information disclosure | Record the non-verbose `pio pkg list` form. Measured: the `-v` form appends `/Users/vloktiev/.platformio/platforms/espressif32`; the non-verbose form does not |
| A literal serial device node or USB serial number committed | Information disclosure | The glob pattern (`D-04`). The literal belongs in the phase log's procedure, not in a committed config |
| A port glob that silently matches an unrelated device, so esptool writes to the wrong target | Tampering | Keep the match set to one: a narrow pattern, plus a `pio device list` reading immediately before the flash |
| Blindly feeding tool output into a shell or a template | Tampering / Elevation | Parse the JSON; pass argv arrays; the sweep's `spawnSync(pio, ["run", "-d", dir])` is the established shape, chosen so "a discovered path can never be read as a command" [VERIFIED: `tools/sweep-homeworks.mjs:130-133`] |
| Unpinned platform or package drift between homeworks | Tampering (supply chain) | The exact `platform = espressif32@7.1.3` pin in one fragment; never a range, never `#develop`. Registry-resolved and checksummed by PlatformIO |
| A `psramFound()` reading taken from a build that never enabled PSRAM | Spoofing (of evidence) | The build flag and the reading travel together; `-DBOARD_HAS_PSRAM` must be present in the same environment that produces the report. Measured mechanism: without it, the PSRAM HAL is compiled out entirely |

**No high-severity item is introduced by this phase**, and no `checkpoint:human-verify` is required on security grounds.

## Sources

### Primary (HIGH confidence)

- **Local measurements, 2026-10-16** — every reading below was taken this session, in the repository or in a scratch tree under `$TMPDIR`:
  - `pio --version` → `PlatformIO Core, version 6.2.0`
  - `pio device list` → only `/dev/cu.debug-console` and `/dev/cu.Bluetooth-Incoming-Port`
  - `pio project config -d homeworks/project-baseline` and `--json-output` — the literal override set as PlatformIO resolves it
  - `pio pkg list -d homeworks/project-baseline` and `-v` — the resolved set, and the machine-local path the `-v` form adds
  - `pio project config --lint` → `The "platformio.ini" configuration file is free from linting errors.`
  - `pio device list --json-output`, `pio device monitor --help`, `pio run --help`, `pio run --list-targets`
  - The `extra_configs` probes: `[env]` block inheritance; missing fragment → exit 0 with an empty environment; no `[env:name]` → `ProjectEnvsNotAvailableError`; same-group re-declaration loses; `[env:<name>]` override wins; env-level `build_flags` replaces; `${env.build_flags}` appends
  - The port-glob probes: no match → explicit `Error: Please specify 'upload_port' …`; `/dev/cu.*` → silent first match on `/dev/cu.debug-console`
  - The build contrast: `6553600` + `qio_opi` with the overrides, `3342336` + `qio_qspi` without
  - `esptool.py --chip esp32s3 flash_id` with no `-p` → auto-detects and fails on the debug console
  - Driver inventory: no `com.silabs.*`/`SLAB`/`CP210x` kext; `/Library/DriverExtensions` empty
- **In-repo source, read this session (verbatim quoted above)**
  - `/Users/vloktiev/.platformio/packages/framework-arduinoespressif32/cores/esp32/Esp.cpp:155-163` — `getPsramSize`
  - `…/cores/esp32/Esp.cpp:330-341` — `ESP_getFlashChipId` and `getFlashChipSize`
  - `…/cores/esp32/esp32-hal-psram.h:22-31` — the `BOARD_HAS_PSRAM` guard that `#undef`s `CONFIG_SPIRAM_SUPPORT` / `CONFIG_SPIRAM`
  - `…/cores/esp32/esp32-hal-psram.c:17` — `#if CONFIG_SPIRAM_SUPPORT || CONFIG_SPIRAM`
  - `/Users/vloktiev/.platformio/packages/tool-esptoolpy/esptool/targets/esp32s3.py:225-246` — `get_chip_features`
  - `…/esptool/__init__.py:831-839` — the connect banner prints
  - `…/esptool/cmds.py:1301-1318` — `detect_flash_id` and `flash_id`
  - `…/esptool/cmds.py:49-58` — `DETECTED_FLASH_SIZES`, `0x18: "16MB"`
  - `…/esptool/loader.py:1176-1183` — `get_usb_mode`
  - `/Users/vloktiev/.platformio/platforms/espressif32/platform.json:94-98` — `tool-esptoolpy`
  - Repository files: `homeworks/project-baseline/platformio.ini`, `homeworks/project-baseline/src/main.cpp`, `tools/lib/discover.mjs`, `tools/sweep-homeworks.mjs`, `tools/tests/helpers.mjs`

### Secondary (MEDIUM confidence)

- `[CITED: https://github.com/platformio/platformio-docs/blob/develop/projectconf/sections/platformio/options/generic/extra_configs.rst]` — `extra_configs` accepts patterns; a value from an extra file overwrites the base for the same group+option. Corroborates the same-group measurement
- `[CITED: https://docs.platformio.org/en/latest/projectconf/sections/env/options/upload/upload_port.html]` and `…/monitor/monitor_port.html` — `upload_port` is `String (Pattern)`, `monitor_port` is `String`, `Multiple: No`; the pattern table. The docs do not state multi-match resolution
- `[CITED: https://github.com/platformio/platformio-core/blob/develop/platformio/device/finder.py]` — `match_serial_port` iterates ports and returns on the first `fnmatch` hit, with no warning. Corroborates the `/dev/cu.*` measurement
- `[CITED: https://learn.lonelybinary.com/boards/esp32-s3/drivers-on-macos]`, `[CITED: https://learn.lonelybinary.com/boards/esp32-s3/the-two-usb-c-ports]` — the macOS driver path and the two-socket trade-off behind `D-03`
- `[CITED: https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/get-started/establish-serial-connection.html]` — macOS enumerates the bridge as `/dev/cu.usbserial-XXXX` (an example given is `/dev/cu.usbserial-1401`); `screen … 115200`
- `[CITED: https://github.com/espressif/arduino-esp32/issues/10244]` — a `esp32-s3-devkitc-1` user seeing only `usbserial-110` for the UART socket
- `.planning/research/PITFALLS.md:184-202` and `:526` — the config-layer traps, and the design review that ranked the shared-fragment design last for exactly the two traps re-measured here
- `.planning/research/ARCHITECTURE.md:154-190` and `:416` — one-way `extra_configs` import; project-dir globbing; the override relationship
- `.planning/phases/01-repository-skeleton-and-project-layout/01-05-SUMMARY.md` — the acceptance-run and phase-log precedent

### Tertiary (LOW confidence)

- The `/dev/cu.SLAB_USBtoUART` variant name, and whether macOS 27.0.1 needs the CP210x VCP driver at all. Sources conflict on the driver's default device name; nothing here is verifiable without the board (Assumption A1, A4)
- The exact string the `USB mode:` banner line will print on this board — the code path is verified, the eFuse value is not

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH — every version was re-measured this session with `pio pkg list`, and the one number not re-measured (the bundled IDF 4.4.7) is flagged as Assumption A3.
- **Architecture:** HIGH for the PlatformIO semantics. The merge order, the silent-miss exit code, the replace-vs-append behaviour of `build_flags`, the first-match glob and the environment-creation rule were each reproduced in a scratch tree rather than cited. MEDIUM→LOW for anything requiring the physical board, which is everything behind criteria 2 and 5.
- **Pitfalls:** HIGH — eight pitfalls, of which five were reproduced by direct measurement this session and two more were read in the tools' own source.

**Research date:** 2026-10-16
**Valid until:** ~30 days for the toolchain and the PlatformIO semantics (stable, and pinned anyway). **The physical-board findings have no validity window** — they are simply unmeasured. Re-run the acceptance procedure, not this research, when a board is attached.
