---
phase: 01-repository-skeleton-and-project-layout
verified: 2026-10-15T15:06:36Z
status: human_needed
score: 32/34 must-haves verified
covered_files: [".editorconfig", ".gitattributes", ".gitignore", ".planning/phases/01-repository-skeleton-and-project-layout/01-01-PLAN.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-01-SUMMARY.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-02-PLAN.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-02-SUMMARY.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-03-PLAN.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-03-SUMMARY.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-04-PLAN.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-04-SUMMARY.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-05-PLAN.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-05-SUMMARY.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-06-PLAN.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-06-SUMMARY.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-07-PLAN.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-07-SUMMARY.md", ".vscode/extensions.json", ".vscode/settings.json", "AGENTS.md", "README.md", "homework.code-workspace", "homeworks/project-baseline/README.md", "homeworks/project-baseline/platformio.ini", "homeworks/project-baseline/src/main.cpp", "shared/lib/README.md", "tools/generate-workspace.mjs", "tools/lib/discover.mjs", "tools/sweep-homeworks.mjs", "tools/tests/discover.test.mjs", "tools/tests/generate-workspace.test.mjs", "tools/tests/helpers.mjs", "tools/tests/ignore-rules.test.mjs", "tools/tests/sweep.test.mjs"]
covered_digest: "v3:sha256:ad2bcef30f5d73261f2d571f8c00c186947060fd7108debd89b6b3bbdea26f91"
behavior_unverified: 0
overrides_applied: 1
overrides:
  - must_have: "ROADMAP success criterion 2, second conjunct: moving a homework one level deeper breaks the build, which is what proves the depth rule is load-bearing."
    reason: "Owner-accepted deviation, decided 2026-10-15. The literal criterion is unobservable in Phase 1: homeworks/project-baseline/platformio.ini declares no lib_deps, so nothing resolves relative to the project directory and nothing fails to resolve — a copy of the baseline at homeworks/project-baseline/deeper/ builds successfully (measured, exit 0). The sanctioned discharge is the sweep's named-rule detector, which names the rule (DEPTH RULE VIOLATED, exit 1) before any child process exists; the sweep carries two named-rule detectors and only the depth one stands in for the build failure. The evidence is plan 01-06's two-arm measurement on a throwaway fixture: with lib_deps = probelib=symlink://../../shared/lib/probelib declared, the project at exactly one level below homeworks/ builds (arm A, exit 0) and the same project one level deeper fails to resolve (arm B, exit 1, PackageException: Can not create a symbolic link for ../../shared/lib/probelib, not a directory). Plan 01-07 records a Phase 3 success criterion under which the literal mechanism becomes observable on the committed tree once a homework declares a symlinked shared-library dependency, retiring the substitute."
    accepted_by: "4oc3p"
    accepted_at: "2026-10-15T16:13:03+03:00"
re_verification:
  previous_status: gaps_found
  previous_score: 31/34
  gaps_closed:
    - "Gap 1 — ROADMAP success criterion 2, second conjunct (the depth rule's build-failure half). Discharged by the owner-accepted override recorded in `.planning/ROADMAP.md` (dated 2026-10-15, decision commit `bf60cca`), in `.planning/PROJECT.md`'s Key Decisions and in this report's `overrides:` entry. Carried forward, not re-opened; the underlying substitution is unchanged and the literal mechanism is deferred to Phase 3 success criterion 5. Still not VERIFIED as written — no longer counted as a failure."
    - "Gap 2 — the un-ignored GSD lock file (`.planning/milestone.lock`) that made `git status --porcelain` non-empty. CLOSED BY RULE: `.gitignore:96` now carries `.planning/*.lock`; `git check-ignore -v .planning/milestone.lock` → `.gitignore:96:.planning/*.lock`; `git status --porcelain` prints nothing on a built tree."
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Criterion 1's manual half — open the committed `homework.code-workspace` in VS Code via File → Open Workspace from File… (the workspace file, not the folder) and read the Explorer's top-level root names."
    expected: "Exactly three top-level roots named `root`, `shared` and `project-baseline`; no unresolved-path marker on `shared`; no stale-workspace warning. While the window is open, also confirm whether `editor.rulers = 100` and `C_Cpp.formatting = clangFormat` are in effect for `homeworks/project-baseline/src/main.cpp` (open question: the root `.vscode/settings.json` is folder-scoped and every homework is nested inside the `root` folder)."
    why_human: "No agent can observe what a VS Code window renders, and there is no deterministic predicate for 'the editor loaded the workspace'. The phase deliberately recorded this with an explicitly unfilled output slot in 01-05-SUMMARY.md §12 — that empty slot is the correct artifact, not a gap in the work."
  - test: "Criterion 3's editor half — in that same workspace session, open and save one tracked file in each of the three roots (a file under `.planning/`, a file under `shared/`, one baseline project file), let the editor settle, then run `git status --porcelain` from the repository root BEFORE writing the result into any tracked file."
    expected: "No output. In particular, no modification to `homeworks/project-baseline/src/main.cpp`."
    why_human: "A human editor session is not automatable, and the reading must be taken before the observation is written down (the log is itself a tracked file). Raised in severity by a live review finding: `editor.formatOnSave` is true, `[cpp]` uses `ms-vscode.cpptools` with `C_Cpp.formatting = clangFormat`, no `.clang-format` exists in the repository, and `main.cpp` line 13 is 108 columns with a 2-space body indent while `.editorconfig` declares `indent_size = 4` for `*.cpp`. Saving that file is therefore expected to rewrite it and make `git status` dirty. If the observation fails, record exactly what changed rather than re-saving until it looks clean."
---

# Phase 1: Repository Skeleton and Project Layout Verification Report

**Phase Goal:** The repository is one VS Code workspace holding the root, the shared-library tree and one folder per homework, with the folder names and the one-level depth rule frozen before any mechanism is built on them.
**Verified:** 2026-10-15T15:06:36Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (previous report: `gaps_found`, 31/34, two `failed` gaps)

## Goal Achievement

The phase goal is achieved. The tree is frozen and the mechanisms built on it work: `homework.code-workspace` is a genuine pure function of the filesystem and its drift check fires on a hand edit; the baseline builds from the repository root with exactly one command and reports the 16 MB N16R8 partition; one discovery rule drives the generator, the sweep and (later) the CI matrix; the depth rule is enforced by name before any child process exists; a zero-match sweep refuses to report success. Every artifact is substantive, wired and carrying real data, and the 32-case suite passes.

The verdict is `human_needed`, not `passed`, because two of the four ROADMAP success criteria each contain one conjunct that is only observable in a human editor session, and this report lists both. It is not `gaps_found`: the two gaps the previous pass filed are both resolved — gap 1 by the owner-accepted override, gap 2 by an ignore rule — and no truth is FAILED, no artifact is MISSING or STUB, and no key link is broken.

### Observable Truths — ROADMAP Success Criteria (the contract)

| # | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| A1 | Criterion 1: opening the committed workspace file in VS Code shows the repo root, `shared/` and every homework as top-level roots | ? UNCERTAIN (human) | Automated half re-verified: `node tools/generate-workspace.mjs --check` → `homework.code-workspace is up to date`, exit 0; the file's `folders` array is exactly `root` (`.`), `shared` (`shared`), `project-baseline` (`homeworks/project-baseline`). What VS Code renders is unobservable by an agent and is carried in Human Verification. Not counted toward the score. |
| A2 | Criterion 2: a project at `homeworks/<id>/` builds from the root with exactly one command, AND moving it one level deeper breaks the build | PASSED (override) | First conjunct re-measured: `pio run -d homeworks/project-baseline` → exit 0, `[SUCCESS] Took 0.69 seconds`, `Flash: used 268177 bytes from 6553600 bytes` (the 16 MB table). Second conjunct is **deliberately not met** and independently reconfirmed: I copied the environment to `homeworks/project-baseline/deeper/` and built it — exit 0, `[SUCCESS] Took 2.87 seconds`. Override: owner-accepted deviation, `bf60cca`, accepted by 4oc3p on 2026-10-15; see `overrides:` above and the Override Review below. |
| A3 | Criterion 3: `git status` stays clean across a full build and an editor session — `.pio/`, `compile_commands.json` and generated editor state never appear as untracked or modified | ? UNCERTAIN (build half VERIFIED, editor half human) | Build half now holds: after `pio run -d homeworks/project-baseline`, a full sweep run and a `compiledb`-equivalent build, `git status --porcelain` prints nothing. The criterion's three named artifacts resolve to the repository's own `.gitignore` — `.gitignore:16:.pio/` and `.gitignore:20:compile_commands.json` — and appear only under `--ignored`. The editor-session conjunct is not agent-observable and is carried in Human Verification. Not counted toward the score. |
| A4 | Criterion 4: a repo-wide sweep in a tree matching zero homework projects exits non-zero with a readable message instead of reporting success | ✓ VERIFIED | Against an empty fixture root: `sweep: found ZERO homework projects under homeworks/*/platformio.ini` / `A gate that built nothing must not exit 0.` / `Pass --allow-empty only if an empty tree is genuinely expected.` — exit 1. `--allow-empty` remains the single named escape hatch and must be asked for. |

**Score:** 2/4 roadmap criteria counted (A2 override, A4 verified); A1 and A3 each blocked on one human-observable conjunct.

### Observable Truths — PLAN frontmatter must-haves (inherited contract, re-verified)

The previous report established this 34-item contract; re-verification reuses it verbatim rather than re-deriving it. Items the previous pass marked VERIFIED were given a regression check, not a full re-derivation.

| # | Truth | Status | Evidence (re-verification) |
| --- | ----- | ------ | -------------------------- |
| B1 | (01-01) The workspace file names `shared` and every discovered homework id, sorted; regenerating an unchanged tree is byte-identical | ✓ VERIFIED | `--check` exit 0; `git status --porcelain` clean after regeneration; renderer is a pure export. |
| B2 | (01-01) `--check` exits 0 on a current file and 1 naming the file and the remedy on a hand-edited one | ✓ VERIFIED | Direct invocation: exit 0 when current; after appending one byte, exit 1 with `... is STALE.` + `must never be hand-edited.` + `Run: node tools/generate-workspace.mjs`. Boundary noted under CR-01 below (the guard fails open when the script path itself is symlinked); the documented invocation is correct. |
| B3 | (01-01) A directory under `homeworks/` is a homework iff its name matches the frozen grammar and it contains a `platformio.ini`; one rule serves generator, sweep and future CI | ✓ VERIFIED | `tools/lib/discover.mjs` is the only definition; `grep -cE 'readdirSync\|ID_PATTERN\s*=' tools/sweep-homeworks.mjs` → 0; the sweep imports `{ discoverHomeworks, ID_PATTERN_TEXT }`. |
| B4 | (01-01) No `upload_port` or `monitor_port` is committed for the baseline | ✓ VERIFIED | `grep -rn 'upload_port\|monitor_port' homeworks/` → no match. |
| B5 | (01-01) `shared/lib/` exists as a git-tracked directory because it contains a README.md | ✓ VERIFIED | `git ls-files shared` → `shared/lib/README.md`. |
| B6 | (01-02) `git status --porcelain` reports no untracked entry for `.DS_Store`, `.planning/research/.cache/` and `.planning/state.json` | ✓ VERIFIED | All three resolve to the repository's own `.gitignore`; `git status --porcelain` reports none. |
| B7 | (01-02) Build output is ignored at any depth without an extra prefix | ✓ VERIFIED | `git check-ignore -v homeworks/project-baseline/.pio/` → `.gitignore:16:.pio/`; `.../compile_commands.json` → `.gitignore:20:compile_commands.json`. |
| B8 | (01-02) No gitignore pattern carries an inline comment that would silently disable it | ✓ VERIFIED | `grep -cE '^[^#][^#]*#' .gitignore` → 0; the new lock rule is preceded by comment lines, not suffixed. |
| B9 | (01-02) `sdkconfig.*` is negated for the hand-authored `sdkconfig.defaults` | ✓ VERIFIED | `git check-ignore -q sdkconfig.defaults` → exit 1. |
| B10 | (01-02) `.claude/settings.local.json` is ignored by the repository, not only by this machine's global excludes | ✓ VERIFIED | `git check-ignore -q .claude/settings.local.json` → exit 0. |
| B11 | (01-02) The agent-state rules never match the whole `.claude` directory, so Phase 7 skill mirrors stay trackable | ✓ VERIFIED | `git check-ignore -q .claude/skills/new-homework/SKILL.md` → exit 1. |
| B12 | (01-02) `.editorconfig` uses only the nine properties the EditorConfig specification defines | ✓ VERIFIED | Read: `root`, `charset`, `end_of_line`, `insert_final_newline`, `trim_trailing_whitespace`, `indent_style`, `indent_size` only. |
| B13 | (01-02) `.gitattributes` normalises text to LF in the index while `.editorconfig` governs the editor | ✓ VERIFIED | `git check-attr text eol -- README.md` → `text: set`, `eol: lf`. |
| B14 | (01-02) A generated vector image is treated as text by git | ✓ VERIFIED | `git check-attr text -- docs/wiring.svg` → `text: set`. |
| B15 | (01-02) Editor settings live only in `.vscode/settings.json`; only the one measured PlatformIO IDE key is present | ✓ VERIFIED | `homework.code-workspace` has no `settings` key (`grep -c '"settings"'` → 0); `.vscode/settings.json:25` carries exactly one `platformio-ide.*` key; no `files.exclude`. |
| B16 | (01-03) The plural library-folder path no longer appears anywhere in `AGENTS.md` | ✓ VERIFIED | `grep -c 'shared/libs' AGENTS.md` → 0; `grep -c 'shared/lib/' AGENTS.md` → 2. |
| B17 | (01-03) `AGENTS.md` contains nothing but the two path-segment corrections | ✓ VERIFIED | Two-hunk diff, one single-token substitution each; file unchanged since. |
| B18 | (01-03) The path segment appearing only inside prose about the rejected global-library directive is left untouched | ✓ VERIFIED | Same diff: the `lib_extra_dirs`/`globallib_dir` row keeps its prose, changes only the `symlink://` path segment. |
| B19 | (01-03) `.planning/PROJECT.md` names the same library folder as `REQUIREMENTS.md` | ✓ VERIFIED | `grep -c 'shared/lib/' .planning/PROJECT.md` → 3; no `shared/libs`. |
| B20 | (01-03) `.planning/PROJECT.md` gains a Traps section every later phase's prior-context load will read | ✓ VERIFIED | `grep -c '^## Traps for Later Phases$' .planning/PROJECT.md` → 1. |
| B21 | (01-03) The root README names the generated workspace file and says how to open it | ✓ VERIFIED | `grep -c 'homework.code-workspace' README.md` → 4. |
| B22 | (01-03) The root README states the one-command build, where the conventions live, and what counts as a homework | ✓ VERIFIED | README carries `pio run -d homeworks/<id>`, the `## Conventions` pointer to `AGENTS.md`, and the `## What counts as a homework` definition. |
| B23 | (01-03) The root README documents no directory, file or command that does not exist in the tree it ships with | ✓ VERIFIED | Every path in the structure block exists; no `.clang-format`, `.clang-tidy`, `scripts/`, `docs/` or `.agents/` claim. |
| B24 | (01-04) A `platformio.ini` one level below a homework folder makes the sweep exit non-zero naming the RULE | ✓ VERIFIED | Fixture with `homeworks/m01-l03-blink/deeper/platformio.ini` → `DEPTH RULE VIOLATED` + one-level requirement + two-line reason + `  deeper platformio.ini found: homeworks/m01-l03-blink/deeper`, exit 1. |
| B25 | (01-04) A homework folder whose name fails the frozen grammar makes the sweep exit non-zero and print the expected pattern | ✓ VERIFIED | Fixture `homeworks/badName/` → `MALFORMED HOMEWORK ID` / `Expected: ^(?:m[0-9]{2}-l[0-9]{2}\|project)-[a-z0-9]+(?:-[a-z0-9]+)*$` / `  does not match: homeworks/badName/`, exit 1. |
| B26 | (01-04) Both policy failures fire before any build is attempted | ✓ VERIFIED | Control flow: the depth and grammar branches exit 1 before `resolvePio()` and before any `spawnSync` build. |
| B27 | (01-04) The sweep builds every discovered project from the repository root and accumulates failures rather than stopping at the first | ✓ VERIFIED | `node tools/sweep-homeworks.mjs` → discovered `project-baseline`, built from the root, reported the 16 MB partition, exit 0. |
| B28 | (01-04) An absent or unresolvable PlatformIO binary produces an actionable message, distinguishable from a project's build failure | ✓ VERIFIED | Covered by the suite's `an unstartable PlatformIO binary exits 1 with a spawn failure, not a build failure` (green). |
| B29 | (01-04) Discovery and validation are delegated to the one shared module rather than re-implemented | ✓ VERIFIED | `tools/sweep-homeworks.mjs:35` imports the shared module; no second discovery implementation (count 0). |
| B30 | (01-05) The exact `git status` output observed before, during and after the acceptance run is recorded in the phase log | ✓ VERIFIED | `01-05-SUMMARY.md` §2/§3/§8/§11 carry verbatim output; 01-06's second reading and today's empty reading agree. |

**Score:** 30/30 plan-level truths re-verified by regression check.

### Gap-Closure Truths (delivered by this round, all verified)

These 13 truths belong to plans 01-06 and 01-07, which post-date the previous report and are therefore outside its 34-item contract. They are reported here rather than folded into the headline score so the re-verification delta stays legible. Every one is verified.

| # | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| G1 | (01-06) `.planning/milestone.lock` no longer appears in `git status --porcelain`; every GSD lock file under the planning directory is closed by the repository's own ignore file | ✓ VERIFIED | `git status --porcelain` → empty on a built tree; `git check-ignore -v .planning/milestone.lock` → `.gitignore:96:.planning/*.lock`. |
| G2 | (01-06) The closing rule is a lock-file glob narrow enough to reach only lock files, and no currently-tracked path under the planning directory becomes ignored | ✓ VERIFIED | `.gitignore:96` is `.planning/*.lock`; the suite's `git ls-files -i -c --exclude-standard` guard (a tracked path that became ignored) is green, and the five tracked planning documents are asserted still tracked. |
| G3 | (01-06) The rule is the repository's own, not this machine's global excludes | ✓ VERIFIED | `git check-ignore -v` names `.gitignore` as the source; `git config --get core.excludesFile` is unset here, and the source assertion is what makes that irrelevant. |
| G4 | (01-06) A regression gate covers the class: `tools/tests/ignore-rules.test.mjs` asserts both directions, so dropping the lock line or a previously asserted rule turns the suite red | ✓ VERIFIED | The file exists (180 lines, 5 tests) and all 5 are green; it asserts the reported ignore **source**, not a pattern's shape. |
| G5 | (01-06) The depth rule's build behaviour with a real symlinked `lib_deps` is MEASURED on a two-arm fixture outside the repository, both arms recorded verbatim | ✓ VERIFIED | Independently reproduced by this pass on a fresh fixture under `os.tmpdir()`: arm A (exactly one level below `homeworks/`) → exit 0, `[SUCCESS] Took 2.72 seconds`; arm B (same project one level deeper) → exit 1, `PackageException: Can not create a symbolic link for ../../shared/lib/probelib, not a directory`. |
| G6 | (01-06) The measurement leaves no residue; the tree is unchanged by it | ✓ VERIFIED | No directory matching the frozen grammar exists under `homeworks/` other than `project-baseline`; the fixture was removed; `git status --porcelain` was clean immediately after (the only modification I ever observed was a concurrent external writer's, described below — not this measurement). |
| G7 | (01-06) Both clean-tree readings the plan asserts are empty | ✓ VERIFIED | The readings are recorded verbatim in `01-06-SUMMARY.md`; today's independent reading on the built tree is also empty. |
| G8 | (01-07) The owner's decision on criterion 2's second conjunct is recorded in `ROADMAP.md` as a dated, deliberate deviation carrying both the reason and the Phase 3 trigger | ✓ VERIFIED | `ROADMAP.md` lines 44–47: the `> **Verification discharge (criterion 2, second conjunct):**` blockquote, dated 2026-10-15, naming `bf60cca`, the reason, the measured evidence and the Phase 3 trigger. |
| G9 | (01-07) `ROADMAP.md` Phase 1 criterion 2's wording is unchanged; the discharge is an appended note beside it | ✓ VERIFIED | The sentence `moving it one level deeper breaks the build` is present in **every** revision of `ROADMAP.md` in the repository's history (11/11 commits that touched the file); the note is a blockquote after the criteria list, not a rewrite. |
| G10 | (01-07) The verification record carries exactly one override entry, attributed to the identity the owner's decision commit is authored under and timestamped from that commit | ✓ VERIFIED | `git show af84762` adds exactly one `overrides:` entry and `overrides_applied: 0 → 1`. `accepted_by: "4oc3p"` / `accepted_at: "2026-10-15T16:13:03+03:00"` match `git show -s bf60cca` (`4oc3p <23013718+4oc3p@users.noreply.github.com>`, Thu Oct 15 16:13:03 2026 +0300) exactly. `bf60cca` is an ancestor of HEAD. |
| G11 | (01-07) ROADMAP Phase 3 carries an additional numbered success criterion making the depth rule's build-failure half observable on the committed tree | ✓ VERIFIED | `ROADMAP.md` Phase 3 success criterion 5 (line 94) states the `lib_deps = <name>=symlink://../../shared/lib/<name>` trigger and the one command that settles it. |
| G12 | (01-07) The tree still builds and stays clean after the recording | ✓ VERIFIED | `pio run -d homeworks/project-baseline` → exit 0 reporting `6553600` bytes; `--check` → exit 0; `--list` → `project-baseline`, exit 0; suite 32/32 green; `git status --porcelain` empty throughout (modulo the concurrent writer noted below). |
| G13 | (01-07) The owner's stated reason is either confirmed by the measurement or contradicted in the record | ✓ VERIFIED | `01-07-SUMMARY.md` §6 states the confirmation explicitly and records the one nuance (the fixture demonstrates what happens **once** a symlinked dependency exists; it does not make one exist on the committed tree) rather than smoothing it over. My independent reproduction agrees with both. |

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `tools/lib/discover.mjs` | Single discovery source: `HOMEWORKS_DIR`, `ID_PATTERN`, `ID_PATTERN_TEXT`, `discoverHomeworks`, `findDepthViolations`, `envNames` | ✓ VERIFIED | All six exported; `node:fs`/`node:path` only; unchanged since the prior pass. |
| `tools/generate-workspace.mjs` | Pure renderer plus byte-comparison drift check | ✓ VERIFIED | `renderWorkspace(repoRoot)` is a pure export; both `--check` outcomes reproduced. Entry-point guard boundary under CR-01. |
| `homework.code-workspace` | Generated multi-root workspace containing `homeworks/project-baseline` | ✓ VERIFIED | Exactly the three expected folders; pure folder list; regenerates byte-identically. |
| `homeworks/project-baseline/platformio.ini` | Pinned, N16R8-overridden build environment | ✓ VERIFIED | `platform = espressif32@7.1.3` (exact), the four overrides, `monitor_speed = 115200`, no console-port key, no `lib_deps` (`grep -c` → 0 — the fact the override rests on). |
| `homeworks/project-baseline/src/main.cpp` | Serial report of flash size, `psramFound()` and PSRAM size; touches no GPIO | ✓ VERIFIED | `Serial.begin(115200)` + one `printf` reading `ESP.getFlashChipSize()`, `psramFound()`, `ESP.getPsramSize()`; GPIO-call grep → 0. |
| `tools/sweep-homeworks.mjs` | Repo-wide gate with loud zero-match failure and named-rule depth detection | ✓ VERIFIED | Contains `DEPTH RULE VIOLATED`; argv array, no shell; unchanged since the prior pass. |
| `tools/tests/ignore-rules.test.mjs` | The ignore contract asserted against git itself, both directions | ✓ VERIFIED | 180 lines, 5 tests, all green; read-only by construction. |
| `.gitignore` | Single deliberate ignore file; the GSD lock class now closed by rule | ✓ VERIFIED (gap 2 closed) | `.gitignore:96` `.planning/*.lock` with a documented rationale at lines 91–94; `git status --porcelain` empty. |
| `.editorconfig`, `.gitattributes`, `.vscode/settings.json`, `.vscode/extensions.json` | The text-layer contract and editor settings | ✓ VERIFIED | Each parses and each rule resolves; the `.code-workspace` indent mismatch (WR-04) and the `[cpp]` format-on-save risk (WR-06) are carried below. |
| `tools/tests/{discover,generate-workspace,sweep}.test.mjs`, `tools/tests/helpers.mjs` | Unit and integration coverage | ✓ VERIFIED | Unchanged since the prior pass; all green within the 32-test run. |
| `shared/lib/README.md`, `homeworks/project-baseline/README.md` | Make `shared/lib` trackable; declare the baseline not a course homework | ✓ VERIFIED | Tracked; baseline README's first line carries the disclaimer. |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `tools/generate-workspace.mjs` | `tools/lib/discover.mjs` | imports `discoverHomeworks` | WIRED | Single discovery source; second-implementation grep → 0. |
| `tools/lib/discover.mjs` | `homework.code-workspace` | `renderWorkspace` turns discovered ids into `folders`; `--check` compares bytes | WIRED | Drift check exits 0 on the committed file; hand-edit makes it exit 1. |
| `homeworks/project-baseline/platformio.ini` | `homeworks/project-baseline/src/main.cpp` | the env's `src/` tree builds; `monitor_speed` matches `Serial.begin()` | WIRED | `monitor_speed = 115200` (ini:23); `Serial.begin(115200)` (main.cpp:12). |
| `tools/sweep-homeworks.mjs` | `tools/lib/discover.mjs` | imports `discoverHomeworks` and the printable id pattern | WIRED | Confirmed by import and by the exported banner text. |
| `tools/sweep-homeworks.mjs` | `homeworks/project-baseline` | spawns the build verb with a project-directory argument and no shell | WIRED | Live run built the baseline from the repository root, exit 0. |
| `tools/tests/ignore-rules.test.mjs` | `.gitignore` | `git check-ignore -v` source assertion, per path | WIRED | Green; asserts `.gitignore` is the reported source, so a machine-local excludes file cannot make it pass vacuously. |
| `.gitignore` | `.planning/milestone.lock` | `.planning/*.lock` | WIRED | Resolves to `.gitignore:96`; the tree is clean. |
| `.vscode/settings.json` | `.editorconfig` | one owner per rule | WIRED, one exception | The `files.*` mirror agrees, but `editor.tabSize = 4` vs the generator's 2-space `.code-workspace` output is WR-04. |
| `homework.code-workspace` | `homeworks/` | the committed file is what a reader opens; the drift check proves it still matches | WIRED | `--check` exit 0; the three roots match the tree. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `homework.code-workspace` | `folders[]` | `discoverHomeworks(REPO_ROOT).found` — a real `readdirSync` over `homeworks/` | Yes | ✓ FLOWING |
| `tools/generate-workspace.mjs --check` | `expected` | `renderWorkspace()` over the live tree, compared byte-for-byte with the file on disk | Yes | ✓ FLOWING |
| `tools/sweep-homeworks.mjs` | `found` | `discoverHomeworks(root)` over the real tree, then a real `spawnSync` build | Yes | ✓ FLOWING |
| `homeworks/project-baseline/src/main.cpp` | flash/PSRAM values | `ESP.getFlashChipSize()`, `psramFound()`, `ESP.getPsramSize()` — runtime measurement, no literal | Yes (on hardware) | ✓ FLOWING (compile-time verified; the runtime report is Phase 2's on-board acceptance) |

No hard-coded literal, static fallback or mock terminates any of these chains.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Workspace drift check passes | `node tools/generate-workspace.mjs --check` | `homework.code-workspace is up to date`, exit 0 | ✓ PASS |
| Drift check fires on a hand edit | append one byte, then `--check` | `... is STALE.` + remedy, exit 1; file restored | ✓ PASS |
| One-command build from the repo root | `pio run -d homeworks/project-baseline` | exit 0, `[SUCCESS] Took 0.69 seconds`, `6553600` bytes | ✓ PASS |
| Criterion 2 half (b): a deeper project breaks the build | `pio run -d homeworks/project-baseline/deeper` (fixture copy) | exit 0, `[SUCCESS] Took 2.87 seconds` | ✗ NOT MET — the criterion's literal mechanism is absent; **discharged by the accepted override** |
| Two-arm symlinked-dependency measurement (G5) | arm A / arm B on a fresh `os.tmpdir()` fixture | arm A exit 0 `[SUCCESS] Took 2.72 seconds`; arm B exit 1 `PackageException: Can not create a symbolic link for ../../shared/lib/probelib, not a directory` | ✓ PASS (the boundary is real) |
| Sweep lists validated ids | `node tools/sweep-homeworks.mjs --list` | `project-baseline`, exit 0 | ✓ PASS |
| Criterion 4: zero matches fails loudly | `node tools/sweep-homeworks.mjs --root <empty fixture>` | three-line message, exit 1 | ✓ PASS |
| Escape hatch is opt-in | `--root <empty fixture> --allow-empty` | exit 0, one line | ✓ PASS |
| Depth rule names the rule, before any build | fixture with `homeworks/m01-l03-blink/deeper/platformio.ini` | `DEPTH RULE VIOLATED` + path, exit 1 | ✓ PASS |
| Malformed id names the grammar | fixture with `homeworks/badName/` | `MALFORMED HOMEWORK ID` + expected pattern, exit 1 | ✓ PASS |
| Criterion 3: tree clean after builds | `git status --porcelain` after `pio run` runs | empty | ✓ PASS |
| Test suite | `FORCE_COLOR=0 node --test "tools/**/*.test.mjs"` | tests 32, pass 32, fail 0, skipped 0, todo 0 | ✓ PASS |

### Probe Execution

No probe scripts (`scripts/*/tests/probe-*.sh`) are declared or implied by this phase, and none exist in the tree. Step 7c is not applicable.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| REPO-01 | 01-01, 01-03, 01-05, 01-06, 01-07 | The repository opens as ONE VS Code workspace listing the repo root, `shared/`, and one folder per homework | ✓ SATISFIED (automated half) / ? NEEDS HUMAN (rendered window) | `homework.code-workspace` lists exactly `root`, `shared`, `project-baseline`; `--check` exit 0; README documents how to open it. What VS Code renders is carried in Human Verification. |
| REPO-02 | 01-01, 01-03, 01-04, 01-05, 01-06, 01-07 | Each homework lives at `homeworks/<module>-<lesson>-<slug>/` and is buildable from the root with `pio run -d homeworks/<id>` | ✓ SATISFIED | Build exits 0 from the root reporting the 16 MB partition; `--list` prints `project-baseline`; the grammar is frozen in `discover.mjs`. |
| REPO-03 | 01-03, 01-04, 01-05, 01-06, 01-07 | Every homework sits exactly one directory level below `homeworks/`, because every shared-library path in `lib_deps` is relative to the project | ⚠️ PARTIAL — enforced by name; the build-failure half is a **recorded, owner-accepted deviation** | The rule fires by name before any build (`DEPTH RULE VIOLATED`, exit 1) and is documented in the README, `PROJECT.md` and the ROADMAP discharge note. The complementary observable is measured on a fixture (G5) but absent from the committed tree, which declares no `lib_deps`. Retired by Phase 3 success criterion 5. |
| REPO-04 | 01-02, 01-05, 01-06 | Machine-generated and machine-local artifacts (`.pio/`, `compile_commands.json`) are gitignored, never committed | ✓ SATISFIED (now including the fourth artifact) | `.pio/` → `.gitignore:16`, `compile_commands.json` → `.gitignore:20`, and the previously un-named `.planning/milestone.lock` → `.gitignore:96`. `git status --porcelain` is empty. |

No orphaned requirements: `REQUIREMENTS.md` maps exactly REPO-01..04 to Phase 1, all four appear in the `requirements:` field of at least one plan (01-01: REPO-01, REPO-02; 01-02: REPO-04; 01-03: REPO-01..03; 01-04: REPO-02, REPO-03; 01-05: REPO-01..04; 01-06: REPO-01..04; 01-07: REPO-01..04), and none is claimed by a plan outside this phase. `REQUIREMENTS.md`'s traceability table still reads `Gaps Found` for all four rows — that column is the *phase* status and this report supersedes it; the same document's per-requirement rows are correctly scoped.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | `TBD` / `FIXME` / `XXX` in any phase-modified file | none | Scanned `.gitignore`, `tools/tests/ignore-rules.test.mjs`, `tools/generate-workspace.mjs`, `tools/lib/discover.mjs`, `tools/sweep-homeworks.mjs`, `homeworks/project-baseline/src/main.cpp`, `homeworks/project-baseline/platformio.ini` → zero matches. No debt-marker BLOCKER. |
| — | — | `TODO` / `HACK` / `PLACEHOLDER` / `not yet implemented` / `coming soon` under phase-modified files | none | Zero matches. |
| `homeworks/project-baseline/src/main.cpp` | 13 | 108-column line under `editor.rulers: [100]`, 2-space body indent vs `.editorconfig`'s `indent_size = 4` for `*.cpp` | ⚠️ Warning | `editor.formatOnSave` is true, `[cpp]` uses `ms-vscode.cpptools` with `C_Cpp.formatting = clangFormat`, and no `.clang-format` exists — so opening and saving this file is expected to rewrite it, directly threatening criterion 3's deferred editor observation. Carried into Human Verification. |
| `.editorconfig` | 22 | `[*.{json,jsonc,yml,yaml,ini,cfg,properties}]` does not match `.code-workspace`, so `homework.code-workspace` inherits `[*] indent_size = 4` while the generator emits 2 spaces | ⚠️ Warning | A single format-on-save of the generated file turns a correct tree into a reported STALE. Does not affect the file as committed. |

### Carried Code-Review Findings — none falsifies a must-have

`01-REVIEW.md` and `01-REVIEW-DISPOSITION.md` record the phase's code-review findings, all `open` (an untriaged state, not an oversight). I re-read the critical one and reproduced it; I did not treat the findings as must-have evidence either way.

- **CR-01 (critical) — the entry-point guard fails open.** Reproduced independently: `node <symlink-to-generate-workspace.mjs> --check` prints nothing, and with `homework.code-workspace` deliberately staled it still exits **0**, where the direct invocation prints `homework.code-workspace is STALE.` and exits **1**. The guard compares `import.meta.url` against `pathToFileURL(process.argv[1])`, which differ whenever the script path carries a symlink. **My judgment: it does not falsify a must-have.** B2's two documented outcomes are correct under the invocation the README prescribes (I ran it both ways), the renderer `renderWorkspace` is a real pure export with data flowing, and no truth, artifact or key link is affected. It is not a Step 7 anti-pattern (no debt marker, stub, hollow prop, empty implementation or console-log-only body), so the convergence-evidence gate does not promote it to a blocker, and the flagged file was **not** modified since the prior verification (`git log --since=<prior verified> -- tools/generate-workspace.mjs` is empty), so it is neither a regression nor a carried-forward gap. **It is nonetheless a real defect in an evidence-producing gate and should be fixed before Phase 6 wires this script into a hook**: a gate that reports success without checking is exactly the failure the phase's own README warns about.
- **WR-01, WR-03, WR-04, WR-06, WR-09, IN-01..IN-07, WR-02, WR-05, WR-07, WR-08.** WR-09 is the review's own id for gap 2 and is now **closed by the ignore rule** — the disposition row still reads `open`, which understates the tree's current state. WR-01 (the depth walk sees `.pio/libdeps/**/examples/*/platformio.ini`) and WR-03 (the generator silently drops an ungrammatical folder) are latent: neither condition exists in the shipped tree, and I confirmed `find homeworks -name platformio.ini` returns only the project's own file. WR-02/WR-05/WR-07/WR-08 concern the Phase 6 consumer contract, test hygiene and documentation completeness. WR-04 and WR-06 bear on criterion 1's and criterion 3's deferred human halves and are carried above. **WARNING / INFO; none touches the phase goal.**
- No security finding is warranted: no secrets, no network access, and the sweep passes an argv array to `spawnSync` with no shell.

### Advisory (New Scope, Unevidenced)

None. Every finding raised in this re-verification pass either matches a carried-forward gap, sits on a file modified since the prior pass, or was reproduced with a deterministic command — there is nothing new-scope and unevidenced to record.

### Note — Phase 1 is declared `mode: mvp` but its goal is not a User Story

`ROADMAP.md` marks the phase `**Mode:** mvp`, but the phase goal is not a user story: `gsd-tools query user-story.validate` returns `{"valid": false}` with all three slot errors (`As a [role]`, `I want to [capability]`, `so that [outcome]`). Phase 1 is infrastructure ("Repository Skeleton and Project Layout"), and so are Phases 2–8; the `mvp` marker appears to be the roadmap generator's default rather than a genuine MVP slice. I therefore did **not** apply the MVP-mode narrowing (there is no `[outcome]` clause to verify) and verified against the four ROADMAP success criteria, exactly as the prior pass did and as the gap-closure plans assumed. Recorded so the discrepancy is visible rather than silently absorbed; if the `mvp` marker is meant, this phase would need `/gsd-mvp-phase 01` to restate its goal.

### Note — a concurrent process rewrote and committed `01-REVIEW.md` during this verification

`git status --porcelain` was empty when this verification opened and empty after every build it ran. Mid-pass, `.planning/phases/01-repository-skeleton-and-project-layout/01-REVIEW.md` began changing on its own: its mtime advanced 18:01:50 → 18:04:00 → 18:04:47 local and its size 43,773 → 43,776 bytes while this agent held no writer. A separate process then committed it and a regenerated disposition as `e2b0dc7 docs(01): add code review report` and `933f451 docs(01): record code review disposition`. Its content moved from the previously committed `1 critical / 8 warning / 7 info` (16 findings, `reviewed: 2026-10-15T14:53:40Z`) to `1 critical / 10 warning / 8 info` (19 findings, `reviewed: 2026-10-15T15:00:47Z`), and the disposition from 17 rows to 20, all `open`. I did **not** revert or re-run it — it is not a phase implementation artifact (it is absent from `covered_files`), and my analysis of CR-01 is anchored to the finding's text and my own reproduction rather than to any finding count. The implementation tree was clean throughout; the only working-tree change this verification left is its own report.

### Override Review — does the override discharge the truth?

The override is properly formed against `verification-overrides.md`: its `must_have` text restates the failing clause in the clause's own vocabulary (so the fuzzy match binds to ROADMAP criterion 2's second conjunct, not to some nearby truth), its `reason` is specific and states what was measured rather than "not needed", and both `accepted_by` and `accepted_at` are present and are **git-derived, not typed** — they match `bf60cca`'s author and timestamp exactly, and that commit is an ancestor of HEAD.

I checked the premise rather than trusting it, because a false premise would make the override a way of discharging a truth that either could have passed or deserves to fail:

- **The literal criterion really is unobservable on the committed tree.** `homeworks/project-baseline/platformio.ini` declares no `lib_deps` (`grep -c` → 0), and a copy of that environment one level deeper builds — I rebuilt it: exit 0, `[SUCCESS] Took 2.87 seconds`. So there is genuinely no build failure to demonstrate, and the honest options were a substitution or a deferred mechanism.
- **The substitution's justification is real, not a rationalization.** I reproduced the two-arm measurement on a fresh fixture: with `lib_deps = probelib=symlink://../../shared/lib/probelib`, arm A (exactly one level below `homeworks/`) exits 0 and arm B (one level deeper) exits 1 with PlatformIO's own `PackageException: Can not create a symbolic link for ../../shared/lib/probelib, not a directory`. The depth boundary is load-bearing; the committed baseline simply lacks the dependency that would exhibit it.
- **The discharge is bounded.** Phase 3 success criterion 5 (ROADMAP line 94) is the named retirement trigger, and it names the exact dependency form that makes the literal mechanism observable.

I judge the override to **discharge** the truth. It is not a way to skip verification: the deviation stays visible in `ROADMAP.md` beside an untouched criterion, in `PROJECT.md`'s Key Decisions and in this report's frontmatter, and the underlying mechanism is measured rather than asserted. A2 is therefore `PASSED (override)` and counts toward the score, and it is not reported as a gap.

### Human Verification Required

#### 1. Criterion 1's manual half — the workspace window

**Test:** Open the committed `homework.code-workspace` in VS Code via File → Open Workspace from File… (the workspace file, not the folder) and read the Explorer's top-level root names.
**Expected:** Exactly three top-level roots named `root`, `shared` and `project-baseline`; no unresolved-path marker on `shared`; no stale-workspace warning.
**Why human:** No agent can see what the editor renders, and no deterministic predicate exists for "VS Code loaded the workspace". The phase recorded this with an empty output slot rather than inventing an observation.
**Also worth checking while the window is open:** whether `editor.rulers = 100` and `C_Cpp.formatting = clangFormat` are actually in effect for `homeworks/project-baseline/src/main.cpp`. The root `.vscode/settings.json` is folder-scoped, and every homework is nested inside the `root` folder, so the settings may not reach it.

#### 2. Criterion 3's editor half — the clean tree after an editor session

**Test:** In that same session, open and save one tracked file in each of the three roots (a file under `.planning/`, a file under `shared/`, one baseline project file), let the editor settle, then run `git status --porcelain` from the repository root — **before** writing the result into any tracked file.
**Expected:** Empty output; specifically, no modification to `homeworks/project-baseline/src/main.cpp`.
**Why human:** A human editor session is not automatable, and the reading must be taken before the observation is written down, because the log is itself a tracked file.
**Caution, with evidence:** `editor.formatOnSave` is true, `[cpp]` uses `ms-vscode.cpptools` with `C_Cpp.formatting = clangFormat`, no `.clang-format` exists in the repository, and `main.cpp:13` is 108 columns with a 2-space body indent against `.editorconfig`'s declared 4. Saving that file is therefore **expected to make `git status` dirty**. If it does, record exactly which file changed and how, rather than re-saving until it looks clean.

### Gaps Summary

**No gaps remain.** The two the previous pass filed are both resolved, and I verified each independently rather than on the summaries' word:

1. **Gap 2 — the dirty tree — is closed by rule, not by an exception.** `.gitignore:96` now carries `.planning/*.lock`, with the rationale written above it; `git check-ignore -v .planning/milestone.lock` names `.gitignore` as the source, so a clone inherits it; and `git status --porcelain` is empty on a tree that has been built, swept and regenerated. The rule is a glob over the lock-file class rather than a single filename, and the new five-test contract asserts both directions — including that no path git actually tracks has become ignored — so the class cannot silently reopen.

2. **Gap 1 — criterion 2's second conjunct — is discharged by an owner-accepted override** that I judged against its premise instead of accepting on trust: the literal mechanism is genuinely unobservable while the baseline declares no `lib_deps` (re-measured: the deeper copy builds), the substitution's evidence is real (independently re-measured: the two-arm fixture resolves the symlink at one level and fails one level deeper), and the discharge is bounded by a named Phase 3 criterion that retires it. It remains a deviation, not a verification — but it is now a *recorded, attributed, dated and reversible* one, which is what the overrides mechanism exists to produce.

**What is left is human, not mechanical.** Two conjuncts — what VS Code renders when the committed workspace file is opened, and whether a real editor session leaves the tree clean — cannot be observed by any agent. They are carried above, both were recorded by the phase with deliberately unfilled output slots (the correct artifact), and neither is counted as verified anywhere in this report's score. That is why the status is `human_needed` and not `passed`.

**The one thing a reader should not miss** is CR-01: `tools/generate-workspace.mjs --check` exits 0 without checking when its own path carries a symlink, reproduced above. It does not falsify a must-have and it does not touch the phase goal, so it is not a blocker here — but it is a fail-open gate, and Phase 6 wires this script into hook and CI gates. It should be fixed before anything depends on its verdict.

---

_Verified: 2026-10-15T15:06:36Z_
_Verifier: Claude (gsd-verifier)_
