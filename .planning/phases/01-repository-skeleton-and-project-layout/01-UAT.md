---
status: complete
phase: 01-repository-skeleton-and-project-layout
source: [01-VERIFICATION.md]
started: 2026-10-15T15:11:02Z
updated: 2026-10-15T16:41:59Z
---

## Current Test

number: 2
name: Criterion 3's editor half — an editor session leaves the tree clean
expected: |
  No output from `git status --porcelain`.
awaiting: none — both tests complete

## Tests

### 1. Criterion 1's manual half — the workspace's rendered root set
expected: |
  Exactly three top-level roots named `root`, `shared` and `project-baseline`; no unresolved-path
  marker on `shared`; no stale-workspace warning. Secondary observation: whether
  `editor.rulers = 100` and `C_Cpp.formatting = clangFormat` apply to
  `homeworks/project-baseline/src/main.cpp`.
why_human: |
  No agent can observe what a VS Code window renders, and there is no deterministic predicate
  for "the editor loaded the workspace".
result: passed
observed: |
  Opened `homework.code-workspace` via the workspace FILE. Explorer showed exactly three
  top-level roots: `root`, `shared`, `project-baseline`. No unresolved-path marker on `shared`,
  no stale-workspace warning.

  SECONDARY OBSERVATION — NEGATIVE: no ruler was visible on `main.cpp`, so
  `editor.rulers = 100` did NOT take effect for the nested project. This is consistent with the
  open question the verifier recorded: the root `.vscode/settings.json` is folder-scoped to the
  `root` workspace folder, and every homework is nested INSIDE it, so folder-scoped settings do
  not reach nested PlatformIO projects. Recorded as an observation, not a failure — the
  criterion names the root set, not the ruler. Carry to Phase 3 (D4, the C++ standard and
  formatting contract), where a per-homework settings story must be decided.

### 2. Criterion 3's editor half — an editor session leaves the tree clean
expected: |
  No output from `git status --porcelain`. In particular, no modification to
  `homeworks/project-baseline/src/main.cpp`.
why_human: |
  A human editor session is not automatable, and the reading must be taken before the observation
  is written down (the log is itself a tracked file).
result: passed
observed: |
  FIRST READING — opened the workspace with NO files saved. `git status --porcelain` reported two
  UNTRACKED entries:

      ?? homeworks/project-baseline/.gitignore
      ?? homeworks/project-baseline/.vscode/

  This is a REAL failure of the criterion as written, and its cause was measured rather than
  guessed. The PlatformIO IDE extension (`platformio.platformio-ide@3.3.4`) generates a project
  scaffold inside any folder containing `platformio.ini` when the workspace is opened:
  `.gitignore` (94 B) and `.vscode/{c_cpp_properties.json, launch.json, extensions.json}`.
  Generated `.gitignore` ignores two of them, but the generated `.gitignore` ITSELF and
  `.vscode/extensions.json` matched no rule — the root `.gitignore`'s `.vscode/*` patterns
  contain an interior `/` and are therefore anchored to the repository root, so they never reach
  a nested project (proved with `git check-ignore -v`: the nested `launch.json` is ignored by the
  NESTED file at line 4, not by the root file at line 71).

  FALSIFICATION TEST: the files were deleted and the workspace reopened. Birth time moved from
  `18:14:47` to `18:28:04` with byte-identical sizes (94 / 311) — regenerated, not merely
  surviving. The defect is structural: it would recur for every future homework.

  REPAIR — commit the two files (`3b94058`). They are now part of the homework scaffold:
  the nested `.gitignore` is load-bearing (it is what keeps the 64 KB machine-path
  `c_cpp_properties.json` and `launch.json` out of git), and the generated `extensions.json`
  recommends the same extension the root `.vscode/extensions.json` already recommends.
  PlatformIO IDE does not rewrite files that already exist, so the committed content is stable.

  SECOND READING — after the repair, reopened the workspace and saved one tracked file in each of
  the three roots (`.planning/PROJECT.md`, `shared/lib/README.md`,
  `homeworks/project-baseline/src/main.cpp`). `git status --porcelain` is EMPTY.

  `main.cpp` and `shared/lib/README.md` still carry `modified=15:44:47`, i.e. the editor did not
  write them at all — so the verifier's prediction that `formatOnSave` + clangFormat would rewrite
  `main.cpp` (108 columns, 2-space indent, no `.clang-format` in the repository) did NOT
  materialise. RESIDUAL, stated rather than closed: this was measured on ONE file whose formatting
  may already be formatter-stable. It does not prove format-on-save is harmless for a future
  homework's C++ source. The `.clang-format` question stays open as D4.

## Summary

total: 2
passed: 2
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

None. Both criterion conjuncts that no agent can observe were exercised by a human and pass.

Two items carried forward, neither a gap:

1. Folder-scoped `.vscode/settings.json` does not reach nested homework projects (no ruler on
   `main.cpp`). Belongs to Phase 3 alongside D4.
2. `formatOnSave` on C++ remains untested against a file whose formatting is actually off-standard.
   Same phase, same decision.
