---
phase: "3"
slug: "shared-libraries-and-the-hardware-seam"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-17"
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `03-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` (built-in) on Node `v26.7.0` — no `package.json`, no dependency |
| **Config file** | none — `node --test` with a quoted glob |
| **Quick run command** | `node --test tools/tests/check-hal-seam.test.mjs` |
| **Full suite command** | `node --test "tools/**/*.test.mjs"` |
| **Estimated runtime** | ~1 second (measured 0.71 s wall, 39 tests passing, 2026-10-17) |

The quoting in the full-suite command is mandatory: an unquoted glob errors under zsh when it matches nothing (`01-01-PLAN.md:247`).

Existing suites — `discover`, `sweep`, `generate-workspace`, `ignore-rules`, `env-baseline` — are all pure-filesystem and spawn no child processes.

---

## Sampling Rate

- **After every task commit:** Run `node --test tools/tests/check-hal-seam.test.mjs`
- **After every plan wave:** Run `node --test "tools/**/*.test.mjs"`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

Task IDs are bound when plans exist; rows below are seeded at requirement granularity from the research's Phase Requirements → Test Map.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | — | 0 | SHARED-01 | — | N/A | unit (fs) | `node --test tools/tests/check-hal-seam.test.mjs` | ❌ W0 | ⬜ pending |
| TBD | — | 0 | SHARED-01 | — | N/A | unit (fs) | same — the set of library directories equals the expected three | ❌ W0 | ⬜ pending |
| TBD | — | 0 | SHARED-02 | — | N/A | unit (fs) | same — the baseline's `lib_deps` declares exactly three `symlink://` specs; each LHS equals its manifest `name`. **Requires the single-line comma form** (Pitfall 5: the repo's own `sections()` mis-parses a multi-line `lib_deps`) | ❌ W0 | ⬜ pending |
| TBD | — | — | SHARED-02 | — | N/A | manual (D-12) | `pio run -d … && strings firmware.bin \| grep <marker>` — recorded verbatim in the plan `SUMMARY.md` | n/a | ⬜ pending |
| TBD | — | 0 | SHARED-03 | — | N/A | unit (fs) | `node --test tools/tests/check-hal-seam.test.mjs` — a planted framework include is named and exits non-zero | ❌ W0 | ⬜ pending |
| TBD | — | 0 | SHARED-03 | — | N/A | unit (fs) | same — the allow-list skips exactly `emb_hal_arduino` and no other directory, with a falsification arm that renames the backend | ❌ W0 | ⬜ pending |
| TBD | — | 0 | SHARED-03 | — | N/A | unit (fs) | same — zero libraries under `shared/lib` exits non-zero with a named message, against an empty fixture | ❌ W0 | ⬜ pending |
| TBD | — | 0 | SHARED-04 | — | N/A | unit (fs) | repo-wide scan for `lib_extra_dirs` / `globallib_dir` is clean outside the dated research files — a grep, or a test reusing `ignore-rules.test.mjs`'s idiom | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tools/tests/check-hal-seam.test.mjs` — covers SHARED-01, SHARED-02, SHARED-03, SHARED-04
- [ ] A fixture helper for a shared-library tree — `tools/tests/helpers.mjs` has `makeFragmentConsumer` but nothing that plants `shared/lib/<name>/`; extend it rather than forking the builder
- [ ] Framework install: none — `node:test` ships with Node

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Editing a shared source changes the firmware | SHARED-02 (criterion 2) | A build observation. A test that spawned `pio` would couple every task commit to a binary the repository cannot assume is resolvable — the same reason `env-baseline.test.mjs` stays filesystem-only. | Edit `shared/lib/emb_log/src/emb_log.c`, rebuild `homeworks/project-baseline`, confirm exactly one TU recompiles (`libe14/emb_log/emb_log.c.o`), the new string is present in `firmware.bin` and the old is absent, and pointer mtimes are unchanged. Record verbatim in `SUMMARY.md`. |
| Moving a consumer one level deeper breaks library resolution | SHARED-05 (criterion 5) | Same reason as above — a build observation, taken once. | Run the two-arm fixture plus the control arm; see the divergence note below. Record verbatim in `SUMMARY.md`. |

---

## ⚠ Divergence from the Roadmap's stated mechanism (criterion 5)

ROADMAP success criterion 5 states the deeper-copy failure "arrives at library installation, before any translation unit is compiled". **Measured this session, that is not what happens on the committed tree.** The baseline also consumes `extra_configs = ../../shared/pio/base.ini`, which is *also* project-relative; a naive deeper copy therefore fails **earlier**, at environment assembly, with:

```
UndefinedEnvPlatformError: Please specify platform for 'projectbaseline_s3' environment
```

The roadmap's literal `PackageException` at library installation appears only once the fragment path is corrected to depth 3 while `lib_deps` stays at depth 2. All three arms were measured. **The plan must discharge criterion 5 with a two-arm fixture, keep the third as a control, and correct the roadmap's wording** — the Phase 1 override style.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
