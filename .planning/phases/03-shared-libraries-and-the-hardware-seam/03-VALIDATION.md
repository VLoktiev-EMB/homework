---
phase: "3"
slug: "shared-libraries-and-the-hardware-seam"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-17"
validated: "2026-10-17"
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `03-RESEARCH.md` § Validation Architecture; audited against the executed tree on 2026-10-17.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` (built-in) on Node `v26.7.0` — no `package.json`, no dependency |
| **Config file** | none — `node --test` with a quoted glob |
| **Quick run command** | `node --test tools/tests/check-hal-seam.test.mjs` |
| **Full suite command** | `node --test "tools/**/*.test.mjs"` |
| **Estimated runtime** | ~1.5 second (measured 1.478 s wall, 58 tests passing, 2026-10-17) |

The quoting in the full-suite command is mandatory: an unquoted glob errors under zsh when it matches nothing (`01-01-PLAN.md:247`).

Existing suites — `discover`, `sweep`, `generate-workspace`, `ignore-rules`, `env-baseline`, `check-hal-seam` — are all pure-filesystem except `sweep`'s deliberate startability case, which spawns an unstartable stub rather than a real build.

`tools/tests/helpers.mjs` now carries the shared-library fixture builder (`makeSharedLibTree`, `runSeamCheck`) that Phase 3 added; it is the builder both seam suites import rather than fork.

---

## Sampling Rate

- **After every task commit:** Run `node --test tools/tests/check-hal-seam.test.mjs`
- **After every plan wave:** Run `node --test "tools/**/*.test.mjs"`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

Task IDs within a plan are positional (`<task type="…">` blocks carry no `id` attribute in this phase's plans), so rows are bound at **requirement granularity** with the plan and wave that carries them.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01/T2 | 03-01 | 1 | SHARED-01 | — | N/A | unit (fs) | `node --test tools/tests/check-hal-seam.test.mjs` — *every shared library carries a manifest whose name and version hold, and the layout split does too* | ✅ | ✅ green |
| 03-02/T3 | 03-02 | 2 | SHARED-01 | — | N/A | unit (fs) | same — *the manifest assertion turns red on an omitted version, a mismatched name and an absent manifest* (falsification arm) | ✅ | ✅ green |
| 03-01/T2 | 03-01 | 1 | SHARED-02 | — | N/A | unit (fs) | same — *the baseline's dependency line names exactly the three libraries, each matching its manifest* (single-line comma form, Pitfall 5) | ✅ | ✅ green |
| 03-02/T3 | 03-02 | 2 | SHARED-02 | — | N/A | unit (fs) | same — *the consumer assertion turns red on a short dependency line and on an absent key* (falsification arm) | ✅ | ✅ green |
| 03-02/T2 | 03-02 | 2 | SHARED-03 | — | N/A | unit (fs) | same — six include classes each named with file and line, and exit non-zero | ✅ | ✅ green |
| 03-02/T2 | 03-02 | 2 | SHARED-03 | — | N/A | unit (fs) | same — *the exemption is exactly one directory, named literally, and nothing else*, plus the near-miss rename arm | ✅ | ✅ green |
| 03-02/T2 | 03-02 | 2 | SHARED-03 | — | N/A | unit (fs) | same — empty library set and absent library directory both refuse rather than pass | ✅ | ✅ green |
| 03-02/T2 | 03-02 | 2 | SHARED-03 | — | N/A | unit (fs) | same — report stability and sort order across runs | ✅ | ✅ green |
| 03-02/T1 | 03-02 | 2 | SHARED-04 | — | N/A | unit (fs) | same — the detector that names a framework include and exits non-zero | ✅ | ✅ green |
| 03-03/T1 | 03-03 | 3 | criterion 4 | — | N/A | unit (fs) | same — *no tracked file uses a deprecated global-library directive, and only the reviewed list names one*, plus the planted-use/prose-mention arm | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**No fillable gaps.** Every requirement and criterion this phase declares has an automated, falsified test. The one half that automation cannot reach is recorded below as manual-only rather than silently marked green.

---

## Wave 0 Requirements

- [x] `tools/tests/check-hal-seam.test.mjs` — covers SHARED-01, SHARED-02, SHARED-03, SHARED-04 (19 cases at close)
- [x] A fixture helper for a shared-library tree — `tools/tests/helpers.mjs` gained `makeSharedLibTree` + `runSeamCheck`; `env-baseline.test.mjs` imports the same `.ini` reader rather than reimplementing it
- [x] Framework install: none — `node:test` ships with Node

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Editing a shared source changes the firmware | SHARED-02 (criterion 2) | A build observation. A test that spawned `pio` would couple every task commit to a binary the repository cannot assume is resolvable — the same reason `env-baseline.test.mjs` stays filesystem-only. | Edit `shared/lib/emb_log/src/emb_log.c`, rebuild `homeworks/project-baseline`, confirm exactly one TU recompiles (`libe14/emb_log/emb_log.c.o`), the new string is present in `firmware.bin` and the old is absent, and pointer mtimes are unchanged. Record verbatim in `SUMMARY.md`. **Discharged 2026-10-17 in `03-01-SUMMARY.md`.** |
| Moving a consumer one level deeper breaks library resolution | criterion 5 | Same reason as above — a build observation, taken once. | Three arms measured on a throwaway mirror: **A** (unmodified deeper copy) → `UndefinedEnvPlatformError`, exit 1, 0 objects; **B** (fragment path corrected, `lib_deps` at depth 2) → `PackageException: Can not create a symbolic link … not a directory`, exit 1, 0 objects; **C** (control, both corrected) → `[SUCCESS]`, 49 objects. **Discharged 2026-10-17 in `03-03-SUMMARY.md`; the roadmap wording was corrected to match.** |
| A commit is refused when a framework include is planted under `shared/lib` | SHARED-04, literal wording | The *detector* is automated and falsified (row above). The *refusal at commit time* needs a pre-commit hook, which this phase does not create — the plans declare any pre-commit hook out of scope, and `VERIFY-02` (Phase 6) owns wiring the same checks into pre-commit, pre-push and CI. | Until Phase 6 lands, the honest reading of SHARED-04 is "the detector exists and is proven". A reader must not treat it as "commits are blocked". Verify with `node tools/check-hal-seam.mjs` (exit 0 on the clean tree); to see a refusal, plant an include under `shared/lib` and re-run — it exits non-zero and names file and line. |

---

## ⚠ Divergence from the Roadmap's stated mechanism (criterion 5) — now discharged

ROADMAP success criterion 5 states the deeper-copy failure "arrives at library installation, before any translation unit is compiled". **Measured on the committed tree, that is not what an unmodified deeper copy does.** The baseline also consumes `extra_configs = ../../shared/pio/base.ini`, which is *also* project-relative; a naive deeper copy therefore fails **earlier**, at environment assembly, with `UndefinedEnvPlatformError: Please specify platform for 'projectbaseline_s3' environment`.

The roadmap's literal `PackageException` at library installation appears only once the fragment path is corrected to depth 3 while `lib_deps` stays at depth 2. All three arms were measured and are recorded in `03-03-SUMMARY.md`. **Plan 03-03 corrected the roadmap wording and the Phase 1 retiring trigger** (`689d306`), so this divergence is recorded, not smoothed over.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-10-17 — no fillable gaps; two manual-only items discharged with verbatim evidence, one half of SHARED-04 honestly deferred to Phase 6.

## Validation Audit 2026-10-17

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 1 |
