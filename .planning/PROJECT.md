# homework — Embedded Coursework Repository

## What This Is

A personal coursework repository for an embedded-development course (C/C++, PlatformIO, ESP32-S3-DevKitC-1). It is the main working tool for every homework and every course project: each homework is its own self-contained PlatformIO project, a shared library folder holds reusable code, and the whole thing opens as one VS Code workspace. The repository is public, and the course instructor reviews the homework through it.

## Core Value

**Every homework stays buildable, demonstrable and self-explanatory long after it was submitted.** A homework written in week 3 must still compile, explain its own wiring, and be demoable in week 40 — without the owner reconstructing anything from memory.

## Requirements

### Validated

- ✓ The repository opens as one VS Code workspace: root, shared libraries, and one folder per homework — Phase 1 (`REPO-01`). `homework.code-workspace` is a pure function of the filesystem with a byte-comparison drift check, so it cannot go stale silently.
- ✓ Each homework is a self-contained PlatformIO project under `homeworks/<id>/`, buildable from the repo root with `pio run -d` — Phase 1 (`REPO-02`). Two of its conditions ship as their own requirements and were verified with it: the one-level depth rule, enforced by name before any child process exists (`REPO-03`), and the ignore contract for `.pio/` and `compile_commands.json` (`REPO-04`).
- ✓ Every homework environment overrides the board for the N16R8 module — 16 MB flash, the 16 MB partition table, `qio_opi` memory type, the PSRAM build flag — Phase 2 (`HW-01`). The overrides live in ONE shared fragment, `shared/pio/base.ini`, consumed by each project through `extra_configs`; a clean build links the `qio_opi` IDF library set and yields a `6553600`-byte application partition against the stock board's `3342336`.
- ✓ Every environment pins the platform to an exact version and names its console port explicitly — Phase 2 (`HW-04`). The pin is the literal `espressif32@7.1.3` with no range operator and no branch reference, all three console port keys are non-empty, and the versions the pin resolves to are recorded in `shared/pio/VERSIONS.md` beside it.
- ✓ One dated on-hardware acceptance run goes build → flash → monitor on the real board, and the module reports 16 MB flash and 8 MB octal PSRAM — Phase 2. Read three independent ways: the flasher's connection banner (`Embedded PSRAM 8MB (AP_3v3)`), the flash die (`Detected flash size: 16MB`), and the firmware's own `flash=16777216 psram=1 psramSize=8386279`. The firmware reading is the only one that proves the *build* enabled PSRAM.
- ✓ `shared/lib/` holds reusable modules as real PlatformIO libraries (each with `library.json`), consumed per homework via `lib_deps = Name=symlink://…` — Phase 3 (`SHARED-01`, `SHARED-02`). Three libraries (`emb_hal`, `emb_hal_arduino`, `emb_log`) consumed by the baseline through one comma-separated `lib_deps` line of `symlink://` specs; live edits propagate with no reinstall and no copy, measured.
- ✓ Shared code keeps a hardware-abstraction seam so it survives the later migration from Arduino core to ESP-IDF — Phase 3 (`SHARED-03`). The seam is a C ABI in a framework-free header; exactly ONE shared directory may see a framework header, and both absences are structural (`emb_hal` has no `src/`, the backend has no `include/`). **Caveat carried forward:** the paired requirement `SHARED-04` — "a check fails the commit" — is delivered only as a *detector*. `tools/check-hal-seam.mjs` names each framework include with file and line and exits non-zero, and is falsified by 19 cases, but nothing invokes it on commit until `VERIFY-02` (Phase 6) wires it. `03-VALIDATION.md` carries `nyquist_compliant: false` for exactly this, and `REQUIREMENTS.md` carries a scope annotation on `SHARED-04`.

### Active

- [ ] A scaffolding skill creates a new homework from a freeform description, in one of two explicit modes: `guide` (teaches, stops, never writes homework logic unprompted) or `auto` (one-shot, no questions)
- [ ] Every homework ships a wiring artifact generated from ONE canonical `diagram.json`: a rendered SVG image, a pin-connection table, and a Mermaid overview
- [ ] Wiring artifacts validate offline in pre-commit (`wokwi-cli lint --warnings-as-errors --offline`), and the same file drives local simulation
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

**Board.** ESP32-S3-DevKitC-1 carrying an ESP32-S3-WROOM-1 **N16R8** module: **16 MB quad flash and 8 MB octal PSRAM**. Two consequences run through the whole repository. First, PlatformIO's default `board = esp32-s3-devkitc-1` assumes the N8 module (8 MB flash, no PSRAM), so every homework environment must override flash size, partition table and PSRAM build flags — the default configuration is wrong for this hardware. Second, on octal-PSRAM variants **GPIO35/36/37 are consumed by the PSRAM and are not usable** — a hard constraint that generated wiring diagrams and the pin-validation check must enforce. The board has two USB ports — a native USB-OTG port and a UART bridge; the bridge is a **CH343** on the COM socket, measured in Phase 2 (see Traps), and both sockets enumerate under `/dev/cu.usbmodem*`.

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
| `homework.code-workspace` is generated and guarded by a byte-comparison drift check, never hand-edited | The tree decides the file's content, so the workspace cannot disagree with the folders on disk; a hand edit fails the check instead of silently persisting | — Realized in Phase 1 (`tools/generate-workspace.mjs --check`). Every later phase that adds a homework must re-run the generator. |
| Each homework commits its own PlatformIO-generated `.gitignore` and `.vscode/extensions.json` | The root ignore rules that would otherwise cover them are anchored by an interior slash, so they never reach a nested project directory. Ignoring them instead would leave criterion 3's clean-tree reading unachievable in any fresh checkout | — Realized in Phase 1 for `homeworks/project-baseline/` (commit `3b94058`). Applies to every homework added later. |
| The shared environment fragment owns the `[env]` defaults layer, but `board` and `framework` stay in the project | PlatformIO's ini format can **overwrite** an inherited key but never **unset** one — an empty assignment is a present-but-empty value, not a removal. With `board` and `framework` in the fragment, a `platform = native` environment cannot be configured at all: `board` fails as an unknown id under a native run and `framework = arduino` demands a board of its own. `platform` stays in the fragment because every environment, native included, can overwrite that single key | — Realized in Phase 2, after code review (finding `CR-01`, commit `0ca6098`). Nine of the baseline environment's eleven keys are inherited; `board` and `framework` are declared by the project itself. |
| Record the versions the platform pin resolves to in `shared/pio/VERSIONS.md`, beside the pin | The platform manifest declares the Arduino core as a `~` range while its toolchains are exact, so the pin alone does not determine the environment; without the record an old homework can silently link a different core | — Realized in Phase 2. The source is the package lister's non-verbose form, trimmed to name and version — the verbose form appends a machine-local cache path. |
| The console port glob is the MEASURED `/dev/cu.usbmodem*`, not the documented `/dev/cu.usbserial-*` | The committed `usbserial` pattern matched no node in the device inventory, before or after the board was attached, and PlatformIO refused to flash rather than silently selecting another device (exit 1). The measured port is the CH343 bridge's, and the pattern is re-verified against the inventory, never inferred from documentation | — Realized in Phase 2 (commit `3bb3f87`), on the strength of a before/after `pio device list --json-output` diff. Still a pattern: no literal node and no serial number is committed anywhere. |
| The phase's regression gate reads the RESOLVED environment content, never the fragment's text or the command's exit status | A fragment that cannot be found is not an error — PlatformIO exits 0 and the environment comes out with an empty body, so an exit-status check would pass on a completely unconfigured environment | — Realized in Phase 2: `tools/tests/env-baseline.test.mjs`, six assertions, pure filesystem, no child processes. |

## Traps for Later Phases

Obligations that outlive the phase that produced them. They live here rather than in a phase context file because every phase's `load_prior_context` reads this document, whereas a phase context file reaches only one phase.

- **The shared-library folder is `shared/lib/`, singular (D-24).** A surviving `shared/libs/` reference in a dated research file is history, not instruction, and the file agents read every session was corrected in Phase 1. Creating the plural puts every module outside the frozen layout and breaks the `lib_deps = <name>=symlink://../../shared/lib/<name>` path arithmetic, because every shared-library path is relative to the project.
- **`homeworks/project-baseline/` must be deliberately retired before the Phase 8 README index is written (D-10).** It is Phase 1's build proof and Phase 2's acceptance vehicle, not a course homework; left in place it appears in the index as an unexplained assignment.
- **The repo-wide sweep fails by default when it matches zero homework projects (D-13).** A green sweep that built nothing is impossible by construction. The single escape hatch is the named `--allow-empty` flag, never a silent bypass, and Phase 6's CI never passes it.
- **PlatformIO Core is installed but is not on the interactive PATH (D-09).** `pio` resolves only inside the VS Code integrated terminal; anything that shells out to it must resolve the binary explicitly or print the `export PATH="$HOME/.platformio/penv/bin:$PATH"` remedy. The same remedy appears in `README.md`.
- **The board's USB-to-UART bridge is a CH343 (`USB VID:PID=1A86:55D3`), not the CP2102N (D-03/D-04).** Measured in Phase 2 and falsified against `02-RESEARCH.md` Pitfall 8 and the D-03/D-04 rationale, which are planning artifacts. The measured identity currently appears in no reader-facing file. Any later phase that writes driver or port documentation must use the measured value, not the researched one. The CP2102N statements are history, not instruction — the same class of stale artifact as the `shared/libs/` reference above.
- **The `/dev/cu.usbmodem*` glob cannot separate the board's two USB sockets.** Both enumerate under that prefix, so the pattern identifies "some node belonging to this board", not "the bridge". Flashing is safe either way because both sockets reach the same chip, but a monitor opened on the native USB socket prints nothing, because the acceptance vehicle writes to UART0. The both-sockets-cabled case was never measured — only one socket was cabled at a time. Phase 5 owns the editor/formatter contract and Phase 8 the README index; neither may claim the glob is socket-specific.
- **The board's COM socket is orientation-sensitive on a C-to-C cable.** With the plug the other way round the board receives no power at all, because the socket's CC pull-down is present on one line only. Recorded because it presents exactly as a dead board, and the first instinct — a reflash, a re-seat, or a driver reinstall — cannot fix it.
- **A `platform = native` environment cannot inherit `board` or `framework` from the shared fragment.** PlatformIO can overwrite an inherited key but never unset one, so those two keys must stay declared in the project. Phase 5 introduces the native environment; if it is added by extending the fragment instead, it will fail on an unknown board id.

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
*Last updated: 2026-10-17 after Phase 3*
