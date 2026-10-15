---
gsd_state_version: "1.0"
milestone: v1.0
current_phase: 01
current_phase_name: Repository Skeleton and Project Layout
status: executing
stopped_at: Completed phase 01 wave 1 (01-01, 01-02, 01-03)
last_updated: "2026-10-15T12:53:45.217Z"
last_activity: 2026-10-15
last_activity_desc: Phase 01 execution started
state_head: dbeab79d8ca1bc5799240e1ce4dcd55e6c77ffff
progress:
  total_phases: 8
  completed_phases: 0
  total_plans: 5
  completed_plans: 4
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-15)

**Core value:** Every homework stays buildable, demonstrable and self-explanatory long after it was submitted.
**Current focus:** Phase 01 — Repository Skeleton and Project Layout

## Current Position

Phase: 01 (Repository Skeleton and Project Layout) — EXECUTING
Plan: 5 of 5
Status: Ready to execute
Last activity: 2026-10-15 — Phase 01 execution started

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: — min
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 | 4 min | 3 tasks | 10 files |
| Phase 01 P02 | 3min | 3 tasks | 5 files |
| Phase 01 P03 | 2min | 2 tasks | 3 files |
| Phase 01 P04 | 5min | 2 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 8 phases, standard granularity. Infrastructure first, but Phase 2 is already a physical end-to-end acceptance run and Phase 8 completes the loop on one real homework.
- [Roadmap]: Naming frozen as `shared/lib/` (per REQUIREMENTS.md), `tools/` (root tooling), `homeworks/<module>-<lesson>-<slug>/`, `docs/` for generated artifacts. This closes the research's `shared/lib` vs `shared/libs` and `tools/` vs `tooling/` ambiguity — do not re-open.
- [Roadmap]: Wokwi-in-CI (OPS-01) and QEMU (VERIFY-07) are v2 and have no v1 phase. Only the offline, token-free diagram lint is in v1.
- [Phase 01]: The generator's CLI sits behind an entry-point guard: the RESEARCH skeleton runs its CLI at module scope, so importing renderWorkspace from a test would rewrite the repository's own workspace file.
- [Phase 01]: The test files were created in the RED commit and expanded in task 2, because the tracer carries tdd="true" while the plan assigns the suite to task 2.
- [Phase 01]: The baseline platformio.ini comment does not spell the two absent console-port keys literally, because task 1's acceptance criterion is a literal substring check on the file.
- [Phase 01]: envNames() derives the native environment name without creating it; the environment itself is Phase 5's, because an Arduino-only tree cannot build under platform = native.
- [Phase 01]: C++ IntelliSense standard set to c++11, not the scaffold's c++17: the pinned Arduino core 2.0.17 compiles with -std=gnu++11, so c++17 would let the editor accept code the toolchain rejects; the final standard statement next to the platform pin stays Phase 3's (research D4)
- [Phase 01]: No files.exclude block in .vscode/settings.json — an explorer filter was neither authorised nor forbidden by D-02, and hiding the build directory would conceal the artifacts a clean-tree check exists to keep out of git
- [Phase 01]: All three files reproduced byte-identically from 01-RESEARCH.md rather than paraphrased, then diffed back to their source blocks as the evidence
- [Phase 01]: REQUIREMENTS.md deliberately left untouched: REPO-04 is declared by both 01-02 and 01-05, so the shared-ID gate defers marking it complete until 01-05's SUMMARY exists
- [Phase 01]: Kept the `<Module>` / `<Name>` placeholder spellings verbatim on AGENTS.md line 45; only the path segment changed, so the diff is 2 lines with zero formatting churn
- [Phase 01]: Corrected PROJECT.md lines 24 and 26 only. `shared/hardware/` (REQUIREMENTS.md:20) is a different folder and deliberately not in scope
- [Phase 01]: Attributed each traps entry to the decision that produced it (D-24, D-10, D-13, D-09) so a later phase can trace the obligation back to its rationale
- [Phase 01]: README documents the environment names as project-scoped and therefore uses only the project-directory command form — the `-e` flag form is absent by construction, not by omission
- [Phase 01]: The sweep is Node rather than shell, and the reason is measured. `zsh -c 'for f in homeworks/*/platformio.ini; …'` prints `no matches found` and exits 1 with a message that names no rule; POSIX `/bin/sh` with an existence guard lets the unmatched glob through and falls through to a zero exit. Neither default yields the required semantics, so zero-match became an explicit branch under this repository's control.
- [Phase 01]: A root override was added and documented as existing for the tests. Without it, any test of the failure paths would have to point the sweep at the repository, discover the real baseline, build it and create `.pio/` — in the act of testing the rule that says the tree stays clean. The default stays the repository root derived from the script's own location, never the process working directory.
- [Phase 01]: The policy short-circuit is proved by control flow rather than by counting spawned processes. The depth fixture also carries a discoverable project and points PLATFORMIO_CORE at a path that cannot resolve, so a build stage that had been reached would necessarily print the spawn-failure message; its absence is a fact about control flow, whereas a log-line count is a fact about the current wording.
- [Phase 01]: `resolvePio` guards the home-relative probe on `$HOME` being set. The verified skeleton interpolates `process.env.HOME ?? ""`, which turns the probe into a path relative to the working directory when HOME is unset — a path that could in principle match by accident. The guard changes nothing on this machine and removes the accidental-match case.
- [Phase 01]: The RED commit carried an interface placeholder for the sweep. Not a formality: a completely absent module makes `node <path>` exit 1 with `Cannot find module`, and exit 1 is exactly the status the zero-match contract test expects — the test would have passed for the wrong reason. The placeholder keeps every RED failure an assertion failure.
- [Phase 01]: The expected id pattern is compared as a literal string, not interpolated into a RegExp. `ID_PATTERN_TEXT` spells the grammar for humans; feeding it to `new RegExp` asserts a different, slightly wrong language (the `-` before `[a-z0-9]+` becomes a range in one reading). The test asserts `stderr.includes("Expected: " + ID_PATTERN_TEXT)`.
- [Phase 01]: The full nine-case suite is task 2's deliverable while the RED commit held five high-level contract cases — the same split plan 01-01 used for the same reason: the tracer carries `tdd="true"` and the plan assigns the exhaustive suite to the second task.
- [Phase 01]: `REQUIREMENTS.md` was deliberately not modified. REPO-02 and REPO-03 are both declared by plan 01-05 as well, so the shared-ID gate forbids marking either complete until 01-05 produces its SUMMARY.

### Pending Todos

None yet.

### Blockers/Concerns

Open decisions the phases must force (research D-list, unresolved at roadmap time):

- **D1 — course Arduino core (2.x vs 3.x):** not source-compatible; changes every homework's code. Resolve by asking the instructor / inspecting a course example. Phase 2.
- **D2 — console default (USB CDC on boot vs UART bridge):** the riskier USB path is the scaffold default; UART bridge is the recommended default with native USB as an opt-in env. Phase 2.
- **D3 — exact resolved platform/core:** the platform manifest declares the Arduino core as a `~` range and research sources contradict each other on what 7.1.3 ships. Only `pio pkg list` output may be recorded. Phase 2.
- **D4 — C++ standard contract:** `.clang-format`'s `Standard: c++17` is metadata, not a compile decision. State the standard next to the platform pin. Phase 3.
- **D5 — hook stage split:** settled by the owner (pre-commit fast, pre-push builds changed projects). No longer open.
- **D6 — WIP tolerance of repo-wide gates:** feature-branch pushes are red by construction; the escape hatch must be `SKIP=<hook-id>`, never `--no-verify`. Phase 6.
- **D7 — naming freeze:** RESOLVED by REQUIREMENTS.md + owner constraints. Not open.
- **D8 — submission/freeze model:** live `symlink://` means a submitted homework can rebuild differently after a later shared edit. Keep live linking; freeze on evidence. Residual risk.
- **D9 — `AGENTS.md` size (288 lines measured on the abandoned scaffold vs the ~200-line target):** decide inside Phase 7 before the file grows.
- **D10 — `.claude/skills` mirror shape:** per-skill-entry symlinks, one live smoke test, keep the broken-link check. Phase 7.
- **D11 — VS Code extension choice (official frozen vs pioarduino fork):** an IDE choice, independent of the official-platform decision. Inspect the installed extension's schema before trusting workspace keys.
- **D12 — board revision and ADC2-while-Wi-Fi:** the RGB-LED GPIO is GPIO48 on the initial revision (owner-confirmed); ADC2 + Wi-Fi stays conservative (ADC1 GPIO1–10 for analog) until measured. Phase 2 / Phase 4.
- **Host tests are unproven on this machine:** `platform = native` expects a system GCC; `/usr/bin/gcc` here is an Apple clang shim. Phase 5 must smoke-test it before relying on it.

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| *(none)* | | | | |

## Session Continuity

Last session: 2026-10-15T12:53:45.200Z
Stopped at: Completed phase 01 wave 1 (01-01, 01-02, 01-03)
Resume file: None
