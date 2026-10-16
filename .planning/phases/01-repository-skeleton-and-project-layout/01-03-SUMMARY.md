---
phase: 01-repository-skeleton-and-project-layout
plan: 03
subsystem: docs
tags: [documentation, agents-md, project-md, readme, library-path, traps-register]

# Dependency graph
requires: []
provides:
  - "Corrected AGENTS.md — the session-read project guide now names `shared/lib/`, singular, in both the folder path and the `symlink://` dependency path"
  - "Corrected `.planning/PROJECT.md` — the two library-path bullets agree with REQUIREMENTS.md"
  - "`.planning/PROJECT.md` `## Traps for Later Phases` section — four cross-phase obligations in the one document every phase's prior-context load reads"
  - "Root `README.md` with a real body — what the repository is, how to open the generated workspace file, the one-command build, the homework definition and the conventions pointer"
affects: [phase-03-shared-libraries, phase-07-agent-rules, phase-08-deliverable-contract]

actuals:
  tokens: 1557    # chars/4 over the realized diff (6,228 chars of added+removed content)
  tasks: 2
  commits: 2      # MEASURED: git rev-list --count 81548596f1591f73605d5a486a937ecf08320cd0..HEAD

tech-stack:
  added: []
  patterns:
    - "Surgical line-addressed correction: name the exact line, prove the diff is confined to it, keep every other line byte-identical"
    - "Cross-phase obligations live in PROJECT.md, not in a phase context file, because load_prior_context reads PROJECT.md in all eight phases"

key-files:
  created: []
  modified:
    - "AGENTS.md — lines 45 and 107: `shared/libs/` corrected to `shared/lib/`"
    - ".planning/PROJECT.md — lines 24 and 26 corrected; `## Traps for Later Phases` inserted before `## Evolution`"
    - "README.md — one-line placeholder replaced with a 100-line entry point"

key-decisions:
  - "Kept the `<Module>` / `<Name>` placeholder spellings verbatim on AGENTS.md line 45; only the path segment changed, so the diff is 2 lines with zero formatting churn"
  - "Corrected PROJECT.md lines 24 and 26 only. `shared/hardware/` (REQUIREMENTS.md:20) is a different folder and deliberately not in scope"
  - "Attributed each traps entry to the decision that produced it (D-24, D-10, D-13, D-09) so a later phase can trace the obligation back to its rationale"
  - "README documents the environment names as project-scoped and therefore uses only the project-directory command form — the `-e` flag form is absent by construction, not by omission"

patterns-established:
  - "Traps register in PROJECT.md: obligations that outlive a phase are recorded where every phase reads them, attributed to their originating decision"
  - "Documentation-only plan with line-addressed edits: `git diff -U0` proves the hunk set, and a whole-file grep proves no occurrence survives"

requirements-completed: [REPO-01, REPO-02, REPO-03]

coverage:
  - id: D1
    description: "AGENTS.md no longer names a library folder that does not exist in the frozen layout; the plural is gone from the file an agent reads every session"
    requirement: REPO-02
    verification:
      - kind: other
        ref: "grep -n 'shared/libs' AGENTS.md -> no match; grep -c 'shared/lib/' AGENTS.md -> 2; grep -c 'shared/lib/<Module>/' AGENTS.md -> 1; sed -n '45p;107p' AGENTS.md | grep -c 'symlink://../../shared/lib/<Name>' -> 2"
        status: pass
      - kind: other
        ref: "git diff -U0 AGENTS.md -> exactly two hunks, at lines 45 and 107; wc -l < AGENTS.md -> 219 (unchanged)"
        status: pass
    human_judgment: false
  - id: D2
    description: ".planning/PROJECT.md agrees with the frozen library path in REQUIREMENTS.md, so a phase reading only PROJECT.md cannot create the wrong directory"
    requirement: REPO-02
    verification:
      - kind: other
        ref: "grep -cE 'shared/([^l]|$)' .planning/PROJECT.md -> 0; grep -c 'shared/lib/' .planning/PROJECT.md -> 3"
        status: pass
    human_judgment: false
  - id: D3
    description: "The cross-phase traps section exists in the one document all eight phases load, immediately before `## Evolution`, with the four obligations the plan names"
    requirement: REPO-01
    verification:
      - kind: other
        ref: "grep -c '^## Traps for Later Phases$' .planning/PROJECT.md -> 1; awk bullet floor -> 4; heading-order gate -> `## Evolution` immediately follows"
        status: pass
    human_judgment: false
  - id: D4
    description: "The dated research evidence under .planning/research/ is untouched, so the audit trail of what was established on 2026-10-15 survives"
    verification:
      - kind: other
        ref: "git status --porcelain .planning/research -> empty"
        status: pass
    human_judgment: false
  - id: D5
    description: "The root README names the generated workspace file and how to open it, gives the one-command build, states what a homework is, and describes only the tree Phase 1 ships"
    requirement: REPO-01
    verification:
      - kind: other
        ref: "grep -c 'homework.code-workspace' README.md -> 4; grep -cE 'pio run -d homeworks/' README.md -> 1; grep -cE 'pio run -e ' README.md -> 0; grep -c 'platformio.ini' README.md -> 1; grep -cE 'lib_extra_dirs|globallib_dir' README.md -> 0; grep -cE '\\.clang-format|\\.clang-tidy|markdownlint|pre-commit-config|\\.github/workflows|\\.agents/|^scripts/|^docs/' README.md -> 0; grep -cE '/(Users|home)/[a-z]' README.md -> 0; wc -l < README.md -> 100"
        status: pass
    human_judgment: true
    rationale: "The README gates prove the absence of forbidden content and the presence of required strings, but whether the prose actually reads as an entry point — and whether the section order and tree framing serve a human cloning the repository for the first time — is a judgement no grep makes. A verifier reading the file is the check."

# Metrics
duration: 2min
completed: 2026-10-15
status: complete

# Commit ledger (#3968) — commits is MEASURED, not narrated
plan_head_before: 81548596f1591f73605d5a486a937ecf08320cd0
plan_head_after: 5d49a968644e58adfddaaee8b7698f8af8516a54
---

# Phase 1 Plan 3: Library-Path Traps and the Root README Summary

**The two live library-path traps are corrected with two-line surgical edits, four cross-phase obligations are recorded where every phase reads them, and the repository gains a real README that names its own generated workspace file.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-10-15T12:38:21Z
- **Completed:** 2026-10-15T12:40:35Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `AGENTS.md` no longer names `shared/libs/`. Exactly two lines changed — 45 and 107 — with `git diff -U0` proving the hunk set is confined to them; the file's 219 lines, its 15 headings, its table formatting and the `<Module>`/`<Name>` placeholder spellings are byte-identical to before. Phase 3 can no longer create the wrong directory on the strength of the file agents read every session.
- `.planning/PROJECT.md` now agrees with the frozen layout in `REQUIREMENTS.md`: both library-path bullets (lines 24 and 26) read `shared/lib/`, and `grep -cE 'shared/([^l]|$)'` returns zero.
- `.planning/PROJECT.md` carries a `## Traps for Later Phases` section, inserted immediately before `## Evolution` so the headings above it keep their line numbers and the corrections stay line-addressable. Four entries, each attributed to its originating decision: the singular-folder trap (D-24), the baseline-retirement obligation (D-10), the sweep's loud zero-match failure and its named flag (D-13), and the PlatformIO-Core-not-on-PATH remedy (D-09).
- The root `README.md` is a real entry point (100 lines) instead of a one-line placeholder. It names `homework.code-workspace`, says how to open it, and gives both the regenerate and the `--check` commands — the reason this task exists, since without that mention nobody knows the generated file is there.
- The README's negative gates all read zero: no deprecated global-library recipe, no environment-flag invocation, no later-phase file or directory, no machine-local absolute path.

## Task Commits

Each task was committed atomically:

1. **Task 1: Correct the two live library-path traps and record the cross-phase traps** - `57558cb` (docs)
2. **Task 2: The root README: what this repository is and how to use it** - `5d49a96` (docs)

**Plan metadata:** committed as part of this plan's close-out.

## Files Created/Modified

- `AGENTS.md` (modified, 2 lines) - line 45 `shared/libs/<Module>/` → `shared/lib/<Module>/` and `symlink://../../shared/libs/<Name>` → `symlink://../../shared/lib/<Name>`; line 107 the same symlink-path correction. The table header, the surrounding cells and the placeholder spelling are untouched.
- `.planning/PROJECT.md` (modified, 13 insertions / 2 deletions) - lines 24 and 26 corrected to `shared/lib/`; new `## Traps for Later Phases` section inserted before `## Evolution`.
- `README.md` (modified, 100 insertions / 1 deletion) - replaced the one-line placeholder with: what the repository is, the workspace-file section, the repository tree, prerequisites plus the not-on-PATH note and its export line, the one-command build, the homework definition, the conventions pointer and the licence line.

## Decisions Made

- **Kept `<Module>` and `<Name>` verbatim.** The planner's PATTERNS table suggested lower-casing `<module>`; the plan's own action and `must_haves` require the placeholder spelling to stay byte-identical, and its verify greps for `shared/lib/<Module>/`. The plan wins over the pattern note, and the smaller diff is the safer one.
- **Corrected PROJECT.md lines 24 and 26 only.** `REQUIREMENTS.md:20` names `shared/hardware/`, a different folder that is not in scope for the D-24 path trap.
- **Attributed every traps entry to its originating decision.** The plan requires the attribution, and it is what lets a later phase trace an obligation back to the rationale rather than treating it as folklore.
- **Documented a `-e`-flag-free build invocation on purpose.** D-16 makes environment names project-scoped, so the README gives only `pio run -d homeworks/<id>`. The `grep -cE 'pio run -e '` gate reading zero is a consequence of the decision, not of an oversight.

## Deviations from Plan

None - plan executed exactly as written.

The plan carried an explicit correction warning that a third occurrence of the plural segment was believed to sit at `AGENTS.md` line 173. Re-measured before editing: `grep -c 'shared/libs' AGENTS.md` returned exactly 2, at lines 45 and 107. The plan's own `corrections_that_override_sources` block predicted this, so no amendment was needed and no blind substitution was run.

## Issues Encountered

None.

Two environment constraints shaped how the close-out was performed, and neither is a deviation:

- `gsd_run` / `gsd-tools` are not on the PATH in this worktree, so the metadata commit was made with plain `git commit` using the same message convention. The `docs(01-03): ...` subject line and the worktree-mode file list (SUMMARY.md only — `REQUIREMENTS.md` is unchanged, and `STATE.md`/`ROADMAP.md` are the orchestrator's to write) are unaffected.
- Writing the plan's commit ledger into the git administrative directory was refused by the worktree-isolation guard, correctly — that path lies outside the worktree. The base SHA was carried in context instead and the commit count measured with an explicit `git rev-list --count <base>..HEAD`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The library path is consistent across `AGENTS.md`, `.planning/PROJECT.md` and `.planning/REQUIREMENTS.md`. No file an agent reads before acting names the wrong folder.
- Phase 3 can create `shared/lib/` from documentation alone without re-reading the requirements.
- The four traps are live in `PROJECT.md`, so Phase 3 (shared libraries), Phase 6 (the sweep's CI gate) and Phase 8 (baseline retirement before the README index) will all see their obligations through `load_prior_context`.
- `AGENTS.md` is GSD-generated: a regeneration may revert the two line corrections. Worst case is a return to this plan's starting state, not a worse one — and the commit body records it so the regression is diagnosable.
- The README describes the Phase 1 tree as a whole, including the files sibling plans 01-01 and 01-02 create. It is accurate once the wave merges and would be inaccurate if either plan were dropped.

---

## Self-Check: PASSED

- FOUND: `.planning/phases/01-repository-skeleton-and-project-layout/01-03-SUMMARY.md`
- FOUND: `AGENTS.md`
- FOUND: `.planning/PROJECT.md`
- FOUND: `README.md`
- FOUND: commit `57558cb` (ancestor of HEAD)
- FOUND: commit `5d49a96` (ancestor of HEAD)
- FOUND: commit `d407f1c` (ancestor of HEAD)
- Plan-level verification, all seven items: PASS
  - `grep -n 'shared/libs' AGENTS.md` → no match · `grep -c 'shared/lib/' AGENTS.md` → 2 · `wc -l < AGENTS.md` → 219
  - `grep -cE '^## ' AGENTS.md` → 15, identical to the pre-edit count
  - `grep -cE 'shared/([^l]|$)' .planning/PROJECT.md` → 0
  - `grep -c '^## Traps for Later Phases$' .planning/PROJECT.md` → 1
  - `git status --porcelain .planning/research` → empty
  - `grep -c 'homework.code-workspace' README.md` → 4
  - `grep -cE '\.clang-format|\.clang-tidy|markdownlint|pre-commit-config|\.github/workflows|\.agents/' README.md` → 0

---

*Phase: 01-repository-skeleton-and-project-layout*
*Completed: 2026-10-15*
