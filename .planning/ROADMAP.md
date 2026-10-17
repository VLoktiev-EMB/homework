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
- [x] **Phase 2: Board and Environment Baseline (N16R8 Acceptance Gate)** - The N16R8 module proven end-to-end from a pinned, explicitly-ported environment (completed 2026-10-17)
- [x] **Phase 3: Shared Libraries and the Hardware Seam** - Reusable modules as real libraries, consumed by live symlink, with no framework include above a narrow HAL (completed 2026-10-17)
- [ ] **Phase 4: Wiring Pipeline and Pin Safety** - One canonical `diagram.json` drives the image, the pin table and the lint gate; illegal nets are rejected
- [ ] **Phase 5: Verification Layers and Pinned Static Checks** - Pure logic proven on the host; format, lint and analyze pinned once and validated
- [ ] **Phase 6: Hook and CI Gates** - Pre-commit, pre-push and CI run the same checks, and a shared change builds every consumer
- [ ] **Phase 7: Agent Rules and the Scaffolding Skill** - One short root `AGENTS.md` and a mirrored skill tree that both harnesses share
- [ ] **Phase 8: The First Real Homework, End to End** - One course homework scaffolded, built, tested, wired, documented and gate-green

## Phase Details

### Phase 1: Repository Skeleton and Project Layout

**Goal:** As a course student maintaining one public coursework repository, I want to hold the root, the shared-library tree and one folder per homework in a single VS Code workspace whose folder names and one-level depth rule are frozen before any mechanism is built on them, so that every later phase builds on a layout that will not move under it.
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
> **Trigger that retires the substitute:** Phase 3 success criterion 5 below makes the literal mechanism observable on the committed tree — `homeworks/project-baseline/platformio.ini` declares `lib_deps = <name>=symlink://../../shared/lib/<name>`, one entry per shared library. The named-rule detector remains the discharge until a later phase retires the sweep, and it is never relaxed to manufacture a green result.
> **Correction to this trigger, recorded 2026-10-17 (plan 03-03):** the sentence above formerly said that moving a homework one level deeper "fails to resolve the shared-library symlink dependency". Measured against the committed tree, that is not what an *unmodified* deeper copy does. It fails **earlier** — at environment assembly, with `UndefinedEnvPlatformError`, exit 1, zero object files — because the consumer reaches its platform through a second project-relative path, `extra_configs = ../../shared/pio/base.ini`, which stops resolving before the dependency does and takes the platform pin with it. The symlink-resolution failure the old sentence describes is real, but it appears only once the fragment path alone is corrected to depth three. A reader who acts on the old wording will see an error naming the platform rather than a path, which is the warning sign `03-RESEARCH.md` lists for exactly this confusion.
> **Where the corrected account lives:** the criterion 5 note in Phase 3 below states the measured mechanism and names both arms and the control; `03-03-SUMMARY.md` carries their exact commands, exit statuses and verbatim output.

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

**Goal:** As a course student maintaining one public coursework repository, I want to prove the N16R8 board end-to-end from a pinned, explicitly-ported environment, so that every later homework inherits a configuration that really compiles, flashes and reports the physical flash and PSRAM rather than the N8 defaults PlatformIO assumes.
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** HW-01, HW-04
**Success Criteria** (what must be TRUE):
  1. A clean build of the homework environment links the `qio_opi` memory-type IDF libraries and produces an application partition sized for 16 MB, not the 8 MB partition table with PSRAM absent that the default board definition yields.
  2. One dated on-hardware acceptance run goes build → flash → monitor on the real board, and both the esptool eFuse banner and `psramFound()` report 16 MB flash and 8 MB octal PSRAM.
  3. The resolved platform, framework and toolchain versions reported by `pio pkg list` are written into the repository, so the environment can be reproduced from the committed files alone.
  4. `pio project config` shows every environment carrying one exact `platform` version and its own explicit console port — no range, no `#develop`, no unset port.
  5. The console-port choice and the RGB-LED GPIO are settled by a measurement on this board and recorded in the phase log, replacing the documentation-derived assumption.

**Plans:** 3/3 plans complete

Plans:
**Wave 1**
- [x] 02-01-PLAN.md — The shared N16R8 environment fragment, its first consumer, and the measured override contrast

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 02-02-PLAN.md — The resolved version record and the pure-filesystem regression gate

**Wave 3** *(blocked on Waves 1–2)*
- [x] 02-03-PLAN.md — The dated on-hardware acceptance run, the console measurement, and the phase log

> **Planning note — the phase is split at the hardware boundary, and criteria 2 and 5 are not claimed by the offline half.** Plans 02-01 and 02-02 discharge criterion 1, criterion 3, criterion 4 and the static halves of HW-01 and HW-04 entirely offline. Plan 02-03 carries the one dated acceptance run. No board is attached as these plans are written, so 02-03 is written with explicitly unfilled output slots: if the device inventory does not change when the board is attached, criterion 2 and the measurement half of criterion 5 stay **unmet** and the phase log says so in plain words. They are never inferred from a build, from a configured value, or from documentation.

### Phase 3: Shared Libraries and the Hardware Seam

**Goal:** As a course student maintaining one public coursework repository, I want to consume reusable modules as real PlatformIO libraries through live symlinked dependencies, with no framework include above a narrow HAL seam, so that pure logic is testable on the host and the later ESP-IDF migration is a backend swap rather than a rewrite.
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** SHARED-01, SHARED-02, SHARED-03, SHARED-04
**Success Criteria** (what must be TRUE):
  1. `shared/lib/<module>/` holds a library with a `library.json` carrying name and version, and one `lib_deps = <name>=symlink://../../shared/lib/<name>` line is enough to make that library's API available to a homework build.
  2. Editing a shared library's source is picked up by the next homework build with no reinstall and no stale copy — a change to shared code visibly changes the firmware.
  3. A framework include (`Arduino.h`, `esp_*`, `driver/`, `freertos/`) planted anywhere under `shared/lib` is named by the seam check, which exits non-zero on it.

> **Correction to criterion 3, recorded 2026-10-17 (plan 03-03):** the implemented include set is not this criterion's literal list, and the divergence is recorded rather than smoothed over. The framework's own core header is matched by **exact trailing name** (`Arduino.h`), never by substring: a substring search for the framework's name falsely flags a popular third-party JSON header whose name merely contains it, while a comparison against the exact name does not. The platform's own prefix **and** the Arduino HAL prefix are both matched (`esp_*` **and** `esp32-hal-*`), because the chip's HAL headers begin with the chip name rather than the platform prefix and the literal wording would miss every one of them. The driver and real-time-system directories are matched as subpaths (`driver/`, `freertos/`). Both halves of the divergence are exercised by the seam check's own falsification suite (`tools/tests/check-hal-seam.test.mjs`, 17 cases, plan 03-02), which names each include with its file and line and exits non-zero.
  4. No `lib_extra_dirs` or `globallib_dir` reference survives anywhere in the repository.

> **Reading for criterion 4, recorded 2026-10-17 (plan 03-03):** the criterion's literal word — that no reference to either directive survives *anywhere* in the repository — is already false at the moment it was written, and by design rather than by oversight: `.planning/REQUIREMENTS.md`'s out-of-scope table and `AGENTS.md`'s avoid table both name both directives because their whole job is to forbid them, and the dated research files name them throughout. The discharge is therefore a scan **for a use**, not for a mention: a tracked file that writes either directive as a configuration key or an assignment is a failure, while a prose mention is not. The reading is 103 tracked files read, 26 of which legitimately name a directive and are enumerated as a reviewed literal exception list in the scan itself, so a new file naming one is a failure to be looked at rather than a silent pass. The scan lives in `tools/tests/check-hal-seam.test.mjs`, and its full reading — the command, the exit status and the list — is recorded in `03-03-SUMMARY.md`.
  5. Once a homework declares `lib_deps = <name>=symlink://../../shared/lib/<name>`, moving that homework one level deeper makes its build fail — PlatformIO resolves both of the consumer's project-relative paths against the project directory, so neither of them reaches the shared tree from a deeper folder. This is the observable build-failure half of the one-level depth rule that Phase 1 could enforce only by name, and one command (`pio run -d <deeper copy of the project>`) settles it: measured on the committed tree, the failure arrives **first at environment assembly**, because `extra_configs = ../../shared/pio/base.ini` stops resolving before the dependency does and takes the platform pin with it. The Library Manager's own refusal to create the symlinked dependency is reproduced by correcting the fragment path alone, and that refusal too arrives before any translation unit is compiled.

> **Correction to criterion 5, recorded 2026-10-17 (plan 03-03), with both arms and the control:** arm A, the deeper copy exactly as copied, prints `UndefinedEnvPlatformError: Please specify platform for 'projectbaseline_s3' environment`, exit 1, zero object files — an error that names the platform rather than a path, which is the warning sign `03-RESEARCH.md` lists for exactly this confusion, not the resolution failure the wording used to predict. Arm B, the same copy with the fragment path corrected to depth three while the dependency path stays at depth two, assembles the environment and then prints ``Library Manager: Installing symlink://../../shared/lib/emb_hal`` followed by ``PackageException: Can not create a symbolic link for `../../shared/lib/emb_hal`, not a directory``, exit 1, zero object files: this is the criterion's own mechanism, isolated, and it is what proves the live path's resolution semantics. Arm C, the control, corrects both paths and builds — `[SUCCESS]`, 49 object files — which is what shows the deeper failure is path arithmetic rather than a prohibition on depth as such. All three arms, with their exact commands, exit statuses and verbatim output, are recorded in `03-03-SUMMARY.md`.

**Plans:** 3/3 plans complete

Plans:
**Wave 1**
- [x] 03-01-PLAN.md — The seam end to end: three real libraries, one live-symlinked consumer, the contract, and the two hand-taken readings

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 03-02-PLAN.md — The seam check, its falsification suite, and the manifest and consumer invariants asserted together

**Wave 3** *(blocked on Waves 1–2)*
- [x] 03-03-PLAN.md — Criterion 4's reading, the three-arm depth measurement, and the roadmap corrections

### Phase 4: Wiring Pipeline and Pin Safety

**Goal:** As a course student maintaining one public coursework repository, I want to drive the README image, the pin table and the simulator from one canonical `diagram.json` per homework, with a machine-readable board-fact database rejecting electrically illegal wiring, so that the three representations cannot disagree and an illegal circuit is caught before it is committed.
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

**Goal:** As a course student maintaining one public coursework repository, I want to prove pure logic on the host with no hardware attached, and to pin, commit and validate every static check against the analyzer versions the pinned platform actually ships, so that a misconfigured analyzer fails loudly instead of silently reporting nothing.
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

**Goal:** As a course student maintaining one public coursework repository, I want to invoke the same definition of every check from pre-commit, from pre-push and from CI, so that a check cannot exist in one gate and be missing from another, and a change to shared code always builds every project that consumes it.
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

**Goal:** As a course student maintaining one public coursework repository, I want to funnel every convention above through one short root `AGENTS.md` plus a mirrored skill tree that both harnesses share, so that the sixtieth homework looks like the first.
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

**Goal:** As a course student maintaining one public coursework repository, I want to run the whole loop on one real course homework that is scaffolded through the skill, then built, host-tested, wired, documented and gate-green, so that it reads to the instructor as submitted.
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
| 2. Board and Environment Baseline (N16R8 Acceptance Gate) | 3/3 | Complete    | 2026-10-17 |
| 3. Shared Libraries and the Hardware Seam | 3/3 | Complete    | 2026-10-17 |
| 4. Wiring Pipeline and Pin Safety | 0/TBD | Not started | - |
| 5. Verification Layers and Pinned Static Checks | 0/TBD | Not started | - |
| 6. Hook and CI Gates | 0/TBD | Not started | - |
| 7. Agent Rules and the Scaffolding Skill | 0/TBD | Not started | - |
| 8. The First Real Homework, End to End | 0/TBD | Not started | - |

---
*Roadmap created: 2026-10-15*
*Milestone: v1.0 — Prove the loop on one real homework*
