---
phase: 03-shared-libraries-and-the-hardware-seam
verified: 2026-10-17T07:14:52Z
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
covered_digest: "v3:sha256:5dbb9f2e7ff58b4f79beada5a5b516ce804b6e54212e0b3d16f0d63623826174"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: passed
  previous_score: 24/24
  gaps_closed: []
  gaps_remaining: []
  regressions: []
  trigger: "covered-input fingerprint went stale — 2 files in the previous covered set changed after the previous run"
deferred:
  - truth: "SHARED-04's commit-time half — a check that FAILS THE COMMIT when a framework include appears under `shared/lib`"
    addressed_in: "Phase 6"
    evidence: "Phase 6 success criterion 1: 'Each fast check — format, lint, diagram lint, pin check, render drift and seam grep — is reachable from pre-commit, demonstrated by planting one violation per check and seeing the offending hook named and the commit refused.' (VERIFY-02). All three of this phase's plans declare any pre-commit hook out of scope; 03-VALIDATION.md carries `nyquist_compliant: false` for exactly this reason and records it as its one escalated row."
---

# Phase 3: Shared Libraries and the Hardware Seam Verification Report

**Phase Goal:** As a course student maintaining one public coursework repository, I want to consume reusable modules as real PlatformIO libraries through live symlinked dependencies, with no framework include above a narrow HAL seam, so that pure logic is testable on the host and the later ESP-IDF migration is a backend swap rather than a rewrite.
**Verified:** 2026-10-17T07:14:52Z
**Status:** passed
**Re-verification:** Yes — regenerated after a covered-input fingerprint change, not after a gap closure

**Mode:** `mvp` (ROADMAP.md). `user-story.validate` on the phase goal → `{"valid": true, "errors": []}`, slots `{role, capability, outcome}` extracted. MVP-mode framing applies.

**Why this run happened.** The prior report's `covered_digest` was `v3:sha256:154d913b…` over a 23-file set. Two files in that set changed afterwards, in commit `cb18a75` ("docs(shared): explain how the seam is joined and how to swap the framework"), so the digest no longer described the tree it claimed to cover:

| File | Change | Commits after the prior run |
| ---- | ------ | --------------------------- |
| `homeworks/project-baseline/README.md` | +8 lines — a new paragraph on the link-time join | `cb18a75` |
| `shared/lib/README.md` | +77/−4 — the seam-join mechanism and a four-step framework swap | `cb18a75` |

Both are in the covered set and both were re-read as they now stand. Nothing in the previous report was carried forward unexamined: the summary sections below re-derive each status from this run's own measurements, and the one finding that the changed text produced is recorded under Anti-Patterns. Four other commits landed in the window too (`ba3e618`, `27e2607`, `db2899c`, `2a058c8`) but touch only planning documents — `ROADMAP.md`, `REQUIREMENTS.md`, `PROJECT.md`, `STATE.md`, `03-VERIFICATION.md` and `03-SECURITY.md` — none of which is a source input to a must-have truth.

**Coverage decision on `03-SECURITY.md`.** Excluded from the covered set. It is a verification report over the phase's own threat register — an output of the same class as `03-REVIEW.md` and `03-VALIDATION.md`, both of which the prior report also excluded — not an input any must-have truth depends on. The register itself *is* covered: all three PLAN files carry the parseable `<threat_model>` blocks that `03-SECURITY.md` audits, and all three PLANs are in the covered set (the fingerprint command adds them automatically). Its verdict, read for completeness: `status: verified`, `threats_open: 0`, 13 register rows plus the supply-chain row, all `closed`.

## User Flow Coverage

User story: «As a course student maintaining one public coursework repository, I want to consume reusable modules as real PlatformIO libraries through live symlinked dependencies, with no framework include above a narrow HAL seam, so that pure logic is testable on the host and the later ESP-IDF migration is a backend swap rather than a rewrite.»

| Step | Expected | Evidence | Status |
|------|----------|----------|--------|
| Put a module under `shared/lib/<Name>/` with a manifest | The directory is a real PlatformIO library carrying `name` and `version` | `shared/lib/emb_hal/library.json`, `shared/lib/emb_log/library.json`, `shared/lib/emb_hal_arduino/library.json`; layout `emb_hal/`=include+manifest, `emb_log/`=include+src+manifest, `emb_hal_arduino/`=src+manifest | ✓ |
| Declare it in one `lib_deps` line | The build resolves that library and its API compiles | `homeworks/project-baseline/platformio.ini:42` (one comma-separated line, three specs). `pio run -d homeworks/project-baseline` → `Dependency Graph \|-- emb_hal @ 0.1.0 \|-- emb_hal_arduino @ 0.1.0 \|-- emb_log @ 0.1.0`, `[SUCCESS]`; `pio pkg list` echoes `(required: symlink://../../shared/lib/…)` for each | ✓ |
| Edit the shared source, rebuild | The next build picks the edit up — no reinstall, no stale copy | Re-measured by this verifier: one `Compiling .pio/build/projectbaseline_s3/lib2e4/emb_log/emb_log.c.o` line, `Linking`, `[SUCCESS]`; `strings firmware.bin` → new literal (`zz-probe`) 1, old literal (`emb-log`) 0; all four `.pio-link`/`integrity.dat` mtimes unchanged at `1792195848`; no `Library Manager: Installing` line; source restored with an asserted empty diff and the tree back to clean | ✓ |
| Write logic above the seam | It compiles and runs on the host, no board, no framework path | `clang -std=gnu99 -Wall -Wextra -pedantic -Werror -I shared/lib/emb_hal/include -I shared/lib/emb_log/include shared/lib/emb_log/src/emb_log.c <host seam stub> <driver>` → exit 0; run prints `emb-log: hello-host`; the one framework-facing unit refuses: `emb_hal_arduino.c:28:10: fatal error: 'esp32-hal-uart.h' file not found` | ✓ |
| Plant a framework include under `shared/lib` and run the check | Named with its file and line; exit non-zero | `node tools/check-hal-seam.mjs` → `scanned 2 libraries under shared/lib; no framework include found`, exit 0 on the clean tree. Against a planted tree: `check-hal-seam: 1 framework include(s) under shared/lib` / `shared/lib/emb_log/src/x.c:1: Arduino.h`, exit 1 | ✓ |
| Move the consumer one level deeper | The build fails — the depth rule is load-bearing | Three arms re-measured by this verifier on a mirror: **A** `UndefinedEnvPlatformError: Please specify platform for 'projectbaseline_s3' environment`, 0 objects; **B** `Library Manager: Installing symlink://../../shared/lib/emb_hal` then ``PackageException: Can not create a symbolic link for `../../shared/lib/emb_hal`, not a directory``, exit 1, 0 objects; **C** exit 0, `[SUCCESS]`, 49 objects, Flash `258985 from 6553600` | ✓ |
| **Outcome** — "pure logic is testable on the host and the later ESP-IDF migration is a backend swap rather than a rewrite" | Both halves observably true | Host-testability is the step-4 measurement above. The backend-swap half: `shared/lib/emb_hal/include/emb_hal.h` names no framework header (only `<stdbool.h>`), so a second backend directory is the whole IDF migration; the named exemption list in `tools/check-hal-seam.mjs:74` is the single line that changes, and `shared/lib/README.md` §"Swapping the framework" now writes the four steps out; the matcher already recognises the `driver/` subpath that an IDF backend would include (`tools/check-hal-seam.mjs:96`) | ✓ |

## Goal Achievement

### Observable Truths

Merged must-haves: the five ROADMAP success criteria (which are the contract and are non-negotiable) plus every truth declared in the three PLAN frontmatters, deduplicated. `R#` = ROADMAP criterion, `P##-#` = plan truth ordinal.

| # | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1 | `shared/lib/` holds exactly three library directories, each with a `library.json` declaring `name` (byte-identical to its directory name) and a non-empty `version`; the layout split holds (`emb_hal` include/ no src/, `emb_hal_arduino` src/ no include/, `emb_log` both) (R1, P01-1, P02-6) | ✓ VERIFIED | `ls shared/lib/*/` → `emb_hal/: include library.json`, `emb_hal_arduino/: library.json src`, `emb_log/: include library.json src`. Test *every shared library carries a manifest whose name and version hold, and the layout split does too* passes and is falsified by three fixtures (omitted version, wrong-case name, absent manifest) |
| 2 | The homework build resolves all three through live symlinked dependencies: one command from the root builds green and the dependency report echoes all three `symlink://` specs (R1, P01-2) | ✓ VERIFIED | `pio run -d homeworks/project-baseline` → `[SUCCESS]`, Dependency Graph names all three at `0.1.0`; `pio pkg list -d …` → `(required: symlink://../../shared/lib/emb_hal)`, `…/emb_hal_arduino)`, `…/emb_log)` |
| 3 | The three libraries displace nothing: the built firmware still reports the 6553600-byte N16R8 application partition (P01-3) | ✓ VERIFIED | `pio run` → `Flash: [ ] 4.0% (used 258985 bytes from 6553600 bytes)`; RAM `18380 from 327680` |
| 4 | Editing a shared library's source and rebuilding recompiles exactly one translation unit; the new literal is in the linked image and the old absent; the installed pointer files' mtimes are unchanged and no install line is printed (R2, P01-5) | ✓ VERIFIED (behaviorally re-measured) | See User Flow Coverage step 3. The `.pio/libdeps/projectbaseline_s3/` entries are `.pio-link` JSON records, not copied trees |
| 5 | `shared/lib/` is pure C — no translation unit under it is C++; the one unit allowed to see the framework is `emb_hal_arduino`, and its refusal to compile on the host is the measured proof the seam is real (P01-4, SHARED-03) | ✓ VERIFIED (behaviorally re-measured) | Only `.c` files under `shared/lib/`; `git ls-files shared/lib` lists two `.c` and four `.h`/`.json`. Backend host compile → `fatal error: 'esp32-hal-uart.h' file not found`, exit 1 |
| 6 | The framework-free modules compile and link on the host with no framework header on the include path (P01-6) | ✓ VERIFIED (behaviorally re-measured) | See User Flow Coverage step 4 |
| 7 | Two C standards are in force and recorded rather than guessed: `gnu99` for every `.c` under `shared/lib/` and `gnu++11` for the shim, read from the framework's own build script, with the `gnu99` ceiling stated (P01-7) | ✓ VERIFIED | `~/.platformio/packages/framework-arduinoespressif32/tools/platformio-build-esp32s3.py:45` → `"-std=gnu99"`, `:50` → `"-std=gnu++11"`; `shared/pio/VERSIONS.md:35-49` records both and states the ceiling |
| 8 | One home per fact: the rule in `shared/lib/README.md`; the measured standards in `shared/pio/VERSIONS.md`; the per-library `lib_deps` choice recorded with the transitive `dependencies` alternative and its cost (P01-8) | ✓ VERIFIED | `shared/lib/README.md` §"The language rule", §"Layout", §"The manifest invariants", §"The C++ guard rule", §"The seam rule", §"Consumption", §"The measured alternative", §"The C standard" — and, added by `cb18a75`, §"How the seam is joined" and §"Swapping the framework" |
| 9 | The reader-facing statements agree with the mechanism: the root README and the baseline README name the `symlink://` consumption line and no longer describe a shared tree that arrives later (P01-9) | ✓ VERIFIED | `README.md:63-67`; `homeworks/project-baseline/README.md:31,38`. Both name the consumption line and describe the tree as present. **One clause of the paragraph `cb18a75` added is imprecise** — see Anti-Patterns W-01; it does not change this truth's declared content |
| 10 | A framework include planted anywhere under `shared/lib` is named with its file and line and the check exits non-zero (R3, P02-1) | ✓ VERIFIED (behaviorally re-measured) | See User Flow Coverage step 5. Cases *a framework include planted under the shared tree is named and refused* and *the quoted include form is caught as well as the angled one* both active |
| 11 | The check matches include paths, never substrings: the Arduino HAL prefix is caught, while a third-party header whose name merely contains the framework's is left alone (P02-2) | ✓ VERIFIED | `tools/check-hal-seam.mjs:90-99` — `base === "Arduino.h"`, `esp_`/`esp32-hal-` prefixes, `driver/`/`freertos/` subpaths; cases *the Arduino HAL prefix is caught, which the platform prefix does not cover* and *a third-party header whose name merely contains the framework's is left alone* both active |
| 12 | The exemption is the single named backend directory and nothing else — the same include in the exempt directory is passed over, and the same include in a near-miss directory is reported (P02-3) | ✓ VERIFIED | `ALLOWED = ["emb_hal_arduino"]` (`:74`), applied at the first level by exact name (`:147`); cases *the exemption is exactly one directory, named literally, and nothing else*, *the exempt backend directory passes the same include over*, *renaming the backend to a near-miss makes the check name the include* all active |
| 13 | A tree holding no library — and a tree with no `shared/lib` at all — makes the check exit non-zero with a named message (P02-4) | ✓ VERIFIED (behaviorally re-measured) | `node tools/check-hal-seam.mjs --root <empty tree>` → `check-hal-seam: scanned 0 libraries under shared/lib` / `A gate that checked nothing must not exit 0.`, exit 1; a root with no `shared/lib` adds `  (there is no directory at shared/lib)` and exits 1 the same way |
| 14 | A clean tree makes the check exit zero **and say what it scanned** (P02-5) | ✓ VERIFIED (behaviorally re-measured) | `scanned 2 libraries under shared/lib; no framework include found`, exit 0 |
| 15 | Every library directory carries a `library.json` whose `name` equals its directory name, whose `version` is a non-empty string, and which carries no install-time `scripts` key; a fixture omitting any one is reported (P02-6) | ✓ VERIFIED | `manifestProblems()` at `tools/tests/check-hal-seam.test.mjs:316-376` asserts all three over the real tree (`:466`, `sharedLibRoot = join(REPO_ROOT, "shared/lib")`) and is turned red by three falsifying fixtures (`omitVersionIn`, `wrongNameIn`, `omitManifest`) |
| 16 | The consumer's dependency key declares exactly three live-path specs on one line; each left-hand side is byte-identical to that library's manifest name, and each path is the two-parent form relative to the project directory (P02-7) | ✓ VERIFIED | `consumerProblems()` at `:391-462`; real-tree case passes; `specs: [emb_hal]` and `specs: null` fixtures both turn it red |
| 17 | Edges — adjacency, empty, encoding, ordering: near-miss names are distinct entries and a manifest-less directory is reported, not merged or skipped; an absent `version` key turns the assertion red naming the file without crashing; the name comparison is byte equality, never case-folded or trimmed; the report is sorted by path then line so two runs are byte-identical (P02-8..P02-10) | ✓ VERIFIED | Cases *the manifest assertion turns red on an omitted version, a mismatched name and an absent manifest*, *the report is stable and sorted across runs*, and the near-miss case at `:196`; the mutation matrix in `03-02-SUMMARY.md` records each mutation caught by exactly its own case |
| 18 | Consumer edges — an absent key and a one-spec key each turn the assertion red naming the missing spec (never a crash); the comparison is as written (no normalisation) and splits on the comma and each entry's **first** equals sign (P02-11..P02-12) | ✓ VERIFIED | `tools/tests/check-hal-seam.test.mjs:407-431`; case *the consumer assertion turns red on a short dependency line and on an absent key* active |
| 19 | No tracked file uses the deprecated global-library directives as a configuration key or an assignment; the only survivors are prose mentions in the reviewed literal exception list (R4, P03-1) | ✓ VERIFIED (behaviorally re-measured) | Both directive cases ran green in this pass: *no tracked file uses a deprecated global-library directive, and only the reviewed list names one* and *the directive scan reports a planted use, and reads the same string in prose as a mention*. `REQUIREMENTS.md` and `AGENTS.md` are unmodified in their directive rows |
| 20 | The literal mechanism ROADMAP criterion 5 describes is measured on a mirrored tree rather than asserted (P03-2) | ✓ VERIFIED (behaviorally re-measured) | Arms re-run by this verifier — see User Flow Coverage step 6. Arm A contradicts the criterion's stated location; the divergence is recorded in `ROADMAP.md`, not smoothed over |
| 21 | The criterion's own failure — the library installer refusing to create the symlinked dependency — is reproduced by correcting the fragment path alone, non-zero, with no object file compiled (R5, P03-3) | ✓ VERIFIED (behaviorally re-measured) | Arm B above; exit 1, `find .pio -name '*.o' → 0` |
| 22 | A third arm with both paths corrected builds successfully — the control that shows the deeper failure is path arithmetic, not a prohibition on depth (P03-4) | ✓ VERIFIED (behaviorally re-measured) | Arm C above; exit 0, `[SUCCESS]`, 49 objects, Flash `258985 from 6553600` |
| 23 | `ROADMAP.md` records the divergence rather than smoothing it over: criterion 5's wording describes what was measured, criterion 3's note records the implemented include set and both reasons, criterion 4's note records the use-not-mention reading, and the Phase 1 retiring trigger no longer describes the unmodified deeper copy as failing to resolve the dependency (P03-5) | ✓ VERIFIED | `ROADMAP.md:48-49` (retiring trigger), `:108` (criterion 3), `:111` (criterion 4), `:113` (criterion 5) — four dated blockquotes, each citing a reading |
| 24 | The corrections are scoped edits: every other phase entry, criterion and plan list in `ROADMAP.md` is byte-identical, so no phase entry was destroyed (P03-6) | ✓ VERIFIED | `git show 689d306 --numstat` → `+7/−2`, the only deletions being the two sentences replaced; `grep -c "^### Phase "` → 8 headings intact; the edit touched no other file |

**Score:** 24/24 truths verified (0 present, behavior-unverified). Every behavior-dependent truth was re-measured by this verifier in its own process rather than accepted from a SUMMARY.

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | `SHARED-04`'s commit-time half — a check that **fails the commit** when a framework include appears under `shared/lib` | Phase 6 | Phase 6 criterion 1 names "seam grep" among the fast checks reachable from pre-commit, demonstrated by planting a violation and seeing the hook named and the commit refused (`VERIFY-02`) |

All three of this phase's plans declare any pre-commit hook out of scope (`03-01-PLAN.md:171`, `03-02-PLAN.md:138`, `03-03-PLAN.md:116`), and `03-02-PLAN.md:88,146` and `03-03-PLAN.md:68` name Phase 6 / `VERIFY-02` as the owner specifically. `03-VALIDATION.md` carries `nyquist_compliant: false` for this one reason and records it as its single escalated row. The deferral is legitimate and specifically evidenced. Re-confirmed this pass: `ls .pre-commit-config.yaml .github .gitlab-ci.yml` → all absent; the only non-test references to `check-hal-seam` anywhere in the tree are its own usage strings, `tools/tests/helpers.mjs:35`, the suite, and the two READMEs that point a reader at it.

**The prior report's recommendation on this item has since been actioned.** Commit `27e2607` added a scope annotation to `SHARED-04` in `REQUIREMENTS.md:31`, stating in the record itself that the row is `Complete` for the detector half only, that "nothing invokes it on commit", and that `VERIFY-02` owns the wiring. The traceability inconsistency the prior report flagged — a `Complete` mark whose literal wording is not delivered and no note saying so — therefore no longer exists. The requirement's literal wording is still not delivered; the record no longer overstates it.

**Judgement, restated for this pass.** The deferral is legitimate as engineering: roadmap criterion 3 was deliberately written without the commit clause ("is named by the seam check, which exits non-zero on it"), so the **phase contract is met** while the **requirement text's commit clause is not**. That is now stated in both `REQUIREMENTS.md` and `03-VALIDATION.md`. No further action is warranted before Phase 6.

### Advisory (New Scope, Unevidenced)

None. No blocker was found in this pass, so the re-verification evidence gate (Step 7) had nothing to adjudicate: there are no carried-forward gaps (the prior status was `passed` with an empty gap list) and no unevidenced new-scope findings to record.

### Required Artifacts

All 21 artifacts declared across the three plans pass `verify.artifacts` in this pass (14 + 4 + 3, `all_passed: true`, no `issues`).

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `shared/lib/emb_hal/library.json` | name + version only, no build section | ✓ VERIFIED | `{"name":"emb_hal","version":"0.1.0"}` |
| `shared/lib/emb_hal/include/emb_hal.h` | the seam: C ABI, `extern "C"`, no framework header, no pin/UART/bridge identity | ✓ VERIFIED | 56 lines; includes only `<stdbool.h>`; both guards present; four declarations (`emb_hal_console_ready`, `emb_hal_init`, `emb_hal_write_line`, `emb_hal_millis`) — which is what the new README's "four declarations" claim rests on |
| `shared/lib/emb_hal_arduino/library.json` | the backend's manifest | ✓ VERIFIED | name, version, `frameworks: ["arduino"]` |
| `shared/lib/emb_hal_arduino/src/emb_hal_arduino.c` | the single framework-touching unit; C-callable UART + clock | ✓ VERIFIED | 55 lines; `esp32-hal-uart.h`, `esp32-hal.h`, `uartBegin`/`uartWriteBuf`/`uartWrite`/`millis`; real implementation, not a stub |
| `shared/lib/emb_log/library.json` | the pure-logic manifest | ✓ VERIFIED | `{"name":"emb_log","version":"0.1.0"}` |
| `shared/lib/emb_log/include/emb_log.h` | public C interface + `EMB_LOG_LINE_MAX` | ✓ VERIFIED | three functions, both guards |
| `shared/lib/emb_log/src/emb_log.c` | bounded assembly through the seam; explicit drop-and-report-false decision | ✓ VERIFIED | 67 lines; bounded `emb_log_append`, tag owned in source, drop path at `:55-57`; `emb_hal_write_line` called at `:65` |
| `homeworks/project-baseline/platformio.ini` | one comma-separated `lib_deps` line, three symlinked specs | ✓ VERIFIED | `:42` |
| `homeworks/project-baseline/src/main.cpp` | thin C++ shim printing through the seam | ✓ VERIFIED | 34 lines; `#include <Arduino.h>`, `#include "emb_log.h"`, one `emb_log_line` call at `:31` |
| `shared/lib/README.md` | language and layout contract, enforcement stated honestly | ✓ VERIFIED | 194 lines; §"The seam rule" still says "wiring it into a gate is a later phase's to do" (`:120`) — accurate; the manifest-invariant text now names the suite that checks `version` (`:89-94`) |
| `shared/pio/VERSIONS.md` | the two measured C standards beside the platform pin | ✓ VERIFIED | §"The two C standards in force" (`:35-49`) |
| `README.md` | repository-level statement of how shared code is consumed | ✓ VERIFIED | `:58-68` |
| `homeworks/project-baseline/README.md` | the same statement beside its build section | ✓ VERIFIED | `:26-54`, including the paragraph `cb18a75` added |
| `tools/check-hal-seam.mjs` | the seam gate: path-matching walk, named exemption, zero-library refusal, entry-point guard | ✓ VERIFIED | 225 lines; `ALLOWED` at `:74`; `import.meta.url === pathToFileURL(...)` guard at `:223` |
| `tools/tests/check-hal-seam.test.mjs` | the regression gate: 19 cases | ✓ VERIFIED | `grep -c '^test('` → 19; `makeSharedLibTree` imported, not forked |
| `tools/tests/helpers.mjs` | the fixture builder + spawn wrapper, beside the existing consumers | ✓ VERIFIED | `makeSharedLibTree`, `runSeamCheck`, `sections`, `sharedLibSpec`, `NEAR_MISS_BACKEND`, `SEAM_CHECK_PATH` all exported |
| `.planning/ROADMAP.md` | the dated corrections | ✓ VERIFIED | four blockquotes; scoped `+7/−2`; 8 phase headings intact |

### Key Link Verification

13/13 links verified (`verify.key-links`: 5 + 5 + 3, `all_verified: true`).

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `homeworks/project-baseline/platformio.ini` | `shared/lib/emb_hal/library.json` | `lib_deps` LHS resolved against the project directory | WIRED | Pattern found; `pio pkg list` echoes the spec and the resolved name |
| `homeworks/project-baseline/src/main.cpp` | `shared/lib/emb_log/include/emb_log.h` | direct include from the C++ shim | WIRED | Pattern found; links clean because of the `extern "C"` guard |
| `shared/lib/emb_log/src/emb_log.c` | `shared/lib/emb_hal/include/emb_hal.h` | the only call the pure-logic module makes | WIRED | Pattern found; host compile proves it resolves |
| `shared/lib/emb_hal_arduino/src/emb_hal_arduino.c` | `shared/lib/emb_hal/include/emb_hal.h` | the backend implements the seam's four functions | WIRED | Pattern found; the include is at `emb_hal_arduino.c:31` — see Anti-Patterns W-01 |
| `shared/lib/emb_hal/include/emb_hal.h` | `shared/lib/README.md` | header states the ABI, README states the rule | WIRED | Pattern found |
| `tools/check-hal-seam.mjs` | `shared/lib` | scan root from the script's own location, `--root` override | WIRED | Pattern found; runs correctly from an unrelated cwd |
| `tools/tests/check-hal-seam.test.mjs` | `tools/check-hal-seam.mjs` | spawn of the real script against a throwaway fixture | WIRED | `runSeamCheck` |
| `tools/tests/helpers.mjs` | `tools/tests/check-hal-seam.test.mjs` | the fixture builder and spawn wrapper | WIRED | `makeSharedLibTree` |
| `tools/check-hal-seam.mjs` | `shared/lib/emb_hal_arduino` | the named exemption list | WIRED | `ALLOWED` |
| `tools/tests/check-hal-seam.test.mjs` | `homeworks/project-baseline/platformio.ini` | the manifest-name assertion reads the consumer file | WIRED | `BASELINE_INI` |
| `tools/tests/check-hal-seam.test.mjs` | `.planning/ROADMAP.md` | the scan asserts the state criterion 4 claims | WIRED | directive scan, both cases green this pass |
| `homeworks/project-baseline/platformio.ini` | `.planning/ROADMAP.md` | the two project-relative paths the deeper copy stops resolving | WIRED | arms A/B/C reproduce the arithmetic the wording derives from |
| `.planning/ROADMAP.md` | `03-03-SUMMARY.md` | each recorded divergence cites a reading | WIRED | four blockquotes, each citing a reading |

**One link remains deliberately orphaned rather than broken:** `tools/check-hal-seam.mjs` is invoked by no hook, no CI job and no sweep. That is the SHARED-04 deferral recorded above — `03-02-SUMMARY.md` D7 and `03-03-SUMMARY.md` D5 both set `human_judgment: true` and hand the classification here, and the plan's own truth text scopes it correctly ("the check's verdict, not a commit gate, because nothing invokes it until Phase 6 wires it").

**New claim in the changed text, independently confirmed.** The paragraph `cb18a75` added to `homeworks/project-baseline/README.md:44-49` asserts a link-time join on the symbol `emb_hal_write_line`. This verifier read the built objects directly rather than taking the prose's word:

```
emb_log.c.o          :          U emb_hal_write_line
emb_hal_arduino.c.o  : 00000000 T emb_hal_write_line
emb_log.c.o          :          U emb_hal_console_ready
emb_hal_arduino.c.o  : 00000000 T emb_hal_console_ready
emb_log.c.o          :          U emb_hal_init
emb_hal_arduino.c.o  : 00000000 T emb_hal_init
```

The undefined/defined pairing across the two objects is exactly the mechanism described. The claim is true.

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `tools/check-hal-seam.mjs` | `{libraries, hits}` | `readdirSync`/`readFileSync` walk of `<root>/shared/lib` | Yes — this pass: clean tree → `scanned 2 libraries … no framework include found`, exit 0; planted tree → `shared/lib/emb_log/src/x.c:1: Arduino.h`, exit 1; empty tree → the refusal line, exit 1 | ✓ FLOWING |
| `tools/tests/check-hal-seam.test.mjs` | `manifestProblems`, `consumerProblems`, `directiveProblems` | real tree (`join(REPO_ROOT, "shared/lib")`) + fixtures spawned from the same module | Yes — each predicate runs against both arms; three fixtures turn the manifest predicate red, two the consumer predicate, one the directive predicate | ✓ FLOWING |
| `homeworks/project-baseline/src/main.cpp` | `report` | `ESP.getFlashChipSize()`, `psramFound()`, `ESP.getPsramSize()` at runtime | Yes — the linked image carries the module tag and reads the live runtime values (a fixed report would not track the partition size); the live-edit probe moved the tag in the image from `emb-log` to `zz-probe` and back | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| The full repository suite is green | `node --test "tools/**/*.test.mjs"` | 58 tests, 58 pass, 0 fail, 0 skipped, 0 todo (~0.66 s) | ✓ PASS |
| The baseline builds from the repository root | `pio run -d homeworks/project-baseline` | `[SUCCESS]`; Dependency Graph names all three libraries at `0.1.0`; `Flash: 4.0% (used 258985 bytes from 6553600 bytes)` | ✓ PASS |
| The seam check passes on the clean tree | `node tools/check-hal-seam.mjs` | `scanned 2 libraries under shared/lib; no framework include found`, exit 0 | ✓ PASS |
| The seam check refuses a planted include | `node tools/check-hal-seam.mjs --root <fixture with <Arduino.h>>` | `shared/lib/emb_log/src/x.c:1: Arduino.h`, exit 1 | ✓ PASS |
| The seam check refuses an empty tree | `node tools/check-hal-seam.mjs --root <empty shared/lib>` | `scanned 0 libraries under shared/lib` + the refusal line, exit 1 | ✓ PASS |
| The seam check refuses a root with no `shared/lib` | `node tools/check-hal-seam.mjs --root <bare root>` | adds `  (there is no directory at shared/lib)`, exit 1 | ✓ PASS |
| Pure logic runs on the host | `clang -std=gnu99 -Wall -Wextra -pedantic -Werror -I … -I … emb_log.c <seam stub> <driver> && ./hostdemo` | exit 0; prints `emb-log: hello-host` | ✓ PASS |
| The framework-touching unit cannot cross to the host | `clang -std=gnu99 … -c emb_hal_arduino.c` | `fatal error: 'esp32-hal-uart.h' file not found`, exit 1 | ✓ PASS |
| Live-edit propagation | edit `EMB_LOG_TAG`, `pio run`, `strings`, restore | one `Compiling …/emb_log/emb_log.c.o`; new literal 1 / old 0; all four pointer mtimes unchanged; no install line; restore diff empty; tree clean | ✓ PASS |
| The link-time join named by the new README text is real | `nm` on both built objects | `U emb_hal_write_line` in `emb_log.c.o`, `T emb_hal_write_line` in `emb_hal_arduino.c.o` (and the same for `emb_hal_console_ready`, `emb_hal_init`) | ✓ PASS |
| The deprecated-directive scan holds and is falsifiable | `node --test tools/tests/check-hal-seam.test.mjs` | *no tracked file uses a deprecated global-library directive…* ✔ and *the directive scan reports a planted use, and reads the same string in prose as a mention* ✔ | ✓ PASS |
| Depth arms reproduce | `pio run -d <mirror>/homeworks/project-baseline/deeper` ×3 | A: `UndefinedEnvPlatformError`, 0 objects. B: `PackageException: Can not create a symbolic link…`, exit 1, 0 objects. C: exit 0, `[SUCCESS]`, 49 objects | ✓ PASS |

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

`check.decision-coverage-verify` did **not** produce a verdict in this pass — `{skipped: true, blocking: false, reason: "CONTEXT.md missing", total: 0, honored: 0}` for every argument form tried (phase number, phase slug, phase directory path with and without a trailing slash). The verb resolves a file named literally `CONTEXT.md`; this install names it `03-CONTEXT.md`. The prior report recorded `{total: 12, honored: 12, not_honored: []}` for the same phase, so the discrepancy is verb-side, not a change in the phase. Rather than carry a number forward that this pass could not reproduce — the phase's own prohibition against recording an unproduced reading — it is reported as not runnable here. A light manual cross-check is consistent with the prior figure: `03-CONTEXT.md` carries 12 `- **D-` decision bullets (D-01..D-14 with gaps, plus D-16, D-20, D-21, D-24), and the shipped artifacts this pass inspected do not contradict any of them.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `homeworks/project-baseline/README.md` | 46 | "`emb_hal_arduino` includes nothing of ours" — the backend's source includes `"emb_hal.h"` at `shared/lib/emb_hal_arduino/src/emb_hal_arduino.c:31` | ⚠️ Warning | **New in `cb18a75` (W-01).** The sentence's load-bearing claim — that the seam is a link-time join and not an `#include` — is correct and was confirmed by `nm` above. The clause is the imprecise one: "nothing of ours" is broader than "does not include `emb_log`", and the backend *does* include the repository-owned seam header, necessarily, to know the signatures. A reader could take away that the backend is independent of the interface. Fix: narrow to the pair the sentence is about, as `shared/lib/README.md:28` already does ("`emb_log.c` never includes the backend, and the backend never includes `emb_log`") |
| `shared/lib/README.md` | 22 | diagram annotation "(defines them — with no #include between the two)" sits on the arrow joining `emb_hal` and `emb_hal_arduino` | ⚠️ Warning | **New in `cb18a75` (W-02).** For the pair the arrow actually connects, the annotation is false — the backend includes `emb_hal.h` at `:31`. The body prose two paragraphs down states the correct pair ("`emb_log.c` never includes the backend, and the backend never includes `emb_log`"), so the document is internally repairable by a reader, but the diagram as drawn says the opposite of the source. Fix: name the pair in the annotation, or move it beside the prose sentence |
| `shared/lib/emb_log/include/emb_log.h` | 25-29 | `EMB_LOG_LINE_MAX` published as the caller's buffer size while the caller's real text budget is 86 chars | ⚠️ Warning | `03-REVIEW.md` WR-01, disposition `open`. Latent: today's report is 50 chars and fits, so nothing is dropped. Does not fail a must-have truth |
| `homeworks/project-baseline/src/main.cpp` | 31 | `emb_log_line`'s return value discarded | ⚠️ Warning | `03-REVIEW.md` WR-02, disposition `open`. A dropped report is indistinguishable from a delivered one |
| `tools/check-hal-seam.mjs` | 90-99 | matcher recognises one Arduino-core header name and five framework prefixes | ⚠️ Warning | `03-REVIEW.md` WR-03, disposition `open`. The seam can break through a route the matcher does not model — the sufficiency gap `03-02-SUMMARY.md` flags as its assumption 1 |
| `shared/lib/emb_hal_arduino/src/emb_hal_arduino.c` | 44 | four unexplained `uartBegin` literals | ⚠️ Warning | `03-REVIEW.md` WR-05, disposition `open`. Carried forward; unchanged by this pass |
| `.planning/ROADMAP.md` | 108 | criterion 3's correction cites "17 cases" for a suite that now holds 19 | ℹ️ Info | Stale by 2 — plan 03-03 added the directive cases to the same file after plan 03-02 wrote that sentence. `03-VALIDATION.md` correctly says 19. Carried forward, still unfixed |
| — | — | `TBD` / `FIXME` / `XXX` debt markers | ℹ️ Info | None found in either file changed by `cb18a75`, nor in any phase-modified file. **No blocker; no debt-marker gate triggered** |
| — | — | `TODO` / `HACK` / `PLACEHOLDER` and stub phrases | ℹ️ Info | None found |
| `tools/check-hal-seam.mjs` | 111 | `return []` on a missing directory | ℹ️ Info | Not a stub — documented behaviour ("a missing directory yields an empty list rather than throwing"), and the zero-library branch converts it into a loud refusal. Re-confirmed by the bare-root probe above |
| `tools/tests/helpers.mjs` | 258 | `return []` for `undefined` | ℹ️ Info | Not a stub — `asList()` normalising an absent option |

**One prior finding is now resolved.** `03-REVIEW.md` WR-04 (prior report: `shared/lib/README.md:47` claimed "No gate in this repository checks it today" while this phase's own suite asserts `version`) **no longer exists**. `cb18a75` rewrote that passage to name the suite, the real-tree assertion and its falsification arm, and to scope it honestly ("the rule is checked, but only where the suite runs", `shared/lib/README.md:89-94`). The claim is accurate: `manifestProblems(SHARED_LIB_ROOT, DEFAULT_SHARED_LIBS)` at `tools/tests/check-hal-seam.test.mjs:466` runs against `join(REPO_ROOT, "shared/lib")`.

The eight remaining `03-REVIEW.md` info findings (IN-01..IN-08) are open and unblocking; IN-01 (the root README's repository map omits `tools/check-hal-seam.mjs`) is the most reader-visible. **No finding reached blocker, and no debt marker of any class was found.**

**Re-verification evidence gate (#3304):** no blocker was raised in this pass, so the gate had nothing to adjudicate. There are no carried-forward gaps (previous status `passed`, empty gap list) and no unevidenced new-scope finding.

### Human Verification Required

N/A — infrastructure/foundation phase with no user-facing elements. The phase ships shared libraries, a lint script and build tooling; every success criterion is command-verifiable, and each was verified by command above. No truth was left ⚠️ PRESENT_BEHAVIOR_UNVERIFIED: every behavior-dependent truth (live-edit propagation, host compilation, the backend's host refusal, and all three depth arms) was re-measured in this verifier's own process rather than accepted from a SUMMARY, so the infrastructure-phase carve-out applies on its own terms. No non-inferable (`verification: backstop`) truth is declared by this phase, so no abstention item arises.

### Gaps Summary

None. Twenty-four of twenty-four merged must-haves verified; all 21 artifacts pass at the existence, substantive, wiring and data-flow levels; all 13 key links verified; 58/58 tests pass with no disabled, skipped or circular cases; no debt markers; 0 open threats in the phase's own security register.

**What this run changed relative to the prior report.** The verdict is unchanged and is not carried over — it was re-derived. Three things are different:

1. **The changed text was verified, not just re-read.** The paragraph `cb18a75` added to `homeworks/project-baseline/README.md` makes a specific, checkable claim about a link-time join on `emb_hal_write_line`. It was confirmed against the built objects with `nm` rather than accepted as prose. It holds.
2. **`03-REVIEW.md` WR-04 is resolved** by the same commit — the README passage it flagged was rewritten to state the truth. The prior report listed it as open.
3. **Two new Warning-level documentation imprecisions** were introduced by that commit and are recorded above as W-01 and W-02. Both are the same mistake in two places: a claim that "there is no `#include` between the two" where the source shows there is one (`emb_hal_arduino.c:31` includes `emb_hal.h`). The mechanism the pages are explaining is correct and verified; the clauses are over-broad. Neither fails a must-have truth — truth 9's declared content (the `symlink://` line named, no "arrives later" language) holds in both files — and neither touches code, so neither is a blocker. The repair is a sentence in each file.

**Standing shortfall, unchanged and now correctly recorded.** `SHARED-04` is marked `Complete` while its literal wording — "a check fails the commit" — is not delivered. The detector is real, falsified and refuses loudly, but nothing invokes it. That wiring is Phase 6's by explicit roadmap assignment (`VERIFY-02`), all three plans declare pre-commit hooks out of scope, and `03-VALIDATION.md` already carries `nyquist_compliant: false` and one escalated row for exactly this. As of `27e2607` the annotation the prior report recommended is in place in `REQUIREMENTS.md:31`, so the record no longer overstates the requirement. The deferral is legitimate and is recorded in the `deferred` list.

---

_Verified: 2026-10-17T07:14:52Z_
_Verifier: Claude (gsd-verifier)_
