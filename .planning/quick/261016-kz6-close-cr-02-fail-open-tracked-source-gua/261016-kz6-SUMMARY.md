---
phase: 261016-kz6-close-cr-02-fail-open-tracked-source-gua
plan: 01
subsystem: testing
tags:
  - node-test
  - gitignore
  - fail-closed
  - code-review
  - cr-02
  - git-ls-files

# Dependency graph
requires:
  - phase: 01-repository-skeleton-and-project-layout
    provides: the ignore contract, the root `.gitignore`, the nested baseline ignore file and `tools/tests/ignore-rules.test.mjs`
provides:
  - "A tracked-source guard that fails closed for the root ignore file: `isRepoOwnedIgnoreSource` now asks `git ls-files --error-unmatch` about every reported source, `.gitignore` included"
  - "A reproducible two-directional fixture recipe proving the guard can go red, for the Phase 6 hook and CI wiring to reuse"
affects:
  - 06-hooks-and-ci

# Actuals (#2632) — chars/4 over the realized diff, not a harness token count.
# The plan carried no `estimate` field, so these are recorded for calibration only.
actuals:
  tokens: 337
  tasks: 2
  commits: 1

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fail-closed guard: a distinction the guard depends on is asked of the tool that owns it (git) rather than short-circuited by an identity comparison on the path"
    - "Two-directional fixture measurement: the same throwaway repository is read with the file under test changed, then with the fixture index changed, so the cause of a green/red flip is isolated"

key-files:
  created: []
  modified:
    - "tools/tests/ignore-rules.test.mjs"

key-decisions:
  - "Deleted the identity exemption rather than adding a second root-specific check: the three guards below it already admit `.gitignore`, so routing the root file through the same path a nested one takes is the whole behavioural change"
  - "Corrected the docstring sentence that the deletion made false, wrapping the replacement across two lines to keep the file's ~92-column docstring style — this also lands the measured 2-insertion / 2-deletion diff the plan predicted"
  - "Both fixture measurements were taken with `git -C <fixture>` against a repository created under `${TMPDIR:-/tmp}`, never against this checkout, and the real index was re-verified afterwards rather than inferred from a clean status line"
  - "`.planning/config.json` and the other four planning files were copied into the fixture so the 'tracked planning data' test had real inputs; `state.json` was deliberately not copied, because tracking an ignored path would have made the fixture fail a test the real repository passes"

patterns-established:
  - "A guard's exemption is a claim about a failure mode; it must be reproduced before it is removed, and reproduced again after"

requirements-completed: []

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "The root ignore file is no longer exempted by identity from the tracked-ness question in `isRepoOwnedIgnoreSource`"
    verification:
      - kind: unit
        ref: "node --test tools/tests/ignore-rules.test.mjs#every machine-local artifact resolves to an ignore file this repository tracks"
        status: pass
    human_judgment: false
  - id: D2
    description: "The guard demonstrably fails closed: red on a repository whose root ignore file has left the index, green on the pre-change file over the same input"
    verification:
      - kind: manual_procedural
        ref: "mktemp -d fixture + `git -C <fixture> rm --cached .gitignore` + `node --test <fixture>/tools/tests/ignore-rules.test.mjs` -> 5 tests, 4 pass, 1 fail, exit 1; with `git -C <fixture> add .gitignore` -> 5 pass, 0 fail, exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "The CR-02 disposition row in .planning/phases/01-repository-skeleton-and-project-layout/01-REVIEW-DISPOSITION.md remains `open` — closing it is bookkeeping owned outside this plan"
    verification: []
    human_judgment: true
    rationale: "The plan explicitly places the ledger row outside its scope; only the orchestrator owns that file, so a human must decide when the finding is recorded as closed rather than the executor silently absorbing it"

# Metrics
duration: 3min
completed: 2026-10-16
status: complete
plan_head_before: c7238d114f529676bb91778986a0301b2c7f47b5
plan_head_after: 9f9e2cccadad318a839abcf625acb230e9028571
commits: 1
---

# Phase 261016-kz6 Plan 01: Close CR-02 Summary

**The ignore-contract guard in `tools/tests/ignore-rules.test.mjs` now asks git whether the root `.gitignore` is tracked, so it goes red instead of green on a repository whose clone inherits zero ignore rules.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-10-16T12:12:04Z
- **Completed:** 2026-10-16T12:15:17Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Removed the single-statement identity exemption (former line 59) that returned `true` for `.gitignore` before the tracked-ness question, short-circuiting the one distinction the guard exists to make. The root file now passes through the same absolute/`..` rejection, basename check and `git ls-files --error-unmatch` call that a nested ignore file already went through.
- Corrected the docstring sentence the deletion made false — the root file no longer "always qualifies" — replacing it with the accurate statement that both the root and a nested ignore file qualify only while git tracks them.
- Reproduced the defect before fixing it: a throwaway repository whose root `.gitignore` had been removed from the index ran the **unmodified** guard at **5 tests / 5 pass / 0 fail / exit 0** while `git ls-files --error-unmatch -- .gitignore` exited 1 and `git check-ignore -v .DS_Store` still printed `.gitignore:82:`. That pair is the false green in full: git resolves ignore rules from the working tree, so the guard could not see the failure mode it exists to detect.
- Closed the defect and proved it twice, in two independent fixtures, in both directions, against the **committed** blob rather than the working copy.

## Task Commits

Each task was committed atomically:

1. **Task 1: Reproduce the false green, then ask git about the root ignore file's tracked-ness** - `9f9e2cc` (fix)
2. **Task 2: Confirm the committed guard fails closed, and audit the change's reach** - verification-only, no commit (no file changed)

**Plan metadata:** none — this plan is a quick task; the orchestrator owns the docs commit.

## Files Created/Modified

- `tools/tests/ignore-rules.test.mjs` — the identity exemption deleted, one docstring sentence replaced. 2 insertions, 2 deletions, no other path.

## Measured Evidence

Every reading below was taken, not judged. `unmodified` / `corrected` names the version of `tools/tests/ignore-rules.test.mjs`; `tracked` / `untracked` names whether the fixture's root `.gitignore` was in that fixture's index.

| # | Fixture | File under test | Root ignore file | tests | pass | fail | exit |
|---|---|---|---|---|---|---|---|
| 1 | fixture A | unmodified | untracked | 5 | 5 | 0 | 0 |
| 2 | fixture A | corrected | tracked | 5 | 5 | 0 | 0 |
| 3 | fixture A | corrected | untracked | 5 | 4 | 1 | 1 |
| 4 | fixture B (fresh, committed blob) | committed | untracked | 5 | 4 | 1 | 1 |
| 5 | fixture B (fresh, committed blob) | committed | tracked | 5 | 5 | 0 | 0 |
| 6 | real checkout | committed | tracked | 32 | 32 | 0 | 0 |

Readings 1 and 3 differ only by the file under test — that pair is the defect and its closure. Readings 3 and 4 differ only by the fixture being rebuilt from the committed blob. Readings 3 and 2 (and 5) differ only by the fixture's index.

The failure text observed in readings 3 and 4, verbatim:

```
AssertionError [ERR_ASSERTION]: .planning/milestone.lock is ignored by .gitignore, which a clone
does not inherit — the rule must live in a tracked ignore file (the root .gitignore, or a nested
one git tracks); protects the GSD lock-file class — the artifact that shipped unignored
```

Supporting measurements:

- `git -C <fixture A> ls-files --error-unmatch -- .gitignore` → exit 1; `git -C <fixture A> check-ignore -v .DS_Store` → `.gitignore:82:.DS_Store	.DS_Store`, exit 0. The mechanism, confirmed rather than assumed.
- `git diff --numstat -- tools/tests/ignore-rules.test.mjs` → `2	2	tools/tests/ignore-rules.test.mjs`, and nothing else.
- `git show --stat HEAD` → `tools/tests/ignore-rules.test.mjs | 4 ++--`, `1 file changed, 2 insertions(+), 2 deletions(-)`.
- `git diff --exit-code HEAD -- tools/tests/ignore-rules.test.mjs` → exit 0: the committed blob and the working-tree file are byte-identical.
- `git show --pretty=format: --name-only HEAD` → `tools/tests/ignore-rules.test.mjs`, one path.

## Reach Audit — the four sibling findings stay open

| Finding | Check | Reading |
|---|---|---|
| CR-01 (`generate-workspace.mjs --check` fail-open) | `git diff --stat HEAD -- tools/generate-workspace.mjs` | empty; last commit touching it is `e3e64fb` (Phase 01 P01), not this plan |
| WR-12 (comment-marker guard reads only the root ignore file) | `grep -n "readFileSync" tools/tests/ignore-rules.test.mjs` | line 194 still `readFileSync(join(REPO_ROOT, IGNORE_FILE), "utf8")` — root only, unchanged |
| WR-13 (nested project's generated `.vscode/*` in no `MUST_BE_IGNORED` entry) | `grep -n vscode tools/tests/ignore-rules.test.mjs` | lines 94 and 98 only — the two root-level entries; no nested `.vscode/*` entry added |
| WR-14 (`extensions.json` indentation) | not touched | no path outside `tools/tests/ignore-rules.test.mjs` changed |
| `.gitignore` | `git diff --stat HEAD -- .gitignore` | empty; last commit touching it is `da4f577` (Phase 01 P06) |

## Repository invariants after the run

- `git ls-files --error-unmatch -- .gitignore` → `.gitignore`, exit 0.
- `git ls-files | wc -l` → 60 tracked paths; `git ls-files -i -c --exclude-standard | wc -l` → 0 tracked-and-ignored paths.
- `git ls-files -s .gitignore` → `100644 92da15eee54b36b67f1a418eb39975bb3854c34d 0	.gitignore` — a normal tracked blob at stage 0, not a staged deletion.
- `git ls-files | grep -c kz6-fixture` → 0. No fixture path leaked into this index.
- `git status --porcelain` → empty immediately after the fix commit.

The index was checked explicitly, not inferred from the status line, because every fixture command ran as `git -C <fixture-dir>` and a mis-scoped `rm --cached` would have shown up here rather than in a clean `git status`.

## Decisions Made

- **Delete the exemption, add nothing.** The plan's diagnosis held under measurement: the three guards below the exemption already admit `.gitignore`, so the deletion is the entire behavioural change. No replacement check, no restructuring.
- **Wrap the corrected docstring sentence onto two lines.** This is also what makes the diff land on the measured 2 insertions / 2 deletions the plan's done criteria and verification item 5 predicted three times; the wrap matches the surrounding docstring's ~92-column style.
- **Copy the five tracked planning files into each fixture, but not `state.json`.** Test 4 asserts the exact tracked set, and test 3 ("no tracked path is hidden by the ignore configuration") would have failed on a fixture that tracked an intentionally ignored path — a fixture artefact, not a finding.

## Deviations from Plan

None - plan executed exactly as written.

The plan's `actuals` field carried no `estimate`, so the recorded token figure is calibration-only and was not compared against anything.

## Issues Encountered

- The initial compound fixture-construction command (multi-line, containing `rm -rf`) was refused by the harness's worktree isolation guard. It was rebuilt as a sequence of plain single-purpose commands targeting an already-created `mktemp -d` directory, with no destructive operations. No effect on the measurement.
- Two fixture runs were piped through `grep` for the summary lines; the counts were re-read with a wider filter when the first pattern did not match the ANSI-coloured output. The counts reported above are from the wider read.

## Known Stubs

None. The change removes a branch; it introduces no placeholder, no empty default and no unwired data source.

## Threat Flags

None. The change removes an exemption rather than adding surface: no new endpoint, no new auth path, no new file access pattern.

Threat-register dispositions from the plan, as executed:

- **T-261016-KZ6-01** (mitigate) — the exemption is gone and the mitigation was proven by measurement, not assertion: readings 3 and 4 in the table above are the guard going red on a fixture whose root ignore file left the index, with the failure naming `.gitignore`.
- **T-261016-KZ6-02** (mitigate) — every fixture git invocation was addressed with `git -C <fixture-dir>` against a repository under `${TMPDIR:-/tmp}`; both tasks asserted `git ls-files --error-unmatch -- .gitignore` exits 0 in the real checkout, and Task 2 additionally re-read the real index (60 tracked, 0 tracked-and-ignored, 0 fixture paths, `.gitignore` at stage 0).
- **T-261016-KZ6-SC** (accept) — nothing installed, no manifest or lockfile touched; the runner is the Node built-in `node:test`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CR-02 is closed in code. The guard can now fail, which is the precondition Phase 6 needs before wiring the repository's gates into hooks and CI: a guard that reports green on the exact input it was written to reject converts an absence of evidence into evidence of absence.
- The fixture recipe recorded above is reproducible and is the shape Phase 6 can reuse if it wants the ignore contract exercised against a deliberately broken index rather than only against the healthy tree.
- **Still open and untrusted until closed:** CR-01 (`generate-workspace.mjs --check` returns 0 without checking when its own path carries a symlinked component) is the other half of the fail-open class named in STATE.md and was deliberately not touched here. Phase 6 wires `--check` into hooks and CI, so it must be closed before that gate is trusted.
- WR-12, WR-13 and WR-14 remain open with their ledger dispositions unchanged.

---
*Phase: 261016-kz6-close-cr-02-fail-open-tracked-source-gua*
*Completed: 2026-10-16*

## Self-Check: PASSED

- `FOUND: .planning/quick/261016-kz6-close-cr-02-fail-open-tracked-source-gua/261016-kz6-SUMMARY.md`
- `FOUND: tools/tests/ignore-rules.test.mjs`
- `FOUND: 9f9e2cc` — the fix commit is an ancestor of HEAD (`git merge-base --is-ancestor` exit 0)
- `git rev-list --count c7238d1..HEAD` = 1, matching the ledger recorded at plan start
