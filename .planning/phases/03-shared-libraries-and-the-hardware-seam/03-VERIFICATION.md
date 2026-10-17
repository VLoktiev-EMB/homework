---
phase: 03-shared-libraries-and-the-hardware-seam
verified: 2026-10-17T00:36:13Z
status: passed
score: 24/24 must-haves verified
covered_files: [
  ".planning/phases/03-shared-libraries-and-the-hardware-seam/03-01-PLAN.md",
  ".planning/phases/03-shared-libraries-and-the-hardware-seam/03-01-SUMMARY.md",
  ".planning/phases/03-shared-libraries-and-the-hardware-seam/03-02-PLAN.md",
  ".planning/phases/03-shared-libraries-and-the-hardware-seam/03-02-SUMMARY.md",
  ".planning/phases/03-shared-libraries-and-the-hardware-seam/03-03-PLAN.md",
  ".planning/phases/03-shared-libraries-and-the-hardware-seam/03-03-SUMMARY.md",
  "README.md",
  "homeworks/project-baseline/README.md",
  "homeworks/project-baseline/platformio.ini",
  "homeworks/project-baseline/src/main.cpp",
  "shared/lib/README.md",
  "shared/lib/emb_hal/include/emb_hal.h",
  "shared/lib/emb_hal/library.json",
  "shared/lib/emb_hal_arduino/library.json",
  "shared/lib/emb_hal_arduino/src/emb_hal_arduino.c",
  "shared/lib/emb_log/include/emb_log.h",
  "shared/lib/emb_log/library.json",
  "shared/lib/emb_log/src/emb_log.c",
  "shared/pio/VERSIONS.md",
  "tools/check-hal-seam.mjs",
  "tools/tests/check-hal-seam.test.mjs",
  "tools/tests/env-baseline.test.mjs",
  "tools/tests/helpers.mjs"
]
covered_digest: "v3:sha256:154d913be9c669c685d6839aae22ab2ef8729fdac990247a8fb6d795d17399be"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: none
  previous_score: n/a
  gaps_closed: []
  gaps_remaining: []
  regressions: []
deferred:
  - truth: "SHARED-04's commit-time half — a check that FAILS THE COMMIT when a framework include appears under `shared/lib`"
    addressed_in: "Phase 6"
    evidence: "Phase 6 success criterion 1: 'Each fast check — format, lint, diagram lint, pin check, render drift and seam grep — is reachable from pre-commit, demonstrated by planting one violation per check and seeing the offending hook named and the commit refused.' (VERIFY-02). All three of this phase's plans declare any pre-commit hook out of scope; 03-VALIDATION.md carries `nyquist_compliant: false` for exactly this reason and records it as its one escalated row."
---

# Phase 3: Shared Libraries and the Hardware Seam Verification Report

**Phase Goal:** As a course student maintaining one public coursework repository, I want to consume reusable modules as real PlatformIO libraries through live symlinked dependencies, with no framework include above a narrow HAL seam, so that pure logic is testable on the host and the later ESP-IDF migration is a backend swap rather than a rewrite.
**Verified:** 2026-10-17T00:36:13Z
**Status:** passed
**Re-verification:** No — initial verification

**Mode:** `mvp` (ROADMAP.md). `user-story.validate` on the phase goal → `{"valid": true, "errors": []}`, slots `{role, capability, outcome}` extracted. MVP-mode framing applies.

## User Flow Coverage

User story: «As a course student maintaining one public coursework repository, I want to consume reusable modules as real PlatformIO libraries through live symlinked dependencies, with no framework include above a narrow HAL seam, so that pure logic is testable on the host and the later ESP-IDF migration is a backend swap rather than a rewrite.»

| Step | Expected | Evidence | Status |
|------|----------|----------|--------|
| Put a module under `shared/lib/<Name>/` with a manifest | The directory is a real PlatformIO library carrying `name` and `version` | `shared/lib/emb_hal/library.json`, `shared/lib/emb_log/library.json`, `shared/lib/emb_hal_arduino/library.json`; layout `emb_hal/`=include+manifest, `emb_log/`=include+src+manifest, `emb_hal_arduino/`=src+manifest | ✓ |
| Declare it in one `lib_deps` line | The build resolves that library and its API compiles | `homeworks/project-baseline/platformio.ini:42` (one comma-separated line, three specs). `pio run -d homeworks/project-baseline` → `Dependency Graph \|-- emb_hal @ 0.1.0 \|-- emb_hal_arduino @ 0.1.0 \|-- emb_log @ 0.1.0`, `[SUCCESS]`; `pio pkg list` echoes `(required: symlink://../../shared/lib/…)` for each | ✓ |
| Edit the shared source, rebuild | The next build picks the edit up — no reinstall, no stale copy | Re-measured by this verifier: one `Compiling .pio/build/projectbaseline_s3/lib2e4/emb_log/emb_log.c.o` line, `Linking`, `[SUCCESS]`; `strings firmware.bin` → new literal 1, old literal 0; all four `.pio-link`/`integrity.dat` mtimes unchanged; no `Library Manager: Installing` line; source restored with an asserted empty diff | ✓ |
| Write logic above the seam | It compiles and runs on the host, no board, no framework path | `clang -std=gnu99 -Wall -Wextra -pedantic -Werror -I shared/lib/emb_hal/include -I shared/lib/emb_log/include shared/lib/emb_log/src/emb_log.c <host driver>` → exit 0; run prints `emb-log: hello-host`; the one framework-facing unit refuses: `emb_hal_arduino.c:28:10: fatal error: 'esp32-hal-uart.h' file not found` | ✓ |
| Plant a framework include under `shared/lib` and run the check | Named with its file and line; exit non-zero | `node tools/check-hal-seam.mjs` → `scanned 2 libraries under shared/lib; no framework include found`, exit 0 on the clean tree. Against a planted tree: `check-hal-seam: 1 framework include(s) under shared/lib` / `shared/lib/emb_log/src/x.c:1: Arduino.h`, exit 1 | ✓ |
| Move the consumer one level deeper | The build fails — the depth rule is load-bearing | Three arms re-measured by this verifier on a mirror: **A** `UndefinedEnvPlatformError: Please specify platform for 'projectbaseline_s3' environment`, 0 objects; **B** `Library Manager: Installing symlink://../../shared/lib/emb_hal` then ``PackageException: Can not create a symbolic link for `../../shared/lib/emb_hal`, not a directory``, exit 1, 0 objects; **C** `[SUCCESS]`, 49 objects, Flash `258985 from 6553600` | ✓ |
| **Outcome** — "pure logic is testable on the host and the later ESP-IDF migration is a backend swap rather than a rewrite" | Both halves observably true | Host-testability is the step-4 measurement above. The backend-swap half: `shared/lib/emb_hal/include/emb_hal.h` names no framework header (only `<stdbool.h>`), so a second backend directory is the whole IDF migration; the named exemption list in `tools/check-hal-seam.mjs:74` is the single line that changes, and `shared/lib/README.md:71-73` states it | ✓ |

## Goal Achievement

### Observable Truths

Merged must-haves: the five ROADMAP success criteria (which are the contract and are non-negotiable) plus every truth declared in the three PLAN frontmatters, deduplicated. `R#` = ROADMAP criterion, `P##-#` = plan truth ordinal.

| # | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1 | `shared/lib/` holds exactly three library directories, each with a `library.json` declaring `name` (byte-identical to its directory name) and a non-empty `version`; the layout split holds (`emb_hal` include/ no src/, `emb_hal_arduino` src/ no include/, `emb_log` both) (R1, P01-1, P02-6) | ✓ VERIFIED | `ls shared/lib/*/` → `emb_hal/: include library.json`, `emb_hal_arduino/: library.json src`, `emb_log/: include library.json src`. Test *every shared library carries a manifest whose name and version hold, and the layout split does too* passes and is falsified by three fixtures (omitted version, wrong-case name, absent manifest) |
| 2 | The homework build resolves all three through live symlinked dependencies: one command from the root builds green and the dependency report echoes all three `symlink://` specs (R1, P01-2) | ✓ VERIFIED | `pio run -d homeworks/project-baseline` → `[SUCCESS]`, Dependency Graph names all three at `0.1.0`; `pio pkg list -d …` → `(required: symlink://../../shared/lib/emb_hal)`, `…/emb_hal_arduino)`, `…/emb_log)` |
| 3 | The three libraries displace nothing: the built firmware still reports the 6553600-byte N16R8 application partition (P01-3) | ✓ VERIFIED | `pio run` → `Flash: [ ] 4.0% (used 258985 bytes from 6553600 bytes)` |
| 4 | Editing a shared library's source and rebuilding recompiles exactly one translation unit; the new literal is in the linked image and the old absent; the installed pointer files' mtimes are unchanged and no install line is printed (R2, P01-5) | ✓ VERIFIED (behaviorally re-measured) | See User Flow Coverage step 3. The `.pio/libdeps/projectbaseline_s3/` entries are `.pio-link` JSON records, not copied trees |
| 5 | `shared/lib/` is pure C — no translation unit under it is C++; the one unit allowed to see the framework is `emb_hal_arduino`, and its refusal to compile on the host is the measured proof the seam is real (P01-4, SHARED-03) | ✓ VERIFIED (behaviorally re-measured) | Only `.c` files under `shared/lib/`; `git ls-files shared/lib` lists two `.c` and four `.h`/`.json`. Backend host compile → `fatal error: 'esp32-hal-uart.h' file not found`, exit 1 |
| 6 | The framework-free modules compile and link on the host with no framework header on the include path (P01-6) | ✓ VERIFIED (behaviorally re-measured) | See User Flow Coverage step 4 |
| 7 | Two C standards are in force and recorded rather than guessed: `gnu99` for every `.c` under `shared/lib/` and `gnu++11` for the shim, read from the framework's own build script, with the `gnu99` ceiling stated (P01-7) | ✓ VERIFIED | `~/.platformio/packages/framework-arduinoespressif32/tools/platformio-build-esp32s3.py:45` → `"-std=gnu99"`, `:50` → `"-std=gnu++11"`; `shared/pio/VERSIONS.md:42-50` records both and states the ceiling |
| 8 | One home per fact: the rule in `shared/lib/README.md`; the measured standards in `shared/pio/VERSIONS.md`; the per-library `lib_deps` choice recorded with the transitive `dependencies` alternative and its cost (P01-8) | ✓ VERIFIED | `shared/lib/README.md` §"The language rule", §"Layout", §"The manifest invariants", §"The C++ guard rule", §"The seam rule", §"Consumption", §"The measured alternative", §"The C standard" |
| 9 | The reader-facing statements agree with the mechanism: the root README and the baseline README name the `symlink://` consumption line (P01-9) | ✓ VERIFIED | `README.md:63-67`; `homeworks/project-baseline/README.md:31-38` |
| 10 | A framework include planted anywhere under `shared/lib` is named with its file and line and the check exits non-zero (R3, P02-1) | ✓ VERIFIED (behaviorally re-measured) | See User Flow Coverage step 5. Cases *a framework include planted under the shared tree is named and refused* and *the quoted include form is caught as well as the angled one* both active |
| 11 | The check matches include paths, never substrings: the Arduino HAL prefix is caught, while a third-party header whose name merely contains the framework's is left alone (P02-2) | ✓ VERIFIED | `tools/check-hal-seam.mjs:90-99` — `base === "Arduino.h"`, `esp_`/`esp32-hal-` prefixes, `driver/`/`freertos/` subpaths; cases *the Arduino HAL prefix is caught, which the platform prefix does not cover* and *a third-party header whose name merely contains the framework's is left alone* both active |
| 12 | The exemption is the single named backend directory and nothing else — the same include in the exempt directory is passed over, and the same include in a near-miss directory is reported (P02-3) | ✓ VERIFIED | `ALLOWED = ["emb_hal_arduino"]`, applied at the first level by exact name; cases *the exemption is exactly one directory, named literally, and nothing else*, *the exempt backend directory passes the same include over*, *renaming the backend to a near-miss makes the check name the include* all active |
| 13 | A tree holding no library — and a tree with no `shared/lib` at all — makes the check exit non-zero with a named message (P02-4) | ✓ VERIFIED (behaviorally re-measured) | `node tools/check-hal-seam.mjs --root <empty tree>` → `check-hal-seam: scanned 0 libraries under shared/lib` / `A gate that checked nothing must not exit 0.`, exit 1 |
| 14 | A clean tree makes the check exit zero **and say what it scanned** (P02-5) | ✓ VERIFIED (behaviorally re-measured) | `scanned 2 libraries under shared/lib; no framework include found`, exit 0 |
| 15 | Every library directory carries a `library.json` whose `name` equals its directory name, whose `version` is a non-empty string, and which carries no install-time `scripts` key; a fixture omitting any one is reported (P02-6) | ✓ VERIFIED | `manifestProblems()` at `tools/tests/check-hal-seam.test.mjs:316-376` asserts all three over the real tree and is turned red by three falsifying fixtures (`omitVersionIn`, `wrongNameIn`, `omitManifest`) |
| 16 | The consumer's dependency key declares exactly three live-path specs on one line; each left-hand side is byte-identical to that library's manifest name, and each path is the two-parent form relative to the project directory (P02-7) | ✓ VERIFIED | `consumerProblems()` at `:391-462`; real-tree case passes; `specs: [emb_hal]` and `specs: null` fixtures both turn it red |
| 17 | Edges — adjacency, empty, encoding, ordering: near-miss names are distinct entries and a manifest-less directory is reported, not merged or skipped; an absent `version` key turns the assertion red naming the file without crashing; the name comparison is byte equality, never case-folded or trimmed; the report is sorted by path then line so two runs are byte-identical (P02-8..P02-10) | ✓ VERIFIED | Cases *the manifest assertion turns red on an omitted version, a mismatched name and an absent manifest*, *the report is stable and sorted across runs*, and the near-miss case at `:196`; the mutation matrix in `03-02-SUMMARY.md` records each mutation caught by exactly its own case |
| 18 | Consumer edges — an absent key and a one-spec key each turn the assertion red naming the missing spec (never a crash); the comparison is as written (no normalisation) and splits on the comma and each entry's **first** equals sign (P02-11..P02-12) | ✓ VERIFIED | `tools/tests/check-hal-seam.test.mjs:407-431`; case *the consumer assertion turns red on a short dependency line and on an absent key* active |
| 19 | No tracked file uses the deprecated global-library directives as a configuration key or an assignment; the only survivors are prose mentions in the reviewed literal exception list (R4, P03-1) | ✓ VERIFIED | Case *no tracked file uses a deprecated global-library directive, and only the reviewed list names one* passes over `git ls-files --cached`; falsified by the planted-use arm at `:755-795`. `REQUIREMENTS.md` and `AGENTS.md` are unmodified |
| 20 | The literal mechanism ROADMAP criterion 5 describes is measured on a mirrored tree rather than asserted (P03-2) | ✓ VERIFIED (behaviorally re-measured) | Arms re-run by this verifier — see User Flow Coverage step 6. Arm A contradicts the criterion's stated location; the divergence is recorded, not smoothed over |
| 21 | The criterion's own failure — the library installer refusing to create the symlinked dependency — is reproduced by correcting the fragment path alone, non-zero, with no object file compiled (R5, P03-3) | ✓ VERIFIED (behaviorally re-measured) | Arm B above; 0 objects |
| 22 | A third arm with both paths corrected builds successfully — the control that shows the deeper failure is path arithmetic, not a prohibition on depth (P03-4) | ✓ VERIFIED (behaviorally re-measured) | Arm C above; exit 0, `[SUCCESS]`, 49 objects, Flash `258985 from 6553600` |
| 23 | `ROADMAP.md` records the divergence rather than smoothing it over: criterion 5's wording describes what was measured, criterion 3's note records the implemented include set and both reasons, criterion 4's note records the use-not-mention reading, and the Phase 1 retiring trigger no longer describes the unmodified deeper copy as failing to resolve the dependency (P03-5) | ✓ VERIFIED | `ROADMAP.md:48-49` (retiring trigger), `:108` (criterion 3), `:111` (criterion 4), `:112,114` (criterion 5) |
| 24 | The corrections are scoped edits: every other phase entry, criterion and plan list in `ROADMAP.md` is byte-identical, so no phase entry was destroyed (P03-6) | ✓ VERIFIED | `git show 689d306 --numstat` → `+7/−2`, the only deletions being the two sentences replaced; 8 phase headings intact; roadmap otherwise untouched on this branch |

**Score:** 24/24 truths verified (0 present, behavior-unverified). Every behavior-dependent truth was re-measured by this verifier in its own process rather than accepted from a SUMMARY.

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | `SHARED-04`'s commit-time half — a check that **fails the commit** when a framework include appears under `shared/lib` | Phase 6 | Phase 6 criterion 1 names "seam grep" among the fast checks reachable from pre-commit, demonstrated by planting a violation and seeing the hook named and the commit refused (`VERIFY-02`) |

All three of this phase's plans declare any pre-commit hook out of scope (`03-01-PLAN.md:171`, `03-02-PLAN.md:138`, `03-03-PLAN.md:116`), and `03-02-PLAN.md:88,146` and `03-03-PLAN.md:68` name Phase 6 / `VERIFY-02` as the owner specifically. `03-VALIDATION.md` carries `nyquist_compliant: false` for this one reason and records it as its single escalated row. The deferral is legitimate and specifically evidenced.

**Judgement on the `Complete` mark, as requested.** The deferral is legitimate as engineering; the `Complete` mark on `SHARED-04` nevertheless **overstates that requirement's literal wording**, which says "A check fails the commit if a framework include appears under `shared/lib`". Nothing invokes the check today — there is no `.pre-commit-config.yaml`, no `.github/`, and no other caller anywhere in the tree. ROADMAP criterion 3 was deliberately written without the commit clause ("is named by the seam check, which exits non-zero on it"), so the **phase contract is met** while the **requirement text is not**. The owner may wish to annotate `SHARED-04` (rather than un-mark it) to say what the SUMMARYs already say: delivered as a detector, enforced in Phase 6.

### Required Artifacts

All 21 artifacts declared across the three plans pass `verify.artifacts` (14 + 4 + 3, `all_passed: true`, no `issues`).

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `shared/lib/emb_hal/library.json` | name + version only, no build section | ✓ VERIFIED | `{"name":"emb_hal","version":"0.1.0"}` |
| `shared/lib/emb_hal/include/emb_hal.h` | the seam: C ABI, `extern "C"`, no framework header, no pin/UART/bridge identity | ✓ VERIFIED | 56 lines; includes only `<stdbool.h>`; both guards present; four declarations |
| `shared/lib/emb_hal_arduino/library.json` | the backend's manifest | ✓ VERIFIED | name, version, `frameworks: ["arduino"]` |
| `shared/lib/emb_hal_arduino/src/emb_hal_arduino.c` | the single framework-touching unit; C-callable UART + clock | ✓ VERIFIED | 55 lines; `esp32-hal-uart.h`, `esp32-hal.h`, `uartBegin`/`uartWriteBuf`/`uartWrite`/`millis`; real implementation, not a stub |
| `shared/lib/emb_log/library.json` | the pure-logic manifest | ✓ VERIFIED | `{"name":"emb_log","version":"0.1.0"}` |
| `shared/lib/emb_log/include/emb_log.h` | public C interface + `EMB_LOG_LINE_MAX` | ✓ VERIFIED | three functions, both guards |
| `shared/lib/emb_log/src/emb_log.c` | bounded assembly through the seam; explicit drop-and-report-false decision | ✓ VERIFIED | 67 lines; bounded `emb_log_append`, tag owned in source, drop path at `:55-57` |
| `homeworks/project-baseline/platformio.ini` | one comma-separated `lib_deps` line, three symlinked specs | ✓ VERIFIED | `:42` |
| `homeworks/project-baseline/src/main.cpp` | thin C++ shim printing through the seam | ✓ VERIFIED | 34 lines; `#include <Arduino.h>`, `#include "emb_log.h"`, one `emb_log_line` call |
| `shared/lib/README.md` | language and layout contract, enforcement stated honestly | ✓ VERIFIED | 125 lines, "wiring it into a gate is a later phase's to do" |
| `shared/pio/VERSIONS.md` | the two measured C standards beside the platform pin | ✓ VERIFIED | §"The two C standards in force" |
| `README.md` | repository-level statement of how shared code is consumed | ✓ VERIFIED | `:58-68` |
| `homeworks/project-baseline/README.md` | the same statement beside its build section | ✓ VERIFIED | `:26-47` |
| `tools/check-hal-seam.mjs` | the seam gate: path-matching walk, named exemption, zero-library refusal, entry-point guard | ✓ VERIFIED | 225 lines; `ALLOWED`; `import.meta.url === pathToFileURL(...)` guard |
| `tools/tests/check-hal-seam.test.mjs` | the regression gate: 19 cases | ✓ VERIFIED | 19 `test(` cases; `makeSharedLibTree` imported, not forked |
| `tools/tests/helpers.mjs` | the fixture builder + spawn wrapper, beside the existing consumers | ✓ VERIFIED | `makeSharedLibTree`, `runSeamCheck`, `sections`, `sharedLibSpec`, `NEAR_MISS_BACKEND` all exported |
| `.planning/ROADMAP.md` | the dated corrections | ✓ VERIFIED | four blockquotes; scoped `+7/−2` |

### Key Link Verification

13/13 links verified (`verify.key-links`: 5 + 5 + 3, `all_verified: true`).

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `homeworks/project-baseline/platformio.ini` | `shared/lib/emb_hal/library.json` | `lib_deps` LHS resolved against the project directory | WIRED | Pattern found; `pio pkg list` echoes the spec and the resolved name |
| `homeworks/project-baseline/src/main.cpp` | `shared/lib/emb_log/include/emb_log.h` | direct include from the C++ shim | WIRED | Pattern found; links clean because of the `extern "C"` guard |
| `shared/lib/emb_log/src/emb_log.c` | `shared/lib/emb_hal/include/emb_hal.h` | the only call the pure-logic module makes | WIRED | Pattern found; host compile proves it resolves |
| `shared/lib/emb_hal_arduino/src/emb_hal_arduino.c` | `shared/lib/emb_hal/include/emb_hal.h` | the backend implements the seam's four functions | WIRED | Pattern found |
| `shared/lib/emb_hal/include/emb_hal.h` | `shared/lib/README.md` | header states the ABI, README states the rule | WIRED | Pattern found |
| `tools/check-hal-seam.mjs` | `shared/lib` | scan root from the script's own location, `--root` override | WIRED | Pattern found; runs correctly from an unrelated cwd |
| `tools/tests/check-hal-seam.test.mjs` | `tools/check-hal-seam.mjs` | spawn of the real script against a throwaway fixture | WIRED | `runSeamCheck` |
| `tools/tests/helpers.mjs` | `tools/tests/check-hal-seam.test.mjs` | the fixture builder and spawn wrapper | WIRED | `makeSharedLibTree` |
| `tools/check-hal-seam.mjs` | `shared/lib/emb_hal_arduino` | the named exemption list | WIRED | `ALLOWED` |
| `tools/tests/check-hal-seam.test.mjs` | `homeworks/project-baseline/platformio.ini` | the manifest-name assertion reads the consumer file | WIRED | `BASELINE_INI` |
| `tools/tests/check-hal-seam.test.mjs` | `.planning/ROADMAP.md` | the scan asserts the state criterion 4 claims | WIRED | directive scan |
| `homeworks/project-baseline/platformio.ini` | `.planning/ROADMAP.md` | the two project-relative paths the deeper copy stops resolving | WIRED | arms A/B/C reproduce the arithmetic the wording derives from |
| `.planning/ROADMAP.md` | `03-03-SUMMARY.md` | each recorded divergence cites a reading | WIRED | four blockquotes, each citing a reading |

**One link is deliberately orphaned rather than broken:** `tools/check-hal-seam.mjs` is invoked by no hook, no CI job and no sweep. That is the SHARED-04 deferral recorded above — `03-02-SUMMARY.md` D7 and `03-03-SUMMARY.md` D5 both set `human_judgment: true` and hand the classification here, and the plan's own truth text scopes it correctly ("the check's verdict, not a commit gate, because nothing invokes it until Phase 6 wires it").

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `tools/check-hal-seam.mjs` | `{libraries, hits}` | `readdirSync`/`readFileSync` walk of `<root>/shared/lib` | Yes — my planted-include probe produced `shared/lib/emb_log/src/x.c:1: Arduino.h`, exit 1; the clean tree produced a counted report | ✓ FLOWING |
| `tools/tests/check-hal-seam.test.mjs` | `manifestProblems`, `consumerProblems`, `directiveProblems` | real tree + fixtures spawned from the same module | Yes — each predicate is run against both arms; three fixtures turn the manifest predicate red, two the consumer predicate, one the directive predicate | ✓ FLOWING |
| `homeworks/project-baseline/src/main.cpp` | `report` | `ESP.getFlashChipSize()`, `psramFound()`, `ESP.getPsramSize()` at runtime | Yes — the linked image carries the module tag and reads the live runtime values (a fixed report would not track the partition size) | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| The full repository suite is green | `node --test "tools/**/*.test.mjs"` | 58 tests, 58 pass, 0 fail (~0.65 s) | ✓ PASS |
| The baseline builds from the repository root | `pio run -d homeworks/project-baseline` | `[SUCCESS]`; Dependency Graph names all three libraries; `Flash: 4.0% (used 258985 bytes from 6553600 bytes)` | ✓ PASS |
| The seam check passes on the clean tree | `node tools/check-hal-seam.mjs` | `scanned 2 libraries under shared/lib; no framework include found`, exit 0 | ✓ PASS |
| The seam check refuses a planted include | `node tools/check-hal-seam.mjs --root <fixture with <Arduino.h>>` | `shared/lib/emb_log/src/x.c:1: Arduino.h`, exit 1 | ✓ PASS |
| The seam check refuses an empty tree | `node tools/check-hal-seam.mjs --root <empty shared/lib>` | `scanned 0 libraries under shared/lib` + the refusal line, exit 1 | ✓ PASS |
| Pure logic runs on the host | `clang -std=gnu99 -Wall -Wextra -pedantic -Werror -I … -I … emb_log.c <driver> && ./hostdemo` | `emb-log: hello-host` | ✓ PASS |
| The framework-touching unit cannot cross to the host | `clang -std=gnu99 … -c emb_hal_arduino.c` | `fatal error: 'esp32-hal-uart.h' file not found`, exit 1 | ✓ PASS |
| Live-edit propagation | edit `EMB_LOG_TAG`, `pio run`, `strings`, restore | one `Compiling …/emb_log/emb_log.c.o`; new literal 1 / old 0; pointer mtimes unchanged; no install line; restore diff empty | ✓ PASS |
| A specific case passes | `node --test -t "the exemption is exactly one directory, named literally, and nothing else" tools/tests/check-hal-seam.test.mjs` | covered by the suite run above | ✓ PASS |

### Probe Execution

No probe scripts are declared by any plan or implied by the success criteria (`find scripts -path '*/tests/probe-*.sh'` → none; no `probe-` reference in any PLAN/SUMMARY). **Step 7c: not applicable.**

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
| --------- | ---------- | ------ | ------- | -------- | --------------- | ------- |
| `tools/tests/check-hal-seam.test.mjs` | SHARED-01..04 | 19 | 0 | 0 | Behavioral (spawned exit status + named output; fixtures shown to turn red) | PASS |
| `tools/tests/env-baseline.test.mjs` | SHARED-01 (VERSIONS.md) | 7 | 0 | 0 | Value | PASS |
| `tools/tests/{discover,generate-workspace,ignore-rules,sweep}.test.mjs` | earlier phases | 32 | 0 | 0 | Behavioral | PASS |

**Disabled tests on requirements:** 0 — no `test.skip`/`it.skip`/`.todo`/`.pending` anywhere under `tools/tests/`.
**Circular patterns detected:** 0 — the fixture builder writes *inputs* and spawns the check as a separate process; no expected value is generated by the system under test.
**Insufficient assertions:** 0 — the seam cases assert named output, exact exit status, and literal expectation strings, and `03-02-SUMMARY.md`'s mutation matrix records each deliberate break caught by exactly the case written to catch it.

### Decision Coverage

`check.decision-coverage-verify` → `{skipped: false, blocking: false, total: 12, honored: 12, not_honored: []}` — *"All trackable CONTEXT.md decisions are honored by shipped artifacts."* Non-blocking; recorded for drift tracking.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| SHARED-01 | 03-01, 03-02 | `shared/lib/<module>/` holds one real PlatformIO library per module, each with a `library.json` carrying name and version | ✓ SATISFIED | Truths 1, 15. Three manifests; the build resolves all three as libraries at `0.1.0`; the suite asserts name==dirname, non-empty version and no `scripts` key, and is falsified on each |
| SHARED-02 | 03-01, 03-02, 03-03 | Homework projects consume them through `lib_deps = <name>=symlink://../../shared/lib/<name>` — one line per library, including transitive ones | ✓ SATISFIED | Truths 2, 3, 4, 16, 18. One comma-separated line with all three specs (the transitive `emb_hal` entry explicitly present); live propagation measured; the consumer assertion reads the real file and is falsified on a short line and an absent key |
| SHARED-03 | 03-01, 03-02 | Shared code contains no Arduino or ESP-IDF includes; hardware is reached only through a narrow HAL interface, so the later IDF migration is a backend swap | ✓ SATISFIED | Truths 5, 6, 11, 12. `emb_hal` and `emb_log` name no framework header at all; the single backend directory is the only framework-touching unit and is excluded from `include/` by the layout split; the seam check enforces the boundary by exact directory name. **Reading note:** the requirement's first clause, taken alone, is contradicted by its own second clause — "a backend swap" presupposes a backend that touches the framework. Under the only internally consistent reading (no framework include *above the seam*) the requirement holds, and the check plus its 19-case suite is the enforcement. Recorded rather than glossed, because the same literal-vs-intent gap is what SHARED-04 exhibits. |
| SHARED-04 | 03-01, 03-02, 03-03 | A check **fails the commit** if a framework include appears under `shared/lib` | ⚠️ PARTIAL — detector half SATISFIED, commit-failure half **deferred to Phase 6** | Truths 10-14. The detector exists, is falsified class by class, refuses an empty tree, and names file and line. Nothing invokes it: no `.pre-commit-config.yaml`, no `.github/`, no other caller in the tree. Deferred item 1 above; the `Complete` mark overstates the literal wording. |

**Orphaned requirements:** none. `REQUIREMENTS.md` maps exactly `SHARED-01..04` to Phase 3, and every one is claimed by at least one plan's `requirements:` field.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | `TBD` / `FIXME` / `XXX` debt markers | ℹ️ Info | None found in any phase-modified file (grep over all 17) |
| — | — | `TODO` / `HACK` / `PLACEHOLDER` and stub phrases | ℹ️ Info | None found |
| `tools/check-hal-seam.mjs` | 111 | `return []` on a missing directory | ℹ️ Info | Not a stub — documented behaviour ("a missing directory yields an empty list rather than throwing"), and the zero-library branch converts it into a loud refusal |
| `tools/tests/helpers.mjs` | 258 | `return []` for `undefined` | ℹ️ Info | Not a stub — `asList()` normalising an absent option |
| `shared/lib/emb_log/include/emb_log.h` | 25-29 | `EMB_LOG_LINE_MAX` published as the caller's buffer size while the caller's real text budget is 86 chars | ⚠️ Warning | `03-REVIEW.md` WR-01, disposition `open`. Latent: today's report is 50 chars and fits, so nothing is dropped. Does not fail a must-have truth |
| `homeworks/project-baseline/src/main.cpp` | 31 | `emb_log_line`'s return value discarded | ⚠️ Warning | `03-REVIEW.md` WR-02, disposition `open`. A dropped report is indistinguishable from a delivered one |
| `tools/check-hal-seam.mjs` | 90-99 | matcher recognises one Arduino-core header name and five framework prefixes | ⚠️ Warning | `03-REVIEW.md` WR-03, disposition `open`. The seam can break through a route the matcher does not model — the sufficiency gap `03-02-SUMMARY.md` flags as its assumption 1 |
| `shared/lib/README.md` | 47 | "No gate in this repository checks it today" while this phase's own suite asserts `version` | ⚠️ Warning | `03-REVIEW.md` WR-04, disposition `open`. Defensible ("gate" = a hook or CI job, and the suite is neither) but ambiguous as written |
| `shared/lib/emb_hal_arduino/src/emb_hal_arduino.c` | 44 | four unexplained `uartBegin` literals | ⚠️ Warning | `03-REVIEW.md` WR-05, disposition `open` |
| `.planning/ROADMAP.md` | 108 | criterion 3's correction cites "17 cases" for a suite that now holds 19 | ℹ️ Info | Stale by 2 — plan 03-03 added the directive cases to the same file after plan 03-02 wrote that sentence. `03-VALIDATION.md` correctly says 19 |

The eight remaining `03-REVIEW.md` info findings (IN-01..IN-08) are open and unblocking; IN-01 (the root README's repository map omits `tools/check-hal-seam.mjs`) is the most reader-visible. **No finding reached blocker.**

**Re-verification evidence gate:** not applicable — `is_re_verification = false` on this pass.

### Human Verification Required

N/A — infrastructure/foundation phase with no user-facing elements. The phase ships shared libraries, a lint script and build tooling; every success criterion is command-verifiable, and each was verified by command above. No truth was left ⚠️ PRESENT_BEHAVIOR_UNVERIFIED: every behavior-dependent truth (live-edit propagation, host compilation, the backend's host refusal, and all three depth arms) was re-measured in this verifier's own process rather than accepted from a SUMMARY, so the infrastructure-phase carve-out applies on its own terms. No non-inferable (`verification: backstop`) truth is declared by this phase, so no abstention item arises.

### Gaps Summary

None. Twenty-four of twenty-four merged must-haves verified; all 21 artifacts pass at the existence, substantive, wiring and data-flow levels; all 13 key links verified; 58/58 tests pass with no disabled or circular cases; no debt markers; 12/12 CONTEXT decisions honored.

The phase's one shortfall is a **traceability** issue, not a build or behaviour gap: `SHARED-04` is marked `Complete` while its literal wording — "a check fails the commit" — is not delivered. The detector is real, falsified and refuses loudly, but nothing invokes it. That wiring is Phase 6's by explicit roadmap assignment (`VERIFY-02`, whose success criterion names "seam grep" among the pre-commit checks), all three plans declare pre-commit hooks out of scope, and `03-VALIDATION.md` already carries `nyquist_compliant: false` and one escalated row for exactly this. The deferral is legitimate and is recorded in the `deferred` list; the recommendation is to annotate `SHARED-04` to reflect "delivered as a detector, enforced in Phase 6" rather than to reopen the phase.

One smaller piece of drift worth a later tidy: `ROADMAP.md:108` cites the seam suite as 17 cases where it now holds 19.

---

_Verified: 2026-10-17T00:36:13Z_
_Verifier: Claude (gsd-verifier)_
