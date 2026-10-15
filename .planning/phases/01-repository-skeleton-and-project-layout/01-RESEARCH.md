# Phase 1: Repository Skeleton and Project Layout - Research

**Researched:** 2026-10-15
**Domain:** Repository skeleton — monorepo layout, a generated multi-root VS Code workspace, a repo-owned Node tool layer, ignore/attribute/editorconfig files, and a fail-loud repo-wide sweep
**Confidence:** HIGH for the mechanical core (every load-bearing claim below was measured on this machine on 2026-10-15); MEDIUM for editor/file-format semantics sourced from vendor documentation; LOW tier reported by the seam for doc-derived material (see Sources)

## Summary

This phase is the first executable code in the repository, and almost everything it needs is a *mechanism contract* rather than a library choice. I therefore spent the research budget on measurement instead of discovery: I rebuilt the planned tree in a scratch directory, wrote and ran the two tools the phase calls for, and recorded what actually happened. Every failure mode the four success criteria name was reproduced on purpose so the planner can wire a real assertion to each one rather than assume it.

The four mechanisms were validated end to end. `node tools/generate-workspace.mjs` produces a byte-identical file on re-run and `--check` detects a hand-edit with a readable message. `node tools/sweep-homeworks.mjs` finds `project-baseline`, exits 1 with a rule-naming message on a deeper `platformio.ini`, exits 1 quoting the expected pattern on a malformed id, and exits 1 on zero matches — while `--allow-empty` is the single named escape hatch. `pio run -d homeworks/project-baseline` from a directory containing no `platformio.ini` built in 2.81 s with the app partition at `6,553,600` bytes, and the same command one level deeper died with `PackageException: Can not create a symbolic link for ../../shared/lib/foo, not a directory` — the dependency-shaped error D-07 exists to pre-empt. With a curated `.gitignore`, a full build plus `pio run -t compiledb` left `git status --porcelain` empty.

Three findings materially change the plan. First, **the sweep should be Node, not shell**: I measured the unmatched-glob behaviour in both shells and neither default gives the required semantics — zsh aborts with `no matches found: homeworks/*/platformio.ini` (exit 1, wrong reason, no readable message) while POSIX `sh` leaves the glob literal and exits 0, which is precisely the scaffold's Pitfall 11 bug. Second, **`max_line_length` and `trim_final_newlines` are not EditorConfig properties** — the spec defines nine keys and requires plugins to ignore the rest silently, so two rules the abandoned scaffold's `.editorconfig` "owned" were inert; the ruler rule genuinely belongs in `.vscode/settings.json`, which is what D-22 already says. Third, **success criterion 2's "moving it one level deeper breaks the build" cannot be produced by PlatformIO alone in this phase**, because `project-baseline` carries no `lib_deps` line until Phase 3 — the observable proof in Phase 1 is the sweep's violation detector, and the plan should say so rather than claim a build failure it cannot yet demonstrate.

**Primary recommendation:** Build the tool layer in `tools/` as three dependency-free Node ES modules over one shared `tools/lib/discover.mjs` — a single discovery/validation source of truth that the workspace generator, the sweep, and (via `--list`) the Phase 6 CI matrix all consume — and verify each mechanism against the scratch-tree evidence recorded in this document.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Workspace file (`homework.code-workspace`)
- **D-01:** `homework.code-workspace` is **generated** from the filesystem by a script in `tools/`, with a repo check that fails when regenerating produces a diff. This reuses the repository's own generate-then-diff idiom (ARCHITECTURE Pattern 3) already chosen for the wiring artifacts, and makes the research's named warning sign — "a workspace file that lists fewer homeworks than `homeworks/` contains" — structurally impossible.
- **D-02:** Workspace roots are the literal REPO-01 set: the repo root (`.`), `shared/`, and one entry per homework folder. **No** per-folder `files.exclude` dedupe is added. Accepted consequence: because `.` is a root, each homework also appears nested beneath it, so a homework is visible twice in the Explorer. Revisit only if it actually annoys in daily use.
- **D-03:** Editor settings live in `.vscode/settings.json` only. The workspace file stays a **pure folder list**, which is what makes D-01's generator a pure function of the filesystem rather than a template splicer. The abandoned scaffold duplicated ~25 settings across both files; that duplication is deliberately not carried forward.
- **D-04:** The only PlatformIO IDE workspace key is `platformio-ide.activateProjectOnTextEditorChange: true`. **Measured 2026-10-15** against the installed `platformio.platformio-ide 3.3.4`: `activateProjectOnTextEditorChange` ✅ exists, `autoRebuildAutocompleteIndex` ✅ exists (the scaffold wrote `…AutocompleteCache` ❌ — renamed), `activateOnlyOnPlatformIOProject` ❌ does not exist (removed). The scaffold's two keys were one dead and one wrong. This partially closes research item D11; the extension *choice* (official vs pioarduino fork) remains open but the installed and measured extension is the official one.

#### Folder naming and the depth rule
- **D-05:** The id grammar is `m01-l03-<slug>` — lowercase, zero-padded two digits, `m`/`l` prefixes. The **id is the whole folder name**; the trailing `<slug>` is what DELIV-02 calls the "slug" in the README index row. — **Reversibility:** costly — undoing this later renames every homework folder and touches the sweep regex, the generated workspace file, the Phase 7 skill and the README index simultaneously.
- **D-06:** Non-lesson course projects (the final/multi-week project, research gap #6) use a second prefix: `project-<slug>`. The validator's regex becomes a two-branch alternation. Chosen over synthetic module numbers, which would keep one regex at the cost of an id that lies about what the folder is. — **Reversibility:** costly — same blast radius as D-05, though fewer instances exist yet.
- **D-07:** The depth rule is enforced by a **one-level glob plus an explicit violation check**. Discovery globs `homeworks/*/platformio.ini`; separately, any `platformio.ini` found deeper under `homeworks/` fails loudly and names the rule (shared-library paths are project-relative, so `symlink://../../shared/lib/<Name>` cannot resolve from a deeper folder). **This deliberately departs from the research's literal recommendation of `homeworks/**/platformio.ini`** — the recursive glob finds the misplaced project and then dies on a package-not-found error that points at the dependency instead of at the rule that was broken.
- **D-08:** The sweep **validates the id** against the frozen grammar and fails on a malformed name, quoting the expected pattern. This is the enforcement the Phase 7 scaffolding skill leans on to guarantee the sixtieth homework looks like the first.

#### Tooling location
- **D-09:** All repo-owned tooling lives in **`tools/`** — one folder, one convention. The research split it across `tools/` (generators, checks) and `scripts/` (pio sweep shell loops); the roadmap's freeze names only `tools/`, so the split is collapsed rather than carried forward.

#### Baseline project
- **D-10:** Phase 1 **commits** `homeworks/project-baseline/`. It makes success criteria 1 and 2 provable from a clone rather than only from the phase log, and it becomes Phase 2's acceptance vehicle — which removes the risk the research names as "the first homework being the first thing ever flashed". Accepted consequences: Phase 2 rewrites its `platformio.ini`, and it must be deliberately retired before the Phase 8 README index or it appears as a homework.
- **D-11:** Only the folders Phase 1 needs are created: `tools/` (with the sweep script), `shared/lib/` (tracked by a short `README.md`, because criterion 1 needs the folder to exist for the workspace entry and git cannot commit an empty directory), and `homeworks/` (tracked by the baseline project). **`docs/` waits for Phase 4 and `shared/pio/` waits for Phase 2** — neither gets a placeholder.
- **D-12:** `homeworks/project-baseline/platformio.ini` carries the exact platform pin plus the four N16R8 overrides and `monitor_speed = 115200`, and **deliberately no `upload_port`/`monitor_port`**. The set is the one measured working in `/tmp/pio-n16r8-probe` (build succeeded in 2.62 s, app partition `6,553,600` bytes, `qio_opi` linked). No port is pinned because `pio device list` shows no usable port on this machine and the repository is public — a committed port would be either a guess or a build-breaker on any other machine. Phase 2 adds the port and console decision after the acceptance run.
- **D-13:** The sweep **fails by default** when it matches zero homework projects, with one documented `--allow-empty` flag as the escape hatch. This satisfies criterion 4 literally while keeping the override explicit and named — the same philosophy as D6's "the escape hatch is `SKIP=<hook-id>`, never `--no-verify`". Phase 6's CI never passes the flag, so a green run that built nothing stays impossible there.

#### Baseline project content
- **D-14:** `src/main.cpp` prints a serial report — a boot line plus flash size, `psramFound()` and PSRAM size — and touches **no GPIO**. This makes the baseline Phase 2's acceptance vehicle (Phase 2's criterion 2 needs exactly `psramFound()` reported over the monitor) without inventing a single unverified board fact. A blink was rejected because D12 leaves the RGB-LED GPIO unverified (GPIO48 on the initial revision vs GPIO38), and committing `pinMode(48)` is precisely the "invent an unverified pin" failure AGENT-05 forbids.
- **D-15:** The baseline carries a short `README.md` saying what it is and that it is **not** a course homework. This is not the DELIV-01 contract (Phase 8 owns that) — it exists because the folder appears in the Phase 8 index and would otherwise read as an unfinished assignment.
- **D-16:** Environment names are **project-scoped**, derived mechanically from the id — e.g. `[env:projectbaseline_s3]` and `[env:projectbaseline_native]`, with the normalization rule (hyphens stripped from the id, suffix appended) fixed in this phase so Phase 5 does not have to invent it. VERIFY-01's literal names (`esp32s3`, `native`) are treated as illustrative: its intent is "one source tree, two environments", which project-scoped names preserve. Anti-Pattern 10 (verified, platformio-vscode-ide #2320) documents that identical environment names across projects make the IDE build the wrong homework, and `activateProjectOnTextEditorChange` is a *different* mechanism from env-name resolution — research recommends both, so both are done.

#### Ignore rules and repository hygiene
- **D-17:** The root `.gitignore` is a **comprehensive, curated, best-practice list** — PlatformIO and build output, C/C++ artifacts, CMake, caches, OS junk, editor state, secrets, agent state — not a minimal one. Two specific requirements: `.pio/` and `compile_commands.json` are unanchored, so they cover every homework at any depth (no `**/` prefix needed), and **`.claude/settings.local.json` must move here** from `~/.config/git/ignore`, where it is currently ignored only on this machine — a fresh clone would otherwise show it as untracked on day one, which is the state criterion 3 forbids. The broad binary globs (`*.bin`, `*.hex`, `*.elf`, `*.a`, `*.map`) are included **with a comment recording the escape hatch**: a `!` negation on its own line, never `git add -f`. Gitignore has no inline comments — a `#` only starts a comment at the beginning of a line, and a trailing comment silently disables the pattern.
- **D-18:** `.vscode/settings.json` and `.vscode/extensions.json` are **committed**. `.vscode/c_cpp_properties.json` and `.vscode/launch.json` are **ignored** — both carry absolute machine-local toolchain paths and are regenerated with a DO NOT MODIFY header. `tasks.json` joins when a real task exists; there is none yet. The specific generated files are named rather than using `.vscode/*` plus negations, so a future generated file is ignored by default rather than committed by accident.
- **D-19:** The secret patterns (`secrets.h`, `include/secrets.h`, `*.pem`, `*.key`) land **now**, because the repository is public, the ignore file is being authored deliberately once, and a credential in public git history is the one failure here that cannot be undone. The scanning hook (gitleaks / detect-secrets) stays Phase 6's job; no `.secrets.baseline` is committed yet.
- **D-20:** Success criterion 3 is **demonstrated by hand in this phase** (build the baseline project, open the workspace, `git status --porcelain` must be empty) with the evidence recorded in the phase log, and **automated in Phase 6** as a "a build must not dirty the tree" assertion inside the CI job. It is not automated here, because it compiles inside a fast check — which D5 explicitly keeps out of pre-commit — and it would duplicate a gate Phase 6 defines once.

#### Root config files
- **D-21:** Phase 1 creates `.editorconfig` and `.gitattributes` only. `.clang-format`, `.clang-tidy` and `.markdownlint-cli2.jsonc` wait for Phase 5, because they must be authored next to the pinned analyzer versions — the formatter is LLVM 23.1.3 while `pio check` analyses with LLVM 19.1.0, and checks were renamed across 19/20/22.
- **D-22:** The formatting contract is **split by domain, one owner per rule**: `.editorconfig` owns text-level rules (EOL, final newline, trailing whitespace, per-type indent for Markdown/YAML/JSON); `.clang-format` (Phase 5) alone owns C/C++ indentation and column limit; `.vscode/settings.json` keeps only what editorconfig cannot express (rulers, formatters, `C_Cpp.*`, `platformio-ide.*`). The scaffold had three files carrying the same values.
- **D-23:** **No markdown linting in v1.** It is not in VERIFY-04's list (which names only clang-format, clang-tidy and cppcheck), and adding a checker nobody asked for is the configuration volume PROJECT.md records as why the previous scaffold was abandoned. Revisit only if generated Markdown actually drifts.

#### Documentation traps
- **D-24:** `AGENTS.md` and `PROJECT.md` are **corrected in this phase**. `AGENTS.md` says `shared/libs/` (plural) in two places and cites `symlink://../../shared/libs/<Name>`; agents read this file every session, so the trap is live and Phase 3 could create the wrong folder. `PROJECT.md` says `shared/` where REQUIREMENTS.md says `shared/lib/`. CONTEXT.md makes both corrections explicit plan tasks, so the edits stay inside the phase boundary. Known risk: `AGENTS.md` is GSD-generated and a regeneration may revert the fix — worst case returns us to the current state, not worse. `ARCHITECTURE.md` and the other research files are **left untouched** as dated evidence: they deliberately keep contradictions visible, and editing them retroactively erases what was established on 2026-10-15.
- **D-25:** Traps that later phases must see live in a **section in `.planning/PROJECT.md`**, not only here. PROJECT.md is read by every phase's `load_prior_context`, evolves at transitions, and is a project-level document — so one edit covers all eight phases, whereas `01-CONTEXT.md` reaches only this phase's planner and a standalone `TRAPS.md` would be read by no workflow at all.
- **D-26:** `README.md` gets a **short real body now** — what the repository is, how to open `homework.code-workspace`, how to build a homework with one command, where the conventions live. The homework index table stays Phase 8's (DELIV-02). The reason this is Phase 1's job: the workspace file is this phase's artifact, and without a mention in the README nobody — instructor, or the owner in a month — will know it exists.

### Claude's Discretion
- **Sweep script contract and language.** The user declined to discuss this area. Decide: discovery-only (print validated ids in a form Phase 6 can feed to a CI matrix) versus discover-and-execute; and shell vs Node vs Python (measured available: `node` v26.7.0, `python3` 3.13.13). Note the research's constraint that there is no recursive PlatformIO command, so execution is necessarily a loop that accumulates failures rather than stopping at the first.
- **`tools/` as the single tooling folder** (D-09) — a deliberate divergence from the research's `tools/` + `scripts/` split.
- **The exact `.gitignore` line list** (D-17) — user asked for "everything that could be junk or cache, best practice".
- **The exact `.editorconfig` and `.gitattributes` content** (D-21, D-22).
- **The env-name normalization rule's exact form** (D-16).

### Deferred Ideas (OUT OF SCOPE)
- **`.planning/config.json` sets `claude_md_path: ./.claude/CLAUDE.md`** while the frozen decision is "no `CLAUDE.md` at or above the working directory". A stray `CLAUDE.md` silently switches `AGENTS.md` off for Claude Code while Antigravity keeps reading it. **Phase 7** territory (AGENT-01/AGENT-02) — recorded, not acted on.
- **VS Code extension choice (research D11):** the official `platformio.platformio-ide` is frozen (v3.3.4, last release 2025-01-11) while the pioarduino fork is active. The measurement in D-04 shows the installed official extension supports multi-root and the key we need, which argues for keeping it — but the choice is an IDE decision, independent of the official-platform decision, and is not closed here.
- **`docs/superpowers/` vs the frozen meaning of `docs/`.** The scaffold ignored `docs/superpowers/`; `docs/` is frozen as the generated-wiring-artifacts directory (Phase 4). If Superpowers ever writes design specs into `docs/`, the collision is semantic, not just cosmetic. No action now.
- **The baseline project's retirement.** `homeworks/project-baseline/` must be deliberately retired before the Phase 8 README index lists it as a homework. **Phase 8.**
- **Automating success criterion 3** — the "a build must not dirty the tree" assertion joins the CI job in **Phase 6** (D-20).
- **Markdown linting** — out of v1 (D-23); revisit only if generated Markdown drifts.
- **The research's `tools/` + `scripts/` split** — collapsed into `tools/` (D-09). If the divergence ever causes confusion, the research files are the place it will be noticed.
- **No todos were reviewed or folded** — `todo.match-phase 1` returned zero matches.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REPO-01 | The repository opens as ONE VS Code workspace listing the repo root, `shared/`, and one folder per homework | Workspace-file schema confirmed (top-level `folders`/`settings`/`extensions`/`launch`/`tasks`; relative `folders[].path`; JSONC comments) — see Standard Stack and Code Examples. The generator was written and run; output verified byte-identical on re-run and drift-detected on hand-edit. `folders[]` = `{name:"root",path:"."}`, `{name:"shared",path:"shared"}`, then one entry per discovered id sorted. Because `.` is a root, each homework also appears nested beneath it (D-02, accepted). |
| REPO-02 | Each homework lives at `homeworks/<module>-<lesson>-<slug>/` as a self-contained PlatformIO project, buildable from the root with `pio run -d homeworks/<id>` | Measured: from a directory containing **no** `platformio.ini`, `pio run -d homeworks/project-baseline` returned exit 0 in 2.81 s; `Flash: 4.1% (used 268177 bytes from 6553600 bytes)` — the 16 MB partition table. `pio` is not on the interactive PATH, so the tool layer must resolve it explicitly (verified silent-failure mode below). |
| REPO-03 | Every homework sits exactly one level below `homeworks/`, because every shared-library path in `lib_deps` is relative to the project | Measured with a real `lib_deps = foo=symlink://../../shared/lib/foo` project moved one level deeper: `PackageException: Can not create a symbolic link for ../../shared/lib/foo, not a directory` — fails at dependency-install time, before compiling, and names the dependency rather than the rule. The one-level glob `homeworks/*/platformio.ini` does **not** find the deeper project, which is why the separate violation walk exists (D-07). Detector written and verified to exit 1 naming the rule. |
| REPO-04 | Machine-generated and machine-local artifacts (`.pio/`, `compile_commands.json`) are gitignored, never committed | Measured: unanchored `.pio/` and `compile_commands.json` match at any depth (`git check-ignore -v` resolved `homeworks/m01-l03-x/.pio/env` and `homeworks/m01-l03-x/compile_commands.json` to the root `.gitignore`). Full build + `pio run -t compiledb` left `git status --porcelain` empty. `pio run` creates **only** `.pio/` and (with `compiledb`) `compile_commands.json` inside the project dir and **nothing** at the repo root — a 1,188,872-byte `compile_commands.json` was the only extra file. |
</phase_requirements>

## Architectural Responsibility Map

> This phase has no browser/API tiers. The tiers that matter are the ones a wrong assignment would actually break, so they are named as such.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Homework discovery + id validation | **Repo tool layer (`tools/lib/`)** | — | One regex and one glob must serve the generator, the sweep and the Phase 6 CI matrix; if any of them re-implements discovery, the three can drift (Pitfall 11's warning sign is exactly that drift). |
| Workspace file contents | **Repo tool layer (generator)** | Generated artifact (`homework.code-workspace`) | The file is a pure function of the filesystem; hand-editing it is the failure the drift check exists to catch. |
| Depth-rule enforcement | **Repo tool layer (sweep)** | PlatformIO (incidental, and only once `lib_deps` exists) | PlatformIO's own error names the dependency, not the rule — so the rule must be enforceable without compiling. |
| Build execution | **PlatformIO Core (`pio run -d <id>`)** | Repo tool layer (the loop) | PlatformIO has no recursive command; the loop is ours, but the build verb must stay PlatformIO's so the one-command contract in REPO-02 is literally `pio run -d`. |
| Ignore semantics | **Git (`.gitignore`)** | Repo tool layer (only as a verifier) | Git is the oracle. Never re-implement matching — assert with `git status --porcelain` / `git check-ignore -v`. |
| Text-level formatting rules | **`.editorconfig`** | `.vscode/settings.json` (only for what EditorConfig cannot express) | D-22's one-owner-per-rule contract; see the EditorConfig finding below — two rules the scaffold put here are not real properties. |
| Line-ending / binary normalization | **`.gitattributes`** | — | Applies at the git layer, so it must not duplicate `.editorconfig`'s EOL rule; `.editorconfig` governs the editor, `.gitattributes` governs the index. |
| Editor/IDE settings | **`.vscode/settings.json`** | — | D-03 keeps the workspace file a pure folder list so it stays generatable. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | **v26.7.0** (measured on this machine) | Runtime for every script under `tools/` | Already the architecture's chosen tooling language — the frozen research writes the Phase 4 tools as `tools/render-diagram/render.mjs` and `tools/check-pins.mjs`. D-09 collapses tooling into one folder; one *language* is the same reasoning, and it removes the glob-semantics divergence measured below. |
| `node:test` + `node:assert/strict` | built into v26.7.0 (no install) | Test framework for the tool layer | Zero dependency, zero config, and the same runner shape PlatformIO uses for on-device tests. Measured working: `node --test "tools/**/*.test.mjs"` → `pass 2`. |
| PlatformIO Core | **6.2.0** at `/Users/vloktiev/.platformio/penv/bin/pio` (measured) | The build verb the sweep loops over | The pinned project toolchain. **Not on the interactive PATH** — must be resolved explicitly. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| git | **2.50.1** (measured) | The oracle for ignore semantics | `git status --porcelain` for criterion 3, `git check-ignore -v` when a pattern's behaviour is in doubt. Never a hand-written matcher. |
| VS Code + PlatformIO IDE | 1.141.2 / `platformio.platformio-ide` 3.3.4 (per PROJECT.md and D-04) | Consumes `homework.code-workspace` and `.vscode/settings.json` | Human-only verification of criterion 1; opening a window is not automatable, so it stays a manual UAT step. |
| `node:fs` / `node:path` / `node:child_process` | built in | Filesystem discovery, path joining, `pio` invocation | Everything the tool layer needs. No third-party glob, no `fs-extra`, no argument parser. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| **Node** for the tool layer | **POSIX shell** (the scaffold's choice) | **Rejected on measured evidence.** Unmatched-glob behaviour differs by shell and neither default is correct: `zsh -c 'for f in homeworks/*/platformio.ini; do ...'` printed `zsh:1: no matches found: homeworks/*/platformio.ini` and exited 1 (aborts the script, message names no rule); `/bin/sh -c` with the scaffold's `[ -e "$f" ] \|\| continue` fell through to `exit 0`. The first fails for the wrong reason, the second is Pitfall 11 exactly. Node's `readdirSync` makes zero-match an explicit branch. |
| **Node** for the tool layer | **Python 3.13.13** (measured available) | A genuinely close call and worth recording: Python is guaranteed present wherever PlatformIO Core is, since Core *is* Python, and it has no JSON/glob ergonomics disadvantage. It loses only because Phase 4's renderer is already frozen as Node — adopting Python here means two tooling languages under one `tools/` folder. If a later phase finds Node is not guaranteed on a CI runner where Python is, this is the decision to revisit. |
| **`node:test`** | pytest, or a hand-rolled assert harness | pytest pulls a second runtime for two files' worth of assertions; a hand-rolled harness loses per-test reporting and exit codes. |
| **Explicit `pio` resolution** in the tool layer | Requiring `export PATH="$HOME/.platformio/penv/bin:$PATH"` in every invocation | A pre-check that names the absolute path and the `export` line turns a silent unreadable failure into an actionable message — see Pitfall 3; the silent failure was reproduced. |

**Installation:**

```bash
# Nothing to install. This phase adds no package and no package manager file.
# The tool layer is Node ES modules over the Node standard library only.
# PlatformIO Core 6.2.0 is already present at ~/.platformio/penv/bin/pio.
```

**Version verification:** no third-party package is referenced, so there is no registry version to confirm. The three runtimes this phase depends on were measured directly:

```bash
node --version        # v26.7.0
git --version         # git version 2.50.1 (Apple Git-155)
/Users/vloktiev/.platformio/penv/bin/pio --version   # PlatformIO Core, version 6.2.0
```

*Training-data staleness is not a risk for this phase precisely because the stack is the platform's own standard library plus three already-installed binaries.*

## Package Legitimacy Audit

**This phase installs no external package.** There is no `package.json`, no `requirements.txt`, no `npm install`, and no new PlatformIO dependency — the tool layer is Node ES modules over the Node standard library, and `node:test` ships with the runtime.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| *(none)* | — | — | — | — | — | — |

**Packages removed due to [SLOP] verdict:** none — no package was proposed.
**Packages flagged as suspicious [SUS]:** none.

*Note for later phases: the moment a `package.json` appears (most likely for the Phase 4 `@wokwi/diagram-lint` option), this section stops being trivially empty and the legitimacy gate applies. Keeping Phase 1 dependency-free deliberately postpones that.*

## Architecture Patterns

### System Architecture Diagram

```text
                        THE FROZEN TREE  (the single source of truth)
                        homeworks/<id>/platformio.ini   for each homework
                        shared/            tools/        (no platformio.ini at the root)
                                     |
                                     v
        +-------------------------------------------------------------------+
        |              tools/lib/discover.mjs   -- ONE discovery source      |
        |  ID_PATTERN  ^(?:m[0-9]{2}-l[0-9]{2}|project)-[a-z0-9]+(?:-[a-z0-9]+)*$ |
        |  discoverHomeworks()  -> one-level scan: <id>/platformio.ini      |
        |  findDepthViolations() -> walk: any platformio.ini BELOW <id>/    |
        |  envNames(id)         -> id, hyphens stripped, + _s3 / _native    |
        +-------------------------------------------------------------------+
              |                          |                          |
              v                          v                          v
  tools/generate-workspace.mjs   tools/sweep-homeworks.mjs     Phase 6 CI matrix
      pure fn(tree) -> bytes        --list  -> validated ids   (consumes --list)
              |                      default -> pio run -d loop
              |                          |
              v                          v
   homework.code-workspace        exit 0  all projects built
   (generated; never edited)      exit 1  depth rule violated / malformed id /
              |                           ZERO MATCHES matched / a build failed
              v                          |  (--allow-empty is the ONE escape hatch)
        VS Code window                   v
        repo root + shared +        build evidence; per-project .pio/ regenerated
        every homework                   |
                                         v
                            .gitignore  ->  `git status --porcelain` stays EMPTY
                            (.pio/  compile_commands.json  generated .vscode/*  OS junk)
```

Data-flow reading of the primary use case: a new homework folder appears on disk → `discoverHomeworks` validates its id and returns it → the generator rewrites `homework.code-workspace` → the sweep builds it → the ignore rules keep the build out of git. No arrow points from a hand-edited artifact back into the tree, which is what makes both "generated" artifacts safe.

### Recommended Project Structure

```text
homework/                                  # repo root — carries NO platformio.ini
├── homework.code-workspace                # GENERATED by tools/generate-workspace.mjs
├── .gitignore                             # authored deliberately, once (D-17)
├── .editorconfig                          # text-level rules only (D-22)
├── .gitattributes                         # index-level normalization only
├── AGENTS.md                              # GSD-generated; D-24 corrects two paths
├── README.md                              # short real body (D-26)
├── LICENSE
├── .vscode/
│   ├── settings.json                      # COMMITTED — the only platformio-ide.* key is D-04's
│   ├── extensions.json                    # COMMITTED
│   ├── c_cpp_properties.json              # IGNORED — generated, absolute paths
│   └── launch.json                        # IGNORED — generated, absolute paths
├── tools/                                 # ALL repo-owned tooling lives here (D-09)
│   ├── lib/discover.mjs                   # the single discovery/validation source
│   ├── generate-workspace.mjs             # generate | --check
│   ├── sweep-homeworks.mjs                # --list | (default build) | --allow-empty
│   └── tests/
│       ├── discover.test.mjs
│       ├── generate-workspace.test.mjs
│       └── sweep.test.mjs
├── shared/
│   └── lib/
│       └── README.md                      # the only reason shared/lib is trackable (D-11)
├── homeworks/
│   └── project-baseline/                  # the committed baseline (D-10)
│       ├── platformio.ini                 # D-12's env set; env name from D-16
│       ├── src/main.cpp                   # D-14: serial report, no GPIO
│       └── README.md                      # D-15: says it is not a course homework
└── .planning/                             # committed by owner decision
```

**Explicitly absent, and deliberately so:** `docs/` (Phase 4), `shared/pio/` (Phase 2), `package.json`, any `scripts/` folder (D-09 collapsed it into `tools/`), `.markdownlint-cli2.jsonc` (D-23), `.clang-format` / `.clang-tidy` (Phase 5).

### Pattern 1: Generate → drift check (the repository's first instance)

**What:** `homework.code-workspace` is a pure function of the filesystem. The generator writes it; `--check` compares the on-disk bytes to freshly rendered bytes and exits 1 with a message naming the file and the fix. This is ARCHITECTURE Pattern 3 applied to an artifact the research had not yet scoped to it.

**When to use:** Any artifact that must never disagree with the tree. Phase 4 reuses it for `docs/wiring.svg` + `docs/netlist.md`.

**Determinism is the whole game — three requirements, all verified:**
1. **Sort every list.** `readdirSync` order is filesystem-dependent; an unsorted folder list produces a spurious diff on another machine.
2. **Fix the key order and the serialization.** `JSON.stringify(value, null, 2)` with object literals written in the final order; exactly one trailing `\n`; LF only.
3. **Never emit comments.** VS Code accepts JSONC in a workspace file, which means a hand-added comment is a plausible edit that any byte comparison will flag. Because the generator owns the file, comments must not be part of the format — the header explaining "generated, do not edit" belongs in the README and the file's git history, not inside the file.

Measured: running the generator twice produced a byte-identical file (`diff` empty); hand-replacing the file with `{"folders": []}` made `--check` exit 1 with `homework.code-workspace is STALE.`

**Prefer `--check` over `git diff --exit-code`.** Both catch drift, but `--check` works outside a git checkout, does not depend on the file being tracked, and can print the rule and the remedy instead of a raw diff. The CI-grade invocation can still add the git-diff form as a second belt.

### Pattern 2: One discovery source, many consumers

**What:** `tools/lib/discover.mjs` exports the id grammar, the one-level scan, the depth-violation walk and the env-name derivation. The generator, the sweep and the Phase 6 CI matrix all import it.

**Why it matters:** CONTEXT.md's Integration Points section names the requirement directly — "one folder list, one discovery glob, one id validator; all three must agree on the layout and the grammar." Three independent re-implementations is exactly how the workspace file ends up listing fewer homeworks than `homeworks/` contains (Pitfall 11's warning sign).

**Contract shape:** `discoverHomeworks(repoRoot) -> { found: [{id, dir}], malformed: [name], violations: [path] }` — one call returns everything all three consumers need, so validation can never be skipped by a consumer that only wanted the list.

### Pattern 3: Named-rule failure over tool-native error

**What:** When the sweep finds a deeper `platformio.ini`, it must print the *rule*, not delegate. Measured, the tool's own error is `PackageException: Can not create a symbolic link for ../../shared/lib/foo, not a directory` — accurate but pointed at the dependency.

**When to use:** Every check in this repository. D-07 states the principle; D-13 (`--allow-empty`) and D6's `SKIP=<hook-id>`-never-`--no-verify` are the same philosophy applied to escape hatches.

**Design consequence:** the violation detector must not depend on a build succeeding. It is a pure filesystem walk, so it fires in the same second the folder is misplaced.

### Pattern 4: Fail loudly on zero matches

**What:** Zero discovered projects is an error with its own message and exit 1. Verified: exit 1 with three readable lines; `--allow-empty` exits 0 with one line.

**Why:** Pitfall 11 — a gate that built nothing must never exit 0. The scaffold's `scripts/pio-build.sh` printed "No homework projects yet - nothing to build." and fell through to `exit 0` (reproduced: the `sh` glob probe exited 0 on a zero-match tree).

### Anti-Patterns to Avoid

- **Re-implementing gitignore matching in the tool layer.** Git is the oracle. An over-broad pattern that hides a real source file is invisible until someone clones. Assert with `git status --porcelain`.
- **A `platformio.ini` at the repo root or in `shared/`.** Measured: `pio run -d` on a directory whose `platformio.ini` has no `[env:` section fails with `ProjectEnvsNotAvailableError` (exit 1). A root project would also give the IDE a second candidate for "active project".
- **Hand-editing any generated file.** `homework.code-workspace` today, `docs/*` from Phase 4.
- **Using `pio project init` to create a homework folder.** Measured: it writes its own per-project `.gitignore` (5 bytes, `.pio`) and, with `--ide vscode`, aborts with `ProjectEnvsNotAvailableError` when `platformio.ini` has no `[env:]`. Two ignore files where one is invisible is a trap; create the folder tree deliberately.
- **A bare `.claude/` ignore rule.** Phase 7 tracks `.claude/skills/**` via symlinks. Verified: with the recommended patterns, `.claude/skills/new-homework/SKILL.md` is **not** ignored (`git check-ignore` exit 1).
- **`sdkconfig.*` as an ignore pattern.** Verified to be a real bug in a first-draft list: it silently ignores `sdkconfig.defaults`, which is hand-authored input and must be committed. See Pitfall 5.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Glob matching / directory walking | A hand-written glob matcher, or a shell `for` over a possibly-unmatched glob | `node:fs.readdirSync(dir, {withFileTypes:true})` | The shell version is measurably broken across shells (zsh aborts, sh silently passes). `readdirSync` + a `.sort()` is four lines and behaves identically everywhere. |
| Ignore-file semantics | A "should this file be committed" walker | `git status --porcelain` (assert) / `git check-ignore -v` (diagnose) | gitignore has real subtleties — unanchored patterns, negation that cannot re-include through an excluded parent, directory patterns, and the trailing-comment trap. Git already implements them correctly. |
| Deterministic JSON | Hand-built JSON strings | `JSON.stringify(value, null, 2)` with a fixed key order + one trailing newline | Escaping, unicode and key order are all silently wrong in a hand-built string. |
| A test runner | A bespoke assert/report harness | `node --test` (built in) | Per-test reporting, exit codes and isolation come free. |
| The PlatformIO build verb | Parsing `platformio.ini` to decide what to build | `pio run -d <dir>` | Resolution, dependencies and env selection are PlatformIO's job; a parser would drift on the first override. |
| EditorConfig validation | A linter for `.editorconfig` | The EditorConfig extension + the spec's nine properties | The spec's own answer for an unknown key is "ignore it" — a linter would have to invent a stricter rule than the spec has. |
| A recursive "build everything" command | Anything that pretends PlatformIO has one | The explicit loop in the sweep | `pio run` accepts only `-e/-t/-d/-c`. Verified from `pio run --help`. |

**Key insight:** in this phase almost every "hand-rolled" candidate is a *semantics re-implementation* — glob, ignore, JSON, line endings — and semantics re-implementations fail silently and late. The tool layer should own policy (which ids are legal, what the depth rule is, what to do with zero matches) and delegate mechanism to Node, git and PlatformIO.

## Runtime State Inventory

> Included because D-24 is literally a string replacement (`shared/libs` → `shared/lib`), which is the trigger condition. Findings are short because the repository has no runtime yet.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | **None.** No database, datastore, cache service or object store exists in or around this repository. Verified by reading the tracked tree (`git ls-files` returns only `.planning/**`, `AGENTS.md`, `LICENSE`, `README.md`) — there is no application code. | None. |
| **Live service config** | **None.** No external service holds repository configuration — no CI provider configured, no n8n/Datadog/Tailscale/Cloudflare surface, no Wokwi token. Confirmed by the absence of `.github/workflows/` (Phase 6) and any credential file. | None. |
| **OS-registered state** | **None.** No launchd plist, systemd unit, Task Scheduler entry or pm2 process references this repository. Nothing is registered at the OS level. | None. |
| **Secrets / env vars** | **One item, and it is the phase's real migration.** `~/.config/git/ignore` contains exactly one line — `**/.claude/settings.local.json` — so that file is ignored **only on this machine**. A fresh clone shows it as untracked, which is the state criterion 3 forbids. No secret values are involved; this is ignore-rule state, not credential state. | **Code edit:** add `.claude/settings.local.json` to the repo `.gitignore` (D-17). The machine-local rule may then stay as harmless duplication or be removed; removing it is what proves the repository is self-contained. |
| **Build artifacts** | `homeworks/project-baseline/.pio/` and `homeworks/project-baseline/compile_commands.json` (1,188,872 bytes after a build) — neither exists yet, so neither is currently untracked; they appear the moment the phase builds the baseline. The `vl/init` scaffold exists as **git objects only** (`origin/vl/init`), not working-tree state, so it cannot leak into `git status`. | **Code edit:** the `.gitignore` entries. Nothing to migrate. |

**The canonical question — after every file in the repo is updated, what runtime systems still have the old string cached, stored, or registered?** Answer: nothing but the machine-local git excludes file. The `shared/libs` → `shared/lib` correction (D-24) touches only two committed Markdown files; no runtime, datastore or service has ever stored that path.

## Common Pitfalls

### Pitfall 1: Assuming a shell glob behaves the same in zsh, bash and sh

**What goes wrong:** A shell-based sweep written and tested under one shell silently changes behaviour under another. Measured on this machine:

```text
$ zsh -c 'for f in homeworks/*/platformio.ini; do echo "found $f"; done; echo "reached end"'
zsh:1: no matches found: homeworks/*/platformio.ini      # exit 1, "reached end" never printed
$ /bin/sh -c 'for f in homeworks/*/platformio.ini; do [ -e "$f" ] || continue; done; echo "reached end (sh)"; exit 0'
reached end (sh)                                          # exit 0
```

**Why it happens:** zsh errors on an unmatched glob by default; POSIX shells pass the literal pattern through, and the `[ -e ]` guard then skips it. The harness shell for this project is zsh, so the "test it by hand" run and the hook run can differ.

**How to avoid:** Write the sweep in Node. `readdirSync` returns an empty array, and zero-match becomes an explicit branch you control.

**Warning signs:** the sweep works interactively but a hook reports "no matches found"; or it passes in CI and fails locally.

### Pitfall 2: A repo-wide gate that is green because it matched nothing

**What goes wrong:** Pitfall 11's headline case. The scaffold's `scripts/pio-build.sh` prints a reassuring line and exits 0.

**Why it happens:** the zero-match path is written as a courtesy message rather than a failure, usually because the author was being helpful on day one when the tree really was empty.

**How to avoid:** D-13 — exit 1 with a readable message, plus one documented `--allow-empty`. Verified: zero-match → exit 1 with three lines; `--allow-empty` → exit 0 with one line.

**Warning signs:** a CI run whose log contains no compile output; a sweep that finishes in under a second.

### Pitfall 3: `pio` missing from PATH produces a silent, unreadable failure

**What goes wrong:** Measured. With `pio` not on PATH, a Node sweep using `spawnSync("pio", ...)` plus `stdio: "inherit"` printed **only** `--- pio run -d homeworks/project-baseline` and exited 1. No error text, no cause. `spawnSync`'s `error` (ENOENT) is populated but invisible unless read — `stdio: "inherit"` swallows nothing and reports nothing.

**Why it happens:** PlatformIO Core is deliberately not on the interactive PATH on this machine (AGENTS.md), and `spawnSync`'s child-spawn failure is a separate channel from the child's stderr.

**How to avoid:** Resolve `pio` before the loop — honour a `PLATFORMIO_CORE` override, then `$HOME/.platformio/penv/bin/pio`, then PATH — and on failure print the absolute path and the `export` line. Also branch on `r.error` separately from `r.status`, so a spawn failure and a build failure are distinguishable. Verified: after the pre-check, the sweep built successfully.

**Warning signs:** a hook that fails with no message; "it works when I run it myself".

### Pitfall 4: `pio project init` leaves a second, invisible ignore file

**What goes wrong:** Measured: `pio project init --sample-code --no-install-dependencies` created a **5-byte `.gitignore` containing `.pio`** inside the project. With `--ide vscode` on an env-less `platformio.ini` it aborted with `ProjectEnvsNotAvailableError` and wrote nothing.

**Why it happens:** PlatformIO maintains per-IDE ignore templates; the one for VS Code ships five lines (see Sources) and none of them is `compile_commands.json`, because the template predates clangd.

**How to avoid:** create the homework folder tree deliberately rather than via `pio project init`, or delete the generated `.gitignore` in the same step. Never treat it as a substitute for the root file.

**Warning signs:** `homeworks/<id>/.gitignore` appearing in `git status`; a reviewer asking why one project ignores `.pio` and another does not.

### Pitfall 5: A trailing `#` comment silently disables a `.gitignore` pattern — including a secret pattern

**What goes wrong:** Measured. A `.gitignore` containing

```
*.pem  # certificates
```

does **not** ignore `secret.pem`: `git check-ignore secret.pem` exits 1 (not ignored) and `secret.pem` staged normally. The pattern is the entire literal string `*.pem  # certificates`, which matches nothing.

**Why it happens:** gitignore has no inline comments — `#` starts a comment only at the beginning of a line. Most editors' syntax highlighting does not make this obvious, and the pattern *looks* like every other commented line.

**How to avoid:** D-17 already states the rule. Reinforce with the security consequence: this is the failure mode that would let a private key reach a public repository, in the one file whose entire job is to prevent that. Keep comments on their own lines, always.

**Warning signs:** a comment sitting at the end of a pattern line; a `git status` that shows a `*.pem` or `.env` file as untracked.

### Pitfall 6: `max_line_length` and `trim_final_newlines` are not EditorConfig properties

**What goes wrong:** Rules a file appears to own are inert. The EditorConfig specification defines **nine** properties — `indent_style`, `indent_size`, `tab_width`, `end_of_line`, `charset`, `spelling_language`, `trim_trailing_whitespace`, `insert_final_newline`, `root`. The spec requires cores to accept syntactically valid unknown keys and plugins to **ignore** them, so an unknown key fails silently by design. The abandoned scaffold's `.editorconfig` wrote both `max_line_length = 100` and `trim_final_newlines = true`.

**Why it happens:** both names come from editor ecosystems that do support them (and from VS Code settings with similar names), so they look canonical.

**How to avoid:** D-22 is already correct — `.vscode/settings.json` owns rulers. Drop both keys from `.editorconfig` and let `.vscode/settings.json`'s `editor.rulers` be the single owner of the column guide. Note that `insert_final_newline` **is** real, which is the confusable pair.

**Warning signs:** `.editorconfig` containing a key you cannot find in the spec's table; a rule that "does not seem to apply".

### Pitfall 7: A non-deterministic generator turns the drift check into a flaky test

**What goes wrong:** `readdirSync` order differs between filesystems and platforms. An unsorted folder list regenerates differently, so `--check` fails on a clean tree, and the team learns to ignore it.

**Why it happens:** the generator is written against the local filesystem and looks correct there.

**How to avoid:** sort every list; fix the key order; `JSON.stringify` with an explicit indent; one trailing newline; LF. Verified byte-identical across two runs.

**Warning signs:** a drift check that "sometimes" fails; a workspace file whose folder order differs from the previous commit without a tree change.

### Pitfall 8: `homework.code-workspace` and `homeworks/*/platformio.ini` are discovered by different rules

**What goes wrong:** Criterion 1 says the workspace shows "every homework currently in the tree". If the generator iterates `homeworks/*/` *directories* while the sweep iterates `homeworks/*/platformio.ini`, a folder created but not yet given a `platformio.ini` appears in one and not the other.

**Why it happens:** two natural-looking implementations of "what is a homework".

**How to avoid:** both consume the single `discoverHomeworks()` (Pattern 2). Definition to freeze: **a homework is a directory directly under `homeworks/` whose name matches the id grammar and which contains a `platformio.ini`.** State this in README.md so Phase 7's scaffolding skill reproduces it.

**Warning signs:** a workspace file listing a folder with no buildable project; a sweep that skips a folder the generator wrote.

### Pitfall 9: An over-broad ignore pattern hides a hand-authored file

**What goes wrong:** Measured, with a plausible first-draft list: `sdkconfig.*` ignored `sdkconfig.defaults`. That file is hand-authored input — `espidf.py:138` reads it as the defaults source — and a future ESP-IDF homework would have its configuration silently uncommitted.

**Why it happens:** the pattern is written to catch a generated file and accidentally catches its own input, because the generated and authored names share a prefix.

**How to avoid:** for every wildcard, name the authored file that must survive it and assert it with `git check-ignore -q`. The working pair, verified, is `sdkconfig.*` followed by `!sdkconfig.defaults` (generated `sdkconfig.projectbaseline_s3` ignored; `sdkconfig.defaults` not ignored).

**Warning signs:** a `git status` that omits a file you know you edited; a clone where configuration is missing.

### Pitfall 10: Bare `node --test` picks up tests from anywhere in the tree

**What goes wrong:** Measured. From the repo root, bare `node --test` walked the whole tree and ran a `*.test.mjs` placed in `homeworks/project-baseline/visible/`. It **did** skip dot-directories (`homeworks/project-baseline/.pio/…` and `.hidden/…` were both ignored), which is why `.pio/` is not a problem — but the suite's scope still grows silently with the tree.

**Why it happens:** with no arguments the runner discovers by pattern from the cwd; `node --test <dir>` does not work as a directory scan at all — measured, `node --test tools/` failed with `Error: Cannot find module '/private/tmp/repo-probe/tools'` (`MODULE_NOT_FOUND`).

**How to avoid:** use the quoted glob form, verified working: `node --test "tools/**/*.test.mjs"`. Quote it so the shell does not expand it.

**Warning signs:** a test file inside a homework folder appearing in the repo-wide test output; `MODULE_NOT_FOUND` for a directory argument.

### Pitfall 11: Criterion 2's "moving it one level deeper breaks the build" is not yet demonstrable in this phase

**What goes wrong:** The phase attempts to prove the depth rule by moving `project-baseline` one level deeper, builds, sees it succeed (there is no `lib_deps` yet — Phase 3 adds it), and either quietly drops the proof or claims a failure it did not observe.

**Why it happens:** the success criterion was written describing the steady state, while Phase 1 builds the baseline before any shared library exists. Measured: a project **without** `lib_deps`, placed at `homeworks/m01-l03-x/deeper/`, builds fine; the same project **with** `lib_deps = foo=symlink://../../shared/lib/foo` fails with `PackageException: Can not create a symbolic link for ../../shared/lib/foo, not a directory`.

**How to avoid:** split the criterion into what Phase 1 can actually observe: (a) `pio run -d homeworks/project-baseline` exits 0 from the repo root — build proven; (b) moving the project deeper makes the **sweep** exit 1 with `DEPTH RULE VIOLATED` — rule enforced. Record honestly in the phase log that the PlatformIO-level build failure arrives with Phase 3's first `lib_deps` line, and that the detector is what makes the rule load-bearing now. Do not weaken the detector to manufacture a build failure.

**Warning signs:** a phase log asserting a build break nobody saw; a detector that was replaced by "just try to build it".

### Pitfall 12: An empty directory cannot be committed, so `shared/` has no workspace root

**What goes wrong:** Criterion 1 needs a `shared/` root in the workspace, but git cannot track an empty directory. Verified: after `mkdir -p shared/lib`, `git add -A` staged nothing for it.

**Why it happens:** git tracks files, not directories — a deliberate, permanent design choice.

**How to avoid:** D-11 already answers it — `shared/lib/README.md` is the file that makes the directory exist. Keep it a real, short document (it is also the only in-tree statement of the frozen naming until Phase 3 fills the folder).

**Warning signs:** a workspace root pointing at a path that does not exist after a fresh clone; VS Code showing an error marker on the `shared` folder.

## Code Examples

Every snippet below was executed in a scratch tree at `/tmp/repo-probe` on 2026-10-15 and produced the stated result. They are offered as verified skeletons, not as the only permissible shape.

### The single discovery source — `tools/lib/discover.mjs`

```javascript
// Source: verified working implementation, /tmp/repo-probe/tools/lib/discover.mjs
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

export const HOMEWORKS_DIR = "homeworks";

// D-05 + D-06: the frozen id grammar. The id IS the whole folder name.
export const ID_PATTERN = /^(?:m[0-9]{2}-l[0-9]{2}|project)-[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ID_PATTERN_TEXT = "^(?:m[0-9]{2}-l[0-9]{2}|project)-[a-z0-9]+(?:-[a-z0-9]+)*$";

function directoriesIn(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())   // never follow symlinks out of the repo
    .map((e) => e.name)
    .sort();                          // stable across filesystems
}

/** Find every platformio.ini deeper than homeworks/<id>/ (the depth-rule violation). */
export function findDepthViolations(repoRoot) {
  const base = join(repoRoot, HOMEWORKS_DIR);
  const violations = [];
  const walk = (dir, depth) => {
    for (const name of directoriesIn(dir)) {
      const child = join(dir, name);
      if (depth >= 1 && existsSync(join(child, "platformio.ini"))) {
        violations.push(child.slice(repoRoot.length + 1));
      }
      walk(child, depth + 1);
    }
  };
  walk(base, 0);
  return violations.sort();
}

export function discoverHomeworks(repoRoot) {
  const base = join(repoRoot, HOMEWORKS_DIR);
  const found = [];
  const malformed = [];
  for (const name of directoriesIn(base)) {
    const projectDir = join(base, name);
    if (!existsSync(join(projectDir, "platformio.ini"))) continue;
    if (ID_PATTERN.test(name)) found.push({ id: name, dir: `${HOMEWORKS_DIR}/${name}` });
    else malformed.push(name);
  }
  return { found, malformed, violations: findDepthViolations(repoRoot) };
}

/** D-16: project-scoped env names, hyphens stripped from the id. */
export function envNames(id) {
  const stem = id.replaceAll("-", "");
  return { s3: `${stem}_s3`, native: `${stem}_native` };
}
```

**Grammar behaviour, verified against a candidate list:**

```text
true   "m01-l03-blink"          false  "m1-l3-blink"      false  "m01-l03-"       false  "project-"
true   "m01-l03-blink-led"      false  "m01-l3-blink"     false  "m01-l03"        true   "project-baseline-v2"
true   "project-baseline"       false  "M01-L03-Blink"    false  "hw01-blink"     true   "m99-l99-a"
true   "project-final-project"  false  "m01-l03-Blink"    false  "m01-l03-blink_led"
```

### The generator and its drift check — `tools/generate-workspace.mjs`

```javascript
// Source: verified working implementation, /tmp/repo-probe/tools/generate-workspace.mjs
#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverHomeworks } from "./lib/discover.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WORKSPACE_FILE = join(REPO_ROOT, "homework.code-workspace");

export function renderWorkspace(repoRoot) {
  const { found } = discoverHomeworks(repoRoot);
  const folders = [
    { name: "root",   path: "." },        // REPO-01: the repo root
    { name: "shared", path: "shared" },   // REPO-01: the shared-library tree
    ...found.map((h) => ({ name: h.id, path: h.dir })),
  ];
  // Fixed key order, 2-space indent, LF, exactly one trailing newline.
  return JSON.stringify({ folders }, null, 2) + "\n";
}

const check = process.argv.includes("--check");
const expected = renderWorkspace(REPO_ROOT);
const actual = existsSync(WORKSPACE_FILE) ? readFileSync(WORKSPACE_FILE, "utf8") : null;

if (check) {
  if (actual === expected) { console.log("homework.code-workspace is up to date"); process.exit(0); }
  console.error(
    "homework.code-workspace is STALE.\n" +
      "It is generated from the filesystem and must never be hand-edited.\n" +
      "Run: node tools/generate-workspace.mjs",
  );
  process.exit(1);
}
writeFileSync(WORKSPACE_FILE, expected);
console.log(`wrote ${WORKSPACE_FILE}`);
```

Generated output, verified:

```json
{
  "folders": [
    { "name": "root",   "path": "." },
    { "name": "shared", "path": "shared" },
    { "name": "project-baseline", "path": "homeworks/project-baseline" }
  ]
}
```

*(shown compacted for readability; the generator emits 2-space-indented JSON on one key per line)*

### The sweep — `tools/sweep-homeworks.mjs`

```javascript
// Source: verified working implementation, /tmp/repo-probe/tools/sweep-homeworks.mjs
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverHomeworks, ID_PATTERN_TEXT } from "./lib/discover.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const listOnly = argv.includes("--list");
const allowEmpty = argv.includes("--allow-empty");
const { found, malformed, violations } = discoverHomeworks(REPO_ROOT);

let failed = false;

// 1. The depth rule, named as a rule (D-07).
if (violations.length > 0) {
  failed = true;
  console.error("DEPTH RULE VIOLATED");
  console.error("Every homework must sit exactly one level below homeworks/.");
  console.error("Reason: every shared-library path in lib_deps is relative to the project,");
  console.error("so symlink://../../shared/lib/<name> cannot resolve from a deeper folder.");
  for (const v of violations) console.error(`  deeper platformio.ini found: ${v}`);
}

// 2. The id grammar (D-05/D-06/D-08).
if (malformed.length > 0) {
  failed = true;
  console.error("MALFORMED HOMEWORK ID");
  console.error(`Expected: ${ID_PATTERN_TEXT}`);
  for (const m of malformed) console.error(`  does not match: homeworks/${m}/`);
}
if (failed) process.exit(1);

// 3. Zero matches is a failure, not a success (D-13, Pitfall 11).
if (found.length === 0) {
  if (allowEmpty) { console.log("sweep: no homework projects found (--allow-empty)"); process.exit(0); }
  console.error("sweep: found ZERO homework projects under homeworks/*/platformio.ini");
  console.error("A gate that built nothing must not exit 0.");
  console.error("Pass --allow-empty only if an empty tree is genuinely expected.");
  process.exit(1);
}

if (listOnly) { for (const h of found) console.log(h.id); process.exit(0); }

// 4. PlatformIO Core is NOT on the interactive PATH on this machine.
function resolvePio() {
  if (process.env.PLATFORMIO_CORE) return process.env.PLATFORMIO_CORE;
  const local = join(process.env.HOME ?? "", ".platformio", "penv", "bin", "pio");
  if (existsSync(local)) return local;
  const onPath = spawnSync("pio", ["--version"], { stdio: "ignore" });
  return onPath.error ? null : "pio";
}
const pio = resolvePio();
if (!pio) {
  console.error("PlatformIO Core was not found.");
  console.error("Install it, or point at it explicitly:");
  console.error("  export PLATFORMIO_CORE=$HOME/.platformio/penv/bin/pio");
  process.exit(1);
}

// 5. No recursive PlatformIO command exists: loop, accumulate, never stop early.
let exitCode = 0;
for (const h of found) {
  console.log(`--- ${pio} run -d ${h.dir}`);
  const r = spawnSync(pio, ["run", "-d", h.dir], { cwd: REPO_ROOT, stdio: "inherit" });
  if (r.error) { console.error(`failed to start ${pio}: ${r.error.message}`); exitCode = 1; }
  else if (r.status !== 0) exitCode = 1;
}
if (exitCode !== 0) console.error(`sweep: ${found.length} project(s) checked; at least one failed`);
process.exit(exitCode);
```

**All four failure modes verified, with the observed output:**

```text
$ node tools/sweep-homeworks.mjs                       # zero matches
sweep: found ZERO homework projects under homeworks/*/platformio.ini
A gate that built nothing must not exit 0.
Pass --allow-empty only if an empty tree is genuinely expected.      → exit 1

$ node tools/sweep-homeworks.mjs --allow-empty
sweep: no homework projects found (--allow-empty)                    → exit 0

$ node tools/sweep-homeworks.mjs                       # deeper platformio.ini present
DEPTH RULE VIOLATED
Every homework must sit exactly one level below homeworks/.
Reason: every shared-library path in lib_deps is relative to the project,
so symlink://../../shared/lib/<name> cannot resolve from a deeper folder.
  deeper platformio.ini found: homeworks/m01-l03-x/deeper            → exit 1

$ node tools/sweep-homeworks.mjs                       # folder named hw01-Blink
MALFORMED HOMEWORK ID
Expected: ^(?:m[0-9]{2}-l[0-9]{2}|project)-[a-z0-9]+(?:-[a-z0-9]+)*$
  does not match: homeworks/hw01-Blink/                              → exit 1

$ node tools/sweep-homeworks.mjs --list
project-baseline                                                     → exit 0
```

### The baseline project — `homeworks/project-baseline/`

```ini
; Source: measured working set, /tmp/repo-probe (build [SUCCESS] Took 2.81 seconds)
; D-12: the exact pin + the four N16R8 overrides, and deliberately NO upload_port/monitor_port.
; D-16: the env name is derived mechanically from the id — hyphens stripped, suffix appended.
[env:projectbaseline_s3]
platform = espressif32@7.1.3
board = esp32-s3-devkitc-1
framework = arduino
board_upload.flash_size = 16MB
board_build.partitions = default_16MB.csv
board_build.arduino.memory_type = qio_opi
build_flags = -DBOARD_HAS_PSRAM
monitor_speed = 115200
```

```cpp
// D-14: a serial report and NO GPIO. This is Phase 2's acceptance vehicle.
#include <Arduino.h>
void setup() {
  Serial.begin(115200);
  Serial.printf("flash=%u psram=%d psramSize=%u\n", (unsigned)ESP.getFlashChipSize(),
                (int)psramFound(), (unsigned)ESP.getPsramSize());
}
void loop() {}
```

Measured result — `pio run -d homeworks/project-baseline` from the repository root, a directory with no `platformio.ini` of its own:

```text
Flash: [          ]   4.1% (used 268177 bytes from 6553600 bytes)
========================= [SUCCESS] Took 2.81 seconds =========================
```

`6553600` is `0x640000` — the app partition from `default_16MB.csv`, i.e. the 16 MB override is in effect.

### The verified `.gitignore`

```gitignore
# ===========================================================================
# homework — repository ignore rules
#
# One deliberate file. Everything listed is machine-generated or machine-local
# and nothing here removes anything a reader needs. The escape hatch for a
# legitimate exception is a '!' negation on its OWN line, never `git add -f`.
#
# There are NO inline comments in gitignore: '#' starts a comment only at the
# beginning of a line. A trailing comment becomes part of the pattern and
# silently disables it.
# ===========================================================================

# --- PlatformIO ------------------------------------------------------------
# Unanchored on purpose: these match at ANY depth, so every homework is covered
# without a '**/' prefix (verified with `git check-ignore -v`).
.pio/
.pioenvs/
.piolibdeps/
.pio-cache/
compile_commands.json

# --- ESP-IDF (the later migration) -----------------------------------------
# PlatformIO generates sdkconfig.<env>; sdkconfig.defaults is HAND-AUTHORED
# input and must be committed — hence the negation, which must come after.
sdkconfig
sdkconfig.old
sdkconfig.*
!sdkconfig.defaults
managed_components/

# --- C/C++ build output ----------------------------------------------------
*.o
*.obj
*.lo
*.slo
*.d
*.elf
*.bin
*.hex
*.map
*.a
*.la
*.lib
*.so
*.so.*
*.dylib
*.dll
*.exe
*.out
*.gch
*.pch
*.pdb
*.dwo
*.dSYM/

# --- CMake and other build systems ----------------------------------------
CMakeFiles/
CMakeCache.txt
cmake_install.cmake
install_manifest.txt
vcpkg_installed/

# --- Caches ----------------------------------------------------------------
.cache/
Testing/

# --- VS Code: generated files only, named individually ---------------------
# Deliberately NOT `.vscode/*` plus negations: a future generated file should
# be ignored by default rather than committed by accident.
.vscode/c_cpp_properties.json
.vscode/launch.json
.vscode/.browse.c_cpp.db*
.vscode/ipch/
.vscode/*.local.json
*.code-workspace.bak

# --- Editors and OS --------------------------------------------------------
.idea/
*.swp
*.swo
*~
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
Thumbs.db
desktop.ini

# --- Agent state (machine-local only) --------------------------------------
# NOTE: never ignore `.claude/` as a whole — Phase 7 tracks `.claude/skills/**`.
.claude/settings.local.json
.claude/*.local.json
.claude/worktrees/
.claude/agent-memory-local/
CLAUDE.local.md

# --- Secrets ---------------------------------------------------------------
# These land now because the repository is public and this file is authored
# once. The scanning hook (gitleaks / detect-secrets) is Phase 6.
secrets.h
include/secrets.h
*.pem
*.key
.env
.env.*

# --- Temporary -------------------------------------------------------------
*.tmp
*.log
*.bak
*.orig
*.rej
```

**Validated against a realistic tree.** Staged: `.editorconfig`, `.gitattributes`, `.gitignore`, `.planning/PROJECT.md`, `.vscode/extensions.json`, `.vscode/settings.json`, `AGENTS.md`, `homework.code-workspace`, `homeworks/project-baseline/{platformio.ini,src/main.cpp,include/board_pins.h}`, `LICENSE`, `README.md`, `shared/lib/**`, `tools/**`. Ignored: `homeworks/project-baseline/.pio/`, `homeworks/project-baseline/compile_commands.json`, `.vscode/c_cpp_properties.json`, `.vscode/launch.json`, `.claude/settings.local.json`, `.DS_Store`. And `git check-ignore -q` confirms `.claude/skills/new-homework/SKILL.md` is **not** ignored, so Phase 7 is safe.

> **Deliberately omitted:** a bare `build/` pattern. PlatformIO's output already lives in `.pio/build/`, so a top-level `build/` would only create the risk of silently ignoring a directory someone names `build` on purpose.

### The `.editorconfig` and `.gitattributes` (D-21/D-22)

```ini
# .editorconfig — text-level rules ONLY. C/C++ formatting is .clang-format's
# (Phase 5); rulers and formatters are .vscode/settings.json's. One owner per rule.
#
# Only the nine properties the EditorConfig specification defines are used here.
# An unknown key is accepted by parsers and IGNORED by plugins, so it fails
# silently — do not add `max_line_length` or `trim_final_newlines`.
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 4

[*.{md,markdown}]
indent_size = 2
# Two trailing spaces are a Markdown hard line break; never strip them.
trim_trailing_whitespace = false

[*.{json,jsonc,yml,yaml,ini,cfg,properties}]
indent_size = 2

[*.{c,h,cpp,hpp,cc,ixx}]
indent_size = 4

[*.{sh,bash}]
indent_size = 2

[Makefile]
indent_style = tab
```

```gitattributes
# .gitattributes — index-level normalization ONLY. The editor-level EOL rule is
# .editorconfig's; this file governs what git stores and checks out.

# Normalize every text file to LF in the repository, whatever the contributor's OS.
* text=auto eol=lf

# Explicit text types — defensive, so binary detection can never misfire.
*.c     text
*.h     text
*.cpp   text
*.hpp   text
*.cc    text
*.ini   text
*.json  text
*.jsonc text
*.yml   text
*.yaml  text
*.md    text
*.txt   text
*.mjs   text
*.sh    text
# SVG is TEXT: generating it (Phase 4) only produces a readable diff if git treats
# it as text. Never mark it binary.
*.svg   text

# Binary assets: never normalize, never diff as text.
*.png   binary
*.jpg   binary
*.jpeg  binary
*.gif   binary
*.pdf   binary
*.zip   binary
*.tar   binary

# Generated firmware artifacts: keep them out of diffs and out of language stats.
# linguist-* are GitHub Linguist conventions, not core git attributes.
*.bin   binary -diff -merge linguist-generated=true
*.elf   binary -diff -merge linguist-generated=true
*.hex   binary -diff -merge linguist-generated=true
*.map   binary -diff -merge linguist-generated=true
```

**Two verified semantics behind the above.** `binary` is a built-in macro that expands to `-diff -merge -text`. And `*.svg text` matters: an SVG marked binary would show as `Binary files differ` in review, hiding exactly the drift the Phase 4 guard exists to surface.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| A whole-directory `.claude/skills` symlink (the abandoned scaffold's `c729f79`) | Per-skill-entry symlinks | Undocumented on the directory form; the per-entry form is documented | Phase 7's decision (D10) — noted here only because the Phase 1 layout must not preclude it |
| `lib_extra_dirs` for shared code | `lib_deps = <Name>=symlink://../../shared/lib/<Name>` | Deprecated in Core 6.0 | The `../../` is what makes the depth rule load-bearing; Phase 3 introduces it |
| A `scripts/` folder for shell sweeps plus `tools/` for generators | One `tools/` folder, one language | Roadmap freeze + D-09 | Removes the shell-glob divergence class entirely |
| Workspace-level settings duplicated into `.vscode/settings.json` | Settings live in `.vscode/settings.json` only; the workspace file is a pure folder list | D-03 | Makes the workspace file a pure function of the filesystem, which is what makes D-01's drift check meaningful |

**Deprecated/outdated in this phase's scope:**
- `platformio-ide.activateOnlyOnPlatformIOProject` — **removed** from the installed extension 3.3.4 (D-04, measured). Writing it produces a dead key.
- `platformio-ide.autoRebuildAutocompleteCache` — renamed to `autoRebuildAutocompleteIndex` (D-04, measured). The scaffold wrote the old name.
- `max_line_length` / `trim_final_newlines` in `.editorconfig` — not EditorConfig properties; silently inert (measured against the spec).
- `sdkconfig.*` as a blanket ignore — catches `sdkconfig.defaults`, which is authored input.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | VS Code resolves `folders[].path` relative to the `.code-workspace` file's own location. | Standard Stack, Pattern 1 | The workspace would not open on another machine. Mitigation: this is the documented reason workspace files are portable, and the repo-relative paths are the only sane reading; the *manual* UAT step for criterion 1 covers it. |
| A2 | A multi-root workspace surfaces extension recommendations from each root folder's `.vscode/extensions.json`. | Standard Stack | Recommendations would not appear. VS Code documents `extensions.recommendations` **in the workspace file** for multi-root windows; `.vscode/extensions.json` is documented for folder-level. Low impact either way, and D-18 already commits the file — but if recommendations do not appear on first open, moving them into the workspace file's `extensions` key conflicts with D-03's "pure folder list" and would need a decision. |
| A3 | Node 26's test runner skipping dot-directories is a guaranteed behaviour, not a version accident. | Pitfall 10 | A future Node might descend into `.pio/` and run stray files. Mitigation: the recommended command is the explicit glob `node --test "tools/**/*.test.mjs"`, which does not depend on this at all. |
| A4 | GitHub's `linguist-generated` attribute is honoured for files matched by `*.bin`/`*.elf`/`*.hex`/`*.map`. | Code Examples | Cosmetic only — a generated firmware blob might appear in language statistics. It is already excluded from the repository by `.gitignore`, so the attribute is belt-and-braces. |
| A5 | The `shared/lib/README.md` body proposed here is adequate for D-11. | Recommended Project Structure | Low — the file is a placeholder whose only hard requirement is existence; Phase 3 replaces its substance. |

**No assumption in this table affects a compliance, retention, security or performance requirement.** The security-relevant findings (Pitfalls 3 and 5, and the Runtime State Inventory secrets row) are all backed by measurements recorded above.

## Open Questions

1. **Should the sweep keep `--list` and the build loop in one script, or split them?**
   - What we know: Phase 6's CI needs the discovery half as a matrix; the local/pre-push gate needs the build half. Both were implemented in one script and both work.
   - What's unclear: whether one flag-driven script or two scripts reads better a year from now. D-09 says one *folder*, not one file.
   - Recommendation: keep one script with `--list` — it shares the zero-match and validation logic, which is the part that must never diverge. If it grows past ~150 lines, split at the `discover.mjs` boundary, which is already the seam.

2. **How should the drift check be wired into a gate — `--check`, or `git diff --exit-code`?**
   - What we know: both detect drift; `--check` gives a better message and works outside git; the git-diff form also catches a *deleted* untracked-but-should-exist file.
   - What's unclear: which one Phase 6's pre-commit hook should own. D-20 keeps this phase's automation minimal.
   - Recommendation: `--check` is the mechanism; Phase 6 decides the gate. Do not add a hook in Phase 1.

3. **Is `.claude/settings.local.json` duplication between `~/.config/git/ignore` and the repo file acceptable?**
   - What we know: the machine-local rule exists today; D-17 moves it into the repository. Verified the file is currently ignored only machine-locally.
   - What's unclear: whether to delete the machine-local line as part of this phase.
   - Recommendation: add the repo rule (required) and leave the machine-local one alone (harmless, and removing it is outside this phase's stated boundary). The verification that matters is that a fresh clone with no machine-local rules keeps `git status` clean — testable with `GIT_CONFIG_GLOBAL=/dev/null git status --porcelain`.

4. **Does `README.md` need to state the homework definition explicitly?**
   - What we know: Pitfall 8 shows the generator and the sweep can diverge on "what is a homework". Both now share one implementation.
   - What's unclear: whether the definition belongs in the README, in `shared/lib/README.md`, or only in the tool source.
   - Recommendation: state it in `README.md` in one sentence — the Phase 7 skill and a human reader both need it, and it costs one line.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | every script in `tools/`, `node --test` | ✓ | v26.7.0 (measured) | — (no meaningful fallback; if Node is absent the tool layer cannot run) |
| PlatformIO Core | `pio run -d` in the sweep; the baseline build proof | ✓ | 6.2.0 at `/Users/vloktiev/.platformio/penv/bin/pio` | Resolve by absolute path — **not on the interactive PATH** |
| git | ignore semantics, criterion 3 | ✓ | 2.50.1 (Apple Git-155) | — |
| Python 3 | *not required by this phase* | ✓ | 3.13.13 | Available if the tool-layer language decision is ever revisited |
| VS Code | criterion 1's manual observation | ✓ (per PROJECT.md) | 1.141.2 + `platformio.platformio-ide` 3.3.4 | Cannot be automated; stays a manual UAT step |
| ESP32-S3 board | *not required by this phase* | ✗ | — | Not needed: the baseline is built, not flashed. Phase 2 owns the hardware run. |
| clang-format / clang-tidy / cppcheck | *not required by this phase* (Phase 5) | ✗ | — | Out of scope by D-21 |
| Wokwi CLI | *not required by this phase* (Phase 4) | ✗ | — | Out of scope |

**Missing dependencies with no fallback:**
- None. Every Phase 1 capability was exercised on this machine during research.

**Missing dependencies with fallback:**
- **ESP32-S3 board absent** — irrelevant here; the phase's build proof is a compile, not a flash. Phase 2 owns the physical acceptance run and is where an absent board becomes blocking.
- **The three static analysers are absent** — deliberately out of scope for Phase 1 (D-21).

> The one dependency that *looks* available and is not on PATH is PlatformIO Core. That is the trap: `pio` fails silently from a Node `spawnSync` (Pitfall 3, reproduced). Treat "PlatformIO Core is installed" and "`pio` is on PATH" as two different facts.

## Validation Architecture

> `workflow.nyquist_validation` is absent from `.planning/config.json`, so per the workflow's rule this section is treated as **enabled** and is included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | **`node:test`** with `node:assert/strict` — built into Node v26.7.0, **no install, no config file, no dependency** |
| Config file | **None.** The runner is invoked with an explicit glob; there is no test config to write. |
| Quick run command | `node --test "tools/**/*.test.mjs"` |
| Full suite command | `node --test "tools/**/*.test.mjs"` (identical — the phase's suite is small and fast; measured `duration_ms 34` for two tests) |
| Phase gate | Full suite green, plus the two manual observations below, before `/gsd-verify-work` |

**Verified command behaviour — read this before writing the plan:**

```text
$ node --test "tools/**/*.test.mjs"     →  ℹ tests 2   ℹ pass 2      exit 0   ✅ use this
$ node --test tools/tests/discover.test.mjs →  ℹ pass 2             exit 0   ✅ works
$ node --test tools/                    →  Error: Cannot find module '.../tools'  exit 1  ❌
$ node --test                           →  walks the tree; ran a test found in
                                           homeworks/project-baseline/visible/     ❌ scope grows silently
```

Quoting the glob is required: unquoted, the shell would expand it (and in zsh, error if it matched nothing).

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| REPO-01 | `renderWorkspace()` returns root + `shared` + one entry per discovered id, in sorted order | unit | `node --test "tools/**/*.test.mjs"` (`generate-workspace.test.mjs`) | ❌ Wave 0 |
| REPO-01 | Regenerating an unchanged tree is byte-identical | unit | same file — render twice, compare strings | ❌ Wave 0 |
| REPO-01 | `--check` exits 0 on a current file and 1 with a message on a stale one | integration | `node tools/generate-workspace.mjs --check`; assert exit code after writing a stale file into a temp fixture | ❌ Wave 0 |
| REPO-01 | Opening `homework.code-workspace` in VS Code shows root, `shared/` and the baseline as top-level roots | **manual-only** — justified: opening a window is not automatable; recorded in the phase log per D-20 | human, recorded in the phase log | n/a |
| REPO-02 | `pio run -d homeworks/project-baseline` exits 0 from the repo root | smoke | `pio run -d homeworks/project-baseline` (assert exit 0; assert the size line reports `6553600` free of the 16 MB table) | ❌ Wave 0 (the project itself) |
| REPO-02 | `discoverHomeworks()` finds the baseline and validates its id | unit | `node --test "tools/**/*.test.mjs"` (`discover.test.mjs`) | ❌ Wave 0 |
| REPO-03 | A `platformio.ini` deeper than `homeworks/<id>/` makes the sweep exit 1 naming the rule | unit | `discover.test.mjs` — `findDepthViolations()` against a temp fixture tree | ❌ Wave 0 |
| REPO-03 | The same, end to end through the script | integration | build a fixture tree, run the sweep, assert exit 1 and that stdout contains `DEPTH RULE VIOLATED` | ❌ Wave 0 |
| REPO-03 | `envNames("project-baseline")` → `projectbaseline_s3` / `projectbaseline_native` | unit | `discover.test.mjs` | ❌ Wave 0 |
| REPO-04 | Zero matches → exit 1 with a readable message; `--allow-empty` → exit 0 | integration | sweep against a fixture tree with `homeworks/` empty | ❌ Wave 0 |
| REPO-04 | `.pio/` and `compile_commands.json` are ignored at any depth | integration | `git check-ignore -q homeworks/x/.pio/env` and `.../compile_commands.json` in a fixture repo | ❌ Wave 0 |
| REPO-04 | `git status --porcelain` is empty after a full build and `-t compiledb` | **manual this phase, automated Phase 6** (D-20) | human, recorded in the phase log with the exact `git status --porcelain` output | n/a |

### Sampling Rate

- **Per task commit:** `node --test "tools/**/*.test.mjs"` — measured at ~35 ms, so there is no reason to run it less often.
- **Per wave merge:** the same command plus `node tools/generate-workspace.mjs --check` and `node tools/sweep-homeworks.mjs --list`.
- **Phase gate:** the full suite green, `--check` green, `pio run -d homeworks/project-baseline` exit 0, `git status --porcelain` empty, and the two recorded manual observations (workspace opens correctly; clean tree after build + editor session).

### Wave 0 Gaps

- [ ] `tools/tests/discover.test.mjs` — the id grammar (accept/reject table), `findDepthViolations`, `envNames`
- [ ] `tools/tests/generate-workspace.test.mjs` — determinism, sorted order, the exact folder set, `--check` both ways
- [ ] `tools/tests/sweep.test.mjs` — zero-match exit 1, `--allow-empty` exit 0, malformed id message, depth-violation message (via temp fixture trees, not the live repo)
- [ ] Fixture helper — a small function that builds a throwaway tree under `os.tmpdir()`; **all three test files need it**, so it belongs in `tools/tests/helpers.mjs`
- [ ] No framework install needed — `node:test` is built in. Do **not** add a `package.json` to get a test runner.

**Fixture caution for the planner:** the sweep tests must never run against the repository root, or they will build the real baseline and dirty `.pio/`. Every test that executes the sweep builds its own temp tree from `os.tmpdir()` and asserts on that.

## Security Domain

> `security_enforcement` is `true` in `.planning/config.json` (with `security_asvs_level: 1`, `security_block_on: high`), so this section is included. The honest finding is that most of ASVS does not apply — this phase ships no service, no network endpoint and no authentication surface — but two of the categories do, and one of them governs the phase's highest-consequence file.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | **No** | No principal, no credential, no login surface exists in this phase. |
| V3 Session Management | **No** | No session, no cookie, no token. |
| V4 Access Control | **No** | No authorization decision is made by any artifact in this phase. |
| V5 Input Validation | **Yes** | The homework folder name is untrusted filesystem input that is interpolated into a path (`homeworks/<id>`) and passed to a child process. Control: the frozen id grammar `^(?:m[0-9]{2}-l[0-9]{2}\|project)-[a-z0-9]+(?:-[a-z0-9]+)*$` is applied **before** the value is used, the character class excludes `.` and `/` so traversal is impossible by construction, symlinked directories are never followed (`withFileTypes` + `isDirectory()`), and no shell is involved (`spawnSync` with an argument array, so nothing is word-split or re-interpreted). |
| V6 Cryptography | **No** | Nothing is encrypted, hashed or signed here. **Explicitly: do not hand-roll anything cryptographic in this phase** — there is nothing to do. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| **Credential committed to a public repository** — the one irreversible failure in this project | Information Disclosure | `.gitignore` secret patterns land now (D-19), before any code exists: `secrets.h`, `include/secrets.h`, `*.pem`, `*.key`, `.env`, `.env.*`. **Verified hazard: a trailing `#` comment on such a pattern silently disables it** (measured — `*.pem  # certs` left `secret.pem` untracked-but-committable). Phase 6 adds gitleaks/detect-secrets as the backstop; the ignore file is the first line and this phase's only security deliverable. |
| **Path traversal via a homework folder name** | Tampering | The id regex is the control and is applied before use. Verified: `m01-l03`, `M01-L03-Blink`, `hw01-blink`, `m01-l03-blink_led` and `project-` are all rejected. A name containing `/`, `..` or a shell metacharacter cannot match `[a-z0-9-]`. |
| **Symlink escape during the depth-violation walk** | Tampering / Information Disclosure | The walk uses `readdirSync` with `withFileTypes` and filters to `e.isDirectory()`, which is **false for a symlink**. Verified in the implementation. Without this, a symlink under `homeworks/` could walk the filesystem. The walk is also bounded by `homeworks/` as its root. |
| **Ignore-rule bypass hiding a secret or a source file** | Tampering | Assert with git, never by eye: `git status --porcelain` for the clean-tree criterion and `git check-ignore -v` for any pattern whose behaviour is in doubt. Two real bypasses were found this way and are recorded (Pitfall 5's trailing comment; Pitfall 9's `sdkconfig.*`). |
| **Command injection through the discovered path** | Tampering / Elevation | `spawnSync(pio, ["run", "-d", h.dir], …)` passes an argument array with no shell, so a path is never parsed as a command. Combined with the regex, `h.dir` cannot contain a metacharacter anyway. |
| **Secrets leaking through generated editor state** | Information Disclosure | `.vscode/c_cpp_properties.json` and `.vscode/launch.json` carry absolute machine paths and are ignored by name (D-18), so a machine layout is never published. |

**Security posture summary for the planner:** this phase's security work is (1) authoring the secret patterns correctly and without the trailing-comment trap, (2) applying the id regex before any path use, (3) not following symlinks, and (4) proving the clean-tree property with git rather than by inspection. Nothing else in ASVS L1 has a surface here, and inventing controls for V2/V3/V4/V6 would be the configuration volume PROJECT.md records as why the previous scaffold was abandoned.

## Sources

**Provider note (recorded for honesty about confidence).** The `research-plan` seam indicated `context7` for all five questions. The context7 MCP tool was **not exposed to this agent's toolset**, so per the seam's own fallback table I used the built-in `WebFetch` against primary vendor documentation. The seam classifies `webfetch` at **LOW** confidence; the sources fetched were primary specifications and vendor manuals, which the RESEARCH provenance rules classify as `[CITED: …]`. Both readings are stated rather than reconciled silently. Every claim that carries the plan's weight — the build, the exit codes, the glob behaviour, the ignore semantics, the generator and the sweep — was **measured locally** and is tagged `[VERIFIED: …]` with no ambiguity.

### Primary (HIGH confidence — measured on this machine, 2026-10-15)

- **Scratch tree `/tmp/repo-probe`** — the full mechanism: generator determinism and `--check` drift detection; the sweep's four exit-1 paths plus `--list`; `pio run -d homeworks/project-baseline` → `[SUCCESS] Took 2.81 seconds`, `used 268177 bytes from 6553600 bytes`; the deeper-project failure `PackageException: Can not create a symbolic link for ../../shared/lib/foo, not a directory`; and the clean `git status --porcelain` after build + `-t compiledb`
- **`pio run --help`, `pio project config --help`, `pio --help`** — no recursive command exists; `-d/--project-dir` is the only project selector
- **`pio run -d` exit codes** — `0` (valid env), `1` (`ProjectEnvsNotAvailableError` / `NotPlatformIOProjectError`), `2` (`Invalid value for '-d'`: `Path '…' does not exist`)
- **`pio project init` probes** (`/tmp/pio-gitignore-probe`, `/tmp/pio-ide-probe`, `/tmp/pio-ide-probe2`) — `--sample-code` writes a 5-byte `.gitignore` containing `.pio`; `--ide vscode` on an env-less ini aborts with `ProjectEnvsNotAvailableError` and writes no `.gitignore`
- **`~/.platformio/penv/lib/python3.13/site-packages/platformio/project/integration/tpls/vscode/.gitignore.tpl:1-5`** — read directly, verbatim: `.pio`, `.vscode/.browse.c_cpp.db*`, `.vscode/c_cpp_properties.json`, `.vscode/launch.json`, `.vscode/ipch`. Notably **no** `compile_commands.json`.
- **`~/.platformio/platforms/espressif32/builder/frameworks/espidf.py:106-111,138`** — read directly: `os.path.join(PROJECT_DIR, "sdkconfig.%s" % env.subst("$PIOENV"))` is the generated file (line 109), and `deafult_sdk_config = os.path.join(PROJECT_DIR, "sdkconfig.defaults")` is the hand-authored input (line 138). This is the evidence behind the `sdkconfig.*` + `!sdkconfig.defaults` pair.
- **Shell-glob probes** — `zsh: no matches found: homeworks/*/platformio.ini` (exit 1) vs POSIX `sh` reaching `exit 0` with the scaffold's guard
- **gitignore probes** (`/tmp/ignorecheck`, `/tmp/negprobe2`) — unanchored `.pio/` and `compile_commands.json` match at any depth; `!…/keep.bin` re-includes against `*.bin`; `*.pem  # certificates` leaves `secret.pem` **not** ignored; an empty directory is not staged by `git add -A`; `.claude/skills/…` is not ignored; `sdkconfig.*` alone wrongly ignores `sdkconfig.defaults`
- **Node test-runner probes** — `node --test "tools/**/*.test.mjs"` passes; `node --test tools/` fails `MODULE_NOT_FOUND`; bare `node --test` ran a test from a visible directory in `homeworks/` and skipped dot-directories
- **Installed versions** — Node v26.7.0, Python 3.13.13, git 2.50.1, PlatformIO Core 6.2.0
- **In-repo traps, read verbatim** — `AGENTS.md:45` (`shared/libs/<Module>/`, `symlink://../../shared/libs/<Name>`) and `AGENTS.md:107`; `.planning/PROJECT.md:24,26` (`shared/`); `.planning/REQUIREMENTS.md:26,27,29` (`shared/lib/`)

### Secondary (MEDIUM confidence — official documentation)

- [EditorConfig specification](https://spec.editorconfig.org/) — the nine defined properties; `max_line_length` and `trim_final_newlines` absent; cores accept unknown keys and plugins ignore them; `root = true` preamble semantics `[CITED: spec.editorconfig.org]`
- [gitattributes — git manual](https://git-scm.com/docs/gitattributes) — `binary` ≡ `-diff -merge -text`; `text=auto` is a no-op for binary-detected files; `eol` implies `text`; patterns follow gitignore semantics but negative patterns are forbidden and directory patterns do not recurse; precedence from `GIT_DIR/info/attributes` down `[CITED: git-scm.com/docs/gitattributes]`
- [VS Code Multi-root Workspaces](https://code.visualstudio.com/docs/editing/workspaces/multi-root-workspaces) — relative `folders[].path`; `extensions.recommendations` in the workspace file for multi-root; comments supported `[CITED: code.visualstudio.com/docs/editing/workspaces/multi-root-workspaces]`
- [GitHub Linguist overrides](https://github.com/github-linguist/linguist/blob/main/docs/overrides.md) — `linguist-generated` is "Excluded from stats, hidden in diffs"; also `linguist-vendored`, `linguist-documentation`, `linguist-language`, `linguist-detectable` `[CITED: github.com/github-linguist/linguist]`
- [PlatformIO `platformio.ini` documentation](https://docs.platformio.org/en/latest/projectconf/index.html) — INI sections `[platformio]`/`[env]`, `;` comments; the page itself documents no ignore guidance `[CITED: docs.platformio.org]`

### Tertiary (LOW confidence — needs validation if used as a decision input)

- [PlatformIO VS Code integration page](https://docs.platformio.org/en/latest/integration/ide/vscode.html) — read but says nothing about `.gitignore` or which `.vscode` files are generated; `.vscode/tasks.json` is mentioned only as the Task Runner's output. The generated-file set used above comes from the extension template read locally, **not** from this page.
- Web results on VS Code workspace extension recommendations — confirms `extensions.recommendations` for multi-root and that comments are supported; secondary to the official page `[ASSUMED-adjacent, corroborated by the primary docs page above]`

### Prior project research (read, not re-derived)

- `.planning/research/ARCHITECTURE.md` § Recommended Project Structure, § Structure Rationale, § Pattern 3 (generate-then-diff), § Anti-Patterns 7/9/10
- `.planning/research/PITFALLS.md` § Pitfall 11 (stale glob, green gate on zero matches), § Pitfall 18 (verified as files, not behaviour), § Pitfall-to-Phase Mapping
- `.planning/research/SUMMARY.md` § Implications for Roadmap → Phase 1, § Open Decisions (D7 naming freeze)
- `.planning/research/STACK.md` (the N16R8 override probe), `.planning/research/FEATURES.md` ("One VS Code multi-root workspace" row; the `shared/lib/` depth rule)
- Abandoned scaffold on `origin/vl/init`, read via `git show` — `scripts/pio-build.sh` (the exit-0 zero-match bug), `.gitignore`, `homework.code-workspace`, `.editorconfig`, `.gitattributes`, `.vscode/settings.json`, `shared/libs/README.md`

## Metadata

**Confidence breakdown:**
- **Standard stack — HIGH.** No third-party package is proposed, so nothing depends on training data. The three runtimes were measured, and the "no dependency" choice is verified by the fact that `node:test` ran with no install and the tool layer imports only `node:` built-ins.
- **Mechanism design (generator, drift check, sweep) — HIGH.** The code was written and executed; all four exit-1 paths, the determinism property and the `--list` contract were observed, not reasoned about.
- **Layout and ignore rules — HIGH.** `.gitignore` semantics were asserted with `git check-ignore -v` against a realistic tree rather than assumed, and two genuine defects in a first-draft list were found and fixed this way (`sdkconfig.*`, and the trailing-comment trap reproduced deliberately).
- **Architecture — HIGH for the responsibilities, MEDIUM for the workspace-file details.** The tier map follows directly from the measured error modes. The MEDIUM parts are `folders[].path` resolution and whether workspace-level vs folder-level extension recommendations apply (A1, A2) — both are doc-derived, neither is load-bearing, and criterion 1's manual observation covers them.
- **File-format semantics (EditorConfig, gitattributes) — MEDIUM.** Sourced from primary specifications; the seam's provider tier for webfetch is LOW, and the editorconfig finding in particular is a *negative* claim about the spec's property table (a positive present constraint: the table defines nine keys and the spec requires plugins to ignore others). It is safe to act on because acting on it means *removing* two keys, and a removed inert key cannot break anything either way.
- **Pitfalls — HIGH.** Eleven of the twelve were reproduced on this machine; the twelfth (Pitfall 6) rests on the EditorConfig specification's own property table, which is a present constraint rather than an absence.

**Research date:** 2026-10-15
**Valid until:** **~90 days (2027-01-13)** for the layout, the ignore rules and the tool contracts — these are pinned to the repository's own decisions and the pinned toolchain, so they do not drift with upstream releases. Re-verify sooner if: PlatformIO Core is upgraded past 6.2.0 (the `sdkconfig`/vscode templates and exit codes are Core-version-specific), Node is upgraded across a major (the test-runner discovery behaviour in Pitfall 10 is version-sensitive), or Phase 3 introduces the first `lib_deps` line (which converts Pitfall 11 from an enforced-rule-only proof into a real build failure, and the criterion-2 wording can then be satisfied literally).
