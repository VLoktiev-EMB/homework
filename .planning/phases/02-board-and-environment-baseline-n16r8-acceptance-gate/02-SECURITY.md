---
phase: "2"
slug: "board-and-environment-baseline-n16r8-acceptance-gate"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-16"
verified: "2026-10-16"
---

# Phase 2 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| repository → public remote | Anything committed is world-readable forever, and the git history is an artifact the course instructor reads. | Source, configuration, planning artifacts |
| the shared fragment → every future homework | `shared/pio/base.ini` becomes the sole carrier of the exact-version pin and the module overrides; a wrong value here is inherited silently by every project created after it. | Configuration values |
| a machine's serial devices → the flash target | The port is resolved by a pattern at run time, first match with no warning, so what the pattern matches is a decision made by the tool rather than by the file. | Device node / flash payload |
| the physical board → the phase log | The eFuse and firmware readings are the only evidence about what is attached; an inference in their place becomes fact for every later phase. | Measurement evidence |
| a throwaway fixture → the tracked tree | The measurement fixtures are the only things this phase creates outside version control; a leak becomes unplanned phase work. | Fixture files |
| the recorded measurement → every later reader | The summaries and the phase log are read by later phases as evidence the criteria lean on. | Evidence records |
| the phase log → every later phase | The phase log is read as fact rather than as a claim to be re-tested. | Evidence records |
| the test suite → the host | A test that spawns a build would couple a sub-second suite to a toolchain and a network. | Process invocations |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-02-01 | Information disclosure | `shared/pio/base.ini`, `02-01-SUMMARY.md` | high | mitigate | The port is a narrow glob pattern, never a literal device node, and no machine-local absolute path is recorded. Verified: all three port keys in the committed fragment carry `*`. | closed |
| T-02-02 | Spoofing (of evidence) | the merge-semantics and contrast readings | high | mitigate | Every reading is recorded with the exact command, the exit status and the verbatim output, asserted by named-heading greps. Verified: `02-01-SUMMARY.md` carries 2 arm headings and 5 reading headings. | closed |
| T-02-03 | Tampering | the exact-version pin in the fragment | high | mitigate | The pin is a single literal exact released version with no range operator and no branch reference. Verified: `platform = espressif32@7.1.3`; zero `#` characters in the fragment. | closed |
| T-02-04 | Tampering | a throwaway fixture escaping into the tree | medium | mitigate | Every fixture root is a fixed path under the operating system's temporary directory, removed inside the task that made it, with its absence asserted. Verified: no `phase02-*` root under `$TMPDIR`. | closed |
| T-02-05 | Denial of Service | the three throwaway builds and configuration reads | low | mitigate | The fixtures reuse the already-installed platform and framework, install no package, open no network connection and run no simulation, consuming neither a package download nor the simulation quota. | closed |
| T-02-06 | Information disclosure | `shared/pio/VERSIONS.md` | high | mitigate | The record is produced from the non-verbose package-listing form and trimmed to name plus version, so no machine-local path enters it. | closed |
| T-02-07 | Tampering | the environment assertion's strength | high | mitigate | The platform value is compared as a literal exact string — `@`+digit required, `#` forbidden — so a range or a branch turns the assertion red. | closed |
| T-02-08 | Denial of Service | the test suite's runtime | medium | mitigate | The new test spawns no process. Verified: zero `spawnSync` / `resolvePio` occurrences in `tools/tests/env-baseline.test.mjs`; the suite runs in 642 ms. | closed |
| T-02-09 | Repudiation | the conventions file as a source of truth | medium | mitigate | The file is touched only where a resolved-version fact belongs. Verified: `AGENTS.md` is unmodified by this phase — the prescribed comparison showed its rows already agree with the record. | closed |
| T-02-10 | Tampering | fixture residue from the new test | low | mitigate | The fixture builder lives under the operating system's temporary directory and removes its root. Verified: no residue under `$TMPDIR`. | closed |
| T-02-11 | Spoofing (of evidence) | the acceptance readings in the phase log | high | mitigate | Each reading carries either the verbatim output or an explicit marker that it was not observed with its command and failure output beside it; criterion 2 is met only when both the flash-die reading and the firmware report exist. Verified: 6 reading headings in `02-03-SUMMARY.md`, **0** unfilled slots. | closed |
| T-02-12 | Tampering | the flash target | high | mitigate | The port is identified by the run's own before-and-after device inventory and passed explicitly to every flash invocation; the flasher's auto-detect is named as the failure mode it is. Verified: `Auto-detected: /dev/cu.usbmodem5CBC0287411` matched the inventory diff's single new node; `flash_id` was invoked with an explicit `-p`. | closed |
| T-02-13 | Information disclosure | the observed device node and the committed port pattern | high | mitigate | The literal node is recorded in the phase log only; a verification step asserts all three port keys still carry a pattern. Verified: "all three ports are patterns". | closed |
| T-02-14 | Repudiation | the console decision | medium | mitigate | The device-inventory diff is present in the log, with the socket used, the node observed and whether the committed pattern matched. Verified: reading 3 records the socket, the node, the non-match, and the corrected form. | closed |
| T-02-15 | Tampering | a correction to the port pattern made to fit the machine | medium | mitigate | A correction is permitted only on the measurement's evidence, keeps the pattern form, is mirrored into the documents that name it, and must be followed by a green build and configuration reading. Verified: `3bb3f87`; build, config reading and the full suite re-run green afterwards. | closed |
| T-02-16 | Denial of Service | the acceptance run | low | mitigate | The run builds, flashes and monitors only; it installs no package, starts no network service and consumes none of the simulation quota. | closed |
| T-02-SC | Tampering | npm/pip/cargo installs | high | mitigate | This phase installs **no** package and adds no package-manager file. Verified: no `package.json`, `package-lock.json`, `requirements.txt`, `Cargo.toml` or `pyproject.toml`; zero `lib_deps` declarations. The Package Legitimacy Audit in `02-RESEARCH.md` is empty because nothing was proposed, so no blocking human verification checkpoint was emitted. | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

**Register origin:** authored at plan time — every one of this phase's three PLAN files carries a parseable `<threat_model>` block with a STRIDE register.

---

## Accepted Risks Log

*No accepted risks.*

The one residual this phase recorded — that the corrected console pattern cannot separate the board's two USB sockets, which enumerate under the same prefix — is **not** an accepted risk. Both sockets reach the same chip, so a flash is safe either way, and the residual is a documented limitation of the pattern rather than an unmitigated threat. It is recorded in `02-03-SUMMARY.md` under "Known deviations and residual risk".

A second residual is recorded there too and is likewise not a security risk: `pio device monitor` cannot be scripted, so the firmware reading was taken by a direct serial read — the substitution is the tool's own recommendation, quoted in the log.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-16 | 17 | 17 | 0 | /gsd-secure-phase 2 (short-circuit: threats_open 0 + register authored at plan time + ASVS L1) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log (none)
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-16

---

*The short-circuit was taken deliberately: with `threats_open: 0`, a register authored at plan time, and `asvs_level == 1`, the L1 grep-depth classification above is the contract's sufficient check and the auditor was not spawned. Had the ASVS level been 2 or higher, the auditor would have been required for L2 boundary-placement and L3 end-to-end trace checks regardless of the clean classification.*
