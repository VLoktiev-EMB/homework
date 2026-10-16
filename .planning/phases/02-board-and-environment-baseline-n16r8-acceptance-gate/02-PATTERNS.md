# Phase 2: Board and Environment Baseline (N16R8 Acceptance Gate) - Pattern Map

**Mapped:** 2026-10-16
**Files analyzed:** 9 (4 created, 5 modified/updated, 1 of which is planning output)
**Analogs found:** 9 / 9

**Planner note — what carries this phase.** Phase 2 is a *configuration and documentation* phase plus one new pure-filesystem test. There is essentially **no C++ in this phase**: `homeworks/project-baseline/src/main.cpp` is unchanged. The analogs split into two families:

1. **In-repo `.ini` / `.mjs` / `.md` files at HEAD** — the real, tracked, already-shipped shapes a new file should imitate. Cited with absolute line numbers below. All are verified git-tracked (see Metadata).
2. **`02-RESEARCH.md` measured excerpts** — the *content* of `shared/pio/base.ini` and the acceptance command sequence, measured in a scratch tree on 2026-10-16. There is no existing `shared/pio/` file to copy the *fragment shape* from; the RESEARCH measurement is the only positive source for it. Where a plan needs the exact text, quote RESEARCH; where it needs the *style* of a repo file, quote the in-repo analog.

Do **not** invent a fragment shape, a test style, or a README voice — each has a named analog below.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `shared/pio/base.ini` | config (PlatformIO fragment) | declarative / n-a | `homeworks/project-baseline/platformio.ini` (content) + `02-RESEARCH.md` § Code Examples (fragment shape) | **role-match** (no fragment exists at HEAD) |
| `shared/pio/VERSIONS.md` | doc (version record) | n-a | `AGENTS.md` § "Measured on this machine" lines 146–159 | **role-match** |
| `homeworks/project-baseline/platformio.ini` (modify) | config (project) | declarative / n-a | itself, at HEAD | **exact** |
| `homeworks/project-baseline/README.md` (modify) | doc | n-a | itself, § "Why no console port is pinned" lines 31–36 | **exact** |
| `README.md` (modify) | doc | n-a | itself, § structure lines 31–53 + § building lines 75–85 | **exact** |
| `AGENTS.md` (modify) | doc (correction) | n-a | itself, § "Measured on this machine" lines 146–159 | **exact** |
| `tools/tests/env-baseline.test.mjs` | test (pure filesystem) | read-only file assertion | `tools/tests/ignore-rules.test.mjs` | **exact** (same real-repo, no-fixture stance) |
| `tools/tests/helpers.mjs` (modify) | test helper (fixture builder) | filesystem fixture | itself, at HEAD | **exact** |
| `.planning/phases/02-…/02-0X-SUMMARY.md` | doc (phase log / evidence) | n-a | `01-05-SUMMARY.md` (Phase 1 acceptance-run precedent) | **role-match** |

---

## Pattern Assignments

### `shared/pio/base.ini` (config fragment, declarative)

**Analog (content):** `homeworks/project-baseline/platformio.ini` lines 1–24 — the literal override set this fragment absorbs.
**Analog (shape):** `02-RESEARCH.md` § Code Examples → *`shared/pio/base.ini` — the fragment* (the exact `[env]` form measured working on 2026-10-16).

**Header-comment pattern** — the existing file's comment block is the model: a purpose line, a *why*, and a trap note. `platformio.ini:1-14`:

```ini
; Repository baseline — NOT a course homework. See README.md in this directory.
;
; D-12: an exact platform pin (never a range, never the development branch) plus
; the four measured N16R8 overrides. The official `esp32-s3-devkitc-1` manifest
; describes the N8 / no-PSRAM module, so the default configuration is wrong for
; this hardware; `board_build.arduino.memory_type` in particular decides which
; prebuilt core library set is linked.
```

The fragment must carry the same voice **plus** the RESEARCH's two measured-trap notes (override rule via `[env:<id>_s3>]`, and `build_flags` replace-vs-append). Quote the RESEARCH fragment verbatim (RESEARCH lines 410–445); it is measured, not sketched.

**The environment facts — copy the key/value set exactly** (`platformio.ini:16-23`, all four overrides measured in Phase 1, re-measured through `extra_configs` in RESEARCH):

```ini
platform = espressif32@7.1.3
board = esp32-s3-devkitc-1
framework = arduino
board_upload.flash_size = 16MB
board_build.partitions = default_16MB.csv
board_build.arduino.memory_type = qio_opi
build_flags = -DBOARD_HAS_PSRAM
monitor_speed = 115200
```

**The three port keys are new** (`D-04`/`D-07`) and have no in-repo analog — take them from RESEARCH lines 442–444: `upload_port` / `monitor_port` / `test_port = /dev/cu.usbserial-*`.

**Load-bearing properties (all measured — see RESEARCH § Pitfalls 1–3):**
- The block is **`[env]`**, a global defaults layer — NOT `[env:<name>]`. A `[env:<name>]` here would stop the fragment being shared.
- The fragment declares **no environment** (Pattern 2). The project owns `[env:<id>_s3]`.
- A **missing** fragment exits **0** with an empty environment body — the guard must assert on content, never on `$?`.
- A project overrides a key **only** inside its own `[env:<id>_s3>]`; a second `[env]` in the project loses silently.
- An env-level `build_flags` **replaces** the inherited list; append via `${env.build_flags} …`.
- Never named `platformio.ini`; no empty section headers.

**Must NOT do:** do not add `upload_speed`, `debug_tool = esp-builtin`, or a native-USB env — deferred by `D-05` and listed under § Deferred Ideas.

---

### `shared/pio/VERSIONS.md` (doc, version record)

**Analog:** `AGENTS.md` § "Measured on this machine" lines 146–159 — a fact table of resolved versions, in the repo's markdown-table voice.

**Table pattern** (`AGENTS.md:146-154`, abridged):

```markdown
### Measured on this machine (2026-10-15)

| Fact | Measured value |
|------|----------------|
| PlatformIO Core | `PlatformIO Core, version 6.2.0` at `/Users/vloktiev/.platformio/penv/bin/pio`; **not** on the interactive PATH |
| Installed Arduino core | `framework-arduinoespressif32` 4.20017.260907+sha.dcc1105b (core 2.0.17, IDF_VER `v4.4.7-dirty` in the compile line) |
```

**Content source (measured for the baseline env, 2026-10-16 — RESEARCH lines 554–565):**

```
Platform espressif32 @ 7.1.3 (required: espressif32 @ 7.1.3)
├── framework-arduinoespressif32 @ 4.20017.260907+sha.dcc1105b  (required: ~4.20017.0)
├── framework-espidf @ 4.60100.0                               (required: ~4.60100.0)
├── tool-esptoolpy @ 2.41100.260830                            (required: ~2.41100.0)
├── toolchain-xtensa-esp32s3 @ 8.4.0+2021r2-patch5
├── toolchain-xtensa-esp-elf @ 15.2.0+20251204
```

**Load-bearing properties:** trim to **name + version** — record the *non-verbose* `pio pkg list` form, because the `-v` form appends `/Users/vloktiev/.platformio/platforms/espressif32`, a machine-local path that must not reach a public repo (`D-09`, ASVS V14/V8). Record the full resolved set as printed (including `framework-espidf` / `toolchain-xtensa-esp-elf` / `toolchain-riscv32-esp`, resolved because the *platform* declares them) and add a one-line note naming which two the `arduino` framework actually uses. **Cross-reference:** `base.ini` header points at this file; a contradiction with `AGENTS.md:146-159` is a defect to fix, not to leave.

---

### `homeworks/project-baseline/platformio.ini` (project config, modify)

**Analog:** itself at HEAD (lines 1–24) — the file is **rewritten**, not extended.

**Target shape** (`02-RESEARCH.md` § Code Examples → *the consumer*): keep a header comment, add a `[platformio]` section carrying `extra_configs`, and reduce the env to a bare header:

```ini
[platformio]
extra_configs = ../../shared/pio/base.ini

[env:projectbaseline_s3]
```

**Load-bearing properties:**
- `extra_configs = ../../shared/pio/base.ini` — path is relative to the **project dir** (`ARCHITECTURE.md:358`), reached as `../../` from one level below `homeworks/`, the same arithmetic as `symlink://../../shared/lib/<name>` (`shared/lib/README.md:10`).
- The `[env:projectbaseline_s3]` header is **required** — a project with only `[platformio] extra_configs` creates no environment and `pio run` dies with `ProjectEnvsNotAvailableError` (RESEARCH Pattern 2). The name comes from `tools/lib/discover.mjs` `envNames("project-baseline")` → `projectbaseline_s3` (lines 94–97). **Do not invent a spelling** — import the rule.
- The current header's "No console-port key is pinned anywhere in this file" paragraph (`platformio.ini:9-11`) becomes **false** and must be rewritten, not appended to.

---

### `homeworks/project-baseline/README.md` (doc, modify)

**Analog:** itself, § "Why no console port is pinned" lines 31–36 — the section that is now false.

```markdown
## Why no console port is pinned

The repository is public and no usable port is verified on this machine — `pio device list` shows
only the debug console and a Bluetooth port. A committed port would be either a private machine
detail or a build-breaker on another machine, so Phase 2 settles the port and console choice after
the acceptance run.
```

**How to change it:** **replace** this section with the settled console decision (`D-03`: UART bridge is the repo default; `D-04`: ports pinned by glob `/dev/cu.usbserial-*`), and point at `shared/pio/VERSIONS.md`. Do not append a correction beside the old text — the old text is the thing being retired.

**Also update § "Build"** (`README.md:11-21`): the `6553600`-byte claim stays true, but the pointer to "the four N16R8 overrides in `platformio.ini`" becomes "the shared fragment `shared/pio/base.ini`". Voice: short declarative sections, `pio run -d …` in a fenced block, no marketing prose.

---

### `README.md` (root, modify)

**Analog:** itself — § "Repository structure" lines 31–53 (the tree block) and § "Building a homework" lines 75–85.

**Structure-block pattern** (`README.md:49-53`):

```text
├── shared/
│   └── lib/                      # reusable PlatformIO libraries
└── homeworks/
    └── project-baseline/         # the build-proof project — not a course homework
```

**How to change it:** widen the `shared/` entry to show `pio/` beside `lib/` (`shared/pio/base.ini`, `shared/pio/VERSIONS.md`), and add a line under § "Building a homework" naming the platform/console decision with a pointer at `shared/pio/VERSIONS.md`. `README.md:84` already shows `pio device monitor -d homeworks/<id>` — keep that form.

---

### `AGENTS.md` (doc, correction)

**Analog:** itself, § "Measured on this machine" lines 146–159.

**How to change it:** only the **contradiction-fix** the canonical refs require — where a resolved-version fact in this table disagrees with `shared/pio/VERSIONS.md`, align it and point at `VERSIONS.md` as authoritative for the resolved set. `D-09`/`D-24` forbid a criterion resting on this file (GSD regeneration can revert a correction), so **add no new facts here and move no source of truth into it**. If nothing contradicts, this file is not touched.

---

### `tools/tests/env-baseline.test.mjs` (test, pure filesystem — NEW)

**Analog:** `tools/tests/ignore-rules.test.mjs` — the one existing test that reads the **real** repository read-only, with no fixture. Match it exactly.

**Header + import + root-derivation pattern** (`ignore-rules.test.mjs:16-31`):

```javascript
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

// Two directories up from `tools/tests/`.
const TESTS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(TESTS_DIR, "..", "..");
```

**Table-as-data pattern** (`discover.test.mjs:21-40`) — keep the required keys as data with a `protects`/reason note, so an edit fails with a reason, not a bare status:

```javascript
const ACCEPTED = ["m01-l03-blink", "project-baseline", /* … */];
```

Mirror `ignore-rules.test.mjs:68-109` (`MUST_BE_IGNORED` objects carrying a `protects` field) for the fragment's required keys.

**Reading a file's content for an assertion** (`ignore-rules.test.mjs:189-199`) — the established idiom for a content check over a repo file:

```javascript
const offenders = readFileSync(join(REPO_ROOT, IGNORE_FILE), "utf8")
  .split("\n")
  .filter((line) => /^[^#][^#]*#/.test(line));
```

**What this test must assert (pure filesystem, no `pio` spawn — RESEARCH § Validation Architecture):**
1. `shared/pio/base.ini` exists at the path every project's `extra_configs` names.
2. The fragment carries `board_upload.flash_size = 16MB`, `board_build.partitions = default_16MB.csv`, `board_build.arduino.memory_type = qio_opi`, `build_flags` containing `-DBOARD_HAS_PSRAM`.
3. `shared/pio/VERSIONS.md` names the resolved platform / Arduino core / esptool / toolchain versions (criterion 3).

**Criterion 4's content assertion** (RESEARCH § Code Examples → *Criterion 4's assertion*) is over `pio project config --json-output` and belongs in the **phase log**, not this test — the suite spawns no PlatformIO process today (`sweep.test.mjs` points `PLATFORMIO_CORE` at an unresolvable path deliberately). Keep it that way. If a future guard ever does need `pio`, take the binary resolution from `tools/sweep-homeworks.mjs:111-128` (`resolvePio`) verbatim rather than re-deriving it.

---

### `tools/tests/helpers.mjs` (test helper, modify)

**Analog:** itself at HEAD — extend, do not rewrite.

**Fixture-builder patterns to reuse** (`helpers.mjs:28-64, 130-136`):

```javascript
export function makeTree() { /* mkdtempSync under tmpdir, pushed to `created` */ }
export function makeHomework(root, id, options = {}) { /* homeworks/<id>/ + platformio.ini */ }
export function writeFileAt(root, relPath, contents = "") { /* mkdir + writeFileSync */ }
export function cleanupAll() { /* rmSync every created root */ }
```

**New fixture to add** (RESEARCH § Wave 0 Gaps): a helper that installs a **fragment under `<fixture>/shared/pio/`** and a **consumer under `<fixture>/homeworks/<id>/`**, so the "fragment exists at the resolved path" assertion can be exercised against a *wrong* path and shown to fail. Model the relative-path arithmetic on `makeDepthViolation` (`helpers.mjs:99-105`), and honour the file's standing rule (`helpers.mjs:1-15`): **no fixture is ever built, and no test points PlatformIO at the real repository root.**

**Cleanup wiring** — every fixture-using test file calls `test.after(cleanupAll)` (`sweep.test.mjs:28`, `discover.test.mjs:17`). Any new fixture-consuming test must do the same.

---

### `.planning/phases/02-…/02-0X-SUMMARY.md` (phase log, evidence — planning output)

**Analog:** `01-05-SUMMARY.md` — "both the plan's deliverable and the evidence the phase's four criteria depend on" (`D-10`).

**The two carried-forward conventions (`D-11`):**
1. **Write the log as late as the assertions allow** — it is itself a new unignored file under a tracked directory; an early write makes the clean-tree reading fail over the log instead of the object under test.
2. **An observation the agent cannot make gets an explicitly unfilled output slot** — a plausible-sounding invented observation would enter the log as evidence and be read as fact by every later phase.

**Verbatim-only readings** — the RESEARCH acceptance sequence (§ Code Examples) names the exact commands and the exact strings: `Chip is ESP32-S3 …`, `Features: WiFi, BLE, Embedded PSRAM 8MB (AP_3v3)`, `USB mode: …`, `Detected flash size: 16MB`, and the firmware line `baseline: flash=16777216 psram=1 psramSize=8388608`. Record them **as printed** or leave the slot empty.

**Evidence classification to state in those words (`D-12`):** the console half of criterion 5 is **settled by measurement**; the RGB-LED pin (GPIO48) is **settled by owner confirmation** — a different kind of evidence. Do not credit an observation that was never made.

---

## Shared Patterns

### The exact-pin rule, single enforcement point
**Source:** `homeworks/project-baseline/platformio.ini:16` (`platform = espressif32@7.1.3`)
**Apply to:** `shared/pio/base.ini` (the new single enforcement point) and every future homework env
`platform = espressif32@7.1.3` — never a range, never `#develop` (`AGENTS.md` constraints; `HW-04`).

### Fail loudly on zero matches
**Source:** `tools/sweep-homeworks.mjs:88-99`
**Apply to:** any new gate this phase adds (it adds none that spawn; noted as the repo's stance)
```javascript
if (found.length === 0) {
  if (allowEmpty) { console.log("sweep: no homework projects found (--allow-empty)"); process.exit(0); }
  console.error("sweep: found ZERO homework projects under homeworks/*/platformio.ini");
  console.error("A gate that built nothing must not exit 0.");
  process.exit(1);
}
```
The single escape hatch is a **named flag** (`--allow-empty`), never a silent bypass.

### Generate → drift check (byte comparison)
**Source:** `tools/generate-workspace.mjs:44-62`
**Apply to:** `VERSIONS.md` **only if** a guard is ever wanted — nothing in Phase 2 needs a generated artifact, so this is reference, not a task. Do not hand-roll a drift mechanism.
```javascript
if (onDisk === expected) { console.log("homework.code-workspace is up to date"); return 0; }
console.error(["homework.code-workspace is STALE.", /* … */].join("\n"));
return 1;
```

### Argument arrays, no shell
**Source:** `tools/sweep-homeworks.mjs:130-140`
**Apply to:** any `spawnSync` a new test adds (ASVS V5)
```javascript
const result = spawnSync(pio, ["run", "-d", homework.dir], { cwd: root, stdio: "inherit" });
```
Comment (`sweep-homeworks.mjs:130-133`): "An argument array and no shell, so nothing is word-split or re-interpreted and a discovered path can never be read as a command."

### Read the resolved configuration with the tool's own parser
**Source:** RESEARCH § Don't Hand-Roll
**Apply to:** the criterion-4 evidence reading — use `pio project config --json-output`; never a regex/INI parser in `tools/`. Do not `eval`; never string-slice the text form. Parse JSON and select entries whose name starts with `env:` (the bare `env` section appears in text mode only).

### Machine-local detail never enters the public repo
**Source:** `D-04` (glob port) + `D-09` (trim `pkg list`)
**Apply to:** `base.ini` (glob, not literal) and `VERSIONS.md` (non-verbose form). The literal device node and the `/Users/vloktiev/.platformio/…` path belong in the phase-log **procedure**, never in a committed config.

---

## No Analog Found

Files with no close match at HEAD (the planner must use the named RESEARCH measurement, not a code analog):

| File | Role | Reason |
|---|---|---|
| `shared/pio/base.ini` (fragment **shape**) | config | No PlatformIO fragment exists in the repo; the `[env]` form is the RESEARCH measurement § Code Examples. |
| `shared/pio/VERSIONS.md` | doc | No version-record document exists; the table style is borrowed from `AGENTS.md`, the content from the RESEARCH `pio pkg list` reading. |
| `/dev/cu.usbserial-*` glob value | config value | No port literal or glob exists anywhere in the tree (Phase 1 deliberately left the port unpinned, `platformio.ini:9-11`). |

---

## Metadata

**Analog search scope:** `tools/`, `tools/lib/`, `tools/tests/`, `shared/`, `homeworks/project-baseline/`, root `README.md` / `AGENTS.md`, `.planning/phases/01-…/`.
**Files scanned:** 13 read in full; tracked-source gate passed for all (see below).
**Tracked-source gate (verified with `git ls-files -- <path>`, 2026-10-16):**

```
tools/tests/helpers.mjs                     tools/tests/helpers.mjs
tools/sweep-homeworks.mjs                   tools/tests/sweep.test.mjs
tools/generate-workspace.mjs                tools/tests/ignore-rules.test.mjs
tools/lib/discover.mjs                      tools/tests/discover.test.mjs
tools/tests/generate-workspace.test.mjs     homeworks/project-baseline/platformio.ini
homeworks/project-baseline/README.md        README.md
shared/lib/README.md                        AGENTS.md
```
Every analog path emitted above is tracked source; none is a gitignored install/runtime mirror. `shared/pio/` does **not** exist at HEAD (confirmed `ls shared/` → only `lib/`), so the fragment and `VERSIONS.md` are genuinely new files, not modifications.

**Pattern extraction date:** 2026-10-16
