---
phase: 03-shared-libraries-and-the-hardware-seam
reviewed: 2026-10-17T00:31:55Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - README.md
  - homeworks/project-baseline/README.md
  - homeworks/project-baseline/platformio.ini
  - homeworks/project-baseline/src/main.cpp
  - shared/lib/README.md
  - shared/lib/emb_hal/include/emb_hal.h
  - shared/lib/emb_hal/library.json
  - shared/lib/emb_hal_arduino/library.json
  - shared/lib/emb_hal_arduino/src/emb_hal_arduino.c
  - shared/lib/emb_log/include/emb_log.h
  - shared/lib/emb_log/library.json
  - shared/lib/emb_log/src/emb_log.c
  - shared/pio/VERSIONS.md
  - tools/check-hal-seam.mjs
  - tools/tests/check-hal-seam.test.mjs
  - tools/tests/env-baseline.test.mjs
  - tools/tests/helpers.mjs
findings:
  critical: 0
  warning: 5
  info: 8
  total: 13
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-10-17T00:31:55Z
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

The phase ships three shared libraries (`emb_hal` interface, `emb_hal_arduino` backend,
`emb_log` logic), a baseline that consumes them, and a repository-owned seam check with a
falsification suite. I read all 17 files end to end, traced the C seam into the framework's
`uartBegin`/`uartWriteBuf` as installed on this machine, and re-derived the buffer arithmetic
rather than trusting the comments.

**No finding reached BLOCKER.** Specifically, I looked for and did not find: a stack-buffer
overrun in `emb_log_line` (the `*used + 1u >= EMB_LOG_LINE_MAX` guard holds the write at index 95
of a 96-byte buffer, and the module terminates the line only at index <= 95); a wrong
`uartBegin` call (9 arguments, matching the installed core's signature, with `-1` for both pins
— which `uartSetPins` treats as "leave the ROM's UART0 pins alone", exactly what a bridge on
GPIO43/44 needs); an unimplemented or unmatched declaration (all 4 seam functions and all 3
`emb_log` functions are defined, and `shared/lib/emb_log/src/emb_log.c` resolves `emb_hal.h`
through the declared dependency line); or committed secrets, machine-local paths, debug
artifacts, `eval`, or command/path injection (the two spawned commands use `spawnSync` with an
argument array and no shell; `check-hal-seam.mjs` never writes).

Two independent checks that the tree is real rather than merely green:

- `node --test "tools/**/*.test.mjs"` → **58 tests, 58 pass, 0 fail** (see the note below),
  and `node tools/check-hal-seam.mjs` → `scanned 2 libraries under shared/lib; no framework
  include found`, exit 0.
- The committed build artifact is newer than every reviewed source
  (`.pio/build/projectbaseline_s3/firmware.elf` 03:13 vs. the sources 03:10) and its linker map
  links `emb_log`, `emb_hal_console_ready`, `emb_hal_init`, `emb_hal_write_line` and
  `emb_hal_millis` out of `lib2e4/libemb_log.a` and `lib36a/libemb_hal_arduino.a` — so the C
  compiles and links through `symlink://` as the READMEs claim, and the `.pio/libdeps` entries
  are `.pio-link` markers with no copied source tree.

The five warnings are one contract defect with a silent failure mode (`EMB_LOG_LINE_MAX`),
one call site that discards the only failure signal on the acceptance vehicle, two holes in the
new gate's own coverage, and four undocumented magic values in the one file permitted to touch
the framework. The eight info items are documentation drift and small robustness/duplication
observations. Nothing here argues against the phase's architecture, which the tests do defend
well: the seam check is falsified class by class, the exemption is proven exact by a near-miss
case, the manifest and consumer assertions are run against the real tree and against fixtures
that are visibly wrong, and the directive scan distinguishes a use from a mention rather than
grep-matching.

**Note (not a finding):** the task context states 59 tests; the suite on this tree reports 58
(`grep -c "^test(" tools/tests/*.test.mjs` sums to 58: 19 + 12 + 7 + 6 + 5 + 9). Either the
number moved or the count included something else — worth knowing before anyone treats a count
as the gate.

## Critical Issues

None. See the summary for the four classes of defect I searched for and did not find.

## Warnings

### WR-01: `EMB_LOG_LINE_MAX` is published as the caller's buffer size, but the caller's real text budget is 86 characters — a longer line is dropped, not truncated

**File:** `shared/lib/emb_log/include/emb_log.h:25-29` (with `shared/lib/emb_log/src/emb_log.c:39` and `homeworks/project-baseline/src/main.cpp:23`)

**Issue:** The header states the constant is "The longest line this module will assemble,
including its own tag" and instructs "A caller that must format into a buffer should size it with
this constant". Two arithmetic facts contradict that instruction:

1. The longest line the module will assemble is `EMB_LOG_LINE_MAX - 1` = **95** characters, not
   96. `emb_log_append` refuses as soon as `*used + 1u >= EMB_LOG_LINE_MAX`, so the last byte of
   the array is reserved for the terminator the module itself writes at `emb_log.c:64`. The
   constant is a *buffer size*; the header describes it as a *line length*.
2. The module-owned tag and separator (`"emb-log"` + `": "`, 9 bytes, `emb_log.c:32-33`) come out
   of that same 95. So a caller's `text` is guaranteed to fit only up to **86** characters. A
   caller that follows the header can pass up to 95.

The two compound into a silent loss: `main.cpp:23` sizes `report` exactly with the constant, so
`snprintf` may legally fill 95 characters; `emb_log_line` then refuses with `false` and writes
nothing. Today the baseline report is 50 characters (`baseline: flash=16777216 psram=1
psramSize=8388608`), so nothing is lost yet — this is a latent defect that fires the first time a
report grows or a second homework copies the pattern the header recommends.

**Fix:** publish the budget the caller actually needs, and correct the description of the buffer
constant.

```c
/* A caller's text budget: the tag and separator take 9 of EMB_LOG_LINE_MAX's bytes,
 * and the terminator one more. Text longer than this is refused with false, never
 * truncated. */
#define EMB_LOG_TEXT_MAX 86

/* The size of the buffer emb_log_line assembles into; the longest line it will
 * assemble is EMB_LOG_LINE_MAX - 1. */
#define EMB_LOG_LINE_MAX 96
```

and in `homeworks/project-baseline/src/main.cpp:23`, `char report[EMB_LOG_TEXT_MAX];`. A
`sizeof`-based static check on the tag length would also prevent the two constants from drifting
(an `enum`-based assertion is available at C99; `_Static_assert` is not).

### WR-02: the baseline shim discards `emb_log_line`'s return value, so a dropped report is indistinguishable from a delivered one

**File:** `homeworks/project-baseline/src/main.cpp:31`

**Issue:** `emb_log_line` returns `false` both when the sink is not ready and when the line does
not fit, and `emb_log.h:42-47` states the contract explicitly: "The caller decides what to do
with the dropped line." This call site is the phase's on-hardware acceptance vehicle, and its
documented worst case — in `homeworks/project-baseline/README.md`, `shared/lib/emb_hal_arduino.c:
21-25` and again on `emb_hal.h:30-35` — is "a board that flashes successfully and prints
nothing". The shim has no path that reports which of those happened: `emb_log_ready()` is never
called, the `bool` is discarded, and `snprintf`'s own truncation return is discarded too. The
one API built to make the failure observable is the one thing the acceptance run does not read.
Combined with WR-01 this is the silent-drop path: report grows past 86 characters, the module
refuses, the serial line shows nothing, and the acceptance run cannot tell that from a healthy
board whose console failed.

**Fix:** with the buffer sized at `EMB_LOG_TEXT_MAX` (WR-01), "does not fit" becomes impossible by
construction, and a `false` return can then mean exactly one thing. Make that explicit at the
call site rather than dropping the value:

```cpp
  if (!emb_log_line(report)) {
    /* The seam reported the line dropped. The console is not ready, and the seam is
     * the only channel this firmware has — there is nowhere else to say so. The
     * return value is the record; the acceptance run reads it here. */
  }
```

### WR-03: the seam check's matcher recognises one Arduino-core header name and five framework prefixes, so the seam can break without the gate noticing

**File:** `tools/check-hal-seam.mjs:90-98`

**Issue:** `isFrameworkInclude` catches `Arduino.h` by exact trailing name, `esp_*`,
`esp32-hal-*`, `driver/` and `freertos/`. A file under `shared/lib/` could `#include <Wire.h>`,
`<SPI.h>`, `<HardwareSerial.h>`, `<FS.h>`, `<WiFi.h>`, `<soc/soc.h>`, `<hal/gpio_types.h>`,
`<rom/ets_sys.h>`, `<nvs_flash.h>` or `<sdkconfig.h>` and the check would print `no framework
include found` and exit 0 — while `shared/lib/README.md:63-73` states the rule as "no header here
names a framework header" and pins its enforcement on this check, and `check-hal-seam.mjs:2-6`
describes itself as "the thing that refuses". The deliberate `necessary, not sufficient` stance
(the check reads source text and never the compiler's include graph) does not cover this gap:
the hole is in the *name list*, not in the text-versus-compilation boundary. `esp32-hal-gpio.h`
was added for exactly this reason (ROADMAP criterion 3's recorded correction), so the class of
omission is already recognised — it was just closed for one prefix and not the others.

**Fix:** extend the predicate with the Arduino core's own header names and the remaining IDF
directories, and falsify each new class in the suite, in the idiom the file already uses:

```js
  const ARDUINO_CORE_HEADERS = new Set([
    "Arduino.h", "HardwareSerial.h", "Print.h", "Stream.h", "WString.h",
    "FS.h", "SPI.h", "Wire.h", "WiFi.h", "IPAddress.h", "USB.h",
  ]);
  return (
    ARDUINO_CORE_HEADERS.has(base) ||
    base === "sdkconfig.h" || base === "nvs.h" || base === "nvs_flash.h" ||
    base.startsWith("esp_") || base.startsWith("esp32-hal-") ||
    ["driver/", "freertos/", "soc/", "hal/", "rom/", "lwip/"].some((d) => includePath.startsWith(d))
  );
```

### WR-04: `shared/lib/README.md` states that no gate in the repository checks a manifest's `version`, and this phase's own suite does

**File:** `shared/lib/README.md:47`

**Issue:** The contract file says of the `version` invariant: "`version` is **enforced by review,
not by the tool** ... No gate in this repository checks it today." Commit `453561b`
("test(03-02): assert the manifest invariants and the consumer's dependency line") added
`manifestProblems()` to `tools/tests/check-hal-seam.test.mjs:362-366`, which fails when a
manifest's `version` is absent or empty — run both against fixtures
(`check-hal-seam.test.mjs:503-531`, the `omitVersionIn` case) and against the real tree
(`check-hal-seam.test.mjs:464-469`), inside the suite the repository invokes with
`node --test "tools/**/*.test.mjs"`. The sentence was written one plan earlier (`b03b409`, plan
03-01) and the phase then falsified it without updating it. The README is elsewhere careful about
the script-versus-wired-gate distinction (`shared/lib/README.md:73`: "wiring it into a gate is a
later phase's to do") and that distinction is the fair reading here — the *tool* still does not
enforce it, and nothing runs the suite automatically — but as written the sentence sends a reader
to manual review for a property the tree now asserts mechanically, and it understates the gate
the phase built.

**Fix:** apply the same script-versus-gate split the seam paragraph uses:

> `version` is not enforced by the tool ... It is asserted by the shared-tree suite
> (`tools/tests/check-hal-seam.test.mjs`), which fails on an absent or empty version, both against
> the real tree and against a fixture carrying the omission. Nothing wires that suite into a hook
> or CI yet.

### WR-05: four of the nine `uartBegin` arguments are unexplained literals in the one file permitted to touch the framework

**File:** `shared/lib/emb_hal_arduino/src/emb_hal_arduino.c:44`

**Issue:** `uartBegin(0, 115200, 0x800001c, -1, -1, 256, 256, false, 112)`. The file's own header
block explains why the UART number is the literal `0` and why the pins are not named — the two
decisions a reader would otherwise get wrong. It says nothing about the other four values:
`0x800001c` is `SERIAL_8N1` (verified at
`framework-arduinoespressif32/cores/esp32/HardwareSerial.h:65`) and, like the UART number, can
only be written as a literal because the macro lives in the C++ header this file must not
include; `256, 256` are the RX/TX driver buffer sizes (the core's `begin()` uses 256); `false` is
"not inverted"; `112` is the RX FIFO full threshold, mirroring `HardwareSerial`'s
`_rxFIFOFull`. In a repository whose stated core value is that a file explains itself in week
forty, an unlabelled `0x800001c` in the one framework-facing translation unit is the value most
likely to be "fixed" wrongly by a later reader — and the comment three lines above already
establishes that literals here need to justify themselves.

**Fix:** name the values and state why each is the one in force:

```c
/* 0x800001c is SERIAL_8N1 (8 data bits, no parity, 1 stop bit). The macro lives in
 * HardwareSerial.h, the C++ header this file must not include, so the value is
 * written out; it is the framework's own default and the bridge expects it.
 * 256/256 are the RX/TX driver buffers, 112 the RX-FIFO threshold the core's
 * begin() uses; `false` is "not inverted". */
#define EMB_HAL_ARDUINO_SERIAL_8N1 0x800001c
#define EMB_HAL_ARDUINO_RX_BUFFER 256
#define EMB_HAL_ARDUINO_TX_BUFFER 256
#define EMB_HAL_ARDUINO_RXFIFO_FULL 112
```

## Info

### IN-01: the root README's repository map omits `tools/check-hal-seam.mjs`

**File:** `README.md:44-48`

**Issue:** The structure block lists `generate-workspace.mjs`, `sweep-homeworks.mjs`, `lib/` and
`tests/`; the phase added a third top-level script and nothing in `README.md` or `AGENTS.md`
names it (verified: `grep -rn "check-hal-seam" --include="*.md" .` outside `.planning/` returns
nothing). The map is the file a newcomer reads first, and this one now under-reports the tool
tree it exists to describe.
**Fix:** add a line beside the other two, e.g.
`│   ├── check-hal-seam.mjs        # refuses a framework include outside the named backend`.

### IN-02: the directive scan's mention exceptions are matched by prefix, so a file entry exempts more than the file

**File:** `tools/tests/check-hal-seam.test.mjs:695`

**Issue:** `exceptions.some((allowed) => file.startsWith(allowed))` applies one mechanism to two
kinds of entry. The directory entries (`.planning/phases/`, `.planning/research/`) need a prefix
match; the file entries (`AGENTS.md`, `tools/tests/check-hal-seam.test.mjs`) do not, so a future
tracked `AGENTS.md.orig` or `tools/tests/check-hal-seam.test.mjs.bak` naming a deprecated
directive would pass the scan unreviewed — the exact silent pass the list exists to prevent.
**Fix:** split the list into directories and files and match files with `===`:

```js
const permitted = DIRECTIVE_MENTION_DIRS.some((d) => file.startsWith(d)) ||
  DIRECTIVE_MENTION_FILES.includes(file);
```

### IN-03: the string `"shared/lib"` is defined twice, by the check and by the fixture builder

**Files:** `tools/check-hal-seam.mjs:66` and `tools/tests/helpers.mjs:38`

**Issue:** Both export `SHARED_LIB_DIR = "shared/lib"`, and the test takes the fixture's copy
(`tools/tests/check-hal-seam.test.mjs:30`) while the spawned check uses its own. If either ever
changes, the fixtures would keep planting one location while the check scanned another, and the
suite would report the seam check passing against a tree it never looked at. `helpers.mjs:8-9`
states the repository's own rule for this — "there is exactly one of it: two copies would drift,
and the one that drifts is the one a reader trusts".
**Fix:** have `helpers.mjs` import `SHARED_LIB_DIR` from `../check-hal-seam.mjs`, as it already
imports `envNames` from `../lib/discover.mjs`.

### IN-04: an unreadable path or a file where a directory is expected crashes the check instead of producing its named refusal

**File:** `tools/check-hal-seam.mjs:112`, `:127`, `:151`

**Issue:** `readdirSync` and `readFileSync` are unguarded. The header comment promises the
opposite for the neighbouring case ("A missing directory yields an empty list rather than
throwing, so the caller reports 'nothing found' instead of an exception"), and the suite asserts
that promise for the absent-directory case (`tools/tests/check-hal-seam.test.mjs:251-255`,
requiring empty stderr). A *file* at `shared/lib`, or an unreadable file beneath a library, turns
the named refusal into a Node stack trace. It still exits non-zero, so it fails safe — but the
report a reader gets no longer says what to fix.
**Fix:** wrap the walks in `try`/`catch` and push a `could not be checked` line, in the shape
`directiveProblems` already uses for an unreadable tracked file
(`tools/tests/check-hal-seam.test.mjs:678-684`).

### IN-05: `emb_hal_write_line` writes the line and its terminator as two independent UART transactions, and the interleaving window is unrecorded

**File:** `shared/lib/emb_hal_arduino/src/emb_hal_arduino.c:51-52`

**Issue:** `uartWriteBuf(...)` and `uartWrite(..., '\n')` each take the UART mutex separately, so
the terminator can be separated from its line by any other writer to UART0 — and there is one in
this very call path: the framework's own `log_e` writes to UART0, including from inside
`uartBegin` (`esp32-hal-uart.c`: "UART%d initialization error."). The seam's contract is "one
line", and one line is what the receiving end should see. The two-write form is what plan 03-01
specified verbatim ("the caller's bytes through the core's buffered UART write then a single
newline through the core's single-byte write"), so this is a deliberate choice rather than an
oversight — but it is not recorded in the shipped file, and this repository's practice is to
write that kind of residual down. Impact today is cosmetic and the cost of removing it is one
byte.
**Fix:** either record the window in the file comment, or make the line a single write. The
single-write form needs the terminator inside the caller's buffer, which re-points the contract
at `emb_hal.h`: `emb_hal_write_line` receives text already ending in `'\n'` and issues exactly
one `uartWriteBuf`; `emb_log_line` then appends `'\n'` to `buf` after its content, which is
possible only if the content bound drops from 95 to 94 (WR-01's budget becomes 85). The cheaper
option is the comment.

### IN-06: both new comments locate `monitor_speed` in the project's `platformio.ini`, where it is not

**Files:** `homeworks/project-baseline/src/main.cpp:14-15`,
`shared/lib/emb_hal_arduino/src/emb_hal_arduino.c:33-34`

**Issue:** Both say the baud rate must match `` `monitor_speed = 115200` `` "in platformio.ini" /
"in the consumer's platformio.ini". The key is not in `homeworks/project-baseline/platformio.ini`
— it is in the shared fragment `shared/pio/base.ini:85`, merged in through `extra_configs`, and
`tools/tests/env-baseline.test.mjs:78-82` asserts that it lives there and not in any project
file. A reader who wants to change the console rate will open the project file, find no such key,
and have to rediscover the fragment. The rate itself is right; only its address is wrong.
**Fix:** name the fragment: "which is the rate `monitor_speed` in `shared/pio/base.ini` expects,
merged into this environment through the `extra_configs` key".

### IN-07: the seam's `millis()` and `ready()` accessors, and three exports of the seam check, have no consumer in the tree

**Files:** `shared/lib/emb_hal/include/emb_hal.h:50` + `emb_hal_arduino.c:55`;
`shared/lib/emb_log/include/emb_log.h:40`; `tools/check-hal-seam.mjs:66`, `:77`, `:90`, `:146`

**Issue:** `emb_hal_millis()` and `emb_log_ready()` are declared, implemented and linked into
the firmware, and nothing calls them (`firmware.map` carries both symbols; a repository-wide
grep finds only their definitions). Of the check's exports, only `ALLOWED` is imported anywhere —
`SHARED_LIB_DIR`, `INCLUDE_PATTERN`, `isFrameworkInclude` and `scanSeam` are exported but unused,
and the predicate the suite's falsification cases exist to defend is never called directly (they
spawn the CLI, which is the stronger test). This is the phase's own cost model in reverse: an
API surface with no consumer and no test is what the next reader has to decide about.
**Fix:** either exercise them (a `ready()`-before-`init()` case belongs in the acceptance
description; a direct unit case on `isFrameworkInclude` would let the include classes be
falsified without spawning) or drop the unused exports and keep only `ALLOWED` and the CLI.

### IN-08: `uartBegin`'s documented failure mode is a clean `NULL`, and the installed core dereferences it on that path

**File:** `shared/lib/emb_hal_arduino/src/emb_hal_arduino.c:44` (called function:
`framework-arduinoespressif32/cores/esp32/esp32-hal-uart.c`, `uartBegin`)

**Issue:** The seam's readiness design rests on "the handle is the readiness state: null until
init succeeds" (`emb_hal_arduino.c:38`). In the core installed here (4.20017.260907, the version
`shared/pio/VERSIONS.md` records), the failure branch of `uartBegin` reads:

```c
    if (!retCode) {
        uartEnd(uart_nr);
        uart = NULL;
        log_e("UART%d initialization error.", uart->num);   /* uart is NULL here */
    }
```

so a failed `uart_driver_install`/`uart_param_config`/`uartSetPins` dereferences `NULL` before
`uartBegin` can return it — the not-ready state may never be reached, and the board may crash in
`setup()` instead of dropping writes. This is upstream's defect and not this repository's, the
values passed here are valid so the branch is practically unreachable, and there is no
caller-side fix. It is recorded because this repository's practice is to write residuals down
rather than leave them to be rediscovered, and because `emb_hal.h:30-35` reasons about a NULL
return as though the framework guarantees it.
**Fix:** no code change available at this call site; record the residual in the seam documents
("the framework's failed-`uartBegin` path dereferences the handle it just nulled, so a
not-ready console is not guaranteed to be observable as `false` — treated as unverified on
hardware until the acceptance run says otherwise").

---

_Reviewed: 2026-10-17T00:31:55Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
