# Phase 3: Shared Libraries and the Hardware Seam - Context

**Gathered:** 2026-10-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 turns `shared/lib/` from an empty placeholder into a working library home, and draws the hardware seam that the later ESP-IDF migration rides on:

- three real PlatformIO libraries under `shared/lib/`, each with a `library.json` carrying `name` and `version`
- the seam itself: a framework-free **C** interface (`emb_hal`), exactly one shared **C** backend that is allowed to reach the framework (`emb_hal_arduino`), and one pure-logic module (`emb_log`)
- the baseline homework consuming them through `lib_deps = <name>=symlink://../../shared/lib/<name>`, proving the live-symlink mechanism and the one-level depth rule by measurement
- the seam check: a repo-owned tool that names a framework include planted anywhere under `shared/lib` and exits non-zero
- the language contract stated once: `shared/lib/` is pure C, the homework is a thin C++ shim plus C logic

**Explicitly not in this phase:** `[env:native]` and any host test suite (Phase 5, `VERIFY-01`); `.clang-format` / `.clang-tidy` / cppcheck (Phase 5, `VERIFY-04`); pre-commit and CI wiring of the seam check (Phase 6, `VERIFY-02`); `shared/hardware/` board facts, the pin database and the pin-validation check (Phase 4, `HW-02`/`HW-03`); the `emb_hal_espidf` backend (arrives with the IDF era); wiring artifacts and `docs/` (Phase 4); the `new-homework` skill and `AGENTS.md` (Phase 7); the first real course homework (Phase 8).

**Scope anchor.** The five ROADMAP success criteria are the boundary. Nothing in this phase drives a GPIO, and nothing in this phase writes a test.

</domain>

<decisions>
## Implementation Decisions

### Language contract

- **D-01:** **`shared/lib/` is written in pure C.** Owner's rationale, stated in discussion: C compiles everywhere — STM32 included — so shared logic is not tied to the ESP32 or to a C++ toolchain. The choice is independently reinforced by the phase's own goal: ESP-IDF is a C framework, so a C-ABI seam is implementable from both Arduino (C++) and IDF (C) with no adapter layer, which is what `SHARED-03` means by "a backend swap rather than a rewrite". — **Reversibility:** costly — the language decides every module's ABI and every consumer's include site; switching later rewrites all shared modules and touches every call site.

- **D-02:** **A homework is a thin C++ shim plus C logic.** `src/main.cpp` stays C++ because the framework requires it, not by preference; everything below the shim is C. — Not a free choice: `cores/esp32/Arduino.h:149-150` declares `void setup(void);` and `void loop(void);` **without** `extern "C"`, so they carry C++ linkage, and `cores/esp32/main.cpp:42,50` — a C++ translation unit — is what calls them. There is no `main.c` in the core. A `.c` file defining `setup()` would emit an unmangled symbol while the core looks for `_Z5setupv`, failing at link with an error that names neither the rule nor the cause. Accepted side benefit: the shim forces logic out of the Arduino file, which is the same discipline `SHARED-03` asks of the shared layer.

- **D-03:** **The whole seam is reachable from C — measured, not assumed.** The ESP32 Arduino core 2.x is itself structured as a C layer under a thin C++ wrapper, so no part of this phase needs C++:
  - `cores/esp32/esp32-hal-gpio.h:23-24,74-75,86` — `pinMode()`, `digitalWrite()` inside `extern "C"`
  - `cores/esp32/esp32-hal-uart.h:18-19,45-46,109` — `uartBegin()`, `uartWrite()`, `uartWriteBuf()` inside `extern "C"`
  - `cores/esp32/esp32-hal.h:41,137-139` — `millis()`, `micros()`, `delay()`, `delayMicroseconds()` inside `extern "C"`
  Consequence: "shared is pure C" holds **completely**, backend included. The one exception this phase carries is not about language at all — it is about which directory may include framework headers (D-08).

- **D-04:** **The C++ standard contract (D4) is settled by measurement, and it shrinks.** `tools/platformio-build-esp32s3.py:44-45` sets `CFLAGS = ["-std=gnu99", …]` and `:49-50` sets `CXXFLAGS = ["-std=gnu++11", …]`. So the repository runs **two** standards, both imposed by the framework rather than guessed: `gnu99` for all of `shared/lib/`, `gnu++11` for the thin shim. This retires the open question in `STATE.md` and closes the MEDIUM-confidence gap left by `STACK.md:185` and `PITFALLS.md:129`. It also removes an entire failure class: the C++ drift (`gnu++11` → `gnu++2b` → `gnu++26`) no longer touches the shared layer at all, so "shared code must satisfy the intersection of every pinned env" stops being a moving target. **Record the ceiling explicitly**: `gnu99` has no `_Static_assert` and no `stdatomic.h`, so C11 must not be assumed.

### The seam's shape

- **D-05:** **Exactly one shared Arduino backend, at `shared/lib/emb_hal_arduino/`.** Choosing between "one shared backend" and "a backend inside every homework" turned on a fact the owner supplied: the Arduino→IDF transition is **temporal** — early homeworks are Arduino and stay Arduino, later ones are IDF, and the two rarely mix. Old homeworks therefore never migrate, which is fine because the pinned `espressif32@7.1.3` ships both frameworks at once (measured in Phase 2). So the seam is not for migrating homeworks at all; it is so that the **shared layer** survives the framework change, and so that a driver can be tested on the host in Phase 5. A per-homework backend would be written and tested once per homework instead of once. — **Reversibility:** costly — moving the backend into the homeworks later means editing every consumer's `lib_deps` and adding a source file to each.

- **D-06:** **The seam abstracts the console and time — not GPIO.** `emb_hal` exposes "write a line" and "how many milliseconds have elapsed"; `emb_log` writes through it, and the baseline prints its existing report through it. Rationale, in the owner's terms: no pin is touched, so Phase 1's `D-14` (the baseline is GPIO-free so it commits no unverified board fact) stays intact and board facts remain Phase 4's `HW-02`. Criterion 2 is still demonstrable — changing a line inside `emb_log` visibly changes what the firmware prints. A second reason this is not filler: logging is the single most reused facility in a coursework repository, and it is the module that carries across both framework eras. — **Reversibility:** reversible — adding a GPIO interface later is purely additive and would not disturb the console seam.

- **D-07:** **The seam is a console/time interface with one implementing backend per framework era.** `emb_hal_espidf` is deliberately **not** built in this phase; it arrives with the IDF era, and adding it is one new directory plus one line in the seam check's named list (D-09).

### Library set and layout

- **D-08:** **Three libraries: `emb_hal`, `emb_hal_arduino`, `emb_log`.** This is the research's own minimum-that-proves-the-loop set (`FEATURES.md:240`), and it exercises all three roles the seam needs — a framework-free interface, a framework-touching backend, and a pure-logic module — rather than proving the mechanism on a single library. It also makes the transitive-dependency trap real and therefore testable: the research records a verified failure (`FEATURES.md:20`, `fatal error: emb_hal.h: No such file or directory`) where the LDF does not follow an include that exists only inside another library, so **one `lib_deps` line is required per library, transitive ones included**. — **Reversibility:** reversible.

- **D-09:** **The standard PlatformIO library layout: `library.json` + `include/` + `src/`, and the backend carries no `include/`.** No `build` section anywhere in any manifest. `srcDir: "."` with a `srcFilter` — the shape `ARCHITECTURE.md:346` sketches — is the *fix for* the trap it names, not a virtue: a library whose sources are outside the default `src/` compiles its headers and silently drops its translation units, producing `undefined reference` errors that point away from the cause. The default layout is what the LDF expects, so the trap is avoided by construction rather than by a correctly written manifest. `emb_hal_arduino` having no `include/` is meaningful, not incidental: a backend must expose no public header, and the directory split makes that boundary structural instead of conventional. — **Reversibility:** reversible.

### The seam check

- **D-10:** **The check matches include *paths* exactly, never substrings, and closes a hole in the criterion as written.** ROADMAP criterion 3 names the patterns `Arduino.h`, `esp_*`, `driver/`, `freertos/`. Implemented literally, that list **misses `esp32-hal-*`** — the actual prefix of the ESP32 Arduino HAL headers, since they begin `esp32-`, not `esp_` — while a naive substring search for `Arduino` would **falsely flag `ArduinoJson.h`**, a third-party library and not a framework header. A gate that both leaks its target and cries wolf is exactly the failure this repository refuses. The implemented set is therefore: exact trailing-name match `Arduino.h`; prefix matches `esp_` **and** `esp32-hal-`; subpath matches `driver/` and `freertos/`. The divergence from the criterion's literal text is a deliberate, dated correction and must be recorded in `CONTEXT.md` and in `ROADMAP.md` beside the criterion, in the manner of Phase 1's accepted override. — **Reversibility:** reversible.

- **D-11:** **The exemption is a named list inside the check: `ALLOWED = ["emb_hal_arduino"]`.** Chosen against the owner's stated criterion that the option with **less friction** wins. Two alternatives were weighed and rejected on that criterion. Declaring `"frameworks": ["arduino"]` in `library.json` would require the check to parse every manifest — a new failure mode and a new dependency on a file format — and PlatformIO's field means "compatible with these frameworks", not "may include framework headers", so the exemption rule would degrade into an inference ("declares arduino but not espidf"). A directory-name pattern such as `emb_hal_*` would need no maintenance at all but would silently exempt any directory that happened to match — a hole wider than the one this phase is closing. The named list costs one line, corrected once in the project's life (when `emb_hal_espidf` appears), introduces no new machinery, is visible to a single `grep`, and keeps the exemption narrow and stated — the same posture as `--allow-empty` in Phase 1's `D-13`. — **Reversibility:** reversible.

### Host tests

- **D-12:** **Phase 3 states the rule and demonstrates host compilation by hand; the environment and the tests are Phase 5's.** None of this phase's five success criteria mentions a host test — the phrase "pure logic is testable on the host" in the phase goal is a rationale, not a criterion — while `[env:native]` is `VERIFY-01`, owned by Phase 5. Writing a test now would mean committing a file that cannot run until Phase 5 and would be maintained without ever having executed. The Phase 1 `D-20` precedent applies directly: demonstrate by hand in this phase, automate in the phase that owns the mechanism. The manual demonstration is a single host-compiler invocation over the shared sources, recorded verbatim in the plan's `SUMMARY.md`. A live, unretired risk is recorded rather than papered over: `platform = native` expects a system GCC and `/usr/bin/gcc` on this machine is an Apple clang shim, which Phase 5 must smoke-test before relying on it.

### Claude's Discretion

- **Where the language contract is written.** Decided: the **rule** ("`shared/lib/` is pure C; a homework is a thin C++ shim plus C logic") belongs in `shared/lib/README.md`, because that file already carries the binding library conventions and currently promises that "the binding library layout, HAL seam and testing rules arrive with Phase 3". The **measured numbers** (`gnu99`, `gnu++11`) belong in `shared/pio/VERSIONS.md` beside the platform pin, following `D-09` of Phase 2 — the pin and the resolved set are read from the same place.

### Folded Todos

- **`2026-10-17-parameterize-board-assumptions-beyond-the-n16r8-module`** (severity: major) — folded into this phase **in part**, by owner decision during discussion. The todo's premise is that every board fact is hard-coded to one physical board, and that `shared/hardware/` (Phase 4, `HW-02`) should be built parameterized while it is still empty. Its **library-contract half lands here**: the seam introduced by this phase must not assume one board's console, and `emb_hal`'s console/time shape is deliberately board-neutral — it names no pin, no UART number and no bridge identity. Its **facts half stays in Phase 4**, which owns the pin database and the board profile. Recorded so that Phase 4 receives the parameterization constraint already honoured on the library side.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase definition and requirements
- `.planning/ROADMAP.md` § Phase 3 — the goal, the five success criteria, and criterion 5's one-level depth rule, which this phase is the first able to make observable
- `.planning/REQUIREMENTS.md` — `SHARED-01`…`SHARED-04`; the requirement→phase traceability table; § Out of Scope for `file://` and `lib_extra_dirs`
- `.planning/PROJECT.md` § Constraints ("shared code must not call Arduino APIs directly") and § Key Decisions ("`lib_deps = Name=symlink://…` instead of `lib_extra_dirs`"; "Host unit tests for pure logic"); § Traps for Later Phases — the `shared/lib/` singular obligation, the depth rule, the CH343 identity, the native-environment inheritance trap
- `.planning/STATE.md` — § Blockers/Concerns, where **D4 (C++ standard contract)** is assigned to this phase and where the `platform = native` / Apple clang risk is recorded unretired

### The seam, the language and the toolchain (measured 2026-10-17)
- `~/.platformio/packages/framework-arduinoespressif32/tools/platformio-build-esp32s3.py` § 44-45 (`CFLAGS = ["-std=gnu99", …]`), § 49-50 (`CXXFLAGS = ["-std=gnu++11", …]`) — the two standards this phase's contract is built on
- `~/.platformio/packages/framework-arduinoespressif32/cores/esp32/Arduino.h` § 149-150 — `setup()`/`loop()` declared without `extern "C"`, the reason the shim must stay C++
- `~/.platformio/packages/framework-arduinoespressif32/cores/esp32/main.cpp` § 42, 50 — the C++ translation unit that calls them
- `~/.platformio/packages/framework-arduinoespressif32/cores/esp32/esp32-hal-uart.h` § 18-19, 45-46 — `uartBegin()`, `uartWrite()`, `uartWriteBuf()` inside `extern "C"`, the C-callable console the backend needs
- `~/.platformio/packages/framework-arduinoespressif32/cores/esp32/esp32-hal.h` § 41, 137-139 — `millis()`, `micros()`, `delay()` inside `extern "C"`, the C-callable time the backend needs
- `~/.platformio/packages/framework-arduinoespressif32/cores/esp32/esp32-hal-gpio.h` § 23-24, 74-75, 86 — `pinMode()`, `digitalWrite()` inside `extern "C"`; recorded for the GPIO seam a later phase will add, **not** used here (D-06)

### Research — the library mechanism (dated 2026-10-15, treated as history)
- `.planning/research/ARCHITECTURE.md` § Pattern 1 (shared code as real PlatformIO libraries) and § the manifest trap at 344-346 — `srcDir`/`srcFilter`, and why a non-default layout silently drops translation units
- `.planning/research/FEATURES.md` § 20 — the verified transitive-dependency failure (`fatal error: emb_hal.h: No such file or directory`), one `lib_deps` line per library; § 240 — the `emb_hal` + `emb_hal_arduino` + `emb_log` module set this phase adopts
- `.planning/research/PITFALLS.md` § 129 (the C++ standard drift and the `c++17` metadata trap), § 135 and § 489 (state the standard next to the pin; Pitfall 7 mapped to Phase 3), § 166 and § 175 (a bare folder with no `library.json` is not a package; `name` and `version` are Required)
- `.planning/research/STACK.md` § 27 (`symlink://` semantics, `file://` copies and goes stale), § 117 and § 185 (the `-std=` guessing trap and its medium-confidence figures, now superseded by measurement)
- `.planning/research/SUMMARY.md` § 96-99 (why the seam and the standard precede the layer's growth), § 135 (D4 as stated), § 195 (kept-uncertain list, including `platform = native` with Apple clang)

### Carried forward from earlier phases (do not re-open)
- `.planning/phases/01-repository-skeleton-and-project-layout/01-CONTEXT.md` — `D-10` (the baseline is committed and becomes the acceptance vehicle), `D-11` (`shared/lib/` created, `shared/pio/` reserved for Phase 2), `D-14` (the baseline touches no GPIO), `D-16` (`envNames()` and project-scoped environment names), `D-20` (demonstrate by hand here, automate in the owning phase), `D-24` (**the folder is `shared/lib/`, singular**)
- `.planning/phases/02-board-and-environment-baseline-n16r8-acceptance-gate/02-CONTEXT.md` — `D-06`/`D-07` (the fragment owns the `[env]` defaults layer and the console ports), `D-09` (resolved versions are recorded beside the pin), and the CR-01 correction: an inherited key can be overwritten but never unset, which is why `board` and `framework` stay in the project
- `shared/lib/README.md` — the in-tree statement of the frozen naming and of `symlink://`; it currently promises that "the binding library layout, HAL seam and testing rules arrive with Phase 3", which is this phase
- `shared/pio/VERSIONS.md` — the resolved platform / framework / toolchain record; `D-04`'s measured standards are written beside it

### Repository artifacts this phase changes or must not contradict
- `homeworks/project-baseline/platformio.ini` — gains the `lib_deps` lines; already consumes `extra_configs = ../../shared/pio/base.ini`. Environment name comes from `envNames()`, never spelled by hand
- `homeworks/project-baseline/src/main.cpp` — the acceptance vehicle; stays GPIO-free and now prints through `emb_log`
- `homeworks/project-baseline/README.md` and `README.md` — the reader-facing statements that must name the shared-library mechanism
- `tools/lib/discover.mjs` — `envNames()` (D-16), the derivation rule for environment names
- `tools/sweep-homeworks.mjs` — globs `homeworks/*/platformio.ini` only, one level deep, and fails loudly on zero matches; `shared/lib/` sits outside that glob, which is correct
- `tools/tests/env-baseline.test.mjs` and `tools/tests/helpers.mjs` — the established pure-filesystem test idiom (`sections()` ini reading, fixtures under `os.tmpdir()`, no child processes) that a seam-check test should follow
- `tools/generate-workspace.mjs` — the generate → drift-check idiom, available as a template

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`tools/lib/discover.mjs` → `envNames()`** — derives `{s3, native}` names from a folder id mechanically (hyphens stripped, suffix appended). Any environment this phase touches must be named through it, never spelled by hand.
- **`tools/tests/helpers.mjs`** — `makeTree()`, `makeHomework()`, `writeFileAt()`, `installTools()`, `makeFragmentConsumer()`, `cleanupAll()`. The fragment-consumer fixture is the exact shape a shared-library fixture needs: it plants a consumer and its dependency under `os.tmpdir()`, with options (`wrongPath`, `fragment: false`) that make the assertion **falsifiable** rather than merely passable. A seam-check test should reuse this idiom, including the falsifiability options.
- **`tools/tests/env-baseline.test.mjs` → `sections()`** — a dependency-free `.ini` reader that models PlatformIO's own `configparser(inline_comment_prefixes=("#", ";"))` behaviour, including the inline-comment rule. Reuse it rather than writing a second reader; it already notes its own limit (multi-line values read as empty, failing loudly rather than silently).
- **`homeworks/project-baseline/`** — the only consumer today, already committed, already carrying `.gitignore` and `.vscode/extensions.json`. This is the consumer that proves criteria 1, 2 and 5.
- **The scratch-probe pattern** (`/tmp/pio-n16r8-probe`, referenced by Phase 1's `D-12` and Phase 2's measurements) — a throwaway project **outside** the repository used to measure PlatformIO behaviour without dirtying the tree. Criterion 5's depth measurement is the same pattern: a copy of the baseline one level deeper, built from a path that cannot touch the repository.

### Established Patterns
- **Generate → drift check.** Nothing generated is hand-edited; a byte comparison decides currency. No new generated artifact is needed here, but the idiom is the template if one appears.
- **Fail loudly on zero matches.** A gate that checked nothing must never exit 0; the single escape hatch is a named flag, never a silent bypass. The seam check inherits this: if it scans `shared/lib` and finds no library at all, that must be loud, not green.
- **Exact version pins, never ranges, never `#develop`.** `platform = espressif32@7.1.3` in the fragment is the single enforcement point.
- **One canonical source per fact.** The language rule has one home (`shared/lib/README.md`), the measured standards have one home (`shared/pio/VERSIONS.md`), the frozen folder name has one home (`shared/lib/README.md` plus the PROJECT.md trap).
- **Evidence is verbatim, or the slot stays empty.** Command output is recorded exactly; an observation no agent could make gets an explicitly unfilled slot rather than a plausible invention.
- **Pure-filesystem tests, no child processes.** `env-baseline.test.mjs` states the reason: spawning `pio` would couple every task commit to a binary the repository cannot assume is resolvable. The seam check's own test should stay filesystem-only; the *builds* that prove criteria 1, 2 and 5 are taken once, by hand, and recorded in the summary.

### Integration Points
- `shared/lib/<name>/library.json` ↔ `lib_deps = <name>=symlink://../../shared/lib/<name>` ↔ the LDF — one manifest per library, one line per library in the consumer **including transitive ones**; the LDF does not follow an include that exists only inside another library.
- `emb_hal` ↔ `emb_hal_arduino` ↔ `homeworks/project-baseline/src/main.cpp` ↔ ROADMAP criterion 2 — the live-symlink edit is proven by changing `emb_log` and observing the changed output on the next build, with no reinstall.
- `shared/lib/` layout ↔ the seam check ↔ ROADMAP criterion 3 — the check is the structural guarantee that keeps `SHARED-03` true as the layer grows.
- The one-level depth rule ↔ `symlink://` path arithmetic ↔ ROADMAP criterion 5 — `symlink://` resolves against the **project directory**, so a homework moved one level deeper can no longer reach `shared/lib/`, and the failure arrives at library installation, before any translation unit is compiled.
- `shared/lib/README.md` ↔ `shared/pio/VERSIONS.md` ↔ `AGENTS.md` § "Measured on this machine" — three statements about the toolchain; `VERSIONS.md` is authoritative for the resolved set and any disagreement is a defect to fix, not to leave.
- PlatformIO Core is **not on the interactive PATH** (`~/.platformio/penv/bin/pio`); anything that shells out resolves the binary explicitly or prints the `export PATH="$HOME/.platformio/penv/bin:$PATH"` remedy.
- `lib_deps` in `platformio.ini` triggers PlatformIO's auto-clean of `build_dir` — a full rebuild after any edit to that file. Correct behaviour; do not "optimize" it.

</code_context>

<specifics>
## Specific Ideas

- **The console failure mode is silent, and the seam must not reintroduce it.** Phase 2 established that a socket/setting mismatch yields a successful flash and no output, while the ROM banner still appears on UART0. `emb_hal`'s console interface must therefore not silently swallow a write: the backend reports whether the underlying UART is ready, and the pure-logic module's behaviour on a not-ready sink is an explicit decision the planner records rather than an accident.
- **`gnu99` is the ceiling, not C11.** No `_Static_assert`, no `stdatomic.h`, no `_Generic` niceties beyond what GCC 8.4 accepts. State it so nobody writes C11 and is surprised by a compile error the toolchain explains badly.
- **`extern "C"` guards are mandatory on every public C header** reachable from the C++ shim. The failure mode when they are forgotten is a linker error naming a mangled symbol, which points at the symbol rather than at the missing guard. This belongs in the library template and in `shared/lib/README.md`, not in a reader's memory.
- **`emb_hal_arduino` is the only directory allowed to see the framework**, and the seam check enforces exactly that. This is the one named exception in the phase, and it is written down rather than inferred (D-11).
- **The three-library set makes the transitive-dependency trap testable.** Each library needs its own `lib_deps` line in the consumer; a missing line fails at include time with `emb_hal.h: No such file or directory`, which names the header rather than the missing line — a confusing error worth catching in the phase's own acceptance evidence.
- **Criterion 5's measurement is the literal mechanism Phase 1 could only enforce by name.** The accepted override in `ROADMAP.md` Phase 1 records that a copy of the baseline one level deeper builds successfully (measured, exit 0) precisely because no `lib_deps` existed to fail. Once a `symlink://` dependency is declared, the same copy must fail at library installation. This phase retires that override with a measurement, and the `ROADMAP.md` note should be updated rather than left standing.
- **The `shared/lib/` folder name is singular and frozen.** A surviving `shared/libs/` reference in a dated research file is history, not instruction — `ARCHITECTURE.md` and `STACK.md` both still spell it plural, and they are deliberately left untouched as dated evidence, exactly as Phase 1's `D-24` decided.
- **Do not build `emb_hal_espidf` now.** It is the migration's first act, not this phase's; building it speculatively would be a guess about an API the course has not reached.

</specifics>

<deferred>
## Deferred Ideas

- **`emb_hal_espidf` and the GPIO seam.** The backend for the IDF era, and any interface that drives a pin, both wait. The GPIO interface waits on Phase 4's board facts (`HW-02`) so that no unverified pin is committed, and the IDF backend waits on the IDF era arriving.
- **The per-homework language decision.** Which language a *particular* homework is written in is Phase 7's, not this phase's: `AGENT-04`'s `new-homework` skill in `guide`/`auto` modes is where an ambiguous request must ask. Phase 3 fixes the default and the boundary; Phase 7 asks when the choice is genuinely open. `AGENT-05` independently forbids inventing unverified facts.
- **`[env:native]` and the host test suite** — Phase 5 (`VERIFY-01`). This phase states the rule and demonstrates host compilation by hand only (D-12).
- **`.clang-format`, `.clang-tidy`, cppcheck, and the editor's C/C++ standard keys** — Phase 5 (`VERIFY-04`, Phase 1's `D-21`). Note for that phase: with two standards in play, the editor needs both `C_Cpp.default.cStandard` and `C_Cpp.default.cppStandard` set, and `.h` files changed kind (C, not C++) in clang-format 20.
- **Wiring the seam check into pre-commit and CI** — Phase 6 (`VERIFY-02`). This phase delivers the script and its test; Phase 6 decides where it runs.
- **The `shared/hardware/` board profile parameterization** — the residue of the folded todo, and Phase 4's `HW-02`. Its constraint (the profile must be keyed by a board identifier, not hard-coded to the N16R8) is already honoured on the library side by `emb_hal`'s board-neutral console/time shape.
- **Retiring the Phase 1 depth-rule override in `ROADMAP.md`** — the mechanical edit that records criterion 5's literal mechanism becoming observable. Belongs with this phase's acceptance evidence, but is a documentation edit rather than a build.
- **A `README.md` for `shared/pio/`** — still not decided; it was left open in Phase 2 and nothing here changes that.
- **`[platformio] build_cache_dir`** — still deferred on Phase 2's stated condition ("once the repo has several homeworks"). Three shared libraries are not several homeworks.
- **No additional todos were reviewed** — `todo.match-phase 3` returned exactly one match, which was folded (see Folded Todos).

</deferred>

---

*Phase: 3-Shared Libraries and the Hardware Seam*
*Context gathered: 2026-10-17*
