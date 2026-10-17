---
phase: "03"
slug: "shared-libraries-and-the-hardware-seam"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-17"
verified: "2026-10-17"
---

# Phase 03 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

Register origin: **authored at plan time**. All 3 PLAN files carry a parseable
`<threat_model>` block with a STRIDE register, so this is a verification pass over an
existing register — no retroactive register was built and no new-threat scan was performed.

All three SUMMARY files carry a `## Threat Flags` section, and all three read "None"
(`03-01-SUMMARY.md:431`, `03-02-SUMMARY.md:392`, `03-03-SUMMARY.md:511`). There were
therefore no summary-authored flags to incorporate.

The reserved supply-chain row `T-03-SC` is repeated identically in all three plans; it is
collapsed here to one row, as it was in Phase 01.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| repository → public remote | Everything committed is world-readable forever, and the git history is an artifact the course instructor reads. | Everything, permanently |
| the shared library tree → every future homework | These three directories become the code every later homework links; an ABI or layout mistake here is copied dozens of times before anyone notices. | ABI and header layout |
| the C++ shim → the C seam | Two languages meet at one include site; the guard in the header is the only thing standing between a correct link and a mangled-symbol error that names the wrong cause. | Symbol linkage |
| the framework → the shared tree | Exactly one directory may cross this boundary. Every other crossing removes the host-testability and the framework-swap property the phase exists to create. | Framework headers |
| a throwaway measurement → the tracked tree | The host driver is the one thing this phase creates outside version control; a leak into the shared tree becomes unplanned phase work. | Temporary tree |
| the shared library tree → the check's verdict | The check reads untrusted content — any file under the shared tree — and turns it into a pass or a fail. Every path it reports becomes repository-relative output a human reads. | Scan input and verdict |
| the check → the seam's integrity | A false negative here is silent and permanent: the framework include compiles, the seam is gone, and nothing downstream notices until the framework era changes. | Verdict |
| the exemption list → the boundary it expresses | One line, one entry, and the one keystroke that widens the hole the check exists to close. | Exemption scope |
| a fixture tree → the tracked tree | Every case builds a tree under the temporary directory; a leak into `shared/lib/` would be read as a real library by the check itself. | Temporary tree |
| the consumer's configuration → the installed package name | The left-hand side of a dependency spec overrides the installed folder name while the dependency scanner reads the manifest, so a mismatch yields two names for one library. | Manifest fields |
| the tracked tree → the scan's verdict | The scan reads every tracked file's content and turns it into a pass or a fail; a git failure that yields an empty list would read as a clean repository. | Verdict |
| a mirrored tree → the tracked tree | The three depth arms build copies of the project and the shared tree; every one of them is a candidate to leak a build directory or a copied file into version control. | Build artifacts |
| a measurement → the roadmap's text | The corrections write claims into the repository's durable plan; a claim written from expectation rather than from the recorded reading outlives everyone who could have checked it. | Dated evidence |
| the roadmap file → every other phase's definition | Three scoped corrections sit inside a file whose other content is the specification for seven other phases; an unscoped write destroys them. | Phase contracts |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-03-01 | Information disclosure | `shared/lib/**`, `homeworks/project-baseline/**`, `03-01-SUMMARY.md` | high | mitigate | No machine-local absolute path may reach a tracked file. `git grep` for `/Users/`, `/home/`, `/opt/`, `/var/folders`, `/private/` over the shared tree, the baseline and every tracked phase-3 file returns no match; `VERSIONS.md`'s no-machine-local-path assertion (`tools/tests/env-baseline.test.mjs:247-260`) is green. One residual — the session temp path `/tmp/claude-501/…` inside verbatim transcripts — is recorded as advisory A1 and is below the bar. | closed |
| T-03-02 | Spoofing (of evidence) | the live-edit and host-compilation readings | high | mitigate | `03-01-SUMMARY.md` §"Reading one" (:219) and §"Reading two" (:304) each carry the exact `$` command, `EXIT=`, and verbatim output; the restore is asserted (`git diff --exit-code -- shared/lib/emb_log/src/emb_log.c`, recorded `EXIT=0`). | closed |
| T-03-03 | Tampering | the seam's purity contract | high | mitigate | Structural, verified by `grep -rn '#include' shared/lib/`: `emb_hal` is `include/`-only, `emb_hal_arduino` is `src/`-only, `emb_log` carries both; exactly one framework-including unit (`shared/lib/emb_hal_arduino/src/emb_hal_arduino.c:28-29`); guard `EMB_HAL_H` at `emb_hal.h:21-22` with `extern "C"` at `:26-28`, `EMB_LOG_H` at `emb_log.h:19-20`; the seam check scans every non-exempt directory. | closed |
| T-03-04 | Denial of service | the baseline builds in tasks 1 and 3 | low | accept | The builds reuse the installed `espressif32@7.1.3` / Arduino core 2.0.17 / toolchain, install no package and run no simulation. See Accepted Risks Log. | closed |
| T-03-05 | Tampering | `tools/check-hal-seam.mjs` — the scan's verdict | high | mitigate | Independently re-probed on a throwaway tree: an include planted in `readme.txt` and in `thing.hpp` was caught, so no extension filter exists; the quoted form was caught. `INCLUDE_PATTERN` is anchored at `tools/check-hal-seam.mjs:77` over both `[<"]` and `[>"]`. Empty tree exits 1 with "A gate that checked nothing must not exit 0."; an absent `shared/lib` is refused the same way; the clean run prints `scanned 2 libraries under shared/lib; no framework include found`. | closed |
| T-03-06 | Tampering | the exemption list | high | mitigate | `export const ALLOWED = ["emb_hal_arduino"]` at `tools/check-hal-seam.mjs:74`, applied at the first level only and by exact name (`:147`, `directoriesIn(scanRoot).filter((name) => !ALLOWED.includes(name))`). Both paired cases pass: the exempt directory passes the include over, and renaming it to `emb_hal_arduino_alt` makes the check name it. | closed |
| T-03-07 | Information disclosure | fixture trees and the summary | medium | mitigate | `tools/tests/helpers.mjs:54` creates every fixture with `mkdtempSync(join(tmpdir(), "homework-fixture-"))`, pushed to `created` and removed by `cleanupAll` via `test.after`; every reported path is repository-relative, never resolved. Same `/tmp/claude-501` residual as `T-03-01` — advisory A1. | closed |
| T-03-08 | Spoofing (of evidence) | the check's reported outcome | medium | mitigate | Every case in `tools/tests/check-hal-seam.test.mjs` asserts a named string (`shared/lib/…:3: Arduino.h`, `missing: …`, the `lib_deps` trap, `shared/lib`); no case asserts only an exit status; `manifestProblems` / `consumerProblems` / `directiveProblems` run on both the real-tree arm and the fixture arm. The register's case-count clause is discharged only at plan time — advisory A2. | closed |
| T-03-09 | Spoofing (of evidence) | the three depth arms and the roadmap corrections | high | mitigate | `03-03-SUMMARY.md` §Arm A (:207), §Arm B (:227) and §Arm C (:253), each with exact command, `EXIT=`, verbatim output and object count; the mandatory control arm is present and shows `[SUCCESS]`; the divergence from the predicted failure is stated in plain words. | closed |
| T-03-10 | Tampering | `.planning/ROADMAP.md` | high | mitigate | `git show 689d306 --numstat` → `7 2 .planning/ROADMAP.md` only — a scoped edit that touched no other file, so the "requirements document untouched by a diff check" clause holds by construction; `### Phase` heading count is still 8; dated corrections present at `ROADMAP.md:48, 108, 111, 114`. | closed |
| T-03-11 | Tampering | a mirrored build escaping into the tracked tree | medium | mitigate | The mirror lived at the fixed path `${TMPDIR}/phase03-depth`; residue is absent now (`test ! -d "${TMPDIR:-/tmp}/phase03-depth"` → exit 0); `03-03-SUMMARY.md` §"Removal and residue" records the removal together with an empty `git status --porcelain`. | closed |
| T-03-12 | Tampering | the tracked-file scan's verdict | medium | mitigate | `trackedFiles()` (`tools/tests/check-hal-seam.test.mjs:716-727`) spawns `git ls-files --cached -z` with `cwd: REPO_ROOT` and `assert.equal(result.status, 0, …)`, so a git failure is a loud assertion failure rather than an empty list that reads as clean. `DIRECTIVE_MENTION_EXCEPTIONS` (`:595-609`) is a literal reviewed list; the falsification arm plants a real use and asserts it is reported while the same string in prose counts as a mention. | closed |
| T-03-13 | Denial of service | the three mirror builds | low | mitigate | The arms' only install lines are `Library Manager: Installing symlink://…` — a local symlink of committed sources. No registry package download, no simulation, Wokwi budget untouched. | closed |
| T-03-SC | Tampering | npm/pip/cargo installs | high | mitigate | `grep -c scripts shared/lib/*/library.json` → 0, 0, 0; no tracked `package.json`, `package-lock.json`, `yarn.lock`, `requirements.txt`, `Cargo.toml`/`Cargo.lock`, `pyproject.toml`, `poetry.lock` or `Gemfile`. Applies repo-wide. | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-03 | T-03-04 (DoS, low) | The builds this phase measures reuse the already-installed `espressif32@7.1.3`, the Arduino core and its Xtensa toolchain. They install no package and run no simulation, so they consume neither a package download nor the Wokwi simulation budget. A build that contacts the usage collector and is denied still succeeds — the denial appears in the log beside a successful build and is not a failure. | 4oc3p | 2026-10-17 |

*Accepted risks do not resurface in future audit runs.*

*Risk IDs continue the repository-wide sequence begun in `01-SECURITY.md` (AR-01, AR-02); Phase 02 recorded no accepted risks.*

---

## Audit Advisories

Findings the auditor raised that are **not** threats and do **not** count toward `threats_open`.
They are recorded because two of them are evidence-integrity residues of exactly the kind
`T-03-02`, `T-03-08` and `T-03-09` exist to catch.

**A1 — session temp path recorded in verbatim transcripts (`T-03-01`, `T-03-07`).** `03-01-SUMMARY.md` lines 323, 324, 336, 352, 363 and 469, and `03-03-SUMMARY.md` lines 189 and 322, name throwaway directories by their resolved session path `/tmp/claude-501/…` inside command transcripts, whereas the plans' wording asks for the role-named `${TMPDIR}` form. Classified as below the bar rather than a machine-local path, because the repository's own enforced definition of "machine-local path" is `/Users/|/home/|/opt/|.platformio/` (`tools/tests/env-baseline.test.mjs:253`), which does not match `/tmp/claude-501`; because the string discloses only a sandbox uid, not a username, home directory or repository location; and because the tree already tracks `/Users/vloktiev/…` paths in Phase-1 artifacts (`01-06-SUMMARY.md:354`, `01-07-SUMMARY.md:380`), which discloses strictly more. A one-line redaction in those transcripts would bring the phase into strict compliance with the "never by their full path" clause; it is not required.

**A2 — the case-count clause is plan-time, not a suite assertion (`T-03-08`).** The register's "the suite's case count is asserted" is discharged only by the plans' `<verify>` one-liners (`if(n<9)` in 03-02 task 2, `if(n<13)` in task 3 — lower bounds), which ran once at execution. No persistent in-suite assertion of the count exists (`grep -E 'assert\.(equal|ok)\([^)]*(19|17|13|9)'` returns nothing), so a case dropped after this phase would be invisible. `T-03-08` stays **closed** because the mitigation's substance — named assertions, no exit-status-only cases, one predicate in both arms — is present and the count was asserted at plan time. But `03-02-SUMMARY.md`'s "patterns established" line, *"A suite asserts the number of cases it holds"*, overstates the code as written.

**A3 — suite size drift in prose.** `03-02-SUMMARY.md` states 17 cases and `ROADMAP.md:108` cites "17 cases"; the suite now holds 19, because plan 03-03 appended two after that line was written. Measured: `grep -cE '^test\(' tools/tests/check-hal-seam.test.mjs` → 19. Documentation-only; the same drift is already noted in `STATE.md`.

**A4 — live behaviour re-confirmed by the auditor, not accepted from the record.** `node tools/check-hal-seam.mjs` → exit 0, `scanned 2 libraries under shared/lib; no framework include found`; `--root` with no value → exit 2; an unknown argument → exit 2; `node --test tools/tests/check-hal-seam.test.mjs` → 19 tests, 19 pass, 0 fail.

**A5 (informational, out of scope).** `03-REVIEW.md`'s open warnings WR-01…WR-05 and info IN-01…IN-08 have no threat-register mapping. They are code-review findings, not declared threats, and were not verified as threats here. Their triage is tracked in `03-REVIEW-DISPOSITION.md` and in `STATE.md`'s open-question list.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-17 | 14 | 14 | 0 | gsd-security-auditor (via /gsd-secure-phase 03; full audit, not the ASVS-L1 short-circuit) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-17
