---
phase: 01-repository-skeleton-and-project-layout
verified: 2026-10-16T11:45:45Z
status: passed
score: 57/57 must-haves verified
covered_files: [".editorconfig", ".gitattributes", ".gitignore", ".planning/phases/01-repository-skeleton-and-project-layout/01-01-PLAN.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-01-SUMMARY.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-02-PLAN.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-02-SUMMARY.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-03-PLAN.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-03-SUMMARY.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-04-PLAN.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-04-SUMMARY.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-05-PLAN.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-05-SUMMARY.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-06-PLAN.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-06-SUMMARY.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-07-PLAN.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-07-SUMMARY.md", ".vscode/extensions.json", ".vscode/settings.json", "AGENTS.md", "README.md", "homework.code-workspace", "homeworks/project-baseline/.gitignore", "homeworks/project-baseline/.vscode/extensions.json", "homeworks/project-baseline/README.md", "homeworks/project-baseline/platformio.ini", "homeworks/project-baseline/src/main.cpp", "shared/lib/README.md", "tools/generate-workspace.mjs", "tools/lib/discover.mjs", "tools/sweep-homeworks.mjs", "tools/tests/discover.test.mjs", "tools/tests/generate-workspace.test.mjs", "tools/tests/helpers.mjs", "tools/tests/ignore-rules.test.mjs", "tools/tests/sweep.test.mjs"]
covered_digest: "v3:sha256:61c3cfc2bbe80d017a73ceb939cd5b21ea3aa183da9b7f9970dbc76537963a13"
behavior_unverified: 0
overrides_applied: 1
overrides:
  - must_have: "ROADMAP success criterion 2, second conjunct: moving a homework one level deeper breaks the build, which is what proves the depth rule is load-bearing."
    reason: "Owner-accepted deviation, decided 2026-10-15. The literal criterion is unobservable in Phase 1: homeworks/project-baseline/platformio.ini declares no lib_deps, so nothing resolves relative to the project directory and nothing fails to resolve — a copy of the baseline at homeworks/project-baseline/deeper/ builds successfully (measured, exit 0). The sanctioned discharge is the sweep's named-rule detector, which names the rule (DEPTH RULE VIOLATED, exit 1) before any child process exists; the sweep carries two named-rule detectors and only the depth one stands in for the build failure. The evidence is plan 01-06's two-arm measurement on a throwaway fixture: with lib_deps = probelib=symlink://../../shared/lib/probelib declared, the project at exactly one level below homeworks/ builds (arm A, exit 0) and the same project one level deeper fails to resolve (arm B, exit 1, PackageException: Can not create a symbolic link for ../../shared/lib/probelib, not a directory). Plan 01-07 records a Phase 3 success criterion under which the literal mechanism becomes observable on the committed tree once a homework declares a symlinked shared-library dependency, retiring the substitute."
    accepted_by: "4oc3p"
    accepted_at: "2026-10-15T16:13:03+03:00"
re_verification:
  previous_status: human_needed
  previous_score: 32/34
  gaps_closed:
    - "The two human-observable conjuncts the previous report carried as human_verification — criterion 1's rendered VS Code window and criterion 3's clean tree after an editor session. Both were deferred by design (01-05-SUMMARY.md §12, with explicitly unfilled output slots) to /gsd-verify-work 1, and both are recorded `result: pass` in 01-UAT.md (status: complete, 35 passed, 0 issues; the first UAT commit `9fd5185` is titled 'both human checks pass'). Corroborated on the codebase side by this pass: the workspace file lists exactly three roots whose paths all exist, and the ignore configuration now covers every generated editor artifact so a build — and therefore a settled editor session of the same tree — leaves porcelain empty."
    - "Override carried forward, unchanged and re-validated (not re-opened): still exactly one entry, still attributed from commit bf60cca, and its two premises independently re-measured by this pass (see Override Review)."
  gaps_remaining: []
  regressions: []
advisory: # Only if unevidenced new-scope findings exist (Step 7, re-verification only)
  - finding: "homework.code-workspace is emitted with a 2-space indent while .editorconfig's [*] indent_size = 4 governs it (the json/jsonc property group does not match the .code-workspace extension), so a single format-on-save of the generated file turns a correct tree into a reported STALE"
    category: architectural
    reason: "Raised because the file is generated and hand-editing is explicitly forbidden, so an editor-side rewrite is a plausible-looking edit that the drift check will flag. Not blocking: as committed the file is correct and --check exits 0; no deterministic failing artifact exists (the drift check is doing exactly its job by refusing the edit). Would be resolved by adding .code-workspace to the .editorconfig property group or excluding the file from format-on-save."
    evidence_status: "none provided — the defect requires a human to press save in the editor; no command reproduces it"
  - finding: "The regression test for the ignore contract reads only the root .gitignore, so the newly tracked nested homeworks/project-baseline/.gitignore is outside the inline-comment assertion even though it is now a load-bearing ignore source"
    category: other
    reason: "Raised because tools/tests/ignore-rules.test.mjs now accepts a nested ignore file as a repo-owned source but still asserts the comment-marker rule against IGNORE_FILE alone. Not blocking: the nested file was read by this pass and carries no inline comment, so no rule is silently disabled today. Would be resolved by asserting the comment rule over every reported source."
    evidence_status: "none provided — the file is currently clean; this is a coverage-of-the-guard observation, not an observed defect"
human_verification: [] # discharged by 01-UAT.md items 5 and 6 (both `result: pass`); see Human Verification Required below
---

# Phase 1: Repository Skeleton and Project Layout Verification Report

**Phase Goal:** The repository is one VS Code workspace holding the root, the shared-library tree and one folder per homework, with the folder names and the one-level depth rule frozen before any mechanism is built on them.
**Verified:** 2026-10-16T11:45:45Z
**Status:** passed
**Re-verification:** Yes — report regenerated from scratch after two commits invalidated the previous digest (`da63b0a` touched the regression test; `3b94058` added two tracked files). Previous report: `human_needed`, 32/34.

## Contract continuity — read this before comparing scores

The report being replaced carried no `must_haves:` block in its frontmatter, so there was no inherited contract to reuse. This pass rebuilt the contract from the authoritative sources instead of inheriting the previous body's 34-row projection:

1. **ROADMAP Success Criteria (A1–A4)** — the contract of record, four items, non-negotiable.
2. **All seven PLAN frontmatter `must_haves.truths` blocks (P01-1 … P07-6)** — 8 + 10 + 8 + 8 + 6 + 7 + 6 = 53 items.

The previous body's B1–B30 list folded several plan truths into others (for example 01-01's 16 MB-partition truth, its `upload_port` truth and 01-04's zero-match truth were absorbed into the roadmap criteria and never appeared as rows). Rebuilding rather than inheriting restores those; it also explains the denominator change from 32/34 to 57/57. The two sets overlap by construction and no plan truth has been dropped. Items the previous pass marked VERIFIED were re-measured, not re-derived.

## Goal Achievement

The phase goal is achieved. Read from the codebase, not from the summaries:

- `homework.code-workspace` exists, is valid JSON, lists exactly `root` (`.`), `shared` (`shared`) and `project-baseline` (`homeworks/project-baseline`), and is a byte-exact pure function of the tree (`node tools/generate-workspace.mjs --check` → `homework.code-workspace is up to date`, exit 0; the file was staled by one appended byte and the check fired, exit 1).
- `homeworks/` contains exactly one grammar-matching project, `project-baseline`, and `find homeworks -name platformio.ini` returns only its own file — no stray deeper `platformio.ini` exists.
- The folder-naming grammar has exactly one definition (`tools/lib/discover.mjs`; `grep -cE 'readdirSync|ID_PATTERN\s*=' tools/sweep-homeworks.mjs` → 0 — the sweep imports it).
- The one-level depth rule is enforced by name before any child process exists (`DEPTH RULE VIOLATED`, exit 1 — reproduced against a throwaway fixture this pass).
- One commit (`3b94058`) that landed after the previous verification **strengthened** criterion 3 rather than weakening it: it tracked the two PlatformIO-generated project files that carry no machine paths (`homeworks/project-baseline/.gitignore`, `.vscode/extensions.json`), which the root ignore rules — anchored by an interior slash — never reached, and therefore left untracked.

The verdict is `passed`, not `human_needed` and not `gaps_found`. Not `gaps_found`: no truth is FAILED, no artifact is MISSING or STUB (29/29 artifacts pass `verify.artifacts`), no key link is broken (the single negative the verb returned is a regex false negative, disproved directly below), and no debt marker exists. Not `human_needed`: the only two human-observable conjuncts were deferred by design to `/gsd-verify-work 1`, and that checkpoint ran — `01-UAT.md` is `status: complete`, 35 passed, 0 issues, and both conjuncts are `result: pass`.

### Observable Truths — ROADMAP Success Criteria (the contract)

| # | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| A1 | Criterion 1: opening the committed workspace file in VS Code shows the repo root, `shared/` and every homework as top-level roots | ✓ VERIFIED | Automated half re-measured: `--check` exit 0; `folders` is exactly `root`(`.`), `shared`(`shared`), `project-baseline`(`homeworks/project-baseline`); all three paths exist on disk so no root can render unresolved; the file carries no `settings` key (`grep -c '"settings"'` → 0). Manual half observed by the owner: `01-UAT.md` item 5 `result: pass`. |
| A2 | Criterion 2: a project at `homeworks/<id>/` builds from the root with exactly one command, `pio run -d homeworks/<id>` — and moving it one level deeper breaks the build | PASSED (override) | First conjunct re-measured: `pio run -d homeworks/project-baseline` → exit 0, `[SUCCESS] Took 0.61 seconds`, `Flash: used 268177 bytes from 6553600 bytes` (the 16 MB table). Second conjunct is **deliberately not met** and independently reconfirmed this pass: a copy of the baseline at `homeworks/project-baseline/deeper/` built — exit 0, `[SUCCESS] Took 2.82 seconds`. Override: owner-accepted deviation, `bf60cca`, accepted by 4oc3p 2026-10-15; see `overrides:` above and Override Review below. |
| A3 | Criterion 3: `git status` stays clean across a full build and an editor session — `.pio/`, `compile_commands.json` and generated editor state never appear as untracked or modified | ✓ VERIFIED | Build half re-measured: after `pio run -d homeworks/project-baseline` and a full sweep, `git status --porcelain` reports no build artifact and no compilation database (measured). `.pio/build` and `compile_commands.json` resolve to `.gitignore`-family rules and appear only under `--ignored`; every generated editor artifact the IDE writes inside the project is closed by the tracked nested `homeworks/project-baseline/.gitignore`. Editor half observed by the owner: `01-UAT.md` item 6 `result: pass`. The only porcelain entry at verification time is `.planning/STATE.md`, a workflow-written planning file caused by this GSD run — not by a build and not by an editor session (W-05). |
| A4 | Criterion 4: a repo-wide sweep in a tree matching zero homework projects exits non-zero with a readable message instead of reporting success | ✓ VERIFIED | Against an empty fixture root: `sweep: found ZERO homework projects under homeworks/*/platformio.ini` / `A gate that built nothing must not exit 0.` / `Pass --allow-empty only if an empty tree is genuinely expected.` — exit 1. `--allow-empty` remains the single named escape hatch and must be asked for (measured: exit 0, one line). |

### Observable Truths — PLAN frontmatter must-haves (53, re-measured)

#### 01-01 — the walking skeleton (8 truths, `requirements: [REPO-01, REPO-02]`)

| # | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| P01-1 | Opening the committed workspace shows exactly three top-level roots | ✓ VERIFIED | Same evidence as A1; manual half in `01-UAT.md` item 5. |
| P01-2 | The file names `shared` and every discovered id, sorted; regenerating an unchanged tree is byte-identical | ✓ VERIFIED | `--check` exit 0 (byte comparison is the mechanism); `folders` literal matches the tree; `renderWorkspace` is a pure export. |
| P01-3 | `--check` exits 0 on a current file and 1 naming the file and the remedy on a hand-edited one | ✓ VERIFIED | Reproduced both arms this pass: exit 0 on the committed file; after appending one byte, exit 1 with `homework.code-workspace is STALE.` + `must never be hand-edited.` + `Run: node tools/generate-workspace.mjs`; file restored, `--check` exit 0 again. Boundary noted as W-02. |
| P01-4 | A directory under `homeworks/` is a homework iff its name matches the grammar and it contains a `platformio.ini`; one rule serves generator, sweep and CI | ✓ VERIFIED | `tools/lib/discover.mjs:72–83` is the only definition; `grep -cE 'readdirSync\|ID_PATTERN\s*=' tools/sweep-homeworks.mjs` → 0; the sweep imports `{ discoverHomeworks, ID_PATTERN_TEXT }` (sweep:35) and consumes it at :56 and :80. |
| P01-5 | `pio run -d homeworks/project-baseline` exits 0 from the repository root, which carries no `platformio.ini` itself | ✓ VERIFIED | Measured: exit 0, `[SUCCESS] Took 0.61 seconds`. |
| P01-6 | The built partition is the 16 MB table's (6553600 bytes), not the 8 MB table's | ✓ VERIFIED | `Flash: used 268177 bytes from 6553600 bytes` — exact match for `default_16MB.csv`. |
| P01-7 | No `upload_port` or `monitor_port` is committed for the baseline | ✓ VERIFIED | `grep -rn 'upload_port\|monitor_port' homeworks/` → no match (exit 1). |
| P01-8 | `shared/lib/` exists as a git-tracked directory because it contains a `README.md` | ✓ VERIFIED | `git ls-files shared` → `shared/lib/README.md`. |

#### 01-02 — ignore rules, text layer, editor settings (10 truths, `requirements: [REPO-04]`)

| # | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| P02-1 | `git status --porcelain` reports no untracked entry for `.DS_Store`, `.planning/research/.cache/`, `.planning/state.json` | ✓ VERIFIED | All three resolve to the repository's own `.gitignore` (lines 82, 125, 95) and none appears in porcelain. |
| P02-2 | Build output is ignored at any depth without an extra prefix: `check-ignore` resolves `.pio/build` and `compile_commands.json` to the root `.gitignore` | ✓ VERIFIED (evidence superseded — W-01) | Substance re-proved independently in a throwaway repository carrying only the root `.gitignore`: `homeworks/x/.pio/build` → `.gitignore:16:.pio/` and `homeworks/x/deep/deeper/compile_commands.json` → `.gitignore:20`, i.e. unanchored, any depth, no `**/` prefix. In the live tree `compile_commands.json` still resolves to `.gitignore:20`, but `.pio/build` now resolves to `homeworks/project-baseline/.gitignore:1:.pio` (nested takes precedence). That file is **tracked**, so a clone inherits it; requirement REPO-04 holds either way. |
| P02-3 | No gitignore pattern carries a comment on its own line, so no secret pattern is silently disabled | ✓ VERIFIED | `grep -cE '^[^#][^#]*#' .gitignore` → 0; the new lock rule is preceded by comment lines, not suffixed. The nested project ignore file was read too and is also free of inline comments (assertion coverage gap noted as advisory). |
| P02-4 | A hand-authored config file is not swallowed by the rule ignoring its generated sibling | ✓ VERIFIED | `git check-ignore -q sdkconfig.defaults` → exit 1 (not ignored), while `sdkconfig.*` is. |
| P02-5 | `.claude/settings.local.json` is ignored by the repository, not only by machine-global excludes | ✓ VERIFIED | `git check-ignore -v` → `.gitignore:98:.claude/*.local.json`. |
| P02-6 | The agent-state rules never match the whole `.claude` directory | ✓ VERIFIED | `.claude/skills/new-homework/SKILL.md` → exit 1 (not ignored); no rule targets `.claude/` wholesale. |
| P02-7 | `.editorconfig` uses only the nine properties the EditorConfig specification defines | ✓ VERIFIED | Keys present: `root`, `charset`, `end_of_line`, `insert_final_newline`, `trim_trailing_whitespace`, `indent_style`, `indent_size` — seven, all within the nine; no `max_line_length`, no `trim_final_newlines`. |
| P02-8 | `.gitattributes` normalises text to LF in the index while `.editorconfig` governs the editor; neither duplicates the other | ✓ VERIFIED | `git check-attr text eol -- README.md` → `text: set`, `eol: lf`; `.editorconfig` carries `end_of_line` and `.gitattributes` carries `eol=lf` as the documented division of labour. |
| P02-9 | A generated vector image is treated as text by git | ✓ VERIFIED | `git check-attr text -- docs/wiring.svg` → `text: set` (`*.svg text`; never marked binary). |
| P02-10 | Editor settings live only in `.vscode/settings.json`; only the one measured PlatformIO IDE key is present | ✓ VERIFIED | `homework.code-workspace` has no `settings` key (`grep -c` → 0); `.vscode/settings.json` carries exactly one `platformio-ide.*` key. |

#### 01-03 — corrected path traps and the root README (8 truths, `requirements: [REPO-01, REPO-02, REPO-03]`)

| # | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| P03-1 | The plural library-folder path no longer appears anywhere in `AGENTS.md`; both occurrences name the singular folder and singular symlink path | ✓ VERIFIED | `grep -c 'shared/libs' AGENTS.md` → 0; `grep -c 'shared/lib/' AGENTS.md` → 2. |
| P03-2 | `AGENTS.md` contains nothing but those two path-segment corrections | ✓ VERIFIED | Commit `57558cb` shows `AGENTS.md | 4 ++--` — exactly two hunks, one single-token substitution each (lines 45 and 107); no later commit touches the file. |
| P03-3 | A path segment appearing only inside prose about the rejected global-library directive is left untouched | ✓ VERIFIED | The second hunk changes only the `symlink://` path segment inside the `lib_extra_dirs`/`globallib_dir` row; the surrounding prose is unchanged. |
| P03-4 | `.planning/PROJECT.md` names the same library folder as `REQUIREMENTS.md` | ✓ VERIFIED | `grep -c 'shared/lib/' .planning/PROJECT.md` → 3; no plural form. |
| P03-5 | `.planning/PROJECT.md` gains a Traps section every later phase's prior-context load will read | ✓ VERIFIED | `grep -c '^## Traps for Later Phases$' .planning/PROJECT.md` → 1. |
| P03-6 | The root README names the generated workspace file and says how to open it | ✓ VERIFIED | `grep -c 'homework.code-workspace' README.md` → 4, including the three-step File → Open Workspace from File… procedure. |
| P03-7 | The root README states the one-command build, where the conventions live, and what counts as a homework | ✓ VERIFIED | `## Building a homework` carries `pio run -d homeworks/<id>`; `## Conventions` points at `AGENTS.md`; `## What counts as a homework` states the grammar. |
| P03-8 | The root README documents no directory, file or command that does not exist in the tree it ships with | ✓ VERIFIED | Every path in the structure block was tested for existence (`.editorconfig`, `.gitattributes`, `.gitignore`, `.vscode/`, `.planning/`, `AGENTS.md`, `LICENSE`, `README.md`, `homework.code-workspace`, `tools/`, `tools/lib/`, `tools/tests/`, `shared/lib/`, `homeworks/project-baseline/`) — none missing; no `scripts/`, `docs/`, `.agents/` or analyzer-config claim. |

#### 01-04 — the repo-wide sweep (8 truths, `requirements: [REPO-02, REPO-03]`)

| # | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| P04-1 | The sweep exits non-zero with a readable message when it matches zero homework projects | ✓ VERIFIED | Empty fixture root → three-line message, exit 1. |
| P04-2 | The single named escape hatch for an intentionally empty tree is one explicit flag; failure is the default | ✓ VERIFIED | `--root <empty> --allow-empty` → `sweep: no homework projects found (--allow-empty)`, exit 0; without the flag, exit 1. |
| P04-3 | A `platformio.ini` one level below a homework folder makes the sweep exit non-zero naming the RULE | ✓ VERIFIED | Fixture `homeworks/m01-l03-blink/deeper/platformio.ini` → `DEPTH RULE VIOLATED` + one-level requirement + two-line reason + `  deeper platformio.ini found: homeworks/m01-l03-blink/deeper`, exit 1. |
| P04-4 | A homework folder whose name fails the frozen grammar makes the sweep exit non-zero and print the expected pattern | ✓ VERIFIED | Fixture `homeworks/badName/` → `MALFORMED HOMEWORK ID` / `Expected: ^(?:m[0-9]{2}-l[0-9]{2}\|project)-[a-z0-9]+(?:-[a-z0-9]+)*$` / `  does not match: homeworks/badName/`, exit 1. |
| P04-5 | Both policy failures fire before any build is attempted | ✓ VERIFIED | Control flow in `tools/sweep-homeworks.mjs`: both branches set `failed` and `process.exit(1)` at line 86, before `resolvePio()` (:122) and before any `spawnSync` build (:137). |
| P04-6 | The sweep builds every discovered project from the repository root and accumulates failures rather than stopping at the first | ✓ VERIFIED | Live run: discovered `project-baseline`, spawned `pio run -d homeworks/project-baseline` with `cwd` = scanned root, `[SUCCESS]`, exit 0; the loop sets `exitCode = 1` and continues rather than breaking. |
| P04-7 | An absent or unresolvable PlatformIO binary produces an actionable message distinguishable from a build failure | ✓ VERIFIED | Suite test `an unstartable PlatformIO binary exits 1 with a spawn failure, not a build failure` is green within the 32/32 run; the `result.error` branch (:141) is separate from the `result.status !== 0` branch (:144). |
| P04-8 | Discovery and validation are delegated to the one shared module rather than re-implemented | ✓ VERIFIED | Second-implementation grep → 0; import at :35; no second `readdirSync` over `homeworks/`. |

#### 01-05 — the acceptance run (6 truths, `requirements: [REPO-01, REPO-02, REPO-03, REPO-04]`)

| # | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| P05-1 | A clone-then-build run leaves `git status --porcelain` completely empty — no build directory, no compilation database, no generated editor state, no machine-written GSD state file | ✓ VERIFIED | Measured this pass: porcelain reports no build artifact, no `compile_commands.json`, no editor state before or after `pio run` and after a full sweep. The one entry present is `.planning/STATE.md` (W-05), a planning file this GSD run rewrote — not a build output and not one of the artifacts the criterion names. |
| P05-2 | The build reports the 16 MB application partition size | ✓ VERIFIED | `6553600` bytes. |
| P05-3 | Placing a project one level below a homework folder makes the sweep exit non-zero naming the rule, demonstrated against the real tree, and the probe leaves no residue | ✓ VERIFIED | Re-measured on a throwaway fixture (`DEPTH RULE VIOLATED`, exit 1); residue checked: `ls homeworks` → `project-baseline` only, and no grammar-matching directory was added. The live-tree probe is recorded in `01-05-SUMMARY.md` §8/§9 and re-exercised in UAT item 25. |
| P05-4 | The generated workspace file passes its drift check on the committed tree | ✓ VERIFIED | `--check` → `homework.code-workspace is up to date`, exit 0. |
| P05-5 | Opening the committed workspace file in VS Code shows the repository root, `shared/` and the baseline project as top-level roots (criterion 1's manual half, recorded in the phase log) | ✓ VERIFIED | The phase log deliberately carried an **unfilled** output slot for this (`01-05-SUMMARY.md` §12, "every slot below is empty because the observation has not happened yet") and deferred it to `/gsd-verify-work 1`. That checkpoint ran: `01-UAT.md` item 5, `result: pass`, `status: complete`. Corroborated: the file lists exactly those three roots and all three paths exist. |
| P05-6 | The exact `git status` output observed before, during and after the acceptance run is recorded in the phase log | ✓ VERIFIED | `01-05-SUMMARY.md` carries verbatim blocks at §2/§3/§5/§8/§11 (lines 191, 319, 375) plus the timing rule requiring the reading to be taken before it is written down. |

#### 01-06 — gap closure: the lock class, the regression gate, the two-arm measurement (7 truths, `requirements: [REPO-01..04]`)

| # | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| P06-1 | `.planning/milestone.lock` no longer appears in `git status --porcelain`; every GSD lock file under the planning directory is closed by the repository's own ignore file | ✓ VERIFIED | `git check-ignore -v .planning/milestone.lock` → `.gitignore:96:.planning/*.lock`; porcelain does not list it. |
| P06-2 | The rule is a lock-file glob narrow enough to reach only lock files, and no currently-tracked path under the planning directory becomes ignored | ✓ VERIFIED | Literal line 96 read: `.planning/*.lock`. `git ls-files -i -c --exclude-standard` → empty (exit 0). `.planning/config.json`, `.planning/PROJECT.md` → not ignored. The suite asserts the same over git's own index and over the five tracked planning documents. |
| P06-3 | The rule is the repository's own, not this machine's global excludes file | ✓ VERIFIED | `git check-ignore -v` names `.gitignore` as the source; the assertion is on the reported source, which is what makes a machine-local excludes file irrelevant. |
| P06-4 | A regression gate covers the class: `tools/tests/ignore-rules.test.mjs` asserts both directions, so dropping the lock line or a previously asserted rule turns the suite red | ✓ VERIFIED | 200-line file, 5 tests, all green in the 32/32 run. Read in full: the positive table asserts the reported **source** is a tracked ignore file (`isRepoOwnedIgnoreSource` rejects absolute paths, `..` segments and untracked nested files), the negative table asserts five counterparts stay unignored, and the index guard fails if any tracked path became ignored. |
| P06-5 | The depth rule's build behaviour with a real symlinked `lib_deps` is MEASURED, and the truth admits either outcome | ✓ VERIFIED | Independently re-measured this pass on a fresh `mktemp -d` fixture with `lib_deps = probelib=symlink://../../shared/lib/probelib`: arm A (exactly one level below `homeworks/`) → exit 0, `[SUCCESS] Took 2.43 seconds`; arm B (same project one level deeper) → exit 1, `PackageException: Can not create a symbolic link for \`../../shared/lib/probelib\`, not a directory`. Matches the record. |
| P06-6 | The measurement leaves no residue; the tree is unchanged by it | ✓ VERIFIED | Fixture root removed and asserted absent; no grammar-matching directory under `homeworks/` other than `project-baseline`; porcelain unchanged by the measurement. |
| P06-7 | Both clean-tree readings the plan asserts are empty | ✓ VERIFIED | Recorded verbatim in `01-06-SUMMARY.md`; this pass's independent reading on the built tree is empty apart from the workflow-written `.planning/STATE.md` (W-05). |

#### 01-07 — recording the owner's accepted override (6 truths, `requirements: [REPO-01..04]`)

| # | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| P07-1 | The owner's decision on criterion 2's second conjunct is recorded in `ROADMAP.md` as a dated, deliberate deviation carrying both the reason and the Phase 3 trigger | ✓ VERIFIED | `ROADMAP.md` lines 44–47: the `> **Verification discharge (criterion 2, second conjunct):**` blockquote, dated 2026-10-15, naming `bf60cca`, the reason, the measured two-arm evidence and the retirement trigger. |
| P07-2 | `ROADMAP.md` Phase 1 criterion 2's wording is unchanged; the discharge is an appended dated note beside it | ✓ VERIFIED | `sed -n '/^  2\. A PlatformIO project placed at/p' .planning/ROADMAP.md \| shasum -a 256` → `1f03e2c72b1bed66621f8f040e729f39508ade65811772566a7de1b4bf90e5d9`, byte-identical to the hash `01-UAT.md` item 31 recorded. The hash covers the whole line, so neither clause was rewritten. |
| P07-3 | The verification record carries exactly one override entry, attributed from the owner's decision commit, with `must_have` text in the failing clause's own vocabulary | ✓ VERIFIED | This report's frontmatter carries exactly one `overrides:` entry. Its attribution fields (`4oc3p`, `2026-10-15T16:13:03+03:00`) match `git show -s bf60cca` exactly — `4oc3p <23013718+4oc3p@users.noreply.github.com>`, Thu Oct 15 16:13:03 2026 +0300 — and `bf60cca` is an ancestor of HEAD (verified). Entry carried forward verbatim. |
| P07-4 | ROADMAP Phase 3 carries an additional numbered success criterion making the depth rule's build-failure half observable on the committed tree | ✓ VERIFIED | `ROADMAP.md` line 94, Phase 3 criterion 5, names `lib_deps = <name>=symlink://../../shared/lib/<name>` as the trigger and `pio run -d <deeper copy of the project>` as the one command that settles it. Criteria 1–4 are unaltered and `**Plans:** TBD` is unchanged — the criterion was appended. |
| P07-5 | The tree still builds and stays clean after the recording | ✓ VERIFIED | `pio run -d homeworks/project-baseline` exit 0 reporting `6553600`; `--check` exit 0; `--list` → `project-baseline`, exit 0; suite 32/32 green; porcelain empty apart from the workflow-written `.planning/STATE.md`. |
| P07-6 | The owner's stated reason is either confirmed by the measurement or contradicted in the record | ✓ VERIFIED | `01-07-SUMMARY.md` §6 states the confirmation explicitly and names both halves of the reason. My independent reproduction agrees with both halves: the deeper baseline copy builds (reason's second half), and the boundary appears the moment a symlinked dependency exists (arm A resolves, arm B fails). |

**Score:** 57/57 must-haves resolved — 4 ROADMAP criteria (A1 ✓, A2 PASSED (override), A3 ✓, A4 ✓) and 53 PLAN-level truths, all ✓ VERIFIED.

### Advisory (New Scope, Unevidenced)

`is_re_verification = true`, so this section is present. The Step 7 scan produced **no unevidenced new-scope blocker**; the two new-scope observations this pass formed are recorded in the frontmatter `advisory:` list because neither can be demonstrated by a command (both require a human editor action):

| # | Finding | Category | Why Advisory |
| --- | ------- | -------- | --------------- |
| 1 | `.code-workspace` is 2-space indented while `.editorconfig`'s `[*] indent_size = 4` governs it, so one format-on-save turns a correct tree into a reported STALE | architectural | new-scope, no deterministic evidence — the defect requires a human to press save |
| 2 | The inline-comment regression assertion covers only the root `.gitignore`, not the newly tracked nested one | other | new-scope, no deterministic evidence — the nested file is currently clean |

Neither is in the previous `gaps:` list (there was none) and neither sits on a file modified since the previous pass in a way that reproduces a prior finding, so neither blocks; neither reverts a completed must-have.

### Required Artifacts

`gsd_run query verify.artifacts` was run against all seven plans: **29/29 artifacts pass (exit 0, `all_passed: true` for every plan)**. Levels 2–4 were then checked by hand for the artifacts that carry behaviour.

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `tools/lib/discover.mjs` | Single discovery source: `HOMEWORKS_DIR`, `ID_PATTERN`, `ID_PATTERN_TEXT`, `discoverHomeworks`, `findDepthViolations`, `envNames` | ✓ VERIFIED | All six exported; `node:fs`/`node:path` only; `isDirectory()` used deliberately so a symlinked directory cannot walk the tree. |
| `tools/generate-workspace.mjs` | Pure renderer plus byte-comparison drift check | ✓ VERIFIED | `renderWorkspace` is a real pure export; both `--check` outcomes reproduced. Boundary: the entry-point guard fails open under a symlinked script path (W-02). |
| `homework.code-workspace` | Generated multi-root workspace containing `homeworks/project-baseline` | ✓ VERIFIED | Exactly the three expected folders; pure folder list; regenerates byte-identically. |
| `homeworks/project-baseline/platformio.ini` | Pinned, N16R8-overridden build environment | ✓ VERIFIED | `platform = espressif32@7.1.3` (exact), four N16R8 overrides, `monitor_speed = 115200`, no console-port key, no `lib_deps` (`grep -c` → 0 — the fact the override rests on). |
| `homeworks/project-baseline/src/main.cpp` | Serial report of flash size, `psramFound()` and PSRAM size; touches no GPIO | ✓ VERIFIED | `Serial.begin(115200)` + one `printf` over `ESP.getFlashChipSize()`, `psramFound()`, `ESP.getPsramSize()`; no GPIO call. |
| `tools/sweep-homeworks.mjs` | Repo-wide gate with loud zero-match failure and named-rule depth detection | ✓ VERIFIED | Carries `DEPTH RULE VIOLATED` and `MALFORMED HOMEWORK ID`; argv array, no shell (`grep` for `exec(`/`shell: true` → none); policy failures precede `resolvePio()` and any build. |
| `tools/tests/ignore-rules.test.mjs` | The ignore contract asserted against git itself, both directions | ✓ VERIFIED | 200 lines, 5 tests, green; read-only by construction; asserts the reported source is a **tracked** ignore file rather than a bare exit status, so a machine-local excludes file cannot make it pass vacuously. |
| `homeworks/project-baseline/.gitignore` | Closes the generated files inside a project that the root rules (anchored by an interior slash) never reached | ✓ VERIFIED (new in this pass) | Tracked; resolves `.pio`, `.vscode/c_cpp_properties.json`, `.vscode/launch.json`, `.vscode/ipch`, `.vscode/.browse.c_cpp.db*`; carries no absolute path; no tracked file was swallowed by it (`git ls-files -i -c --exclude-standard` empty). |
| `homeworks/project-baseline/.vscode/extensions.json` | Recommends the PlatformIO IDE and its companions, consistent with the committed settings | ✓ VERIFIED (new in this pass) | Tracked; recommends `platformio.platformio-ide`; carries no absolute path. |
| `.gitignore` | Single deliberate ignore file; the GSD lock class closed by rule | ✓ VERIFIED | Literal `.planning/*.lock` at line 96 with a documented rationale at lines 91–94; no inline comments; porcelain clean of machine-local artifacts. |
| `.editorconfig`, `.gitattributes`, `.vscode/settings.json`, `.vscode/extensions.json` | The text-layer contract and editor settings | ✓ VERIFIED | Each parses and each rule resolves (see P02-7…P02-10). The `.code-workspace` indent mismatch and the `[cpp]` format-on-save risk are carried as advisories. |
| `tools/tests/{discover,generate-workspace,sweep}.test.mjs`, `tools/tests/helpers.mjs` | Unit and integration coverage | ✓ VERIFIED | All green within the 32-test run; fixtures built under `os.tmpdir()` so the real tree is never built by the suite. |
| `shared/lib/README.md`, `homeworks/project-baseline/README.md` | Make `shared/lib` trackable; declare the baseline not a course homework | ✓ VERIFIED | Both tracked; the baseline README's first line carries the disclaimer and it states the one-environment and no-console-port rationales. |

### Key Link Verification

`gsd_run query verify.key-links` was run against all seven plans. Six report `all_verified: true`. The seventh reports one negative, which this pass **disproved directly** rather than accepting:

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `tools/generate-workspace.mjs` | `tools/lib/discover.mjs` | imports `discoverHomeworks` | WIRED | Import present; second-implementation grep → 0. |
| `tools/lib/discover.mjs` | `homework.code-workspace` | `renderWorkspace` turns discovered ids into `folders`; `--check` compares bytes | WIRED | Drift check exits 0 on the committed file; a one-byte hand edit makes it exit 1. |
| `homeworks/project-baseline/platformio.ini` | `homeworks/project-baseline/src/main.cpp` | the env's `src/` tree builds; `monitor_speed` matches `Serial.begin()` | WIRED | `monitor_speed = 115200` (ini) vs `Serial.begin(115200)` (main.cpp:12). |
| `tools/sweep-homeworks.mjs` | `tools/lib/discover.mjs` | imports `discoverHomeworks` and the printable id pattern | WIRED | Import at :35; consumed at :56 and :80. |
| `tools/sweep-homeworks.mjs` | `homeworks/project-baseline` | spawns the build verb with a project-directory argument and no shell | WIRED | Live run built the baseline from the scan root, exit 0. |
| `tools/tests/ignore-rules.test.mjs` | `.gitignore` | `git check-ignore -v` source assertion, per path | WIRED | Green; asserts the reported source is a tracked ignore file, so a machine-local excludes file cannot make it pass vacuously. |
| `.gitignore` | the GSD lock-file class under the planning directory | `.planning/*.lock` | WIRED | **The verb reported `verified: false` — `Pattern ".planning/*.lock" not found in source or target` — and that is a false negative.** The verb treats the declared pattern as a regex, where `*` is a quantifier, so it cannot match its own literal text; it also resolved `to` as prose rather than a file. Disproved directly: `.gitignore:96` **is** the literal string `.planning/*.lock` (`grep -n '^\.planning/\*\.lock$'` → `96:.planning/*.lock`), and git resolves the artifact through it (`git check-ignore -v .planning/milestone.lock` → `.gitignore:96:.planning/*.lock`). Not counted as a broken link. |
| `.vscode/settings.json` | `.editorconfig` | one owner per rule | WIRED, one exception | The `files.*` mirror agrees; `editor.tabSize = 4` vs the generator's 2-space `.code-workspace` output is the advisory above. |
| `homework.code-workspace` | `homeworks/` | the committed file is what a reader opens; the drift check proves it still matches | WIRED | `--check` exit 0; the three roots match the tree. |
| `homeworks/project-baseline/.gitignore` | `.pio/`, generated editor state inside the project | nested ignore source, git-tracked so a clone inherits it | WIRED (new in this pass) | `.pio/build` → `homeworks/project-baseline/.gitignore:1:.pio`; `.vscode/c_cpp_properties.json` → `:3`; `.vscode/launch.json` → `:4`. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `homework.code-workspace` | `folders[]` | `discoverHomeworks(REPO_ROOT).found` — a real `readdirSync` over `homeworks/` | Yes | ✓ FLOWING |
| `tools/generate-workspace.mjs --check` | `expected` | `renderWorkspace()` over the live tree, compared byte-for-byte with the file on disk | Yes | ✓ FLOWING |
| `tools/sweep-homeworks.mjs` | `found` | `discoverHomeworks(root)` over the real tree, then a real `spawnSync` build | Yes | ✓ FLOWING |
| `homeworks/project-baseline/src/main.cpp` | flash / PSRAM values | `ESP.getFlashChipSize()`, `psramFound()`, `ESP.getPsramSize()` — runtime measurement, no literal | Yes (on hardware) | ✓ FLOWING (compile-time verified; the runtime report is Phase 2's on-board acceptance) |

No hard-coded literal, static fallback or mock terminates any of these chains.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Workspace drift check passes | `node tools/generate-workspace.mjs --check` | `homework.code-workspace is up to date`, exit 0 | ✓ PASS |
| Drift check fires on a hand edit | append one byte, then `--check` | `... is STALE.` + remedy, exit 1; file restored, `--check` exit 0 again | ✓ PASS |
| One-command build from the repo root | `pio run -d homeworks/project-baseline` | exit 0, `[SUCCESS] Took 0.61 seconds`, `6553600` bytes | ✓ PASS |
| Criterion 2 half (b): a deeper project breaks the build | copy of the baseline at `homeworks/project-baseline/deeper/` | exit 0, `[SUCCESS] Took 2.82 seconds` | ✗ NOT MET — the criterion's literal mechanism is absent; **discharged by the accepted override** |
| Two-arm symlinked-dependency measurement (P06-5) | arm A / arm B on a fresh `mktemp -d` fixture | arm A exit 0 `SUCCESS`; arm B exit 1 `PackageException: Can not create a symbolic link for \`../../shared/lib/probelib\`, not a directory` | ✓ PASS (the boundary is real) |
| Root `.pio/` rule is unanchored and covers any depth | throwaway repo carrying only the root `.gitignore` | `.pio/build` → `.gitignore:16:.pio/`; `deep/deeper/compile_commands.json` → `.gitignore:20` | ✓ PASS |
| Sweep lists validated ids | `node tools/sweep-homeworks.mjs --list` | `project-baseline`, exit 0 | ✓ PASS |
| Criterion 4: zero matches fails loudly | `node tools/sweep-homeworks.mjs --root <empty fixture>` | three-line message, exit 1 | ✓ PASS |
| Escape hatch is opt-in | `--root <empty fixture> --allow-empty` | exit 0, one line | ✓ PASS |
| Depth rule names the rule, before any build | fixture with `homeworks/m01-l03-blink/deeper/platformio.ini` | `DEPTH RULE VIOLATED` + path, exit 1 | ✓ PASS |
| Malformed id names the grammar | fixture with `homeworks/badName/` | `MALFORMED HOMEWORK ID` + expected pattern, exit 1 | ✓ PASS |
| Criterion 3: tree clean after builds | `git status --porcelain` before and after `pio run` and the sweep | only ` M .planning/STATE.md` (workflow-written; W-05) — no build artifact, no compilation database, no editor state | ✓ PASS |
| Test suite (run once, whole workspace) | `FORCE_COLOR=0 node --test "tools/**/*.test.mjs"` | tests 32, pass 32, fail 0, cancelled 0, skipped 0, todo 0 | ✓ PASS |

### Probe Execution

No probe scripts are declared in any PLAN or SUMMARY of this phase, and no `scripts/` tree exists in the repository (`find scripts -path '*/tests/probe-*.sh'` → nothing). Step 7c is not applicable; no `MISSING_PROBE` is recorded.

### Requirements Coverage

Extracted `requirements:` from all seven plan frontmatters: 01-01 → REPO-01, REPO-02 · 01-02 → REPO-04 · 01-03 → REPO-01, REPO-02, REPO-03 · 01-04 → REPO-02, REPO-03 · 01-05/01-06/01-07 → REPO-01..04. Cross-referenced against `REQUIREMENTS.md`, which maps exactly REPO-01..04 to Phase 1.

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| REPO-01 | 01-01, 01-03, 01-05, 01-06, 01-07 | The repository opens as ONE VS Code workspace listing the repo root, `shared/`, and one folder per homework | ✓ SATISFIED | `homework.code-workspace` lists exactly `root`, `shared`, `project-baseline`; `--check` exit 0; every path exists; README documents how to open it. The rendered window was confirmed by the owner (UAT item 5, pass). |
| REPO-02 | 01-01, 01-03, 01-04, 01-05, 01-06, 01-07 | Each homework lives at `homeworks/<module>-<lesson>-<slug>/` and is buildable from the root with `pio run -d homeworks/<id>` | ✓ SATISFIED | Build exits 0 from the root reporting the 16 MB partition; `--list` prints `project-baseline`; the grammar is frozen in `discover.mjs` and documented in README + AGENTS.md + PROJECT.md. |
| REPO-03 | 01-03, 01-04, 01-05, 01-06, 01-07 | Every homework sits exactly one directory level below `homeworks/`, because every shared-library path in `lib_deps` is relative to the project | ✓ SATISFIED (one half by owner-accepted deviation) | The rule fires by name before any build (`DEPTH RULE VIOLATED`, exit 1) and is documented in the README, `PROJECT.md` and the ROADMAP discharge note. The build-failure half is measured on a fixture (arm A resolves, arm B does not) but is absent from the committed tree, which declares no `lib_deps`; it is retired by Phase 3 success criterion 5. |
| REPO-04 | 01-02, 01-05, 01-06 | Machine-generated and machine-local artifacts (`.pio/`, `compile_commands.json`) are gitignored, never committed | ✓ SATISFIED | `compile_commands.json` → `.gitignore:20`; `.pio/` → the tracked nested `homeworks/project-baseline/.gitignore:1` (root `.pio/` remains and covers any depth — proven in a throwaway repo); generated editor state → the same nested file; `.planning/milestone.lock` → `.gitignore:96`. `git status --porcelain` reports no build artifact. |

**No orphaned requirements.** All four IDs appear in the `requirements:` field of at least one plan, none is claimed by a plan outside this phase, and `REQUIREMENTS.md` maps no additional ID to Phase 1. The traceability table's `Gaps Found` cells are the *phase* status column and are superseded by this report.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | `TBD` / `FIXME` / `XXX` in any phase-modified file | none | Scanned all 22 phase-modified implementation/evidence files → zero matches. No debt-marker BLOCKER. |
| — | — | `TODO` / `HACK` / `PLACEHOLDER` / `placeholder` / `coming soon` / `not yet implemented` / `not available` | none | Zero matches. |
| — | — | `return null` / `return {}` / `return []` / `=> {}` | none | Two hits, both legitimate and documented: `tools/lib/discover.mjs:32` returns an empty list for an absent directory so discovery reports "nothing found" rather than throwing (and the sweep then fails loudly), and `tools/tests/ignore-rules.test.mjs:42` returns `null` for "not ignored" inside the assertion helper. Neither flows to user-visible output as a stub. |
| — | — | Hard-coded empty data reaching rendering | none | `discover.mjs:51/74/75` are accumulator initialisations populated by the walk. No component renders a value with no data path. |
| — | — | Console.log-only implementation | none | The CLIs' `console.log` is their contract (the `--list` output Phase 6 consumes), not a stand-in for behaviour. |
| `tools/generate-workspace.mjs` | 68 | Entry-point guard fails open when the script path carries a symlink: `--check` prints nothing and exits **0** on a deliberately staled file | ⚠️ Warning (W-02) | Reproduced independently this pass. Does **not** falsify a must-have (P01-3's two documented outcomes are correct under the invocation the README prescribes, reproduced both ways) and is not a Step 7 pattern, so it is not a blocker. But it is a fail-open gate in an evidence-producing script, and Phase 6 wires this script into hook and CI gates — it should be fixed before anything depends on its verdict. |
| `homeworks/project-baseline/src/main.cpp` | 13 | 108-column line under `editor.rulers: [100]`; 2-space body indent vs `.editorconfig`'s `indent_size = 4` for `*.cpp`; `editor.formatOnSave` true, `[cpp]` = `ms-vscode.cpptools` with `C_Cpp.formatting = clangFormat`, and no `.clang-format` exists | ⚠️ Warning (W-06) | Opening and saving this file was expected to rewrite it and dirty criterion 3's editor half. The owner's UAT session (item 6) recorded the tree clean, so the risk did not materialise — but the underlying configuration tension is unresolved and belongs to Phase 5, where `.clang-format` arrives. |

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
| --------- | ---------- | ------ | ------- | -------- | --------------- | ------- |
| `tools/tests/discover.test.mjs` | REPO-02 | 8 | 0 | No | Value (`deepEqual` on id sets, violation paths, env names) | ADEQUATE |
| `tools/tests/generate-workspace.test.mjs` | REPO-01 | 6 | 0 | **Partially** — the "current file" fixture writes `renderWorkspace(root)` as the file's content, so `--check` exit 0 proves self-consistency there | Value (`deepEqual` on the literal folder array; `match` on the remedy text) | ADEQUATE — the non-circular half is strong: the stale case uses a hand-written literal `{"folders": []}` and asserts exit 1 + both remedy lines, and the real-tree integration check is an external oracle this pass reproduced both ways |
| `tools/tests/ignore-rules.test.mjs` | REPO-04 | 5 | 0 | No | Behavioral — asserts the reported **source** of each ignore verdict against `git ls-files`, plus the index guard | ADEQUATE |
| `tools/tests/sweep.test.mjs` | REPO-02, REPO-03 | 12 | 0 | No | Behavioral — exit status + message text per failure path, each on its own fixture tree | ADEQUATE |
| `tools/tests/helpers.mjs` | — | (helper) | — | — | Builds `os.tmpdir()` fixture trees; writes only fixture inputs, never expected values derived from the system under test | N/A |

**Disabled tests on requirements:** 0 → no BLOCKER. **Circular patterns detected:** 1 partial, in one redundant sub-case → no BLOCKER (the requirement's proof is external and was reproduced). **Insufficient assertions:** 0 → no WARNING. **Coverage quantity:** no requirement specifies a test count.

### Decision Coverage

26 of 26 trackable `01-CONTEXT.md` decisions are honored by shipped artifacts (`gsd_run query check.decision-coverage-verify` → `{ total: 26, honored: 26, not_honored: [] }`, exit 0, `blocking: false`). No decision was translated at plan time and then lost during execution.

### Override Review — does the override still discharge the truth?

The override is carried forward verbatim from the superseded report: same `must_have` text (so the fuzzy match still binds to ROADMAP criterion 2's second conjunct rather than to a nearby truth), same `reason`, and the attribution pair read from git rather than typed.

I re-checked the premise rather than trusting it, because a stale premise would make the override a way of discharging a truth that no longer deserves it:

- **The literal criterion is still unobservable on the committed tree.** `homeworks/project-baseline/platformio.ini` declares no `lib_deps` (`grep -c` → 0), and I rebuilt a copy at `homeworks/project-baseline/deeper/`: exit 0, `[SUCCESS] Took 2.82 seconds`. There is genuinely no build failure to demonstrate.
- **The substitution's justification is still real.** On a fresh fixture with `lib_deps = probelib=symlink://../../shared/lib/probelib`, arm A (exactly one level below `homeworks/`) exits 0 and arm B (one level deeper) exits 1 with PlatformIO's own `PackageException`. The depth boundary is load-bearing; the committed baseline simply lacks the dependency that would exhibit it.
- **The attribution is real.** `bf60cca` is authored by `4oc3p <23013718+4oc3p@users.noreply.github.com>` at `Thu Oct 15 16:13:03 2026 +0300` — matching the entry exactly — and is an ancestor of HEAD.
- **The discharge is bounded.** Phase 3 success criterion 5 (`ROADMAP.md` line 94) is the named retirement trigger and names the exact dependency form that makes the literal mechanism observable.

The override still discharges the truth. It is not a way to skip verification: the deviation stays visible in `ROADMAP.md` beside a byte-identical criterion (hash-asserted), in `PROJECT.md`'s Key Decisions row, and in this report's frontmatter. A2 is therefore `PASSED (override)` and counts toward the score; it is not reported as a gap.

### Note — Phase 1 is declared `mode: mvp` but its goal is not a User Story

`ROADMAP.md` marks the phase `**Mode:** mvp`, but `gsd_run query user-story.validate` on the phase goal returns `{"valid": false}` with all three slot errors (`As a [role]`, `I want to [capability]`, `so that [outcome]`). Phase 1 is infrastructure ("Repository Skeleton and Project Layout"), as are Phases 2–8; the `mvp` marker appears to be the roadmap generator's default rather than a genuine MVP slice. I therefore did **not** apply the MVP-mode narrowing — there is no `[outcome]` clause to verify — and verified against the four ROADMAP success criteria and the PLAN frontmatter instead, exactly as the gap-closure plans assumed. Recorded so the discrepancy stays visible rather than silently absorbed; if the `mvp` marker is meant, this phase needs `/gsd-mvp-phase 01` to restate its goal.

### Note — what invalidated the previous digest, and what it changed

`gsd_run query verification.status` reported the superseded report `stale` because two commits touched its covered inputs after it ran:

- **`da63b0a`** (`tools/tests/ignore-rules.test.mjs`, +26/−6) — relaxed the positive assertion from "the source is the root `.gitignore`" to "the source is an ignore file this repository **tracks** (the root one, or a nested one git holds in its index)". The relaxation is not vacuous: `isRepoOwnedIgnoreSource` rejects absolute paths, `..` segments, a non-`.gitignore` basename, and any nested file git does not track. Read and re-run green.
- **`3b94058`** — added `homeworks/project-baseline/.gitignore` and `homeworks/project-baseline/.vscode/extensions.json`, both PlatformIO-IDE-generated, as **tracked** files. This is the reason the test needed relaxing: the generated project `.gitignore` legitimately owns the build directory inside its own project, and the root rules — anchored by an interior slash — never reached either file. Committing them is what keeps criterion 3 true, since an untracked `.vscode/extensions.json` inside the project would have shown as untracked.

Both changes strengthen the phase's claims. Neither falsifies a must-have. The one honest consequence is W-01 below. This report's `verified:` timestamp and `covered_digest` are recomputed from scratch; neither was carried over.

### Note — the working tree was not byte-clean at verification time

`git status --porcelain` reports exactly one entry, ` M .planning/STATE.md`. I checked the diff: `last_updated`, `last_activity`, `state_head`, `completed_plans` and the Current Position block were rewritten by this GSD workflow (`last_updated` → 2026-10-16T11:33:46.937Z; `state_head` → `4b393ec`, the security-verification commit). It is **not** caused by a build and **not** by an editor session, and `.planning/STATE.md` is not one of the three artifacts criterion 3 names. It is a machine-written, timestamped planning file that GSD commits by design (it is one of the five documents the ignore contract asserts stays tracked), and this verification did not write it. Recorded rather than smoothed over: a reader running `git status` at the moment this report was written would see this one line and should know why. No phase implementation artifact is untracked or modified.

### Human Verification Required

**N/A — the two human-observable conjuncts have been discharged.**

| Conjunct | Where it was deferred | Where it was discharged |
| -------- | --------------------- | ----------------------- |
| Criterion 1's rendered VS Code window (three top-level roots, no unresolved-path marker) | `01-05-SUMMARY.md` §12, Observation 1 — explicitly unfilled output slot | `01-UAT.md` item 5, `result: pass`, `reason: human_judgment` |
| Criterion 3's clean tree after an editor session | `01-05-SUMMARY.md` §12, Observation 2 — explicitly unfilled output slot | `01-UAT.md` item 6, `result: pass`, `reason: human_judgment` |

`01-UAT.md` is `status: complete` — 35 passed, 0 issues, 0 pending, 0 skipped, 0 blocked — and its first commit (`9fd5185`) is titled "record UAT results — both human checks pass", i.e. the owner ran exactly these two deferred observations and recorded them passing. The deferral-to-`/gsd-verify-work` path the plan designed is `workflow.human_verify_mode: end-of-phase`, and it closed.

I did not take the UAT on trust for the parts a command can reach. Independently corroborated this pass:

- The workspace file lists exactly the three roots and **all three paths exist**, so no root can render with an unresolved-path marker, and the file is valid JSON with no `settings` key.
- The ignore configuration now **covers every generated editor artifact** the IDE writes inside a project (root rules plus the tracked nested file), and a full build plus a full sweep leaves porcelain empty (measured). A settled editor session of the same tree therefore has nothing left to dirty it.

The one residual question the UAT does not settle — whether the folder-scoped root `.vscode/settings.json` actually reaches a nested homework, and therefore whether `editor.rulers` / `C_Cpp.formatting` are in effect for `main.cpp` — is recorded as W-06 and belongs to Phase 5, where `.clang-format` arrives and the formatter bindings are validated. It does not gate this phase's goal.

### Gaps Summary

**No gaps.** Nothing in the contract is FAILED: 4 ROADMAP criteria and 53 PLAN-level truths all resolve, one of them (A2) as `PASSED (override)` on an owner decision whose premise and evidence I re-measured rather than inherited. No artifact is MISSING or STUB — 29/29 pass `verify.artifacts` and the behaviour-carrying ones were traced to real data at Level 4. No key link is broken; the single `verified: false` the key-link verb returned is a regex false negative on `.planning/*.lock`, disproved by reading the literal line and by a live `git check-ignore`. No debt marker, no disabled test, no circular test that carries a requirement. No `human_verification` item remains open. No gap is deferred to a later phase, so the `deferred:` list is empty.

Two things a reader should not miss, neither of which blocks the phase:

1. **W-01 — one piece of recorded evidence has been superseded.** P02-2's stated resolution of `.pio/build` to the *root* `.gitignore` is no longer what git reports in the live tree; `3b94058` added a tracked nested `homeworks/project-baseline/.gitignore` that takes precedence. The substantive claim (unanchored patterns cover the build directory at any depth, without a `**/` prefix) was re-proved independently in a throwaway repository, and the nested file is tracked so a clone inherits it — so REPO-04 and criterion 3 still hold. The plan's wording, not the requirement, is what has drifted.
2. **W-02 — CR-01 is still live.** `tools/generate-workspace.mjs --check` exits 0 without checking when its own path carries a symlink (reproduced: a deliberately staled file, a symlinked script path, exit 0). It does not falsify a must-have and does not touch the phase goal, so it is not a blocker here — but it is a fail-open gate, and Phase 6 wires this script into hook and CI gates. It should be fixed before anything depends on its verdict.

---

_Verified: 2026-10-16T11:45:45Z_
_Verifier: Claude (gsd-verifier)_
