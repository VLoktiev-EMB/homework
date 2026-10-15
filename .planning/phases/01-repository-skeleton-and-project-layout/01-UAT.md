---
status: testing
phase: 01-repository-skeleton-and-project-layout
source: [01-VERIFICATION.md]
started: 2026-10-15T15:11:02Z
updated: 2026-10-15T15:11:02Z
---

## Current Test

number: 1
name: Criterion 1's manual half — the workspace's rendered root set
expected: |
  Open the committed `homework.code-workspace` (the workspace FILE, via File → Open Workspace
  from File…, not the folder). The Explorer must show exactly three top-level roots named
  `root`, `shared` and `project-baseline`; no unresolved-path marker on `shared`; no
  stale-workspace warning. While the window is open, also note whether `editor.rulers = 100`
  and `C_Cpp.formatting = clangFormat` are in effect for
  `homeworks/project-baseline/src/main.cpp`.
awaiting: user response

## Tests

### 1. Criterion 1's manual half — the workspace's rendered root set
expected: |
  Exactly three top-level roots named `root`, `shared` and `project-baseline`; no unresolved-path
  marker on `shared`; no stale-workspace warning. Secondary observation: whether
  `editor.rulers = 100` and `C_Cpp.formatting = clangFormat` apply to
  `homeworks/project-baseline/src/main.cpp` — the root `.vscode/settings.json` is folder-scoped
  and every homework is nested inside the `root` folder, so this is an open question.
why_human: |
  No agent can observe what a VS Code window renders, and there is no deterministic predicate
  for "the editor loaded the workspace". The phase deliberately recorded this with an explicitly
  unfilled output slot in 01-05-SUMMARY.md §12 — that empty slot is the correct artifact, not a
  gap in the work.
result: [pending]

### 2. Criterion 3's editor half — an editor session leaves the tree clean
expected: |
  In the same workspace session, open and save one tracked file in each of the three roots
  (a file under `.planning/`, one under `shared/`, one baseline project file), let the editor
  settle, then run `git status --porcelain` from the repository root BEFORE writing the result
  into any tracked file. Expected: no output. In particular, no modification to
  `homeworks/project-baseline/src/main.cpp`.
why_human: |
  A human editor session is not automatable, and the reading must be taken before the observation
  is written down (the log is itself a tracked file). Raised in severity by a live review finding:
  `editor.formatOnSave` is true, `[cpp]` uses `ms-vscode.cpptools` with
  `C_Cpp.formatting = clangFormat`, no `.clang-format` exists in the repository, and
  `main.cpp` line 13 is 108 columns with a 2-space body indent while `.editorconfig` declares
  `indent_size = 4` for `*.cpp`. Saving that file is therefore EXPECTED to rewrite it and make
  `git status` dirty. If the observation fails, record exactly what changed rather than
  re-saving until it looks clean.
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
