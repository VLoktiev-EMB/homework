---
phase: 01-repository-skeleton-and-project-layout
plan: 05
subsystem: infra
tags: [acceptance-run, phase-log, platformio, esp32-s3, n16r8, git-status, clean-tree, depth-rule, vscode-workspace, generate-drift-check]

requires:
  - phase: 01-repository-skeleton-and-project-layout
    provides: "tools/lib/discover.mjs, tools/generate-workspace.mjs and homework.code-workspace (01-01); the root .gitignore, .editorconfig, .gitattributes and .vscode settings (01-02); the corrected AGENTS.md, the PROJECT.md traps register and the root README (01-03); tools/sweep-homeworks.mjs and its nine-case suite (01-04)"
provides:
  - "The recorded acceptance run of Phase 1 — the phase log carrying the pre-phase baseline, the two verbatim git-status readings, the build's partition-size line, the depth-probe banner, the drift-check line, the discovery output, the test pass count and the machine-state classification"
  - "The permanent statement that criterion 2 is discharged in two halves and why the second half is enforced by the detector rather than by a manufactured build failure"
affects: ["phase 2", "phase 6", "phase 8"]

actuals:
  tokens: 7737
  tasks: 2
  commits: 2
  plan_head_before: 22a723e50041a1dd0f348153881b330573cb08e8
  plan_head_after: efcbee5e57037f76bcc0089ac35d37da32bebd78
  # `tokens` is chars/4 over the realized diff (#2632) — 30,947 characters in the phase
  # log at the task-2 commit — on the same estimateTokens scale as the plan's `estimate`,
  # never a harness token count. `commits` is MEASURED, never narrated (#3968):
  #   git rev-list --count 22a723e5…(plan_head_before)..efcbee5…(plan_head_after) -> 2
  # i.e. the two task commits. The metadata commit that finalizes this block is not
  # counted, matching how plan 01-03 recorded its own ledger.

tech-stack:
  added: []
  patterns:
    - "The acceptance run records verbatim command output at every stage, so the phase log is evidence rather than assertion"
    - "A phase log is written once, after the last assertion it could have invalidated, because it is itself a new unignored file under a tracked directory"
    - "Criterion 2 is split honestly: the build proves half (a), the rule-naming detector proves half (b), and neither is weakened to manufacture the other"

key-files:
  created:
    - ".planning/phases/01-repository-skeleton-and-project-layout/01-05-SUMMARY.md — the phase log; this file is both the plan's deliverable and the evidence the phase's four criteria depend on"
  modified: []

key-decisions:
  - "The acceptance run's two clean-tree readings are taken at the plan's own two points — before the log exists and after it is committed — and neither reading is replaced by a reading taken between the log's write and its commit."
  - "The build was invoked through the absolute PlatformIO binary rather than the plan's `PATH=\"$HOME/.platformio/penv/bin:$PATH\" pio` prefix, because the worktree isolation guard refuses a command whose first word is a `VAR=value` assignment. It is the same resolved binary; the plan itself records the absolute path as equivalent."
  - "The phase log is the sanctioned repair for its own untracked entry. The generated state file beside it is closed by an ignore rule instead, because it is timestamped machine state rewritten on every transition — committing it would add a churning line to a history a course instructor reads."
  - "`.planning/milestone.lock` is recorded as a known fourth machine-local GSD artifact that no Phase 1 plan named and no pattern matches. It belongs to plan 01-02's ignore file, so editing `.gitignore` here would break requirement traceability; it is recorded instead."

patterns-established:
  - "Write the phase log once, as late as the assertions allow: a log written earlier dirties the tree and makes the clean-tree reading fail over the log rather than over the thing it is testing"
  - "A deferred observation is recorded with an explicit unfilled output slot, so its absence is visible rather than implied"

requirements-completed: [REPO-01, REPO-02, REPO-03, REPO-04]

coverage:
  - id: D1
    description: "Criterion 3's build half: a full `pio run` plus a `-t compiledb` run leave `git status --porcelain` completely empty — the build directory and the compilation database exist on disk and match no tracked path because the ignore rules close them at any depth"
    requirement: REPO-04
    verification:
      - kind: integration
        ref: "test -z \"$(git status --porcelain)\" after `pio run -d homeworks/project-baseline` and `-t compiledb`"
        status: pass
      - kind: integration
        ref: "git check-ignore -v homeworks/project-baseline/compile_commands.json -> .gitignore:20"
        status: pass
    human_judgment: false
  - id: D2
    description: "Criterion 2 half (a): the baseline builds from the repository root — a directory carrying no platformio.ini of its own — with one command, and reports the 16 MB application partition, so the N16R8 overrides are in effect"
    requirement: REPO-02
    verification:
      - kind: integration
        ref: "pio run -d homeworks/project-baseline -> exit 0, '[SUCCESS] Took 2.44 seconds', Flash 'used 268177 bytes from 6553600 bytes'"
        status: pass
      - kind: integration
        ref: "pio run -d homeworks/project-baseline 2>&1 | grep -c 6553600 -> 1"
        status: pass
    human_judgment: false
  - id: D3
    description: "Criterion 2 half (b): a platformio.ini placed one level below a homework folder makes the sweep exit 1 with DEPTH RULE VIOLATED, the reason, and the offending repository-relative path — demonstrated against the real tree without weakening the detector"
    requirement: REPO-03
    verification:
      - kind: integration
        ref: "node tools/sweep-homeworks.mjs 2>&1 | grep -c 'DEPTH RULE VIOLATED' against a live probe tree -> 1, exit 1"
        status: pass
      - kind: integration
        ref: "rm -rf homeworks/m01-l03-depthprobe; test ! -d homeworks/m01-l03-depthprobe -> exit 0 (no residue)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Criterion 1's automated half: the committed workspace file passes its drift check against the tree, so it lists exactly the repository root, the shared-library tree and the baseline project"
    requirement: REPO-01
    verification:
      - kind: integration
        ref: "node tools/generate-workspace.mjs --check -> 'homework.code-workspace is up to date', exit 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "Criterion 1's manual half: opening homework.code-workspace in VS Code shows exactly three top-level roots, and the shared-library root resolves without an unresolved-path marker"
    requirement: REPO-01
    verification: []
    human_judgment: true
    rationale: "Opening an editor window is not automatable and no agent can see what it renders. The observation is DEFERRED to end-of-phase verification (/gsd-verify-work 1) per this phase's human_verify_mode; the log carries the exact file to open, the exact three root names expected, and an explicitly unfilled output slot. An invented observation would enter later phases as fact."
  - id: D6
    description: "Criterion 3's editor half: after opening and saving one tracked file in each of the three roots, `git status --porcelain` still prints nothing — the modification source a build cannot exercise"
    requirement: REPO-04
    verification: []
    human_judgment: true
    rationale: "The reading is a property of a human editor session with format-on-save enabled, and it must be taken before the observations are appended to this log. It is DEFERRED to end-of-phase verification with an explicitly unfilled output slot and the exact command and its required timing written down."
  - id: D7
    description: "The one criterion-3 judgement this phase had to make is recorded: the generated state file is closed by an ignore rule because it is timestamped machine state rewritten on every transition, and it was explicitly NOT committed"
    requirement: REPO-04
    verification:
      - kind: other
        ref: "grep -c 'state.json' .planning/phases/01-repository-skeleton-and-project-layout/01-05-SUMMARY.md -> >= 1"
        status: pass
      - kind: other
        ref: "git check-ignore -v .planning/state.json -> .gitignore:91"
        status: pass
    human_judgment: false

metrics:
  duration: 4min
  completed: 2026-10-15
  status: complete
---

# Phase 1 Plan 5: The Acceptance Run Summary

**Phase 1's four success criteria observed on the real tree in one run: the baseline builds from the repository root reporting the 16 MB application partition, a misplaced project makes the sweep name the depth rule, and `git status --porcelain` is empty before the build, after the build and after the compilation-database run — with every stage's output recorded verbatim and the two non-automatable halves explicitly deferred rather than invented.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-10-15T12:55:39Z
- **Completed:** 2026-10-15T12:59:23Z
- **Tasks:** 2
- **Files modified:** 1 created

## Accomplishments

- **Criterion 3 holds by construction, not by late repair.** `git status --porcelain` was empty before the build, empty after a full `pio run`, and empty after `-t compiledb`. The two artifacts the build created — `homeworks/project-baseline/.pio/` and `homeworks/project-baseline/compile_commands.json` — exist on disk and are reported only under `--ignored`, each resolving to the repository's own `.gitignore`.
- **Criterion 2 half (a) is proven on the real tree.** The build ran from the repository root — a directory with no `platformio.ini` of its own — and reported `used 268177 bytes from 6553600 bytes`. `6553600` is `0x640000`, the application partition of `default_16MB.csv`; the default board definition's `default_8MB.csv` yields `0x330000`. The four N16R8 overrides are therefore in effect through the acceptance path, not merely in the file.
- **Criterion 2 half (b) is proven by the detector, and the detector was not weakened.** A `platformio.ini` planted one level below a homework folder made the sweep exit 1 with `DEPTH RULE VIOLATED`, the one-level requirement, the two-line reason, and the offending repository-relative path. No build failure was manufactured to stand in for it.
- **Criterion 1's automated half passes and its manual half is recorded as deferred.** `node tools/generate-workspace.mjs --check` printed `homework.code-workspace is up to date` and exited 0, so the committed file still matches the tree exactly.
- **The tree is clean after the phase's own probe.** The probe directory was removed and its absence asserted; `git status --porcelain` stayed empty through the removal.
- **The one judgement criterion 3 required is recorded, not glossed.** The third pre-phase entry, `.planning/state.json`, is closed by an ignore rule because it is timestamped machine state rewritten on every state transition — and deliberately **not** by being committed.

## Task Commits

Each task was committed atomically, and both touch only this phase log:

1. **Task 1: The acceptance run — build once, prove the depth rule, leave the tree clean** — `926db18` (docs)
2. **Task 2: Record the two non-automatable observations as deferred** — the commit carrying this revision of the phase log (docs)

**Plan metadata:** the closing commit of this plan, which finalizes the `actuals` block above with the measured commit count and the closing SHA.

---

# Phase Log — the Phase 1 Acceptance Run

Everything below is recorded output, not paraphrase. It was captured in one run on 2026-10-15 against the real tree.
Environment: Node v26.7.0, PlatformIO Core 6.2.0 (`/Users/vloktiev/.platformio/penv/bin/pio`), tree at `22a723e50041a1dd0f348153881b330573cb08e8`.

## 1. The pre-phase baseline — criterion 3 was measurably false when this phase began

Measured before Phase 1 wrote anything (`01-RESEARCH.md` § Validation Architecture, line 1047; re-stated in `01-PATTERNS.md`):

```
?? .DS_Store
?? .planning/research/.cache/
?? .planning/state.json
```

Three untracked entries. This is the state criterion 3 was written against, and it is recorded here because it is what makes the assertion meaningful rather than vacuously green on its first run: the criterion had something real to catch.

All three are now closed **by rule**. Verified against the repository's own `.gitignore`, not by eye:

```
$ git check-ignore -v .DS_Store
.gitignore:82:.DS_Store	.DS_Store

$ git check-ignore -v .planning/research/.cache/
.gitignore:120:.planning/research/.cache/	.planning/research/.cache/

$ git check-ignore -v .planning/state.json
.gitignore:91:.planning/state.json	.planning/state.json
```

(One further entry existed at the end of plan 01-01 and was correctly scoped to this plan: `?? homeworks/project-baseline/.pio/`, the build output the root `.gitignore` is chartered to cover. It is covered — see §3.)

## 2. The starting `git status`, and the tracked set

```
$ git status --porcelain
(no output)
```

Empty, and taken with the tree complete: every authored Phase 1 artifact — the four plan files, the four summaries, `01-CONTEXT.md`, `01-DISCUSSION-LOG.md`, `01-PATTERNS.md`, `01-RESEARCH.md`, `01-VALIDATION.md` and `SKELETON.md` — is tracked. No authored artifact of this phase is sitting untracked, so the clean-tree assertion below is not being propped up by an uncommitted file.

This is the second reading that matters: the pre-phase tree (§1) was dirty, and the tree at this plan's start is clean because four plans landed the rules, not because nothing was ever created.

## 3. The one-command build — criterion 2, half (a)

```
$ pio run -d homeworks/project-baseline
...
RAM:   [=         ]   5.7% (used 18604 bytes from 327680 bytes)
Flash: [          ]   4.1% (used 268177 bytes from 6553600 bytes)
Building .pio/build/projectbaseline_s3/firmware.bin
esptool.py v4.11.0
Creating esp32s3 image...
Merged 2 ELF sections
Successfully created esp32s3 image.
========================= [SUCCESS] Took 2.44 seconds =========================
```

The last two lines, verbatim:

```
Successfully created esp32s3 image.
========================= [SUCCESS] Took 2.44 seconds =========================
```

The size line this plan's gate asserts:

```
Flash: [          ]   4.1% (used 268177 bytes from 6553600 bytes)
```

`6553600` appears exactly once in the build output (`grep -c 6553600` → `1`). It is `0x640000`, the application partition from `default_16MB.csv`; the default board definition's 8 MB table yields `0x330000`. The N16R8 overrides are therefore live through the command this criterion names.

**Command form note (not a deviation).** The plan spells this as `PATH="$HOME/.platformio/penv/bin:$PATH" pio run -d homeworks/project-baseline`. The worktree isolation guard refuses a command whose first word is a `VAR=value` assignment, because it cannot statically prove the resolved binary is not `git` — the same constraint plan 01-01 recorded. The build was therefore invoked as `/Users/vloktiev/.platformio/penv/bin/pio run -d homeworks/project-baseline`: the identical binary the prefix resolves to, and the form the plan's own `corrections_that_override_sources` records as equivalent ("Prefixing the build with the local PlatformIO environment on the PATH is equivalent to and clearer than an absolute binary path").

### The compilation database

```
$ pio run -d homeworks/project-baseline -t compiledb
No dependencies
Building in release mode
Building compilation database compile_commands.json
========================= [SUCCESS] Took 0.26 seconds =========================

$ test -f homeworks/project-baseline/compile_commands.json
compiledb EXISTS at homeworks/project-baseline/compile_commands.json

$ git check-ignore -v homeworks/project-baseline/compile_commands.json
.gitignore:20:compile_commands.json	homeworks/project-baseline/compile_commands.json
```

The database is produced **inside the project directory** and is closed by an unanchored ignore rule, so it is covered at any depth.

## 4. The depth rule against the real tree — criterion 2, half (b)

The probe: `homeworks/m01-l03-depthprobe/deeper/platformio.ini` — a copy of the baseline environment one level below a folder whose name matches the frozen grammar.

```
$ node tools/sweep-homeworks.mjs
DEPTH RULE VIOLATED
Every homework must sit exactly one level below homeworks/.
Reason: every shared-library path in lib_deps is relative to the project,
so symlink://../../shared/lib/<name> cannot resolve from a deeper folder.
  deeper platformio.ini found: homeworks/m01-l03-depthprobe/deeper
[exit=1]

$ node tools/sweep-homeworks.mjs 2>&1 | grep -c 'DEPTH RULE VIOLATED'
1
```

The probe was then removed completely:

```
$ rm -rf homeworks/m01-l03-depthprobe; test ! -d homeworks/m01-l03-depthprobe
probe REMOVED (no residue)
[exit=0]
```

No residue: the probe left nothing behind, so it could not corrupt the clean-tree reading that follows.

**The detector was not weakened to produce this.** For contrast, PlatformIO's own error for the same tree is `PackageException: Can not create a symbolic link for ../../shared/lib/foo, not a directory` — accurate, but it points at the dependency rather than at the rule that was broken. The repository's message names the rule, the reason and the offending path, and it fires as a pure filesystem inspection **before any child process exists**.

## 5. The drift check — criterion 1's automated half

```
$ node tools/generate-workspace.mjs --check
homework.code-workspace is up to date
[exit=0]
```

The committed workspace file still agrees byte-for-byte with the filesystem. The three roots it lists are `root` (`.`), `shared` (`shared`) and `project-baseline` (`homeworks/project-baseline`).

## 6. Discovery — the sweep's list contract

```
$ node tools/sweep-homeworks.mjs --list
project-baseline
[exit=0]
```

Exactly one line, exit 0. No build occurred in this step: `--list` exits after validation and after the zero-match check, before PlatformIO is even resolved.

## 7. The full test suite

```
$ node --test "tools/**/*.test.mjs"
...
ℹ tests 27
ℹ suites 0
ℹ pass 27
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 632.824208
[exit=0]
```

**Test pass count: 27 passed, 0 failed, 0 skipped, 0 todo.** The quoted glob is mandatory — unquoted, zsh expands it and errors when it matches nothing. (`FORCE_COLOR=0` was set for the TAP-parsing capture this harness's colour banner would otherwise break; it is irrelevant to the non-TAP run recorded here.)

## 8. The clean-tree assertion — criterion 3

```
$ git status --porcelain
(no output)
[exit=0]
```

**Empty.** Not a shortened list, not "only the expected entries" — empty.

This reading is taken at the plan's own required point: **after the full build and the compilation-database run, and before this log was written.** The log is itself a new, unignored file under a tracked directory, so a reading taken after writing it would have failed over the log rather than over criterion 3; that is why the log is written once, here, at step 7.

The artifacts the run created are present and invisible to git — the evidence that the emptiness is a property of the ignore rules rather than of nothing having happened:

```
$ git status --porcelain --ignored | grep -E '\.pio/|compile_commands'
!! homeworks/project-baseline/.pio/
!! homeworks/project-baseline/compile_commands.json
```

Nothing was staged to make this true. No build artifact, compilation database or generated editor file was committed, and no ignore rule was relaxed — the ignore file is the mechanism, and staging the artifacts would satisfy the letter of the criterion while destroying its purpose.

The second, closing reading — taken after this log is committed — is recorded in §11.

## 9. The machine-state classification

The third entry of the pre-phase baseline requires a judgement, and it is recorded explicitly rather than left implicit:

**`.planning/state.json` was closed by an ignore rule (`.gitignore:91`), and was explicitly NOT committed.**

The reason: it is GSD's generated state file, it carries a timestamp, and it is rewritten on every state transition. Committing it would put a churning line into a git history the course instructor reads, and would make the file a merge-conflict point in every parallel wave. Before plan 01-02 it was ignored only by this machine's global excludes file (`~/.config/git/ignore`), so a fresh clone was dirty on day one — the exact state criterion 3 forbids. The rule is named by **exact path** rather than as a glob over `.planning/`, so it cannot swallow the tracked planning data beside it (`.planning/config.json` is committed today).

The contrast with **this log**: the phase log is *authored* content, not machine-written state. For authored content the sanctioned repair for an untracked entry is to commit it — never to ignore it. That is what step 7 does, and it is why the log's own entry is closed by a commit while `state.json`'s is closed by a rule.

## 10. Criteria 2 and 3 are each discharged in two halves, and here is why

**Criterion 2 — "builds from the repo root with exactly one command, and moving it one level deeper breaks the build":**

- **Half (a)** — the one-command build from the repository root — is proven by running the build. §3 above: exit 0, `[SUCCESS] Took 2.44 seconds`, the 16 MB partition.
- **Half (b)** — the depth rule being load-bearing — is proven by the sweep's **rule-naming detector** (§4), **not** by making a build fail.

The reason the second half is enforced by the detector rather than by a build failure: **the baseline carries no symlinked shared-library dependency until Phase 3.** With no `lib_deps = <name>=symlink://../../shared/lib/<name>` line yet, a project moved one level deeper still *compiles* — so a build-failure demonstration would require planting a dependency the repository does not yet have, and the failure that does arrive with Phase 3 is a dependency-install error naming the dependency rather than the rule. Neither would demonstrate the depth rule; the detector does, today, by naming the rule before any child process exists.

**Phase 3 is where the build-failure half becomes observable**, the moment a shared-library symlink dependency exists. Until then, half (b) is discharged by the detector, deliberately, and the detector is never relaxed to manufacture a green result.

**Criterion 3 — "`git status` stays clean across a full build and an editor session":**

- **Half (a)** — the **build** half — is verified in this plan. §3 and §8 above: two clean readings around a full `pio run` and a `-t compiledb` run.
- **Half (b)** — the **editor** half — is deferred to end-of-phase verification. See §12.

**Criterion 4 — the sweep fails loudly on zero matches** — is discharged by plan 01-04, which owns it, and is not re-observed here: the sweep's validated code path was exercised in this run through `--list` (§6) and through the depth probe (§4), both of which pass through the same validation and zero-match logic before reaching the build stage. Plan 01-04's nine-case suite covers the zero-match exit itself, and 01-05's test run (§7) includes those cases.

## 11. The closing `git status`, with this log committed

The phase log is a new, unignored file under a tracked directory, so the reading that matters is the one taken **after** it was committed — not the one taken between the write and the commit, which would have failed over the log rather than over criterion 3.

With this log committed at `926db18`:

```
$ git status --porcelain
(no output)
[exit=0]
```

**Empty.** Both clean-tree readings this plan asserts are therefore empty — the one at step 6, with the log not yet written (§8), and this one, taken after the log was written **and committed**.

`926db18` is the revision a human must begin the deferred editor session from (§12): it is the last commit in which every tracked file is committed and nothing is untracked.

## 12. Manual observations — DEFERRED to `/gsd-verify-work 1`

Two halves of two success criteria cannot be automated, because no agent can see what a VS Code window renders and no agent can perform a human editor session. Per this phase's verification policy (`workflow.human_verify_mode: end-of-phase`, D-20) they are **deferred to end-of-phase verification** rather than pausing the plan, and they are recorded here with their exact procedure and an **explicitly unfilled output slot** for each. Nothing in this section is an observation that was made; every slot below is empty because the observation has not happened yet. This is deliberate — a plausible-sounding invented observation would enter the phase log as evidence and be read as fact by every later phase.

**Timing rule that governs both observations, stated before either procedure:** `git status --porcelain` must be run and its output copied down **before** the results are written into this log. This log is itself a tracked file; appending to it dirties the tree, so a reading taken after the append would fail over the log rather than over the editor session it is meant to test. Record the reading first, then bring it here.

### Observation 1 — criterion 1's manual half

**What must be opened:** the committed workspace file, `homework.code-workspace`, at the repository root — in VS Code, as a workspace (File → Open Workspace from File…), from a checkout that has not been modified since `926db18`. Not the folder; the workspace file. It is generated and must never be hand-edited.

**What must be seen:**

- that the window shows **exactly three top-level roots**, named for (1) the repository root, (2) the shared-library tree and (3) the baseline project — as VS Code renders them, the expected names being `root`, `shared` and `project-baseline`;
- that the shared-library root resolves to a real directory rather than showing an unresolved-path marker — `shared/` holds the tracked file `shared/lib/README.md`, which is what guarantees the directory exists after a fresh clone and therefore what makes the root resolve;
- that no second window and no second workspace file is needed, and that the editor does not report the workspace file as stale.

**Record verbatim:** the three root names exactly as VS Code displays them, and whether any root showed an error or unresolved-path marker.

**Unfilled output slot — Observation 1:**

```
root names as rendered: ______________________
                        ______________________
                        ______________________
unresolved-path marker on the shared-library root (yes/no): ______
stale-workspace warning shown (yes/no): ______
```

### Observation 2 — criterion 3's editor half

**What must be done:** within that same workspace session, open and save at least one **tracked** file in each of the three roots — a plan or documentation file under `.planning/`, a file under the shared-library tree, and one of the baseline project's files — then let the editor settle (allow format-on-save and final-newline insertion to run to completion).

**The exact command, and its timing:** run

```
git status --porcelain
```

from the repository root **after** the editor has settled and **before** these observations are written into this log. This is the half of criterion 3 that a build cannot exercise: it is the editor session, with format-on-save and final-newline insertion enabled, that is the plausible source of an unexpected modification. It must still print nothing.

**Unfilled output slot — Observation 2:**

```
$ git status --porcelain
______________________

[exit=______]
```

### What each observation covers, and what this plan already verified

- **Observation 1 covers criterion 1's manual half** — that opening the committed workspace file shows the three top-level roots. The **automated half** of criterion 1 was verified in this plan at task 1: `node tools/generate-workspace.mjs --check` printed `homework.code-workspace is up to date` and exited 0 (§5), proving the committed file still agrees byte-for-byte with the filesystem.
- **Observation 2 covers criterion 3's editor half** — that `git status` stays clean across an editor session. The **build half** of criterion 3 was verified in this plan at task 1: `git status --porcelain` was empty after a full `pio run` and a `-t compiledb` run (§3, §8), and empty again after this log was committed (§11).

**If either observation fails, record exactly what was seen** — which root was missing, which path appeared as modified, and the editor's own message — rather than retrying until it passes. A recorded failure with its evidence is worth more to the next phase than a repeated attempt that produces a clean log.

## Known deviations, issues and environment constraints

- **`.planning/milestone.lock` is a fourth machine-local GSD artifact that no Phase 1 plan named and no ignore pattern matches.** Measured by the orchestrator on its own working tree (branch `repo/init`), where a full `git status --porcelain` after every wave reports exactly one untracked entry: `?? .planning/milestone.lock`. It is written by GSD state transitions, not by a build, so it appears in any checkout where GSD has run — including a fresh clone, the moment the owner runs any GSD command. It is **not** present in this worktree (GSD has not run inside it), which means this plan's green clean-tree reading is taken on a tree that lacks the one entry the orchestrator's tree carries. The reading is accurate for the tree it was taken on and must not be read as a stronger claim than that. `git check-ignore -v .planning/milestone.lock` exits 1 here, confirming no pattern covers it. It is **not** fixed here: `.gitignore` belongs to plan 01-02, and editing it in this plan would break requirement traceability. Recorded for a later phase to close.
- **The `PATH=`-prefixed build form is refused by the worktree isolation guard.** Recorded in §3; the absolute binary was used, which the plan itself names as equivalent. Same constraint plan 01-01 reported.
- **The commit ledger could not be persisted to the git administrative directory.** `gsd-plan-head-before-01-05` under `$(git rev-parse --git-dir)` lies outside the worktree, and the isolation guard refused the write — correctly. The base SHA was carried in context (`22a723e50041a1dd0f348153881b330573cb08e8`) and the commit count is measured with an explicit `git rev-list --count <base>..HEAD`. Same constraint plan 01-03 recorded.
- **`gsd_run` is not on the interactive PATH in this worktree.** Per-task commits are made with plain `git commit` under the same message convention (`docs(01-05): …`); the worktree-mode file list is unaffected.
- **No hook, CI job or pre-commit entry was added by this plan** (D-20). Criterion 3 is demonstrated by hand here and automated in Phase 6.

---

*Phase: 01-repository-skeleton-and-project-layout*
*Completed: 2026-10-15*

## Self-Check: PASSED

- FOUND: `.planning/phases/01-repository-skeleton-and-project-layout/01-05-SUMMARY.md`
- FOUND: commit `926db18` (ancestor of HEAD) — task 1, the acceptance run and this log
- FOUND: commit `efcbee5` (ancestor of HEAD) — task 2, the deferred observations
- Plan-level verification, all eight items:
  - `git status --porcelain` → empty after a full `pio run`, after `-t compiledb`, and again after this log was committed — **PASS**
  - `node tools/generate-workspace.mjs --check` → `homework.code-workspace is up to date`, exit 0 — **PASS**
  - `node tools/sweep-homeworks.mjs --list` → exactly `project-baseline`, exit 0 — **PASS**
  - `pio run -d homeworks/project-baseline` → exit 0, `[SUCCESS] Took 2.44 seconds`, `6553600` in the size line — **PASS**
  - `pio run -d homeworks/project-baseline -t compiledb` → exit 0, the database exists inside the project directory and is ignored (`.gitignore:20`) — **PASS**
  - the depth probe → `DEPTH RULE VIOLATED` with the offending path, then the probe removed with its absence asserted — **PASS**
  - `node --test "tools/**/*.test.mjs"` → tests 27, pass 27, fail 0 — **PASS**
  - the recorded manual observations — present in §12, explicitly **DEFERRED** to `/gsd-verify-work 1` with unfilled output slots — **DEFERRED (by design)**, not a failure: no agent can observe a VS Code window, and an invented observation would be worse than an honest gap.
- No build artifact, compilation database or generated editor file was staged at any point; `homeworks/project-baseline/.pio/` and its `compile_commands.json` exist on disk and are reported only under `git status --ignored`.
- No hook, CI job or pre-commit entry was added (D-20).
