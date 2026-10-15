---
phase: 01-repository-skeleton-and-project-layout
plan: 02
subsystem: infra
tags: [gitignore, editorconfig, gitattributes, vscode, git, platformio]

requires: []
provides:
  - "The repository's single deliberate ignore file, covering PlatformIO and ESP-IDF output, C/C++ build artifacts, CMake, caches, named generated VS Code files, OS junk, agent state, secrets and the GSD research cache"
  - "A text-layer contract split one-owner-per-rule: .editorconfig for the editor, .gitattributes for the index"
  - "Committed editor settings in .vscode/settings.json and the extension recommendations that agree with them"
affects: [01-03, 01-04, 01-05, "phase 2", "phase 6", "phase 7", "phase 8"]

actuals:
  tokens: 1517
  tasks: 3
  commits: 3
  plan_head_before: 81548596f1591f73605d5a486a937ecf08320cd0
  plan_head_after: 24fbbcf5a2b87e560958c6b843b71935f1f6f033

tech-stack:
  added: []
  patterns:
    - "Git as the oracle for ignore semantics — asserted with `git check-ignore -v` and `git status --porcelain`, never re-implemented"
    - "One owner per rule across .editorconfig / .gitattributes / .vscode/settings.json"
    - "Every wildcard ignore pattern names the hand-authored file that must survive it and asserts it by path"

key-files:
  created:
    - .gitignore
    - .editorconfig
    - .gitattributes
    - .vscode/settings.json
    - .vscode/extensions.json
  modified: []

key-decisions:
  - "C++ IntelliSense standard set to c++11, not the scaffold's c++17: the pinned Arduino core 2.0.17 compiles with -std=gnu++11, so c++17 would let the editor accept code the toolchain rejects; the final standard statement next to the platform pin stays Phase 3's (research D4)"
  - "No files.exclude block in .vscode/settings.json — an explorer filter was neither authorised nor forbidden by D-02, and hiding the build directory would conceal the artifacts a clean-tree check exists to keep out of git"
  - "All three files reproduced byte-identically from 01-RESEARCH.md rather than paraphrased, then diffed back to their source blocks as the evidence"
  - "REQUIREMENTS.md deliberately left untouched: REPO-04 is declared by both 01-02 and 01-05, so the shared-ID gate defers marking it complete until 01-05's SUMMARY exists"

patterns-established:
  - "Unanchored ignore patterns: .pio/ and compile_commands.json take no leading slash and no **/ prefix, so they match at any depth"
  - "No inline comments in .gitignore — '#' starts a comment only at line start, so a trailing comment silently disables the pattern it sits on"
  - "Generated-plus-authored pairs are negated explicitly: sdkconfig.* then !sdkconfig.defaults"
  - "Generated editor state named individually rather than excluded wholesale, so a future generated file is ignored by default"

requirements-completed: [REPO-04]

coverage:
  - id: D1
    description: "Root .gitignore ignores machine-generated and machine-local artifacts at any depth and closes the three untracked entries that existed at plan start (OS junk, GSD research cache, GSD state file)"
    requirement: REPO-04
    verification:
      - kind: other
        ref: "git check-ignore -v over the ten required paths (.pio/build, compile_commands.json, c_cpp_properties.json, launch.json, .claude/settings.local.json, .DS_Store, .planning/research/.cache/, .planning/state.json, secret.pem, sdkconfig.projectbaseline_s3) -> every line reports .gitignore as its source"
        status: pass
      - kind: other
        ref: "git status --porcelain with the three artifacts created on disk -> only '?? .gitignore'; git status --porcelain --ignored lists all three as '!!'"
        status: pass
      - kind: other
        ref: "git check-ignore -q sdkconfig.defaults / .planning/config.json / .claude/skills/new-homework/SKILL.md / build/ -> exit 1 for all four"
        status: pass
      - kind: other
        ref: "grep -cE '^[^#][^#]*#' .gitignore -> 0; grep -cE '^\\.pio/$' .gitignore -> 1"
        status: pass
    human_judgment: false
  - id: D2
    description: ".editorconfig owns text-level rules using only the nine EditorConfig properties, and .gitattributes owns index-level normalisation with SVG classified as text"
    verification:
      - kind: other
        ref: "node -e key-set check against the nine allowed property names -> OK keys=13; no max_line_length, no trim_final_newlines, no [*.py] section"
        status: pass
      - kind: other
        ref: "git check-attr text eol -- README.md -> set, lf; git check-attr text eol -- docs/wiring.svg -> set, lf; git check-attr binary -- firmware.bin -> set"
        status: pass
      - kind: other
        ref: "diff against 01-RESEARCH.md lines 848-879 (.editorconfig), 883-922 (.gitattributes) and 719-838 (.gitignore) -> all three byte-identical, exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: ".vscode/settings.json and .vscode/extensions.json hold the editor settings in their single home, with exactly one PlatformIO IDE key and a recommendation list that agrees with the settings"
    verification:
      - kind: other
        ref: "node -e platformio-ide.* key count and value check -> OK pio=platformio-ide.activateProjectOnTextEditorChange"
        status: pass
      - kind: other
        ref: "node -e ruler / files.exclude / markdown-prefix check -> OK rulers=[100]"
        status: pass
      - kind: other
        ref: "node -e recommendation set check -> OK recs=4; both files parse under JSON.parse"
        status: pass
    human_judgment: true
    rationale: "The automated gates prove parseability and key presence, not that the editor honours them: the editor-hygiene group, the C/C++ formatter bindings and the C_Cpp.* group are asserted by inspection only, and RESEARCH assumption A2 (whether a multi-root window surfaces .vscode/extensions.json recommendations at all) is explicitly flagged as unverified and deliberately left unresolved in Phase 1."

duration: 3min
completed: 2026-10-15
status: complete
---

# Phase 1 Plan 02: Root Ignore Rules and the Text-Layer Contract Summary

**A comprehensive root .gitignore that closes the three untracked entries the repository had at plan start, plus a one-owner-per-rule formatting split between .editorconfig (editor) and .gitattributes (index), and the committed VS Code settings in their single home.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-10-15T12:38:13Z
- **Completed:** 2026-10-15T12:42:00Z
- **Tasks:** 3
- **Files created:** 5

## Accomplishments

- The three failures that existed at plan start are now closed by rule rather than by staging or deleting: `git status --porcelain` reports none of `.DS_Store`, `.planning/research/.cache/` or `.planning/state.json`, and all three appear under `--ignored` with `.gitignore` named as their source. The third one mattered most — GSD's state file is timestamped and rewritten on every state transition, and it had been ignored only by this machine's global excludes file, so a fresh clone was dirty on day one.
- All ten paths that must be ignored resolve to the repository's own `.gitignore` as their highest-precedence source, including `.claude/settings.local.json`, which proved nothing before this plan because `~/.config/git/ignore` also matched it locally.
- The secret block (the two header paths, two key/certificate wildcards, the dotenv file and its variants) landed before any code exists, and no pattern in the file is silently disabled — a trailing-comment scan returns 0.
- Every wildcard that could swallow hand-authored input is negated and asserted by path: `sdkconfig.*` is followed by `!sdkconfig.defaults`, the agent-state rules never match the whole `.claude` directory, and the generated state file is named by exact path so a glob over `.planning/` cannot take the tracked planning data with it.
- `.editorconfig` uses only the nine properties the specification defines, so nothing in it is inert; `.gitattributes` forces LF in the index and marks SVG as text, which is what makes a regenerated vector image produce a readable diff instead of "Binary files differ".
- The editor settings live in exactly one committed file, carrying only the PlatformIO key measured to exist in the installed extension.

## Task Commits

Each task was committed atomically:

1. **Task 1: Author the root .gitignore as one deliberate, comprehensive ignore file** - `e3d894b` (chore)
2. **Task 2: The text-layer contract: .editorconfig for the editor and .gitattributes for the index** - `8fb210b` (chore)
3. **Task 3: The editor settings, in their single home, with only the PlatformIO keys measured to exist** - `24fbbcf` (chore)

**Plan metadata:** recorded in the final commit that carries this summary.

## Files Created/Modified

- `.gitignore` - 120 lines, byte-identical to `01-RESEARCH.md` lines 719-838; PlatformIO, ESP-IDF, C/C++ build output, CMake, caches, named generated VS Code files, editors and OS, agent state, secrets, temporary files, GSD research cache
- `.editorconfig` - 32 lines, byte-identical to lines 848-879; the nine real properties only, Markdown trailing-whitespace trimming inverted, tab indent for Makefiles
- `.gitattributes` - 40 lines, byte-identical to lines 883-922; universal LF normalisation, explicit text list including `.mjs` and `.sh`, SVG as text, binary assets and generated firmware artifacts
- `.vscode/settings.json` - editor hygiene group, the column ruler, formatter bindings, Markdown wrap-without-format-on-save, the C/C++ group and one PlatformIO key
- `.vscode/extensions.json` - four recommendations: platformio.platformio-ide, ms-vscode.cpptools, editorconfig.editorconfig, streetsidesoftware.code-spell-checker

## Decisions Made

- **C++ IntelliSense standard is `c++11`, not the scaffold's `c++17`.** The plan's task-3 action says to set the C++ standard "to match the platform contract". The pinned platform is `espressif32@7.1.3` carrying Arduino core 2.0.17, which compiles with `-std=gnu++11` (recorded in `AGENTS.md` and `01-RESEARCH.md`). Writing `c++17` would let the editor accept shared code that the pinned toolchain rejects, which is precisely the class of unverified fact the repository's constraints forbid. Research decision D4 — stating the standard next to the platform pin — stays open and belongs to Phase 3; this choice does not foreclose it, and is recorded here so Phase 3 can revise it deliberately rather than inherit it silently.
- **No `files.exclude` block**, decided explicitly in the plan and honoured here. D-02's prohibition concerns the workspace file's root entry, so an explorer filter here was neither authorised nor forbidden; it is omitted because every added check is a stated cost, and because hiding the build directory in the Explorer would conceal the artifacts a clean-tree check exists to keep out of git.
- **The three files were reproduced byte-identically from the research and then diffed back to their source blocks.** That diff is the evidence that "verbatim" held, and it is cheaper to re-run than an inspection.
- **`REQUIREMENTS.md` was deliberately not modified.** REPO-04 is declared by both `01-02` and `01-05`, so the shared-ID gate defers marking it complete until `01-05` produces its SUMMARY; flipping it now would report a phase requirement as done while a sibling plan is still outstanding. This also avoids a concurrent write to a shared file from three parallel worktrees.

## Deviations from Plan

None - plan executed exactly as written. All five artifacts match their specified content, and no file outside the declared `files_modified` scope was created or edited.

## Issues Encountered

- **One gate clause over-reads `git check-attr`'s output.** Task 2's fourth `<automated>` command ends with `git check-attr binary -- firmware.bin` after three other `check-attr` calls, and its `fails_when` treats any line reported as `unspecified` as a failure. Measured: `git check-attrs diff -- docs/wiring.svg` reports `diff: unspecified`, because `*.svg text` sets the `text` attribute and nothing sets `diff`. `unspecified` is git's default and means diffable — the genuinely failing value would be `diff: unset`, which is what the binary artifact reports (`firmware.bin: diff: unset`, alongside `merge: unset` and `text: unset`). The task's own acceptance criterion — "`docs/wiring.svg` as diffable text ... a generated firmware artifact is reported binary" — is satisfied, and the `fails_when`'s stated intent ("marks a vector image binary") is not met. No file change was made: adding an explicit `diff` attribute to the SVG line would be a semantics-free no-op that departs from the verbatim reproduction the plan mandates. `diff <(sed -n '883,922p' 01-RESEARCH.md) .gitattributes` exits 0.
- No other problems. Task 1's three live failures could not be observed directly in this worktree, because untracked files do not propagate into a fresh worktree checkout; they were reproduced deliberately (created, asserted, removed) so the evidence is a real `git status --porcelain` run rather than a vacuous empty result.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The ignore rules and the text-layer contract are in place ahead of every artifact that will need them: Phase 2's ESP-IDF migration lands on a file that already negates `sdkconfig.defaults`, Phase 4's generated SVG diffs readably by construction, and Phase 6 has nothing to add to the secret block beyond the scanning hook.
- Phase 6 inherits two facts it will want: `.claude/worktrees/` is ignored, so worktree-mode execution does not dirty the tree; and `.planning/state.json` is ignored, so GSD state transitions never dirty it either. Phase 6's CI assertion "a build must not dirty the tree" is therefore testable.
- Phase 7's per-entry skill symlinks stay trackable — `git check-ignore -q .claude/skills/new-homework/SKILL.md` exits 1, asserted here so the property cannot be lost by a later edit.
- The complete clean-tree assertion belongs to plan 01-05; this plan supplies only the three rule-closures it owns.
- Residual: the `.editorconfig` values for line endings, final newline and trailing whitespace are mirrored in `.vscode/settings.json`'s `files.*` group, as the plan's task-3 action mandates. The values are identical, so no rule can contradict another, but the mirror is a second place a future edit would have to touch.

## Self-Check: PASSED
