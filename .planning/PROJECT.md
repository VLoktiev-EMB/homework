# homework — Embedded Coursework Repository

## What This Is

A personal coursework repository for an embedded-development course (C/C++, PlatformIO, ESP32-S3-DevKitC-1). It is the main working tool for every homework and every course project: each homework is its own self-contained PlatformIO project, a shared library folder holds reusable code, and the whole thing opens as one VS Code workspace. The repository is public, and the course instructor reviews the homework through it.

## Core Value

**Every homework stays buildable, demonstrable and self-explanatory long after it was submitted.** A homework written in week 3 must still compile, explain its own wiring, and be demoable in week 40 — without the owner reconstructing anything from memory.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] The repository opens as one VS Code workspace: root, shared libraries, and one folder per homework
- [ ] Each homework is a self-contained PlatformIO project under `homeworks/<id>/`, buildable from the repo root with `pio run -d`
- [ ] A scaffolding skill creates a new homework from a freeform description, in one of two explicit modes: `guide` (teaches, stops, never writes homework logic unprompted) or `auto` (one-shot, no questions)
- [ ] Every homework ships a wiring artifact generated from ONE canonical `diagram.json`: a rendered SVG image, a pin-connection table, and a Mermaid overview
- [ ] Wiring artifacts validate offline in pre-commit (`wokwi-cli lint --warnings-as-errors --offline`), and the same file drives local simulation
- [ ] `shared/lib/` holds reusable modules as real PlatformIO libraries (each with `library.json`), consumed per homework via `lib_deps = Name=symlink://…`
- [ ] Shared code keeps a hardware-abstraction seam so it survives the later migration from Arduino core to ESP-IDF
- [ ] Pure logic in `shared/lib/` is unit-tested on the host via `platform = native`, with no hardware attached
- [ ] Static checks are pinned once and enforced: clang-format, clang-tidy, cppcheck, compiler warnings
- [ ] Pre-commit runs fast checks; pre-push builds only the changed homework projects; CI builds changed projects and lints everything
- [ ] Agent rules are a SHORT `AGENTS.md` plus a few per-topic references and a few skills — deliberately minimal
- [ ] Both harnesses work: Claude Code (primary) and Google Antigravity, with near-equal capability
- [ ] Every homework README is instructor-facing: what was built, how to build it, how to verify it, the wiring
- [ ] AI participation is declared — in the homework README and in commit trailers

### Out of Scope

- **Lecture notes, transcripts and theory** — these live in a separate Obsidian vault; the repository holds homeworks and code only
- **Bluetooth/BLE simulation** — not implemented by Wokwi or QEMU; BLE work is host tests plus real hardware
- **Frozen submission tags** — git history is sufficient; tags would be ceremony for a solo repository
- **`lib_extra_dirs`** — deprecated since PlatformIO Core 6.0 and slated for removal in the next major; replaced by `lib_deps` with `symlink://`
- **The `vl/init` scaffold's volume** — 8 rulebooks and a heavy constitution were abandoned because the configuration overhead outweighed the benefit; specific validated decisions are carried over, the volume is not
- **Wokwi simulation in CI** — deferred until the free-tier quota trade-off is understood (50 simulation-minutes per rolling 30 days, and each run uploads the firmware binary to Wokwi's cloud)
- **Non-ESP32 boards** — the course and hardware are ESP32-S3-DevKitC-1 only for now

## Context

**Course.** Roughly 60 lessons at three per week, organized by modules and lessons; a homework follows each lesson, so the repository will hold dozens of homework folders. No hard deadlines. The instructor reviews via the public repository link and a live demo/defense in class.

**Workstation state (measured on this machine, 2026-10-15).** PlatformIO Core 6.2.0, installed at `~/.platformio/penv/bin/pio` — deliberately NOT on the interactive PATH, so hooks and CI must address it explicitly. Official `platformio/espressif32` 7.1.3, Arduino core 2.0.17, `framework-espidf` 6.1.0, the `native` platform 1.2.1 already installed. pre-commit 4.6.0. VS Code 1.141.2 with PlatformIO IDE 3.3.4, cpptools and a clangd LSP plugin. clang-format, clang-tidy and cppcheck are not installed standalone — they arrive through pre-commit mirrors or PlatformIO's bundled tooling.

**Board.** ESP32-S3-DevKitC-1 carrying an ESP32-S3-WROOM-1 **N16R8** module: **16 MB quad flash and 8 MB octal PSRAM**. Two consequences run through the whole repository. First, PlatformIO's default `board = esp32-s3-devkitc-1` assumes the N8 module (8 MB flash, no PSRAM), so every homework environment must override flash size, partition table and PSRAM build flags — the default configuration is wrong for this hardware. Second, on octal-PSRAM variants **GPIO35/36/37 are consumed by the PSRAM and are not usable** — a hard constraint that generated wiring diagrams and the pin-validation check must enforce. The board has two USB ports — a native USB-OTG port and a UART bridge.

**Hardware inventory.** The board plus basic components (buttons, LEDs, resistors, breadboard) for now. More modules are owned but not yet inventoried; shared drivers are therefore added as homeworks require them, never speculatively.

**Repository.** Public GitHub repository `VLoktiev-EMB/homework`. The working branch is `repo/init`. Branch `vl/init` holds an earlier scaffold (12 commits, pushed): it established a constitution, an `.agents/` tree mirrored into `.claude/` by symlinks, a three-stage pre-commit config, CI, scripts and a workspace file. It was abandoned by the owner for excessive configuration overhead, not for technical failure — several of its decisions were independently verified as correct and are carried forward.

**Two harnesses.** Claude Code is used in practice; Antigravity must work nearly as well. This drives the single-source-of-truth layout for agent rules: `AGENTS.md` at the root (read by both), skills mirrored into each harness's own directory.

**Agent-authored code.** Most code in this repository is written by AI agents. The owner's learning is the point of the course, so the agent's role is chosen per request, never assumed — `guide` mode teaches and stops, `auto` mode one-shots without questions.

**Priorities one year out.** (1) Recall how to wire a given module — diagram, driver and README must reconstruct the circuit in minutes. (2) Presentation as a portfolio — clean commit history and readable READMEs.

## Constraints

- **Tech stack**: PlatformIO + ESP32-S3 + Arduino core (2.x) now, ESP-IDF later — so shared code must not call Arduino APIs directly
- **Version discipline**: pin every tool and platform to an exact version; never use ranges and never `#develop`
- **Budget**: Wokwi's free tier allows 50 simulation-minutes per rolling 30 days — simulation cannot be a per-commit gate
- **Public repository**: the git history is an artifact read by the instructor and possibly employers — commits must be clean and must never contain secrets
- **Solo maintenance**: one person studying full time — every added file and check is a cost, and the design must stay small
- **Language**: all repository artifacts (rules, docs, comments, commit messages) in English
- **Board**: N16R8 module — 16 MB flash and 8 MB octal PSRAM, so board definitions must be overridden and GPIO35/36/37 are unavailable

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Arduino core first, ESP-IDF later | The course starts on Arduino; shared code is kept behind a HAL seam so the switch does not force a rewrite | — Pending |
| Official `platformio/espressif32`, not the pioarduino fork | The owner prefers the official API and the IDF migration follows anyway | — Pending |
| Override the board definition per environment for the N16R8 module | PlatformIO's `esp32-s3-devkitc-1` assumes the N8 (8 MB flash, no PSRAM); this module needs its flash size, partition table and `qio_opi` PSRAM flags set explicitly | — Pending |
| `AGENTS.md` as the single source of truth, no `CLAUDE.md` | A stray `CLAUDE.md` anywhere at or above the working directory makes Claude Code silently ignore `AGENTS.md`; Antigravity reads `AGENTS.md` regardless | — Pending |
| Skills live in `.agents/skills/`, mirrored into `.claude/skills/` by symlink | Skill content is portable between harnesses (both implement the Agent Skills standard) but the directories are not configurable | — Pending |
| `lib_deps = Name=symlink://…` instead of `lib_extra_dirs` | `lib_extra_dirs` is deprecated and scheduled for removal; `symlink://` keeps live edits while being declarative per project | — Pending |
| Wokwi `diagram.json` as the canonical wiring artifact | One file is simultaneously the simulation input, the source of the README image and the source of the pin table — so they cannot disagree | — Pending |
| Render the README image with a repo-owned SVG renderer | Wokwi has no whole-diagram image export, so the image must be generated rather than captured | — Pending |
| Deliberately small agent tooling: short `AGENTS.md`, few references, few skills | The previous scaffold's configuration overhead is why it was abandoned — the volume, not the mechanisms, was the problem | — Pending |
| Two modes of one skill (`guide` / `auto`), never guessed | Teaching needs the agent to stop; speed needs it not to. The intent is per-request, so an unspecified request must ask | — Pending |
| Pre-commit fast, pre-push builds changed projects | Keeps commits cheap while still catching breakage before it leaves the machine | — Pending |
| No `-Werror` initially | The Arduino framework's own headers are not under the owner's control | — Pending |
| Host unit tests (`platform = native`) for pure logic | Free, offline, milliseconds — the highest value per unit of effort, and it forces the hardware seam that the IDF migration also needs | — Pending |
| Commit `.planning/` to the public repository | The reasoning behind the work is part of what the repository documents; a public portfolio benefits from visible process | — Pending |
| Record the accepted override for ROADMAP Phase 1 **criterion 2 second conjunct** as a dated, deliberate deviation | The literal criterion — a project moved one level deeper breaks the build — is unobservable while `homeworks/project-baseline/platformio.ini` declares no `lib_deps`, so nothing fails to resolve; the sweep's `DEPTH RULE VIOLATED` detector names the rule before any child process exists and satisfies the criterion's intent. Plan 01-06's two-arm measurement is the evidence, and Phase 3's added success criterion makes the literal mechanism observable once a `symlink://` shared-library dependency exists | — Accepted override, owner decision 2026-10-15 (deviation recorded in `ROADMAP.md` Phase 1 and in `01-VERIFICATION.md`) |

## Traps for Later Phases

Obligations that outlive Phase 1. They live here rather than in a phase context file because every phase's `load_prior_context` reads this document, whereas a phase context file reaches only one phase.

- **The shared-library folder is `shared/lib/`, singular (D-24).** A surviving `shared/libs/` reference in a dated research file is history, not instruction, and the file agents read every session was corrected in Phase 1. Creating the plural puts every module outside the frozen layout and breaks the `lib_deps = <name>=symlink://../../shared/lib/<name>` path arithmetic, because every shared-library path is relative to the project.
- **`homeworks/project-baseline/` must be deliberately retired before the Phase 8 README index is written (D-10).** It is Phase 1's build proof and Phase 2's acceptance vehicle, not a course homework; left in place it appears in the index as an unexplained assignment.
- **The repo-wide sweep fails by default when it matches zero homework projects (D-13).** A green sweep that built nothing is impossible by construction. The single escape hatch is the named `--allow-empty` flag, never a silent bypass, and Phase 6's CI never passes it.
- **PlatformIO Core is installed but is not on the interactive PATH (D-09).** `pio` resolves only inside the VS Code integrated terminal; anything that shells out to it must resolve the binary explicitly or print the `export PATH="$HOME/.platformio/penv/bin:$PATH"` remedy. The same remedy appears in `README.md`.

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-15 after initialization*
