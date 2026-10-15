# Phase 1: Repository Skeleton and Project Layout - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-15
**Phase:** 1-Repository Skeleton and Project Layout
**Areas discussed:** Workspace file, Id format + depth, Baseline project, Ignore-rule scope, Root config files, Baseline content, Doc path traps

**Gray-area selection:** all four initially-offered areas were selected, with the note "я вважаю все важливо на цьому етапі". Three further areas were offered after those completed; the user selected Root config files, Baseline content and Doc path traps, and left **Sweep contract** undiscussed (recorded as Claude's Discretion).

---

## Workspace file

| Option | Description | Selected |
|--------|-------------|----------|
| Generate + drift check | A `tools/` script writes the folder list from the filesystem; a repo check fails on a regenerating diff. Reuses the wiring artifacts' generate-then-diff idiom. | ✓ |
| Hand-maintained list | Edit the workspace file on every new homework. Zero tooling, ~60 manual edits, one silent-failure mode. | |
| Static parent folders only | Three fixed entries; never drifts, but homework folders stop being top-level roots — contradicts criterion 1. | |

**User's choice:** Generate + drift check

| Option | Description | Selected |
|--------|-------------|----------|
| root + `shared/` + each hw | Literal REPO-01 wording; one entry covers `shared/lib/` and `shared/pio/`. Homework folders also appear nested under the root entry. | ✓ |
| root + `shared/lib/` + each hw | The abandoned scaffold's shape; surfaces the library folder specifically, leaves `shared/pio/` out. | |
| `shared/` + dedupe excludes | Same roots plus per-folder `files.exclude` so each folder appears once. | |

**User's choice:** root + `shared/` + each hw

| Option | Description | Selected |
|--------|-------------|----------|
| `.vscode/settings.json` only | Settings apply in both open modes; the workspace file stays a pure folder list, so D-01's generator is a pure function of the filesystem. | ✓ |
| Workspace file only | One file to read; loses settings when the folder is opened directly, and forces the generator to re-emit settings from a template. | |
| Split by scope | Repo-wide keys one place, multi-root keys another. Most correct in principle, most places to look. | |

**User's choice:** `.vscode/settings.json` only

| Option | Description | Selected |
|--------|-------------|----------|
| `activateProjectOnTextEditorChange` | Set the documented multi-root fix; drop the scaffold's two suspect keys. Verify against the installed extension first. | ✓ |
| Port the scaffold's two keys | Keep `activateOnlyOnPlatformIOProject: false` and `autoRebuildAutocompleteCache: true` as they are. | |
| No platformio-ide keys yet | Add when the multi-project flow misbehaves. | |

**User's choice:** `activateProjectOnTextEditorChange` — subsequently **verified by measurement** against `platformio.platformio-ide 3.3.4`: the key exists; `autoRebuildAutocompleteIndex` exists but the scaffold wrote `…AutocompleteCache`; `activateOnlyOnPlatformIOProject` no longer exists. One key was dead, one was renamed.

---

## Id format + depth

| Option | Description | Selected |
|--------|-------------|----------|
| `m01-l03-blink` | Lowercase, zero-padded, m/l prefixes; matches the research's worked example; validator can name the malformed field. | ✓ |
| `01-03-blink` | Bare numbers, shortest in paths; position alone carries the meaning. | |
| `mod01-lesson03-blink` | Fully explicit and self-documenting; longest. | |

**User's choice:** `m01-l03-blink` (id = whole folder name; trailing slug = DELIV-02's "slug")

| Option | Description | Selected |
|--------|-------------|----------|
| `project-<slug>` | A second honest prefix for non-lesson projects; validator regex becomes a two-branch alternation. | ✓ |
| `final-<slug>` | Narrower — a mid-course multi-week project would not fit the word. | |
| Synthetic `m99-p00-<slug>` | One grammar, one regex, at the cost of an id that lies about what the folder is. | |
| Defer the prefix | Leave open; the validator rejects unknown shapes until decided. | |

**User's choice:** `project-<slug>`

| Option | Description | Selected |
|--------|-------------|----------|
| One-level glob + violation check | Discovery globs one level; a separate check fails loudly naming any `platformio.ini` found deeper, with the reason. | ✓ |
| One-level glob only | A too-deep project is invisible; the only signal is "no projects found", not the real mistake. | |
| Recursive `homeworks/**/` | The research's literal recommendation; finds the project then dies on a package-not-found error that points at the dependency, not the rule. | |

**User's choice:** One-level glob + violation check (deliberate departure from the research's literal advice)

| Option | Description | Selected |
|--------|-------------|----------|
| Sweep validates the id | Regex against the frozen grammar; failure quotes the expected pattern. The enforcement the Phase 7 skill leans on. | ✓ |
| No id check | Naming is documentation only; a typo'd folder silently becomes valid. | |
| Warn only | Visible, never blocks — the same class as a green gate that built nothing. | |

**User's choice:** Sweep validates the id

---

## Baseline project

| Option | Description | Selected |
|--------|-------------|----------|
| Commit `homeworks/project-baseline/` | Criteria 1 and 2 provable from a clone; becomes Phase 2's acceptance vehicle, removing "the first thing ever flashed is a homework". | ✓ |
| Ship `homeworks/` empty | Proof runs against a throwaway project; cleanest naming, but the proof lives only in the phase log. | |
| Don't create `homeworks/` yet | Phase 2 creates it; Phase 1 then ends with no evidence for its own criterion 2. | |

**User's choice:** Commit `homeworks/project-baseline/`

| Option | Description | Selected |
|--------|-------------|----------|
| Only what Phase 1 needs | `tools/` with the sweep script, `shared/lib/README.md`, `homeworks/` tracked by the baseline. `docs/` and `shared/pio/` wait. | ✓ |
| Full frozen tree now | Every frozen folder with a placeholder; two or three placeholder files later replaced. | |
| No placeholder in `shared/` | Fewest files; a clone leaves the workspace entry dangling. | |

**User's choice:** Only what Phase 1 needs

| Option | Description | Selected |
|--------|-------------|----------|
| Fail by default + `--allow-empty` | Loud by default per criterion 4; one documented flag as the escape hatch, matching D6's `SKIP=<hook-id>` philosophy. | ✓ |
| Always fail, no override | Simplest contract; a legitimate empty run becomes a hard failure. | |
| Only fail when the caller opts in | Inverts the safe default — a forgotten flag produces silence. | |

**User's choice:** Fail by default + `--allow-empty`

| Option | Description | Selected |
|--------|-------------|----------|
| Pin + four N16R8 overrides, no ports | The measured-working set from `/tmp/pio-n16r8-probe`; no `upload_port`/`monitor_port` because none exists on this machine and the repo is public. | ✓ |
| Platform pin only | Strict phase boundary; a public repo silently targeting the N8 module for one phase. | |
| Overrides + pin the console port now | Commits a guess; a wrong port breaks the build for anyone cloning. | |

**User's choice:** Pin + four N16R8 overrides, no ports

---

## Ignore-rule scope

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal + deliberate | ~15 lines, no bulk artifact globs. | |
| Port the scaffold's ~90-line list | Adds `*.bin`/`*.hex`/`*.elf`/`*.a`/`*.map`/`*.o`/`build/`/`CMakeFiles/`/`.gemini/`/`docs/superpowers/`; six patterns that can silently swallow a file meant to be committed. | ✓ |
| Minimal + the binary globs only | Cheaper than the port, keeps the swallow risk. | |

**User's choice (free text):** "я думаю все, що може бути сміттям та кешем і все в цьому роді, зроби як бест практіс" — i.e. be comprehensive on junk and cache, curated as best practice rather than copied verbatim. Resolved in CONTEXT.md D-17 as a comprehensive curated list **plus** a documented negation escape hatch for the binary globs.

| Option | Description | Selected |
|--------|-------------|----------|
| settings + extensions | Commit `settings.json` and `extensions.json`; ignore the two generated files by name. | ✓ |
| Ignore all, negate the keepers | `.vscode/*` plus negations; a future generated file gets committed by accident. | |
| Ignore `.vscode/` entirely | Reverses the workspace-area settings decision — those settings would have no committed home. | |

**User's choice:** settings + extensions

| Option | Description | Selected |
|--------|-------------|----------|
| Add them now | Four lines, authored once; the repo is public and a credential in history cannot be undone. Scanner stays Phase 6. | ✓ |
| Add with the first Wi-Fi homework | Nothing stops an agent writing `include/secrets.h` mid-task. | |
| Add them plus `.secrets.baseline` | Pre-empts Phase 6 with a scan-config artifact before any scanner exists. | |

**User's choice:** Add them now

| Option | Description | Selected |
|--------|-------------|----------|
| Demonstrate now, automate in Phase 6 | Build + open the workspace + `git status --porcelain` empty, recorded in the phase log; the assertion joins CI in Phase 6. | ✓ |
| Automate it now | Compiles inside a fast check, which D5 keeps out of pre-commit, and duplicates a Phase 6 gate. | |
| Trust the ignore rules | Exactly the "verified as files, not as behaviour" pattern (Pitfall 18). | |

**User's choice:** Demonstrate now, automate in Phase 6

---

## Root config files

| Option | Description | Selected |
|--------|-------------|----------|
| `.editorconfig` + `.gitattributes` | The two purely skeleton-level files; analyzer configs wait for the pinned versions. | ✓ |
| All five config files now | Analyzer configs authored before the analyzer versions are chosen (VERIFY-04). | |
| `.editorconfig` only | Nothing normalizes line endings at the git layer. | |

**User's choice:** `.editorconfig` + `.gitattributes`

| Option | Description | Selected |
|--------|-------------|----------|
| Split by domain | `.editorconfig` = text rules; `.clang-format` = C/C++ style; `.vscode/settings.json` = editor-only keys. One owner per rule. | ✓ |
| Both carry the same values | The scaffold's shape — three files, silent drift. | |
| `.editorconfig` owns everything | Inverts the relationship: the formatter becomes downstream of an editor config. | |

**User's choice:** Split by domain

| Option | Description | Selected |
|--------|-------------|----------|
| Leave markdownlint out of v1 | Not in VERIFY-04's list; unrequested checkers are the volume that killed the last scaffold. | ✓ |
| Add it in Phase 1 | Phase 4 generates Markdown before Phase 5 exists; a config now lets the generator be written conformant. | |
| Add it in Phase 5 | One phase owns pinned checks; the generated netlist exclusion is added retroactively. | |

**User's choice:** Leave markdownlint out of v1

---

## Baseline content

| Option | Description | Selected |
|--------|-------------|----------|
| Серійний звіт, без GPIO | Boot line plus flash size, `psramFound()`, PSRAM size; no GPIO, so no invented board fact. Becomes Phase 2's acceptance vehicle. | ✓ |
| Порожні `setup()`/`loop()` | Smallest committed surface; criterion 2 proves only that it compiles, and Phase 2 rewrites the file. | |
| Блимати RGB-світлодіодом | Most vivid demo; requires `pinMode(48)`, which D12 records as unverified — the AGENT-05 failure. | |

**User's choice:** Серійний звіт, без GPIO

| Option | Description | Selected |
|--------|-------------|----------|
| Плюс короткий README | Says what the folder is and that it is not a course homework; it appears in the Phase 8 index. | ✓ |
| Тільки мінімум PlatformIO | Smallest footprint; `project-baseline` reads as an unfinished assignment. | |
| Плюс скелет майбутнього ДЗ | Early template copy; every element belongs to another phase and gets rewritten. | |

**User's choice:** Плюс короткий README

| Option | Description | Selected |
|--------|-------------|----------|
| Проєктно-локальні назви | e.g. `projectbaseline_s3` / `projectbaseline_native`; preserves VERIFY-01's intent, avoids platformio-vscode-ide #2320. | ✓ |
| Буквально `esp32s3` і `native` | Exact requirement text; identical names across projects is the verified IDE bug. | |
| Загальні назви + саме налаштування | Relies on `activateProjectOnTextEditorChange` alone; research recommends both mechanisms separately. | |

**User's choice:** Проєктно-локальні назви

---

## Doc path traps

| Option | Description | Selected |
|--------|-------------|----------|
| Виправити `AGENTS.md` і `PROJECT.md` | Two one-word corrections remove the trap immediately; CONTEXT.md makes them explicit plan tasks so they stay in phase. | ✓ |
| Записати пастки, нічого не редагувати | Cleanest phase boundary; the `shared/libs/` trap stays live in a file agents read every session, and Phase 3 may create the wrong folder. | |
| Виправити всі три, включно з research | Also edits `ARCHITECTURE.md`, erasing a dated research artifact. | |

**User's choice:** Виправити `AGENTS.md` і `PROJECT.md`; research files left as dated evidence

| Option | Description | Selected |
|--------|-------------|----------|
| Секція в PROJECT.md | Read by every phase's `load_prior_context`; one edit covers all eight phases. | ✓ |
| Лише в 01-CONTEXT.md | Reaches this phase's planner only. | |
| Новий `.planning/TRAPS.md` | Not read by any workflow — it would rot. | |

**User's choice:** Секція в `PROJECT.md`

| Option | Description | Selected |
|--------|-------------|----------|
| Короткий змістовний README | What the repo is, how to open the workspace, one-command build, where the conventions live; index table stays Phase 8's. | ✓ |
| Залишити один рядок до Phase 8 | DELIV-02 owns the README; but this phase's workspace artifact stays undiscoverable. | |
| Мінімальний покажчик | One sentence naming `AGENTS.md` and the workspace file. | |

**User's choice:** Короткий змістовний README

---

## Mid-discussion correction

The user challenged the `homeworks/` container itself — "хіба ми не домовились тримати всі домаки в руті?" — recalling a flat root layout. This was traced to the **abandoned `vl/init` scaffold**, which really did place homework folders at the repo root (`for ini in hw-*/platformio.ini`) with a one-hop `lib_extra_dirs = ../shared/libs`. The frozen requirements (`REPO-02`, `REPO-03`, `PROJECT.md`, `ROADMAP.md`) all specify the container, and `STATE.md` records the naming as closed.

Verified rather than asserted: a 7-agent provenance audit swept every planning artifact plus the `vl/init` branch, followed by two adversarial readers — one advocating the flat-root reading, one auditing only path arithmetic. Both returned `confirms-container`. The auditor noted a precision the freeze sentence hides: the two-hop `../../` proves the project sits two levels below the root but **not** that the container is named `homeworks` — the name is pinned independently by the command spelling `pio run -d homeworks/<id>`.

Three phrasings were flagged as ambiguous-but-not-contradictory, all of them the *workspace* wording: `PROJECT.md` "root, shared libraries, and one folder per homework"; `REQUIREMENTS.md` REPO-01; `ROADMAP.md` criterion 1. A sibling inconsistency was also found — `PROJECT.md` says `shared/` where `REQUIREMENTS.md` says `shared/lib/` — which is what D-24 corrects.

---

## Claude's Discretion

- **Sweep script contract and language** — discovery-only vs discover-and-execute, and shell vs Node vs Python. The area was offered and not selected.
- **`tools/` as the single tooling folder** — the research's `tools/` + `scripts/` split was collapsed without being asked about.
- **The exact `.gitignore` line list** — the user asked for "everything that could be junk or cache, best practice" rather than choosing a specific list.
- **The exact `.editorconfig` and `.gitattributes` content.**
- **The env-name normalization rule's exact form** (hyphens stripped from the id, suffix appended).

## Deferred Ideas

- `.planning/config.json` `claude_md_path: ./.claude/CLAUDE.md` vs the no-`CLAUDE.md` rule — Phase 7
- VS Code extension choice (research D11) — direction recorded, not closed
- `docs/superpowers/` vs the frozen meaning of `docs/` — semantic collision, no action
- Baseline project retirement before the Phase 8 README index — Phase 8
- Automating success criterion 3 — Phase 6
- Markdown linting — out of v1, revisit if generated Markdown drifts
