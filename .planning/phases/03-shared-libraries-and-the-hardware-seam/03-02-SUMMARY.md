---
phase: 03-shared-libraries-and-the-hardware-seam
plan: 02
subsystem: repo-tooling
tags: [static-check, seam, hal, node-test, falsification, platformio, pure-filesystem]

requires:
  - phase: 03-shared-libraries-and-the-hardware-seam
    provides: "plan 03-01 — the three shared libraries, the one framework-touching backend whose exemption line this check names, and the consumer's single lib_deps line the suite asserts"
  - phase: 01-repository-skeleton-and-project-layout
    provides: "the tools/ idioms the check copies: repo-root derivation from import.meta.url, an entry-point guard, loud failure on zero matches, and the pure-filesystem test stance"

provides:
  - "tools/check-hal-seam.mjs — the seam gate: a pure-filesystem walk that names each framework include with its file and line, skips one named backend by exact name, refuses a tree holding no library, and derives its root from its own location"
  - "tools/tests/check-hal-seam.test.mjs — 17 cases falsifying every include class, both edges of the exemption, the empty and absent trees and the report's stability"
  - "the manifest invariants and the consumer's dependency line, asserted from the real tree and from five fixtures that turn the same predicates red"
  - "tools/tests/helpers.mjs — the shared-library fixture builder, the check's spawn wrapper, the shared-library constants, and the one .ini reader"

affects: [03-03, 06, 08]

tech-stack:
  added: []
  patterns:
    - "A gate matches include paths, never substrings: an exact trailing-name comparison for the framework's core header, prefix and subpath comparisons for the two platform prefixes and the two directories"
    - "A seam exemption is a named list of one exact directory applied at the first level, never a pattern and never an inference from a manifest field"
    - "A scanner refuses a tree it could not check: zero libraries exits non-zero with a counted, named message"
    - "One predicate, two arms: an assertion is written as a function returning its problems, so the real-tree arm and the fixture arm run the same code and a fixture cannot pass a private check"
    - "A suite asserts the number of cases it holds, so a silently dropped case is visible"

key-files:
  created:
    - tools/check-hal-seam.mjs
    - tools/tests/check-hal-seam.test.mjs
  modified:
    - tools/tests/helpers.mjs
    - tools/tests/env-baseline.test.mjs

key-decisions:
  - "The report goes to stdout and the argument misuse to stderr. The check's product is a report whose verdict is its exit status, so the report is one coherent stream; only 'could not run' is an error. The real tree's reading is recorded verbatim below."
  - "The exemption is read from the module in an assertion (`ALLOWED` deep-equals `[\"emb_hal_arduino\"]`), not only exercised through fixtures. A second entry or a pattern would be invisible in every behavioural case, and that widening is the one keystroke this whole check exists to make expensive."
  - "The check treats every immediate subdirectory of `shared/lib/` as a library. It does not require a manifest to scan one: a missing manifest is the suite's invariant to assert, and requiring one here would let a manifest-less directory hide a planted include from the scanner."
  - "The report's paths and the scanned-directory name are relative to the scanned root, so the default run prints `shared/lib/...` and no absolute machine path can reach a record."
  - "`sections()` moved from `env-baseline.test.mjs` into `helpers.mjs`. The plan requires the consumer assertion to reuse the repository's reader rather than reimplement it, and the only way to reuse a non-exported function from a second suite is for one module to own it."
  - "REQUIREMENTS.md was deliberately left untouched, and the plan's requirement determinations are recorded in this file instead. The sanctioned writer (`gsd_run query requirements.mark-complete`, with its shared-ID gate) is absent from this environment, and this plan's own text forbids claiming that the check is wired into anything; see the note at the end of this record."

patterns-established:
  - "A gate proven by mutation: the check was broken four ways on purpose, each mutation was caught by exactly the case that names it, and the file was restored with an asserted empty diff"
  - "A fixture builder's options plant visibly wrong layouts, so every assertion built on it can be shown to fail rather than only to pass"
  - "The outcome of every falsification case is recorded as it was observed, and an assertion whose limit is real has that limit stated beside it"

# MEASURED, never narrated (#3968): `git rev-list --count <plan_head_before>..HEAD`
# read from the on-disk ledger at summary-write time. `plan_head_after` is the tip the
# three task commits reached; this file's own carrier commit lands after it, so it is
# deliberately not folded into `commits` — the range recorded here is self-consistent.
actuals:
  tokens: 11415
  tasks: 3
  commits: 3
  plan_head_before: 62828d330aaf429f77ea5d36ead66f66bb6c2ddd
  plan_head_after: 453561bbe5fda166c69445495733b9c732208ad6

coverage:
  - id: D1
    description: "A framework include planted anywhere under the shared library tree is named with its file and line and the check exits non-zero; the tree as committed passes and says how many libraries it scanned"
    requirement: "SHARED-03, SHARED-04"
    verification:
      - kind: unit
        ref: "node --test tools/tests/check-hal-seam.test.mjs#a framework include planted under the shared tree is named and refused"
        status: pass
      - kind: integration
        ref: "node tools/check-hal-seam.mjs => 'scanned 2 libraries under shared/lib; no framework include found', exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "The check matches include paths and never substrings: all six framework include classes are caught, and a third-party header whose name merely contains the framework's is left alone"
    requirement: "SHARED-03"
    verification:
      - kind: unit
        ref: "tools/tests/check-hal-seam.test.mjs#the quoted include form is caught as well as the angled one"
        status: pass
      - kind: unit
        ref: "tools/tests/check-hal-seam.test.mjs#a third-party header whose name merely contains the framework's is left alone"
        status: pass
    human_judgment: false
  - id: D3
    description: "The exemption is one exact directory name: the same include is passed over inside the backend and reported once that directory is renamed to a near-miss"
    requirement: "SHARED-03"
    verification:
      - kind: unit
        ref: "tools/tests/check-hal-seam.test.mjs#renaming the backend to a near-miss makes the check name the include"
        status: pass
      - kind: unit
        ref: "tools/tests/check-hal-seam.test.mjs#the exemption is exactly one directory, named literally, and nothing else"
        status: pass
    human_judgment: false
  - id: D4
    description: "A tree holding no library, or no shared library directory at all, refuses loudly with a counted and named message instead of reporting success"
    requirement: "SHARED-04"
    verification:
      - kind: unit
        ref: "tools/tests/check-hal-seam.test.mjs#an empty library set refuses loudly and names the directory it scanned"
        status: pass
      - kind: unit
        ref: "tools/tests/check-hal-seam.test.mjs#an absent library directory refuses rather than crashing"
        status: pass
    human_judgment: false
  - id: D5
    description: "Each shared library carries a manifest whose name equals its directory and whose version is a non-empty string, the library set is exactly the three decided names, and the layout split holds"
    requirement: "SHARED-01"
    verification:
      - kind: unit
        ref: "tools/tests/check-hal-seam.test.mjs#every shared library carries a manifest whose name and version hold, and the layout split does too"
        status: pass
    human_judgment: false
  - id: D6
    description: "The baseline declares exactly three dependency specs on one line, each left-hand side byte-identical to the manifest it names"
    requirement: "SHARED-02"
    verification:
      - kind: unit
        ref: "tools/tests/check-hal-seam.test.mjs#the baseline's dependency line names exactly the three libraries, each matching its manifest"
        status: pass
    human_judgment: false
  - id: D7
    description: "Whether the check should be enforced — it is a script today, and the requirement to fail a commit stays unmet until Phase 6 wires it into a hook or CI job (VERIFY-02)"
    requirement: "SHARED-04"
    human_judgment: true
    rationale: "Nothing invokes the check. This is a real gap against the requirement's wording, not an observation gap: no assertion in this plan can make it true, and the wiring is deliberately Phase 6's. The verifier must classify it, not this record."

duration: 4 min
completed: 2026-10-17
status: complete
---

# Phase 03 Plan 02: The Hardware Seam's Guard Summary

**`tools/check-hal-seam.mjs` walks the shared library tree, names every framework include with its file and line, skips exactly the one named backend, refuses a tree that holds no library, and is falsified against all six include classes, both edges of its exemption and both empty cases — with every mutation of it caught by the case that names it.**

## Performance

- **Duration:** 4 min (started 2026-10-17T00:15:31Z, ended 2026-10-17T00:19:18Z)
- **Tasks:** 3
- **Files:** 4 changed — 2 created, 2 modified (plus this record)

## Accomplishments

- `tools/check-hal-seam.mjs` is the seam's guard. It matches include *paths*, never
  substrings: `Arduino.h` by exact trailing name, `esp_` and `esp32-hal-` by prefix,
  `driver/` and `freertos/` by subpath. It reads every regular file beneath each
  library with no extension filter, sorts its report by path and then by line, and
  derives its root from its own location rather than the working directory.
- Its exemption is `ALLOWED = ["emb_hal_arduino"]` — one exact name, applied at the
  first level, asserted as data in the suite so a second entry cannot be added unnoticed.
- Zero libraries exits non-zero with a counted, named message. This is not hypothetical:
  it is what the tree looked like before plan 03-01 wrote the libraries.
- `tools/tests/helpers.mjs` gained the shared-library fixture builder with five
  falsifiability options (`omitVersionIn`, `wrongNameIn`, `omitManifest`, `plantInclude`,
  `renameBackend`), the check's spawn wrapper, the shared-library constants, and the
  repository's one `.ini` reader.
- `tools/tests/check-hal-seam.test.mjs` is 17 cases: six include classes each named with
  file and line, the third-party header that must stay quiet, the exemption as a pair,
  both empty cases, the report's stability, the manifest invariants, the consumer's
  dependency line, and five fixtures that turn the last two red.
- The full repository suite is green at 56 tests, up from 39 before this plan.

## Task Commits

| Task | Name | Commit | Type |
|---|---|---|---|
| 1 | End-to-end: a framework include planted in a fixture library is named and refused | `45f5a3e` | feat (tracer) |
| 2 | Falsify the check against every include class and both edges of its exemption | `ee101c7` | test |
| 3 | Assert the manifest invariants and the consumer's dependency line, and that they cannot drift apart | `453561b` | test |

## Files Created/Modified

- `tools/check-hal-seam.mjs` (new, mode 755) — the gate; ~80 lines of code under a block
  comment that states what it enforces and why each branch is shaped the way it is.
- `tools/tests/check-hal-seam.test.mjs` (new) — the phase's regression gate.
- `tools/tests/helpers.mjs` (modified) — the fixture builder, the spawn wrapper, the
  constants, and the `.ini` reader moved here so there is one of it.
- `tools/tests/env-baseline.test.mjs` (modified) — imports that reader instead of
  keeping a private copy; its five existing cases are unchanged.

## What the check prints

**Against the real tree**, run by hand from the repository root:

```
$ node tools/check-hal-seam.mjs
check-hal-seam: scanned 2 libraries under shared/lib; no framework include found
EXIT=0
```

Two, not three: `emb_hal_arduino` is the exempt backend and is not counted, and the
`README.md` beside the libraries is a plain file, not a library.

**Against a throwaway tree** under `${TMPDIR}/p3-seam-hand` carrying one planted
`<Arduino.h>` in `emb_log`'s source, removed inside the task:

```
$ node tools/check-hal-seam.mjs --root ${TMPDIR}/p3-seam-hand
check-hal-seam: 1 framework include(s) under shared/lib
shared/lib/emb_log/src/emb_log.c:3: Arduino.h
EXIT=1
```

**Argument misuse**, where a mistyped command line would otherwise silently scan the
wrong tree:

```
$ node tools/check-hal-seam.mjs --root
--root needs a directory: --root <dir>
EXIT=2
$ node tools/check-hal-seam.mjs --list
check-hal-seam: unknown argument "--list"
Usage: check-hal-seam.mjs [--root <dir>]
EXIT=2
```

## The falsification matrix, and its outcome

Every case below was executed. The last column is what was observed, not what was
expected.

| Case | Planted | Observed |
|---|---|---|
| One framework include is named and refused | `<Arduino.h>` in `emb_log` | named `shared/lib/emb_log/src/emb_log.c:3: Arduino.h`, exit 1 |
| The quoted form is caught too | `"Arduino.h"` | named at the same file and line, exit 1 |
| The platform prefix is caught | `<esp_system.h>` | named, exit 1 |
| The Arduino HAL prefix is caught | `<esp32-hal-gpio.h>` | named, exit 1 — the class the criterion's literal `esp_*` misses |
| The RTOS directory is caught | `<freertos/FreeRTOS.h>` | named, exit 1 |
| The driver directory is caught | `<driver/gpio.h>` | named, exit 1 |
| A third-party header stays quiet | `<ArduinoJson.h>` | **not** flagged, `no framework include found`, exit 0 |
| The exemption is one exact name | `ALLOWED` read from the module | deep-equals `["emb_hal_arduino"]` |
| The exempt directory passes the include over | `<Arduino.h>` in `emb_hal_arduino` | not flagged, exit 0, and the directory is not named in the report |
| A near-miss is **not** exempt | the same include after the directory is renamed to `emb_hal_arduino_alt` | named as `shared/lib/emb_hal_arduino_alt/src/emb_hal_arduino.c:3: Arduino.h`, exit 1 |
| An empty library set refuses | `shared/lib/README.md` only | `scanned 0 libraries under shared/lib`, exit 1 |
| An absent library directory refuses | no `shared/lib` at all | the same refusal on stdout and an **empty stderr**, so it cannot pass as a crash |
| The report is stable and sorted | two includes in two libraries | two runs byte-identical; the sorted pair asserted against a literal expectation |
| The manifest invariants hold | the real tree | no problems; the set is exactly the three; `README.md` is not counted; the layout split holds |
| The consumer's line holds | the real tree | no problems; three specs, each LHS matching the manifest its path names |
| A manifest without a version | `omitVersionIn: "emb_log"` | red, naming `emb_log/library.json` and `version` |
| A manifest whose name is not its directory's | `wrongNameIn: "emb_log"` (uppercased — a case-folded comparison would accept it) | red, naming the file and `name` |
| A library directory with no manifest | `omitManifest: "emb_log"` | red, naming the missing directory |
| A one-spec dependency line | `specs: [emb_hal]` | red, `missing: emb_hal_arduino, emb_log` |
| A consumer with no dependency key | `specs: null` | red, naming the `lib_deps` trap rather than crashing |

### Mutation testing — the suite is falsifiable, not merely green

A green suite proves nothing on its own, so the check was broken four ways on purpose,
each time restoring it and asserting an empty diff:

| Mutation to `tools/check-hal-seam.mjs` | Cases that went red |
|---|---|
| `base === "Arduino.h"` → `base.includes("Arduino")` (a substring search) | exactly one: *a third-party header whose name merely contains the framework's is left alone* |
| `!ALLOWED.includes(name)` → `!name.startsWith("emb_hal_arduino")` (a pattern) | exactly one: *renaming the backend to a near-miss makes the check name the include* |
| the report's sort reversed | exactly one: *the report is stable and sorted across runs* |
| the zero-library branch disabled | exactly two: the empty set and the absent directory |

Each mutation was caught by the case written to catch it and by no other, and
`git diff --exit-code` returned 0 after each restore. The same was done once against the
real tree: dropping the `emb_log` spec from `platformio.ini` turned the consumer
assertion red with `missing: emb_log`, and the file was restored with an asserted empty
diff.

## Decisions Made

- **The report is on stdout; only "could not run" is on stderr.** The check's product is
  a report whose verdict is its exit status, so the report is one coherent stream that a
  hook or a CI job can capture whole. The two flag-misuse branches are errors.
- **The exemption is asserted as data, not only exercised.** Reading `ALLOWED` from the
  module is the only assertion in this plan that could catch a second entry or a
  pattern, because a widened exemption is precisely the change every behavioural case
  would keep passing.
- **Every immediate subdirectory is a library to the scanner.** Requiring a manifest
  before scanning would let a manifest-less directory hide a planted include, which is
  the exact failure the check exists to prevent. The manifest invariant is the suite's
  to assert, and it is.
- **One predicate, two arms.** `manifestProblems()` and `consumerProblems()` return
  their findings instead of throwing, so the real-tree arm and the fixture arm run the
  same code. A fixture arm with its own private check would prove nothing about the real
  tree.
- **The `.ini` reader moved to `helpers.mjs`.** The plan requires the consumer assertion
  to reuse the repository's reader rather than reimplement it; the only way to reuse a
  non-exported function is for one module to own it. See the deviation below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] `sections()` moved from `env-baseline.test.mjs` into `helpers.mjs`**

- **Found during:** Task 1, while extending the shared helper module.
- **Issue:** Task 3 requires the consumer assertion to read the project file "with the
  repository's existing section reader rather than a second implementation". That reader
  was a private function inside `tools/tests/env-baseline.test.mjs`, so it could not be
  reached from the new suite by any means short of a copy. Importing the `.test.mjs` file
  would have re-registered its tests in the second suite's process.
- **Fix:** the function was moved verbatim — body and doc comment — into
  `tools/tests/helpers.mjs` and exported; `env-baseline.test.mjs` now imports it. One
  implementation, two consumers, and `shared/lib/README.md`'s "one canonical source per
  fact" holds.
- **Files modified:** `tools/tests/helpers.mjs`, `tools/tests/env-baseline.test.mjs`
  (the latter is outside this plan's declared `files_modified` list).
- **Verification:** `node --test "tools/**/*.test.mjs"` → 56 pass, 0 fail, with the five
  pre-existing `env-baseline` cases unchanged; `git diff` for that file is one import
  line plus the deletion of the moved block.
- **Commit:** `45f5a3e`

**2. [Rule 3 - Blocking issue] No GSD CLI in this environment; commits made with `git` directly**

- **Found during:** plan setup.
- **Issue:** `gsd_run`, `gsd-tools` and `gsd_tools` are all absent (`command -v` returns
  nothing for each). The execution protocol's task commits, metadata commit, ledger-based
  `commits:` measurement and `requirements.mark-complete` are all expressed in terms of
  that binary.
- **Fix:** the equivalent git operations were performed directly — staged files
  individually, one commit per task with `{type}({phase}-{plan}): …` messages, the
  `gsd-plan-head-before-03-02` ledger written by hand into the worktree's git directory,
  and `commits: 3` measured from it with `git rev-list --count`. No `--no-verify` was
  used and no hook was bypassed; the repository has no pre-commit configuration.
- **Files modified:** none beyond the plan's own.
- **Verification:** `git rev-list --count 62828d33..HEAD` → 3, matching the three task
  commits; `git log --oneline` shows them in order.
- **Commit:** n/a — this is how every commit in the plan was made.

**3. [Rule 3 - Blocking issue] `REQUIREMENTS.md` deliberately left unmodified**

- **Found during:** plan close-out, when the metadata commit was assembled.
- **Issue:** the worktree-mode metadata commit normally updates `REQUIREMENTS.md`
  alongside this file, but the sanctioned writer for it —
  `gsd_run query requirements.mark-complete`, which enforces the shared-ID gate and
  rewrites the traceability table — is absent here, and its input
  (`requirements.ready-ids`) cannot be computed by hand with the same authority. The
  file is a cross-plan artifact, in the same category as `STATE.md` and `ROADMAP.md`,
  which this dispatch explicitly assigns to the orchestrator.
- **Fix:** the determination the shared-ID gate would have made was computed by hand and
  left for the orchestrator, which owns post-wave shared-artifact writes and has the
  sanctioned writer available. `SHARED-01` and `SHARED-03` are ready (their only sibling
  declarant, plan 03-01, has a SUMMARY); `SHARED-02` is **blocked** (plan 03-03 declares
  it and has produced no SUMMARY); `SHARED-04` is ready by the gate but is claimed here
  only as a script, because nothing invokes the check.
- **Files modified:** none.
- **Verification:** `grep -n "SHARED-0" .planning/REQUIREMENTS.md` still shows all four
  unchecked, which is the true state for `SHARED-02` and `SHARED-04` and the conservative
  state for the other two.
- **Commit:** n/a

### Plan-level notes

- Task 2's `<verify>` requires the literal string `emb_hal_arduino` in the test file, and
  the exemption had been abstracted behind `EXEMPT_BACKEND` so the literal was absent.
  It was restored by adding a real assertion over `ALLOWED` — the exemption as data —
  rather than by writing the name into a comment. The literal check surfaced a gap worth
  filling, which is the outcome a literal check is for.
- Task 3's `<verify>` includes `git status --porcelain` with `fails_when: any line on
  stdout`. Run before the task's own commit, that lists the file the task is editing. It
  was read for what it is for — that nothing was written outside the throwaway fixtures —
  and it named exactly one path, `tools/tests/check-hal-seam.test.mjs`, the file under
  edit. No fixture, build artifact or stray binary reached the repository.
- The plan's `type="tracer"` task ran its feedback gate: the gate carries no
  `blocking-human`, auto mode is inactive, `human_verify_mode` is `end-of-phase` and the
  tracer's `<verify>` carries only `<automated>` blocks, so the verify was re-run
  end-to-end and passed before any expansion task started.

**Total deviations:** 3 auto-fixed (all Rule 3, all disclosed). **Impact:** one file
outside the declared set was touched, for a reason the plan itself requires; the commit
mechanics were reproduced by hand because the tool they assume is absent; and one shared
artifact was left alone rather than hand-edited by an agent that cannot run its gate.

## Issues Encountered

**PlatformIO's telemetry endpoint is denied by this session's sandbox on every suite
run.** Each full-suite invocation printed a `deny network-outbound
collector.platformio.org:443` notice. It is recorded because it reads like a failure in
a log and is not one: it comes from the pre-existing `sweep.test.mjs` fixture build, and
every run it appeared in was green. `03-RESEARCH.md` Pitfall 6 predicts exactly this.

**Task 1's first test failed on the fixture object rather than on the check.** The
builder returns `{root, sharedLibDir, manifests, consumerIni}` in the idiom
`makeFragmentConsumer` established, and the first draft passed that whole object as
`--root`. The failure message was made to carry the root, which is a permanent
improvement, and the assertion was fixed to read `fixture.root`.

## Known Stubs

None. Every file this plan ships carries real values: the check's exemption list names a
real directory, its include predicate names real headers, and the suite's expectations
are literal strings rather than derived from the implementation. The one absence that is
deliberate — the check is invoked by nothing — is not a stub in the code: it is the
flagged assumption recorded below, and `VERIFY-02` in Phase 6 is where it is discharged.

## Threat Flags

None. This plan introduces no surface the plan's `<threat_model>` does not already cover:
no network endpoint, no authentication path, no file access outside the repository and
the operating system's temporary directory, and no schema change at a trust boundary. It
installs no package and adds no package-manager file. Every fixture lives under
`os.tmpdir()`, is registered with the shared cleanup hook, and is removed at the end of
the run; no committed artifact names an absolute machine path, because every path the
check prints is relative to the scanned root. `T-03-05`, `T-03-06`, `T-03-07`, `T-03-08`
and the reserved supply-chain row each have their mitigation in this plan's work, and the
suite asserts that no shared manifest carries an install-time `scripts` key.

## The two flagged assumptions, carried rather than dismissed

Both came back unclassified from the phase's spec-less probe, and an unclassified row is
the one class the protocol forbids resolving with a backstop. Neither is a property this
plan's work can make true, so neither appears in `must_haves` as a truth. Both stay open
here, for a later reader to settle from evidence:

1. **`SHARED-03`, unclassified — the check enforces a necessary and not a sufficient
   condition.** *Is a source-level include the only way the framework can become
   reachable from a shared module?* Nothing in this phase can answer it. A framework
   symbol could in principle arrive through a build flag, a pre-built archive or a
   generated header, and the check reads only source text. The seam is therefore
   enforced on the path a framework header actually travels today, and the words "the
   seam is closed" would be false. It is not closed; it is guarded on the route it is
   known to take.

2. **`SHARED-04`, unclassified — the requirement to fail a commit is met only as a
   script.** This plan delivers a check that exits non-zero and a suite that proves it
   does. **Nothing invokes it**, so no commit fails on account of a framework include
   today. `VERIFY-02`, owned by Phase 6, is where the wiring belongs; until then
   `SHARED-04` is delivered and not enforced, and the suite deliberately contains no
   assertion to the contrary — a passing assertion that the check runs would be exactly
   the false claim this flagged assumption forbids.

## Next Phase Readiness

The guard exists, is correct, and is falsifiable: the seam's boundary is now a command
that can be run and a suite that can fail, rather than a sentence in a README.

Plan 03-03 can now take up what this one deliberately did not: the repository-wide scan
for the deprecated global-library directives, the three-arm depth measurement, and the
`ROADMAP.md` corrections beside criterion 3 and criterion 5 — including the `D-10`
divergence this check implements rather than the criterion's literal `esp_*` list.

Two things stay open for later phases and are worth repeating where the next reader will
meet them:

- **The check is not a gate yet.** Phase 6 owns wiring it into pre-commit and CI
  (`VERIFY-02`). Until then a framework include compiles and nothing refuses.
- **`SHARED-02` remains unmarked** because plan 03-03 declares it and has produced no
  SUMMARY; the orchestrator should apply the shared-ID gate once 03-03 finishes.

---

## Self-Check: PASSED

- `tools/check-hal-seam.mjs` — FOUND (mode 755, shebang, entry-point guard present)
- `tools/tests/check-hal-seam.test.mjs` — FOUND
- `tools/tests/helpers.mjs`, `tools/tests/env-baseline.test.mjs` — FOUND
- Commit `45f5a3e` (Task 1) — FOUND, ancestor of HEAD
- Commit `ee101c7` (Task 2) — FOUND, ancestor of HEAD
- Commit `453561b` (Task 3) — FOUND, ancestor of HEAD
- `node --test "tools/**/*.test.mjs"` → 56 tests, 56 pass, 0 fail
- `node tools/check-hal-seam.mjs` → exit 0, `scanned 2 libraries under shared/lib; no framework include found`
- `node tools/sweep-homeworks.mjs --list` → `project-baseline`, exit 0
- `node tools/generate-workspace.mjs --check` → `homework.code-workspace is up to date`, exit 0
- `git status --porcelain` — empty before this file's carrier commit
- Fixture residue — NONE (`${TMPDIR}/p3-seam-hand` and the mutation restores all asserted)
