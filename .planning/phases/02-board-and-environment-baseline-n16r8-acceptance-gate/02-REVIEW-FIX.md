---
phase: 02-board-and-environment-baseline-n16r8-acceptance-gate
fixed_at: 2026-10-16T21:08:33Z
review_path: .planning/phases/02-board-and-environment-baseline-n16r8-acceptance-gate/02-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-10-16T21:08:33Z
**Source review:** `.planning/phases/02-board-and-environment-baseline-n16r8-acceptance-gate/02-REVIEW.md`
**Iteration:** 1
**Fix scope:** `critical_warning` (CR-* and WR-*; the three IN-* findings were out of scope)

**Summary:**
- Findings in scope: 5
- Fixed: 5
- Skipped: 0

All fixes were applied on the isolated review-fix worktree and committed there, one commit per
finding. Verification for the two logic-shaped findings (WR-01, WR-04) needs a human eye on the
logic; the syntax/structure tiers below cannot prove semantic correctness.

## Fixed Issues

### CR-01: the fragment injected `board` and `framework` into every environment

**Files modified:** `shared/pio/base.ini`, `homeworks/project-baseline/platformio.ini`
**Commit:** `0ca6098`
**Applied fix:** Removed `board = esp32-s3-devkitc-1` and `framework = arduino` from the
fragment's bare `[env]` block — which `extra_configs` merges into every environment of every
consuming project, where no inherited key can be unset — and named both in the project's own
`[env:projectbaseline_s3]`. `platform` stays in the fragment, since a per-environment key can be
overwritten. Inline comments in both files record why the two keys are per-project, so a
`platform = native` environment (which names neither) is configurable.

Verification (strongest tier — a real build, run in the isolated worktree):
`pio run -d homeworks/project-baseline` → `[SUCCESS]`, `Flash: ... (used 268177 bytes from
6553600 bytes)` — the 16 MB application partition is unchanged, and the header reads
`board: esp32-s3-devkitc-1; framework: arduino; platform: espressif32@7.1.3`.
`pio project config -d homeworks/project-baseline` resolves to the identical key set:
exact `platform = espressif32@7.1.3`, board, framework, the four module overrides, the PSRAM flag,
and the three non-empty port keys. (The `HARDWARE: ... 8 MB Flash, No PSRAM` banner is the board
*definition* the N16R8 retarget sits on top of; the 6553600-byte partition is the proof the
overrides are in effect.)

### WR-01: the gate's ini parser modelled inline comments backwards

**Files modified:** `tools/tests/env-baseline.test.mjs`
**Commit:** `a29eb5c`
**Status:** fixed — requires human verification (parsing-logic change)
**Applied fix:** `sections()` now strips an inline `;` or `#` at the first occurrence
(`line.slice(eq + 1).split(/[;#]/)[0].trim()`), mirroring PlatformIO's
`configparser(inline_comment_prefixes=("#", ";"))`, and the docstring was corrected to state the
opposite of the `.gitignore` rule, with a note that indented multi-line values are still not
modelled and fail loudly rather than silently.

### WR-02: six of the fragment's twelve keys were ungated

**Files modified:** `tools/tests/env-baseline.test.mjs`
**Commit:** `865fae3`
**Applied fix:** Added `monitor_speed`, `upload_port`, `monitor_port` and `test_port` to
`REQUIRED_FRAGMENT_KEYS` with a per-key reason, and added a new `REQUIRED_PROJECT_KEYS` table
asserting the baseline's `[env:projectbaseline_s3]` names `board` and `framework` — plus the
mirror assertion that the fragment's `[env]` block does **not** carry them, which is the
regression guard for CR-01.

Falsified before committing: reverting `upload_port` to `/dev/cu.usbserial-*` in the fragment
turned the suite red with
`the fragment's upload_port is "/dev/cu.usbserial-*", not "/dev/cu.usbmodem*" — the measured
bridge prefix; ... nothing else in the suite would catch a revert`; the file was restored and the
gate re-run green. Suite count rises from 38 to 39.

### WR-03: an `espidf` environment inherits the Arduino partition table and fails to build

**Files modified:** `shared/pio/base.ini`
**Commit:** `f361cb0`
**Applied fix:** A comment block next to the Arduino-only module override keys now states the
ESP-IDF re-declaration list explicitly — `board_upload.flash_size = 16MB` (IDF otherwise assumes
2 MB and reports a size mismatch) and a `board_build.partitions` value that exists in the IDF
partition-table directory (e.g. `partitions_singleapp.csv`), because `default_16MB.csv` ships only
in `framework-arduinoespressif32` — and notes that `board_build.arduino.memory_type` is inert
under IDF while `framework` is now named per environment. Verified the config still resolves
unchanged (`pio project config`).

Scope note: the same migration is also described in `AGENTS.md` (lines 13, 36, 127) and in
`homeworks/project-baseline/README.md`; those were deliberately left unchanged, as the review's
Fix block names only `shared/pio/base.ini`, and `AGENTS.md` edits were separately cautioned
against in this phase's context.

### WR-04: the pin rule rejected the canonical `native` spelling

**Files modified:** `tools/tests/env-baseline.test.mjs`
**Commit:** `4f65949`
**Status:** fixed — requires human verification (condition change)
**Applied fix:** The platform-pin loop now `continue`s on `platform === "native"` (before the
`@\d` and `#` assertions), so the `projectbaseline_native` environment the project README
announces — whose whole platform specification is the word `native` — is no longer turned red by
a rule that only describes a version range.

## Skipped Issues

None — all five in-scope findings were fixed. IN-01, IN-02 and IN-03 were outside the
`critical_warning` scope and were not attempted; IN-03 in particular was left alone because
`AGENTS.md` contains no CP2102N or `usbserial` text to correct.

---

_Fixed: 2026-10-16T21:08:33Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
