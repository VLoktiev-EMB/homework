---
phase: "2"
slug: "board-and-environment-baseline-n16r8-acceptance-gate"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-16"
validated: "2026-10-16"
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

*Task / Plan / Wave columns assigned by the planner at plan time; the rows below are the
requirement→test bindings the plan must land, taken from `02-RESEARCH.md` § Validation Architecture.*

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-02 T2 | 02-02 | 2 | HW-01 | T-02-03 | The pin is asserted to be a literal exact version — `@`+digit required, `#` forbidden | unit (pure filesystem) | `node --test tools/tests/env-baseline.test.mjs` | ✅ | ✅ green (6/6) |
| 02-01 T1 | 02-01 | 1 | HW-01 | T-02-04 | The override set is proven to reach the build, not merely declared | integration (builds) | `PATH="$HOME/.platformio/penv/bin:$PATH" pio run -d homeworks/project-baseline 2>&1 \| grep -q 6553600` | ✅ | ✅ green |
| 02-01 T1 | 02-01 | 1 | HW-01 | — | The memory-type override is proven to select the `qio_opi` library set | integration (builds) | `grep -q 'sdk/esp32s3/qio_opi' homeworks/project-baseline/.pio/build/projectbaseline_s3/firmware.map` | ✅ | ✅ green (5629 matches) |
| 02-01 T1 | 02-01 | 1 | HW-04 | T-02-03 | Every environment carries one exact released `platform` and three non-empty port keys | integration (config read) | `pio project config -d homeworks/project-baseline --json-output` + the assertion in `02-RESEARCH.md` § Code Examples | ✅ | ✅ green (`OK 1`) |
| 02-03 T1 | 02-03 | 3 | HW-04 / criterion 4 | T-02-14 | The console decision is a recorded reading, not an assertion | manual/recorded | recorded `pio project config` reading in the phase log | ✅ | ✅ recorded |
| 02-01 T2 | 02-01 | 1 | criterion 1 | T-02-02 | The override claim carries a falsifiable contrast, both arms verbatim | integration (negative control) | a throwaway project outside the repository, built once | ✅ | ✅ green (2 arms) |
| 02-02 T2 | 02-02 | 2 | criterion 3 | T-02-02 | The version record's resolved names are asserted, and its freedom from machine-local paths | unit (pure filesystem) | `node --test tools/tests/env-baseline.test.mjs` | ✅ | ✅ green (6/6) |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Gap analysis result: zero gaps.** Every requirement in this phase carries at least one automated
binding that exists and runs green, and no row is MISSING or PARTIAL. Audited 2026-10-16 against
the completed phase; the full suite stands at 38 tests, 38 pass, 0 fail.

---

## Wave 0 Requirements

- [x] `tools/tests/env-baseline.test.mjs` — covers HW-01's static half, HW-04's static half, and criterion 3. Pure filesystem; spawns **no** PlatformIO process, preserving the suite's current dependency-free property. Landed by `02-02`.
- [x] `tools/tests/helpers.mjs` — extended with `makeFragmentConsumer(root, id, options)`, a fixture that installs a fragment under `<fixture>/shared/pio/` and a consumer under `<fixture>/homeworks/<id>/`, so the "fragment exists at the resolved path" assertion is tested against correct, misplaced **and** absent layouts. Landed by `02-02`.
- [x] Framework install: **none** — `node --test` ships with the Node already in use. No framework was installed by this phase.
- [x] No fixture is built, and no test points PlatformIO at the real repository root — the existing `helpers.mjs` header states the rule and it carried forward.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions | Result |
|----------|-------------|------------|-------------------|--------|
| The esptool banner reports PSRAM 8 MB and `esptool flash_id` reports 16 MB flash | criterion 2 (HW-01) | Requires the physical N16R8 board on a USB port; the in-package flash map cannot report 16 MB for a WROOM-1 module | Run the acceptance sequence in `02-RESEARCH.md` § Code Examples | **performed** — `02-03-SUMMARY.md` readings 4 and 5: `Embedded PSRAM 8MB (AP_3v3)`, `Detected flash size: 16MB` |
| The firmware reports `flash=16777216 psram=1` | criterion 2 | Same — no board attached | `pio device monitor -d homeworks/project-baseline -e projectbaseline_s3`; paste the verbatim serial line | **performed** — reading 6: `baseline: flash=16777216 psram=1 psramSize=8386279`, taken by direct serial read (`pio device monitor` cannot be scripted) |
| The console-port choice is settled by measurement, not documentation | criterion 5 | The `/dev/cu.*` name only exists while the bridge is attached | `pio device list` before/after diff; record both names and the chosen `upload_port` pattern verbatim | **performed** — reading 3: the committed `/dev/cu.usbserial-*` matched nothing and the pattern was corrected to the measured `/dev/cu.usbmodem*` (`3bb3f87`) |
| The RGB-LED GPIO is GPIO48 | criterion 5 | Owner confirmation rather than a measurement — recorded in those words | Already settled as `D-12`; the plan cites it, it does not re-derive it | **cited, not re-derived** — the phase log states it as settled by owner confirmation and explicitly not as a measurement |

*All four manual slots above were filled by the acceptance run rather than by the board's absence.
No slot is reported as unmet, and none was filled with a configured or inferred value.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 1s (quick path — measured 642 ms for the full 38-test suite)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-10-16 — zero gaps; the auditor was not spawned because no requirement was MISSING or PARTIAL.

## Validation Audit 2026-10-16

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
