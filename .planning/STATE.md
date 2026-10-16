---
gsd_state_version: "1.0"
milestone: v1.0
current_phase: 03
current_phase_name: shared-libraries-and-the-hardware-seam
status: "Phase 02 shipped — PR #5"
stopped_at: Phase 3 context gathered
last_updated: "2026-10-16T23:50:00.517Z"
last_activity: 2026-10-17
last_activity_desc: Phase 03 planning complete
state_head: 5faa3400f62b990e5aaaabf6e4a609735594ea47
progress:
  total_phases: 8
  completed_phases: 2
  total_plans: 13
  completed_plans: 10
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-17)

**Core value:** Every homework stays buildable, demonstrable and self-explanatory long after it was submitted.
**Current focus:** Phase 03 — Shared Libraries and the Hardware Seam

## Current Position

Phase: 03 (shared-libraries-and-the-hardware-seam) — READY TO EXECUTE
Plan: Not started
Status: Phase 02 shipped — PR #5
Last activity: 2026-10-17 — Phase 03 planning complete

Progress: [███░░░░░░░] 25%

## Performance Metrics

**Velocity:**
- Total plans completed: 10
- Average duration: — min
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 7 | - | - |
| 02 | 3 | - | - |

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
| Phase 01 P05 | unknown | 2 tasks | 1 files |

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
- [Phase 01]: The acceptance run's two clean-tree readings are taken at the plan's own two points — before the log exists and after it is committed — and neither reading is replaced by a reading taken between the log's write and its commit.
- [Phase 01]: The build was invoked through the absolute PlatformIO binary rather than the plan's `PATH="$HOME/.platformio/penv/bin:$PATH" pio` prefix, because the worktree isolation guard refuses a command whose first word is a `VAR=value` assignment. It is the same resolved binary; the plan itself records the absolute path as equivalent.
- [Phase 01]: The phase log is the sanctioned repair for its own untracked entry. The generated state file beside it is closed by an ignore rule instead, because it is timestamped machine state rewritten on every transition — committing it would add a churning line to a history a course instructor reads.
- [Phase 01]: `.planning/milestone.lock` is recorded as a known fourth machine-local GSD artifact that no Phase 1 plan named and no pattern matches. It belongs to plan 01-02's ignore file, so editing `.gitignore` here would break requirement traceability; it is recorded instead.
- [Phase 01]: Owner decision after gaps_found: ACCEPT THE OVERRIDE for roadmap criterion 2(b). The literal criterion (a project one level deeper breaks the build) is unobservable in Phase 1 because platformio.ini declares no lib_deps, so nothing fails to resolve; a copy of the baseline at homeworks/project-baseline/deeper/ builds successfully (measured, exit 0). Record in ROADMAP.md that the sweep's named-rule detector (DEPTH RULE VIOLATED, exit 1, raised before any child process) satisfies the criterion's INTENT as a documented, deliberate deviation, with the reason and the Phase 3 trigger that would make the literal form observable.
- [Phase 01]: Owner decision after gaps_found: FIX gap 2 now via a gap-closure plan, not by leaving it as recorded debt. .planning/milestone.lock is untracked and matches no ignore pattern (git check-ignore exits 1), so git status --porcelain is never empty and both criterion 3 and plan 01-05's own must-have remain unmet. Add a .planning/*.lock rule to the root .gitignore. This edit belongs to plan 01-02, so it must go through a gap_closure plan to keep requirement traceability intact. Independently confirmed as WR-09 by the phase code review.
- [Phase 02]: The shared environment fragment owns PlatformIO's global `[env]` defaults layer, but `board` and `framework` stay declared in the consuming project. PlatformIO can overwrite an inherited key but never unset one, so a fragment-level `board` makes a `platform = native` environment impossible to configure — which is exactly the environment `homeworks/project-baseline/README.md` announces for a later phase. This was corrected after code review (finding CR-01, commit `0ca6098`); nine of the baseline environment's eleven keys are inherited, `board` and `framework` are not.
- [Phase 02]: The console port glob was corrected from the documented `/dev/cu.usbserial-*` to the MEASURED `/dev/cu.usbmodem*`, on the strength of a before/after `pio device list --json-output` diff. The old pattern matched nothing in either inventory, and PlatformIO refused to flash (exit 1) rather than silently selecting another device. Committed as `3bb3f87`; still a pattern — no literal node and no serial number is committed anywhere.
- [Phase 02]: The measured bridge is a CH343 (`VID:PID 1A86:55D3`), which falsifies the CP2102N named by `02-RESEARCH.md` Pitfall 8 and by the D-03/D-04 rationale. The measured identity currently lives in no reader-facing file; recorded as a trap in PROJECT.md so a later phase writing driver or port documentation uses the measured value.
- [Phase 02]: The phase's regression gate reads the RESOLVED environment content — never the fragment's own text, and never the command's exit status. A fragment that cannot be found is not an error: PlatformIO exits 0 and the environment comes out with an empty body. `tools/tests/env-baseline.test.mjs`, six assertions, pure filesystem, no child processes.
- [Phase 02]: Criterion 5 is credited in two halves on different evidence, and the difference is stated rather than smoothed over. The console half is settled BY MEASUREMENT (the device-inventory diff); the RGB-LED pin is settled by OWNER CONFIRMATION and is explicitly not described as a measurement anywhere.

### Pending Todos

- [2026-10-16] [general] Parameterize board assumptions beyond the N16R8 module — [todo file](.planning/todos/pending/2026-10-17-parameterize-board-assumptions-beyond-the-n16r8-module.md)

### Blockers/Concerns

Open decisions the phases must force (research D-list, unresolved at roadmap time):

- **D1 — course Arduino core (2.x vs 3.x):** not source-compatible; changes every homework's code. **[Phase 2] NOT resolved — deferred with an explicit trigger:** the first course-provided code sample that fails to compile. Everything Phase 2 measured sits on Arduino 2.0.17, so the question stays open until the course supplies code to test against.
- **D2 — console default (USB CDC on boot vs UART bridge):** **[Phase 2] the bridge half is settled by measurement.** The UART bridge (COM) socket is the console, the port glob is the measured `/dev/cu.usbmodem*`, and all three port keys are pinned in the shared fragment so a new project cannot forget them. The native-USB environment and its debug tool stay deferred together (D-05), as decided; neither was created here.
- **D4 — C++ standard contract:** `.clang-format`'s `Standard: c++17` is metadata, not a compile decision. State the standard next to the platform pin. Phase 3.
- **D6 — WIP tolerance of repo-wide gates:** feature-branch pushes are red by construction; the escape hatch must be `SKIP=<hook-id>`, never `--no-verify`. Phase 6.
- **D8 — submission/freeze model:** live `symlink://` means a submitted homework can rebuild differently after a later shared edit. Keep live linking; freeze on evidence. Residual risk.
- **D9 — `AGENTS.md` size (288 lines measured on the abandoned scaffold vs the ~200-line target):** decide inside Phase 7 before the file grows.
- **D10 — `.claude/skills` mirror shape:** per-skill-entry symlinks, one live smoke test, keep the broken-link check. Phase 7.
- **D11 — VS Code extension choice (official frozen vs pioarduino fork):** an IDE choice, independent of the official-platform decision. Inspect the installed extension's schema before trusting workspace keys.
- **D12 — board revision and ADC2-while-Wi-Fi:** **[Phase 2] the RGB-LED half is owner-confirmed, not measured** — GPIO48 on the initial revision, with a re-check trigger: the first homework that drives that pin as an RGB LED and shows no light means a different revision, and the pin must then be re-established by observation and recorded in the machine-readable board-facts directory. ADC2 + Wi-Fi stays conservative (ADC1 GPIO1–10 for analog) until measured. **Phase 4** owns the board facts.
- **Host tests are unproven on this machine:** `platform = native` expects a system GCC; `/usr/bin/gcc` here is an Apple clang shim. Phase 5 must smoke-test it before relying on it.
- **[Phase 1] The fail-open class is still live in two guards** — `tools/generate-workspace.mjs --check` returns 0 without checking when its own path carries a symlinked component (review `CR-01`), and the ignore-contract test exempts the root ignore file by identity rather than by tracked-ness (review `CR-02`, opened 2026-10-16). Neither is a Phase 1 must-have failure, but Phase 6 wires `--check` into hooks and CI, so both must be closed before that gate is trusted. Ledger: `01-REVIEW-DISPOSITION.md`, 25 open.
- **[Phase 1] Does the root `.vscode/settings.json` reach a nested homework?** The root settings are folder-scoped and every homework sits inside the `root` workspace folder, so `editor.rulers` and `C_Cpp.formatting` may not be in effect for `homeworks/project-baseline/src/main.cpp`. Verifier finding `W-06`; belongs to Phase 5, which owns the editor and formatter contract.
- **[Phase 2] The `/dev/cu.usbmodem*` glob is not socket-specific.** Both of the board's USB sockets enumerate under that prefix, so the pattern means "a node belonging to this board", never "the bridge". A flash is safe either way because both sockets reach the same chip, but a monitor opened on the native socket prints nothing, because the acceptance vehicle writes to UART0. The both-sockets-cabled case was never measured — only one socket was cabled at a time — and the pattern is verified on one machine against one board. Phase 5 owns the editor and formatter contract and Phase 8 the README index; neither may describe the glob as bridge-specific.
- **[Phase 2] The board's COM socket needs the right USB-C orientation.** With a C-to-C cable and the plug the other way round the board receives no power at all, because the socket's CC pull-down is present on one line only. Recorded because it presents exactly as a dead board — a reflash, a re-seat or a driver reinstall cannot fix it — and every phase from here on flashes.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 261016-kz6 | close CR-02 fail-open tracked-source guard in ignore-rules test | 2026-10-16 | 88b9e22 | [261016-kz6-close-cr-02-fail-open-tracked-source-gua](./quick/261016-kz6-close-cr-02-fail-open-tracked-source-gua/) |
| 2 | Rewrite all eight ROADMAP phase goals as canonical MVP user stories | 2026-10-17 | 9ecf922 | — |

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| *(none)* | | | | |

## Session Continuity

Last session: 2026-10-16T23:21:49.158Z
Stopped at: Phase 3 context gathered
Resume file: .planning/phases/03-shared-libraries-and-the-hardware-seam/03-CONTEXT.md
