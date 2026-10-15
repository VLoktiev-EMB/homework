# Roadmap: homework — Embedded Coursework Repository

## Overview

**Milestone v1.0 — Prove the loop on one real homework.**

This milestone turns an empty public repository into the working tool for every homework in an embedded course. The journey is: freeze the tree and the folder-depth rule once, before any mechanism depends on them; prove the physical board end-to-end from a pinned environment, because PlatformIO's default board definition describes the wrong module; put shared code behind a real hardware seam so it can be tested on the host and survive the later ESP-IDF migration; make one canonical `diagram.json` the single source of the README image, the pin table and the simulator, with a machine-readable pin database that rejects illegal wiring; pin the static checks and the host test environment; wire the same checks into pre-commit, pre-push and CI so a check can never exist in one gate and be missing from another; build the agent funnel through which all of the above is reproduced dozens of times, without re-opening the abandoned scaffold's configuration volume; and finish by running the entire loop on one real course homework that the instructor can read.

Infrastructure is deliberately front-loaded but never terminal: Phase 2 is already a physical end-to-end acceptance run, and the milestone is not done until Phase 8 has shipped a real homework through the whole pipeline.

Phase naming is frozen as `shared/lib/` (one real PlatformIO library per module), `tools/` for the repository's own tooling, `homeworks/<module>-<lesson>-<slug>/`, and `docs/` for generated artifacts.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Repository Skeleton and Project Layout** - The decided tree, one VS Code workspace, the depth rule, and ignore rules frozen before anything is built on them
- [ ] **Phase 2: Board and Environment Baseline (N16R8 Acceptance Gate)** - The N16R8 module proven end-to-end from a pinned, explicitly-ported environment
- [ ] **Phase 3: Shared Libraries and the Hardware Seam** - Reusable modules as real libraries, consumed by live symlink, with no framework include above a narrow HAL
- [ ] **Phase 4: Wiring Pipeline and Pin Safety** - One canonical `diagram.json` drives the image, the pin table and the lint gate; illegal nets are rejected
- [ ] **Phase 5: Verification Layers and Pinned Static Checks** - Pure logic proven on the host; format, lint and analyze pinned once and validated
- [ ] **Phase 6: Hook and CI Gates** - Pre-commit, pre-push and CI run the same checks, and a shared change builds every consumer
- [ ] **Phase 7: Agent Rules and the Scaffolding Skill** - One short root `AGENTS.md` and a mirrored skill tree that both harnesses share
- [ ] **Phase 8: The First Real Homework, End to End** - One course homework scaffolded, built, tested, wired, documented and gate-green

## Phase Details

### Phase 1: Repository Skeleton and Project Layout
**Goal:** The repository is one VS Code workspace holding the root, the shared-library tree and one folder per homework, with the folder names and the one-level depth rule frozen before any mechanism is built on them.
**Mode:** mvp
**Depends on:** Nothing (first phase)
**Requirements:** REPO-01, REPO-02, REPO-03, REPO-04
**Success Criteria** (what must be TRUE):
  1. Opening the committed workspace file in VS Code shows the repo root, `shared/` and every homework currently in the tree as top-level roots.
  2. A PlatformIO project placed at `homeworks/<module>-<lesson>-<slug>/` builds from the repo root with exactly one command, `pio run -d homeworks/<id>` — and moving it one level deeper breaks the build, which is what proves the depth rule is load-bearing.
  3. `git status` stays clean across a full build and an editor session: `.pio/`, `compile_commands.json` and generated editor state never appear as untracked or modified.
  4. Running a repo-wide sweep script in a tree where it matches zero homework projects exits non-zero with a readable message instead of reporting success.
**Plans:** 5 plans
Plans:
- [ ] 01-01-PLAN.md — The walking skeleton: discovery, the generated workspace file, and the one-command build
- [ ] 01-02-PLAN.md — Ignore rules, the text-layer contract, and the editor settings
- [ ] 01-03-PLAN.md — The corrected path traps and the root README
- [ ] 01-04-PLAN.md — The repo-wide sweep that fails loudly on zero matches and names the depth rule
- [ ] 01-05-PLAN.md — The acceptance run: build once, prove the depth rule, leave the tree clean

### Phase 2: Board and Environment Baseline (N16R8 Acceptance Gate)
**Goal:** The N16R8 board is proven end-to-end from a pinned, explicitly-ported environment, so every later phase inherits a configuration that really compiles, flashes and reports the physical flash and PSRAM — not the N8 defaults PlatformIO assumes.
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** HW-01, HW-04
**Success Criteria** (what must be TRUE):
  1. A clean build of the homework environment links the `qio_opi` memory-type IDF libraries and produces an application partition sized for 16 MB, not the 8 MB partition table with PSRAM absent that the default board definition yields.
  2. One dated on-hardware acceptance run goes build → flash → monitor on the real board, and both the esptool eFuse banner and `psramFound()` report 16 MB flash and 8 MB octal PSRAM.
  3. The resolved platform, framework and toolchain versions reported by `pio pkg list` are written into the repository, so the environment can be reproduced from the committed files alone.
  4. `pio project config` shows every environment carrying one exact `platform` version and its own explicit console port — no range, no `#develop`, no unset port.
  5. The console-port choice and the RGB-LED GPIO are settled by a measurement on this board and recorded in the phase log, replacing the documentation-derived assumption.
**Plans:** TBD

### Phase 3: Shared Libraries and the Hardware Seam
**Goal:** Reusable modules are real PlatformIO libraries consumed through live symlinked dependencies, with no framework include above a narrow HAL seam — so pure logic is testable on the host and the later ESP-IDF migration is a backend swap rather than a rewrite.
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** SHARED-01, SHARED-02, SHARED-03, SHARED-04
**Success Criteria** (what must be TRUE):
  1. `shared/lib/<module>/` holds a library with a `library.json` carrying name and version, and one `lib_deps = <name>=symlink://../../shared/lib/<name>` line is enough to make that library's API available to a homework build.
  2. Editing a shared library's source is picked up by the next homework build with no reinstall and no stale copy — a change to shared code visibly changes the firmware.
  3. A framework include (`Arduino.h`, `esp_*`, `driver/`, `freertos/`) planted anywhere under `shared/lib` is named by the seam check, which exits non-zero on it.
  4. No `lib_extra_dirs` or `globallib_dir` reference survives anywhere in the repository.
**Plans:** TBD

### Phase 4: Wiring Pipeline and Pin Safety
**Goal:** One canonical `diagram.json` per homework drives the README image, the pin table and the simulator — so they cannot disagree — and a machine-readable board-fact database rejects electrically illegal wiring before it is committed.
**Mode:** mvp
**Depends on:** Phase 3
**Requirements:** WIRE-01, WIRE-02, WIRE-03, WIRE-04, WIRE-05, HW-02, HW-03
**Success Criteria** (what must be TRUE):
  1. A homework carries exactly one `diagram.json`, and linting it with `wokwi-cli lint --warnings-as-errors --offline` passes with no token and no network access.
  2. One command regenerates `docs/wiring.svg` and `docs/netlist.md` from that diagram, and regenerating an unchanged diagram is byte-identical — so a hand-edited or stale committed artifact shows up as a diff.
  3. The homework README shows a Mermaid topology overview and cites the official board pin-layout image rather than redrawing it.
  4. The pin check rejects every illegal net it is required to reject — GPIO22–34, GPIO35/36/37, external drive of strapping GPIO0/3/45/46, 5 V logic on a GPIO with no stated level shifter, and ADC2 (GPIO11–20) used together with Wi-Fi — while accepting a legal diagram without complaint.
  5. `shared/hardware/` holds the module marking (N16R8), the board revision, the console port, the pin database and the constraint list as machine-readable facts that the pin check actually reads.
**Plans:** TBD

### Phase 5: Verification Layers and Pinned Static Checks
**Goal:** Pure logic is proven on the host with no hardware attached, and every static check is pinned, committed and validated against the analyzer versions the pinned platform actually ships — so a misconfigured analyzer fails loudly instead of silently reporting nothing.
**Mode:** mvp
**Depends on:** Phase 4
**Requirements:** VERIFY-01, VERIFY-04, VERIFY-05
**Success Criteria** (what must be TRUE):
  1. `pio test -e native` runs the host unit suite with no board attached on this machine — proving the native platform works with the host toolchain here — while `[env:esp32s3]` ignores the same suites from the one shared source tree.
  2. A deliberately broken pure-logic function fails the host suite as a reported test failure, not as a build error.
  3. clang-format, clang-tidy and cppcheck are pinned to exact versions with committed configuration, and the committed clang-tidy configuration validates against the analyzer version PlatformIO bundles.
  4. A planted defect is reported at the configured threshold while an accepted file produces no report — proving the analyzers are wired, not silently empty.
  5. `-Wpedantic` applies to the repository's own sources only and no `-Werror` appears in global build flags, so a warning inside a framework header does not stop the build.
**Plans:** TBD

### Phase 6: Hook and CI Gates
**Goal:** Pre-commit, pre-push and CI invoke the same definition of every check, so a check cannot exist in one gate and be missing from another, and a change to shared code always builds every project that consumes it.
**Mode:** mvp
**Depends on:** Phase 5
**Requirements:** VERIFY-02, VERIFY-03
**Success Criteria** (what must be TRUE):
  1. Each fast check — format, lint, diagram lint, pin check, render drift and seam grep — is reachable from pre-commit, demonstrated by planting one violation per check and seeing the offending hook named and the commit refused.
  2. A commit that passes the fast checks completes without compiling anything, and a push only then builds the changed homework projects.
  3. Editing one shared library makes the push gate and CI build every homework that declares it through `symlink://` — including projects that are not the nearest `platformio.ini` ancestor of the edit.
  4. CI on a pull request builds only the changed projects and lints all of them, and the run fails loudly rather than passing green when it discovers zero projects.
**Plans:** TBD

### Phase 7: Agent Rules and the Scaffolding Skill
**Goal:** One short root `AGENTS.md` plus a mirrored skill tree is the single funnel through which every convention above reaches the repository across both harnesses, so the sixtieth homework looks like the first.
**Mode:** mvp
**Depends on:** Phase 6
**Requirements:** AGENT-01, AGENT-02, AGENT-03, AGENT-04, AGENT-05
**Success Criteria** (what must be TRUE):
  1. A live session in Claude Code and a live session in Google Antigravity both follow the same root `AGENTS.md`, no `CLAUDE.md` exists at or above the working directory, and the rules file is under the 200-line target.
  2. Each skill is canonical at `.agents/skills/<name>/SKILL.md` and reachable through `.claude/skills/`, and the broken-symlink check fails on a deliberately dangling mirror.
  3. A scaffolding request that names no mode makes the skill ask which of the two modes is wanted — it never picks one itself.
  4. In `guide` mode the skill produces the homework skeleton and visibly stops before writing homework logic.
  5. Asked for a pin or board fact that is absent from the committed board-facts database, the skill emits an explicit unverified note instead of a value.
**Plans:** TBD

### Phase 8: The First Real Homework, End to End
**Goal:** One real course homework runs the whole loop — scaffolded through the skill, built, host-tested, wired, documented and gate-green — and reads to the instructor as submitted.
**Mode:** mvp
**Depends on:** Phase 7
**Requirements:** DELIV-01, DELIV-02, DELIV-03
**Success Criteria** (what must be TRUE):
  1. One real homework exists at `homeworks/<module>-<lesson>-<slug>/`, scaffolded through the `new-homework` skill in `guide` mode; it builds from the repo root with a single `pio run -d homeworks/<id>`, flashes to the board, and does what its README says it does.
  2. Its README answers the instructor contract in order — objective, hardware, wiring, how to build and run, how to verify, what is NOT verified, AI participation — with the generated wiring image, pin table and Mermaid overview present.
  3. The repository README index lists the homework with its id, slug, board, one-line description and commit SHA, and that SHA is the commit the homework was delivered at.
  4. Every commit that produced the homework carries an AI-participation trailer, and the README's AI-participation section agrees with the trailers.
  5. Following only the README's build and verify sections on a clean clone reproduces the demonstrated behaviour, and regenerating the wiring artifacts produces no diff.
**Plans:** TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Repository Skeleton and Project Layout | 0/5 | Not started | - |
| 2. Board and Environment Baseline (N16R8 Acceptance Gate) | 0/TBD | Not started | - |
| 3. Shared Libraries and the Hardware Seam | 0/TBD | Not started | - |
| 4. Wiring Pipeline and Pin Safety | 0/TBD | Not started | - |
| 5. Verification Layers and Pinned Static Checks | 0/TBD | Not started | - |
| 6. Hook and CI Gates | 0/TBD | Not started | - |
| 7. Agent Rules and the Scaffolding Skill | 0/TBD | Not started | - |
| 8. The First Real Homework, End to End | 0/TBD | Not started | - |

---
*Roadmap created: 2026-10-15*
*Milestone: v1.0 — Prove the loop on one real homework*
