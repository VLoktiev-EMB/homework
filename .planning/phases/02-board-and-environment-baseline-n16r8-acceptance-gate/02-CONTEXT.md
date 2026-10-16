# Phase 2: Board and Environment Baseline (N16R8 Acceptance Gate) - Context

**Gathered:** 2026-10-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers the board-and-environment baseline that every later phase inherits, proven by exactly one physical acceptance run:

- `shared/pio/base.ini` — the shared non-secret config fragment holding the N16R8 environment facts, consumed by every homework through `extra_configs`
- `homeworks/project-baseline/platformio.ini` rewritten to consume that fragment instead of carrying the override set literally
- `shared/pio/VERSIONS.md` — the resolved platform / framework / toolchain versions, written into the repository from `pio pkg list`, so the environment is reproducible from the committed files alone
- the console decision, settled by measurement rather than by documentation: the UART bridge as the repository default, with ports pinned by glob
- **one dated on-hardware acceptance run**: build → flash → monitor, capturing the esptool eFuse banner and `psramFound()`, and settling the console choice
- the RGB-LED GPIO carried as an owner-confirmed board fact (`D-12`), not re-measured in this phase
- the phase log carrying that run's verbatim output

**Explicitly not in this phase:** the native-USB opt-in environment and `debug_tool = esp-builtin` (deferred until a homework needs HWCDC/OTG), `[platformio] build_cache_dir` (deferred until the repo has several homeworks), the `shared/hardware/` machine-readable board facts and the pin-validation check (Phase 4), `[env:native]` and the host test suite (Phase 5), hooks and CI (Phase 6), `docs/` (Phase 4), retiring `homeworks/project-baseline/` (Phase 8).

**Deliberately not imported from the research sketch.** `SUMMARY.md` § Phase 2 lists "one native test → one hook dry run" as part of the acceptance run. In this roadmap those belong to Phase 5 (`[env:native]`) and Phase 6 (hooks), and importing them here would pull three phases' scope into a phase whose exit criterion is physical. The acceptance run in this phase is build → flash → monitor → banner → `psramFound()`, and nothing else.

</domain>

<decisions>
## Implementation Decisions

### Arduino core version (open decision D1)
- **D-01:** The operative answer for this phase is Arduino core **2.0.17** on ESP-IDF 4.4.7 — the core the pinned official platform `espressif32@7.1.3` actually ships, and the one `PROJECT.md` Constraints already name ("Arduino core (2.x) now, ESP-IDF later"). D1 is **not** marked resolved; it is recorded as **deferred with an explicit trigger**: the first course-provided code sample that fails to compile. No blocking question is sent to the instructor, and the phase does not wait on one. — **Reversibility:** costly — choosing 3.x later means leaving the official platform for the `pioarduino` fork, re-pinning every environment, re-recording `VERSIONS.md`, abandoning registry checksum/semver guarantees, and re-opening the `PROJECT.md` Key Decision "Official `platformio/espressif32`, not the pioarduino fork".
- **D-02:** No `#if ESP_ARDUINO_VERSION` compatibility scaffolding is written now. External research (2026-10-16) confirms the mechanism exists (`ESP_ARDUINO_VERSION_VAL`, `ESP_ARDUINO_VERSION_STR`), but authoring conditional compilation against a hypothesis that may never fire is a guess, and shared code is where the cost of a wrong guess compounds.

### Console and console ports
- **D-03:** The repository default console is the **UART bridge**, not native USB CDC. Rationale, from external measurement (2026-10-16): the bridge port belongs to the bridge chip, so it survives reset, crash and deep sleep — exactly the moments the acceptance run reads logs — and it always carries the ROM boot log on UART0; the native USB port is created by the firmware itself and disappears on reset, crash and deep sleep, and needs a post-`Serial.begin()` delay because the host has not enumerated yet. The CDC choice is compiled into the binary, so a socket/setting mismatch produces a board that flashes successfully and prints nothing. — **Reversibility:** costly — the console choice moves every environment's `build_flags`, the pinned ports, and the shape of the recorded acceptance evidence; `STACK.md` additionally notes the native port disappears whenever the firmware touches GPIO19/20 or sleeps.
- **D-04:** Console ports are pinned as a **glob pattern** (`/dev/cu.usbserial-*`), not as a literal device path, for `upload_port`, `monitor_port` and `test_port`. This satisfies ROADMAP criterion 4 — every environment carries its own explicit console port — without committing a machine-specific path into a public repository, which is the constraint that made `D-12` leave the port unpinned in Phase 1. `PITFALLS.md:45` sanctions the glob form explicitly. — **Reversibility:** reversible.
- **D-05:** The native-USB path (`build_flags = -DARDUINO_USB_MODE=1 -DARDUINO_USB_CDC_ON_BOOT=1`) **and** `debug_tool = esp-builtin` are deferred together until a homework genuinely needs HWCDC/OTG. No opt-in environment is created in this phase. Rationale: the "Solo maintenance" constraint makes every added file a cost, `STACK.md` scopes native USB to "a dedicated HWCDC/OTG homework", and on ESP32-S3 the built-in USB Serial/JTAG and USB-OTG on the internal PHY are mutually exclusive by eFuse — so the debug tool travels with that same later decision rather than being adopted early.

### Shared config layer
- **D-06:** `shared/pio/base.ini` is introduced in this phase, realizing the folder `D-11` reserved for Phase 2 and the config layer `ARCHITECTURE.md` designs. It is consumed as `extra_configs = ../../shared/pio/base.ini` from the project's `[platformio]` section, never named `platformio.ini`, and carries no empty section headers. It holds the N16R8 environment facts: `platform`, `board`, `framework`, the four measured overrides, `build_flags = -DBOARD_HAS_PSRAM`, and `monitor_speed`. — **Reversibility:** costly — undoing it re-literalizes the override set into every homework created in the meantime, and the version-discipline constraint loses its single point of enforcement.
- **D-07:** The fragment **also carries the console ports** — `upload_port`, `monitor_port`, `test_port` with the glob from D-04. Consequence to be *measured*, never assumed: an environment then inherits its console instead of declaring it, so criterion 4 becomes true by construction for every future homework (a new project cannot forget it), while the project-level override path stays available. `ARCHITECTURE.md:416` records the relationship as one-way — a project overrides a single key by re-declaring it — and Phase 2 must demonstrate that with `pio project config` rather than trust it. — **Reversibility:** reversible.
- **D-08:** A project needing a different console overrides the single key in its own `platformio.ini`; it does not fork or duplicate the fragment.

### Where facts and evidence live
- **D-09:** The resolved platform, framework and toolchain versions reported by `pio pkg list` are written to **`shared/pio/VERSIONS.md`**, a file next to the pin, referenced from `base.ini` and `README.md`. The content is trimmed to name + version because the raw output carries machine-local cache paths. This is what makes ROADMAP criterion 3's "reproduced from the committed files alone" true for a reader in week 40 — the pin and the resolved set are read from the same place. Deliberately **not** `AGENTS.md`: `D-24` documents a case where a GSD regeneration of that file would revert a correction, so a criterion may not rest on a file the repository does not own. — **Reversibility:** reversible.
- **D-10:** "The phase log" in criterion 5 means the **`SUMMARY.md` of the plan that carries the acceptance run**, per the Phase 1 precedent where `01-05-SUMMARY.md` was "both the plan's deliverable and the evidence the phase's four criteria depend on". Verbatim command output is recorded there, not a paraphrase.
- **D-11:** Both Phase 1 log conventions carry forward unchanged. First, the log is written as late as the assertions allow, because it is itself a new unignored file under a tracked directory — an early write makes the clean-tree reading fail over the log instead of over the thing under test. Second, an observation the agent cannot make gets an **explicitly unfilled output slot**: a plausible-sounding invented observation would enter the phase log as evidence and be read as fact by every later phase.
- **D-12:** The RGB-LED pin is **GPIO48 on this specific board** — owner statement, 2026-10-16. No LED probe is added to the phase: no scratch sketch, no temporary `main.cpp` edit, no new file in the repository. `homeworks/project-baseline/src/main.cpp` stays GPIO-free per Phase 1's `D-14`, and no unverified pin is committed anywhere.

  **Evidence classification — record this distinction, do not blur it.** ROADMAP criterion 5 says the RGB-LED GPIO is "settled by a measurement on this board". It is settled here by **owner confirmation**, which is a different kind of evidence from the measurement the criterion names. The phase log must say so in those words, so the criterion is not credited with an observation that was never made. The console half of criterion 5 *is* settled by measurement — the acceptance run produces it.

  **Re-check trigger:** the first homework that drives GPIO48 as an RGB LED and shows no light. When that fires, the board is a different revision and the pin must be re-established by observation; the fact is then recorded in `shared/hardware/` (Phase 4's `HW-02`). — **Reversibility:** reversible.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase definition and requirements
- `.planning/ROADMAP.md` § Phase 2 — the goal and the five success criteria this phase is measured against
- `.planning/REQUIREMENTS.md` — `HW-01` (every environment overrides the board for N16R8) and `HW-04` (every environment pins the platform exactly, never a range, and names its console port explicitly); the requirement→phase mapping table
- `.planning/STATE.md` — the open-decision list D1, D2, D3, D12 that this phase is the owner of; the "Blockers/Concerns" section
- `.planning/PROJECT.md` § Board — the N16R8 facts (16 MB quad flash, 8 MB octal PSRAM, GPIO35/36/37 consumed by PSRAM, two USB ports); § Constraints — version discipline, public repository, solo maintenance; § Traps for Later Phases — the four obligations that outlive Phase 1

### Carried forward from Phase 1 (do not re-open)
- `.planning/phases/01-repository-skeleton-and-project-layout/01-CONTEXT.md` — `D-11` (`shared/pio/` reserved for Phase 2), `D-12` (the override set this phase inherits, and why no port was pinned), `D-14` (the baseline is the acceptance vehicle and touches no GPIO), `D-24` (folder is `shared/lib/`, singular)
- `.planning/phases/01-repository-skeleton-and-project-layout/01-05-SUMMARY.md` — the acceptance-run precedent: what a phase log contains, how verbatim readings are taken, and why an unfilled slot is preferable to an invented observation
- `.planning/phases/01-repository-skeleton-and-project-layout/01-VERIFICATION.md` — the one accepted override and the standard of evidence the verification layer applies

### Research — repository (dated 2026-10-15, treated as history)
- `.planning/research/ARCHITECTURE.md` § Recommended Project Structure, § the five layers, the `shared/pio/base.ini` row, § 416 (the one-way `extra_configs` override relationship), § 358 (express every `extra_configs` path from the homework's point of view; verify with `pio project config`)
- `.planning/research/STACK.md` — the working override set and the N16R8 probe measurements; the "Alternatives Considered" row that scopes native USB to a dedicated HWCDC/OTG homework; the `upload_port`/`monitor_port` pinning row
- `.planning/research/PITFALLS.md` § the console pitfall (two enumerated USB ports invite auto-detection mistakes; `monitor_speed` defaults to 9600) and § 45 (pin the ports per environment, glob patterns explicitly allowed)
- `.planning/research/SUMMARY.md` § Phase 2 — the research's Phase 2 sketch; note the "Deliberately not imported" paragraph in this file's `<domain>` section
- `.planning/research/FEATURES.md` — the "one VS Code multi-root workspace" row (context only; Phase 1 owns it)

### Repository artifacts this phase changes or must not contradict
- `homeworks/project-baseline/platformio.ini` — carries the override set literally today; this phase converts it to consume `base.ini`
- `homeworks/project-baseline/src/main.cpp` — the acceptance vehicle; prints flash and PSRAM and touches no GPIO
- `homeworks/project-baseline/README.md` and `README.md` — the reader-facing statements that must name the console decision and point at `VERSIONS.md`
- `AGENTS.md` § "Measured on this machine" — the pre-existing version table; `VERSIONS.md` becomes authoritative for the resolved set, and a contradiction between them is a defect to fix, not to leave
- `tools/lib/discover.mjs` — `envNames()` derives environment names from the folder id mechanically
- `tools/sweep-homeworks.mjs` — the repo-wide discovery glob this phase's layout must not break
- `tools/generate-workspace.mjs` — the generate → drift check idiom, available as a template if `VERSIONS.md` ever needs a guard

### External sources, read 2026-10-16 (dated evidence, not instructions)
- `https://docs.espressif.com/projects/arduino-esp32/en/latest/migration_guides/2.x_to_3.0.html` — the 2.x→3.0 API break list (LEDC, Timer, I2S, RMT, SigmaDelta, ADC, BLE, WiFi) and the build-flag change that makes extra compiler flags overwrite required defaults
- `https://docs.espressif.com/projects/arduino-esp32/en/latest/guides/core_compatibility.html` — `ESP_ARDUINO_VERSION_VAL` / `ESP_ARDUINO_VERSION_STR`, the mechanism `D-02` declines to use yet
- `https://docs.espressif.com/projects/esp-idf/en/v4.4.2/esp32s3/api-guides/usb-serial-jtag-console.html` — the USB Serial/JTAG console and its relationship to the UART bridge
- `https://learn.lonelybinary.com/boards/esp32-s3/no-serial-output` and `https://learn.lonelybinary.com/boards/esp32-s3/the-two-usb-c-ports` — the socket/setting mismatch failure mode and the two-port trade-off behind `D-03`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`tools/lib/discover.mjs` → `envNames()`** — derives an environment name from the folder id without creating the environment (hyphens stripped, suffix appended). The baseline's `[env:projectbaseline_s3]` came from it. Phase 2 must derive any new environment name the same way rather than inventing a spelling.
- **`tools/sweep-homeworks.mjs`** — globs `homeworks/*/platformio.ini` only, one level deep, and fails loudly on zero matches. `shared/pio/base.ini` sits outside that glob, which is correct: the fragment is not a homework project.
- **`tools/generate-workspace.mjs --check`** — the repository's generate → drift-check idiom (byte comparison, non-zero exit on drift). Nothing in Phase 2 needs a new generated artifact, but this is the established shape if a check for `VERSIONS.md` drift is ever wanted.
- **`homeworks/project-baseline/`** — the acceptance vehicle, committed by Phase 1 exactly so this phase does not flash a project invented on the spot. It already carries `.gitignore` and `.vscode/extensions.json` (Phase 1's finding that root ignore rules anchored by an interior slash never reach a nested project).
- **The scratch-probe pattern** (`/tmp/pio-n16r8-probe`, referenced by Phase 1's `D-12`) — a throwaway project outside the repository used to measure PlatformIO behaviour without dirtying the tree. `D-12` in this file applies the same pattern to the LED measurement.
- **`git show vl/init:<path>`** — reaches the abandoned scaffold's artifacts without checking out the branch. Useful when the research cites the scaffold as evidence.

### Established Patterns
- **Generate → drift check.** Nothing generated is hand-edited; a byte comparison decides whether the generated artifact is current. Phase 1's first instance is the workspace file.
- **Fail loudly on zero matches.** A gate that built nothing must never exit 0; the single escape hatch is a named flag (`--allow-empty`), never a silent bypass.
- **Exact version pins, never ranges, never `#develop`.** `platform = espressif32@7.1.3` is the current instance; `base.ini` becomes the single enforcement point.
- **One canonical source per artifact.** `base.ini` for the environment facts, `VERSIONS.md` for the resolved versions, the plan's `SUMMARY.md` for the acceptance evidence — no fact stated in two places with two values.
- **Evidence is verbatim, or the slot stays empty.** Phase 1 wrote the acceptance run's command output exactly and left explicitly unfilled slots for the two observations no agent could make.

### Integration Points
- `shared/pio/base.ini` ↔ `pio project config` ↔ ROADMAP criterion 4 — the fragment is only correct if the resolved config prints one exact platform version and an explicit console port per environment.
- `shared/pio/base.ini` ↔ `shared/pio/VERSIONS.md` ↔ ROADMAP criterion 3 — the pin and the resolved set are read together; the reader reproduces the environment from these two files and nothing else.
- `homeworks/project-baseline/src/main.cpp` ↔ the acceptance run ↔ ROADMAP criterion 2 — the serial report is what the monitor captures; `Serial.begin(115200)` must match `monitor_speed = 115200` in the fragment.
- `extra_configs` path arithmetic ↔ every homework's depth ↔ the sweep — the fragment is reached as `../../shared/pio/base.ini` from a project exactly one level below `homeworks/`, which is the same arithmetic the shared-library `symlink://` path uses and the same rule the sweep enforces by name.
- `AGENTS.md` § "Measured on this machine" ↔ `VERSIONS.md` — two statements of resolved versions; `VERSIONS.md` is authoritative for the resolved set and any disagreement is a defect.
- PlatformIO Core is **not** on the interactive PATH (`~/.platformio/penv/bin/pio`); anything that shells out to it resolves the binary explicitly or prints the `export PATH="$HOME/.platformio/penv/bin:$PATH"` remedy.

</code_context>

<specifics>
## Specific Ideas

- **The override set is not cosmetic.** `board_build.arduino.memory_type = qio_opi` decides which prebuilt core library set is linked, so a wrong value is not a stylistic difference — it selects different IDF libraries. Phase 1's probe confirmed `tools/sdk/esp32s3/qio_opi/libesp_hw_support.a` was the one linked.
- **`default_16MB.csv` has to exist in the pinned core.** Phase 1 verified by directory listing that the Arduino core 2.0.17 partition set ships it; `default_4MB.csv` is named in `AGENTS.md` as a trap because it is referenced by another platform's board JSON and does not exist here.
- **The console failure mode is silent, not loud.** A socket/setting mismatch yields a successful flash and no output, with the ROM banner still visible on UART0. This is why the port is pinned rather than auto-detected, and why the console decision is settled by a measurement rather than by documentation.
- **The physical acceptance run is the one thing this phase cannot substitute for.** No amount of reading closes criteria 2 and 5; the eFuse-derived banner and `psramFound()` are the only evidence that the attached module is really an N16R8, and `psramFound()` is only meaningful because the build now enables PSRAM — a firmware that never enabled it cannot report it.
- **`GPIO48` is the RGB-LED pin on this board, by owner confirmation** (`STATE.md` D12, restated 2026-10-16). The phase therefore does not probe it. What the phase must *not* do is describe that as a measurement — see `D-12`'s evidence classification. The pin belongs in `shared/hardware/` with the rest of the board facts, which is Phase 4's `HW-02`, not this phase.
- **`monitor_speed` has a wrong default.** 9600 is PlatformIO's default; the UART bridge prints garbage at that rate while USB CDC ignores baud entirely. `115200` in every environment is not a preference.

</specifics>

<deferred>
## Deferred Ideas

- **`[platformio] build_cache_dir = <repo>/.pio-cache`** — the cross-project object cache `AGENTS.md` recommends, but with the explicit condition "once the repo has several homeworks". There is one today, so it would cache nothing; it belongs with Phase 6's gates or later.
- **Native-USB opt-in environment and `debug_tool = esp-builtin`** — deferred by `D-05` until a homework needs HWCDC/OTG. On ESP32-S3 the eFuse makes USB Serial/JTAG and USB-OTG mutually exclusive, so this decision cannot be split: the env and the debug tool arrive together.
- **The D1 re-check trigger** — the first course-provided code sample that fails to compile. When it fires, the cost is not "change a version number": it is the `pioarduino` fork, every environment's pin, `VERSIONS.md`, and the official-platform Key Decision.
- **The ADC2-while-Wi-Fi conservative stance and the board-revision fact** — `STATE.md` D12 keeps ADC1 GPIO1-10 as the analog range until measured, and the revision fact belongs in `shared/hardware/`, which is Phase 4's `HW-02`.
- **`docs/`** — does not exist until Phase 4; `D-11` deliberately created no placeholder.
- **Retiring `homeworks/project-baseline/`** — it is Phase 1's build proof and this phase's acceptance vehicle; it must be deliberately retired before Phase 8 writes the README index, or it appears there as an unexplained assignment. Recorded in `PROJECT.md` § Traps for Later Phases.
- **"One native test → one hook dry run" from the research's Phase 2 sketch** — Phase 5 (`[env:native]`) and Phase 6 (hooks) own them in this roadmap.
- **A `README.md` for `shared/pio/`** — not decided here; `VERSIONS.md` is. If the folder grows a second file, a short index may be worth it.
- **No todos were reviewed or folded** — `todo.match-phase 2` returned zero matches.

</deferred>

---

*Phase: 2-Board and Environment Baseline (N16R8 Acceptance Gate)*
*Context gathered: 2026-10-16*
