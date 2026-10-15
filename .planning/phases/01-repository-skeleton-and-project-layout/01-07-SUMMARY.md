---
phase: 01-repository-skeleton-and-project-layout
plan: 07
subsystem: infra
tags: [roadmap-amendment, verification-override, accepted-deviation, depth-rule, phase-3-trigger, gap-closure, decision-record, attribution, git-as-oracle]

requires:
  - phase: 01-repository-skeleton-and-project-layout
    provides: "The four ROADMAP Phase 1 success criteria and the Phase 3 section (01-01..01-04); the phase log's honest split of criterion 2 into two halves and its record of the un-named GSD lock artifact (01-05); the two-arm depth measurement recorded verbatim — arm A resolving a symlinked `lib_deps` at exactly one level below `homeworks/`, arm B failing one level deeper with PlatformIO's own `PackageException` — plus the `.planning/*.lock` ignore rule and the five-test ignore-contract gate (01-06); the verification report that filed gap 1 as the failing second conjunct (01-VERIFICATION.md)"
provides:
  - "The dated discharge note in `.planning/ROADMAP.md` beside a byte-identical Phase 1 criterion 2 — the owner's accepted override, named detector, reason and evidence, written where every later phase reads the contract"
  - "A new numbered Phase 3 success criterion (5) that makes the depth rule's build-failure half observable on the committed tree once a homework declares a symlinked shared-library dependency"
  - "The single attributed override entry in `.planning/phases/01-repository-skeleton-and-project-layout/01-VERIFICATION.md` (`overrides_applied: 1`), whose attribution is read from git rather than typed"
  - "The Key Decisions row in `.planning/PROJECT.md` that carries criterion 2 second conjunct to every later phase's prior-context load"
  - "This record: the ratification that states what the override rests on and whether the measurement behind it holds up"
affects: ["phase 2", "phase 3", "phase 6", "phase 8", "the milestone audit", "the course instructor reading the repository"]

# `commits` is MEASURED, never narrated (#3968). The on-disk ledger could not be
# persisted — `$(git rev-parse --git-dir)` resolves to the SHARED administrative
# directory, outside this worktree, and the isolation guard correctly refused the
# write — so the base SHA is carried in context and the count is measured with an
# explicit `git rev-list --count <base>..HEAD`, exactly as plans 01-05 and 01-06
# recorded for the same constraint.
actuals:
  tokens: 10949
  tasks: 2
  commits: 2
  plan_head_before: b671b38e9096fa8ac476330e81afaa8d908e8c35
  plan_head_after: af847625c8764d523abff0c787bf1422aae0116d
  # `tokens` is chars/4 over the realized diff (#2632), on the same estimateTokens
  # scale as the plan's `estimate`, never a harness token count: 43,794 characters
  # (this summary 38,620 + the 5,174 characters the three artifacts' diff adds)
  # -> 10,949. Same shape plan 01-06 recorded, and the plan's own `estimate` of
  # 24,000 tokens was high on the same scale — recorded as measured, not rounded
  # toward it.
  #
  # `plan_head_before` is the worktree base the orchestrator forked from;
  # `plan_head_after` is the task-1 commit. `commits` is the measured
  # `git rev-list --count <before>..<after>` -> 2 (the two task commits; the
  # summary's own commit is the second of them).

tech-stack:
  added: []
  patterns:
    - "An accepted deviation is recorded beside the contract, never instead of it: the criterion's own sentence is asserted byte-identical by a hash over the whole line, so a rewrite that keeps the searched phrase while changing the first conjunct still fails"
    - "Attribution is an output of git, not an input to the record: `accepted_by`/`accepted_at` come from the commit that recorded the owner's decision, and a gate compares the recorded name against that lookup so a placeholder or the agent's own name cannot pass"
    - "A substitute mechanism carries its own retirement trigger: the override names the Phase 3 criterion that makes the literal form observable on the committed tree, so the discharge is dated rather than permanent"
    - "The verifier's verdict fields are not the recorder's to write: `status`, `score` and the `gaps:` array are untouched, and a gate asserts the status field still carries the verifier's own value"

key-files:
  created:
    - ".planning/phases/01-repository-skeleton-and-project-layout/01-07-SUMMARY.md — this ratification record"
  modified:
    - ".planning/ROADMAP.md — the dated discharge note appended inside the Phase 1 section, plus Phase 3 success criterion 5; no existing line of either section altered"
    - ".planning/PROJECT.md — one Key Decisions row carrying `criterion 2 second conjunct`"
    - ".planning/phases/01-repository-skeleton-and-project-layout/01-VERIFICATION.md — the single `overrides` entry, and `overrides_applied` 0 → 1; nothing else changed"

key-decisions:
  - "The attribution was read with the plan's own lookup — `git log -1 --format=%an --grep='record owner decisions on the two verification gaps'` — which resolves to commit `bf60cca` (an ancestor of HEAD, the commit that changed `.planning/STATE.md` to record both owner decisions), author `4oc3p`, dated 2026-10-15T16:13:03+03:00. The dispatch note named `5b0f57d` as the decision commit; the plan names the commit by its subject line and instructs the git lookup to decide, so the plan's resolution was followed and the values were read from git rather than typed."
  - "The note is an addition beside the criterion, not a correction of it. The Phase 1 success-criteria list is untouched and the whole criterion 2 line still hashes to `1f03e2c72b1bed66621f8f040e729f39508ade65811772566a7de1b4bf90e5d9` — the same reasoning D-24 applied to the dated research files, where editing evidence retroactively erases what was established."
  - "The override's `must_have` is a byte-exact quote of the failing gap's own `truth` string rather than a paraphrase of the intent, because the overrides mechanism matches by token overlap and a paraphrase can leave the gap open while appearing recorded."
  - "The detector was named as the owner identified it — the `DEPTH RULE VIOLATED` banner, exit 1, raised before any child process exists — because the sweep carries two named-rule detectors (`DEPTH RULE VIOLATED` and `MALFORMED HOMEWORK ID`) and a generic phrase would not identify which one stands in for the build failure."
  - "`.planning/REQUIREMENTS.md` was deliberately NOT modified. Its REPO-01..04 rows read `Gaps Found`, which is still true: the verification record's `status` is `gaps_found` and re-verification has not run. The phase reverted a premature `Complete` marking once already (commit `f35f300`), and marking them here would repeat that mistake. `.planning/REQUIREMENTS.md` is not in this plan's `files_modified`."
  - "No checkpoint was raised, and the absence is deliberate rather than an omission: the checkpoints reference treats gating a decided question as an anti-pattern — it costs a full executor cold-start and teaches the reader to ignore checkpoints — so this plan records the decision the owner already made instead of re-asking for it."

patterns-established:
  - "Read the identity an acceptance is attributed to out of git at execution time, and let a gate compare the recorded value against the same lookup, so an override nobody accepted cannot enter the record"
  - "Record a deliberate deviation as a dated blockquote appended beside the untouched contract line, so the amendment and the thing amended stay visible together"
  - "Pair every substitute mechanism with the numbered criterion that retires it, so the substitution is a dated bridge rather than a permanent rewording of what the project promised"

requirements-completed: [REPO-01, REPO-02, REPO-03, REPO-04]

coverage:
  - id: D1
    description: "ROADMAP Phase 1 carries the owner's accepted override as a dated discharge note beside a byte-identical criterion 2, naming the sanctioned detector, the reason, the measured evidence and the Phase 3 trigger"
    requirement: REPO-03
    verification:
      - kind: integration
        ref: "grep -c '^> \\*\\*Verification discharge (criterion 2, second conjunct):\\*\\*' .planning/ROADMAP.md -> 1"
        status: pass
      - kind: integration
        ref: "sed -n '/^  2\\. A PlatformIO project placed at/p' .planning/ROADMAP.md | shasum -a 256 -> 1f03e2c72b1bed66621f8f040e729f39508ade65811772566a7de1b4bf90e5d9 (the criterion line is byte-identical)"
        status: pass
      - kind: integration
        ref: "grep -c 'DEPTH RULE VIOLATED' .planning/ROADMAP.md -> 1; grep -c 'checkpoint' .planning/ROADMAP.md -> 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "ROADMAP Phase 3 carries an additional numbered success criterion making the depth rule's build-failure half observable on the committed tree once a symlinked shared-library dependency exists"
    requirement: REPO-03
    verification:
      - kind: integration
        ref: "grep -c 'fail to resolve the shared-library symlink dependency' .planning/ROADMAP.md -> 1"
        status: pass
      - kind: other
        ref: "Phase 3 criteria 1-4 unaltered and `**Plans:** TBD` unchanged — criterion 5 was appended, never inserted"
        status: pass
    human_judgment: false
  - id: D3
    description: "The verification record carries exactly one override entry, its `must_have` quoting the failing clause's own vocabulary and its attribution read from the owner-decision commit rather than typed"
    requirement: REPO-03
    verification:
      - kind: integration
        ref: "grep -c 'overrides_applied: 1' .planning/phases/01-repository-skeleton-and-project-layout/01-VERIFICATION.md -> 1"
        status: pass
      - kind: integration
        ref: "grep -c 'accepted_by: ' .planning/phases/01-repository-skeleton-and-project-layout/01-VERIFICATION.md -> 1; value 4oc3p equals `git log -1 --format=%an --grep='record owner decisions on the two verification gaps'`"
        status: pass
      - kind: integration
        ref: "grep -c '^status: gaps_found' .planning/phases/01-repository-skeleton-and-project-layout/01-VERIFICATION.md -> 1 (the verifier's verdict fields untouched)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The decision is carried into the cross-phase channel every later phase reads: one Key Decisions row in `.planning/PROJECT.md` containing `criterion 2 second conjunct`"
    requirement: REPO-03
    verification:
      - kind: integration
        ref: "grep -c 'criterion 2 second conjunct' .planning/PROJECT.md -> 1"
        status: pass
    human_judgment: false
  - id: D5
    description: "The phase's own gates are re-run against the recorded state and are green, and the tree is clean once the summary is committed"
    requirement: REPO-01
    verification:
      - kind: integration
        ref: "node tools/generate-workspace.mjs --check -> 'homework.code-workspace is up to date', exit 0"
        status: pass
      - kind: integration
        ref: "node tools/sweep-homeworks.mjs --list -> 'project-baseline', exit 0"
        status: pass
      - kind: integration
        ref: "pio run -d homeworks/project-baseline 2>&1 | grep -c 6553600 -> 1; [SUCCESS] Took 2.80 seconds"
        status: pass
      - kind: unit
        ref: "node --test \"tools/**/*.test.mjs\" -> tests 32, pass 32, fail 0, skipped 0, todo 0"
        status: pass
      - kind: integration
        ref: "test -z \"$(git status --porcelain)\" -> exit 0, empty, after this summary was committed"
        status: pass
    human_judgment: false
  - id: D6
    description: "The record states whether the two-arm measurement confirms the owner's stated reason or disagrees with any material part of it — the one thing that makes the override checkable"
    requirement: REPO-03
    verification: []
    human_judgment: true
    rationale: "The deliverable is a judgement about whether a human-recorded rationale survives contact with a measurement, written into a record the milestone audit and the instructor read as fact. No test can assert that the comparison was made honestly rather than smoothed over; the paragraph's worth is that a human can read both and check it. Section 'Does the measurement confirm the owner's stated reason?' below is where that judgement is written."

metrics:
  duration: 7min
  completed: 2026-10-15
  status: complete
---

# Phase 1 Plan 7: Record the Owner's Accepted Override for Criterion 2's Second Conjunct

**The owner's already-made decision is now written into the three artifacts that carry it — a dated discharge note in `.planning/ROADMAP.md` beside a byte-identical Phase 1 criterion 2, a new numbered Phase 3 success criterion that makes the depth rule's build-failure half observable on the committed tree, one attributed override entry in the verification record (`overrides_applied: 1`, `accepted_by: 4oc3p`, read from git), and a Key Decisions row in `.planning/PROJECT.md` — with the record stating plainly that the two-arm measurement confirms the owner's stated reason rather than merely resting beside it.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-10-15T14:11:58Z
- **Completed:** 2026-10-15T14:19:24Z
- **Tasks:** 2
- **Files modified:** 3 modified (`.planning/ROADMAP.md`, `.planning/PROJECT.md`, `01-VERIFICATION.md`), 1 created (this summary)

## Accomplishments

- **The deviation is recorded beside the contract, not in place of it.** `.planning/ROADMAP.md` gains a dated discharge note whose first line is the fixed lead-in, and the criterion's own sentence is unaltered — asserted by a hash over the whole line (`1f03e2c7…e5d9`) rather than by the survival of the one clause a phrase grep searches for. A rewrite that kept "moving it one level deeper breaks the build" while changing the first conjunct fails that hash; a deleted criterion hashes empty and fails it too.
- **The substitute carries its own retirement trigger.** Phase 3 gains success criterion 5: once a homework declares `lib_deps = <name>=symlink://../../shared/lib/<name>`, moving it one level deeper fails to resolve the shared-library symlink dependency. The criterion is appended under a new number, so no existing Phase 3 criterion changes meaning and the plan list stays `TBD`.
- **The acceptance in the record was read from git, not typed.** `git log -1 --format=%an --grep='record owner decisions on the two verification gaps'` resolves to `bf60cca` — the commit that changed `.planning/STATE.md` to record both owner decisions — authored by `4oc3p` on 2026-10-15T16:13:03+03:00. Those values are the override's `accepted_by` and `accepted_at`, and a gate compares the recorded name against the same lookup.
- **The verifier's verdict fields were left alone.** `status: gaps_found`, `score: 31/34 must-haves verified` and the `gaps:` array are exactly as the verifier left them; the only additions are the `overrides` entry and the count. Re-verification recomputes the rest.
- **The decision reached the cross-phase channel.** `.planning/PROJECT.md`'s Key Decisions table gains one row containing `criterion 2 second conjunct`, so the record is greppable from the roadmap note and back — which is D-25's channel for decisions all eight phases must see.
- **The phase's own gates were re-run against the recorded state and are green**, and the tree is clean once this summary was committed: 32/32 tests, drift check exit 0, sweep listing exactly the baseline, the build reporting the 16 MB application partition.

## Task Commits

Each task was committed atomically, and both touch only the artifacts this plan declares:

1. **Task 1: Write the owner's decision into the roadmap, the project brief and the verification record** — `af84762` (docs)
2. **Task 2: Re-run the phase's gates and write the ratification record** — this summary's commit (docs), amended once to carry the closing clean-tree reading after it was taken

**Plan metadata:** none separate — in worktree/parallel mode the orchestrator owns the tracking writes (`STATE.md` and the ROADMAP Progress table), and this plan's `ROADMAP.md`/`PROJECT.md` content edits already ride the task-1 commit.

## Files Created/Modified

- `.planning/ROADMAP.md` — a five-line dated discharge note appended inside the Phase 1 section after the success-criteria list, and one appended Phase 3 criterion 5; no existing line of either section changed
- `.planning/PROJECT.md` — one appended Key Decisions row
- `.planning/phases/01-repository-skeleton-and-project-layout/01-VERIFICATION.md` — an `overrides` array with one entry, and `overrides_applied: 0 → 1`
- `.planning/phases/01-repository-skeleton-and-project-layout/01-07-SUMMARY.md` — this record

## Decisions Made

- **The attribution follows the plan's lookup, not the dispatch note's guess.** The dispatch note named `5b0f57d` ("docs(01): revise gap-closure plans to the owner's recorded decisions") as the decision commit. The plan names the commit by its subject line — "docs(phase-01): record owner decisions on the two verification gaps" — and instructs a `git log` lookup filtered by that subject, taking the most recent match. That lookup resolves to `bf60cca`, whose diff is exactly `.planning/STATE.md` +4/−2: the commit that recorded the two owner decisions. The plan wins, and both candidates are authored by the same identity (`4oc3p`), so the name would have been identical either way; only the timestamp differs. The distinction is recorded here rather than silently resolved.
- **`must_have` is a byte-exact quote of the gap's `truth` string.** The mechanism matches by token overlap, so the strongest binding is the report's own sentence — which already carries every key noun the plan names: the depth rule, moving one level deeper, the build, and the rule being load-bearing.
- **`REQUIREMENTS.md` was left untouched.** Its REPO-01..04 rows still read `Gaps Found`, which remains true while `01-VERIFICATION.md` reads `gaps_found`. The phase reverted a premature `Complete` marking once already (`f35f300`); repeating it here would put a green claim in the requirement traceability table that no verification produced. The file is not in this plan's `files_modified`.
- **Nothing was written into the roadmap that reads as a pending question.** `grep -c 'checkpoint' .planning/ROADMAP.md` → `0`, asserted as a gate, because the door the owner walked through must not be re-opened in the contract.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The build was invoked by literal absolute path, not through the plan's quoted-expansion form**
- **Found during:** Task 2 (re-running the phase's gates)
- **Issue:** The plan's `<automated>` spells the build as `"${PLATFORMIO_CORE:-$HOME/.platformio/penv/bin/pio}" run -d homeworks/project-baseline`. The worktree isolation guard refuses a command whose name is computed at runtime, reporting that it cannot be shown not to be `git`.
- **Fix:** The build was invoked as `/Users/vloktiev/.platformio/penv/bin/pio run -d homeworks/project-baseline` — the identical binary the plan's expansion resolves to on this machine (`$PLATFORMIO_CORE` is unset; the per-user venv binary is present and executable). This is the same constraint, and the same recorded resolution, as plans 01-01, 01-05 and 01-06.
- **Files modified:** none.
- **Verification:** The build exited 0, `[SUCCESS] Took 2.80 seconds`, and the size line reports `6553600` bytes — the 16 MB application partition of `default_16MB.csv`, so the substituted command form reached the same PlatformIO the plan intended.
- **Committed in:** this summary's commit (the record carries the verbatim output).

**2. [Rule 3 - Blocking] The commit ledger could not be persisted to the git administrative directory**
- **Found during:** Task 1 (before the first commit)
- **Issue:** `git rev-parse --git-dir` resolves to `/Users/vloktiev/Dev/miltech/homework/.git/worktrees/agent-a875767b2c48b059e` — the **shared** administrative directory, outside this worktree. The isolation guard correctly refuses to write there, and protocol step 0c's plan-head ledger lives at that path.
- **Fix:** The base SHA `b671b38e9096fa8ac476330e81afaa8d908e8c35` was carried in context and the commit count is measured with an explicit `git rev-list --count b671b38…..HEAD`, recorded in the `actuals` block. Identical to the constraint plans 01-05 and 01-06 recorded.
- **Files modified:** none.
- **Verification:** the count is a measured `rev-list` result, not a narrated number.
- **Committed in:** this summary's commit.

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Neither touches a deliverable. Both are consequences of the worktree isolation guard, are recorded rather than worked around silently, and reproduce constraints plans 01-01, 01-05 and 01-06 already recorded. No scope creep.

## Issues Encountered

None beyond the two environment constraints above. Task 1's eleven gates all passed on the first implementation, and Task 2's four gate commands were green on their first run.

---

# Ratification Record — what was decided, what was written, and whether it holds up

Everything below is recorded output, not paraphrase.

## 1. The owner's decision, as recorded in the project state

Quoted verbatim from `.planning/STATE.md` § Recent decisions affecting current work, recorded by commit `bf60cca` ("docs(phase-01): record owner decisions on the two verification gaps", author `4oc3p`, 2026-10-15T16:13:03+03:00):

> Owner decision after gaps_found: ACCEPT THE OVERRIDE for roadmap criterion 2(b). The literal criterion (a project one level deeper breaks the build) is unobservable in Phase 1 because platformio.ini declares no lib_deps, so nothing fails to resolve; a copy of the baseline at homeworks/project-baseline/deeper/ builds successfully (measured, exit 0). Record in ROADMAP.md that the sweep's named-rule detector (DEPTH RULE VIOLATED, exit 1, raised before any child process) satisfies the criterion's INTENT as a documented, deliberate deviation, with the reason and the Phase 3 trigger that would make the literal form observable.

**Criterion 2's second conjunct is now closed by an accepted override.** It is not verified, not silently dropped, and not reworded — it is a recorded, attributed, dated deviation beside an unchanged contract, with the mechanism that retires it written into Phase 3 as a numbered criterion.

## 2. The roadmap note, as written

Appended inside the Phase 1 section, after the success-criteria list, reproduced verbatim from `.planning/ROADMAP.md`:

> **Verification discharge (criterion 2, second conjunct):** Accepted override, recorded **2026-10-15** (the owner's decision commit `bf60cca`, "docs(phase-01): record owner decisions on the two verification gaps"). The second conjunct of criterion 2 above is **deliberately deviated from**: the roadmap wording stays exactly as written, and the sanctioned discharge is the sweep's named-rule detector — the `DEPTH RULE VIOLATED` banner, exit 1, raised before any child process exists. The detector is named that precisely because the sweep carries two named-rule detectors (`DEPTH RULE VIOLATED` and `MALFORMED HOMEWORK ID`) and only the depth one stands in for the build failure.
> **Reason, in the owner's own terms:** the literal criterion is unobservable in Phase 1 because `homeworks/project-baseline/platformio.ini` declares no `lib_deps`, so nothing resolves relative to the project directory and nothing fails to resolve. A copy of the baseline placed at `homeworks/project-baseline/deeper/` builds successfully — measured, exit 0 — so no build-failure demonstration exists to make.
> **Measured evidence (plan 01-06, two arms on a throwaway fixture outside the repository):** with one shared-library dependency declared in the form `lib_deps = probelib=symlink://../../shared/lib/probelib`, the project at exactly one level below `homeworks/` builds (arm A: exit 0, `probelib@0.1.0 has been installed!`) and the same project one level deeper fails to resolve (arm B: exit 1, PlatformIO's own `PackageException: Can not create a symbolic link for ../../shared/lib/probelib, not a directory`). The depth boundary is therefore real and measured; what the committed baseline lacks is the dependency that would exhibit it.
> **Trigger that retires the substitute:** Phase 3 success criterion 5 below makes the literal mechanism observable on the committed tree — once a homework declares `lib_deps = <name>=symlink://../../shared/lib/<name>`, moving that homework one level deeper fails to resolve the shared-library symlink dependency. Until then the named-rule detector is the discharge, and it is never relaxed to manufacture a green result.

**The criterion beside it is byte-identical.** The note is an addition, and the addition is proven to be one:

```
$ sed -n '/^  2\. A PlatformIO project placed at/p' .planning/ROADMAP.md | shasum -a 256
1f03e2c72b1bed66621f8f040e729f39508ade65811772566a7de1b4bf90e5d9  -

$ grep -c 'moving it one level deeper breaks the build' .planning/ROADMAP.md
1

$ grep -c '^> \*\*Verification discharge (criterion 2, second conjunct):\*\*' .planning/ROADMAP.md
1

$ grep -c 'checkpoint' .planning/ROADMAP.md
0
```

The hash is the same value the plan's gate expected before any edit was made, so the whole sentence — both conjuncts, the id placeholder, the command spelling, the em dash and the trailing clause — survived the amendment intact.

## 3. The Phase 3 criterion, as written

Appended to the Phase 3 success-criteria list under a new number, reproduced verbatim from `.planning/ROADMAP.md`:

> 5. Once a homework declares `lib_deps = <name>=symlink://../../shared/lib/<name>`, moving that homework one level deeper makes its build fail to resolve the shared-library symlink dependency — PlatformIO's Library Manager resolves a `symlink://` path relative to the project directory, so the same relative path no longer reaches `shared/lib/` from a deeper folder. This is the observable build-failure half of the one-level depth rule that Phase 1 could enforce only by name, and one command (`pio run -d <deeper copy of the project>`) settles it: the failure arrives at library installation, before any translation unit is compiled.

```
$ grep -c 'fail to resolve the shared-library symlink dependency' .planning/ROADMAP.md
1
```

Criteria 1–4 are unaltered, the criterion is appended rather than inserted, and Phase 3's plan list is still `**Plans:** TBD` — the phase is unplanned and this plan does not plan it.

## 4. The verification record's override entry, as written

Added to the frontmatter of `.planning/phases/01-repository-skeleton-and-project-layout/01-VERIFICATION.md`; `overrides_applied` moved from `0` to `1`:

```yaml
overrides_applied: 1
overrides:
  - must_have: "ROADMAP success criterion 2, second conjunct: moving a homework one level deeper breaks the build, which is what proves the depth rule is load-bearing."
    reason: "Owner-accepted deviation, decided 2026-10-15. The literal criterion is unobservable in Phase 1: homeworks/project-baseline/platformio.ini declares no lib_deps, so nothing resolves relative to the project directory and nothing fails to resolve — a copy of the baseline at homeworks/project-baseline/deeper/ builds successfully (measured, exit 0). The sanctioned discharge is the sweep's named-rule detector, which names the rule (DEPTH RULE VIOLATED, exit 1) before any child process exists; the sweep carries two named-rule detectors and only the depth one stands in for the build failure. The evidence is plan 01-06's two-arm measurement on a throwaway fixture: with lib_deps = probelib=symlink://../../shared/lib/probelib declared, the project at exactly one level below homeworks/ builds (arm A, exit 0) and the same project one level deeper fails to resolve (arm B, exit 1, PackageException: Can not create a symbolic link for ../../shared/lib/probelib, not a directory). Plan 01-07 records a Phase 3 success criterion under which the literal mechanism becomes observable on the committed tree once a homework declares a symlinked shared-library dependency, retiring the substitute."
    accepted_by: "4oc3p"
    accepted_at: "2026-10-15T16:13:03+03:00"
```

**The attribution is grounded, and the gate that proves it is the same lookup that produced it:**

```
$ git log -1 --format=%an --grep='record owner decisions on the two verification gaps'
4oc3p

$ git log -1 --format='%H%n%an%n%aI%n%s' --grep='record owner decisions on the two verification gaps'
bf60cca4ef35a7dc602e08535b452a494701eee8
4oc3p
2026-10-15T16:13:03+03:00
docs(phase-01): record owner decisions on the two verification gaps

$ git merge-base --is-ancestor bf60cca4ef35a7dc602e08535b452a494701eee8 HEAD
[exit=0 — ancestor]

$ git show --stat --format='%h %an %aI %s' bf60cca4ef35a7dc602e08535b452a494701eee8
bf60cca 4oc3p 2026-10-15T16:13:03+03:00 docs(phase-01): record owner decisions on the two verification gaps

 .planning/STATE.md | 6 ++++--
 1 file changed, 4 insertions(+), 2 deletions(-)
```

No placeholder, no agent name, no plausible-looking substitution — the identity is the one the decision commit is authored under, and its diff is exactly the state file the decisions were recorded in.

**The verifier's verdict fields are untouched:**

```
$ grep -c 'overrides_applied: 1' .planning/phases/01-repository-skeleton-and-project-layout/01-VERIFICATION.md
1

$ grep -c 'accepted_by: ' .planning/phases/01-repository-skeleton-and-project-layout/01-VERIFICATION.md
1

$ grep -c '^status: gaps_found' .planning/phases/01-repository-skeleton-and-project-layout/01-VERIFICATION.md
1
```

`status`, `score` and the `gaps:` array still carry what the verifier computed. Writing a passing verdict here would have put a green claim in the record that no verification produced.

## 5. The project decision row, as written

Appended to `.planning/PROJECT.md`'s Key Decisions table, reproduced verbatim:

> | Record the accepted override for ROADMAP Phase 1 **criterion 2 second conjunct** as a dated, deliberate deviation | The literal criterion — a project moved one level deeper breaks the build — is unobservable while `homeworks/project-baseline/platformio.ini` declares no `lib_deps`, so nothing fails to resolve; the sweep's `DEPTH RULE VIOLATED` detector names the rule before any child process exists and satisfies the criterion's intent. Plan 01-06's two-arm measurement is the evidence, and Phase 3's added success criterion makes the literal mechanism observable once a `symlink://` shared-library dependency exists | — Accepted override, owner decision 2026-10-15 (deviation recorded in `ROADMAP.md` Phase 1 and in `01-VERIFICATION.md`) |

```
$ grep -c 'criterion 2 second conjunct' .planning/PROJECT.md
1
```

The row matches the table's three-column shape, and the phrase it carries makes the record reachable from the roadmap note and back.

## 6. Does the measurement confirm the owner's stated reason, or disagree with it?

**The two-arm measurement confirms the owner's stated reason. No material part of it is contradicted by plan 01-06's evidence.**

The reason, as the owner recorded it, has two halves. First, that the literal criterion is unobservable in Phase 1 because `platformio.ini` declares no `lib_deps`, so nothing fails to resolve. Second, that a deeper copy therefore builds successfully.

Plan 01-06's measurement bears on both, and it bears in the same direction:

- **The committed baseline still declares no dependency.** `grep -c 'lib_deps' homeworks/project-baseline/platformio.ini` → `0` (01-06 recorded this), so there is no relative path to resolve and the deeper copy compiles. The build re-run in this plan reports the same environment and the same 16 MB partition as 01-05's acceptance run, so nothing moved under the reason between the measurement and its recording.
- **The mechanism appears exactly when a dependency is introduced, and nowhere before.** On the fixture, with `lib_deps = probelib=symlink://../../shared/lib/probelib` declared, the project at exactly one level below `homeworks/` resolves the dependency (arm A, exit 0, `probelib@0.1.0 has been installed!`) and the identical project one level deeper fails with PlatformIO's own `PackageException: Can not create a symbolic link for ../../shared/lib/probelib, not a directory` (arm B, exit 1). The dependency form and the relative path are the same in both arms; the only variable is depth.

That is a confirmation, and it is a stronger one than the reason alone required: the reason says the literal criterion is unobservable *because* no dependency is declared. The measurement shows the boundary is real — not an artifact of the criterion being badly worded — and that it becomes observable the moment Phase 3 declares the dependency. The substitute is therefore a bridge over a genuinely absent mechanism, not a substitute for one that could have been demonstrated.

**One nuance is recorded rather than smoothed over, and it is not a disagreement.** The fixture lives outside the repository under the OS temp directory and was removed inside 01-06's task; it demonstrates what happens *once* a symlinked dependency exists, and does not make one exist on the committed tree. 01-06 said this in exactly those words, and this record repeats it: the Phase 3 criterion written in §3 above is what turns the measurement into an observation on the tree that ships. Until Phase 3 lands, `overrides_applied: 1` is the accurate state of criterion 2's second conjunct — accepted, attributed, dated, and awaiting the mechanism that retires it.

Nothing in the record contradicts the owner's reason, so nothing is written beside it as a contradiction. Had arm B exited 0 — a deeper project resolving the same relative path — this paragraph would say so here, next to the override, rather than being absorbed into a green summary.

## 7. The phase's own gates, re-run against the recorded state

```
$ node tools/generate-workspace.mjs --check
homework.code-workspace is up to date
[exit=0]
```

```
$ node tools/sweep-homeworks.mjs --list
project-baseline
[exit=0]
```

```
$ /Users/vloktiev/.platformio/penv/bin/pio run -d homeworks/project-baseline
...
RAM:   [=         ]   5.7% (used 18604 bytes from 327680 bytes)
Flash: [          ]   4.1% (used 268177 bytes from 6553600 bytes)
Building .pio/build/projectbaseline_s3/firmware.bin
esptool.py v4.11.0
Creating esp32s3 image...
Merged 2 ELF sections
Successfully created esp32s3 image.
========================= [SUCCESS] Took 2.80 seconds =========================

$ /Users/vloktiev/.platformio/penv/bin/pio run -d homeworks/project-baseline 2>&1 | grep -c 6553600
1
```

`6553600` is `0x640000`, the application partition of `default_16MB.csv`; the default board definition's 8 MB table yields `0x330000`. The four N16R8 overrides are live through the command this criterion names.

```
$ node --test "tools/**/*.test.mjs"
ℹ tests 32
ℹ suites 0
ℹ pass 32
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 624.02825
[exit=0]
```

**32 passing, 0 failing** — the 27 plan-01/01-04 cases plus 01-06's five ignore-contract tests. The quoted glob is mandatory; unquoted, zsh expands it and errors when it matches nothing. No `package.json` was added to obtain a runner.

## 8. The two clean-tree readings

```
$ git status --porcelain          # before this summary was written
(no output)
[exit=0]
```

```
$ git status --porcelain          # after this summary was committed
(no output)
[exit=0]
```

**Both empty.** The reading must be taken **after** the summary is committed, because the summary is itself a new, unignored file under a tracked directory — a reading taken between its write and its commit would have failed over the summary rather than over the tree being tested. This is the same discipline plan 01-05 established and plan 01-06 repeated, and the reason this commit was amended once: the closing reading only becomes observable after the commit that closes the file it is written into.

The reading is empty because plan 01-06 closed `.planning/milestone.lock` by rule (`.planning/*.lock` in the repository's own `.gitignore`, `git check-ignore -v` naming that file as the source). It is the only entry the verification report measured, and it is the entry this plan's gate now depends on.

## 9. No checkpoint was raised, and why

**No checkpoint, question or pending-decision marker was raised anywhere in this plan — deliberately.** The owner had already decided: `.planning/STATE.md` carries the decision in the owner's own words, recorded by `bf60cca`. The checkpoints reference treats gating a decided question as an anti-pattern, because it costs a full executor cold-start and teaches the reader to ignore checkpoints. A `checkpoint:decision` here would have presented a door the owner had already walked through; the plan's job was to record the decision, not to re-litigate it. The absence is asserted, not merely intended:

```
$ grep -c 'checkpoint' .planning/ROADMAP.md
0
```

`.planning/REQUIREMENTS.md` was likewise left unmodified (see Decisions Made), and no file under `.gitignore`, `tools/`, `shared/` or `homeworks/` was touched by either task.

---

*Phase: 01-repository-skeleton-and-project-layout*
*Completed: 2026-10-15*

## Self-Check: PASSED

- FOUND: `.planning/ROADMAP.md` — the dated discharge note (lead-in present once) and Phase 3 criterion 5 (`fail to resolve the shared-library symlink dependency`, count 1); the Phase 1 criterion 2 line still hashes to `1f03e2c7…e5d9`
- FOUND: `.planning/PROJECT.md` — one new Key Decisions row, `criterion 2 second conjunct` count 1
- FOUND: `.planning/phases/01-repository-skeleton-and-project-layout/01-VERIFICATION.md` — `overrides_applied: 1`, one `accepted_by:` field, `^status: gaps_found` count 1
- FOUND: commit `af84762` (ancestor of HEAD) — task 1, the three artifact edits
- FOUND: `.planning/phases/01-repository-skeleton-and-project-layout/01-07-SUMMARY.md` — this file
- Task 1 acceptance criteria, all seven — **PASS** (lead-in once; criterion byte-identical; detector named; Phase 3 phrase present; `overrides_applied: 1`; attribution equals the git lookup `4oc3p`; no checkpoint marker, and no file under `.gitignore`/`tools`/`shared`/`homeworks`/`REQUIREMENTS.md` touched)
- Task 2 acceptance criteria, all seven — **PASS** (decision quoted and the recording commit named; the three artifacts reproduced; the clause stated as closed by an accepted override; the confirms/disagrees paragraph present; four gate outputs verbatim and both clean-tree readings empty; the no-checkpoint line present; `git status --porcelain` empty after the summary commit)
- Plan-level verification, all ten items — **PASS**
- No build artifact, compilation database or generated editor file was staged at any point; `homeworks/project-baseline/.pio/` and `compile-db` remain ignored, and the tree is clean.
