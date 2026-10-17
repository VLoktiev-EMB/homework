---
phase: 03-shared-libraries-and-the-hardware-seam
plan: 01
subsystem: shared-libraries
tags: [platformio, symlink, pure-c, hal-seam, esp32-s3, c99, library-manager]

requires:
  - phase: 01-repository-skeleton-and-project-layout
    provides: "shared/lib/ as a frozen, singular, workspace-root directory; the project-baseline acceptance vehicle; envNames(); the sweep and workspace drift gates"
  - phase: 02-board-and-environment-baseline-n16r8-acceptance-gate
    provides: "shared/pio/base.ini, the single enforcement point for the platform pin and the four N16R8 overrides the baseline builds through"

provides:
  - "shared/lib/emb_hal — the framework-free C console/time ABI (include/ only, no src/)"
  - "shared/lib/emb_hal_arduino — the single framework-touching backend in the shared tree (src/ only, no include/)"
  - "shared/lib/emb_log — the pure-C bounded tagged logger that writes through the seam only"
  - "homeworks/project-baseline consuming all three through one comma-separated lib_deps line of symlink:// specs"
  - "shared/lib/README.md — the language, layout, manifest, guard and seam contract, with each enforcement boundary stated honestly"
  - "shared/pio/VERSIONS.md — the two measured C standards beside the platform pin"
  - "Two hand-taken measurements recorded verbatim: live-edit propagation with no reinstall and no copy, and the framework-free host compilation with its falsification arm"

affects: [03-02, 03-03, 04, 05, 06]

tech-stack:
  added: []
  patterns:
    - "A shared library is library.json + include/ + src/ in the default layout, with no build section anywhere; two absences are structural — the interface library has no src/, the backend has no include/"
    - "One lib_deps line per library on a single comma-separated line, transitive entries included, because the LDF does not read a library's own source"
    - "The seam is a C ABI in a framework-free header; exactly one shared directory may see a framework header, and its exemption is a named list rather than a pattern"
    - "Evidence by verbatim reading with the exact command and exit status, or an explicitly unfilled slot"

key-files:
  created:
    - shared/lib/emb_hal/library.json
    - shared/lib/emb_hal/include/emb_hal.h
    - shared/lib/emb_hal_arduino/library.json
    - shared/lib/emb_hal_arduino/src/emb_hal_arduino.c
    - shared/lib/emb_log/library.json
    - shared/lib/emb_log/include/emb_log.h
    - shared/lib/emb_log/src/emb_log.c
  modified:
    - homeworks/project-baseline/platformio.ini
    - homeworks/project-baseline/src/main.cpp
    - shared/lib/README.md
    - shared/pio/VERSIONS.md
    - README.md
    - homeworks/project-baseline/README.md

key-decisions:
  - "The seam's declared shape is console readiness, initialisation, a terminated line write and elapsed time — board-neutral by construction, so it names no pin, no UART number and no bridge identity, and this phase commits no unverified board fact"
  - "The UART number is passed to uartBegin() as the literal 0 because the framework's serial-number macro lives in the C++ header this backend must not include; the shape is kept and adjusted only if the argument list fails to compile"
  - "A write against a not-ready sink is dropped and reported false — never buffered and never replaced with a diagnostic, because buffering hides the failure until a later flush and a diagnostic travels on a channel known not to carry it"
  - "The not-ready decision is recorded in the source comment that implements it, not only in the plan, so a reader meets it where it acts"
  - "emb_log assembles its line by hand rather than with snprintf(), so it carries no header but its own and the seam's — the property that makes it host-compilable"
  - "The tag literal lives in emb_log's source, not its header, so changing it recompiles exactly one translation unit — which is what makes criterion 2 measurable"
  - "The version record states the two standards as read from the framework's own build script rather than inferred from configuration metadata, and repeats the C99 ceiling"

patterns-established:
  - "A throwaway measurement lives outside the repository under a role-named temporary directory, is removed inside the task, and its absence is asserted"
  - "A measurement's edit is restored to its committed content in the same task, and the restore is asserted as a diff rather than described"
  - "Every measurement is recorded with the exact command, the exit status and the verbatim output — an unobserved value stays an unfilled slot"

requirements-completed: [SHARED-01, SHARED-02, SHARED-03]

# MEASURED, never narrated (#3968): `git rev-list --count <plan_head_before>..HEAD`
# read from the on-disk ledger at summary-write time. `plan_head_after` is the tip the
# two task commits reached; this file's own carrier commit lands after it, so it is
# deliberately not folded into `commits` — the range recorded here is self-consistent.
actuals:
  tokens: 6689
  tasks: 3
  commits: 2
  plan_head_before: 21dd5e0bc6bbc4fb2562dcfc2b3a5a5000108f52
  plan_head_after: b03b40961376e720dbbd4330847013e707fb0abc

coverage:
  - id: D1
    description: "Three real PlatformIO libraries exist under shared/lib/ in the default layout, each with a manifest carrying name and version and no build section; emb_hal has include/ and no src/, emb_hal_arduino has src/ and no include/, emb_log has both"
    requirement: "SHARED-01"
    verification:
      - kind: integration
        ref: "node -e manifest+layout assertion over the three library.json files => '3 manifests ok'"
        status: pass
    human_judgment: false
  - id: D2
    description: "The baseline consumes all three libraries through one comma-separated lib_deps line of symlink:// specs, builds green from the repository root, keeps the 6553600-byte N16R8 partition, and links the module tag"
    requirement: "SHARED-02"
    verification:
      - kind: integration
        ref: "pio run -d homeworks/project-baseline 2>&1 | grep -c 6553600 => 1"
        status: pass
      - kind: integration
        ref: "pio pkg list -d homeworks/project-baseline | grep -c 'symlink://../../shared/lib/' => 3"
        status: pass
      - kind: integration
        ref: "pio pkg list -d homeworks/project-baseline | grep -cE 'emb_hal @ 0.1.0|emb_hal_arduino @ 0.1.0|emb_log @ 0.1.0' => 3"
        status: pass
      - kind: integration
        ref: "strings .pio/build/projectbaseline_s3/firmware.bin | grep -c 'emb-log' => 1"
        status: pass
    human_judgment: false
  - id: D3
    description: "Criterion 2's live propagation is a recorded measurement: editing the shared source recompiled exactly one translation unit, the new literal is present and the old absent in the linked image, the installed pointer files' mtimes are unchanged, and no install line was printed"
    requirement: "SHARED-02"
    verification:
      - kind: integration
        ref: "'### Reading one' in this summary — before/after pointer mtimestamps, the single Compiling line, and the image string counts"
        status: pass
    human_judgment: false
  - id: D4
    description: "The framework-free modules compile and link on the host with no framework header on the include path, and the framework-touching backend does not — the seam proved from both sides"
    requirement: "SHARED-03"
    verification:
      - kind: integration
        ref: "'### Reading two' in this summary — the gnu99 host compile, the binary's output, and the backend's refusal naming esp32-hal-uart.h"
        status: pass
    human_judgment: false
  - id: D5
    description: "The rule, its enforcement boundary, the two measured standards and the rejected alternative each have exactly one home, and both reader-facing READMEs name the consumption mechanism"
    requirement: "SHARED-03"
    verification:
      - kind: integration
        ref: "node -e contract assertion over shared/lib/README.md and shared/pio/VERSIONS.md => 'contract written'; the enforcement-honesty assertion => 'enforcement stated honestly'"
        status: pass
      - kind: unit
        ref: "node --test tools/tests/env-baseline.test.mjs => 7 pass, 0 fail (includes the no-machine-local-path assertion over VERSIONS.md)"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-10-17
status: complete
---

# Phase 03 Plan 01: Shared Libraries and the Hardware Seam Summary

**`shared/lib/` is now three real libraries — a framework-free C console/time ABI, exactly one framework-touching backend, and one pure-C logger — and the baseline builds green through them from one comma-separated `symlink://` dependency line, with live-edit propagation and host-compilability each demonstrated by a hand-taken reading rather than asserted.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-10-17T00:01:04Z
- **Completed:** 2026-10-17T00:09:25Z
- **Tasks:** 3
- **Files modified:** 14 (13 tracked changes, plus this record)

## Accomplishments

- `shared/lib/emb_hal` is the seam: a C ABI for console readiness, initialisation, a terminated
  line write and elapsed time, guarded by both an include guard and a `extern "C"` block, naming
  no pin, no UART number and no bridge identity. It carries `include/` and deliberately no `src/`.
- `shared/lib/emb_hal_arduino` is the single translation unit in the shared tree allowed to see a
  framework header. It reaches the console through the core's C-callable UART API and time through
  the core's C-callable clock, never through the C++ console object, and it carries `src/` and
  deliberately no `include/` so that boundary is structural.
- `shared/lib/emb_log` is pure logic: it owns its tag in its source, includes only its own header
  and the seam header, assembles a bounded line by hand, and drops a write against a not-ready
  sink rather than buffering it or substituting a diagnostic.
- The baseline consumes all three from one comma-separated `lib_deps` line, builds green from the
  repository root reporting the `6553600`-byte N16R8 partition, and links the module tag into the
  firmware image.
- The contract has one home per fact: the rule in `shared/lib/README.md`, the measured standards
  in `shared/pio/VERSIONS.md` beside the platform pin, and the mechanism named in both
  reader-facing READMEs.
- Two measurements were taken by hand and are recorded verbatim below; the tree was left exactly
  as it was found.

## Task Commits

| Task | Name | Commit | Type |
|---|---|---|---|
| 1 | End-to-end: the baseline prints through the seam, resolved from three symlinked libraries | `3db4ce9` | feat |
| 2 | Write the contract once: the rule, the measured standards, and the mechanism as readers meet it | `b03b409` | docs |
| 3 | Measure live-edit propagation and the framework-free host compilation | *(carried by this file)* | docs |

Task 3's declared deliverable *is* this summary, so its commit is this file's carrier commit;
`actuals.commits` above therefore measures the two production commits, not the carrier.

## Files Created/Modified

- `shared/lib/emb_hal/library.json` (new) — the interface library's manifest: name and version, and nothing else.
- `shared/lib/emb_hal/include/emb_hal.h` (new) — the seam itself; four declarations, two guards, no board fact.
- `shared/lib/emb_hal_arduino/library.json` (new) — the backend's manifest, with `frameworks: ["arduino"]` as a plain compatibility statement.
- `shared/lib/emb_hal_arduino/src/emb_hal_arduino.c` (new) — the one framework-touching unit; `uartBegin`/`uartWriteBuf`/`uartWrite` and `millis`.
- `shared/lib/emb_log/library.json` (new) — the pure-logic module's manifest.
- `shared/lib/emb_log/include/emb_log.h` (new) — `EMB_LOG_LINE_MAX` and the three functions, with the line contract documented.
- `shared/lib/emb_log/src/emb_log.c` (new) — the bounded assembly, the owned tag, and the recorded not-ready decision.
- `homeworks/project-baseline/platformio.ini` (modified) — one `lib_deps` key added; the header comment extended with the three rules that line depends on.
- `homeworks/project-baseline/src/main.cpp` (modified) — reduced to a C++ shim that formats the same three readings and hands them to `emb_log`.
- `shared/lib/README.md` (rewritten) — the contract; its closing Phase-3 promise replaced rather than appended to.
- `shared/pio/VERSIONS.md` (extended) — the two measured C standards, in their own short heading beside the pin.
- `README.md` (modified) — a new section naming the shared-library mechanism.
- `homeworks/project-baseline/README.md` (modified) — the same statement in the baseline's register, beside its build section.

## Decisions Made

- **The seam abstracts the console and time, and names no board fact.** `emb_hal` declares no pin,
  no UART number and no bridge identity, so this phase commits nothing a board can contradict and
  board facts stay with the phase that owns them.
- **The UART number is the literal `0`.** The framework's serial-number macro lives in the C++
  header this backend must not include, so UART0 is named directly; the comment records why.
- **A not-ready sink drops the line and reports false.** Buffering would hide the failure until a
  later flush, and a diagnostic would travel on a channel known not to carry text; readiness is
  the caller's way to tell the two apart.
- **`emb_log` assembles its line by hand.** Carrying no header but its own and the seam's is what
  makes the host compilation below possible at all, so the `snprintf` convenience was declined.
- **The tag literal lives in the source, not the header.** That is what makes an edit recompile
  one translation unit rather than every consumer — the mechanism Reading one measures.
- **The version requirement's enforcement is review, not the tool**, and that boundary is written
  where the rule is, so no later reader assumes a gate that does not exist.

## The two measurements

Neither reading is automated. Both are build and toolchain observations rather than filesystem
assertions, and a test that spawned the PlatformIO binary would couple every task commit to a
binary this repository cannot assume is resolvable — the reason the existing suite stays
filesystem-only. Each was taken once, by hand, on the committed tree.

### Reading one — a shared-source edit propagates live, with no reinstall and no stale copy

Taken by hand from the repository root, on the committed tree, with PlatformIO resolvable at its
absolute path.

**The installed pointer files, before the edit:**

```
$ for f in homeworks/project-baseline/.pio/libdeps/projectbaseline_s3/*; do \
    printf '%s  %s\n' "$(stat -f '%Sm' -t '%Y-%m-%dT%H:%M:%SZ' "$f")" "$(basename "$f")"; done
EXIT=0
2026-10-17T03:06:52Z  emb_hal_arduino.pio-link
2026-10-17T03:06:52Z  emb_hal.pio-link
2026-10-17T03:06:52Z  emb_log.pio-link
2026-10-17T03:06:52Z  integrity.dat
```

**The edit** — the smallest one that changes what the firmware prints, in the one file the plan
names, changing `emb-log` to `hal-log` (a value that does not contain the old one as a substring):

```
shared/lib/emb_log/src/emb_log.c
- static const char EMB_LOG_TAG[] = "emb-log";
+ static const char EMB_LOG_TAG[] = "hal-log";
```

**The rebuild** (project-directory form; the log was captured to a temporary path and filtered to
the lines that carry the reading):

```
$ pio run -d homeworks/project-baseline
EXIT=0
Compiling .pio/build/projectbaseline_s3/libe53/emb_log/emb_log.c.o
Linking .pio/build/projectbaseline_s3/firmware.elf
Flash: [          ]   4.0% (used 258985 bytes from 6553600 bytes)
========================= [SUCCESS] Took 1.35 seconds =========================
```

Exactly one `Compiling` line ran, and it names `emb_log/emb_log.c.o` — one translation unit, the
one whose source changed. No third-party or framework translation unit was recompiled, and no
`Library Manager: Installing …` line was printed, because nothing was installed.

**The linked image:**

```
$ strings homeworks/project-baseline/.pio/build/projectbaseline_s3/firmware.bin | grep -c 'hal-log'
EXIT=0
1
$ strings homeworks/project-baseline/.pio/build/projectbaseline_s3/firmware.bin | grep -c 'emb-log'
EXIT=1
0
```

The new literal is present and the old one is absent: the edit reached the linked firmware, not
merely the object tree.

**The installed pointer files, after the rebuild:**

```
$ for f in homeworks/project-baseline/.pio/libdeps/projectbaseline_s3/*; do \
    printf '%s  %s\n' "$(stat -f '%Sm' -t '%Y-%m-%dT%H:%M:%SZ' "$f")" "$(basename "$f")"; done
EXIT=0
2026-10-17T03:06:52Z  emb_hal_arduino.pio-link
2026-10-17T03:06:52Z  emb_hal.pio-link
2026-10-17T03:06:52Z  emb_log.pio-link
2026-10-17T03:06:52Z  integrity.dat
```

Every timestamp is identical to the reading taken before the edit.

**Restore, asserted rather than described:**

```
$ git checkout -- shared/lib/emb_log/src/emb_log.c
$ git diff --exit-code -- shared/lib/emb_log/src/emb_log.c
EXIT=0 (no output)
```

**What the reading establishes.** The shared source is a real prerequisite of the consumer's
object file — its modification time, not an install step, is what drives the rebuild — so the
build system recompiles that one unit in place; and because the installed pointers are JSON
records rather than copies or filesystem symlinks, nothing is reinstalled and nothing is copied,
which is exactly why the pointer files' modification times do not move by a single second while
the firmware itself changes.

### Reading two — the framework-free modules compile and link on the host

Taken by hand, with the throwaway driver written outside the repository under the role-named
temporary directory `${TMPDIR}/phase03-hostcompile-driver` and removed before this record was
committed.

**The driver** supplied a host implementation of all four seam functions — a console that is
always ready and writes to the standard output, a millisecond clock, and an initialiser — and
called the pure-logic module's initialiser and line writer.

**The compilation** — one invocation, at the standard the version record names, warnings enabled
and treated as errors, carrying one interface-directory flag per shared library whose header the
command reaches (both of them):

```
$ clang -std=gnu99 -Wall -Wextra -pedantic -Werror \
    -I shared/lib/emb_hal/include \
    -I shared/lib/emb_log/include \
    shared/lib/emb_log/src/emb_log.c \
    /tmp/claude-501/phase03-hostcompile-driver/host_main.c \
    -o /tmp/claude-501/phase03-hostcompile-driver/hostdemo
EXIT=0
```

No framework header is on the include path. Two `-I` flags are present because there is no
dependency scanner on the host: the linker's `lib_deps` resolution does not exist here, so the
command carries the union of every shared library's interface directory, and omitting one fails
with a missing header rather than a missing library.

**The run:**

```
$ /tmp/claude-501/phase03-hostcompile-driver/hostdemo
EXIT=0
emb-log: flash=8388608 psram=1 psramSize=8388608
millis=0
```

The pure-logic module compiled, linked and ran on the host, and its output is the module's own
tagged line format written through the host's seam implementation.

**The falsification arm** — the framework-touching backend alone, with every include directory
the repository can supply and no framework path:

```
$ clang -std=gnu99 -Wall -Wextra -pedantic -Werror \
    -I shared/lib/emb_hal/include \
    -c shared/lib/emb_hal_arduino/src/emb_hal_arduino.c \
    -o /tmp/claude-501/phase03-hostcompile-driver/backend.o
EXIT=1
shared/lib/emb_hal_arduino/src/emb_hal_arduino.c:28:10: fatal error: 'esp32-hal-uart.h' file not found
   28 | #include <esp32-hal-uart.h> /* uartBegin / uartWrite / uartWriteBuf */
      |          ^~~~~~~~~~~~~~~~~~
1 error generated.
```

**Residue:**

```
$ test -z "$(ls -d /tmp/claude-501/phase03-hostcompile* 2>/dev/null)"
EXIT=0
```

**What the reading establishes.** The seam is real from both sides. The pure-logic module and the
interface compile and run with no framework header reachable, so "pure logic is testable on the
host" is a demonstrated property rather than a claim about the tree's shape; and the one unit that
does reach the framework cannot cross to the host at all, failing on the framework's own UART
header. That refusal is the measured evidence the contract in `shared/lib/README.md` rests on,
and it is why the backend is the single entry in the seam check's named exemption list.

## Verification

Run from the repository root, with PlatformIO resolvable at `~/.platformio/penv/bin/pio`:

| Check | Result |
|---|---|
| `node --test "tools/**/*.test.mjs"` | 39 tests, 39 pass, 0 fail |
| `pio project config -d homeworks/project-baseline --lint` | `The "platformio.ini" configuration file is free from linting errors.` |
| `node tools/generate-workspace.mjs --check` | `homework.code-workspace is up to date` |
| `node tools/sweep-homeworks.mjs --list` | `project-baseline` — still exactly one project, no depth violation |
| `git status --porcelain` | empty before this file's carrier commit |

Task-level `<verify>` commands, all passing:

- `pio run -d homeworks/project-baseline 2>&1 \| grep -c 6553600` → `1`
- `pio pkg list -d homeworks/project-baseline 2>&1 \| grep -c 'symlink://../../shared/lib/'` → `3`
- `pio pkg list -d homeworks/project-baseline 2>&1 \| grep -cE 'emb_hal @ 0.1.0\|emb_hal_arduino @ 0.1.0\|emb_log @ 0.1.0'` → `3`
- the `lib_deps` single-line pattern over `homeworks/project-baseline/platformio.ini` → `1`
- the manifest-and-layout assertion → `3 manifests ok`
- the include-path seam assertion → `seam holds in the sources`
- `strings …/firmware.bin \| grep -c 'emb-log'` → `1`
- `grep -c '^### Reading' 03-01-SUMMARY.md` → `2`
- `grep -c 'emb_log/emb_log.c.o' 03-01-SUMMARY.md` → ≥ 1
- `grep -c 'gnu99' 03-01-SUMMARY.md` → ≥ 1
- `grep -c 'esp32-hal-uart.h' 03-01-SUMMARY.md` → ≥ 1
- `git diff --exit-code -- shared/lib/emb_log/src/emb_log.c` → exit 0
- `test -z "$(ls -d "${TMPDIR:-/tmp}"/phase03-hostcompile* 2>/dev/null)"` → exit 0

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**PlatformIO's anonymous telemetry endpoint is denied by this session's sandbox on every
invocation.** Each `pio` command printed a `deny network-outbound collector.platformio.org:443`
notice. It is recorded because it looks like a failure in a log and is not one: every build,
`pkg list` and `project config` invocation in this run succeeded with it denied. The research
predicted exactly this.

**The manifest-and-layout verification's first form was over-strict, and was corrected rather than
satisfied by weakening the artifact.** An early draft of the *acceptance* check (not a plan
`<verify>` command) rejected `emb_hal.h` for containing the word `pin`. The header's only
occurrence is the deliberate disclaimer that it names none. The check was rewritten to assert
what the criterion actually means — no device node, no `usbmodem`/`usbserial`, no `SERIAL_`
macro, no GPIO constant, no `pinMode`/`digitalWrite`, and exactly the four declared functions —
and the header was left as written. Recorded because the artifact was not edited to fit a
detector, which is the opposite of the plan's second prohibition.

## Known Stubs

None. Every file this plan ships carries real values: the three manifests declare literal names
and versions, both headers declare their full function sets, both sources implement them, and the
two READMEs state the mechanism rather than deferring it. The absence that is deliberate — no
`src/` under `emb_hal`, no `include/` under `emb_hal_arduino` — reads as incomplete only if the
contract in `shared/lib/README.md`, which explains both, is not read first.

## Threat Flags

None. This plan introduces no surface the plan's `<threat_model>` does not already cover: no
machine-local path reached a tracked file (the version record's absence assertion still passes, and
the measurement's temporary directories are named by role in this record rather than by literal
path in any committed artifact), no external package was installed, and no manifest carries a
`scripts` key or a `build` section. The seam's purity contract is enforced structurally — one
directory with sources and no interface directory, one unit including a framework header, and a
mandatory C++ guard — and Reading two's falsification arm is the measurement it rests on.

## Next Phase Readiness

The slice is proved: three libraries resolve from the live shared tree, the baseline builds green
through them with the N16R8 partition intact, and the two properties that cannot be read off the
tree — live propagation and host-testability — are recorded measurements.

Plan 03-02 can now write the seam check against a tree that exists and a backend whose exemption
line is already determined, and add the regression suite its own validation map lists. Plan 03-03
takes the depth-rule measurement and corrects `ROADMAP.md`; this plan deliberately took neither
criterion 5's arms nor any `ROADMAP.md` edit. `[env:native]` and the host test suite remain Phase
5's, and the seam check is still not wired into any gate.

One live risk stays unretired and is worth repeating where the next phase will read it: the host
compilation above ran with `clang`, while `platform = native` expects a system GCC and
`/usr/bin/gcc` on this machine is an Apple clang shim. Phase 5 must smoke-test that before
relying on it.

---

## Self-Check: PASSED

- `shared/lib/emb_hal/library.json`, `shared/lib/emb_hal/include/emb_hal.h` — FOUND
- `shared/lib/emb_hal_arduino/library.json`, `shared/lib/emb_hal_arduino/src/emb_hal_arduino.c` — FOUND
- `shared/lib/emb_log/library.json`, `shared/lib/emb_log/include/emb_log.h`, `shared/lib/emb_log/src/emb_log.c` — FOUND
- `shared/lib/README.md`, `shared/pio/VERSIONS.md`, `README.md`, `homeworks/project-baseline/README.md` — FOUND
- Commit `3db4ce9` (Task 1) — FOUND, ancestor of HEAD
- Commit `b03b409` (Task 2) — FOUND, ancestor of HEAD
- `shared/lib/emb_log/src/emb_log.c` byte-identical to its committed content — CONFIRMED (`git diff --exit-code` exit 0)
- Throwaway host driver residue — NONE (`/tmp/claude-501/phase03-hostcompile*` absent)
- `git status --porcelain` — empty before this file's carrier commit
