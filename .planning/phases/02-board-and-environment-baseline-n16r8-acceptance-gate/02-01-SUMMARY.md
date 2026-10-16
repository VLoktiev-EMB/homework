---
phase: 02-board-and-environment-baseline-n16r8-acceptance-gate
plan: 01
subsystem: config
tags: [platformio, esp32-s3, n16r8, extra_configs, psram, qio_opi, version-pin]

requires:
  - phase: 01-repository-skeleton-and-project-layout
    provides: "The one-homework repository layout, the frozen homework-id grammar, envNames(), the project-baseline acceptance vehicle, and the sweep and workspace drift gates"
provides:
  - "shared/pio/base.ini — the single enforcement point for the exact platform pin and the four N16R8 module overrides"
  - "homeworks/project-baseline/platformio.ini converted to consume the fragment through extra_configs"
  - "A measured two-arm override contrast (6553600 bytes / qio_opi versus 3342336 bytes / qio_qspi) that makes ROADMAP criterion 1 falsifiable"
  - "Four recorded measurements of PlatformIO's extra_configs merge semantics, backing every claim the fragment's header comment makes"
affects: [02-02, 02-03, 03, 04, 05, 06]

tech-stack:
  added: []
  patterns:
    - "One shared [env] defaults fragment consumed via extra_configs; the project owns its [env:<id>_s3] header and re-declares a key only inside it"
    - "Evidence by verbatim reading with the exact command and exit status, or an explicitly unfilled slot"

key-files:
  created:
    - shared/pio/base.ini
  modified:
    - homeworks/project-baseline/platformio.ini

key-decisions:
  - "The fragment is a bare [env] global block, never [env:<name>], so it stays a shared defaults layer rather than naming every project's environment"
  - "The console ports live in the fragment as the narrow glob /dev/cu.usbserial-*, so a new project inherits its console and cannot forget it"
  - "The fragment's header comment carries the five measured obligations rather than leaving them to a diff, because two of the traps are silent"
  - "The negative control is built outside the repository and removed, so the measurement leaves no residue in the tracked tree"

patterns-established:
  - "Throwaway measurement fixture: a fixed path under the operating system's temporary directory, removed inside the task, its absence asserted"
  - "Machine-local detail (device nodes, absolute cache paths, temporary roots) is named by role in the record, never by literal"

requirements-completed: [HW-01, HW-04]

# MEASURED, never narrated (#3968): `git rev-list --count <plan_head_before>..HEAD`
# at plan end. `plan_head_after` is deliberately omitted rather than guessed — this
# file's own carrier commit is the plan tip, so a hash written here would either be
# stale after the commit or self-referential.
actuals:
  tokens: 3606
  tasks: 3
  commits: 4
  plan_head_before: 6fd4004ac4163a5730e690c64e93dcadfc286098

coverage:
  - id: D1
    description: "shared/pio/base.ini exists and carries the exact platform pin, the board, the framework, the four N16R8 overrides, the PSRAM build flag, the monitor speed and the three console port globs"
    requirement: "HW-01"
    verification:
      - kind: integration
        ref: "pio project config -d homeworks/project-baseline --json-output (asserts one exact platform version and all three port keys) — recorded in this summary's Verification table"
        status: pass
    human_judgment: false
  - id: D2
    description: "The baseline's environment resolves entirely from the shared fragment and builds from the repository root, reporting the 16 MB application partition and linking the qio_opi prebuilt library set"
    requirement: "HW-01"
    verification:
      - kind: integration
        ref: "pio run -d homeworks/project-baseline 2>&1 | grep -c 6553600 => 1"
        status: pass
      - kind: integration
        ref: "grep -c 'sdk/esp32s3/qio_opi' homeworks/project-baseline/.pio/build/projectbaseline_s3/firmware.map => 5629"
        status: pass
    human_judgment: false
  - id: D3
    description: "The override set is proven load-bearing by contrast: the stock board definition yields a different partition size and a different prebuilt library set"
    requirement: "HW-01"
    verification:
      - kind: integration
        ref: "two-arm throwaway build recorded under '## Arm A' / '## Arm B': 3342336 bytes + qio_qspi against 6553600 bytes + qio_opi"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every claim the fragment's header comment makes about PlatformIO's merge semantics is a recorded measurement rather than a restatement"
    requirement: "HW-04"
    verification:
      - kind: integration
        ref: "five recorded readings under '### Reading 1'..'### Reading 5', each a pio project config / pio run invocation with its output and exit status"
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-10-16
status: complete
---

# Phase 02 Plan 01: Board and Environment Baseline Summary

**The baseline's environment resolves entirely from `shared/pio/base.ini`, and the override set is proven load-bearing by a measured contrast — 6553600 bytes on `qio_opi` against 3342336 bytes on `qio_qspi` — with the fragment's four merge traps demonstrated in both directions.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-10-16T20:03:29Z
- **Completed:** 2026-10-16T20:06:46Z
- **Tasks:** 3
- **Files modified:** 3 (two tracked, one of them planning output)

## Accomplishments

- `shared/pio/base.ini` installed as the shared `[env]` defaults fragment: one place now carries
  the exact `espressif32@7.1.3` pin, the board, the framework, the four N16R8 module overrides,
  the PSRAM build flag, the monitor speed and the three console port globs.
- `homeworks/project-baseline/platformio.ini` reduced to its identity plus `extra_configs`; the
  false "no console port is pinned" paragraph removed rather than corrected in place.
- The override set's effect measured in both directions — partition sizes `6553600` against
  `3342336`, prebuilt library sets `qio_opi` against `qio_qspi` — so ROADMAP criterion 1's claim
  has a contrast rather than a coincidence.
- Every merge behaviour the fragment's header comment asserts was reproduced in its own
  throwaway tree and recorded with its command, exit status and verbatim output; all six
  fixtures were removed and their absence asserted.
- The tracked tree is left exactly as it was found, plus the two intended files and this record.

## Negative control: the override set is a library-selection decision

Same platform pin (`espressif32@7.1.3`) in both arms; the arms differ by the override set
and by nothing else. The control arm is a throwaway project outside the repository carrying
only the three stock keys. The overridden arm is the repository baseline, whose environment
now resolves through the shared fragment; its readings are re-read from the build task 1
produced rather than rebuilt.

Machine-local detail is named by role: the throwaway root is `${TMPDIR}/phase02-negative-control`
and the repository-relative paths are written as the repository sees them.

## Arm A — control: the stock board definition, no overrides

```
$ pio run -d "${TMPDIR}/phase02-negative-control"
EXIT=0
RAM:   [=         ]   5.5% (used 18032 bytes from 327680 bytes)
Flash: [=         ]   7.0% (used 233109 bytes from 3342336 bytes)
========================= [SUCCESS] Took 2.46 seconds =========================
```

Note the partition total: `3342336` bytes — the stock `esp32-s3-devkitc-1` definition's
8 MB flash with its default partition table. This is the *wrong* configuration for this
hardware, and it builds cleanly, which is exactly why the misconfiguration is invisible
without a reading.

The linked prebuilt IDF library set:

```
$ grep -o 'tools/sdk/esp32s3/[a-z_]*/' "${TMPDIR}/phase02-negative-control/.pio/build/negativecontrol_s3/firmware.map" | sort | uniq -c | sort -rn
EXIT=0
35356 tools/sdk/esp32s3/lib/
 5330 tools/sdk/esp32s3/qio_qspi/
 4586 tools/sdk/esp32s3/ld/
```

## Arm B — overridden: the repository baseline through the shared fragment

```
$ pio run -d homeworks/project-baseline
EXIT=0
RAM:   [=         ]   5.7% (used 18604 bytes from 327680 bytes)
Flash: [          ]   4.1% (used 268177 bytes from 6553600 bytes)
========================= [SUCCESS] Took 2.80 seconds =========================
```

Note the partition total: `6553600` bytes — `0x640000`, the 16 MB application partition the
module overrides select.

The linked prebuilt IDF library set:

```
$ grep -o 'tools/sdk/esp32s3/[a-z_]*/' homeworks/project-baseline/.pio/build/projectbaseline_s3/firmware.map | sort | uniq -c | sort -rn
EXIT=0
35585 tools/sdk/esp32s3/lib/
 5629 tools/sdk/esp32s3/qio_opi/
 4586 tools/sdk/esp32s3/ld/
```

## What the contrast establishes

The two arms resolve into **different prebuilt IDF library directories** — `qio_qspi` for the
stock board definition and `qio_opi` for the module-overridden environment — and report
**different application partition sizes**, `3342336` against `6553600`. The memory-type
override therefore decides which prebuilt core library set is linked: a wrong value is a
library-selection decision, not a stylistic difference, and it is this contrast — not the
positive reading alone — that gives ROADMAP criterion 1 its meaning.

## Fixture residue

The throwaway root `${TMPDIR}/phase02-negative-control` was removed inside the task and its
absence asserted; no build artifact, map file or copied directory from it exists anywhere
under the repository.

## Fragment merge semantics

Every reading below was taken with PlatformIO's own configuration reader in its
machine-readable form, parsed rather than string-sliced, in its own throwaway tree under
`${TMPDIR}`. Each fixture differs from the repository arrangement by exactly the one thing
under test; each was removed afterwards and its absence asserted.

### Reading 1 — a project-level override wins

```
$ pio project config -d "${TMPDIR}/phase02-merge-1/homeworks/probe" --json-output
EXIT=0
[["platformio", [["extra_configs", ["../../shared/pio/base.ini"]]]], ["env:probes3", [["monitor_speed", 9600], ["platform", "espressif32@7.1.3"], ["board", "esp32-s3-devkitc-1"], ["framework", ["arduino"]], ["build_flags", ["-DBOARD_HAS_PSRAM"]]]], ["env", [["platform", "espressif32@7.1.3"], ["board", "esp32-s3-devkitc-1"], ["framework", ["arduino"]], ["monitor_speed", 115200], ["build_flags", ["-DBOARD_HAS_PSRAM"]]]]]
```

The fragment sets `monitor_speed = 115200`; the project re-declares the same key inside its
own `[env:probes3]` section at `9600`. The reader reports `9600` — the project's value wins,
so the single-key override path the fragment's header describes works.

### Reading 2 — a re-declared global block in the project loses, silently

```
$ pio project config -d "${TMPDIR}/phase02-merge-2/homeworks/probe" --json-output
EXIT=0
[["platformio", [["extra_configs", ["../../shared/pio/base.ini"]]]], ["env", [["monitor_speed", 115200], ["platform", "espressif32@7.1.3"], ["board", "esp32-s3-devkitc-1"], ["framework", ["arduino"]], ["build_flags", ["-DBOARD_HAS_PSRAM"]]]]]
```

The project adds a second bare `[env]` block carrying `monitor_speed = 9600` and declares no
environment-named section of its own. The reader reports `115200` — the **fragment** won.
The losing arrangement looks entirely reasonable in a diff, which is why the fragment's
header carries the rule rather than leaving it to review. No warning of any kind accompanies
the result: the exit status is 0 and the output is well-formed.

### Reading 3 — a list option replaces rather than appends

Replacement — an environment-level `build_flags` line set to a single additional define:

```
$ pio project config -d "${TMPDIR}/phase02-merge-3a/homeworks/probe" --json-output
EXIT=0
[["platformio", [["extra_configs", ["../../shared/pio/base.ini"]]]], ["env:probes3", [["build_flags", ["-DEXTRA=1"]], ["platform", "espressif32@7.1.3"], ["board", "esp32-s3-devkitc-1"], ["framework", ["arduino"]], ["monitor_speed", 115200]]], ["env", [["platform", "espressif32@7.1.3"], ["board", "esp32-s3-devkitc-1"], ["framework", ["arduino"]], ["monitor_speed", 115200], ["build_flags", ["-DBOARD_HAS_PSRAM"]]]]]
```

The environment reports exactly `["-DEXTRA=1"]`: `-DBOARD_HAS_PSRAM` is gone, and the build
would still have succeeded. This is the trap that silently removes every `psramFound()`
reading from an acceptance run.

Interpolation first — the same additional define, with the inherited list interpolated ahead
of it:

```
$ pio project config -d "${TMPDIR}/phase02-merge-3b/homeworks/probe" --json-output
EXIT=0
[["platformio", [["extra_configs", ["../../shared/pio/base.ini"]]]], ["env:probes3", [["build_flags", ["-DBOARD_HAS_PSRAM -DEXTRA=1"]], ["platform", "espressif32@7.1.3"], ["board", "esp32-s3-devkitc-1"], ["framework", ["arduino"]], ["monitor_speed", 115200]]], ["env", [["platform", "espressif32@7.1.3"], ["board", "esp32-s3-devkitc-1"], ["framework", ["arduino"]], ["monitor_speed", 115200], ["build_flags", ["-DBOARD_HAS_PSRAM"]]]]]
```

The environment now reports `["-DBOARD_HAS_PSRAM -DEXTRA=1"]` — the inherited flag present
and **ordered first**, exactly as the fragment's header instructs.

### Reading 4 — a fragment that cannot be found is not an error

```
$ pio project config -d "${TMPDIR}/phase02-merge-4/homeworks/probe" --json-output
EXIT=0
[["platformio", [["extra_configs", ["../../shared/pio/does-not-exist.ini"]]]], ["env:probes3", []]]
```

The extra-configs key names a file that does not exist, and the project declares an
environment header of its own. The reader exits **0** and prints the `env:probes3` heading
with an **empty body** (`[]`). That exit status is the reading that makes the point: a guard
checking only the exit status is checking nothing, which is why the fragment's header says
any check must read the resolved content.

### Reading 5 — a project with no environment header of its own fails loudly

The consumer file's own comment claims the environment header is required. Measured, not
asserted:

```
$ pio run -d "${TMPDIR}/phase02-merge-5/homeworks/probe"
EXIT=1
ProjectEnvsNotAvailableError: Please setup environments in `platformio.ini` file
```

A project carrying the extra-configs key but no `[env:<id>_s3]` header of its own dies with a
named error before any build starts. Unlike the missing-fragment trap, this one is loud —
which is why the fragment's header can safely say the environment stays the project's.

## Task Commits

| Task | Name | Commit | Type |
|---|---|---|---|
| 1 | End-to-end: the baseline environment resolves from the shared fragment and builds | `1897173` | feat |
| 2 | Measure the negative control that makes the override claim falsifiable | `3eeed2b` | docs |
| 3 | Measure the fragment's four merge semantics in throwaway trees | `dcb676e` | docs |

## Files Created/Modified

- `shared/pio/base.ini` (new) — the shared `[env]` defaults fragment carrying the exact platform
  pin, the board, the framework, the four N16R8 module overrides, the PSRAM build flag, the
  monitor speed and the three console port globs, with a header comment naming the five
  measured obligations.
- `homeworks/project-baseline/platformio.ini` (rewritten) — a `[platformio]` section carrying
  `extra_configs` plus the bare `[env:projectbaseline_s3]` header. The eight environment keys
  it held before are gone, and the paragraph claiming no console port is pinned was replaced
  rather than appended to.

## Decisions Made

- The fragment declares a bare `[env]` global defaults block and no environment of its own;
  the project keeps its `[env:projectbaseline_s3]` header, because the fragment alone creates
  no environment (reading 5).
- The console ports are the narrow glob `/dev/cu.usbserial-*` in all three keys, so a new
  project inherits its console rather than declaring it, while the single-key override path
  stays open (reading 1).
- The fragment's header comment carries all five obligations rather than leaving them to
  review, because two of the traps — the re-declared global block and the replaced list
  option — are silent.
- The negative control lives outside the repository and is removed inside the task, so the
  measurement leaves no residue in the tracked tree.

## Verification

Run from the repository root, with PlatformIO resolvable at `~/.platformio/penv/bin/pio`:

| Check | Result |
|---|---|
| `node --test "tools/**/*.test.mjs"` | 32 tests, 32 pass, 0 fail (`duration_ms` 1454.7) |
| `node tools/sweep-homeworks.mjs` | exit 0; discovers exactly `homeworks/project-baseline`, which builds `[SUCCESS]` |
| `node tools/generate-workspace.mjs --check` | `homework.code-workspace is up to date`; `shared/pio/` was not added to a workspace root |
| `git status --porcelain` | empty |
| `pio project config -d homeworks/project-baseline --lint` | `The "platformio.ini" configuration file is free from linting errors.` |

Task-level `<verify>` commands, all passing:

- `node -e "…"` over `shared/pio/base.ini` section headers → `one section: [env]`
- `pio run -d homeworks/project-baseline` piped to `grep -c 6553600` → `1`
- `grep -c 'sdk/esp32s3/qio_opi' …/firmware.map` → `5629`
- `pio project config … --json-output` piped to the platform-pin and three-port assertion → `OK 1`
- `grep -c '^## Arm' 02-01-SUMMARY.md` → `2`; `grep -c '6553600'` → `5`; `grep -c 'qio_qspi'` → `4`
- `grep -c '^### Reading' 02-01-SUMMARY.md` → `5`; `grep -c 'BOARD_HAS_PSRAM'` → `6`
- `test -z "$(ls -d "${TMPDIR:-/tmp}"/phase02-merge-* 2>/dev/null)"` → exit 0
- `test ! -d "${TMPDIR:-/tmp}/phase02-negative-control"` → exit 0

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**The research's Pitfall 7 does not hold on this PlatformIO Core build — the JSON output does
print a bare `env` entry.** Pitfall 7 states that the text form lists `env` alongside
`env:projectbaseline_s3` while "the JSON output does **not**", and concludes that selecting
entries whose name begins with `env:` is "both correct and sufficient". Measured here, the
bare `["env", …]` entry **is** present in the JSON for readings 1, 2, 3a and 3b, carrying the
fragment's own unmerged values. Selecting on the `env:` prefix is therefore **necessary**
and not merely convenient: an assertion that iterated every entry would have compared the
environment against the fragment's raw block and mis-read the merged result. The repository
tooling and the task-1 assertion both filter on the prefix, so nothing needed changing — but
the reason recorded in the research is wrong on this build, and a future guard that trusts it
would be the one to break. This is a finding about the research, not a deviation from the
plan, so it is recorded here rather than auto-fixed.

**PlatformIO's anonymous telemetry endpoint is denied by this session's sandbox on every
invocation.** Every `pio` command in this run printed
`deny network-outbound collector.platformio.org:443`. The research recorded the same and
noted it is irrelevant; it was irrelevant here too — `pio project config`, `pio pkg list` and
every build succeeded with it denied. Recorded so a later reader does not mistake it for a
failing check.

## Known Stubs

None. The two files this plan creates carry no placeholder value: every key in the fragment is
a literal, and the project file intentionally carries no environment keys at all — that
emptiness is the design, not an unwired stub.

## Threat Flags

None. The fragment introduces no surface the plan's `<threat_model>` does not already cover:
the port is a glob pattern rather than a literal device node (T-02-01), no machine-local
absolute path or temporary root is named literally anywhere this plan commits, and no package
was installed (T-02-SC).

## Boundaries — what this plan does and does not close

**Closed:** ROADMAP criterion 1's offline half (the overrides reach the build, proven by
contrast), criterion 4's machine-provable half (one exact platform version and three explicit
console ports per environment), and the offline halves of `HW-01` and `HW-04`.

**Not closed, and not claimed:** ROADMAP criterion 2 (the dated on-hardware acceptance run)
and criterion 5's console half. No board was attached at any point in this run; they are plan
02-03's and stay UNMET until that run produces verbatim evidence. Criterion 3's
`shared/pio/VERSIONS.md` record is plan 02-02's, and this plan deliberately did not create it.

## Next Phase Readiness

The shared fragment is in place and demonstrably load-bearing, so plan 02-02 can write
`shared/pio/VERSIONS.md` beside it and add the pure-filesystem regression test over the
fragment and its consumer; plan 02-03 can then run the physical acceptance sequence against
the environment this plan established — provided a board is attached, which remains the
phase's one missing dependency.

---

## Self-Check: PASSED

- `shared/pio/base.ini` — FOUND
- `homeworks/project-baseline/platformio.ini` — FOUND
- `.planning/phases/02-board-and-environment-baseline-n16r8-acceptance-gate/02-01-SUMMARY.md` — FOUND
- Commit `1897173` (Task 1) — FOUND, ancestor of HEAD
- Commit `3eeed2b` (Task 2) — FOUND, ancestor of HEAD
- Commit `dcb676e` (Task 3) — FOUND, ancestor of HEAD
- Fixture residue: `0` paths matching `${TMPDIR}/phase02-merge-*`; `${TMPDIR}/phase02-negative-control` absent
- `git status --porcelain` — empty before this file's final commit
