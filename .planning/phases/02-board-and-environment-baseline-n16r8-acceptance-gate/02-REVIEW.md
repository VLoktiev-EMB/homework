---
phase: 02-board-and-environment-baseline-n16r8-acceptance-gate
reviewed: 2026-10-16T21:02:26Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - shared/pio/base.ini
  - homeworks/project-baseline/platformio.ini
  - shared/pio/VERSIONS.md
  - tools/tests/env-baseline.test.mjs
  - tools/tests/helpers.mjs
  - homeworks/project-baseline/README.md
  - README.md
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-10-16T21:02:26Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

This phase has no application source code: the deliverables are a PlatformIO default-configuration
fragment, a pure-Node regression gate, and documentation. The review therefore spent its effort on
the one property that matters here — **does the fragment do to a consuming project what its own
header says it does, for every environment the repository says it will have** — and verified each
claim against the installed PlatformIO 6.2.0 rather than against the prose.

What is right, verified rather than assumed:

- `shared/pio/base.ini` resolves exactly as documented. `pio project config -d homeworks/project-baseline`
  returns all twelve keys in `[env:projectbaseline_s3]` with the four measured overrides intact, and
  `pio project config --lint` reports the file "free from linting errors", so every option name
  (including `test_port`) is one PlatformIO recognises.
- The two hardest facts in the fragment are true. A missing `extra_configs` file exits 0 with an
  empty environment (so the test file's justification for existing is sound), and an environment-level
  `build_flags` does replace the inherited list — `${env.build_flags} -DEXTRA=1` measurably resolves to
  `-DBOARD_HAS_PSRAM -DEXTRA=1` while the `[env]` block keeps its own value, so the workaround the
  header prescribes is correct.
- `shared/pio/VERSIONS.md` is exact. `pio pkg list -d homeworks/project-baseline` returns 14 rows and
  the record carries all 14, name for name and version for version.
- The test suite is green (38 tests across `tools/tests/`) and is genuinely pure-filesystem: it imports
  `node:child_process` only transitively through `helpers.mjs`, spawns nothing, and passes with the
  network denied.

The defect that matters is inheritance. `extra_configs` merges the fragment's bare `[env]` block into
**every** environment of **every** consuming project, and the PlatformIO ini format has no way to
*unset* an inherited key — only to overwrite one. The fragment puts `board` and `framework` there, so
the `platform = native` environment this repository documents as arriving in Phase 5 cannot be created
at all (CR-01). A project's own bare `[env]` block does not help either: the fragment is read after the
project file, so the fragment wins (measured: a project `[env] monitor_speed = 4800` against the
fragment's `9600` resolves to `9600`). The remaining findings are a latent false-pass in the gate's
ini parser (WR-01), six of the fragment's twelve keys left ungated including the one plan 02-03
changed (WR-02), and two further inherited-key collisions in the `espidf` migration path and in the
gate's own pin rule (WR-03, WR-04).

No security finding. The fragment carries no secret, no literal device node and no machine-local path;
`VERSIONS.md` was checked for leaks and is clean, and the test that asserts that is a reasonable
control.

## Critical Issues

### CR-01: the fragment injects `board` and `framework` into every environment, and PlatformIO cannot unset an inherited key — the documented `native` environment is impossible

**File:** `shared/pio/base.ini:41-42` (with `homeworks/project-baseline/README.md:26-32`)

**Issue:** The fragment's `[env]` block sets `board = esp32-s3-devkitc-1` and `framework = arduino`.
PlatformIO merges that block into every `[env:<name>]` of every project that names the fragment in
`extra_configs`, and the ini format offers no syntax that *removes* an inherited key — an empty
assignment is not "unset", it is a present-but-empty value that makes PlatformIO try to load a board
called nothing. `homeworks/project-baseline/README.md:26-32` states that a `platform = native`
environment (`projectbaseline_native`) arrives in Phase 5 and that this project is where it lands.
That environment cannot be configured.

The header's override rule (`shared/pio/base.ini:18-21`) is what makes this a defect rather than a
limitation: it tells a future author that re-declaring "that single key" inside their own
`[env:<id>_s3]` is sufficient, and for `board`/`framework` there is nothing to re-declare with that
means "none". Every one of these was measured against the installed PlatformIO 6.2.0 with the real
fragment on the `extra_configs` line:

| Environment | Result |
| --- | --- |
| `platform = native`, no fragment (control) | `SUCCESS` |
| `platform = native` + fragment | `Error: Unknown board ID 'esp32-s3-devkitc-1'` |
| ... re-declaring `board =` (empty) | `Error: BoardConfig: Board is not defined` |
| ... re-declaring `board = -` | `Error: Unknown board ID '-'` |
| fragment with the `board` line removed | `Error: Please specify 'board' in 'platformio.ini' to use with 'arduino' framework` — so `framework = arduino` is a second, independent blocker |
| a project's own bare `[env]` block | loses silently; the fragment is read second and wins |

The last two rows are the reason a reader of the header would not expect this. The `framework` line
is also what produces the second error, so fixing only `board` moves the failure rather than removing it.

**Fix:** remove `board` and `framework` from the fragment's inherited `[env]` block and let each
project name them in its own environment, where the native environment can simply omit them. This
keeps the platform pin in exactly one home, because `platform` *is* overwritable on a per-environment
basis. Verified end to end: with `board` and `framework` removed from `[env]`, a `platform = native`
project consuming the fragment builds (`[SUCCESS]`), and an ESP32 environment that re-declares the two
keys still resolves to the identical configuration.

```ini
; shared/pio/base.ini
[env]
platform = espressif32@7.1.3
; board and framework are deliberately NOT here: extra_configs merges [env] into every
; environment of every consuming project, and ini cannot unset an inherited key, so putting
; them here would make a `platform = native` environment impossible to write. Each project's
; own [env:<id>_s3] names them.
board_upload.flash_size = 16MB
```

```ini
; homeworks/project-baseline/platformio.ini
[env:projectbaseline_s3]
board = esp32-s3-devkitc-1
framework = arduino
```

If the pin is to stay whole instead, then the fragment's header must say plainly that no environment
on another platform can exist in a consuming project at all, so the cost is discovered from the
document rather than from `pio run`.

## Warnings

### WR-01: the gate's ini parser models inline comments backwards, so a pin hidden in a trailing comment passes the pin assertion

**File:** `tools/tests/env-baseline.test.mjs:40-42` (parser at `:48-63`, pin assertion at `:243-247`)

**Issue:** The docstring states "an inline marker is not a comment in this format, and treating one as
such is the defect `ignore-rules.test.mjs` already guards against elsewhere." That rule is true of
`.gitignore` and false of PlatformIO's ini. PlatformIO builds its reader with
`configparser.ConfigParser(inline_comment_prefixes=("#", ";"))`
(`~/.platformio/penv/lib/python3.13/site-packages/platformio/project/config.py:97`), and strips an
inline `;` or `#` at the first occurrence, with no requirement that whitespace precede it. Measured:
`platform = espressif32@7.1.3 ; inline note` resolves to exactly `espressif32@7.1.3`, and
`board_build.arduino.memory_type = qio_opi  # hash note` to `qio_opi`.

Because `sections()` keeps the marker in the value, the gate and the tool it models disagree, in both
directions:

- **False pass.** `platform = espressif32 ; pin at @7.1.3` satisfies `/@\d/` — the version is in the
  comment text — while PlatformIO resolves the unpinned `espressif32` range. The assertion exists for
  the fact ROADMAP criterion 3 is about, and this is a way to pass it while violating it. The
  `#`-branch assertion at `:248-251` fails the other way, rejecting a valid pinned line that carries a
  trailing `#` note.
- **False fail.** Any legitimately annotated value (`board_build.partitions = default_16MB.csv ; the
  16 MB table`) breaks the `assert.equal` comparisons at `:187-198`.

The same parser also has no support for multi-line values, which PlatformIO does accept — so a future
indented `build_flags` list is read as the empty string. Those cases fail loudly rather than silently
(empty is falsy at `:71` and does not match `contains` at `:192`), so they are noted here rather than
raised separately.

**Fix:** mirror the reader, and correct the docstring. Strip from the first marker:

```js
const eq = line.indexOf("=");
if (eq === -1) continue;
// PlatformIO reads this file with configparser(inline_comment_prefixes=("#", ";")),
// so an inline marker ends the value. Keep this in step with that, not with .gitignore.
const value = line.slice(eq + 1).split(/[;#]/)[0].trim();
out.get(heading).set(line.slice(0, eq).trim(), value);
```

### WR-02: six of the fragment's twelve keys are ungated, including the port glob this phase changed

**File:** `tools/tests/env-baseline.test.mjs:85-109` against `shared/pio/base.ini:41-42,69-72`

**Issue:** `REQUIRED_FRAGMENT_KEYS` asserts four keys: the three module overrides and the PSRAM flag.
The fragment carries twelve. Not gated by any assertion in the suite: `board`, `framework`,
`monitor_speed`, `upload_port`, `monitor_port`, `test_port`. `platform` is covered only indirectly,
through the fallback at `:240`. The file's own contract at `:8-12` — "an edit dropping a required value
turns the suite red" — therefore does not hold for half the fragment.

The ungated key that should worry a reader most is `upload_port`: it is the key plan 02-03 existed to
correct (commit `3bb3f87`), it is the one value the phase proved by measurement, and reverting it to
`/dev/cu.usbserial-*` — the form that matched no node before or after the board was attached — leaves
the suite fully green. `monitor_port` and `test_port` are worse off still: `pio device monitor` refuses
to run from a non-interactive shell
(`platformio/device/monitor/terminal.py:105`, quoted verbatim in `02-03-SUMMARY.md` Reading 6), so
those two keys have neither a runtime measurement nor a static gate — their committed value rests on
the inference that the bridge socket and the JTAG socket share a prefix.

**Fix:** add the missing keys to the same data table, so each failure carries its reason:

```js
  {
    key: "board",
    value: "esp32-s3-devkitc-1",
    reason: "the N16R8 devkit board id the fragment's overrides are written against",
  },
  {
    key: "framework",
    value: "arduino",
    reason: "the Arduino core is what the four overrides and the PSRAM flag were measured against",
  },
  {
    key: "monitor_speed",
    value: "115200",
    reason: "the UART bridge ignores no baud rate — the 9600 default prints garbage",
  },
  {
    key: "upload_port",
    value: "/dev/cu.usbmodem*",
    reason:
      "the measured bridge prefix; the previously committed /dev/cu.usbserial-* matched no node, and nothing else in the suite would catch a revert",
  },
  { key: "monitor_port", value: "/dev/cu.usbmodem*", reason: "the same measured bridge prefix" },
  { key: "test_port", value: "/dev/cu.usbmodem*", reason: "the same measured bridge prefix" },
```

If CR-01 moves `board` and `framework` out of the fragment, list them in a per-project table instead —
the point is that a value the phase measured is not left to the diff.

### WR-03: an `espidf` environment inherits the Arduino partition table and fails to build

**File:** `shared/pio/base.ini:46` (documented as the migration target in the repository's own conventions)

**Issue:** `board_build.partitions = default_16MB.csv` names a table that exists only in the Arduino
core package (`framework-arduinoespressif32/tools/partitions/`). The ESP-IDF framework resolves the
same key against its own directory first and then falls back to a bare relative path
(`builder/frameworks/espidf.py:1828-1834`), and its directory holds `partitions_singleapp.csv` and
friends but no `default_16MB.csv`. Measured on an `framework = espidf` environment consuming the
fragment: `Missing partition table file '.../default_16MB.csv'`, build failed. The same run also
reported `Flash memory size mismatch detected. Expected 16MB, found 2MB!`, which is the IDF side of
the same handoff — an IDF environment must set its flash size and partition table itself.

Unlike CR-01 this one *is* escapable through the documented override rule, so it is a warning. But
`base.ini`'s header, `README.md:91-93` and `homeworks/project-baseline/README.md:26-32` all present the
IDF migration as a per-environment change without naming the keys that must be re-declared, so the
first IDF homework meets a partition-table error that points at a missing file rather than at
inheritance.

**Fix:** state the re-declaration list where the migration is described, and keep it honest about
which fragment keys are Arduino-only:

```ini
; shared/pio/base.ini — an ESP-IDF environment must re-declare these two, because this
; fragment is written for the Arduino core: `framework = espidf` and a partition table that
; exists in framework-espidf/components/partition_table/ (e.g. partitions_singleapp.csv).
```

### WR-04: the pin rule rejects the natural spelling of the `native` environment the project README says is coming

**File:** `tools/tests/env-baseline.test.mjs:243-247` against `homeworks/project-baseline/README.md:28-32`

**Issue:** `assert.match(platform, /@\d/)` requires an `@` followed by a digit. `platform = native` —
the canonical spelling, and the one every PlatformIO native project uses — has neither, so the gate
turns red on a correct change the repository has already announced. `native@1.2.1` is accepted by
PlatformIO and builds (measured), so the rule is satisfiable; the README simply records the
environment's *name* (`projectbaseline_native`) and not the platform spec it will carry, leaving the
first author to hit a red gate with a message about "a range is not a pin" that does not describe their
line.

**Fix:** either record the exact spec in the README, or carve out the one platform that has no version
to pin:

```js
    // `native` is the platform's whole specification; it has no version to pin, and pinning
    // it as `native@<ver>` is legal but not the canonical form. Everything else is pinned.
    if (platform === "native") continue;
```

## Info

### IN-01: `makeFragmentConsumer` returns a `declared` field no caller reads

**File:** `tools/tests/helpers.mjs:135,151` (callers at `tools/tests/env-baseline.test.mjs:148,155,163`)

**Issue:** The helper documents `@returns {..., declared}` and returns it, but every caller re-derives
the same value by parsing the file it just wrote (`extraConfigsValue(correct.iniPath)`). The field is
dead weight in a documented return shape, and the duplication is what lets the helper's literal drift
from the value the assertions actually exercise.

**Fix:** drop `declared` from the return and the docstring, or have the test use it:
`const correctResolved = resolveFromProject(correct.homeDir, correct.declared);`

### IN-02: the pin rule is scoped to the baseline, while the README states it repository-wide

**File:** `tools/tests/env-baseline.test.mjs:225-253` against `README.md:91-93`

**Issue:** The test is named "every environment the baseline declares", which is accurate, but
`README.md` claims the rule for every environment in the repository. Later phases add homeworks that
are not covered by anything here: a new project that writes `platform = espressif32` as a range, or
that forgets `extra_configs` altogether, passes the whole suite.

**Fix:** loop over discovery instead of a hardcoded directory — `tools/lib/discover.mjs` already
exposes the list — and read each project's own ini for its `extra_configs` value rather than assuming
the baseline's.

### IN-03: adjacent — the phase summary's `AGENTS.md` correction item does not correspond to anything in `AGENTS.md`

**File:** `.planning/phases/02-board-and-environment-baseline-n16r8-acceptance-gate/02-03-SUMMARY.md:312` (outside this review's file scope; recorded so the fixer does not act on it)

**Issue:** The summary lists as an open item that "`AGENTS.md` still names the CP2102N" and "still
describes `/dev/cu.usbserial-*` as matching the bridge", needing "its own traceable change". A
case-insensitive search over `AGENTS.md` returns zero hits for `CP2102` and zero for `usbserial`. The
only `usbserial` strings in the repository are the deliberate historical notes in
`shared/pio/base.ini:57-58` and `homeworks/project-baseline/README.md:49`, both of which record the
falsified form on purpose. Acting on the item as written would edit a file that has nothing to fix.

The real gap behind that residual is different and smaller: the measured bridge chip identity (a
CH343, `VID:PID=1A86:55D3`, per Reading 1) is recorded nowhere outside `.planning/`, and `AGENTS.md`
still describes the bridge generically.

**Fix:** replace the residual with the actual remaining item — no correction to `AGENTS.md` is owed,
and if the chip identity is worth recording it belongs in the fragment's comment, next to the glob it
explains.

---

_Reviewed: 2026-10-16T21:02:26Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
