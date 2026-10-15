---
phase: 01-repository-skeleton-and-project-layout
plan: 01
subsystem: infra
tags: [node-esm, node-test, platformio, esp32-s3, n16r8, generate-drift-check, workspace]

requires: []
provides:
  - "tools/lib/discover.mjs — the single discovery and validation source every later consumer imports"
  - "tools/generate-workspace.mjs — the pure workspace renderer plus its byte-comparison drift check"
  - "homeworks/project-baseline/ — the committed PlatformIO project that proves the one-command build from the repository root"
  - "homework.code-workspace — the generated multi-root workspace listing the repo root, shared and the baseline"
  - "tools/tests/ — the node:test fixture harness and the discovery/generator suites"
affects: [01-04, 01-05, 02, 03, 04, 05, 06, 07, 08]

actuals:
  tokens: 5368
  tasks: 3
  commits: 4
  plan_head_before: 81548596f1591f73605d5a486a937ecf08320cd0
  plan_head_after: 56446120b4e31702bac4eedc912e7ae29ff22e1f

tech-stack:
  added: []
  patterns:
    - "Generate then drift-check: a committed artifact is a pure function of the tree, guarded by a byte comparison"
    - "One discovery source, many consumers: the generator, the sweep and the future CI matrix all call discoverHomeworks()"
    - "Named-rule failure: the repo's own message names the rule and the remedy instead of delegating to a downstream tool error"

key-files:
  created:
    - tools/lib/discover.mjs
    - tools/generate-workspace.mjs
    - tools/tests/helpers.mjs
    - tools/tests/discover.test.mjs
    - tools/tests/generate-workspace.test.mjs
    - homeworks/project-baseline/platformio.ini
    - homeworks/project-baseline/src/main.cpp
    - homeworks/project-baseline/README.md
    - homework.code-workspace
    - shared/lib/README.md
  modified: []

key-decisions:
  - "The generator's CLI sits behind an entry-point guard: the RESEARCH skeleton runs its CLI at module scope, so importing renderWorkspace from a test would rewrite the repository's own workspace file."
  - "The test files were created in the RED commit and expanded in task 2, because the tracer carries tdd=\"true\" while the plan assigns the suite to task 2."
  - "The baseline platformio.ini comment does not spell the two absent console-port keys literally, because task 1's acceptance criterion is a literal substring check on the file."
  - "envNames() derives the native environment name without creating it; the environment itself is Phase 5's, because an Arduino-only tree cannot build under platform = native."

patterns-established:
  - "Generate then drift-check (ARCHITECTURE Pattern 3), first instance — reused by docs/* in Phase 4"
  - "Fail loudly on zero matches — --allow-empty is the single named escape hatch, never a silent green gate"
  - "A test may never run against the repository root: every fixture is built under os.tmpdir() by tools/tests/helpers.mjs"
  - "Id validation before use — the frozen regex is applied before a name becomes a path segment or a child-process argument"

requirements-completed: [REPO-01, REPO-02]

coverage:
  - id: D1
    description: "Discovery and validation have exactly one definition: a directory directly under homeworks/ whose name matches the frozen id grammar and which contains a platformio.ini"
    requirement: REPO-02
    verification:
      - kind: unit
        ref: "tools/tests/discover.test.mjs"
        status: pass
    human_judgment: false
  - id: D2
    description: "homework.code-workspace is a pure function of the filesystem — sorted, fixed key order, LF with one trailing newline, no comments — and --check exits 1 naming the file and the remedy when it drifts"
    requirement: REPO-01
    verification:
      - kind: unit
        ref: "tools/tests/generate-workspace.test.mjs"
        status: pass
      - kind: integration
        ref: "node tools/generate-workspace.mjs --check"
        status: pass
    human_judgment: false
  - id: D3
    description: "pio run -d homeworks/project-baseline succeeds from the repository root, a directory that carries no platformio.ini of its own, and reports the 16 MB application partition"
    requirement: REPO-02
    verification:
      - kind: integration
        ref: "pio run -d homeworks/project-baseline"
        status: pass
    human_judgment: false
  - id: D4
    description: "shared/lib survives a clone because it holds a tracked README stating the frozen dependency form, and no deprecated global-library directive leaked into it"
    requirement: REPO-01
    verification:
      - kind: integration
        ref: "git ls-files shared/lib"
        status: pass
      - kind: integration
        ref: "grep -Ec 'lib_extra_dirs|globallib_dir' shared/lib/README.md"
        status: pass
    human_judgment: false
  - id: D5
    description: "The baseline README records, in prose, the one-environment rationale and the no-console-port rationale so a later reader does not re-open either"
    verification: []
    human_judgment: true
    rationale: "Automation proves the file exists, is tracked and begins with the disclaimer. Whether the recorded reasoning actually stops a reader from re-litigating the environment set or the absent port is a judgment about prose, not a property a command can assert."

duration: 4 min
completed: 2026-10-15
status: complete
---

# Phase 1 Plan 1: Walking Skeleton — a discoverable homework that builds from the repository root and is listed by a generated workspace

**A committed PlatformIO baseline at `homeworks/project-baseline/` that `node` tooling discovers through one frozen id grammar, that a generated `homework.code-workspace` lists alongside the repo root and `shared`, and that `pio run -d` builds from the repository root with the 16 MB N16R8 table in effect.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-10-15T12:38:35Z
- **Completed:** 2026-10-15T12:42:55Z
- **Tasks:** 3
- **Files modified:** 10 created

## Accomplishments

- `tools/lib/discover.mjs` is the single discovery and validation source: the frozen grammar `^(?:m[0-9]{2}-l[0-9]{2}|project)-[a-z0-9]+(?:-[a-z0-9]+)*$`, the one-level scan, the depth-violation walk and `envNames()`. The regex is applied before a name becomes a path, and `isDirectory()` is false for a symlink, so the walk cannot leave `homeworks/`.
- `homework.code-workspace` is generated, never authored, and lists exactly `.`, `shared` and `homeworks/project-baseline`. `--check` returns 0 against the committed bytes and 1 with a three-line remedy against a hand edit.
- `pio run -d homeworks/project-baseline` exits 0 from the repository root — a directory with no `platformio.ini` of its own — reporting `used 268177 bytes from 6553600 bytes`. `6553600` is `0x640000`, the app partition of `default_16MB.csv`: the four N16R8 overrides are in effect.
- 18 `node:test` assertions cover the id grammar, the depth rule, `envNames`, renderer determinism and both `--check` outcomes. Every fixture is built under `os.tmpdir()`; no test touches the checkout, and `git status --porcelain` is byte-identical before and after a run.
- `shared/lib/README.md` makes the directory exist after a clone and is the only in-tree statement of the frozen `shared/lib/<name>` path and the `symlink://` dependency form until Phase 3.

## Task Commits

Each task was committed atomically. The tracer task is TDD, so it produced a RED commit and a GREEN commit:

1. **Task 1 RED: add failing tests for the discovery and workspace-render contracts** — `a966141` (test)
2. **Task 1 GREEN: implement discovery, the workspace generator and the baseline project** — `e3e64fb` (feat)
3. **Task 2: cover the discovery and generator contracts end to end** — `c1ee1f3` (test)
4. **Task 3: make shared/lib and the baseline legible** — `5644612` (docs)

**Plan metadata:** the SUMMARY commit (docs: complete 01-01 plan)

_No REFACTOR commit: no cleanup was warranted — the GREEN implementation is already the minimal shape the tests describe, and the tracer's `<verify>` passed unchanged, so a refactor commit would have been a no-op._

## Files Created/Modified

- `tools/lib/discover.mjs` — the single discovery and validation source (`HOMEWORKS_DIR`, `ID_PATTERN`, `ID_PATTERN_TEXT`, `discoverHomeworks`, `findDepthViolations`, `envNames`); `node:fs` and `node:path` only
- `tools/generate-workspace.mjs` — `renderWorkspace(repoRoot)` as a pure function, the `--check` drift comparison, and the entry-point guard
- `tools/tests/helpers.mjs` — the `os.tmpdir()` fixture builder, the `tools/` copier that lets the `--check` CLI run against a fixture, and cleanup
- `tools/tests/discover.test.mjs` — the 6-accept / 9-reject grammar table as data, the depth walk on a clean and a violating tree, the "valid name without an ini is neither found nor malformed" rule, `envNames`
- `tools/tests/generate-workspace.test.mjs` — sorted order, byte-identical re-render, LF and single trailing newline, the single-top-level-key rule, both `--check` outcomes
- `homeworks/project-baseline/platformio.ini` — one `[env:projectbaseline_s3]`: the exact `espressif32@7.1.3` pin, the four N16R8 overrides, `monitor_speed = 115200`, no console port
- `homeworks/project-baseline/src/main.cpp` — `Serial.begin(115200)` plus one `printf` of flash size, `psramFound()` and PSRAM size; no GPIO API anywhere
- `homeworks/project-baseline/README.md` — says in its first line that the directory is not a course homework; records the one-environment and no-port rationales
- `homework.code-workspace` — generated; a pure folder list, no settings, no extensions, no comments, no emoji
- `shared/lib/README.md` — the frozen `shared/lib/<name>` path, the `symlink://` form, and why the directory exists at all

## Decisions Made

- **The generator's CLI is behind an entry-point guard.** The RESEARCH skeleton runs its CLI at module scope, which means importing `renderWorkspace` from a test would rewrite the repository's own workspace file (and call `process.exit`). See the deviation below.
- **The test files were created in the RED commit and expanded in task 2.** The tracer carries `tdd="true"`, which requires a failing test before the implementation; the plan assigns the full suite to task 2. The RED commit holds the minimal contract tests, task 2 replaces them with the exhaustive suite. Task 2's `read_first` line "none exists yet" was stale by then.
- **The baseline ini's comment does not spell the two absent console-port keys literally.** Task 1's acceptance criterion is a literal substring check for them, so an explanatory comment naming them would have failed the gate. The comment now says "no console-port key is pinned" and points at the README.
- **`envNames()` fixes the native environment's name without creating it.** `pio run -d` with no `-e` builds every environment in the file, and an Arduino-only source tree cannot compile under `platform = native`, so shipping it now would break criterion 2. The name `projectbaseline_native` is fixed here so Phase 5 need not invent it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The generator's CLI ran at module scope, so importing it rewrote the repository's own workspace file**

- **Found during:** Task 1 (RED), reproduced by the first RED run
- **Issue:** `01-RESEARCH.md` lines 545-559 — the "verified working implementation" — reads the check flag, renders, and writes or exits at module scope. `tools/tests/generate-workspace.test.mjs` imports `renderWorkspace` from that module, so the import itself would rewrite `<repo>/homework.code-workspace` and, in the `--check` branch, call `process.exit(0)` inside the test runner. Every test run would silently mutate a committed artifact — the exact failure the plan's own fixture caution exists to prevent.
- **Fix:** moved the CLI body into `main()` and gated it on `import.meta.url === pathToFileURL(process.argv[1]).href`, so the work happens only when the module is the entry point. `renderWorkspace` stays a pure, import-safe export.
- **Files modified:** `tools/generate-workspace.mjs`
- **Verification:** the RED run's target test then failed on its own assertion rather than aborting on an import side effect; `node tools/generate-workspace.mjs --check` still exits 0 from the CLI and both `--check` outcomes are covered by spawned subprocesses.
- **Committed in:** `e3e64fb` (Task 1 GREEN)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The fix is confined to one file and changes no contract the plan states — `renderWorkspace` is still the pure seam and `--check` still exits 0 and 1 as specified. Without it the plan's own test task would have been unexecutable without dirtying the tree on every run. No scope creep.

## TDD Gate Compliance

| Gate | Commit | Evidence |
|------|--------|----------|
| RED | `a966141` | `node --test --test-reporter=tap "tools/**/*.test.mjs"` exited 1 with the target test failing on its planned assertion; `gsd-run check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`reason: target_test_failed`, 7 tests / 2 pass / 5 fail, TAP format, no report errors) |
| GREEN | `e3e64fb` | the same suite then reported `tests 18 / pass 18 / fail 0`, and `--check`, the folder-list comparison, the build and the GPIO grep all passed |
| REFACTOR | — | not needed; no changes made, so no commit |

The two modules were introduced as interface placeholders in the RED commit and replaced with real bodies in GREEN, so the target test failed on the behaviour it asserts rather than on a missing module (`fixture_or_load_failure` would have been `INVALID_RED`).

## Issues Encountered

- **The tracer gate's verify commands 3 and 4 could not be run in their literal `PATH="$HOME/.platformio/penv/bin:$PATH" pio run …` form.** The worktree isolation guard refuses a command whose first word is a `VAR=value` assignment, because it cannot statically prove the resolved binary is not `git`. They were run as `/Users/vloktiev/.platformio/penv/bin/pio run -d homeworks/project-baseline`, which is the same binary that prefix resolves to. Output matched the plan's expected string exactly.
- **`homeworks/project-baseline/.pio/` is untracked after the build.** Expected: the root `.gitignore` is plan 01-02's artifact, and the plan's verification item 5 scopes the clean-tree assertion to plan 01-05. Nothing under `.pio/` was staged at any point.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- The Walking Skeleton is proven end to end and committed: discovery → generated workspace → one-command build → a tree that stays clean across a test run.
- `tools/lib/discover.mjs` is the seam plan 01-04's sweep must import rather than re-implement; `ID_PATTERN_TEXT` exists so its failure message can quote the expected pattern.
- `homeworks/project-baseline/` is ready as Phase 2's on-hardware acceptance vehicle; its `src/main.cpp` already reports exactly what Phase 2's criterion 2 needs over the monitor.
- `envNames()` fixes `projectbaseline_native` for Phase 5 (VERIFY-01).
- `shared/lib/README.md` is the only in-tree statement of the frozen naming until Phase 3 fills the folder.
- Nothing here blocks plan 01-04 or 01-05. The two Wave 0 test files this plan owns exist alongside the shared helper; `tools/tests/sweep.test.mjs` remains plan 01-04's.

---

*Phase: 01-repository-skeleton-and-project-layout*
*Completed: 2026-10-15*

## Self-Check: PASSED

- All 10 key files listed in `key-files.created` exist on disk (`FOUND` for each).
- All four task commits are ancestors of HEAD: `a966141`, `e3e64fb`, `c1ee1f3`, `5644612`.
- `node tools/generate-workspace.mjs --check` exits 0; `node --test "tools/**/*.test.mjs"` reports 18 pass / 0 fail; `pio run -d homeworks/project-baseline` exits 0 reporting `6553600` bytes of application partition; the GPIO-API count in `src/main.cpp` is 0.
- `git status --porcelain` shows only `?? homeworks/project-baseline/.pio/`, the build output the root `.gitignore` (plan 01-02) is chartered to cover.
