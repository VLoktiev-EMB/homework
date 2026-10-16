---
phase: 02-board-and-environment-baseline-n16r8-acceptance-gate
plan: 02
subsystem: config
tags: [platformio, esp32-s3, n16r8, version-record, regression-test, console-glob, extra_configs]

requires:
  - phase: 02-board-and-environment-baseline-n16r8-acceptance-gate
    provides: "shared/pio/base.ini — the shared fragment carrying the exact platform pin, the four N16R8 overrides, the PSRAM flag and the three console port globs, with its merge semantics measured in both directions"
  - phase: 01-repository-skeleton-and-project-layout
    provides: "The one-homework layout, the frozen id grammar, envNames(), the sweep and workspace drift gates, and the ignore-contract test stance this plan's new test matches"
provides:
  - "shared/pio/VERSIONS.md — the resolved version record ROADMAP criterion 3 depends on, read together with the fragment beside it"
  - "tools/tests/env-baseline.test.mjs — a pure-Node regression gate over the fragment's resolved path, its override keys and the version record"
  - "makeFragmentConsumer() — the fixture builder that makes the resolved-path assertion falsifiable rather than merely passable"
  - "The settled console decision stated where the baseline README previously declared the opposite, and the version record reachable from both READMEs"
affects: [02-03, 03, 04, 05, 06, 08]

actuals:
  tokens: 5164
  tasks: 3
  commits: 4
  plan_head_before: 226956ac3944fc5702f2652d7a6fa96ebc94e5a4
  # `commits` counts the three task commits below plus this summary's own carrier
  # commit, matching 02-01's convention; `git rev-list --count <plan_head_before>..HEAD`
  # read 3 at authoring time, before that carrier commit existed. `plan_head_after` is
  # deliberately omitted rather than guessed: this file's carrier commit is the plan
  # tip, so a hash written here would be stale the moment it is committed.

tech-stack:
  added: []
  patterns:
    - "A resolved version record beside the pin it belongs to, produced from the package lister's non-verbose form and trimmed to name and version so no cache prefix reaches a public history"
    - "A pure-filesystem regression gate whose existence assertion is exercised against a correct, a misplaced and an absent fixture layout, so it is shown to distinguish rather than merely to pass"
    - "Environment configuration read by iterating `env:<name>` entries and reading the bare global defaults block for inheritance only, never selecting it as an environment"

key-files:
  created:
    - shared/pio/VERSIONS.md
    - tools/tests/env-baseline.test.mjs
  modified:
    - tools/tests/helpers.mjs
    - homeworks/project-baseline/README.md
    - README.md

key-decisions:
  - "The record is produced from the non-verbose listing form; the verbose form's absolute package-cache prefix is never copied, and both the task verification and the committed test assert its absence"
  - "AGENTS.md was left untouched — its measured-facts rows already agree with the record, and the record is authoritative for the resolved set rather than the reverse"
  - "makeFragmentConsumer derives the environment name from envNames() rather than spelling it by hand, and its options plant the fragment at a wrong location or omit it entirely"
  - "The platform pin is compared per environment as a literal exact string: an at-sign followed by a digit is required and a branch marker is forbidden, with the bare defaults block read for inheritance but never selected as an environment"

patterns-established:
  - "Resolved-version record: name + version only, beside the pin, never the verbose listing form"
  - "Falsifiable existence assertion: every path assertion is exercised against a deliberately wrong layout as well as a correct one"

requirements-completed: [HW-01, HW-04]

coverage:
  - id: D1
    description: "shared/pio/VERSIONS.md records the resolved platform, Arduino framework, uploader and compiler toolchain packages as name and version, with the full resolved set listed and a note naming what the arduino framework compiles against — and carries no machine-local path"
    requirement: "HW-04"
    verification:
      - kind: unit
        ref: "node --test tools/tests/env-baseline.test.mjs#the version record names the resolved package set"
        status: pass
      - kind: unit
        ref: "node --test tools/tests/env-baseline.test.mjs#the version record carries no machine-local path"
        status: pass
      - kind: unit
        ref: "grep -c 'espressif32 @ 7.1.3' shared/pio/VERSIONS.md => 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "The phase's regression gate: the fragment resolves from the baseline's extra-configs key and exists there, its four override keys carry their required values, and the version record names the resolved set — with the resolved-path half shown to distinguish a correct layout from a misplaced and an absent one"
    requirement: "HW-01"
    verification:
      - kind: unit
        ref: "node --test tools/tests/env-baseline.test.mjs => 6 tests, 6 pass, 0 fail, 37 ms"
        status: pass
      - kind: integration
        ref: "node --test \"tools/**/*.test.mjs\" => 38 tests, 38 pass, 0 fail, 644 ms"
        status: pass
      - kind: unit
        ref: "falsification run: the fragment's flash-size value changed to 8MB turns the override test red with the stated reason, then the file was restored and the tree confirmed clean"
        status: pass
    human_judgment: false
  - id: D3
    description: "The baseline README's replacement console section: the UART bridge as the settled default, the device-name glob it is carried by, the loud-failure mode of a pattern matching nothing, and the single-key override path"
    requirement: "HW-04"
    verification:
      - kind: unit
        ref: "grep -c 'usbserial' homeworks/project-baseline/README.md => 1; ! grep -q 'Why no console port is pinned' => exit 1"
        status: pass
      - kind: unit
        ref: "grep -c 'VERSIONS.md' homeworks/project-baseline/README.md => 1"
        status: pass
    human_judgment: true
    rationale: "The plan enumerates three content requirements for the replacement prose (the bridge survives reset/crash/sleep, the glob is not a literal node, a non-matching pattern fails loudly). The committed gate checks the glob's presence and the old heading's removal; whether the prose actually states all three parts to a reader is a reading judgment, not a machine check."
  - id: D4
    description: "The repository README shows shared/pio/ beside shared/lib/, naming the fragment and the version record, and its building section names the platform pin and the console decision with a pointer at the record — with neither README restating the resolved version numbers"
    verification:
      - kind: unit
        ref: "grep -c 'shared/pio/base.ini' README.md => 1; grep -c 'shared/pio/VERSIONS.md' README.md => 1"
        status: pass
      - kind: unit
        ref: "grep -c '7\\.1\\.3' README.md => 0 and => 0 in homeworks/project-baseline/README.md; ls shared/pio/ | grep -c README.md => 0"
        status: pass
      - kind: integration
        ref: "node tools/generate-workspace.mjs --check => 'homework.code-workspace is up to date', exit 0"
        status: pass
    human_judgment: false

duration: 2 min
completed: 2026-10-16
status: complete
---

# Phase 02 Plan 02: The Version Record and the Environment Gate Summary

**The resolved N16R8 environment is committed beside its pin as name-and-version only, and the fragment that carries the pin — plus the record — is now gated by a 37-millisecond pure-Node test that was shown to fail on a dropped value before it was trusted.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-10-16T20:19:10Z
- **Completed:** 2026-10-16T20:21:24Z
- **Tasks:** 3
- **Files modified:** 5 (three source, two of them new)

## Accomplishments

- `shared/pio/VERSIONS.md` written from the package lister's **non-verbose** form: the resolved
  platform and its exact version, the Arduino framework, the uploader, both compiler toolchains
  and the eight supporting tools the platform declares — each as name and version, with no cache
  prefix and no home-directory segment anywhere in the file.
- The full resolved set is listed rather than filtered, with a one-line note naming the two
  packages the `arduino` framework actually compiles against, so the record does not make that
  judgement on a reader's behalf.
- `tools/tests/helpers.mjs` extended with exactly one new export, `makeFragmentConsumer()`, which
  installs a fragment under a fixture's shared tree beside a consumer under its homework tree,
  with the extra-configs key computed from the same relative arithmetic a real project uses.
- `tools/tests/env-baseline.test.mjs` added: 6 assertions, 37 ms, no child process. It resolves
  the baseline's extra-configs key the way the tool does, asserts the fragment exists there, and
  exercises a **correct, a misplaced and an absent** fixture layout so the check is shown to
  distinguish them rather than merely to pass.
- Both READMEs now carry the console decision and reach the version record; the baseline README's
  section declaring the port unset is **replaced**, not annotated.

## What the record says, as written

Measured with `pio pkg list -d homeworks/project-baseline` (exit 0), trimmed to name and version:

| Package | Resolved version |
| --- | --- |
| Platform | `espressif32 @ 7.1.3` |
| Arduino framework | `framework-arduinoespressif32 @ 4.20017.260907+sha.dcc1105b` |
| ESP-IDF framework | `framework-espidf @ 4.60100.0` |
| Uploader | `tool-esptoolpy @ 2.41100.260830` |
| Compiler toolchains | `toolchain-xtensa-esp32s3 @ 8.4.0+2021r2-patch5`, `toolchain-xtensa-esp-elf @ 15.2.0+20251204`, `toolchain-riscv32-esp @ 8.4.0+2021r2-patch5`, `toolchain-esp32ulp @ 1.23800.240113` |
| Supporting tools | `tool-cmake @ 3.30.2`, `tool-esp-rom-elfs @ 0.0.1+20241011`, `tool-mkfatfs @ 2.0.1`, `tool-mklittlefs @ 1.203.210628`, `tool-mkspiffs @ 2.230.0`, `tool-ninja @ 1.13.2` |

## Did the conventions file need aligning?

**No — `AGENTS.md` is unmodified.** The comparison the plan prescribes was made against the file
as it actually stands, not against memory:

- Resolved Arduino framework: the measured-facts table already carries
  `framework-arduinoespressif32` `4.20017.260907+sha.dcc1105b` (line 152) — it **agrees** with
  the record.
- Resolved compiler toolchain: `toolchain-xtensa-esp32s3` `8.4.0+2021r2-patch5` is already stated
  (line 37, and again at line 136) — it **agrees** with the record.

Neither row disagrees, so no row was corrected and no fact was added. The record is authoritative
for the resolved set; the conventions file was left alone, which is the branch the plan's
prohibitions prefer.

## The new gate's test count

`node --test tools/tests/env-baseline.test.mjs` → **6 tests, 6 pass, 0 fail, `duration_ms` 37.1**.
The full quoted-glob suite went from 32 to **38 tests, 38 pass, 0 fail, `duration_ms` 644.3**.

## Task Commits

| Task | Name | Commit | Type |
|---|---|---|---|
| 1 | Record the resolved version set beside the pin, and align the conventions file to it | `895271b` | docs |
| 2 | Gate the fragment and the version record with a pure-filesystem regression test | `0785902` | test |
| 3 | Put the console decision and the version record in front of a reader | `71fc9d6` | docs |

## Files Created/Modified

- `shared/pio/VERSIONS.md` (new) — the resolved version record: the header naming what the file
  is for, the source form it was produced from, and the full resolved set as a name/version table.
- `tools/tests/env-baseline.test.mjs` (new) — the regression gate, in the read-only real-repo
  stance of `ignore-rules.test.mjs`, with the asserted items kept as data carrying their reasons.
- `tools/tests/helpers.mjs` (extended) — one new export, `makeFragmentConsumer()`, plus the import
  of `envNames` it derives the environment name from. Existing exports unchanged.
- `homeworks/project-baseline/README.md` (modified) — the console section replaced with the
  settled decision, and the build section redirected from an override set in the project file to
  the shared fragment. The `6553600`-byte partition claim is unchanged.
- `README.md` (modified) — the structure block widened to show `shared/pio/` beside `shared/lib/`,
  and the building section pointing at the platform pin, the console decision and the record.

## Verification

Run from the repository root, with PlatformIO resolvable at `~/.platformio/penv/bin/pio`:

| Check | Result |
|---|---|
| `node --test "tools/**/*.test.mjs"` | 38 tests, 38 pass, 0 fail (`duration_ms` 644.3) |
| `node tools/generate-workspace.mjs --check` | `homework.code-workspace is up to date`, exit 0 |
| `node tools/sweep-homeworks.mjs --list` | exactly `project-baseline`, exit 0 |
| `node tools/sweep-homeworks.mjs` | `[SUCCESS] Took 2.73 seconds`, 6553600-byte partition |
| `pio run -d homeworks/project-baseline 2>&1 \| grep -c 6553600` | `1` |
| `git status --porcelain` | empty |
| `grep -c 'espressif32 @ 7.1.3' shared/pio/VERSIONS.md` | `1` |
| `grep -c 'VERSIONS.md' shared/pio/base.ini` | `1` |
| `grep -c 'spawnSync\|resolvePio' tools/tests/env-baseline.test.mjs` | `0` |
| `grep -c 'export function makeFragmentConsumer' tools/tests/helpers.mjs` | `1` |
| `grep -c 'BOARD_HAS_PSRAM' tools/tests/env-baseline.test.mjs` | `1` |
| `grep -c 'cleanupAll' tools/tests/env-baseline.test.mjs` | `2` |
| `! grep -q 'Why no console port is pinned' homeworks/project-baseline/README.md` | exit 1 (absent) |
| `ls shared/pio/ \| grep -c README.md` | `0` |

Task-level `<verify>` commands, all passing:

- `node -e "…"` over `shared/pio/VERSIONS.md` → `recorded set complete, no machine-local path`
- `git check-ignore -v shared/pio/VERSIONS.md` → exit 1 (not ignored; the record is trackable)
- `node --test tools/tests/env-baseline.test.mjs` → 6 tests, 0 fail
- `test -z "$(git status --porcelain)"` → exit 0 (no fixture residue after the suite ran)

## Falsification of the new gate

Before trusting the gate, it was shown to fail. `shared/pio/base.ini`'s flash-size override was
mutated to `8MB`, the record's own test re-run, and the fragment restored from a backup:

```
ℹ tests 6
ℹ pass 5
ℹ fail 1
  AssertionError [ERR_ASSERTION]: the fragment's board_upload.flash_size is "8MB", not "16MB" —
  the module carries 16 MB of flash, and the stock board definition's 8 MB would halve it
```

The fixture half of the resolved-path assertion carries the same property structurally: the test
plants a fragment at `shared/config/base.ini` where the key resolves to `shared/pio/base.ini`, and
asserts the check reports **absent** — so a passing run is evidence about the layout, not about the
assertion being vacuous.

## Deviations from Plan

None - plan executed exactly as written.

One judgement the plan left to this run, recorded rather than silently taken: `AGENTS.md` is in
the plan's `files_modified` list but is **conditionally** touched, and the condition did not fire
(see "Did the conventions file need aligning?"). The file is unmodified.

## Issues Encountered

**PlatformIO's anonymous telemetry endpoint is denied by this session's sandbox on every
invocation.** Every `pio` command printed `deny network-outbound collector.platformio.org:443`.
As recorded in `02-01-SUMMARY.md`, this is irrelevant: the package listing, the configuration
read, the sweep and the build all succeed with it denied. Recorded here so a later reader does not
mistake it for a failing check.

**The record's ordering is the package lister's, not a ranking.** `tool-mkspiffs` and
`tool-mkfatfs` are listed for completeness because the `espressif32` platform declares them; a
reader looking for "what this environment compiles against" should read the note under the table,
which names `framework-arduinoespressif32` and `toolchain-xtensa-esp32s3` as the two.

## Known Stubs

None. The two files this plan creates carry no placeholder value: every row in the record is a
resolved reading, and every assertion in the test is a live check over the real tree. The baseline
README deliberately states that the console glob **has not yet matched an attached board** — that
is an explicit unfilled observation slot in the sense of Phase 1's `D-11`, not a stub standing in
for a wired value.

## Threat Flags

None. This plan introduces no surface its `<threat_model>` does not already cover: `VERSIONS.md`
was produced from the non-verbose listing form and both the task verification and the committed
test assert the absence of a home-directory or package-cache path (T-02-06); the platform pin is
compared as a literal exact string per environment with an at-sign-plus-digit requirement and a
branch-marker prohibition (T-02-07); the new test spawns no process, asserted by grep in its own
verification (T-02-08); the conventions file was left untouched rather than made a source of truth
(T-02-09); and the fixture is removed by the shared cleanup hook, with an empty porcelain report
asserted after the run (T-02-10). No package was installed and no package-manager file was
created (T-02-SC), so no blocking human-verification checkpoint was emitted.

## Boundaries — what this plan does and does not close

**Closed:** ROADMAP criterion 3 (the resolved set is committed beside the pin, trimmed, and a
reader reproduces the environment from the committed files alone), and the static halves of
`HW-01` and `HW-04` — now gated by a sub-second pure-Node test rather than by a one-time reading.

**Not closed, and not claimed:** ROADMAP criterion 2 (the dated on-hardware acceptance run) and
criterion 5's console half. No board was attached at any point in this run, so they remain UNMET
and are plan 02-03's to discharge. This plan stated the console *decision* — which is settled by
owner decision (`D-03`, `D-04`) — and said plainly in the baseline README that the glob has not yet
matched a board; it did not convert that decision into a measurement.

## Next Phase Readiness

Plan 02-03 can run the physical acceptance sequence against an environment that now has a committed
version record and a regression gate behind it: if it flashes and monitors successfully, the
readings land in its own `SUMMARY.md` and close criteria 2 and 5. It remains blocked on the phase's
one missing dependency — an attached board.

---

## Self-Check: PASSED

- `shared/pio/VERSIONS.md` — FOUND
- `tools/tests/env-baseline.test.mjs` — FOUND
- `tools/tests/helpers.mjs` (exporting `makeFragmentConsumer`) — FOUND
- `homeworks/project-baseline/README.md` (console section replaced) — FOUND
- `README.md` (structure block + building section) — FOUND
- Commit `895271b` (Task 1) — FOUND, ancestor of HEAD
- Commit `0785902` (Task 2) — FOUND, ancestor of HEAD
- Commit `71fc9d6` (Task 3) — FOUND, ancestor of HEAD
- `git status --porcelain` — empty before this file's final commit
