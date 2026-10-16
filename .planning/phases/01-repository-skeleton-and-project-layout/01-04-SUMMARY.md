---
phase: 01-repository-skeleton-and-project-layout
plan: 04
subsystem: infra
tags: [node-esm, node-test, platformio, sweep, depth-rule, zero-match-gate, subprocess, tdd]

requires:
  - phase: 01-repository-skeleton-and-project-layout
    provides: "tools/lib/discover.mjs — the one discovery source, its frozen id grammar and the printable pattern the sweep quotes; tools/tests/helpers.mjs — the os.tmpdir() fixture builder; homeworks/project-baseline/ — the committed project the sweep discovers and builds; the root .gitignore that keeps .pio/ out of git"
provides:
  - "tools/sweep-homeworks.mjs — the repo-wide gate: discovery, id validation, depth-rule enforcement by name, the loud zero-match failure with one named escape hatch, explicit PlatformIO resolution and the accumulate-and-continue build loop"
  - "tools/tests/sweep.test.mjs — nine integration cases covering every exit path on throwaway fixture trees"
  - "tools/tests/helpers.mjs — extended with makeDepthViolation, runSweep and SWEEP_PATH"
  - "The --list contract Phase 6's CI matrix consumes, and the --root override that makes the failure paths testable without touching the repository"
affects: [01-05, "phase 2", "phase 6", "phase 7"]

actuals:
  tokens: 3722    # chars/4 over the realized 14,886-character diff in tools/
  tasks: 2
  commits: 3      # MEASURED: git rev-list --count 16fbb074ed672dd48cccd2f0df5ae7e1aba10f67..f2513e76593630cb0b11fddc7c88d0fb80fef0ea
  plan_head_before: 16fbb074ed672dd48cccd2f0df5ae7e1aba10f67
  plan_head_after: f2513e76593630cb0b11fddc7c88d0fb80fef0ea

tech-stack:
  added: []
  patterns:
    - "Named-rule failure, second instance: the repository's own message names the rule, the reason and the remedy instead of delegating to a downstream tool's error"
    - "Policy before payload: pure filesystem checks run and short-circuit before any child process is spawned"
    - "Spawn error and child exit status are separate channels — branch on them separately or a missing binary is silent"
    - "An escape hatch is one named flag the failure message names, never a silent bypass"

key-files:
  created:
    - tools/sweep-homeworks.mjs
    - tools/tests/sweep.test.mjs
  modified:
    - tools/tests/helpers.mjs

key-decisions:
  - "The sweep is Node rather than shell, and the reason is measured. `zsh -c 'for f in homeworks/*/platformio.ini; …'` prints `no matches found` and exits 1 with a message that names no rule; POSIX `/bin/sh` with an existence guard lets the unmatched glob through and falls through to a zero exit. Neither default yields the required semantics, so zero-match became an explicit branch under this repository's control."
  - "A root override was added and documented as existing for the tests. Without it, any test of the failure paths would have to point the sweep at the repository, discover the real baseline, build it and create `.pio/` — in the act of testing the rule that says the tree stays clean. The default stays the repository root derived from the script's own location, never the process working directory."
  - "The policy short-circuit is proved by control flow rather than by counting spawned processes. The depth fixture also carries a discoverable project and points PLATFORMIO_CORE at a path that cannot resolve, so a build stage that had been reached would necessarily print the spawn-failure message; its absence is a fact about control flow, whereas a log-line count is a fact about the current wording."
  - "`resolvePio` guards the home-relative probe on `$HOME` being set. The verified skeleton interpolates `process.env.HOME ?? \"\"`, which turns the probe into a path relative to the working directory when HOME is unset — a path that could in principle match by accident. The guard changes nothing on this machine and removes the accidental-match case."
  - "The RED commit carried an interface placeholder for the sweep. Not a formality: a completely absent module makes `node <path>` exit 1 with `Cannot find module`, and exit 1 is exactly the status the zero-match contract test expects — the test would have passed for the wrong reason. The placeholder keeps every RED failure an assertion failure."
  - "The expected id pattern is compared as a literal string, not interpolated into a RegExp. `ID_PATTERN_TEXT` spells the grammar for humans; feeding it to `new RegExp` asserts a different, slightly wrong language (the `-` before `[a-z0-9]+` becomes a range in one reading). The test asserts `stderr.includes(\"Expected: \" + ID_PATTERN_TEXT)`."
  - "The full nine-case suite is task 2's deliverable while the RED commit held five high-level contract cases — the same split plan 01-01 used for the same reason: the tracer carries `tdd=\"true\"` and the plan assigns the exhaustive suite to the second task."
  - "`REQUIREMENTS.md` was deliberately not modified. REPO-02 and REPO-03 are both declared by plan 01-05 as well, so the shared-ID gate forbids marking either complete until 01-05 produces its SUMMARY."

patterns-established:
  - "Policy before payload: the depth and id checks are pure filesystem inspections that exit non-zero before any child process exists, so a violating tree can never be reported through a dependency error that names the wrong thing"
  - "A fixture that manufactures a violation also carries a valid subject, so the short-circuit proof is a fact about control flow rather than a vacuous assertion"
  - "The scanned root is a parameter with a repository-derived default; the process working directory is never the default"

requirements-completed: [REPO-02, REPO-03]

coverage:
  - id: D1
    description: "tools/sweep-homeworks.mjs enforces the one-level depth rule and the frozen id grammar by name, before any build, and exits 1 immediately when either is broken — criterion 2's second half is discharged by a rule-naming detector rather than by a manufactured build failure"
    requirement: REPO-03
    verification:
      - kind: integration
        ref: "tools/tests/sweep.test.mjs#a platformio.ini below a homework folder exits 1 naming the rule, before any build"
        status: pass
      - kind: integration
        ref: "tools/tests/sweep.test.mjs#a folder name outside the frozen grammar exits 1 with the expected pattern"
        status: pass
      - kind: integration
        ref: "node tools/sweep-homeworks.mjs --root <fixture> | grep -c 'DEPTH RULE VIOLATED' -> 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "A tree with zero homework projects exits non-zero with three readable lines naming what was found, and --allow-empty is the single named escape hatch that has to be asked for — criterion 4 satisfied literally"
    requirement: REPO-03
    verification:
      - kind: integration
        ref: "tools/tests/sweep.test.mjs#a tree with no homework projects exits 1 and says zero were found"
        status: pass
      - kind: integration
        ref: "tools/tests/sweep.test.mjs#--allow-empty is the single escape hatch: it exits 0 and prints one line"
        status: pass
      - kind: integration
        ref: "node tools/sweep-homeworks.mjs --root <empty fixture> -> exit 1, stderr carries 'ZERO homework projects'"
        status: pass
    human_judgment: false
  - id: D3
    description: "The sweep builds every discovered project from the scanned root with an argument array and no shell, accumulates failures instead of stopping at the first, resolves PlatformIO explicitly, and makes an unstartable binary a named failure distinct from a build failure"
    requirement: REPO-02
    verification:
      - kind: integration
        ref: "tools/tests/sweep.test.mjs#an unstartable PlatformIO binary exits 1 with a spawn failure, not a build failure"
        status: pass
      - kind: integration
        ref: "tools/tests/sweep.test.mjs#a project that fails to build is reported, not swallowed"
        status: pass
      - kind: e2e
        ref: "node tools/sweep-homeworks.mjs -> exit 0; '--- /Users/vloktiev/.platformio/penv/bin/pio run -d homeworks/project-baseline' then '[SUCCESS] Took 2.49 seconds', Flash 'used 268177 bytes from 6553600 bytes'"
        status: pass
      - kind: other
        ref: "node -e \"...if(/\\bexec(Sync)?\\(|\\bshell:\\s*true/.test(src))process.exit(1)\" -> exit 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every sweep exit path — the list contract, sorted output, zero matches, the escape hatch, the depth rule, the id grammar, an unstartable binary, a failing build and the default scanned root — is covered by an integration test that runs against a throwaway os.tmpdir() tree and leaves the repository untouched"
    requirement: REPO-02
    verification:
      - kind: integration
        ref: "node --test \"tools/**/*.test.mjs\" -> tests 27, pass 27, fail 0 across all four test files"
        status: pass
      - kind: integration
        ref: "tools/tests/sweep.test.mjs#the scanned root defaults to the repository, never the process working directory"
        status: pass
      - kind: other
        ref: "git status --porcelain after the full suite -> no entry matching '\\.pio/|compile_commands\\.json'"
        status: pass
    human_judgment: false
  - id: D5
    description: "The four failure messages read as the repository's own account of a rule that was broken — the rule, the reason and the remedy — rather than as a downstream tool's error or silence"
    verification: []
    human_judgment: true
    rationale: "Automation proves the strings are present and correctly placed, and that the spawn-failure branch is reachable separately from the build-failure branch. Whether the prose actually lets a reader who misplaced a folder know what to do — and whether the zero-match message reads as a refusal rather than as reassurance, which is the exact failure the abandoned scaffold's `No homework projects yet - nothing to build.` line committed — is a judgement about wording that no grep makes."

# Metrics
duration: 5min
completed: 2026-10-15
status: complete
---

# Phase 1 Plan 4: The Repo-Wide Sweep Summary

**A Node gate that discovers every homework through the one shared module, rejects a misplaced folder and a malformed name by naming the rule before it compiles anything, refuses to report success on an empty tree unless asked with one named flag, and then builds each project from the repository root with no shell while accumulating failures.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-10-15T12:47:32Z
- **Completed:** 2026-10-15T12:52:40Z
- **Tasks:** 2
- **Files modified:** 2 created, 1 modified

## Accomplishments

- Success criterion 4 is satisfied literally. `node tools/sweep-homeworks.mjs --root <empty tree>` exits 1 and prints three lines — that zero homework projects were found, that a gate which built nothing must not exit 0, and that the escape-hatch flag is for a deliberately empty tree. The single override is `--allow-empty`, it has to be asked for, and the failure path is the default. Phase 6's CI never passes it.
- Success criterion 2's second half is discharged by a detector that names the rule, not by a manufactured build failure. A `platformio.ini` one level below a homework folder prints `DEPTH RULE VIOLATED`, a line stating the one-level requirement, a two-line reason (every shared-library path is project-relative, so `symlink://../../shared/lib/<name>` cannot resolve from a deeper folder) and one line per offending repository-relative path. PlatformIO's own error for the same tree is accurate but points at the dependency.
- Both policy checks are pure filesystem inspections that exit 1 before any child process exists, so a violating tree can never be reported through a dependency error. The integration suite proves this by control flow: the depth fixture carries a discoverable project as well as the violation and points `PLATFORMIO_CORE` at a path that cannot resolve, so a build stage that had been reached would necessarily have printed the spawn-failure message. It did not.
- The build loop runs from the scanned root, passes an argument array with no shell, and branches on the spawn error separately from the child's exit status — the split that turns a missing binary from silence into `failed to start /path/to/pio: spawn … ENOENT`. A failure on one project never hides a failure on the next.
- Discovery, the grammar and the depth walk are imported from `tools/lib/discover.mjs` and not re-implemented: `grep -cE 'readdirSync|ID_PATTERN\s*='` over the sweep returns 0. The expected pattern in the malformed-id message is quoted from `ID_PATTERN_TEXT`, so the rule and its message cannot drift apart.
- 27 assertions pass across the four test files, 9 of them this plan's, and the whole suite leaves `git status --porcelain` empty — no build directory, no compilation database. No `package.json` exists and nothing was installed.
- The sweep was run against the real tree: it discovered `project-baseline`, built it from the repository root in 2.49 s, and reported `used 268177 bytes from 6553600 bytes` — the 16 MB application partition, so the N16R8 overrides are live through the gate as well as through a direct `pio run -d`.

## Task Commits

Task 1 carries `tdd="true"`, so it produced a RED commit and a GREEN commit:

1. **Task 1 RED: add failing tests for the repo-wide homework sweep** — `d41a683` (test)
2. **Task 1 GREEN: implement the repo-wide homework sweep** — `d992d5f` (feat)
3. **Task 2: cover every sweep exit path through the shared fixture helper** — `f2513e7` (test)

**Plan metadata:** the SUMMARY commit (docs: complete 01-04 plan)

_No REFACTOR commit: no cleanup was warranted — the GREEN implementation is already the minimal shape the tests describe, and task 2 changed only test infrastructure, so a refactor commit would have been a no-op._

## Files Created/Modified

- `tools/sweep-homeworks.mjs` — the repo-wide gate. Imports `discoverHomeworks` and `ID_PATTERN_TEXT` from `./lib/discover.mjs`; resolves its default root from `import.meta.url`; accepts exactly `--list`, `--allow-empty` and `--root <dir>`; enforces depth then grammar then exits, then handles zero matches, then the list contract, then resolves PlatformIO, then loops and accumulates. Node standard library only.
- `tools/tests/sweep.test.mjs` — nine integration cases, one per exit path, each built on its own `os.tmpdir()` fixture. The id pattern is imported from the discovery module and compared as a literal.
- `tools/tests/helpers.mjs` — extended with `makeDepthViolation` (a `platformio.ini` written at an arbitrary nested path), `runSweep` (spawns the real script with `--root`, returning status, stdout and stderr separately, with an environment override for the bogus-binary cases) and the exported `SWEEP_PATH`. `makeHomework` already covered the create-with-optional-ini case and was reused rather than duplicated.

## Decisions Made

- **The sweep is Node, and the alternative was measured rather than assumed.** `zsh -c 'for f in homeworks/*/platformio.ini; …'` prints `zsh:1: no matches found` and exits 1, aborting with a message that names no rule; POSIX `/bin/sh` with an existence guard lets the unmatched glob through and falls through to a zero exit. Neither shell default can express "zero matches is a failure", so zero-match became an explicit branch the repository owns.
- **The `--root` override exists, and the script's header says why.** Without it the integration tests would have had to point the sweep at the repository, discover the real baseline, build it and create `.pio/` — while testing the rule that says the tree stays clean. The default remains the repository root derived from the script's own location; a dedicated test runs the sweep from a foreign cwd carrying no `homeworks/` at all and asserts it still lists `project-baseline`, which is only true if the default is not the working directory.
- **The short-circuit proof is a fact about control flow, not a log-line count.** The plan offered both and preferred the former; the fixture was built to make it available — a valid project beside the violation, plus an unresolvable `PLATFORMIO_CORE`, so the build stage announces itself if it was ever reached.
- **`resolvePio` guards the home-relative probe on `$HOME`.** The verified skeleton interpolates `process.env.HOME ?? ""`, which degrades the probe into a path relative to the working directory when HOME is unset. The guard changes nothing on this machine and removes the accidental-match case.
- **The RED commit shipped an interface placeholder for the sweep.** A wholly absent module makes `node <path>` exit 1 with `Cannot find module` — and exit 1 is exactly what the zero-match contract test asserts. Without the placeholder that test would have passed for the wrong reason and the RED evidence would have been worthless.
- **The expected pattern is compared as a literal.** `ID_PATTERN_TEXT` is the grammar's printable spelling; interpolating it into a `new RegExp` asserts a slightly different language. The test uses `stderr.includes("Expected: " + ID_PATTERN_TEXT)`.
- **The suite is split the way plan 01-01 split its own.** The RED commit held five high-level contract cases so the tracer had genuine failing evidence; task 2 replaced them with the exhaustive nine-case suite and the shared builders its action specifies.
- **`REQUIREMENTS.md` was deliberately not modified.** REPO-02 and REPO-03 are both declared by plan 01-05 as well; the shared-ID gate forbids marking either complete until 01-05's SUMMARY exists, and a premature flip would report a phase requirement as done while a sibling plan is still outstanding.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The malformed-id assertion was written against a regex, which is not the language the constant spells**

- **Found during:** Task 2 (integration suite), on the first full run of the nine cases
- **Issue:** the test interpolated the imported `ID_PATTERN_TEXT` into `new RegExp(\`Expected: ${ID_PATTERN_TEXT}\`)`. The constant is the grammar's readable spelling, so as a pattern it means something else — the `-` before `[a-z0-9]+` and the `(?:…)` group do not round-trip unambiguously. The assertion failed while the sweep's output was exactly right, which is the worst shape of test bug: a correct implementation reported as broken.
- **Fix:** compare literally — `assert.ok(result.stderr.includes(\`Expected: ${ID_PATTERN_TEXT}\`), result.stderr)` — which is also what the plan's action asks for ("the expected pattern text taken from the exported constant rather than retyped").
- **Files modified:** `tools/tests/sweep.test.mjs`
- **Verification:** the nine-case suite reports `pass 9 / fail 0`; the sweep's stderr carries `Expected: ^(?:m[0-9]{2}-l[0-9]{2}|project)-[a-z0-9]+(?:-[a-z0-9]+)*$` verbatim.
- **Committed in:** `f2513e7` (Task 2)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Confined to one assertion in one test file. No production behaviour changed and no contract the plan states was altered — the sweep's message and the grammar are exactly as specified. Without the fix the task-2 verify gate could not have passed.

## TDD Gate Compliance

| Gate | Commit | Evidence |
|------|--------|----------|
| RED | `d41a683` | `FORCE_COLOR=0 node --test --test-reporter=tap tools/tests/sweep.test.mjs` exited 1 with the TAP plan `1..5` and `pass 1 / fail 4`; `gsd_run check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`reason: target_test_failed`, `matched_test: "a tree with no homework projects exits 1 and says zero were found"`, `format: tap`, no report errors) |
| GREEN | `d992d5f` | the same five cases then passed, and all eight of task 1's `<verify>` commands produced their expected result |
| REFACTOR | — | not needed; task 2 changed only the test infrastructure, so no commit |

**Semantic assessment of the RED evidence.** The target test executed in that run (TAP point 2) and failed on its own planned assertion — `0 !== 1` at `strictEqual` on the sweep's exit status — not on a load, fixture, discovery or syntax fault: the test file resolved, the plan line `1..5` proves all five tests ran, and the spawned subprocess started and returned a status. Four of the five cases failed on their assertions. The fifth, the `--allow-empty` case, passed because the placeholder also exits 0; it does not authorize the contract, which the target test asserts directly.

The record was submitted with the reporter's own stdout beginning at `TAP version 13`. An earlier capture was rejected as `invalid_record` with `Unsupported report format` because this harness sets `FORCE_COLOR=1`, and the first attempt both prepended Node's `NO_COLOR` warning banner and ANSI-coloured the failure diff; the accepted run used `FORCE_COLOR=0` and no banner. The scratch record was deleted before the RED commit, so the tree carries no evidence artifact.

## Issues Encountered

- **The five `<verify>` commands in task 1 were run as written, all eight producing their specified result** — the `--list` grep, the non-zero zero-match exit, the `ZERO homework projects` count of 1, the escape hatch's exit 0, the `DEPTH RULE VIOLATED` count of 1, the `MALFORMED HOMEWORK ID` count of 1, the `failed to start` count of 1 and the no-shell source scan.
- **`PLATFORMIO_CORE=/nonexistent/pio` needed no PATH export.** `resolvePio` finds `$HOME/.platformio/penv/bin/pio` before it probes the PATH, so the sweep works from any shell without `export PATH="$HOME/.platformio/penv/bin:$PATH"` — the remedy its own not-found message prints is for the case where the binary is absent entirely.
- **`homeworks/project-baseline/.pio/` is created by the sweep's own build and is gitignored.** The root `.gitignore` (plan 01-02) resolves it as `homeworks/project-baseline/.pio/build` with `.pio/` named as the source, so `git status --porcelain` stayed empty; the directory was removed before this plan returned so the worktree carries no untracked or ignored content at all.
- No other problems.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- The gate Phase 6's CI matrix will consume exists: `node tools/sweep-homeworks.mjs --list` prints validated ids after validation and after the zero-match check, so no consumer can obtain an unvalidated or empty list. The matrix job never passes `--allow-empty`.
- `tools/lib/discover.mjs` now has three consumers — the generator, the sweep and the tests — and all three read "a homework is a directory directly under `homeworks/` whose name matches the grammar and which contains a `platformio.ini`" from one place.
- Plan 01-05's acceptance sequence is unblocked: `node tools/sweep-homeworks.mjs` exits 0 having built the baseline from the repository root, which is the build half of the clean-tree demonstration, and the tree stays clean because `.pio/` is ignored.
- The four traps recorded in `.planning/PROJECT.md` remain live, and this plan discharges the one it owns: the sweep fails by default on zero matches and its only override is the named `--allow-empty` flag.
- Residual: the sweep resolves PlatformIO from `$HOME`, the PATH or `PLATFORMIO_CORE`. A tree built inside a container with a different home directory needs the explicit override — which is why the not-found message prints the export line rather than a bare command name.

---

*Phase: 01-repository-skeleton-and-project-layout*
*Completed: 2026-10-15*

## Self-Check: PASSED

- FOUND: `tools/sweep-homeworks.mjs`
- FOUND: `tools/tests/sweep.test.mjs`
- FOUND: `tools/tests/helpers.mjs`
- FOUND: commit `d41a683` (ancestor of HEAD)
- FOUND: commit `d992d5f` (ancestor of HEAD)
- FOUND: commit `f2513e7` (ancestor of HEAD)
- Plan-level verification, all five items: PASS
  - `node tools/sweep-homeworks.mjs --list` → exactly `project-baseline`, exit 0
  - `node tools/sweep-homeworks.mjs` → built the baseline, `[SUCCESS] Took 2.49 seconds`, `used 268177 bytes from 6553600 bytes`, exit 0
  - `node --test "tools/**/*.test.mjs"` → tests 27, pass 27, fail 0
  - the five fixture-based commands → exit statuses and banners as specified
  - `git status --porcelain` → empty, and no entry matching `.pio/` or `compile_commands.json`
