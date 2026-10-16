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

- [x] **Phase 1: Repository Skeleton and Project Layout** - The decided tree, one VS Code workspace, the depth rule, and ignore rules frozen before anything is built on them (completed 2026-10-16)
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

> **Verification discharge (criterion 2, second conjunct):** Accepted override, recorded **2026-10-15** (the owner's decision commit `bf60cca`, "docs(phase-01): record owner decisions on the two verification gaps"). The second conjunct of criterion 2 above is **deliberately deviated from**: the roadmap wording stays exactly as written, and the sanctioned discharge is the sweep's named-rule detector — the `DEPTH RULE VIOLATED` banner, exit 1, raised before any child process exists. The detector is named that precisely because the sweep carries two named-rule detectors (`DEPTH RULE VIOLATED` and `MALFORMED HOMEWORK ID`) and only the depth one stands in for the build failure.
> **Reason, in the owner's own terms:** the literal criterion is unobservable in Phase 1 because `homeworks/project-baseline/platformio.ini` declares no `lib_deps`, so nothing resolves relative to the project directory and nothing fails to resolve. A copy of the baseline placed at `homeworks/project-baseline/deeper/` builds successfully — measured, exit 0 — so no build-failure demonstration exists to make.
> **Measured evidence (plan 01-06, two arms on a throwaway fixture outside the repository):** with one shared-library dependency declared in the form `lib_deps = probelib=symlink://../../shared/lib/probelib`, the project at exactly one level below `homeworks/` builds (arm A: exit 0, `probelib@0.1.0 has been installed!`) and the same project one level deeper fails to resolve (arm B: exit 1, PlatformIO's own `PackageException: Can not create a symbolic link for ../../shared/lib/probelib, not a directory`). The depth boundary is therefore real and measured; what the committed baseline lacks is the dependency that would exhibit it.
> **Trigger that retires the substitute:** Phase 3 success criterion 5 below makes the literal mechanism observable on the committed tree — once a homework declares `lib_deps = <name>=symlink://../../shared/lib/<name>`, moving that homework one level deeper fails to resolve the shared-library symlink dependency. Until then the named-rule detector is the discharge, and it is never relaxed to manufacture a green result.

**Plans:** 5 executed, 2 gap-closure planned
Plans:
**Wave 1**
- [x] 01-01-PLAN.md — The walking skeleton: discovery, the generated workspace file, and the one-command build
- [x] 01-02-PLAN.md — Ignore rules, the text-layer contract, and the editor settings
- [x] 01-03-PLAN.md — The corrected path traps and the root README

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 01-04-PLAN.md — The repo-wide sweep that fails loudly on zero matches and names the depth rule

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 01-05-PLAN.md — The acceptance run: build once, prove the depth rule, leave the tree clean

**Wave 4** *(gap closure — blocked on Waves 1–3)*
- [x] 01-06-PLAN.md — Close the un-ignored GSD lock file by rule, gate the ignore contract against regression, and measure the depth rule's build-failure mechanism on a two-arm fixture

**Wave 5** *(gap closure — blocked on Wave 4)*
- [x] 01-07-PLAN.md — Record the owner's accepted override for criterion 2's second conjunct, with the Phase 3 trigger that makes the literal mechanism observable

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

**Plans:** 3/3 plans executed

Plans:
**Wave 1**
- [x] 02-01-PLAN.md — The shared N16R8 environment fragment, its first consumer, and the measured override contrast

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 02-02-PLAN.md — The resolved version record and the pure-filesystem regression gate

**Wave 3** *(blocked on Waves 1–2)*
- [x] 02-03-PLAN.md — The dated on-hardware acceptance run, the console measurement, and the phase log

> **Planning note — the phase is split at the hardware boundary, and criteria 2 and 5 are not claimed by the offline half.** Plans 02-01 and 02-02 discharge criterion 1, criterion 3, criterion 4 and the static halves of HW-01 and HW-04 entirely offline. Plan 02-03 carries the one dated acceptance run. No board is attached as these plans are written, so 02-03 is written with explicitly unfilled output slots: if the device inventory does not change when the board is attached, criterion 2 and the measurement half of criterion 5 stay **unmet** and the phase log says so in plain words. They are never inferred from a build, from a configured value, or from documentation.

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
  5. Once a homework declares `lib_deps = <name>=symlink://../../shared/lib/<name>`, moving that homework one level deeper makes its build fail to resolve the shared-library symlink dependency — PlatformIO's Library Manager resolves a `symlink://` path relative to the project directory, so the same relative path no longer reaches `shared/lib/` from a deeper folder. This is the observable build-failure half of the one-level depth rule that Phase 1 could enforce only by name, and one command (`pio run -d <deeper copy of the project>`) settles it: the failure arrives at library installation, before any translation unit is compiled.

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
| 1. Repository Skeleton and Project Layout | 7/7 | Complete    | 2026-10-16 |
| 2. Board and Environment Baseline (N16R8 Acceptance Gate) | 3/3 | In Progress | - |
| 3. Shared Libraries and the Hardware Seam | 0/TBD | Not started | - |
| 4. Wiring Pipeline and Pin Safety | 0/TBD | Not started | - |
| 5. Verification Layers and Pinned Static Checks | 0/TBD | Not started | - |
| 6. Hook and CI Gates | 0/TBD | Not started | - |
| 7. Agent Rules and the Scaffolding Skill | 0/TBD | Not started | - |
| 8. The First Real Homework, End to End | 0/TBD | Not started | - |

---
*Roadmap created: 2026-10-15*
*Milestone: v1.0 — Prove the loop on one real homework*
