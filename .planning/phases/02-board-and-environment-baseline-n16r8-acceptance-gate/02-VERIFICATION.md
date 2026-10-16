---
phase: 02-board-and-environment-baseline-n16r8-acceptance-gate
verified: 2026-10-16T21:13:58Z
status: passed
score: 21/22 must-haves verified
covered_files: [".planning/phases/02-board-and-environment-baseline-n16r8-acceptance-gate/02-01-PLAN.md", ".planning/phases/02-board-and-environment-baseline-n16r8-acceptance-gate/02-01-SUMMARY.md", ".planning/phases/02-board-and-environment-baseline-n16r8-acceptance-gate/02-02-PLAN.md", ".planning/phases/02-board-and-environment-baseline-n16r8-acceptance-gate/02-02-SUMMARY.md", ".planning/phases/02-board-and-environment-baseline-n16r8-acceptance-gate/02-03-PLAN.md", ".planning/phases/02-board-and-environment-baseline-n16r8-acceptance-gate/02-03-SUMMARY.md", "README.md", "homeworks/project-baseline/README.md", "homeworks/project-baseline/platformio.ini", "shared/pio/VERSIONS.md", "shared/pio/base.ini", "tools/tests/env-baseline.test.mjs", "tools/tests/helpers.mjs"]
covered_digest: "v3:sha256:9a0d7cc99b8fe63679dfedbb41806361e5e5779903790348281b33428759a7f3"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: none
  previous_score: none
  gaps_closed: []
  gaps_remaining: []
  regressions: []
deferred:
  - truth: "ROADMAP criterion 5 — the console-port choice **and the RGB-LED GPIO** are settled by a measurement on this board and recorded in the phase log."
    addressed_in: "Phase 4 (Wiring Pipeline and Pin Safety)"
    evidence: "Phase 4 success criterion 5: '`shared/hardware/` holds the module marking (N16R8), the board revision, the console port, the pin database and the constraint list as machine-readable facts that the pin check actually reads.' Requirement HW-02 names the same fact explicitly: 'shared/hardware/ holds machine-readable board facts: the pin database, the constraint list, the module marking (N16R8), the board revision (initial revision, RGB LED on GPIO48) and the console port.' Phase 4's goal is 'a machine-readable board-fact database'. The console half of criterion 5 IS met in this phase (see truth 20); only the GPIO48 half is carried forward."
human_verification:
  - test: "Decide the MVP user-story framing for this phase (and for every phase in this milestone). ROADMAP.md sets `**Mode:** mvp` on Phases 1-8, but none of their `**Goal:**` lines is in `As a <role>, I want <capability>, so that <outcome>.` form. `gsd_run query user-story.validate` on the Phase 2 goal returns `valid: false` with all three slot errors. Either run `/gsd-mvp-phase 2` to regenerate the goal in canonical form, or accept the story 02-01-PLAN.md derived from the goal text (that plan flags it in its own words: 'Flagged, do not treat as confirmed') and clear `Mode: mvp` for these phases. No User Flow Coverage section is emitted in this report because there is no valid user story to map."
    expected: "A recorded decision: either a reformatted user-story goal, or `Mode: mvp` cleared from the phase headers. Every technical must-have of this phase already passed automated verification, so this decision does not gate the phase's deliverable — it gates the report format the MVP-mode workflow expects."
    why_human: "Whether the derived story is the one the owner wants is not a property of the codebase; no command can decide it. This is the Escalation Gate, not a UAT step."
---

# Phase 2: Board and Environment Baseline (N16R8 Acceptance Gate) — Verification Report

**Phase Goal:** The N16R8 board is proven end-to-end from a pinned, explicitly-ported environment, so every later phase inherits a configuration that really compiles, flashes and reports the physical flash and PSRAM — not the N8 defaults PlatformIO assumes.
**Verified:** 2026-10-16T21:13:58Z
**Status:** human_needed
**Re-verification:** No — initial verification (no prior VERIFICATION.md exists for this phase)

## Method note

The three plan summaries describe the tree as it stood before the code review, and five
findings (CR-01, WR-01, WR-02, WR-03, WR-04) were fixed afterwards on this branch. Every
claim below was therefore re-derived from the current tree, not read from a summary. The
phase's hardware criterion was re-measured live: **the board is still attached**
(`/dev/cu.usbmodem5CBC0287411`, `USB VID:PID=1A86:55D3 SER=5CBC028741`), so all three
recorded criterion-2 readings were independently reproduced rather than taken on trust.

## User Flow Coverage

Not emitted — the MVP user-story guard fails. `gsd_run query user-story.validate` on this
phase's goal returns `valid: false` ("Story must start with 'As a [user role],'…", ", I want
to [capability],…", ", so that [outcome]."). Per `gsd-core/references/verify-mvp-mode.md`
this is surfaced as a discrepancy and escalated (see Human Verification), not answered by
inventing a flow table against a non-story goal. The goal-backward methodology below is
unchanged.

## Goal Achievement

### Observable Truths — ROADMAP contract (non-negotiable)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A clean build links the `qio_opi` memory-type IDF libraries and produces an application partition sized for 16 MB, not the 8 MB default | ✓ VERIFIED | Live `pio run -d homeworks/project-baseline` → `[SUCCESS]`, `Flash: 4.1% (used 268177 bytes from 6553600 bytes)`. Live `grep -c 'sdk/esp32s3/qio_opi' …/firmware.map` → **5629**; `qio_qspi` → 0. Negative control rebuilt from scratch in `$TMPDIR` (stock board, no overrides) → `used 233109 bytes from **3342336** bytes`, map `qio_qspi 5330 / lib 35356 / ld 4586`. Both arms reproduce the recorded figures exactly. |
| 2 | One dated on-hardware acceptance run goes build → flash → monitor, and both the esptool eFuse banner and `psramFound()` report 16 MB flash and 8 MB octal PSRAM | ✓ VERIFIED | Board still attached; all three readings re-taken live and matching the log verbatim. `esptool.py flash_id -p /dev/cu.usbmodem5CBC0287411` → `Features: WiFi, BLE, Embedded PSRAM 8MB (AP_3v3)` … `Detected flash size: 16MB` … `Flash type set in eFuse: quad (4 data lines)`. Serial read after RTS reset → `baseline: flash=16777216 psram=1 psramSize=8386279` — identical to the recorded line, including `psramSize`. Build defines contain `BOARD_HAS_PSRAM`, so the `psram=1` is the build's, not the ROM's. |
| 3 | The resolved platform, framework and toolchain versions from `pio pkg list` are written into the repository | ✓ VERIFIED | `pio pkg list -d homeworks/project-baseline -e projectbaseline_s3` returns exactly the 14 name@version entries in `shared/pio/VERSIONS.md`, no more and no fewer (`espressif32 @ 7.1.3`, `framework-arduinoespressif32 @ 4.20017.260907+sha.dcc1105b`, `tool-esptoolpy @ 2.41100.260830`, `toolchain-xtensa-esp32s3 @ 8.4.0+2021r2-patch5`, …). `grep -c '/Users/\|/opt/\|\.platformio/'` on the record → 0. |
| 4 | `pio project config` shows every environment carrying one exact `platform` version and its own explicit console port — no range, no `#develop`, no unset port | ✓ VERIFIED | Live `pio project config -d homeworks/project-baseline` lists two entries, `env:projectbaseline_s3` and the bare `env` block, and both carry `platform = espressif32@7.1.3` plus non-empty `upload_port`/`monitor_port`/`test_port`. No range operator and no `#` anywhere. |
| 5 | The console-port choice **and the RGB-LED GPIO** are settled by a measurement on this board and recorded in the phase log | ⚠️ PARTIAL — console VERIFIED, GPIO deferred | Console half: live `ls /dev/cu.usbmodem*` → exactly 1 node, `/dev/cu.usbmodem5CBC0287411`; `ls /dev/cu.usbserial*` → 0 nodes. The corrected glob is measurement-backed and the previously committed glob is falsified. GPIO half: recorded as **owner confirmation**, explicitly not a measurement (02-03-SUMMARY.md line 291, and truth 18 below, which is VERIFIED for doing exactly that). The outstanding half is owned by Phase 4 — see **Deferred Items**. Not counted in the score. |

### Observable Truths — plan must-have truths (17 after de-duplication)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 6 | The stock board definition yields a measurably different configuration — 3342336 bytes and `qio_qspi` — so the override set is a library-selection decision, not a coincidence | ✓ VERIFIED | Rebuilt in `$TMPDIR` from a three-key stock env; both figures reproduced exactly (see truth 1). |
| 7 | Every environment carries exactly one platform value that is an exact released version, plus non-empty upload, monitor and test ports inherited from the fragment | ✓ VERIFIED | `pio project config --json-output` — `env:projectbaseline_s3` carries `["platform","espressif32@7.1.3"]` and all three port keys; the bare `env` entry carries the same. |
| 8 | A project that declares the extra-configs key but no environment header of its own fails loudly with `ProjectEnvsNotAvailableError` | ✓ VERIFIED | Fixture built in `$TMPDIR`: `pio run` → `ProjectEnvsNotAvailableError: Please setup environments in "platformio.ini" file`, exit 1. |
| 9 | A fragment that cannot be found is not an error: the reader exits zero and prints an environment with an empty body | ✓ VERIFIED | Fixture with `extra_configs` naming a fragment deleted from the tree → exit **0**, and the fragment contributes no key at all to `env:probes3`. The silent-missing-fragment trap is real and is why the committed gate reads resolved content. |
| 10 | The override relationships are measured in both directions: a project-level key wins; a re-declared second global `[env]` block loses silently; an env-level `build_flags` line replaces the inherited list, while interpolating it first appends | ✓ VERIFIED | All four reproduced live. Project-level `monitor_speed = 9600` → reader reports **9600**. Second bare `[env]` block with `monitor_speed = 9600` and no env header → reader reports **115200** (the fragment won; the project's value appears nowhere, exit 0). Env-level `build_flags = -DEXTRA=1` → `["-DEXTRA=1"]`, `-DBOARD_HAS_PSRAM` **gone**. With `${env.build_flags}` interpolated first → both present, PSRAM first. |
| 11 | The resolved versions are written into the repository beside the pin, trimmed to name and version, with no machine-local package path | ✓ VERIFIED | `shared/pio/VERSIONS.md` is 14 name@version rows + a note naming which packages the arduino framework compiles against; matches `pio pkg list` exactly; the machine-path assertion is a committed test. |
| 12 | A pure-filesystem regression test asserts the fragment exists at the path the extra-configs key names — resolved against a fixture project directory, not by trusting the string — and fails with the resolved path when the fragment is not there | ✓ VERIFIED | `resolveFromProject()` recomputes the path; the test drives three fixture layouts (correct / `wrongPath` / absent) and asserts distinction. Test passes live. |
| 13 | The same test asserts the fragment's four module-override keys and the PSRAM build flag, and that the version record names the resolved platform, Arduino core, uploader and compiler | ✓ VERIFIED | `REQUIRED_FRAGMENT_KEYS` (8 entries incl. the PSRAM flag) + `REQUIRED_RECORD_ENTRIES` (4); each carries its reason string so a drop fails with a why. |
| 14 | The environment assertion compares the platform as a literal exact string — `@` followed by a digit required, branch marker forbidden — iterates every environment, and never selects the bare global section | ✓ VERIFIED | `/@\d/` + `!#.includes("#")`; iterates `[...project.keys()].filter(n => n.startsWith("env:"))` — note the colon, which is what excludes the bare `env` block. Assertion strength is value-level. |
| 15 | The regression suite spawns no PlatformIO process: pure Node, sub-second | ✓ VERIFIED | Live: 7 tests in 36 ms; imports only `node:assert/strict`, `node:fs`, `node:path`, `node:test`, `node:url` and the fixture helpers — no `spawn`. |
| 16 | The baseline README states the settled console decision and the glob it is carried by and no longer declares the port deliberately unset; the repository README shows the shared configuration directory beside the shared library directory and points at the version record | ✓ VERIFIED | Baseline README §"The console: the UART bridge, pinned by glob" states all three required parts — the bridge survives reset/crash/sleep, the glob is not a literal node, a non-matching pattern fails loudly. `grep -c 'Why no console port is pinned'` → 0. Root README's tree block shows `shared/pio/` beside `shared/lib/` with both files named, and links `shared/pio/VERSIONS.md`. Neither README restates a version number (`grep -c '7\.1\.3'` → 0 in both). |
| 17 | The repository conventions file is touched only where a resolved-version fact in it disagrees with the version record, and no new fact or source-of-truth change is introduced there | ✓ VERIFIED | `git log main..HEAD -- AGENTS.md` is empty — never touched on this branch. `grep -c 'CP2102N'` → 0, `grep -c 'usbserial'` → 0, `grep -c 'usbmodem'` → 1: its measured-facts rows already agree with the record, exactly as the plan's condition allows. |
| 18 | The RGB-LED pin fact is recorded as settled by OWNER CONFIRMATION, in those words, and explicitly not described as a measurement | ✓ VERIFIED | 02-03-SUMMARY.md: "is **settled by owner confirmation** and not by a measurement", plus a named re-check trigger ("the first homework that drives that pin as an RGB LED and shows no light"). No probe, no scratch sketch, no source edit was added. |
| 19 | Criterion 2 is stated as met only when both the flash-die reading and the firmware report exist; a build-only run never yields a pass and no slot is filled with a plausible value | ✓ VERIFIED | Both readings exist and both were re-taken live. The log also records two *absences* rather than inferring them (no eFuse flash field; no `USB mode:` line in the upload path), and records the observed `psramSize=8386279` rather than the predicted `8388608`. |
| 20 | The console-port choice is settled by a measurement rather than by documentation: the inventory before and after, the literal node that appeared, and the corrected pattern are all recorded | ✓ VERIFIED | See truth 5. The before/after inventories, the CH343 identity (`1A86:55D3`), the falsified CP2102N assumption and the corrected glob are all in the log; the correction commit is `3bb3f87`. |
| 21 | The criterion-4 recorded reading is in the phase log in both forms, alongside a citation of 02-01's merge-semantics measurements | ✓ VERIFIED | 02-03-SUMMARY.md §"The criterion-4 recorded reading" carries the verbatim text-form reading and cites 02-01's readings one, two and three. **The re-taken correction is present and correct**: the section states that nine of eleven keys are inherited and that `board`/`framework` are declared by the project itself, superseding the pre-fix claim. |
| 22 | The repository porcelain report is empty at both points the phase log requires | ✓ VERIFIED | Recorded twice in the log; `git status --porcelain` is empty now, after all five review-fix commits and the ledger commits. |

**Score:** 21/22 truths verified (0 present, behavior-unverified; 1 deferred)

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Criterion 5's GPIO48 half — the RGB-LED pin settled by observation on this board | Phase 4 | Phase 4 SC 5 names "the board revision … as machine-readable facts that the pin check actually reads"; requirement HW-02 names "the board revision (initial revision, RGB LED on GPIO48)". Phase 4's goal is the machine-readable board-fact database. Informational only — no closure plan required. |

### Advisory (New Scope, Unevidenced)

Not applicable — this is an initial verification, so the convergence evidence gate
(`verifier-evidence-gate.md`) is a no-op. Recorded here as "None checked" rather than
omitted.

| # | Finding | Category | Why Advisory |
|---|---------|----------|--------------|
| — | None | — | Initial verification; no new-scope Step 7 findings were raised. |

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `shared/pio/base.ini` | The single enforcement point: platform pin, four N16R8 overrides, PSRAM flag, monitor speed, three console globs, header naming the measured traps | ✓ VERIFIED | 89 lines, substantive; bare `[env]` block only, no `[env:<name>]` of its own. The header's list-option rule, silent-second-block rule and missing-fragment rule were each re-measured (truths 9, 10). `board`/`framework` correctly absent after CR-01. |
| `homeworks/project-baseline/platformio.ini` | The first consumer: an extra-configs key and a bare env header | ✓ VERIFIED | 27 lines: `[platformio] extra_configs = ../../shared/pio/base.ini` + `[env:projectbaseline_s3]` + `board`/`framework`. The pre-CR-01 shape with `board`/`framework` in the fragment was rebuilt in `$TMPDIR` and a `platform = native` env failed with `Error: Unknown board ID 'esp32-s3-devkitc-1'` — CR-01's stated harm is real, so the fix was necessary. |
| `shared/pio/VERSIONS.md` | The resolved version record, name + version, no machine-local path | ✓ VERIFIED | Matches `pio pkg list` exactly; path assertion passes. |
| `tools/tests/env-baseline.test.mjs` | The phase regression gate, pure Node | ✓ VERIFIED | 338 lines, 7 tests; substantive, wired (run by `node --test "tools/**/*.test.mjs"`), no skips, no stubs. |
| `tools/tests/helpers.mjs` | `makeFragmentConsumer()` fixture builder | ✓ VERIFIED | Substantive; `wrongPath` / `fragment:false` options make the existence assertion falsifiable; called by the gate. |
| `homeworks/project-baseline/README.md` | Settled console decision in the reader's words | ✓ VERIFIED | Section present, old heading removed, states all three required parts. |
| `README.md` | `shared/pio/` beside `shared/lib/` + pointer to the record | ✓ VERIFIED | Tree block lines 49-53; building-section pointer line 93. |
| `homeworks/project-baseline/src/main.cpp` | The acceptance vehicle (one serial report) | ✓ VERIFIED | Prints `flash`/`psram`/`psramSize` at 115200 matching `monitor_speed`; unchanged this phase, exercised live (truth 2). |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `shared/pio/base.ini` | `homeworks/project-baseline/platformio.ini` | the `extra_configs` key, resolved against the project directory | WIRED | Live `pio project config` shows the key and the 9 inherited keys landing in `env:projectbaseline_s3`. |
| `shared/pio/base.ini` | `…/firmware.map` | `memory_type` decides the linked prebuilt library set | WIRED | `qio_opi` 5629 references vs `qio_qspi` 0, live. |
| `homeworks/project-baseline/platformio.ini` | `tools/lib/discover.mjs` | env name derived by `envNames()` | WIRED | `env:projectbaseline_s3` matches `envNames("project-baseline").s3`; the test derives the fixture name the same way. |
| `shared/pio/VERSIONS.md` | `shared/pio/base.ini` | the fragment's header points at the record; the record names what the pin resolved to | WIRED | base.ini line 36-37 → VERSIONS.md; VERSIONS.md line 3 names the fragment. |
| `tools/tests/env-baseline.test.mjs` | `shared/pio/base.ini` | the extra-configs path arithmetic, recomputed from a fixture root | WIRED | Test passes; the misplaced/absent fixtures prove it distinguishes. |
| `README.md` | `shared/pio/VERSIONS.md` | reader-facing pointer | WIRED | Line 93 markdown link. |
| `homeworks/project-baseline/src/main.cpp` | `02-03-SUMMARY.md` | the monitor captures the firmware's one-shot report | WIRED | Live serial read reproduced the log's line byte-for-byte. |
| `shared/pio/base.ini` | the run's observed serial device node | the committed pattern is what the platform resolves at run time | WIRED | `/dev/cu.usbmodem*` matches exactly 1 node — the board's — and nothing else. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `src/main.cpp` | `ESP.getFlashChipSize()`, `psramFound()`, `ESP.getPsramSize()` | the ESP32-S3 runtime HAL, linked from the `qio_opi` core set with `-DBOARD_HAS_PSRAM` | Yes — read live from the board: `16777216 / 1 / 8386279` | ✓ FLOWING |
| `VERSIONS.md` | 14 package rows | `pio pkg list` non-verbose output, trimmed | Yes — byte-identical to the live listing | ✓ FLOWING |
| `base.ini` keys | 11 env keys | project ini + fragment merge, read by PlatformIO's own reader | Yes — `pio project config` resolves all 11 | ✓ FLOWING |

No static fallback, hardcoded literal or mock stands in for any of these.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Baseline builds from the fragment with the 16 MB partition | `pio run -d homeworks/project-baseline` | `[SUCCESS] Took 0.55 seconds`, `from 6553600 bytes` | ✓ PASS |
| Stock board is measurably different (negative control) | `pio run -d "$TMPDIR/…control"` | `[SUCCESS]`, `from 3342336 bytes`; map `qio_qspi 5330` | ✓ PASS |
| The gate suite passes | `node --test tools/tests/env-baseline.test.mjs` | 7 tests, 7 pass, 0 fail, 36 ms | ✓ PASS |
| Whole suite passes | `node --test "tools/**/*.test.mjs"` | 39 tests, 39 pass, 0 fail, 629 ms | ✓ PASS |
| Project-level key wins over the fragment | `pio project config … --json-output` on a fixture | `monitor_speed` → 9600 | ✓ PASS |
| A second global `[env]` block loses silently | same | → 115200 (fragment's value), exit 0 | ✓ PASS |
| Env-level `build_flags` replaces the inherited list | same | `["-DEXTRA=1"]` — PSRAM flag gone | ✓ PASS |
| Interpolating first appends, inherited-first | same | both flags, PSRAM first | ✓ PASS |
| Missing fragment is not an error | same, fragment deleted | exit **0**, fragment contributes nothing | ✓ PASS |
| No env header of its own fails loudly | `pio run` on a header-less fixture | `ProjectEnvsNotAvailableError`, exit 1 | ✓ PASS |
| Flash die and PSRAM banner | `esptool.py --chip esp32s3 -p /dev/cu.usbmodem5CBC0287411 flash_id` | `Embedded PSRAM 8MB (AP_3v3)`; `Detected flash size: 16MB` | ✓ PASS |
| The firmware's own PSRAM report | pyserial read after RTS reset | `baseline: flash=16777216 psram=1 psramSize=8386279` | ✓ PASS |
| The committed glob matches the board and nothing else | `ls /dev/cu.usbmodem*`; `ls /dev/cu.usbserial*` | 1 match / 0 matches | ✓ PASS |

### Probe Execution

Not applicable. No `scripts/*/tests/probe-*.sh` exists, and neither the plans nor the
summaries declare one. The phase's runnable evidence is the build, the gate suite and the
on-hardware readings, all executed above.

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | none declared or conventional | N/A |

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `tools/tests/env-baseline.test.mjs` | HW-01, HW-04, SC 3, SC 4 | 7 | 0 | none | Value (`assert.equal` / `deepEqual` / `deepEqual([])`) + behavioral (three-layout falsification) | PASS |

**Disabled tests on requirements:** 0.
**Circular patterns detected:** 0 — the suite reads the committed files and never generates an expected value by running the system under test; the expected values are literals with reasons.
**Insufficient assertions:** 0 — every requirement-linked assertion is value- or behavioral-level; the resolved-path assertion is exercised against a deliberately wrong and an absent layout, so it is shown to distinguish rather than merely to pass.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| HW-01 | 02-01, 02-02, 02-03 | Every homework environment overrides the board for the N16R8 module — flash size 16 MB, the 16 MB partition table, `qio_opi` memory type, and the PSRAM build flag | ✓ SATISFIED | All four overrides resolve in the only environment the repository has (`env:projectbaseline_s3`), and the override set is proven load-bearing by the reproduced two-arm contrast. Gated by `REQUIRED_FRAGMENT_KEYS`. |
| HW-04 | 02-01, 02-02, 02-03 | Every environment pins the platform to an exact version, never a range, and names its console port explicitly | ✓ SATISFIED | `platform = espressif32@7.1.3` (exact, no range, no `#`), and all three console port keys non-empty; the pin rule is enforced by a committed test, and the port glob is measurement-backed. |

**Orphaned requirements:** none. `REQUIREMENTS.md` maps only HW-01 and HW-04 to Phase 2, and
both appear in the `requirements:` frontmatter of all three plans.

**Not in this phase:** HW-02 and HW-03 are mapped to Phase 4 — they are the reason criterion
5's GPIO half is deferred rather than failed.

### Decision Coverage

All trackable CONTEXT.md decisions are honored by shipped artifacts. — `check.decision-coverage-verify` reports `total: 12, honored: 12, not_honored: []`, blocking `false`.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `tools/tests/env-baseline.test.mjs` | 291-293 | Stale inline comment: "The machine-readable reader reports environments as `env:<name>` entries and does not surface this bare block as one" | ℹ️ Info | **False as measured** — `pio project config --json-output` *does* surface `["env", …]`, and the phase's own log (02-03-SUMMARY.md line 285) records exactly this against `02-RESEARCH.md` Pitfall 7. The code below it is correct regardless (`"env".startsWith("env:")` is false), so nothing is mis-gated; only the comment misleads. No must-have depends on it. |
| `02-01-SUMMARY.md` | 294 and the console `key-decisions` entry | Superseded claims: the fragment "carrying … the board, the framework"; the committed glob named `/dev/cu.usbserial-*` | ℹ️ Info | Both were true when written and both were changed afterwards by CR-01 (`0ca6098`) and the console correction (`3bb3f87`). The authoritative file — 02-03-SUMMARY.md — carries the re-taken reading and states the correction explicitly, and the current tree matches it. Historical per-plan records; no live claim is wrong. |
| — | — | `TBD` / `FIXME` / `XXX`, placeholder, empty implementation, hollow prop | — | None. Zero debt markers in any file this phase touched; the phase's only `return`-shaped construct is `void loop() {}` in the acceptance vehicle, which is correct Arduino. |

No 🛑 Blockers.

### Human Verification Required

#### 1. MVP user-story framing (process escalation, not a UAT step)

**Test:** `gsd_run query user-story.validate --story "<ROADMAP Phase 2 Goal>"` returns
`valid: false` with all three slot errors. Phases 1-8 all carry `**Mode:** mvp` and none of
their goals is in user-story form. Decide: run `/gsd-mvp-phase 2` to regenerate the goal in
canonical form, or accept the story 02-01-PLAN.md derived and clear `Mode: mvp`.

**Expected:** A recorded decision — a reformatted user-story goal, or `Mode: mvp` cleared.

**Why human:** The story guard is a process contract, not a codebase property. The phase's
technical deliverable is fully verified above; what is unresolved is which framing the owner
wants for the report format every phase in this milestone will use.

### Gaps Summary

No gaps. Every ROADMAP success criterion that lies wholly inside this phase is verified
against the current tree, and four of the five were re-measured live rather than read from a
summary — including all three on-hardware readings, which the still-attached board let me
reproduce verbatim (`Detected flash size: 16MB`, `Embedded PSRAM 8MB (AP_3v3)`,
`baseline: flash=16777216 psram=1 psramSize=8386279`). The negative control that makes
criterion 1 a contrast rather than a coincidence was rebuilt from scratch and reproduced its
recorded figures exactly. The phase's stated traps — the silent second `[env]` block, the
list-option replacement, the silent missing fragment — were each re-measured and each holds.
CR-01's justification was falsified-test and holds: the pre-fix fragment shape really does
make a `platform = native` environment fail with `Unknown board ID`.

Status is `human_needed`, not `passed`, for one reason only: the MVP user-story guard fails
and that is a decision the owner has to make, not the verifier. Nothing in the codebase is
incomplete — there are no gaps, no stubs, no unwired links and no debt markers. The single
item not counted as verified is criterion 5's GPIO48 half, which the requirements document
already assigns to Phase 4 and which is therefore recorded as deferred rather than failed.

---

_Verified: 2026-10-16T21:13:58Z_
_Verifier: Claude (gsd-verifier)_
