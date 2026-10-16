---
phase: "2"
slug: "board-and-environment-baseline-n16r8-acceptance-gate"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-16"
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node --test`) — no third-party runner |
| **Config file** | none — there is no `package.json` in the tracked tree; tests are invoked by glob |
| **Quick run command** | `node --test "tools/**/*.test.mjs"` — the quoted glob is mandatory (unquoted zsh errors on zero matches) |
| **Full suite command** | the same command; there is one suite |
| **Phase-gate additions** | `node tools/sweep-homeworks.mjs` and `node tools/generate-workspace.mjs --check` |
| **Estimated runtime** | ~0.7 s (27 tests, `duration_ms 632.8`, exit 0 — measured in `01-05-SUMMARY.md` § 7) |

---

## Sampling Rate

- **After every task commit:** `node --test "tools/**/*.test.mjs"` — sub-second; a `pio run` is deliberately NOT part of this fast path (Phase 1 `D-20` / `VERIFY-02`).
- **After every plan wave:** the same suite plus `node tools/sweep-homeworks.mjs` and `node tools/generate-workspace.mjs --check`, plus `PATH="$HOME/.platformio/penv/bin:$PATH" pio run -d homeworks/project-baseline` for any wave that touched the fragment or the project config.
- **Before `/gsd-verify-work`:** full suite green, sweep green, `git status --porcelain` empty, and the acceptance plan's evidence slots either filled with verbatim output or explicitly empty and reported unmet.
- **Max feedback latency:** 1 second for the quick path; one build (~3 s, warm cache) for the config-touching path.

---

## Per-Task Verification Map

*Task / Plan / Wave columns are assigned by the planner at plan time; the rows below are the
requirement→test bindings the plan must land, taken from `02-RESEARCH.md` § Validation Architecture.*

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | HW-01 | — | N/A | unit (pure filesystem) | `node --test tools/tests/env-baseline.test.mjs` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | HW-01 | — | N/A | integration (builds) | `PATH="$HOME/.platformio/penv/bin:$PATH" pio run -d homeworks/project-baseline 2>&1 \| grep -q 6553600` | ✅ | ⬜ pending |
| TBD | TBD | TBD | HW-01 | — | N/A | integration (builds) | `grep -q 'sdk/esp32s3/qio_opi' homeworks/project-baseline/.pio/build/projectbaseline_s3/firmware.map` | ✅ (after a build) | ⬜ pending |
| TBD | TBD | TBD | HW-04 | — | N/A | integration (config read) | `pio project config -d homeworks/project-baseline --json-output` + the assertion in `02-RESEARCH.md` § Code Examples | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | HW-04 / criterion 4 | — | N/A | manual/recorded | recorded `pio project config` reading in the phase log | ❌ W0 (recorded, not asserted) | ⬜ pending |
| TBD | TBD | TBD | criterion 1 | — | N/A | integration (negative control) | a throwaway project outside the repository, built once | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | criterion 3 | — | N/A | unit (pure filesystem) | `node --test tools/tests/env-baseline.test.mjs` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tools/tests/env-baseline.test.mjs` — covers HW-01's static half, HW-04's static half, and criterion 3. Pure filesystem; spawns **no** PlatformIO process, preserving the suite's current dependency-free property.
- [ ] `tools/tests/helpers.mjs` — extend with a fixture that installs a fragment under `<fixture>/shared/pio/` and a consumer under `<fixture>/homeworks/<id>/`, so the "fragment exists at the resolved path" assertion can be tested against a *wrong* path too and shown to fail.
- [ ] Framework install: **none** — `node --test` ships with the Node already in use.
- [ ] No fixture may be built, and no test may point PlatformIO at the real repository root — the existing `helpers.mjs` header states the rule and it carries forward.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The esptool banner reports PSRAM 8 MB and `esptool flash_id` reports 16 MB flash | criterion 2 (HW-01) | Requires the physical N16R8 board on a USB port; the in-package flash map cannot report 16 MB for a WROOM-1 module | Run the acceptance sequence in `02-RESEARCH.md` § Code Examples; paste the verbatim banner and `flash_id` output into the acceptance plan's `SUMMARY.md` |
| The firmware reports `flash=16777216 psram=1` | criterion 2 | Same — no board attached | `pio device monitor -d homeworks/project-baseline -e projectbaseline_s3`; paste the verbatim serial line |
| The console-port choice is settled by measurement, not documentation | criterion 5 | The `/dev/cu.*` name only exists while the bridge is attached | `pio device list` before/after diff; record both names and the chosen `upload_port` pattern verbatim |
| The RGB-LED GPIO is GPIO48 | criterion 5 | Owner confirmation rather than a measurement — recorded in those words | Already settled as `D-12`; the plan cites it, it does not re-derive it |

*If the board is absent for the whole phase, these slots stay explicitly unfilled and the phase reports criteria 2 and 5's console half as **unmet** — never as passed.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 1s (quick path)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
