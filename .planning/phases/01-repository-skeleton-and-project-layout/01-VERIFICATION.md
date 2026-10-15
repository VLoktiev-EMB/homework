---
phase: 01-repository-skeleton-and-project-layout
verified: 2026-10-15T13:09:10Z
status: gaps_found
score: 31/34 must-haves verified
covered_files: [".editorconfig", ".gitattributes", ".gitignore", ".planning/PROJECT.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-01-PLAN.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-01-SUMMARY.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-02-PLAN.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-02-SUMMARY.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-03-PLAN.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-03-SUMMARY.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-04-PLAN.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-04-SUMMARY.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-05-PLAN.md", ".planning/phases/01-repository-skeleton-and-project-layout/01-05-SUMMARY.md", ".vscode/extensions.json", ".vscode/settings.json", "AGENTS.md", "README.md", "homework.code-workspace", "homeworks/project-baseline/README.md", "homeworks/project-baseline/platformio.ini", "homeworks/project-baseline/src/main.cpp", "shared/lib/README.md", "tools/generate-workspace.mjs", "tools/lib/discover.mjs", "tools/sweep-homeworks.mjs", "tools/tests/discover.test.mjs", "tools/tests/generate-workspace.test.mjs", "tools/tests/helpers.mjs", "tools/tests/sweep.test.mjs"]
covered_digest: "v3:sha256:2b9c95daab5b86580edb88c7bcfa8845c72fb0c4edbae446a9fbcd1f81f255fd"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: none
  previous_score: n/a
  gaps_closed: []
  gaps_remaining: []
  regressions: []
gaps:
  - truth: "ROADMAP success criterion 2, second conjunct: moving a homework one level deeper breaks the build, which is what proves the depth rule is load-bearing."
    status: failed
    reason: "Reproduced: a copy of the baseline environment placed at homeworks/project-baseline/deeper/ builds successfully with `pio run -d homeworks/project-baseline/deeper` (exit 0, '[SUCCESS] Took 2.64 seconds'). The phase log records this honestly (01-05-SUMMARY.md §10) and discharges the half with the sweep's rule-naming detector instead, deferring the observable build failure to Phase 3. The detector is a genuine substitute for the rule's enforcement intent but not for the criterion's literal mechanism."
    artifacts:
      - path: "homeworks/project-baseline/platformio.ini"
        issue: "Carries no lib_deps line, so nothing resolves relative to the project directory and a deeper copy still compiles. The failure the criterion names cannot exist until a symlinked shared-library dependency does."
      - path: "tools/sweep-homeworks.mjs"
        issue: "Enforces the rule correctly (DEPTH RULE VIOLATED, exit 1) — this is the substitute the phase chose, not a defect in itself."
    missing:
      - "Either an accepted override recording the detector as the sanctioned discharge of criterion 2 half (b), or a Phase 3 dependency (`lib_deps = <name>=symlink://../../shared/lib/<name>`) under which a one-level-deeper project observably fails to resolve."
  - truth: "01-05 must-have truth and ROADMAP success criterion 3 (blanket clause): a clone-then-build run leaves `git status --porcelain` completely empty — no machine-written GSD state file appears as untracked."
    status: failed
    reason: "Measured on the current tree, before and after a full build and after a full sweep run: `git status --porcelain` prints `?? .planning/milestone.lock`. `git check-ignore -v .planning/milestone.lock` exits 1 — no pattern covers it. The three artifacts the criterion names (.pio/, compile_commands.json, generated editor state) ARE all covered by rule, and the three pre-phase entries are closed, so the failure is the un-named fourth GSD artifact the phase log itself recorded as a known deviation (01-05-SUMMARY.md, 'Known deviations'), not the named three."
    artifacts:
      - path: ".gitignore"
        issue: "The GSD section closes .planning/state.json and .planning/research/.cache/ but not the sibling artifact .planning/milestone.lock. This is the same defect the review files as WR-09 (.gitignore:115-120)."
    missing:
      - "One line in the GSD block of .gitignore: `.planning/milestone.lock`."
human_verification:
  - test: "Criterion 1 manual half — open the committed homework.code-workspace in VS Code (File → Open Workspace from File...) from a checkout unmodified since 926db18, and read the Explorer's top-level root names."
    expected: "Exactly three top-level roots, named `root`, `shared` and `project-baseline`; no unresolved-path marker on `shared`; no stale-workspace warning. Optionally also confirm that opening homeworks/project-baseline/src/main.cpp in that window shows editor.rulers = 100 and C_Cpp.formatting = clangFormat in the effective settings (open question IN-06: the root `.vscode/settings.json` is folder-scoped and every homework is nested inside the `root` folder)."
    why_human: "No agent can observe what a VS Code window renders, and there is no deterministic predicate for 'the editor loaded the workspace'. The phase deliberately recorded this with an explicitly unfilled output slot in 01-05-SUMMARY.md §12 — that empty slot is the correct artifact, not a gap in the work."
  - test: "Criterion 3 editor half — in that same workspace session, open and save one tracked file in each of the three roots (a file under .planning/, a file under shared/, one baseline project file), let the editor settle, then run `git status --porcelain` from the repository root BEFORE writing the result into any tracked file."
    expected: "No output other than the already-recorded `?? .planning/milestone.lock`; in particular no modification to homeworks/project-baseline/src/main.cpp."
    why_human: "A human editor session is not automatable, and the reading must be taken before the observation is written down (the log is itself a tracked file). Raised in severity by an open review finding: WR-06 measures that `editor.formatOnSave` is true, `[cpp]` uses ms-vscode.cpptools with `C_Cpp.formatting = clangFormat`, no `.clang-format` exists in the repository, and main.cpp line 13 is 108 columns with a 2-space body indent while `.editorconfig` declares `indent_size = 4` for `*.cpp`. Saving that file is therefore expected to rewrite it and make `git status` dirty. If the observation fails, record exactly what changed rather than re-saving."
---

# Phase 1: Repository Skeleton and Project Layout Verification Report

**Phase Goal:** The repository is one VS Code workspace holding the root, the shared-library tree and one folder per homework, with the folder names and the one-level depth rule frozen before any mechanism is built on them.
**Verified:** 2026-10-15T13:09:10Z
**Status:** gaps_found
**Re-verification:** No — initial verification (no prior VERIFICATION.md existed in the phase directory)

## Goal Achievement

The phase goal itself — a frozen tree, one generated multi-root workspace, one folder per homework, a frozen id grammar and a one-level depth rule enforced by the repository's own tooling — is present in the codebase and works. The verdict is `gaps_found` because two of the four ROADMAP success criteria are not literally true on the tree that ships, and one of them was verified false by reproduction rather than by inference.

### Observable Truths — ROADMAP Success Criteria (the contract)

| # | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| A1 | Criterion 1: opening the committed workspace file in VS Code shows the repo root, `shared/` and every homework as top-level roots | ? UNCERTAIN | Automated half VERIFIED: `node tools/generate-workspace.mjs --check` prints `homework.code-workspace is up to date`, exit 0, and the file lists exactly `root` (`.`), `shared` (`shared`) and `project-baseline` (`homeworks/project-baseline`). The manual half — what VS Code renders — is unobservable by an agent and is deferred in the phase log with an unfilled output slot. |
| A2 | Criterion 2: a project at `homeworks/<id>/` builds from the root with exactly one command, AND moving it one level deeper breaks the build | ✗ FAILED | First conjunct VERIFIED: `/Users/vloktiev/.platformio/penv/bin/pio run -d homeworks/project-baseline` → exit 0, `[SUCCESS]`, `Flash: used 268177 bytes from 6553600 bytes`. Second conjunct FAILED: a copy of the same environment at `homeworks/project-baseline/deeper/` builds with exit 0 in 2.64 s. |
| A3 | Criterion 3: `git status` stays clean across a full build and an editor session — `.pio/`, `compile_commands.json` and generated editor state never appear as untracked or modified | ✗ FAILED | The three named artifacts ARE covered by rule (`git check-ignore -v` → `.gitignore:16` for `.pio/`, `.gitignore:20` for `compile_commands.json`) and `--ignored` reports both. But the criterion's blanket claim is false on a working checkout: after a full build and after a full sweep run, `git status --porcelain` prints `?? .planning/milestone.lock`. The editor half is additionally deferred. |
| A4 | Criterion 4: a repo-wide sweep in a tree matching zero homework projects exits non-zero with a readable message instead of reporting success | ✓ VERIFIED | Against an empty fixture tree: `sweep: found ZERO homework projects under homeworks/*/platformio.ini` / `A gate that built nothing must not exit 0.` / `Pass --allow-empty only if an empty tree is genuinely expected.` — exit 1. `--allow-empty` is the single named escape hatch and must be asked for; the failure path is the default. |

**Score:** 1/4 roadmap criteria verified, 1 uncertain, 2 failed.

### Observable Truths — PLAN frontmatter must-haves (deduplicated against the contract above)

| # | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| B1 | (01-01) The workspace file names `shared` and every discovered homework id, sorted, and regenerating an unchanged tree is byte-identical | ✓ VERIFIED | `node tools/generate-workspace.mjs` then `cmp` against the backup → BYTE-IDENTICAL; `git diff --stat homework.code-workspace` empty. |
| B2 | (01-01) `--check` exits 0 on a current file and 1 with a message naming the file and the remedy on a hand-edited one | ✓ VERIFIED | Exit 0 on the committed file; after appending one byte, exit 1 with `homework.code-workspace is STALE.` + `It is generated from the filesystem and must never be hand-edited.` + `Run: node tools/generate-workspace.mjs`. |
| B3 | (01-01) A directory directly under `homeworks/` is a homework iff its name matches the frozen id grammar and it contains a `platformio.ini`; one rule serves generator, sweep and future CI | ✓ VERIFIED | `tools/lib/discover.mjs` is the only definition; `tools/generate-workspace.mjs` and `tools/sweep-homeworks.mjs` both import it; `grep -cE 'readdirSync\|ID_PATTERN\s*=' tools/sweep-homeworks.mjs` → 0. |
| B4 | (01-01) No `upload_port` or `monitor_port` is committed for the baseline | ✓ VERIFIED | `grep -rn 'upload_port\|monitor_port' homeworks/` → no match. `monitor_speed = 115200` is present and matches `Serial.begin(115200)`. |
| B5 | (01-01) `shared/lib/` exists as a git-tracked directory because it contains a README.md | ✓ VERIFIED | `git ls-files shared` → `shared/lib/README.md`. |
| B6 | (01-02) `git status --porcelain` reports no untracked entry for `.DS_Store`, `.planning/research/.cache/` and `.planning/state.json` | ✓ VERIFIED | All three resolve to the repository's own `.gitignore` (`:82`, `:120`, `:91`); `git status --porcelain` reports none of them. |
| B7 | (01-02) Build output is ignored at any depth without an extra prefix | ✓ VERIFIED | `git check-ignore -v homeworks/project-baseline/.pio/` → `.gitignore:16:.pio/`; `.../compile_commands.json` → `.gitignore:20`. Both appear only under `--ignored`. |
| B8 | (01-02) No gitignore pattern carries an inline comment that would silently disable it | ✓ VERIFIED | `grep -cE '^[^#][^#]*#' .gitignore` → 0. |
| B9 | (01-02) `sdkconfig.*` is negated for the hand-authored `sdkconfig.defaults` | ✓ VERIFIED | `git check-ignore -q sdkconfig.defaults` exits 1 (not ignored). |
| B10 | (01-02) `.claude/settings.local.json` is ignored by the repository, not only by this machine's global excludes | ✓ VERIFIED | `git check-ignore -q .claude/settings.local.json` exits 0. |
| B11 | (01-02) The agent-state rules never match the whole `.claude` directory, so Phase 7 skill mirrors stay trackable | ✓ VERIFIED | `git check-ignore -q .claude/skills/new-homework/SKILL.md` exits 1 (trackable). |
| B12 | (01-02) `.editorconfig` uses only the nine properties the EditorConfig specification defines | ✓ VERIFIED | Inspection: `root`, `charset`, `end_of_line`, `insert_final_newline`, `trim_trailing_whitespace`, `indent_style`, `indent_size` only — no `max_line_length`, no `trim_final_newlines`. |
| B13 | (01-02) `.gitattributes` normalises text to LF in the index while `.editorconfig` governs the editor; neither duplicates the other | ✓ VERIFIED | `git check-attr text eol -- README.md` → `set`, `lf`. |
| B14 | (01-02) A generated vector image is treated as text by git | ✓ VERIFIED | `.gitattributes:24 *.svg text`; `git check-attr text -- docs/wiring.svg` → `text: set`. |
| B15 | (01-02) Editor settings live only in `.vscode/settings.json`; the only PlatformIO IDE key present is the one measured to exist in the installed extension | ✓ VERIFIED | `homework.code-workspace` carries no `settings` key (pure folder list); exactly one `platformio-ide.*` key, `platformio-ide.activateProjectOnTextEditorChange`; no `files.exclude`. |
| B16 | (01-03) The plural library-folder path no longer appears anywhere in `AGENTS.md` | ✓ VERIFIED | `grep -c 'shared/libs' AGENTS.md` → 0; `grep -c 'shared/lib/' AGENTS.md` → 2. |
| B17 | (01-03) `AGENTS.md` contains nothing but those two path-segment corrections; every other line is byte-identical | ✓ VERIFIED | `git diff 57558cb^ 57558cb -- AGENTS.md` → exactly two hunks (lines 45 and 107 in file numbering), each a single substitution. Line count 219 unchanged. |
| B18 | (01-03) The path segment appearing only inside prose about the rejected global-library directive is left untouched — no blind substitution | ✓ VERIFIED | Same two-hunk diff: the `lib_extra_dirs`/`globallib_dir` row keeps its prose and changes only the `symlink://` path segment. |
| B19 | (01-03) `.planning/PROJECT.md` names the same library folder as `REQUIREMENTS.md` | ✓ VERIFIED | `grep -cE 'shared/([^l]\|$)' .planning/PROJECT.md` → 0; `grep -c 'shared/lib/'` → 3. |
| B20 | (01-03) `.planning/PROJECT.md` gains a Traps section every later phase's prior-context load will read | ✓ VERIFIED | `grep -c '^## Traps for Later Phases$' .planning/PROJECT.md` → 1, immediately before `## Evolution`. |
| B21 | (01-03) The root README names the generated workspace file and says how to open it | ✓ VERIFIED | `grep -c 'homework.code-workspace' README.md` → 4; lines 12-29 give the File → Open Workspace procedure plus both commands. |
| B22 | (01-03) The root README states the one-command build, where the conventions live, and what counts as a homework | ✓ VERIFIED | README lines 75-96: `pio run -d homeworks/<id>`, the `## Conventions` pointer to `AGENTS.md`, and the `## What counts as a homework` definition. |
| B23 | (01-03) The root README documents no directory, file or command that does not exist in the tree it ships with | ✓ VERIFIED | Every path in the structure block exists; no `.clang-format`, `.clang-tidy`, `scripts/`, `docs/` or `.agents/` claim; no machine-local absolute path. |
| B24 | (01-04) A `platformio.ini` found one level below a homework folder makes the sweep exit non-zero with a message that names the RULE | ✓ VERIFIED | Fixture `homeworks/m01-l03-blink/deeper/platformio.ini` → `DEPTH RULE VIOLATED` + one-level requirement + two-line reason + `  deeper platformio.ini found: homeworks/m01-l03-blink/deeper`, exit 1. |
| B25 | (01-04) A homework folder whose name fails the frozen grammar makes the sweep exit non-zero and print the expected pattern | ✓ VERIFIED | Fixture `homeworks/badName/` → `MALFORMED HOMEWORK ID` / `Expected: ^(?:m[0-9]{2}-l[0-9]{2}\|project)-[a-z0-9]+(?:-[a-z0-9]+)*$` / `  does not match: homeworks/badName/`, exit 1. |
| B26 | (01-04) Both policy failures fire before any build is attempted | ✓ VERIFIED | Control flow in `tools/sweep-homeworks.mjs`: the depth and grammar branches set `failed` and `process.exit(1)` before `resolvePio()` and before any `spawnSync` of a build. |
| B27 | (01-04) The sweep builds every discovered project from the repository root and accumulates failures rather than stopping at the first | ✓ VERIFIED | `node tools/sweep-homeworks.mjs` on the real tree → discovered `project-baseline`, built it from the root, reported the 16 MB partition, exit 0. The loop branches on `spawnSync` error separately from child status and never breaks early. |
| B28 | (01-04) An absent or unresolvable PlatformIO binary produces an actionable message, distinguishable from a project's build failure | ✓ VERIFIED | With `HOME` pointing at an empty directory and no `pio` on `PATH`: `PlatformIO Core was not found.` / `Install it, or point at it explicitly:` / `  export PLATFORMIO_CORE=$HOME/.platformio/penv/bin/pio`, exit 1 — a distinct branch from the per-project failure path. |
| B29 | (01-04) Discovery and validation are delegated to the one shared module rather than re-implemented | ✓ VERIFIED | `tools/sweep-homeworks.mjs:35` imports `{ discoverHomeworks, ID_PATTERN_TEXT }`; no second discovery implementation (count 0). |
| B30 | (01-05) The exact `git status` output observed before, during and after the acceptance run is recorded in the phase log | ✓ VERIFIED | `01-05-SUMMARY.md` §2 (before), §3/§8 (after build and compiledb), §11 (after the log was committed) — each with verbatim output. |

**Score:** 30/30 plan-level truths verified.

**Overall score:** 31/34 must-haves verified. 2 failed, 1 uncertain. No truth failed for absence of implementation: every failing item is a documented substitution or an un-named artifact, not missing work.

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `tools/lib/discover.mjs` | Single discovery source: `HOMEWORKS_DIR`, `ID_PATTERN`, `ID_PATTERN_TEXT`, `discoverHomeworks`, `findDepthViolations`, `envNames` | ✓ VERIFIED | All six symbols exported; `node:fs`/`node:path` only; `isDirectory()` excludes symlinks; a missing directory yields `[]` rather than throwing. |
| `tools/generate-workspace.mjs` | Pure renderer plus byte-comparison drift check | ✓ VERIFIED | `renderWorkspace(repoRoot)` is a pure export; CLI behind an entry-point guard (see CR-01 below); both `--check` outcomes reproduced. |
| `homework.code-workspace` | Generated multi-root workspace containing `homeworks/project-baseline` | ✓ VERIFIED | Contains `homeworks/project-baseline`; pure folder list; LF; one trailing newline; regenerates byte-identically. |
| `homeworks/project-baseline/platformio.ini` | Pinned, N16R8-overridden build environment | ✓ VERIFIED | `platform = espressif32@7.1.3` (exact), the four overrides, `monitor_speed = 115200`, no console-port key. |
| `homeworks/project-baseline/src/main.cpp` | Serial report of flash size, `psramFound()` and PSRAM size; touches no GPIO | ✓ VERIFIED | `Serial.begin(115200)` + one `printf`; `grep -cE 'pinMode\|digitalWrite\|analogRead\|ledcSetup'` → 0. |
| `tools/tests/helpers.mjs` | Shared `os.tmpdir()` fixture builder | ✓ VERIFIED | Extended with `makeDepthViolation`, `runSweep`, `SWEEP_PATH`; every fixture built under `os.tmpdir()`. |
| `tools/tests/discover.test.mjs` | Id grammar, depth walk, `envNames` | ✓ VERIFIED (substantive) | 134 lines, 17 assertions; one is vacuous — see IN-04. |
| `tools/tests/generate-workspace.test.mjs` | Renderer determinism, folder set, both `--check` outcomes | ✓ VERIFIED | 97 lines, 12 assertions; spawns the real CLI. |
| `shared/lib/README.md` | Makes `shared/lib` trackable; states the frozen layout and dependency form | ✓ VERIFIED | Tracked; no deprecated global-library directive. |
| `homeworks/project-baseline/README.md` | Declares the baseline is not a course homework | ✓ VERIFIED | First line carries the disclaimer. |
| `tools/sweep-homeworks.mjs` | Repo-wide gate with loud zero-match failure and named-rule depth detection | ✓ VERIFIED | Contains `DEPTH RULE VIOLATED`; argv array, no shell. |
| `tools/tests/sweep.test.mjs` | Integration coverage of every exit path | ✓ VERIFIED | 146 lines, 25 assertions; nine cases, one per exit path. |
| `.gitignore` | Single deliberate ignore file | ⚠️ PRESENT, ONE HOLE | Covers PlatformIO output, ESP-IDF, C/C++ artifacts, CMake, caches, named generated editor files, OS junk, agent state, secrets and the GSD research cache — but not `.planning/milestone.lock` (gap 2, WR-09). |
| `.editorconfig`, `.gitattributes`, `.vscode/settings.json`, `.vscode/extensions.json` | The text-layer contract and editor settings | ✓ VERIFIED | `.gitignore`/`.editorconfig`/`.gitattributes` each parse and each rule resolves; see WR-04 for the one `.code-workspace` indent mismatch. |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `tools/generate-workspace.mjs` | `tools/lib/discover.mjs` | imports `discoverHomeworks` | WIRED | Single discovery source; grep for a second implementation returns 0. |
| `tools/lib/discover.mjs` | `homework.code-workspace` | `renderWorkspace` turns discovered ids into the `folders` array; `--check` compares bytes | WIRED | Drift check exits 0 on the committed file; hand-edit makes it exit 1. |
| `homeworks/project-baseline/platformio.ini` | `homeworks/project-baseline/src/main.cpp` | the env's `src/` tree builds; `monitor_speed` matches `Serial.begin()` | WIRED | `monitor_speed = 115200`; `Serial.begin(115200)`. |
| `tools/sweep-homeworks.mjs` | `tools/lib/discover.mjs` | imports `discoverHomeworks` and the printable id pattern | WIRED | Confirmed by import and by the exported banner text. |
| `tools/sweep-homeworks.mjs` | `homeworks/project-baseline` | spawns the build verb with a project-directory argument and no shell | WIRED | Live run built the baseline from the repository root, exit 0. |
| `tools/tests/sweep.test.mjs` | `tools/tests/helpers.mjs` | every fixture built under `os.tmpdir()` | WIRED | `mkdtemp` in the helper; no test builds against the repository root (WR-07 flags that `--list` still points at it). |
| `.gitignore` | `homeworks/project-baseline/.pio/` | unanchored `.pio/` matches at any depth | WIRED | `.gitignore:16` is the resolving source for the built directory. |
| `.editorconfig` | `.gitattributes` | deliberate non-duplication (editor vs index) | WIRED | `eol=lf` in the index; `end_of_line = lf` in the editor; values agree. |
| `.vscode/settings.json` | `.editorconfig` | one owner per rule | WIRED, with one exception | The `files.*` mirror is identical to `.editorconfig`, but `editor.tabSize = 4` vs the generator's 2-space output for `.code-workspace` is the WR-04 mismatch. |
| `homeworks/project-baseline/platformio.ini` | `.gitignore` | the build writes only into the project directory; the ignore rules keep `git status` clean | WIRED for the build artifacts | `.pio/` and `compile_commands.json` are ignored; `.planning/milestone.lock` is not (gap 2). |
| `homework.code-workspace` | `homeworks/` | the committed file is what a reader opens; the drift check proves it still matches | WIRED | `--check` exit 0; the three roots match the tree. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `homework.code-workspace` | `folders[]` | `discoverHomeworks(REPO_ROOT).found` — a real `readdirSync` over `homeworks/` | Yes | ✓ FLOWING |
| `tools/generate-workspace.mjs --check` | `expected` | `renderWorkspace()` over the live tree, compared byte-for-byte with the file on disk | Yes | ✓ FLOWING |
| `tools/sweep-homeworks.mjs` | `found` | `discoverHomeworks(root)` over the real tree, then a real `spawnSync` build | Yes | ✓ FLOWING |
| `homeworks/project-baseline/src/main.cpp` | flash/PSRAM values | `ESP.getFlashChipSize()`, `psramFound()`, `ESP.getPsramSize()` — runtime measurement, no literal | Yes (on hardware) | ✓ FLOWING (compile-time verified; runtime report is Phase 2's on-board acceptance) |

No hard-coded literal, static fallback or mock terminates any of these chains.

### Behavioral Spot-Checks / Probe Execution

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Workspace drift check passes | `node tools/generate-workspace.mjs --check` | `homework.code-workspace is up to date`, exit 0 | ✓ PASS |
| Drift check fires on a hand edit | append one byte, then `--check` | `... is STALE.` + remedy, exit 1; file restored | ✓ PASS |
| One-command build from the repo root | `pio run -d homeworks/project-baseline` | exit 0, `[SUCCESS] Took 0.54 seconds`, `6553600` bytes | ✓ PASS |
| Criterion 2 half (b): deeper project breaks the build | `pio run -d homeworks/project-baseline/deeper` (fixture copy) | exit 0, `[SUCCESS] Took 2.64 seconds` | ✗ FAIL — the criterion's mechanism is absent |
| Sweep lists validated ids | `node tools/sweep-homeworks.mjs --list` | `project-baseline`, exit 0 | ✓ PASS |
| Sweep defaults to the repo root from a foreign cwd | `cd /tmp && node .../sweep-homeworks.mjs --list` | `project-baseline`, exit 0 | ✓ PASS |
| Criterion 4: zero matches fails loudly | `node .../sweep-homeworks.mjs --root <empty fixture>` | three-line message, exit 1 | ✓ PASS |
| Escape hatch is opt-in | `--root <empty fixture> --allow-empty` | exit 0, one line | ✓ PASS |
| Depth rule names the rule, before any build | fixture with `homeworks/m01-l03-blink/deeper/platformio.ini` | `DEPTH RULE VIOLATED` + path, exit 1 | ✓ PASS |
| Malformed id names the grammar | fixture with `homeworks/badName/` | `MALFORMED HOMEWORK ID` + expected pattern, exit 1 | ✓ PASS |
| Missing PlatformIO is a distinct, actionable failure | clean env, empty `HOME`, no `pio` on `PATH` | `PlatformIO Core was not found.` + export line, exit 1 | ✓ PASS |
| Full sweep builds from the root | `node tools/sweep-homeworks.mjs` | baseline built, exit 0 | ✓ PASS |
| Test suite | `FORCE_COLOR=0 node --test "tools/**/*.test.mjs"` | tests 27, pass 27, fail 0, skipped 0, todo 0 | ✓ PASS |
| Criterion 3 after a full build and a full sweep | `git status --porcelain` | `?? .planning/milestone.lock` | ✗ FAIL (the criterion's named artifacts are clean; the tree is not) |

No probe scripts (`scripts/*/tests/probe-*.sh`) are declared or implied by this phase; Step 7c is not applicable.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| REPO-01 | 01-01, 01-03, 01-05 | The repository opens as ONE VS Code workspace listing the repo root, `shared/`, and one folder per homework | ✓ SATISFIED (automated half) / ? NEEDS HUMAN (rendered window) | `homework.code-workspace` lists exactly `root`, `shared`, `project-baseline`; `--check` exit 0; README documents how to open it. What VS Code renders is deferred. |
| REPO-02 | 01-01, 01-03, 01-04, 01-05 | Each homework lives at `homeworks/<module>-<lesson>-<slug>/` and is buildable from the root with `pio run -d homeworks/<id>` | ✓ SATISFIED | Build exits 0 from the root reporting the 16 MB partition; `--list` prints `project-baseline`; the grammar is frozen in `discover.mjs`. |
| REPO-03 | 01-03, 01-04, 01-05 | Every homework sits exactly one directory level below `homeworks/`, because every shared-library path in `lib_deps` is relative to the project | ⚠️ PARTIAL | The rule is enforced by name before any build (`DEPTH RULE VIOLATED`, exit 1) and documented in the README and `PROJECT.md`. The complementary observable — a deeper project failing to build — does not exist yet (gap 1). |
| REPO-04 | 01-02, 01-05 | Machine-generated and machine-local artifacts (`.pio/`, `compile_commands.json`) are gitignored, never committed | ✓ SATISFIED (as written) | Both named artifacts resolve to `.gitignore` (`:16`, `:20`) and appear only under `--ignored`; neither is committed. A fourth, un-named machine-local artifact (`.planning/milestone.lock`) is not covered — recorded as gap 2. |

No orphaned requirements: `REQUIREMENTS.md` maps exactly REPO-01..04 to Phase 1, and all four appear in at least one PLAN's `requirements` field.

### Decision Coverage

All trackable CONTEXT.md decisions are honored by shipped artifacts. (`check.decision-coverage-verify`: total 26, honored 26, not_honored [] — `{"skipped": false, "blocking": false}`.)

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
| --------- | ---------- | ------ | ------- | -------- | --------------- | ------- |
| `tools/tests/discover.test.mjs` | REPO-02 | 17 | 0 | no | value | ⚠️ one tautological assertion (IN-04) |
| `tools/tests/generate-workspace.test.mjs` | REPO-01 | 12 | 0 | no | value / behavioral | OK |
| `tools/tests/sweep.test.mjs` | REPO-02, REPO-03 | 25 | 0 | no | value / behavioral | ⚠️ one case silently requires a working PlatformIO (WR-08) |

**Disabled tests on requirements:** 0 → no BLOCKER.
**Circular patterns detected:** 0 → no BLOCKER. No fixture is generated by the system under test; every sweep fixture is built by `helpers.mjs` under `os.tmpdir()`.
**Insufficient assertions:** 1 (WARNING) — `assert.deepEqual(envNames("m01-l03-blink"), envNames("m01-l03-blink"))` in `discover.test.mjs` compares a pure function with itself and cannot fail. It contributes a green tick and no coverage. `envNames()` has no production consumer at all (WR-05).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | `TBD` / `FIXME` / `XXX` in any phase-modified file | none | Scanned all 19 authored artifacts; zero matches. No debt-marker BLOCKER. |
| — | — | `TODO` / `HACK` / `PLACEHOLDER` under `tools/`, `homeworks/`, `shared/`, `.vscode/` | none | Zero matches. |
| `homeworks/project-baseline/src/main.cpp` | 13 | 108-column line under `editor.rulers: [100]`, 2-space body indent vs `.editorconfig`'s `indent_size = 4` for `*.cpp` | ⚠️ Warning | Format-on-save is enabled globally with `C_Cpp.formatting = clangFormat` and no `.clang-format` in the repository, so opening and saving this file is expected to rewrite it — directly threatening criterion 3's deferred editor observation (WR-06). |
| `.editorconfig` | 22 | `[*.{json,jsonc,yml,yaml,ini,cfg,properties}]` does not match `.code-workspace`, so `homework.code-workspace` inherits `[*] indent_size = 4` while the generator emits 2 spaces | ⚠️ Warning | A single format-on-save of the generated file turns a correct tree into a reported STALE, and the README tells the reader not to hand-edit it (WR-04). Does not affect the file as committed. |

### Code Review Findings — Bearing on the Success Criteria

The phase's `01-REVIEW.md` (16 findings, all `open` in `01-REVIEW-DISPOSITION.md`) was re-read, not re-run. Assessment of each finding against the goal and the four criteria:

- **CR-01** (entry-point guard fails open through a symlinked script path; `--check` exits 0 having checked nothing). Reproduced independently: `node gen.mjs --check` through a symlink prints nothing and exits 0, where the direct invocation prints the verdict. **Bears on criterion 1's automated half.** It does **not** prevent the phase goal or change today's verdict: I ran the documented invocation myself and it genuinely checked the real file, and the failure needs the script path itself to be symlinked. Judged a **WARNING**, not a blocker — but it is the one finding that undermines an evidence-producing gate, and it is latent rather than harmless.
- **WR-01** (the depth rule walks the filesystem, not the committed tree; `.pio/libdeps/**/examples/*/platformio.ini` would make the gate red on any machine that has built). **Bears on criterion 2 half (b) and criterion 4's determinism.** Not manifest today: the baseline declares no `lib_deps`, no `.pio/libdeps` exists, and `find homeworks -name platformio.ini` returns only the project's own file. Latent; becomes live in Phase 3. **WARNING.**
- **WR-03** (the generator silently drops a homework whose name fails the grammar and exits 0). **Bears directly on criterion 1** — the exact failure the README warns about. Reproduced. Latent: no malformed folder exists in the tree, and the committed file is correct for the tree that ships. **WARNING.**
- **WR-09** (`.planning/milestone.lock` untracked and unignored). **Bears on criterion 3 and on REPO-04's intent.** This is gap 2 — the one review finding that is a live, measured failure of a stated criterion rather than a latent risk. **BLOCKER.**
- **WR-02, WR-04, WR-05, WR-06, WR-07, WR-08, IN-01..IN-06.** WR-06 bears on criterion 3's deferred editor half (see Human Verification). WR-04 bears on criterion 1's automated-half stability. The remainder concern the Phase 6 consumer contract, test hygiene and documentation completeness; they do not bear on what this phase delivered. **WARNING / INFO.**
- No security finding was raised, and none is warranted: no secrets, no network access, and the sweep passes an argv array to `spawnSync` with no shell.

### Human Verification Required

These two items are the phase log's own deliberately deferred observations (`01-05-SUMMARY.md` §12), recorded there with explicitly unfilled output slots. They are carried here verbatim in substance. They are listed even though the overall status is `gaps_found`, because the `gaps_found` route does not otherwise carry them forward and they are the only record of them.

#### 1. Criterion 1's manual half — the workspace window

**Test:** From a checkout unmodified since `926db18`, open `homework.code-workspace` in VS Code via File → Open Workspace from File… (the workspace file, not the folder).
**Expected:** Exactly three top-level roots named `root`, `shared` and `project-baseline`; no unresolved-path marker on `shared`; no stale-workspace warning.
**Why human:** No agent can see what the editor renders, and no deterministic predicate exists for "VS Code loaded the workspace". The phase recorded this with an empty output slot rather than inventing an observation.
**Also worth checking while the window is open (IN-06):** whether `editor.rulers = 100` and `C_Cpp.formatting = clangFormat` are actually in effect for `homeworks/project-baseline/src/main.cpp`. The root `.vscode/settings.json` is folder-scoped, and every homework is nested inside the `root` folder, so the settings may not reach it.

#### 2. Criterion 3's editor half — the clean tree after an editor session

**Test:** In that same session, open and save one tracked file in each of the three roots, let the editor settle, then run `git status --porcelain` from the repository root — **before** writing the result into any tracked file.
**Expected:** No output beyond the already-recorded `?? .planning/milestone.lock`; specifically, no modification to `homeworks/project-baseline/src/main.cpp`.
**Why human:** A human editor session is not automatable, and the reading must be taken before the observation is written down, because the log is itself a tracked file.
**Caution, with evidence:** WR-06 measures that `editor.formatOnSave` is true, that `[cpp]` uses `ms-vscode.cpptools` with `C_Cpp.formatting = clangFormat`, that no `.clang-format` exists, and that `main.cpp` line 13 is 108 columns with a 2-space body indent against `.editorconfig`'s declared 4. Saving that file is therefore **expected to make `git status` dirty**. If it does, record exactly which file changed and how, rather than re-saving until it looks clean.

### Gaps Summary

The skeleton is real and mostly works. The generated workspace file is a genuine pure function of the tree, the drift check genuinely detects a hand edit, the baseline genuinely builds from the repository root with one command and reports the 16 MB N16R8-override partition, the depth rule genuinely fires by name before any child process exists, and the zero-match gate genuinely refuses to report success on an empty tree. Every one of the 30 plan-level must-have truths is supported by code I read or a command I ran, and the 27-case suite passes.

Two of the four ROADMAP success criteria are nonetheless not true as written:

1. **Criterion 2's second conjunct does not hold.** Moving a project one level deeper does not break the build — I reproduced it building in 2.64 s. The phase knew this, said so plainly in its own log, and substituted the sweep's rule-naming detector. That substitution is defensible and may even be the better mechanism, but it is not what the roadmap contracted, and the roadmap has not been amended to say otherwise. This is exactly the shape the overrides mechanism exists for: a deliberate deviation where an alternative implementation satisfies the intent but not the literal wording. An accepted override would close it; so would waiting for Phase 3 to introduce the first `symlink://` dependency, under which a deeper project cannot resolve `../../shared/lib/<name>`.

2. **The tree is not clean.** Criterion 3's blanket claim, and 01-05's own must-have truth ("completely empty … no machine-written GSD state file appears as untracked"), are false on the tree that ships: `git status --porcelain` prints `?? .planning/milestone.lock`, and no ignore pattern covers it. The three artifacts the criterion names — `.pio/`, `compile_commands.json` and generated editor state — are all correctly ignored, so this is not a failure of the ignore file's main job; it is the un-named fourth GSD artifact the phase recorded in its "Known deviations" section and left for a later phase. It is one line to fix, and it makes every `git status` on every working checkout report a change — which is exactly the signal the file exists to produce only when something needs committing.

**The phase log's two deferred observations are unverified, not passing.** Criterion 1's manual half and criterion 3's editor half have never been observed; the log records them with deliberately unfilled output slots, which is the correct artifact. They are carried in Human Verification above. Neither is counted as verified anywhere in the score.

**The code review does not change the verdict.** All 16 findings are `open`, which records an untriaged state rather than an oversight, and they were considered above rather than folded in silently. One of them — WR-09 — is the same defect as gap 2, and is the only review finding that is a live failure of a stated criterion. The rest are latent (CR-01, WR-01, WR-03), concern the Phase 6 consumer contract (WR-02, WR-05), or concern test and documentation hygiene. The single critical finding, CR-01, fails open only when the script path itself is symlinked; the documented invocation works, which I verified directly, so it is a warning about the robustness of an evidence-producing gate rather than a blocker for the phase goal.

---

_Verified: 2026-10-15T13:09:10Z_
_Verifier: Claude (gsd-verifier)_
