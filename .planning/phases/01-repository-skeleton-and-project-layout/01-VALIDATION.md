---
phase: "1"
slug: "repository-skeleton-and-project-layout"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-15"
validated: "2026-10-15"
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Filled from `01-RESEARCH.md` § Validation Architecture (lines 998-1057).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` with `node:assert/strict` — built into Node v26.7.0. **No install, no config file, no dependency, no `package.json`.** |
| **Config file** | **None.** The runner is invoked with an explicit glob; there is no test config to write. |
| **Quick run command** | `node --test "tools/**/*.test.mjs"` |
| **Full suite command** | `node --test "tools/**/*.test.mjs"` (identical — the suite is small and fast; measured `tests 32`, `pass 32`, `duration_ms 614` on the shipped tree) |
| **Estimated runtime** | ~0.6 seconds for the full suite; the acceptance run in plan 01-05 is dominated by the PlatformIO build (~3 s cold, `Took 0.55 seconds` incrementally once `.pio/` is warm) |

**Verified runner behaviour — read this before changing the command:**

```text
node --test "tools/**/*.test.mjs"            → tests 32, pass 32, exit 0   ✅ the command to use
node --test tools/tests/discover.test.mjs    → pass 12, exit 0   ✅ a single file works
node --test tools/                           → Cannot find module '…/tools'  exit 1  ❌ not a directory scan
node --test                                  → walks the tree; ran a test found inside homeworks/  ❌ scope grows silently
```

Quoting the glob is **mandatory**: unquoted, the shell expands it, and under zsh an unmatched glob is an error. `node --test <dir>` is not a directory scan — measured as `MODULE_NOT_FOUND`.

---

## Sampling Rate

- **After every task commit:** `node --test "tools/**/*.test.mjs"` — measured at `duration_ms 614` for the full 32-test suite, so there is no reason to run it less often.
- **After every plan wave:** the suite plus `node tools/generate-workspace.mjs --check` and `node tools/sweep-homeworks.mjs --list`.
- **Before `/gsd-verify-work`:** full suite green, `--check` green, `pio run -d homeworks/project-baseline` exit 0, `git status --porcelain` empty, and both recorded manual observations present.
- **Max feedback latency:** ~1 second for the automated layers; the acceptance run in plan 01-05 is the only slow step and it runs once.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-T1 | 01 | 1 | REPO-01, REPO-02 | T-1-01, T-1-02, T-1-03, T-1-04 | The frozen id regex is applied before a name becomes a path or a child-process argument; symlinked directories are never followed; no machine-local path or unverified board fact is published | smoke + unit | `node tools/generate-workspace.mjs --check` · `PATH="$HOME/.platformio/penv/bin:$PATH" pio run -d homeworks/project-baseline` | ✅ | ✅ green |
| 01-01-T2 | 01 | 1 | REPO-01 | T-1-01 | The accept/reject id table is asserted as data, so no name outside the grammar can be discovered | unit | `node --test "tools/**/*.test.mjs"` | ✅ | ✅ green |
| 01-01-T3 | 01 | 1 | REPO-01, REPO-02 | T-1-03 | Documentation and the baseline publish no machine-local path and no unverified pin | source | `grep -Ec 'lib_extra_dirs\|globallib_dir' shared/lib/README.md` · the baseline's GPIO-API count is 0 | ✅ | ✅ green |
| 01-02-T1 | 02 | 1 | REPO-04 | T-1-06, T-1-07 | The secret patterns are effective and no pattern is silently disabled by a trailing comment; no wildcard swallows its own hand-authored input, and the rule for the generated state file is an exact path so no glob over the planning directory swallows the tracked planning data beside it | integration | `git check-ignore -v` over the ten paths, each resolving to the repository's own `.gitignore` as its source · `! git check-ignore -q sdkconfig.defaults` · `! git check-ignore -q .planning/config.json` | ✅ | ✅ green |
| 01-02-T2 | 02 | 1 | REPO-04 | T-1-09 | Text/binary classification is explicit, so a regenerated vector image produces a readable diff | integration | `git check-attr text -- README.md` · `git check-attr diff -- docs/wiring.svg` · the EditorConfig key-set check | ✅ | ✅ green |
| 01-02-T3 | 02 | 1 | REPO-04 | T-1-08 | Generated editor state carrying absolute machine paths is never published | source | `JSON.parse` on both settings files · the single-PlatformIO-key gate | ✅ | ✅ green |
| 01-03-T1 | 03 | 1 | REPO-01, REPO-02, REPO-03 | T-1-10, T-1-13 | No file an agent reads before acting names a path that does not exist; the dated research evidence is unmodified | source | `grep -c 'shared/libs' AGENTS.md` → 0 · `grep -c 'shared/lib/' AGENTS.md` → 2 · the traps-section floor (at least four entries) | ✅ | ✅ green |
| 01-03-T2 | 03 | 1 | REPO-01, REPO-02 | T-1-11, T-1-12 | The public README publishes no machine-local path and names no later-phase file | source | the README presence and absence gates in plan 01-03 | ✅ | ✅ green |
| 01-04-T1 | 04 | 2 | REPO-02, REPO-03 | T-1-14, T-1-15, T-1-17 | No shell is used, so a discovered path cannot be re-interpreted; a policy failure short-circuits before any build | integration | the five fixture commands in plan 01-04 task 1 | ✅ | ✅ green |
| 01-04-T2 | 04 | 2 | REPO-03 | T-1-14, T-1-16 | No test runs against the repository root, so the clean-tree rule is not violated while being tested | integration | `node --test tools/tests/sweep.test.mjs` · the captured-status assertion | ✅ | ✅ green |
| 01-05-T1 | 05 | 3 | REPO-01, REPO-02, REPO-03, REPO-04 | T-1-18, T-1-19, T-1-20 | No build artifact, compilation database or generated editor file is staged — and no machine-written state file is committed — to make the clean-tree assertion pass; the pre-phase baseline of three untracked entries and the reason the state file is ignored rather than committed are both recorded in the phase log | smoke | the acceptance sequence in plan 01-05 task 1, ending in `test -z "$(git status --porcelain)"` | ✅ | ✅ green |
| 01-05-T2 | 05 | 3 | REPO-01, REPO-04 | — | N/A — observation only, no secure behaviour beyond the recorded evidence | manual (<human-check>) | recorded in the phase log with verbatim outputs; both observations deferred to `/gsd-verify-work 1` with an explicitly unfilled output slot | n/a | ⬜ manual (deferred) |
| 01-06-T1 | 06 | 4 | REPO-04 | T-1-22, T-1-24 | The lock-file class is closed by the repository's own ignore file rather than by committing or deleting the artifact; the regression gate asserts the *source* `git check-ignore -v` reports, so a machine-local excludes file cannot mask a missing rule; the over-breadth question is answered by git's own index, so no hand-written survivor list can go stale | integration | `node --test tools/tests/ignore-rules.test.mjs` · `git check-ignore -v .planning/milestone.lock` · `test -z "$(git ls-files -i -c --exclude-standard)"` · `! git check-ignore -q .planning/config.json` | ✅ | ✅ green |
| 01-06-T2 | 06 | 4 | REPO-03, REPO-02 | T-1-23, T-1-25, T-1-26 | The measurement's result was not chosen: both arms' commands, exit statuses and output are recorded verbatim, and a non-failing deeper arm is a finding to record rather than a failure to retry. The throwaway fixture is removed and its absence asserted, so the probe's residue cannot falsify the clean-tree reading | smoke | `grep -c '^### Arm A' .planning/phases/01-repository-skeleton-and-project-layout/01-06-SUMMARY.md` · `test ! -d "${TMPDIR:-/tmp}/phase01-depth-probe"` · `test ! -d homeworks/m01-l03-probe` · `test -z "$(git status --porcelain)"` | ✅ | ✅ green |
| 01-07-T1 | 07 | 5 | REPO-03 | T-1-32, T-1-33, T-1-34, T-1-36 | The override's attribution is read from the commit that recorded the owner's decision rather than typed, so no acceptance nobody made enters the record; the criterion's original wording is asserted still present verbatim, so the deviation stays visible instead of being erased by a rewrite; the record's verdict fields are left to the verifier | source | `grep -c '^> \*\*Verification discharge (criterion 2, second conjunct):\*\*' .planning/ROADMAP.md` · `grep -c 'fail to resolve the shared-library symlink dependency' .planning/ROADMAP.md` · `grep -c 'criterion 2 second conjunct' .planning/PROJECT.md` · `grep -c 'overrides_applied: 1' .planning/phases/01-repository-skeleton-and-project-layout/01-VERIFICATION.md` | ✅ | ✅ green |
| 01-07-T2 | 07 | 5 | REPO-01, REPO-02, REPO-04 | T-1-35, T-1-37 | The record states in its own paragraph whether the two-arm measurement confirms the owner's stated reason or disagrees with it, so the override is checkable rather than asserted. Only already-installed tooling runs — one build against the resolved platform, two Node scripts and the built-in runner — so no package download and no simulation minute is consumed | smoke | `node tools/generate-workspace.mjs --check` · `node tools/sweep-homeworks.mjs --list` · the baseline build reporting the 6553600-byte partition · `node --test "tools/**/*.test.mjs"` · `test -z "$(git status --porcelain)"` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · ⬜ manual (deferred)*

*`File Exists` = ✅ means every file this row's verification resolves against is present on the shipped tree — including the four Wave 0 test files and `tools/tests/ignore-rules.test.mjs`, added by plan 01-06. Rows of Test Type `source` assert the contents of a tracked file by grep and own no test file by design; the column records that the asserted file exists, not that a test module does.*

---

## Wave 0 Requirements

- [x] `tools/tests/helpers.mjs` — the shared throwaway-fixture builder under `os.tmpdir()`; **all three test files need it**, so it belongs in one place (created by plan 01-01 task 2, extended by plan 01-04 task 2)
- [x] `tools/tests/discover.test.mjs` — the id grammar accept/reject table, `findDepthViolations`, `envNames` (plan 01-01 task 2)
- [x] `tools/tests/generate-workspace.test.mjs` — renderer determinism, sorted order, the exact folder set, both `--check` outcomes (plan 01-01 task 2)
- [x] `tools/tests/sweep.test.mjs` — zero-match exit 1, the escape hatch exit 0, the malformed-id message, the depth-violation message, the spawn-failure message, and the policy short-circuit (plan 01-04 task 2)
- [x] `tools/tests/ignore-rules.test.mjs` — **added after this list was drafted** (plan 01-06 task 1, which closed verification gap 2): the must-be-ignored table with its source assertion, the must-not-be-ignored table, the over-breadth class assertion over git's own index, the tracked-planning-data check, and the no-inline-comment check
- [x] No framework install needed — `node:test` is built in. **Do not add a `package.json` to get a test runner.**

**Wave 0 is complete.** All five files exist, are tracked, and are collected by the quoted glob: `node --test "tools/**/*.test.mjs"` reports `tests 32`, `pass 32`, `fail 0`.

**Fixture caution for the executor:** the sweep tests must **never** run against the repository root, or they will build the real baseline and dirty `.pio/` in the act of testing the rule that forbids exactly that. Every test that executes the sweep builds its own temp tree under `os.tmpdir()` and asserts on that.

**Tracked-source note for the Wave 0 items:** a not-yet-existing path is a new file, so `git ls-files` returning empty for the four test files above is expected at plan time and is not a tracked-source violation.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Opening `homework.code-workspace` in VS Code shows exactly three top-level roots: the repository root, `shared/`, and one entry per homework folder | REPO-01 (criterion 1) | Opening an editor window is not automatable. Its automated half is the generator's drift check, which proves the file's *contents* match the tree; it cannot prove VS Code rendered them | Plan 01-05 task 2. Open the committed workspace file from a committed checkout. Expect three roots named for the repository root, the shared-library tree and the baseline project, no unresolved-path marker on the shared root, and no stale-workspace warning |
| `git status --porcelain` stays empty across a full build **and** an editor session | REPO-04 (criterion 3) | D-20: automated in Phase 6 as a CI assertion, deliberately *not* here, because it compiles and compiling checks are out of pre-commit by the hook-stage decision. The build half is automated in plan 01-05 task 1; the editor half (format-on-save, final-newline insertion, extension writers) is the part no build can exercise | Plan 01-05 task 2. In the open session, save one tracked file in each of the three roots, let the editor settle, then run `git status --porcelain`. It must print nothing. Record the output verbatim |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s for the automated layers
- [x] `nyquist_compliant: true` set in frontmatter — set by `/gsd-validate-phase`, not by this draft

**Approval:** audited 2026-10-15 by `/gsd-validate-phase 01` — State A (existing contract audited against the executed plan/SUMMARY set)

## Validation Audit 2026-10-15

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
