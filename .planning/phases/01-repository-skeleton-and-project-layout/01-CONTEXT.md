# Phase 1: Repository Skeleton and Project Layout - Context

**Gathered:** 2026-10-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers the repository's physical skeleton, and nothing that later phases own:

- the frozen folder tree, with only the folders this phase needs actually created
- `homework.code-workspace`, **generated** from the filesystem, with a drift check
- the folder-naming grammar (`m01-l03-<slug>`, `project-<slug>`) frozen as a machine-validated regex
- the one-level depth rule made **audible** — a violation reports the rule, not a PlatformIO error
- the first repo-wide sweep script: discovery, id validation, depth-violation detection, loud zero-match failure
- a deliberately authored root `.gitignore` that keeps `git status` clean across a build and an editor session
- `.editorconfig` and `.gitattributes`
- a committed baseline PlatformIO project at `homeworks/project-baseline/` that proves the one-command build
- `.vscode/settings.json` and `.vscode/extensions.json`
- a root `README.md` with a real body, plus correction of two live path traps

**Explicitly not in this phase:** board/env acceptance (Phase 2), shared libraries (Phase 3), wiring artifacts (Phase 4), static checks (Phase 5), hooks and CI (Phase 6), agent rules and the scaffolding skill (Phase 7), the deliverable contract and README index (Phase 8).

</domain>

<decisions>
## Implementation Decisions

### Workspace file (`homework.code-workspace`)
- **D-01:** `homework.code-workspace` is **generated** from the filesystem by a script in `tools/`, with a repo check that fails when regenerating produces a diff. This reuses the repository's own generate-then-diff idiom (ARCHITECTURE Pattern 3) already chosen for the wiring artifacts, and makes the research's named warning sign — "a workspace file that lists fewer homeworks than `homeworks/` contains" — structurally impossible.
- **D-02:** Workspace roots are the literal REPO-01 set: the repo root (`.`), `shared/`, and one entry per homework folder. **No** per-folder `files.exclude` dedupe is added. Accepted consequence: because `.` is a root, each homework also appears nested beneath it, so a homework is visible twice in the Explorer. Revisit only if it actually annoys in daily use.
- **D-03:** Editor settings live in `.vscode/settings.json` only. The workspace file stays a **pure folder list**, which is what makes D-01's generator a pure function of the filesystem rather than a template splicer. The abandoned scaffold duplicated ~25 settings across both files; that duplication is deliberately not carried forward.
- **D-04:** The only PlatformIO IDE workspace key is `platformio-ide.activateProjectOnTextEditorChange: true`. **Measured 2026-10-15** against the installed `platformio.platformio-ide 3.3.4`: `activateProjectOnTextEditorChange` ✅ exists, `autoRebuildAutocompleteIndex` ✅ exists (the scaffold wrote `…AutocompleteCache` ❌ — renamed), `activateOnlyOnPlatformIOProject` ❌ does not exist (removed). The scaffold's two keys were one dead and one wrong. This partially closes research item D11; the extension *choice* (official vs pioarduino fork) remains open but the installed and measured extension is the official one.

### Folder naming and the depth rule
- **D-05:** The id grammar is `m01-l03-<slug>` — lowercase, zero-padded two digits, `m`/`l` prefixes. The **id is the whole folder name**; the trailing `<slug>` is what DELIV-02 calls the "slug" in the README index row. — **Reversibility:** costly — undoing this later renames every homework folder and touches the sweep regex, the generated workspace file, the Phase 7 skill and the README index simultaneously.
- **D-06:** Non-lesson course projects (the final/multi-week project, research gap #6) use a second prefix: `project-<slug>`. The validator's regex becomes a two-branch alternation. Chosen over synthetic module numbers, which would keep one regex at the cost of an id that lies about what the folder is. — **Reversibility:** costly — same blast radius as D-05, though fewer instances exist yet.
- **D-07:** The depth rule is enforced by a **one-level glob plus an explicit violation check**. Discovery globs `homeworks/*/platformio.ini`; separately, any `platformio.ini` found deeper under `homeworks/` fails loudly and names the rule (shared-library paths are project-relative, so `symlink://../../shared/lib/<Name>` cannot resolve from a deeper folder). **This deliberately departs from the research's literal recommendation of `homeworks/**/platformio.ini`** — the recursive glob finds the misplaced project and then dies on a package-not-found error that points at the dependency instead of at the rule that was broken.
- **D-08:** The sweep **validates the id** against the frozen grammar and fails on a malformed name, quoting the expected pattern. This is the enforcement the Phase 7 scaffolding skill leans on to guarantee the sixtieth homework looks like the first.

### Tooling location
- **D-09:** All repo-owned tooling lives in **`tools/`** — one folder, one convention. The research split it across `tools/` (generators, checks) and `scripts/` (pio sweep shell loops); the roadmap's freeze names only `tools/`, so the split is collapsed rather than carried forward.

### Baseline project
- **D-10:** Phase 1 **commits** `homeworks/project-baseline/`. It makes success criteria 1 and 2 provable from a clone rather than only from the phase log, and it becomes Phase 2's acceptance vehicle — which removes the risk the research names as "the first homework being the first thing ever flashed". Accepted consequences: Phase 2 rewrites its `platformio.ini`, and it must be deliberately retired before the Phase 8 README index or it appears as a homework.
- **D-11:** Only the folders Phase 1 needs are created: `tools/` (with the sweep script), `shared/lib/` (tracked by a short `README.md`, because criterion 1 needs the folder to exist for the workspace entry and git cannot commit an empty directory), and `homeworks/` (tracked by the baseline project). **`docs/` waits for Phase 4 and `shared/pio/` waits for Phase 2** — neither gets a placeholder.
- **D-12:** `homeworks/project-baseline/platformio.ini` carries the exact platform pin plus the four N16R8 overrides and `monitor_speed = 115200`, and **deliberately no `upload_port`/`monitor_port`**. The set is the one measured working in `/tmp/pio-n16r8-probe` (build succeeded in 2.62 s, app partition `6,553,600` bytes, `qio_opi` linked). No port is pinned because `pio device list` shows no usable port on this machine and the repository is public — a committed port would be either a guess or a build-breaker on any other machine. Phase 2 adds the port and console decision after the acceptance run.
- **D-13:** The sweep **fails by default** when it matches zero homework projects, with one documented `--allow-empty` flag as the escape hatch. This satisfies criterion 4 literally while keeping the override explicit and named — the same philosophy as D6's "the escape hatch is `SKIP=<hook-id>`, never `--no-verify`". Phase 6's CI never passes the flag, so a green run that built nothing stays impossible there.

### Baseline project content
- **D-14:** `src/main.cpp` prints a serial report — a boot line plus flash size, `psramFound()` and PSRAM size — and touches **no GPIO**. This makes the baseline Phase 2's acceptance vehicle (Phase 2's criterion 2 needs exactly `psramFound()` reported over the monitor) without inventing a single unverified board fact. A blink was rejected because D12 leaves the RGB-LED GPIO unverified (GPIO48 on the initial revision vs GPIO38), and committing `pinMode(48)` is precisely the "invent an unverified pin" failure AGENT-05 forbids.
- **D-15:** The baseline carries a short `README.md` saying what it is and that it is **not** a course homework. This is not the DELIV-01 contract (Phase 8 owns that) — it exists because the folder appears in the Phase 8 index and would otherwise read as an unfinished assignment.
- **D-16:** Environment names are **project-scoped**, derived mechanically from the id — e.g. `[env:projectbaseline_s3]` and `[env:projectbaseline_native]`, with the normalization rule (hyphens stripped from the id, suffix appended) fixed in this phase so Phase 5 does not have to invent it. VERIFY-01's literal names (`esp32s3`, `native`) are treated as illustrative: its intent is "one source tree, two environments", which project-scoped names preserve. Anti-Pattern 10 (verified, platformio-vscode-ide #2320) documents that identical environment names across projects make the IDE build the wrong homework, and `activateProjectOnTextEditorChange` is a *different* mechanism from env-name resolution — research recommends both, so both are done.

### Ignore rules and repository hygiene
- **D-17:** The root `.gitignore` is a **comprehensive, curated, best-practice list** — PlatformIO and build output, C/C++ artifacts, CMake, caches, OS junk, editor state, secrets, agent state — not a minimal one. Two specific requirements: `.pio/` and `compile_commands.json` are unanchored, so they cover every homework at any depth (no `**/` prefix needed), and **`.claude/settings.local.json` must move here** from `~/.config/git/ignore`, where it is currently ignored only on this machine — a fresh clone would otherwise show it as untracked on day one, which is the state criterion 3 forbids. The broad binary globs (`*.bin`, `*.hex`, `*.elf`, `*.a`, `*.map`) are included **with a comment recording the escape hatch**: a `!` negation on its own line, never `git add -f`. Gitignore has no inline comments — a `#` only starts a comment at the beginning of a line, and a trailing comment silently disables the pattern.
- **D-18:** `.vscode/settings.json` and `.vscode/extensions.json` are **committed**. `.vscode/c_cpp_properties.json` and `.vscode/launch.json` are **ignored** — both carry absolute machine-local toolchain paths and are regenerated with a DO NOT MODIFY header. `tasks.json` joins when a real task exists; there is none yet. The specific generated files are named rather than using `.vscode/*` plus negations, so a future generated file is ignored by default rather than committed by accident.
- **D-19:** The secret patterns (`secrets.h`, `include/secrets.h`, `*.pem`, `*.key`) land **now**, because the repository is public, the ignore file is being authored deliberately once, and a credential in public git history is the one failure here that cannot be undone. The scanning hook (gitleaks / detect-secrets) stays Phase 6's job; no `.secrets.baseline` is committed yet.
- **D-20:** Success criterion 3 is **demonstrated by hand in this phase** (build the baseline project, open the workspace, `git status --porcelain` must be empty) with the evidence recorded in the phase log, and **automated in Phase 6** as a "a build must not dirty the tree" assertion inside the CI job. It is not automated here, because it compiles inside a fast check — which D5 explicitly keeps out of pre-commit — and it would duplicate a gate Phase 6 defines once.

### Root config files
- **D-21:** Phase 1 creates `.editorconfig` and `.gitattributes` only. `.clang-format`, `.clang-tidy` and `.markdownlint-cli2.jsonc` wait for Phase 5, because they must be authored next to the pinned analyzer versions — the formatter is LLVM 23.1.3 while `pio check` analyses with LLVM 19.1.0, and checks were renamed across 19/20/22.
- **D-22:** The formatting contract is **split by domain, one owner per rule**: `.editorconfig` owns text-level rules (EOL, final newline, trailing whitespace, per-type indent for Markdown/YAML/JSON); `.clang-format` (Phase 5) alone owns C/C++ indentation and column limit; `.vscode/settings.json` keeps only what editorconfig cannot express (rulers, formatters, `C_Cpp.*`, `platformio-ide.*`). The scaffold had three files carrying the same values.
- **D-23:** **No markdown linting in v1.** It is not in VERIFY-04's list (which names only clang-format, clang-tidy and cppcheck), and adding a checker nobody asked for is the configuration volume PROJECT.md records as why the previous scaffold was abandoned. Revisit only if generated Markdown actually drifts.

### Documentation traps
- **D-24:** `AGENTS.md` and `PROJECT.md` are **corrected in this phase**. `AGENTS.md` says `shared/libs/` (plural) in two places and cites `symlink://../../shared/libs/<Name>`; agents read this file every session, so the trap is live and Phase 3 could create the wrong folder. `PROJECT.md` says `shared/` where REQUIREMENTS.md says `shared/lib/`. CONTEXT.md makes both corrections explicit plan tasks, so the edits stay inside the phase boundary. Known risk: `AGENTS.md` is GSD-generated and a regeneration may revert the fix — worst case returns us to the current state, not worse. `ARCHITECTURE.md` and the other research files are **left untouched** as dated evidence: they deliberately keep contradictions visible, and editing them retroactively erases what was established on 2026-10-15.
- **D-25:** Traps that later phases must see live in a **section in `.planning/PROJECT.md`**, not only here. PROJECT.md is read by every phase's `load_prior_context`, evolves at transitions, and is a project-level document — so one edit covers all eight phases, whereas `01-CONTEXT.md` reaches only this phase's planner and a standalone `TRAPS.md` would be read by no workflow at all.
- **D-26:** `README.md` gets a **short real body now** — what the repository is, how to open `homework.code-workspace`, how to build a homework with one command, where the conventions live. The homework index table stays Phase 8's (DELIV-02). The reason this is Phase 1's job: the workspace file is this phase's artifact, and without a mention in the README nobody — instructor, or the owner in a month — will know it exists.

### Claude's Discretion
- **Sweep script contract and language.** The user declined to discuss this area. Decide: discovery-only (print validated ids in a form Phase 6 can feed to a CI matrix) versus discover-and-execute; and shell vs Node vs Python (measured available: `node` v26.7.0, `python3` 3.13.13). Note the research's constraint that there is no recursive PlatformIO command, so execution is necessarily a loop that accumulates failures rather than stopping at the first.
- **`tools/` as the single tooling folder** (D-09) — a deliberate divergence from the research's `tools/` + `scripts/` split.
- **The exact `.gitignore` line list** (D-17) — user asked for "everything that could be junk or cache, best practice".
- **The exact `.editorconfig` and `.gitattributes` content** (D-21, D-22).
- **The env-name normalization rule's exact form** (D-16).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project brief and requirements
- `.planning/PROJECT.md` — brief, the "Solo maintenance" and "Public repository" constraints that bound every decision here, and the Key Decisions table
- `.planning/REQUIREMENTS.md` § Repository & workspace — REPO-01..REPO-04, this phase's four requirements
- `.planning/ROADMAP.md` § Phase 1 — the goal and the four success criteria; the Overview's naming-freeze sentence
- `.planning/STATE.md` — the naming freeze (closed, do not re-open) and the D1–D12 open-decision list

### Research — layout, workspace, pitfalls
- `.planning/research/ARCHITECTURE.md` § Recommended Project Structure, § Structure Rationale, § Pattern 3 (canonical artifact + drift guard), § Anti-Patterns 7, 9, 10
- `.planning/research/PITFALLS.md` § Pitfall 11 (stale repo-wide glob, gate green on zero matches), § Pitfall 18 (verified as files, not as behaviour), § Pitfall-to-Phase Mapping
- `.planning/research/SUMMARY.md` § Implications for Roadmap → Phase 1, § Open Decisions (D7 naming freeze)
- `.planning/research/STACK.md` — the N16R8 override probe measurements that D-12 commits
- `.planning/research/FEATURES.md` — the "One VS Code multi-root workspace" feature row

### Current tree — evidence to change
- `AGENTS.md` — the GSD-generated project guide; contains the `shared/libs/` trap D-24 corrects
- `README.md` — currently one line
- git branch `vl/init` (read via `git show`, never checked out) — the abandoned scaffold: `scripts/pio-build.sh` (the exit-0 zero-match bug D-13 exists to prevent), `shared/libs/README.md` (documents the rejected `lib_extra_dirs`), `homework.code-workspace` (the emoji-labelled shape and the two dead IDE keys), `.gitignore` (the blocklist)

### Measured workspace facts (2026-10-15)
- `~/.vscode/extensions/platformio.platformio-ide-3.3.4-darwin-arm64/package.json` — the authoritative key list behind D-04
- `~/.config/git/ignore` — the machine-local rule that D-17 moves into the repository

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **No executable code exists yet.** The tracked tree is `AGENTS.md`, `LICENSE`, `README.md` (one line) and `.planning/`. There is no `.gitignore`, no `platformio.ini` anywhere, no `.code-workspace`, and no `homeworks/`, `shared/` or `tools/`.
- Measured working env set at `/tmp/pio-n16r8-probe/platformio.ini` (a scratch project **outside** the repo): `platform = espressif32@7.1.3`, `board = esp32-s3-devkitc-1`, `framework = arduino`, `board_upload.flash_size = 16MB`, `board_build.partitions = default_16MB.csv`, `board_build.arduino.memory_type = qio_opi`, `build_flags = -DBOARD_HAS_PSRAM`, `monitor_speed = 115200`. This is what D-12 commits, minus `upload_speed`.
- `git show vl/init:<path>` reaches the abandoned scaffold's artifacts without checking out the branch.

### Established Patterns
- **Generate → drift check** (ARCHITECTURE Pattern 3). Previously scoped to the wiring artifacts; D-01 extends the same idiom to the workspace file. This is the repository's first instance of it.
- **Fail loudly on zero matches** (Pitfall 11) — a gate that built nothing must never exit 0.
- **Exact version pins, never ranges, never `#develop`** — the project constraint, applied to `platform = espressif32@7.1.3` here.
- **One canonical source per generated artifact** — nothing generated is ever hand-edited.

### Integration Points
- `.vscode/settings.json` ↔ `.editorconfig` ↔ `.clang-format` (Phase 5) — a three-way formatting contract; D-22 gives each rule exactly one owner so no rule can contradict itself.
- `homework.code-workspace` ↔ `homeworks/*/platformio.ini` ↔ the sweep — one folder list, one discovery glob, one id validator; all three must agree on the layout and the grammar.
- `.gitignore` ↔ REPO-04 ↔ success criterion 3 — the ignore file is the whole mechanism that makes a clean `git status` true.
- `shared/lib/README.md` — the only in-tree statement of the frozen naming until Phase 3 fills the folder.
- `homeworks/project-baseline/` ↔ Phase 2's acceptance run — the same project is Phase 1's build proof and Phase 2's flashing vehicle.

</code_context>

<specifics>
## Specific Ideas

- The workspace file is named `homework.code-workspace` — **singular** "homework", matching FEATURES.md and the abandoned scaffold, even though the container is plural (`homeworks/`). Do not "fix" the name.
- The repository opens as ONE window; the instructor is expected to clone and open the workspace file, which is why the README must name it (D-26).
- The user's earlier recollection of a flat root layout was traced to the abandoned `vl/init` scaffold, which really did use root-level `hw-*/` with one-hop `../shared/libs`. A provenance audit across all planning artifacts, plus two adversarial readers (one advocating the flat reading, one checking only path arithmetic), returned `confirms-container`; the `../../` in `lib_deps` proves the two-level depth, while the *name* `homeworks` is pinned independently by the command spelling `pio run -d homeworks/<id>`.
- PlatformIO Core is **not on the interactive PATH** on this machine (`~/.platformio/penv/bin/pio`), so any script that shells out to `pio` needs an explicit path or a `shutil.which`-style pre-check with an actionable message.

</specifics>

<deferred>
## Deferred Ideas

- **`.planning/config.json` sets `claude_md_path: ./.claude/CLAUDE.md`** while the frozen decision is "no `CLAUDE.md` at or above the working directory". A stray `CLAUDE.md` silently switches `AGENTS.md` off for Claude Code while Antigravity keeps reading it. **Phase 7** territory (AGENT-01/AGENT-02) — recorded, not acted on.
- **VS Code extension choice (research D11):** the official `platformio.platformio-ide` is frozen (v3.3.4, last release 2025-01-11) while the pioarduino fork is active. The measurement in D-04 shows the installed official extension supports multi-root and the key we need, which argues for keeping it — but the choice is an IDE decision, independent of the official-platform decision, and is not closed here.
- **`docs/superpowers/` vs the frozen meaning of `docs/`.** The scaffold ignored `docs/superpowers/`; `docs/` is frozen as the generated-wiring-artifacts directory (Phase 4). If Superpowers ever writes design specs into `docs/`, the collision is semantic, not just cosmetic. No action now.
- **The baseline project's retirement.** `homeworks/project-baseline/` must be deliberately retired before the Phase 8 README index lists it as a homework. **Phase 8.**
- **Automating success criterion 3** — the "a build must not dirty the tree" assertion joins the CI job in **Phase 6** (D-20).
- **Markdown linting** — out of v1 (D-23); revisit only if generated Markdown drifts.
- **The research's `tools/` + `scripts/` split** — collapsed into `tools/` (D-09). If the divergence ever causes confusion, the research files are the place it will be noticed.
- **No todos were reviewed or folded** — `todo.match-phase 1` returned zero matches.

</deferred>

---

*Phase: 1-Repository Skeleton and Project Layout*
*Context gathered: 2026-10-15*
