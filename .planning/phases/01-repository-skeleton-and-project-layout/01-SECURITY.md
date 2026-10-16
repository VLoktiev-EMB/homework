---
phase: "01"
slug: "repository-skeleton-and-project-layout"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-16"
---

# Phase 01 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

Register origin: **authored at plan time**. All 7 PLAN files carry a parseable
`<threat_model>` block with a STRIDE register, so this is a verification pass over an
existing register — no retroactive register was built and no new-threat scan was performed.

No SUMMARY.md in this phase carries a `## Threat Flags` heading (`grep -l "## Threat Flags"`
over the phase directory returns nothing), so there were no summary-authored flags to
incorporate. That section is genuinely absent, not skipped.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| filesystem → tool layer | Directory names under `homeworks/` are untrusted input: they become a path segment and an argument to a child process. | Path segments |
| filesystem → generated artifact | The tree decides the content of `homework.code-workspace`; a name matching the grammar is copied verbatim into a committed file. | Committed text |
| repo → public remote | Anything committed is world-readable forever. The course instructor and possibly employers read this history. | Everything, permanently |
| tool layer → PlatformIO | The tool layer spawns `pio` with a path it derived. No shell is involved. | Args |
| `.gitignore` → every future commit | This one file is the sole mechanism keeping machine-written artifacts and credentials out of the tree, and its failure mode is silent by design. | Ignore patterns |
| global git configuration → repository | The machine-local excludes file currently hides one artifact; a fresh clone without it has no such protection. | Ignore patterns |
| the machine's global excludes file → a fresh clone | A rule that exists only on this machine makes a clone dirty on day one — the exact state criterion 3 forbids. | Ignore patterns |
| generated editor state → repository | The C/C++ and launch configurations carry absolute machine paths. | Machine layout |
| repository documentation → agent behaviour | `AGENTS.md` and `PROJECT.md` are read by an agent before it acts; a wrong path there becomes a wrong directory on disk. | Instructions |
| dated research evidence → later phases | The research files deliberately record contradictions; editing them destroys the audit trail of what was decided when. | Dated evidence |
| sweep → a human or CI relying on it | A green sweep is an attestation that every homework builds. A false green is a false attestation. | Attestation |
| CLI → scanned root | The root override lets a caller point the sweep at a direction other than the repository. | Scan scope |
| phase log → every later reader | The phase log is the permanent evidence that the four criteria were met. An unobserved claim recorded as an observation is a false record. | Verbatim output |
| local machine → the repository tree | The acceptance run writes a build directory and a compilation database into the workspace, and temporarily creates a probe directory. | Build artifacts |
| editor session → git status | Format-on-save, final-newline insertion and extension-driven writers can modify files outside any build. | Working tree |
| the recorded measurement → every later reader | The summary is read by plan 01-07's ratification checkpoint and carries the evidence the discharge rests on. | Measurement |
| a temporary fixture → the tracked tree | The fixture is the one thing this plan creates outside version control; if it leaks into `homeworks/` it becomes unplanned phase work. | Temporary tree |
| the owner's recorded decision → the executor | The override's attribution fields are the only evidence that a person accepted a deviation; they are read from git and must not be supplied by the agent. | Attribution |
| the verification record → the milestone audit and the instructor | An override is surfaced before v1.0 closes and read as fact by every later reader. | Verdict |
| the roadmap contract → the eight phases planned against it | Criterion wording is what later phases and the milestone audit measure delivery against; editing it changes what the project says it promised. | Contract |
| the executor → the verdict | Status, score and gap rows are the verifier's computed output, not free text. | Verdict |
| the recorded reason → the measurement | The owner's stated reason is checkable against the two-arm measurement; a reason that survives only because nobody re-read it is the failure this record exists to prevent. | Rationale |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-1-01 | Tampering | `discoverHomeworks` → `homeworks/<id>` path interpolation | medium | mitigate | Frozen id regex excludes `.` and `/`; `readdirSync` never yields a multi-segment name, so only grammar-validated names reach a path string or a child-process argument. | closed |
| T-1-02 | Tampering / Information Disclosure | `findDepthViolations` walk | medium | mitigate | `readdirSync(dir, { withFileTypes: true })` + `isDirectory()` filter (false for a symlink); walk rooted at `homeworks/`. | closed |
| T-1-03 | Information Disclosure | `homework.code-workspace` and the baseline `platformio.ini` | high | mitigate | Only repo-relative paths committed; `grep` for `/Users/`, `/home/`, `/var/` over the committed artifacts returns nothing; both port keys deliberately omitted. | closed |
| T-1-04 | Tampering | the generated workspace file | medium | mitigate | `--check` compares on-disk bytes against freshly rendered bytes; live run exits 0 "up to date"; a hand-edited file is named rather than trusted. | closed |
| T-1-05 | Denial of Service | tooling with no lockfile | low | **accept** | Zero third-party dependencies: all `tools/` imports are `node:` built-ins or repo-relative. See Accepted Risks Log. | closed |
| T-1-06 | Information Disclosure | `.gitignore` secret block | high | mitigate | Secret patterns land before any code; every comment on its own line; asserted behaviourally — `git check-ignore -v server.pem` resolves to `.gitignore:108:*.pem` — plus a trailing-comment scan. | closed |
| T-1-07 | Tampering | over-broad ignore patterns | medium | mitigate | `sdkconfig.*` ignored while the hand-authored `sdkconfig.defaults` survives via a later negation; agent-state rules name files/dirs and never `.claude/` whole; the generated state file is named by exact path. | closed |
| T-1-08 | Information Disclosure | generated editor state | medium | mitigate | `.vscode/c_cpp_properties.json` and `.vscode/launch.json` ignored **by name**, each asserted with its source. | closed |
| T-1-09 | Tampering | `.gitattributes` binary/text classification | low | mitigate | Explicit `text` marks for every source and doc type; `*.svg text` with the never-mark-binary comment; binary types and `linguist-generated` firmware marks present. | closed |
| T-1-10 | Tampering | `AGENTS.md` library path | high | mitigate | No plural `shared/libs` occurrence survives (`grep -n 'shared/libs'` → no match); the two `shared/lib/` occurrences are correct. | closed |
| T-1-11 | Information Disclosure | `README.md` | medium | mitigate | No machine-local absolute path in the README; the documented remedy is the home-relative `$HOME/.platformio/penv/bin` export line. | closed |
| T-1-12 | Repudiation | `README.md` and `.planning/PROJECT.md` | medium | mitigate | The README tree block names only existing paths; no later-phase name (`.clang-format`, `.clang-tidy`, `pre-commit-config`, `.github/workflows`, `.agents/`) appears. | closed |
| T-1-13 | Tampering | `.planning/research/*` | low | mitigate | Only the two pre-phase research commits touch the directory; nothing since the phase began; the working tree there is clean. | closed |
| T-1-14 | Repudiation | the zero-match path | medium | mitigate | Zero discovered projects exits 1 with three readable lines; the only override is the single explicit `--allow-empty` flag, so the failure path is the default. | closed |
| T-1-15 | Tampering / Elevation | the build loop's child-process spawn | medium | mitigate | `spawnSync(pio, ["run", "-d", dir], …)` — argument array, no `shell` option; the plan's source gate for `exec(`/`execSync(`/`shell: true` re-run clean. | closed |
| T-1-16 | Denial of Service | the root override | low | **accept** | The flag only redirects a local read-only scan and a local build; it defaults to the repository itself and is reachable by nothing but the operator. See Accepted Risks Log. | closed |
| T-1-17 | Tampering | a policy failure delegated to a downstream tool error | medium | mitigate | Depth and id checks are pure filesystem inspections that run before the build loop and `process.exit(1)` immediately; the short-circuit test asserts the named rule appears and that a spawn failure does not. | closed |
| T-1-18 | Repudiation | the phase-log evidence | medium | mitigate | The phase log carries verbatim command output; both distinctive strings (the `6553600` partition size and the `DEPTH RULE VIOLATED` banner) are present, and the pre-phase baseline and machine-state classification are both written. | closed |
| T-1-19 | Tampering | making the clean-tree assertion pass | high | mitigate | `test -z "$(git status --porcelain)"` passes live; nothing staged; history shows no `.pio/`, `compile_commands.json`, `c_cpp_properties.json`, `launch.json` or `state.json` was ever committed — the ignore rule, not staging or deletion, is the mechanism. | closed |
| T-1-20 | Denial of Service | the depth probe's residue | low | mitigate | No probe directory survives under `homeworks/` or in the OS temp tree; removal and absence are asserted in the same verify block. | closed |
| T-1-21 | Information Disclosure | the phase log | low | mitigate | The log carries the build's size line and the rule banner; the one machine-specific value is the home-relative PlatformIO prefix the plan itself documents as the sanctioned form. | closed |
| T-1-22 | Tampering | making the clean-tree claim true | high | mitigate | `isRepoOwnedIgnoreSource()` accepts the root `.gitignore` or a nested one **only while git tracks it**, with absolute-path and `..`-segment guards. Live: `.planning/milestone.lock` → `.gitignore:96:.planning/*.lock`, suite 32/32. Tracked-ness confirmed load-bearing by negative-case reproduction. | closed |
| T-1-23 | Repudiation | the recorded two-arm measurement | high | mitigate | Both arm headings present exactly once in the summary; both arms' exit statuses and verbatim output recorded; the anti-retry contract is written into the task action. | closed |
| T-1-24 | Tampering | over-broad ignore patterns | medium | mitigate | `git ls-files -i -c --exclude-standard` prints nothing (asserted, passes live); the not-ignored table names the tracked planning configuration, project brief, requirements, roadmap and IDF defaults file by name. | closed |
| T-1-25 | Tampering | the throwaway fixture escaping into the tree | medium | mitigate | No grammar-matching directory beyond the pre-existing `project-baseline`; porcelain clean; the deeper arm is built by explicit-path copy. | closed |
| T-1-26 | Denial of Service | the two-arm build | low | mitigate | The fixture reuses the already-installed `espressif32@7.1.3`; no manifest added, no network dependency, no simulation invocation. | closed |
| T-1-32 | Repudiation | the override's attribution fields | high | mitigate | `accepted_by: "4oc3p"` matches `git log -1 --format='%an|%ad' bf60cca` exactly; not a placeholder and not the agent's name. | closed |
| T-1-33 | Tampering | ROADMAP Phase 1's criterion 2 wording | high | mitigate | `git log -S` on the criterion sentence shows only the roadmap-creation commit; the discharge note was appended with 0 deletions. | closed |
| T-1-34 | Tampering | the verification record's verdict fields | high | mitigate | Plan 01-07's commit touched only `overrides_applied` (0→1) and the `overrides:` block; status, score and prose were untouched, then recomputed by a later re-verification. | closed |
| T-1-35 | Repudiation | the override's reason versus the measurement | medium | mitigate | The summary carries the explicit "confirm or disagree" question with its verdict and the non-disagreement nuance; the task acceptance is recorded. | closed |
| T-1-36 | Tampering | ROADMAP Phase 3's success criteria | medium | mitigate | The Phase 3 criterion was appended under a new number with criteria 1–4 untouched and `**Plans:** TBD` unchanged; the distinguishing phrase is present. | closed |
| T-1-37 | Denial of Service | the re-run of the phase's gates | low | mitigate | One `pio run` against the already-resolved platform, two Node scripts and `node --test` — no network fetch, no simulation, no package install. | closed |
| T-1-SC | Tampering | npm/pip/cargo installs | high | mitigate | No package-manager manifest exists on disk or anywhere in history; no `npm install`/`pip install`/`pio pkg install` call in `tools/`, `.vscode/` or `homeworks/`; no `node_modules/`. Applies repo-wide — the row is repeated identically in all 7 plans and is collapsed here to one. | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01 | T-1-05 (DoS, low) | Zero third-party dependencies means there is nothing to pin and nothing to hijack. The tool layer imports only `node:` built-ins and `node:test` ships with the runtime. The cost is that a future Node major could change test-runner discovery, which the explicit quoted glob `"tools/**/*.test.mjs"` already insulates against. | 4oc3p | 2026-10-15 |
| AR-02 | T-1-16 (DoS, low) | The `--root` override only redirects a local read-only scan and a local build. It is not reachable by anything but the person running the command, it defaults to the repository itself, and pointing it elsewhere can neither exfiltrate data nor modify the repository. Accepting it is the price of testable failure paths. | 4oc3p | 2026-10-15 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-16 | 33 | 33 | 0 | gsd-security-auditor (via /gsd-secure-phase 01) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-16
