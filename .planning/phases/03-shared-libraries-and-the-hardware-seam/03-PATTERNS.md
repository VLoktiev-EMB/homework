# Phase 3: Shared Libraries and the Hardware Seam - Pattern Map

**Mapped:** 2026-10-17
**Files analyzed:** 15 new/modified files
**Analogs found:** 9 exact/role-match + 4 RESEARCH-supplied (no in-repo analog) + 2 self-edits

> **Tracked-source gate.** Every analog path named below was verified git-tracked
> (`git ls-files -- <path>` non-empty) this session. No analog is a gitignored
> install/runtime mirror. The `.pio/libdeps/`, `.pio/build/`, `compile_commands.json`
> and `.vscode/c_cpp_properties.json` artifacts the research inspects are all
> gitignored and are **never** named as file patterns to copy from.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `shared/lib/emb_hal/library.json` | config (manifest) | transform (declarative) | none in-repo — RESEARCH Pattern 1 | no-analog |
| `shared/lib/emb_hal/include/emb_hal.h` | interface header (pure C) | request-response (C ABI) | none in-repo — RESEARCH Code Examples | no-analog |
| `shared/lib/emb_hal_arduino/library.json` | config (manifest) | transform (declarative) | none in-repo — RESEARCH Pattern 1 | no-analog |
| `shared/lib/emb_hal_arduino/src/emb_hal_arduino.c` | backend source (C) | request-response (console/time) | none in-repo — RESEARCH Pattern 5 | no-analog |
| `shared/lib/emb_log/library.json` | config (manifest) | transform (declarative) | none in-repo — RESEARCH Pattern 1 | no-analog |
| `shared/lib/emb_log/include/emb_log.h` | interface header (pure C) | request-response (C ABI) | `shared/lib/emb_hal/include/emb_hal.h` (sibling, same phase) | role-match |
| `shared/lib/emb_log/src/emb_log.c` | pure logic source (C) | transform + request-response | none in-repo — RESEARCH Code Examples | no-analog |
| `tools/check-hal-seam.mjs` | CLI tool / static-check utility | file-I/O (filesystem scan) | `tools/sweep-homeworks.mjs` | exact |
| `tools/tests/check-hal-seam.test.mjs` | test (fs-only) | file-I/O | `tools/tests/env-baseline.test.mjs` | exact |
| `tools/tests/helpers.mjs` (modified) | test helper | file-I/O (fixture builder) | itself | self |
| `homeworks/project-baseline/platformio.ini` (modified) | config (consumer) | transform (declarative) | itself | self |
| `homeworks/project-baseline/src/main.cpp` (modified) | source (C++ shim) | request-response | itself | self |
| `shared/lib/README.md` (modified) | doc (contract) | — | itself | self |
| `shared/pio/VERSIONS.md` (modified) | doc (version record) | — | itself | self |
| `.planning/ROADMAP.md` (modified) | doc (criterion correction) | — | itself | self |

---

## Pattern Assignments

### `shared/lib/emb_hal/include/emb_hal.h` (interface header, pure C)

**Analog:** none in the codebase. Use RESEARCH "Code Examples — The public C header".

**Why the header is the load-bearing piece:** this is the seam. It compiles on the host
with no framework headers, so it owns nothing but a C ABI. Two invariants are structural:

```c
/* shared/lib/emb_hal/include/emb_hal.h — from RESEARCH Code Examples */
#ifndef EMB_HAL_H
#define EMB_HAL_H

#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* False before emb_hal_init(), or if the console backend never came up. */
bool          emb_hal_console_ready(void);
void          emb_hal_init(void);
void          emb_hal_write_line(const char *line);
unsigned long emb_hal_millis(void);

#ifdef __cplusplus
}
#endif

#endif /* EMB_HAL_H */
```

**`extern "C"` guard is mandatory** (CONTEXT "Specific Ideas"): without it the C++ shim
links against a mangled name and the linker error names the symbol, never the missing
guard. This belongs in the library template and in `shared/lib/README.md`.

**Board-neutral by construction** (folded todo): the header names no pin, no UART number
and no bridge identity. `emb_hal_init()` takes `void` deliberately. No `src/` directory —
an interface has no translation unit (RESEARCH Open Question 4).

**Style to copy for the file-comment header** (no C header exists in-repo; the
rationale-first comment idiom is the repository convention, seen at
`tools/lib/discover.mjs:1-9` and `shared/pio/base.ini:1-37`): a short block comment stating
*what this file is for and why the shape is what it is*, above the code.

---

### `shared/lib/emb_hal_arduino/src/emb_hal_arduino.c` (backend, C)

**Analog:** none in the codebase. Use RESEARCH "Pattern 5" — measured working this session.

**This is the only translation unit in `shared/lib/` allowed to see the framework**
(D-08/D-11). Its failure to compile on the host
(`fatal error: 'esp32-hal-uart.h' file not found`) is the proof the seam is real.

```c
/* Source: RESEARCH Pattern 5 — signatures read from cores/esp32/esp32-hal-uart.h:33 */
#include <esp32-hal-uart.h>   /* extern "C" { ... } at :19 */
#include <esp32-hal.h>        /* millis() */
#include "emb_hal.h"

static uart_t *s_uart;

bool emb_hal_console_ready(void) { return s_uart != 0; }

void emb_hal_init(void) {
  s_uart = uartBegin(0, 115200, 0x800001c, -1, -1, 256, 256, false, 112);
}

void emb_hal_write_line(const char *line) {
  if (!s_uart) return;                                   /* the sink is not ready — D-06's explicit decision */
  uartWriteBuf(s_uart, (const uint8_t *)line, strlen(line));
  uartWrite(s_uart, (uint8_t)'\n');
}

unsigned long emb_hal_millis(void) { return millis(); }
```

**Pitfall 1 — do NOT use `Serial`.** `Serial` is a C++ object; `#include <Arduino.h>`
parses fine as C but `Serial.println(line)` fails with `error: 'Serial' undeclared … did
you mean 'erfcl'?`. Reach the console through `esp32-hal-uart.h` only. Also: `SERIAL` is a
macro in `Arduino.h`, **not** `esp32-hal-uart.h`, so the backend passes `0` (or a named
constant) as the UART number.

**The not-ready sink is an explicit decision, not an accident** (CONTEXT "Specific
Ideas", ASVS V7): the write must not silently swallow. `emb_hal_console_ready()` surfaces
the state. The planner records the chosen behaviour on a not-ready sink.

**No `include/` directory.** A backend must expose no public header; the directory split
makes that boundary structural rather than conventional (D-09). Manifest:
`{ "name": "emb_hal_arduino", "version": "0.1.0", "frameworks": ["arduino"] }` — the
`frameworks` key is a plain correctness declaration, measured harmless, and is **not** the
exemption mechanism (Pitfall 7; D-11).

---

### `shared/lib/emb_log/src/emb_log.c` + `include/emb_log.h` (pure logic, C)

**Analog:** the `emb_hal` sibling header (same phase). Both are pure C, `extern "C"`-guarded,
framework-free.

**Structure:** `emb_log` writes *through* `emb_hal` only. It never includes a framework
header and never calls `emb_hal_arduino`. A `.c` file, not `.cpp`. Include the `emb_hal`
header by name; the LDF needs a separate consumer line for it (Pattern 3 trap).

```c
/* shared/lib/emb_log/src/emb_log.c — writes through the seam only */
#include "emb_log.h"
#include "emb_hal.h"   /* resolves only when emb_hal is declared in the consumer's lib_deps */
```

**Host-compilation demonstration (D-12, by hand, recorded verbatim in SUMMARY.md):**
no LDF on the host, so the single command carries the union of every shared library's
`include/`:

```
$ clang -std=gnu99 -Wall -Wextra -pedantic -Werror \
    -I shared/lib/emb_hal/include \
    -I shared/lib/emb_log/include \
    shared/lib/emb_log/src/emb_log.c <host-backend-and-main>.c -o hostdemo
$ ./hostdemo
REHEARSAL-MARKER flash=1234 t=0
```

Omit an `-I` and it fails with a missing header, not a missing library (measured). The
backend is deliberately absent from this command — it cannot compile without the
framework (Pattern 4).

**`gnu99` is the ceiling, not C11** (D-04): no `_Static_assert`, no `stdatomic.h`.

---

### `shared/lib/*/library.json` (manifests)

**Analog:** none. Use RESEARCH Pattern 1 — the default PlatformIO layout, measured.

```json
// shared/lib/emb_hal/library.json — Source: RESEARCH Pattern 1, measured shape
{ "name": "emb_hal", "version": "0.1.0" }
```

**Rules:**
- **`name` byte-identical to the `lib_deps` LHS** (Pitfall 3). A mismatch installs a
  pointer named after the LHS while the graph reports the manifest name.
- **`version` is Required by policy but NOT mechanism-enforced** (Pitfall 2, Open
  Question 2). Absent → `0.0.0+<timestamp>`, regenerated every install. State in
  `shared/lib/README.md` that its enforcement is review, not the tool.
- **No `build` section anywhere** (D-09): a custom `srcDir`/`srcFilter` is the *cause* of
  the "silently drops translation units" trap, not its fix.
- **No `scripts` key** (ASVS supply-chain). The manifest schema allows `postinstall`/
  `preuninstall`; an explicit "no `scripts` in any shared manifest" rule is warranted.

---

### `tools/check-hal-seam.mjs` (CLI tool, filesystem scan)

**Analog:** `tools/sweep-homeworks.mjs` — **exact match.** A `#!/usr/bin/env node` script
deriving `REPO_ROOT` from `import.meta.url`, carrying an argument surface documented in a
top block comment, failing loudly on zero matches, and exiting non-zero with a named
message.

**Copy these structures verbatim:**

**Repo-root derivation + shebang + header comment** (`tools/sweep-homeworks.mjs:1-30`):
```js
#!/usr/bin/env node
// …rationale block comment: what it enforces, the flags, why zero-match fails…
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
```

**Flag parsing with a loud misuse refusal** (`sweep-homeworks.mjs:39-53`) — `--root <dir>`
so the test can scan a fixture, refusing a missing value:
```js
const at = argv.indexOf("--root");
if (at === -1) return REPO_ROOT;
const value = argv[at + 1];
if (value === undefined || value.startsWith("--")) {
  console.error("--root needs a directory: --root <dir>");
  process.exit(2);
}
return resolve(value);
```

**Zero-match = failure, named flag as the only escape hatch** (`sweep-homeworks.mjs:88-99`):
```js
if (found.length === 0) {
  console.error("…found ZERO …");
  console.error("A gate that checked nothing must not exit 0.");
  process.exit(1);
}
```
This is not hypothetical: `shared/lib/` contains no library *before* this phase writes
them, so the check's first execution must already behave correctly (RESEARCH Pattern 6).

**The scan body** — RESEARCH Pattern 6, falsified against every class:
```js
const INCLUDE = /^[ \t]*#[ \t]*include[ \t]*[<"]([^>"]+)[>"]/;

function isFramework(includePath) {
  const base = includePath.split("/").pop();
  return (
    base === "Arduino.h" ||             // exact trailing name — never a substring
    base.startsWith("esp_") ||          // the real IDF prefix
    base.startsWith("esp32-hal-") ||    // the Arduino HAL prefix esp_ misses
    includePath.startsWith("driver/") ||
    includePath.startsWith("freertos/")
  );
}
```

**The exemption is a named list, one line** (D-11): `const ALLOWED = ["emb_hal_arduino"];`
A directory-name pattern would silently exempt anything matching; a manifest-field
inference adds a parser and a new failure mode.

**Entry-point guard** (copy from `tools/generate-workspace.mjs:68-70`) so the module can be
imported by its test without running the scan at import:
```js
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
```

**Anti-pattern (do NOT):** substring search — it leaks `esp32-hal-*` and cries wolf on
`ArduinoJson.h` (`"ArduinoJson.h".includes("Arduino")` is true, `.startsWith("Arduino.h")`
is false). A recursive shell `find`/`grep` — the repo's idiom is a Node filesystem walk.

---

### `tools/tests/check-hal-seam.test.mjs` (test, fs-only)

**Analog:** `tools/tests/env-baseline.test.mjs` — **exact match.** A pure-`node:test` suite
that never spawns `pio`, builds throwaway fixture trees, and asserts on file contents and
CLI exit codes.

**Header + imports + cleanup** (`env-baseline.test.mjs:1-35`):
```js
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { cleanupAll, makeFragmentConsumer, makeTree } from "./helpers.mjs";

test.after(cleanupAll);

const TESTS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(TESTS_DIR, "..", "..");
```

**Static facts against the real tree + a falsifiable fixture** — the two-part shape
(`env-baseline.test.mjs:175-213`): one test asserts the real repo; a second builds
correct/misplaced/absent fixtures so the assertion is provably able to fail. Reuse the
options pattern (`wrongPath`, `fragment: false`) for the seam check's fixture.

**Spawn a repo CLI against a fixture root and read its exit code** — copy
`runSweep` from `helpers.mjs:169-175`, pointing at `check-hal-seam.mjs` with `--root`:
```js
export function runSweep(root, args = [], env = {}) {
  return spawnSync(process.execPath, [SWEEP_PATH, "--root", root, ...args], {
    cwd: REPO_ROOT, encoding: "utf8", env: { ...process.env, ...env },
  });
}
```

**Required behaviours to cover** (RESEARCH Validation Architecture):
- a planted `<Arduino.h>` under `emb_log` is named and exits non-zero;
- a planted `<esp32-hal-gpio.h>` is named (the prefix `esp_*` misses);
- planted `<freertos/FreeRTOS.h>` and `<driver/gpio.h>` are named;
- `<ArduinoJson.h>` in a third-party library is **not** flagged;
- zero libraries under `shared/lib` exits non-zero with a named message;
- the allow-list skips exactly `emb_hal_arduino` — with a falsification arm that renames
  the backend;
- each `shared/lib/<name>/library.json` carries `name` + `version` (SHARED-01);
- the three library directories equal the expected set (SHARED-01);
- the baseline's `lib_deps` declares exactly three `symlink://` specs, each LHS equal to
  its manifest `name` (SHARED-02) — **requires the single-line comma form**, see Pitfall 5.

**Pitfall 5 — `sections()` mis-parses a multi-line `lib_deps`.** It returns
`lib_deps => ""` plus three phantom keys. Either write `lib_deps` on one comma-separated
line, or extend `sections()` with a continuation-line rule *before* asserting on it. Do
not write a test that assumes the current reader handles the multi-line form.

---

### `tools/tests/helpers.mjs` (modified helper)

**Analog:** itself (see read above).

**Add** a shared-library fixture builder beside `makeFragmentConsumer` (`helpers.mjs:109-152`),
following its exact idiom: a throwaway tree under `os.tmpdir()`, fixture content written
relative to the root, and construction options that make the assertion **falsifiable**
(cf. the `wrongPath`/`fragment: false` pattern). It must be able to plant
`shared/lib/<name>/{library.json,include,src}` and a consumer that declares them. Extend
this builder — do not fork it (RESEARCH Wave 0 Gaps). Reuse `makeTree()`
(`helpers.mjs:30-34`) and `writeFileAt()` (`helpers.mjs:61-66`); register created trees so
`cleanupAll()` (`helpers.mjs:177-183`) removes them.

---

### `homeworks/project-baseline/platformio.ini` (modified config)

**Analog:** itself (see read above). Add the `lib_deps` line; everything else stays.

**Pattern 2 — one comma-separated line, measured working** (RESEARCH Code Examples):
```ini
[env:projectbaseline_s3]
board = esp32-s3-devkitc-1
framework = arduino
lib_deps = emb_hal=symlink://../../shared/lib/emb_hal, emb_hal_arduino=symlink://../../shared/lib/emb_hal_arduino, emb_log=symlink://../../shared/lib/emb_log
```

- **One line per library, transitive included** — the LDF (default `chain` mode) does not
  follow an include that exists only inside another library (Pattern 3 trap; D-08).
- **Single-line comma form** — the multi-line form is mis-read by the repo's own
  `sections()` reader (Pitfall 5).
- **Do NOT put `lib_deps` in `shared/pio/base.ini`** — it works, which is exactly why it
  is tempting, but it gives every homework all three libraries and hides the consumer's
  dependency list from `grep` (anti-pattern).
- `board`/`framework` stay in the project env, never the fragment (Phase 2 CR-01).
- The env name is derived by `envNames()` (`tools/lib/discover.mjs`), never spelled by hand.
- **`lib_deps` in `platformio.ini` triggers a full rebuild** — expected; do not optimize.

---

### `homeworks/project-baseline/src/main.cpp` (modified shim)

**Analog:** itself (see read above).

**D-02 — this file stays C++.** `setup()`/`loop()` are declared **without** `extern "C"`
in `cores/esp32/Arduino.h:149-150`, so they carry C++ linkage; a `.c` definition would emit
`setup` where the core links `_Z5setupv`. Keep `void setup()` / `void loop()` exactly as
they are.

**Change:** print the existing report *through* `emb_log`, not through `Serial::printf`.
Everything below the shim is C. The shared header is `extern "C"`-guarded, so the C++
shim includes it directly:
```cpp
#include <Arduino.h>   // required: setup()/loop() linkage
#include "emb_log.h"   // the seam — C ABI behind an extern "C" guard
```
The shim forces logic out of the Arduino file — the same discipline SHARED-03 asks of the
shared layer (D-02 side benefit). Criterion 2 remains demonstrable: a line changed inside
`emb_log` visibly changes what the firmware prints.

---

### `shared/lib/README.md` (modified doc — the language contract)

**Analog:** itself (see read above). It currently promises "the binding library layout,
HAL seam and testing rules arrive with Phase 3" (line 19) — this phase fulfils it.

**Add the rule, in one home** (Claude's Discretion decision):
- "`shared/lib/` is pure C; a homework is a thin C++ shim plus C logic."
- The `library.json` + `include/` + `src/` layout, backend carries no `include/`.
- `name` and `version` are both required **and their enforcement is review, not the tool**
  (Pitfall 2 / Open Question 2).
- `extern "C"` guards are mandatory on every public C header (failure mode: mangled-symbol
  linker error naming the symbol, not the guard).
- `emb_hal_arduino` is the only directory allowed to see the framework; the seam check
  enforces exactly that, with its named `ALLOWED` list.
- Record the per-consumer `lib_deps` choice and the `dependencies` alternative's cost
  (Open Question 3) so it is traceable, not rediscovered as a "trick".

---

### `shared/pio/VERSIONS.md` (modified doc — measured numbers)

**Analog:** itself (see read above). Add the two measured standards beside the platform
pin (follows Phase 2 `D-09`; one canonical source per fact):
- `-std=gnu99` — every `.c` in `shared/lib/`, from `platformio-build-esp32s3.py:45`
- `-std=gnu++11` — the shim only, from `platformio-build-esp32s3.py:50`
- Record the ceiling: `gnu99` has no `_Static_assert` and no `stdatomic.h`; C11 must not
  be assumed.
- The existing "no machine-local path" test (`env-baseline.test.mjs:289-302`) still applies.

---

### `.planning/ROADMAP.md` (modified doc — criterion corrections)

**Analog:** itself. Two dated corrections, in the established Phase 1 override style:
1. **D-10 divergence** beside criterion 3: the implemented set is `Arduino.h` (exact),
   `esp_` + `esp32-hal-` (prefix), `driver/` + `freertos/` (subpath) — the literal `esp_*`
   misses `esp32-hal-*`, and a substring `Arduino` false-flags `ArduinoJson.h`.
2. **Retire the Phase 1 depth-rule override** beside criterion 5, recording the measured
   divergence (Pitfall 4 / Open Question 1): the unmodified deeper copy fails with
   `UndefinedEnvPlatformError: Please specify platform for 'projectbaseline_s3' environment`
   (the fragment path fails first); the arm-B fixture (fragment path at depth 3, `lib_deps`
   at depth 2) fails with the literal ``PackageException: Can not create a symbolic link for
   `../../shared/lib/emb_hal`, not a directory``. Carry **both** arms plus arm C (both paths
   corrected → builds) as the measurement.

---

### `homeworks/project-baseline/README.md` and root `README.md` (modified docs)

**Analog:** themselves. Add the reader-facing statement naming the shared-library mechanism
(`lib_deps = <name>=symlink://../../shared/lib/<name>`), consistent with `shared/lib/README.md`.

---

## Shared Patterns

### Fail loudly on zero matches
**Source:** `tools/sweep-homeworks.mjs:88-99`
**Apply to:** `tools/check-hal-seam.mjs`
A gate that checked nothing must never exit 0; the single escape hatch is a named flag,
never a silent bypass. The seam check inherits this for the empty-`shared/lib` case.

### Repo-root derivation from `import.meta.url`
**Source:** `tools/sweep-homeworks.mjs:37`, `tools/generate-workspace.mjs:21`
**Apply to:** `tools/check-hal-seam.mjs` and any new `tools/` script
The script derives its root from its own location, never from `process.cwd()`, so it runs
from any working directory.

### Entry-point guard for an importable CLI module
**Source:** `tools/generate-workspace.mjs:68-70`
**Apply to:** `tools/check-hal-seam.mjs` (its test imports the module)
Module-scope CLI work would run on import; guard with `import.meta.url === pathToFileURL(process.argv[1]).href`.

### Pure-filesystem tests, no child processes
**Source:** `tools/tests/env-baseline.test.mjs:1-35` (the stated reason: spawning `pio`
couples every commit to a binary the repo cannot assume is resolvable)
**Apply to:** `tools/tests/check-hal-seam.test.mjs`
Stay filesystem-only. The *builds* that prove criteria 1, 2 and 5 are taken once, by hand,
and recorded in the summary — never automated here.

### Falsifiable fixtures with options
**Source:** `tools/tests/helpers.mjs:109-152` (`makeFragmentConsumer` with `wrongPath`,
`fragment: false`)
**Apply to:** the new shared-library fixture helper and every assertion built on it
A fixture option that plants the *wrong* layout proves the assertion can fail, rather than
merely passing.

### Dependency-free `.ini` reading
**Source:** `tools/tests/env-baseline.test.mjs:52-77` (`sections()`), modelling
`configparser(inline_comment_prefixes=("#", ";"))`
**Apply to:** reading the baseline's `lib_deps` — **only for the single-line form**
(Pitfall 5: a multi-line `lib_deps` reads as `""` plus phantom keys).

### Repo-wide scan idiom for `lib_extra_dirs` / `globallib_dir` (SHARED-04)
**Source:** `tools/tests/ignore-rules.test.mjs` (the dated-research exclusion idiom)
**Apply to:** the SHARED-04 check — scan the tracked tree for the deprecated directives,
  clean outside the dated research files.

### Rationale-first file headers
**Source:** `tools/lib/discover.mjs:1-9`, `shared/pio/base.ini:1-37`,
  `tools/sweep-homeworks.mjs:1-30`
**Apply to:** every new `.c`, `.h`, `library.json` and `.mjs` file
State what the file is for and why the shape is what it is, above the code.

---

## No Analog Found

Files with no close match in the codebase. The planner should use the RESEARCH.md
patterns named above (the code is fully supplied there, measured this session).

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `shared/lib/emb_hal/library.json` | config | declarative | No PlatformIO `library.json` exists yet — this phase creates the first |
| `shared/lib/emb_hal/include/emb_hal.h` | interface header (C) | C ABI | No C header exists in the repo (`tools/` and the baseline are `.mjs`/`.cpp`) |
| `shared/lib/emb_hal_arduino/library.json` | config | declarative | as above |
| `shared/lib/emb_hal_arduino/src/emb_hal_arduino.c` | backend source (C) | console/time | No framework-touching C exists; the baseline's `main.cpp` is C++ and GPIO-free |
| `shared/lib/emb_log/library.json` | config | declarative | as above |
| `shared/lib/emb_log/src/emb_log.c` | pure logic (C) | transform | No pure-C source exists yet |

## Metadata

**Analog search scope:** `tools/`, `tools/lib/`, `tools/tests/`, `shared/lib/`,
`shared/pio/`, `homeworks/project-baseline/`
**Files scanned:** 15 (4 tracked analogs read in full: `sweep-homeworks.mjs`,
`generate-workspace.mjs`, `discover.mjs`, `env-baseline.test.mjs`, `helpers.mjs`,
`ignore-rules.test.mjs`; plus the consumer, fragment and version-record files)
**Tracked-source gate:** all analogs verified git-tracked this session; no gitignored
`.pio/`-tree artifact named
**Pattern extraction date:** 2026-10-17
