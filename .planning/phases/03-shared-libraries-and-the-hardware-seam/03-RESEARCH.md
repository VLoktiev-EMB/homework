# Phase 3: Shared Libraries and the Hardware Seam - Research

**Researched:** 2026-10-17
**Domain:** PlatformIO Library Manager mechanics (`symlink://`), pure-C library layout, C-ABI HAL seam, repo-owned static seam check
**Confidence:** HIGH — every mechanism claim below was measured on this machine this session (PlatformIO Core 6.2.0, `espressif32@7.1.3`, Arduino core 2.0.17, GCC 8.4.0), and every source-level claim was read from the installed package source or the official docs

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** **`shared/lib/` is written in pure C.** Owner's rationale, stated in discussion: C compiles everywhere — STM32 included — so shared logic is not tied to the ESP32 or to a C++ toolchain. The choice is independently reinforced by the phase's own goal: ESP-IDF is a C framework, so a C-ABI seam is implementable from both Arduino (C++) and IDF (C) with no adapter layer, which is what `SHARED-03` means by "a backend swap rather than a rewrite". — **Reversibility:** costly — the language decides every module's ABI and every consumer's include site; switching later rewrites all shared modules and touches every call site.

- **D-02:** **A homework is a thin C++ shim plus C logic.** `src/main.cpp` stays C++ because the framework requires it, not by preference; everything below the shim is C. — Not a free choice: `cores/esp32/Arduino.h:149-150` declares `void setup(void);` and `void loop(void);` **without** `extern "C"`, so they carry C++ linkage, and `cores/esp32/main.cpp:42,50` — a C++ translation unit — is what calls them. There is no `main.c` in the core. A `.c` file defining `setup()` would emit an unmangled symbol while the core looks for `_Z5setupv`, failing at link with an error that names neither the rule nor the cause. Accepted side benefit: the shim forces logic out of the Arduino file, which is the same discipline `SHARED-03` asks of the shared layer.

- **D-03:** **The whole seam is reachable from C — measured, not assumed.** The ESP32 Arduino core 2.x is itself structured as a C layer under a thin C++ wrapper, so no part of this phase needs C++:
  - `cores/esp32/esp32-hal-gpio.h:23-24,74-75,86` — `pinMode()`, `digitalWrite()` inside `extern "C"`
  - `cores/esp32/esp32-hal-uart.h:18-19,45-46,109` — `uartBegin()`, `uartWrite()`, `uartWriteBuf()` inside `extern "C"`
  - `cores/esp32/esp32-hal.h:41,137-139` — `millis()`, `micros()`, `delay()`, `delayMicroseconds()` inside `extern "C"`
  Consequence: "shared is pure C" holds **completely**, backend included. The one exception this phase carries is not about language at all — it is about which directory may include framework headers (D-08).

- **D-04:** **The C++ standard contract (D4) is settled by measurement, and it shrinks.** `tools/platformio-build-esp32s3.py:44-45` sets `CFLAGS = ["-std=gnu99", …]` and `:49-50` sets `CXXFLAGS = ["-std=gnu++11", …]`. So the repository runs **two** standards, both imposed by the framework rather than guessed: `gnu99` for all of `shared/lib/`, `gnu++11` for the thin shim. This retires the open question in `STATE.md` and closes the MEDIUM-confidence gap left by `STACK.md:185` and `PITFALLS.md:129`. It also removes an entire failure class: the C++ drift (`gnu++11` → `gnu++2b` → `gnu++26`) no longer touches the shared layer at all, so "shared code must satisfy the intersection of every pinned env" stops being a moving target. **Record the ceiling explicitly**: `gnu99` has no `_Static_assert` and no `stdatomic.h`, so C11 must not be assumed.

- **D-05:** **Exactly one shared Arduino backend, at `shared/lib/emb_hal_arduino/`.** Choosing between "one shared backend" and "a backend inside every homework" turned on a fact the owner supplied: the Arduino→IDF transition is **temporal** — early homeworks are Arduino and stay Arduino, later ones are IDF, and the two rarely mix. Old homeworks therefore never migrate, which is fine because the pinned `espressif32@7.1.3` ships both frameworks at once (measured in Phase 2). So the seam is not for migrating homeworks at all; it is so that the **shared layer** survives the framework change, and so that a driver can be tested on the host in Phase 5. A per-homework backend would be written and tested once per homework instead of once. — **Reversibility:** costly — moving the backend into the homeworks later means editing every consumer's `lib_deps` and adding a source file to each.

- **D-06:** **The seam abstracts the console and time — not GPIO.** `emb_hal` exposes "write a line" and "how many milliseconds have elapsed"; `emb_log` writes through it, and the baseline prints its existing report through it. Rationale, in the owner's terms: no pin is touched, so Phase 1's `D-14` (the baseline is GPIO-free so it commits no unverified board fact) stays intact and board facts remain Phase 4's `HW-02`. Criterion 2 is still demonstrable — changing a line inside `emb_log` visibly changes what the firmware prints. A second reason this is not filler: logging is the single most reused facility in a coursework repository, and it is the module that carries across both framework eras. — **Reversibility:** reversible — adding a GPIO interface later is purely additive and would not disturb the console seam.

- **D-07:** **The seam is a console/time interface with one implementing backend per framework era.** `emb_hal_espidf` is deliberately **not** built in this phase; it arrives with the IDF era, and adding it is one new directory plus one line in the seam check's named list (D-09).

- **D-08:** **Three libraries: `emb_hal`, `emb_hal_arduino`, `emb_log`.** This is the research's own minimum-that-proves-the-loop set (`FEATURES.md:240`), and it exercises all three roles the seam needs — a framework-free interface, a framework-touching backend, and a pure-logic module — rather than proving the mechanism on a single library. It also makes the transitive-dependency trap real and therefore testable: the research records a verified failure (`FEATURES.md:20`, `fatal error: emb_hal.h: No such file or directory`) where the LDF does not follow an include that exists only inside another library, so **one `lib_deps` line is required per library, transitive ones included**. — **Reversibility:** reversible.

- **D-09:** **The standard PlatformIO library layout: `library.json` + `include/` + `src/`, and the backend carries no `include/`.** No `build` section anywhere in any manifest. `srcDir: "."` with a `srcFilter` — the shape `ARCHITECTURE.md:346` sketches — is the *fix for* the trap it names, not a virtue: a library whose sources are outside the default `src/` compiles its headers and silently drops its translation units, producing `undefined reference` errors that point away from the cause. The default layout is what the LDF expects, so the trap is avoided by construction rather than by a correctly written manifest. `emb_hal_arduino` having no `include/` is meaningful, not incidental: a backend must expose no public header, and the directory split makes that boundary structural instead of conventional. — **Reversibility:** reversible.

- **D-10:** **The check matches include *paths* exactly, never substrings, and closes a hole in the criterion as written.** ROADMAP criterion 3 names the patterns `Arduino.h`, `esp_*`, `driver/`, `freertos/`. Implemented literally, that list **misses `esp32-hal-*`** — the actual prefix of the ESP32 Arduino HAL headers, since they begin `esp32-`, not `esp_` — while a naive substring search for `Arduino` would **falsely flag `ArduinoJson.h`**, a third-party library and not a framework header. A gate that both leaks its target and cries wolf is exactly the failure this repository refuses. The implemented set is therefore: exact trailing-name match `Arduino.h`; prefix matches `esp_` **and** `esp32-hal-`; subpath matches `driver/` and `freertos/`. The divergence from the criterion's literal text is a deliberate, dated correction and must be recorded in `CONTEXT.md` and in `ROADMAP.md` beside the criterion, in the manner of Phase 1's accepted override. — **Reversibility:** reversible.

- **D-11:** **The exemption is a named list inside the check: `ALLOWED = ["emb_hal_arduino"]`.** Chosen against the owner's stated criterion that the option with **less friction** wins. Two alternatives were weighed and rejected on that criterion. Declaring `"frameworks": ["arduino"]` in `library.json` would require the check to parse every manifest — a new failure mode and a new dependency on a file format — and PlatformIO's field means "compatible with these frameworks", not "may include framework headers", so the exemption rule would degrade into an inference ("declares arduino but not espidf"). A directory-name pattern such as `emb_hal_*` would need no maintenance at all but would silently exempt any directory that happened to match — a hole wider than the one this phase is closing. The named list costs one line, corrected once in the project's life (when `emb_hal_espidf` appears), introduces no new machinery, is visible to a single `grep`, and keeps the exemption narrow and stated — the same posture as `--allow-empty` in Phase 1's `D-13`. — **Reversibility:** reversible.

- **D-12:** **Phase 3 states the rule and demonstrates host compilation by hand; the environment and the tests are Phase 5's.** None of this phase's five success criteria mentions a host test — the phrase "pure logic is testable on the host" in the phase goal is a rationale, not a criterion — while `[env:native]` is `VERIFY-01`, owned by Phase 5. Writing a test now would mean committing a file that cannot run until Phase 5 and would be maintained without ever having executed. The Phase 1 `D-20` precedent applies directly: demonstrate by hand in this phase, automate in the phase that owns the mechanism. The manual demonstration is a single host-compiler invocation over the shared sources, recorded verbatim in the plan's `SUMMARY.md`. A live, unretired risk is recorded rather than papered over: `platform = native` expects a system GCC and `/usr/bin/gcc` on this machine is an Apple clang shim, which Phase 5 must smoke-test before relying on it.

### Claude's Discretion

- **Where the language contract is written.** Decided: the **rule** ("`shared/lib/` is pure C; a homework is a thin C++ shim plus C logic") belongs in `shared/lib/README.md`, because that file already carries the binding library conventions and currently promises that "the binding library layout, HAL seam and testing rules arrive with Phase 3". The **measured numbers** (`gnu99`, `gnu++11`) belong in `shared/pio/VERSIONS.md` beside the platform pin, following `D-09` of Phase 2 — the pin and the resolved set are read from the same place.

### Deferred Ideas (OUT OF SCOPE)

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
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SHARED-01 | `shared/lib/<module>/` holds one real PlatformIO library per module, each with a `library.json` carrying name and version | Library layout and manifest contract measured (Standard Stack, Pattern 1). Manifest-name list read from `meta.py:44-48`; missing-manifest error measured. `version` is NOT mechanism-enforced — see Pitfall 2 and Open Question 2 |
| SHARED-02 | Homework projects consume them through `lib_deps = <name>=symlink://../../shared/lib/<name>` — one line per library, including transitive ones | Resolution semantics measured end-to-end; `.pio-link` mechanism read from `_symlink.py:50-62`; live-edit propagation measured; transitive failure reproduced and a measured alternative found (Pattern 2, Pattern 3, Open Question 3) |
| SHARED-03 | Shared code contains no Arduino or ESP-IDF includes; hardware is reached only through a narrow HAL interface | Seam demonstrated by measurement: `emb_hal_arduino` is the only unit that sees the framework and it fails to compile on the host (`Pattern 4`); the whole seam is C-reachable via `esp32-hal-uart.h`/`esp32-hal.h` (Pattern 5) |
| SHARED-04 | A check fails the commit if a framework include appears under `shared/lib`, keeping the seam real as the repository grows | Seam-check prototype written and falsified against all four pattern classes (Pattern 6); zero-match and allow-list behaviour specified |
</phase_requirements>

## Summary

The phase's five criteria are all mechanically achievable and four of them were rehearsed end-to-end on a fixture that mirrors the committed layout. Three findings change what the planner must write, and one of them contradicts the recorded wording of a criterion.

**`symlink://` creates no symlink.** `PackageManagerSymlinkMixin.install_symlink` (`platformio/package/manager/_symlink.py:50-62`) checks `os.path.isdir(spec.uri[10:])` and then writes a JSON pointer `<store>/<spec.name>.pio-link` containing `{"cwd": os.getcwd(), "spec": {...}}`. `.pio/libdeps/<env>/` therefore holds `integrity.dat` plus one `.pio-link` per dependency and **no directory, no copy and no filesystem symlink** — measured: `find .pio/libdeps -type l` returns nothing. Shared sources are compiled in place, and the object lands in the consumer's own `.pio/build/<env>/lib<hhh>/<lib>/`.

**Editing a shared source propagates live.** Measured on the mirror fixture: editing `shared/lib/emb_log/src/emb_log.c` recompiled exactly one translation unit (`Compiling .pio/build/projectbaseline_s3/libe14/emb_log/emb_log.c.o`), relinked, and the new string was present in `firmware.bin` while the old was absent. The `.pio-link` mtimes were unchanged and no install line was printed — no reinstall, no stale copy. This is criterion 2's verbatim evidence.

**Criterion 5's stated failure is not what happens on the committed tree.** The baseline consumes `extra_configs = ../../shared/pio/base.ini`, and that path is *also* project-relative. A copy of the project one level deeper therefore loses `platform` before the Library Manager ever runs, and fails with `UndefinedEnvPlatformError: Please specify platform for 'projectbaseline_s3' environment` — a different error, at a different phase, naming a different cause. The literal `PackageException: Can not create a symbolic link for ... not a directory` only appears once the fragment path is corrected to depth 3 while `lib_deps` is left at depth 2. Both arms were measured; the planner must carry both, and the `ROADMAP.md` note must record the divergence rather than assert the simpler story. This is the single highest-value thing in this document.

**A measured alternative to per-consumer transitive `lib_deps` exists.** A shared library's own `library.json` `dependencies` map is honoured by the package manager: with `probe_log` declaring `"dependencies": {"probe_hal": "symlink://../../shared/lib/probe_hal"}` and only one `lib_deps` line in the consumer, `probe_hal` was auto-installed and the include resolved (the build advanced to link). A/B measured: without the field, `fatal error: probe_hal.h: No such file or directory`; with it, compile succeeds. The cost is that a *project-relative* path then lives inside the shared library, so the library is no longer consumer-independent. CONTEXT's D-08 already chose the per-consumer `lib_deps` line; this finding is recorded so the choice is made with the alternative visible, not in ignorance of it.

**Primary recommendation:** Build the three libraries exactly as D-08/D-09 specify (default `include/`+`src/` layout, no `build` section, backend with no `include/`), declare `lib_deps` on **one line, comma-separated**, in the consumer, and discharge criterion 5 with a two-arm fixture rather than a naive deeper copy — because the naive copy exhibits the wrong failure.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Framework-free console/time interface (`emb_hal`) | Shared library — pure C, framework-unaware | — | The interface is the seam; it must compile on the host with no framework headers, so it owns nothing but a C ABI |
| Console/time implementation (`emb_hal_arduino`) | Shared library — framework-touching backend | — | Exactly one directory in `shared/lib/` is allowed to see `esp32-hal-*`; the seam check enforces it (D-08/D-11) |
| Pure logic / formatting (`emb_log`) | Shared library — pure C | — | Depends on `emb_hal` only; this is the unit Phase 5 will host-test |
| Dependency resolution | Build system (PlatformIO Library Manager) | Consumer `platformio.ini` | The manager owns pointer creation, staleness and uninstall; the consumer owns only the declarative line |
| Live-edit propagation | Build system (SCons dependency scan) | — | Measured: the shared `.c` is a real prerequisite of the consumer's object, so mtime drives rebuild — no reinstall machinery involved |
| Seam enforcement | Repo tooling (`tools/`) | — | A pure-filesystem scan; belongs beside `sweep-homeworks.mjs`, wired into hooks only in Phase 6 |
| Application entry point (`setup`/`loop`) | Homework project, C++ shim | — | Framework-mandated: `Arduino.h:149-150` declares them without `extern "C"`, so a `.c` definition would emit `setup` where the core links `_Z5setupv` |
| GPIO, board facts, pins | *Out of scope this phase* | Phase 4 (`HW-02`) | No pin is touched; `emb_hal` names no pin, no UART number and no bridge identity |

## Standard Stack

### Core

| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| PlatformIO Core | `6.2.0` at `~/.platformio/penv/bin/pio` [VERIFIED: `pio --version`, run this session] | Library Manager, builder, `pkg list`, `project config` | Already the repository's build system; `-d/--project-dir` is the whole multi-project story |
| `platformio/espressif32` | `7.1.3` [VERIFIED: `shared/pio/base.ini` and every build banner this session] | Supplies the board definition, framework packages and toolchains | The repository's single enforcement point; unchanged by this phase |
| `framework-arduinoespressif32` | `4.20017.260907+sha.dcc1105b` (Arduino core 2.0.17 on ESP-IDF 4.4.7) [VERIFIED: build banner, this session] | The framework the shim and the backend compile against | Pinned by the platform; unchanged |
| C standard for `shared/lib/` | `-std=gnu99` | Every `.c` in `shared/lib/` | Imposed by the framework: `platformio-build-esp32s3.py:45` — `"-std=gnu99",` [VERIFIED: read this session] |
| C++ standard for the shim | `-std=gnu++11` | `homeworks/*/src/main.cpp` only | Imposed by the framework: `platformio-build-esp32s3.py:50` — `"-std=gnu++11",` [VERIFIED: read this session] |
| Test runner (repo tooling) | `node:test` on Node `v26.7.0` | The seam check's own test | The repository's established runner — `node --test "tools/**/*.test.mjs"`, no `package.json`, no dependency (`01-01-PLAN.md:247`) |

### Supporting

| Component | Version | Purpose | When to Use |
|-----------|---------|---------|-------------|
| `esp32-hal-uart.h` | shipped in core 2.0.17 | The C-callable console the backend uses | The backend's `init`/`write` — **not** `Serial`, which is a C++ object (see Pitfall 1) |
| `esp32-hal.h` | shipped in core 2.0.17 | `millis()`, `micros()`, `delay()` inside `extern "C"` | The backend's time source |
| `tools/tests/helpers.mjs` | in-repo | `makeTree()`, `writeFileAt()`, `installTools()`, `cleanupAll()` | The seam check's test should reuse this idiom, including its `wrongPath`/`fragment:false` falsifiability options |
| `sections()` from `tools/tests/env-baseline.test.mjs:52-77` | in-repo | Dependency-free `.ini` reader | Only if `lib_deps` is written single-line — see Pitfall 5 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Per-consumer `lib_deps` line for each transitive library (D-08) | `"dependencies"` map inside the shared library's `library.json` | **Measured to work.** Removes N-1 duplicated lines and one whole failure class. Cost: the dependency path resolves against the *consumer's* project directory, so the shared library embeds an assumption about the consumer's depth — it stops being consumer-independent. Also untested here against a registry-spec sibling. See Open Question 3 |
| `lib_deps` on one comma-separated line | `lib_deps` on one entry per line (the docs' form) | Both measured working and order-preserving. The multi-line form is mis-read by the repo's own `sections()` reader (Pitfall 5); the single-line form is read correctly but is less readable in the diff |
| `symlink://` | `file://` | `file://` **copies** and never refreshes — docs: "Making changes in the source folder **WILL NOT** affect the installed package" [CITED: docs.platformio.org/core/userguide/pkg/cmd_install]. Already excluded by REQUIREMENTS.md § Out of Scope |
| A repo-owned seam check | `"frameworks": ["arduino"]` in `library.json` + LDF `strict` compat mode | Rejected by D-11. Note separately: declaring `"frameworks": ["arduino"]` on `emb_hal_arduino` is *semantically correct* and worth adding as a plain declaration — measured harmless under the Arduino build — but it is not an exemption mechanism |

**Installation:** none. This phase installs nothing. All three libraries are in-repo; the only external tools are already present.

## Package Legitimacy Audit

This phase installs **no external packages**. Its three libraries are in-repo directories consumed by path, and its only runtime dependency is `node:test`, which ships with Node 26.7.0. The Package Legitimacy Gate is therefore not triggered, and no `npm view` / `pip index` / `cargo search` verification applies.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| *(none — no external package is added by this phase)* | — | — | — | — | — | — |

**Packages removed due to `[SLOP]` verdict:** none.
**Packages flagged as suspicious `[SUS]`:** none.

## Architecture Patterns

### System Architecture Diagram

```
  homeworks/project-baseline/platformio.ini
      │
      ├── [platformio] extra_configs = ../../shared/pio/base.ini
      │        │
      │        └──► PlatformIO merges the fragment's bare [env] block
      │             INTO every [env:<name>] of this project
      │             (paths globbed against the PROJECT DIR)
      │
      └── [env:projectbaseline_s3] lib_deps = <name>=symlink://../../shared/lib/<name> ×3
               │
               ▼
      ┌──────────────────────── Library Manager: install phase ────────────────────────┐
      │  install_symlink(spec):                                                          │
      │    pkg_dir = spec.uri[10:]        (the raw "..\..\shared\lib\X" string)           │
      │    isdir(pkg_dir) relative to os.getcwd() == the PROJECT DIR  ──✗──► PackageException
      │    write <store>/<spec.name>.pio-link  ("cwd": <project dir>, "spec": {...})     │
      └──────────────────────────────────┬──────────────────────────────────────────────┘
                                         │  (no symlink, no copy — a pointer only)
                                         ▼
      ┌──────────────────────── Builder: compile phase ─────────────────────────────────┐
      │  LDF (chain, soft) parses the PROJECT's sources                                   │
      │    main.cpp ─ #include "emb_log.h" ─► emb_log  (include/ on the -I path)          │
      │    main.cpp ─ #include "emb_hal.h" ─► emb_hal                                      
      │    (chain does NOT parse emb_log.c → emb_hal.h must be declared separately)      │
      │                                                                                   │
      │  each library's src/*.c compiles IN PLACE ─► .pio/build/<env>/lib<hhh>/<lib>/*.o   │
      │    emb_hal_arduino.c ── the ONLY TU in shared/lib that may include esp32-hal-*   │
      └──────────────────────────────────┬──────────────────────────────────────────────┘
                                         ▼
                          firmware.elf ──► firmware.bin

  ── out-of-band, pure filesystem ─────────────────────────────────────────────────────────
  tools/check-hal-seam.mjs ──scan──► shared/lib/**  ──► names each framework include, exit 1
                                        (skips the one named backend)
```

### Recommended Project Structure

```
shared/lib/
├── README.md                 # the language contract lives here (the rule)
├── emb_hal/                  # framework-free C interface — include/ only, no src/
│   ├── library.json          # { "name": "emb_hal", "version": "0.1.0" }
│   └── include/emb_hal.h     # extern "C" guarded; bool ready, init, write_line, millis
├── emb_hal_arduino/          # the ONE framework-touching backend — src/ only, NO include/
│   ├── library.json          # { "name": "emb_hal_arduino", "version": "0.1.0", "frameworks": ["arduino"] }
│   └── src/emb_hal_arduino.c # includes <esp32-hal-uart.h> and <esp32-hal.h>
└── emb_log/                  # pure C logic — depends on emb_hal
    ├── library.json          # { "name": "emb_log", "version": "0.1.0" }
    ├── include/emb_log.h
    └── src/emb_log.c
tools/
├── check-hal-seam.mjs        # the seam check (pure filesystem, exit 1 on a hit)
└── tests/check-hal-seam.test.mjs
```

### Pattern 1: A shared library is `library.json` + `include/` + `src/`, and nothing else

**What:** The default PlatformIO layout. `include/` is what the LDF puts on the compiler's `-I` path; `src/` is what gets compiled.
**When to use:** Every library under `shared/lib/`, without exception.
**Why:** Measured — an interface-only library with `include/` and *no* `src/` at all installs and resolves (it simply contributes zero objects). A backend with `src/` and *no* `include/` likewise installs, and structurally cannot leak a public header. Both directions were measured this session. The trap D-09 names is the opposite layout — sources outside `src/` — which compiles headers and silently drops translation units.

```json
// shared/lib/emb_hal/library.json  — Source: measured shape, this session
{ "name": "emb_hal", "version": "0.1.0" }
```

### Pattern 2: The consumer declares one `lib_deps` line per library it needs, on ONE comma-separated line

**What:** `lib_deps = emb_hal=symlink://../../shared/lib/emb_hal, emb_hal_arduino=symlink://../../shared/lib/emb_hal_arduino, emb_log=symlink://../../shared/lib/emb_log`
**When to use:** Every homework project.
**Why:** Measured — PlatformIO accepts the comma form, preserves order, and installs all three (`Library Manager: emb_hal@0.1.0 has been installed!` … in declaration order). It also survives the repository's own `sections()` reader, which the multi-line form does not (Pitfall 5). `pio project config` normalizes either form to one entry per line in its output.

### Pattern 3: The transitive dependency is a compile-time failure, and its message names the header

**What:** With `lib_ldf_mode` at its default `chain`, the LDF does not parse a library's own `.c`/`.cpp`. An include that exists only inside another library fails at compile.
**When to use:** Always budget one line per library. The error will appear in the shared library's own file, not only in the consumer's.
**Measured, verbatim:**

```
/…/shared/lib/probe_log/src/probe_log.c:2:10: fatal error: probe_hal.h: No such file or directory
*** [.pio/build/probebaseline_s3/libdde/probe_log/probe_log.c.o] Error 1
src/main.cpp:3:10: fatal error: probe_hal.h: No such file or directory
```

plus PlatformIO's registry-search banner ("Looking for probe_hal.h dependency? Check our library registry!"). The docs describe the same mechanism as LDF Case 2. [CITED: docs.platformio.org/librarymanager/ldf — "In this case, LDF will not find the `Bar` library because it doesn't know about the CPP file"]

### Pattern 4: The backend is the only unit that cannot compile on the host

**What:** `emb_hal_arduino` is the seam's far side. Its failure to compile without the framework is the proof that the seam is real.
**Measured, verbatim:**

```
$ clang -std=gnu99 -c shared/lib/emb_hal_arduino/src/emb_hal_arduino.c -o /dev/null
shared/lib/emb_hal_arduino/src/emb_hal_arduino.c:1:10: fatal error: 'esp32-hal-uart.h' file not found
```

### Pattern 5: The seam is reachable from C — but not through `Serial`

**What:** `uartBegin`, `uartWrite`, `uartWriteBuf`, `millis` are all inside `extern "C"` and callable from a `.c` file. `Serial` is not: it is a C++ object, and `#include <Arduino.h>` compiles as C while leaving `Serial` undeclared.
**Measured, verbatim:**

```
shared/lib/probe_hal_arduino/src/probe_hal_arduino.c:3:47: error: 'Serial' undeclared (first use in this function); did you mean 'erfcl'?
 void probe_hal_write_line(const char *line) { Serial.println(line); }
```

The C route works:

```c
// Source: signature read from cores/esp32/esp32-hal-uart.h:33 (this session)
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

Also measured: `SERIAL` is a macro in `Arduino.h`, **not** in `esp32-hal-uart.h`, so a backend that avoids `Arduino.h` must pass `0` (or its own named constant) as the UART number.

### Pattern 6: The seam check scans include *paths*, never substrings

**What:** A pure-filesystem walk of `shared/lib/`, skipping the one named backend, that reports each framework include with file and line and exits non-zero.
**Falsified this session against every class:** a planted `<Arduino.h>` in `emb_log` was named and exited 1; a planted `<esp32-hal-gpio.h>` (the pattern the roadmap's literal `esp_*` misses) was named; planted `<freertos/FreeRTOS.h>` and `<driver/gpio.h>` were named; `<ArduinoJson.h>` in a third-party library was **not** flagged, and the mechanical reason is direct: `"ArduinoJson.h".startsWith("Arduino.h")` is false while `"ArduinoJson.h".includes("Arduino")` is true.

```js
// Source: prototype written and falsified this session
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

**Zero-match rule (inherited from the repo's own pattern):** if `shared/lib` contains no library directory at all, the check must exit non-zero with a named message rather than pass — the repository's "fail loudly on zero matches" convention. This is not hypothetical: it is the state of the tree *before* this phase writes the libraries, so the check's first execution must already behave correctly.

**Where it belongs:** `tools/check-hal-seam.mjs`, beside `sweep-homeworks.mjs` and `generate-workspace.mjs`, so Phase 6 can wire it into pre-commit without moving it. Its test goes at `tools/tests/check-hal-seam.test.mjs` and is picked up by the existing `node --test "tools/**/*.test.mjs"` glob.

### Anti-Patterns to Avoid

- **Building the seam check on a substring search.** It leaks `esp32-hal-*` and cries wolf on `ArduinoJson.h` — both demonstrated. Match the include path.
- **Writing the backend in C++ "just for `Serial`".** `Serial` is a C++ object; reaching it costs the whole pure-C contract. Use `uartBegin`/`uartWriteBuf`.
- **Putting a `build` section (`srcDir`/`srcFilter`) in any manifest.** D-09's default layout is what the LDF expects; a custom `srcDir` is the *cause* of the trap it would be added to fix.
- **Putting `lib_deps` with project-relative paths in `shared/pio/base.ini`.** It *works* — measured; the path resolves against the project directory even when declared two directories away — which is exactly why it is tempting. But it would give every homework all three libraries whether or not it uses them, and it hides the consumer's dependency list from `grep`. D-08 chose per-consumer declaration.
- **Reading `lib_deps` with the existing `sections()` helper.** See Pitfall 5.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Finding which files to scan for framework includes | A recursive shell `find`/`grep` pipeline | A Node walk reusing `tools/` conventions | The repo's test idiom is pure-filesystem Node; a shell pipeline needs its own zero-match guard, which is the Phase 1 D-13 bug class |
| `.ini` parsing for a test | A second ini reader | `sections()` at `tools/tests/env-baseline.test.mjs:52-77` — but only for single-line values | It already models PlatformIO's `inline_comment_prefixes=("#", ";")`; a second reader would drift |
| Library discovery / install | Any script that touches `.pio/libdeps` | PlatformIO's Library Manager | `.pio-link` files are PlatformIO's private format; hand-editing them desynchronizes `integrity.dat` |
| Test running | A shell script or a `package.json` | `node --test "tools/**/*.test.mjs"` | Installing nothing is the established rule (`01-01-PLAN.md:247`) |
| A host test framework | Anything now | Nothing — D-12 defers this to Phase 5 | Committing a test that cannot run yet is a file maintained without ever executing |

**Key insight:** every mechanism this phase needs already exists and is already vendored. The phase's work is *declaring* three libraries and *measuring* that the declared mechanism behaves as documented — not building machinery. The one new artifact, the seam check, is a ~40-line pure-filesystem script whose only subtlety is matching include paths rather than substrings.

## Runtime State Inventory

> The phase is a structural migration of `shared/lib/` from a placeholder to three libraries, and it edits an existing consumer. The canonical question applies: after every file in the repo is updated, what runtime systems still hold the old state?

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | None — the repository has no database, cache store or datastore. Verified: no `.sqlite`, no service, no state directory in the tree | None |
| **Live service config** | None — no external service, dashboard, workflow engine or tunnel references anything this phase renames | None |
| **OS-registered state** | None — no launchd plist, no systemd unit, no Task Scheduler entry, no pm2 process. Verified: nothing under `~/Library/LaunchAgents` is named for this repository | None |
| **Secrets / env vars** | None introduced. The phase adds no secret, no `.env` key and no CI variable. `.gitignore` already covers `.pio/` | None |
| **Build artifacts** | **`homeworks/project-baseline/.pio/libdeps/<env>/*.pio-link`** — three JSON pointers, each recording `"cwd": "<absolute project dir>"` and the raw `"uri": "symlink://../../shared/lib/<name>"` [VERIFIED: read this session]. They are gitignored, machine-local, and **self-healing**: `uninstall_symlink` removes any pointer whose `spec.uri` no longer matches, and a changed URI was measured to remove the old pointer. `editing shared/lib` does **not** invalidate them (pointer mtimes unchanged across a live-edit rebuild) | None required — but note that a *moved* project leaves a pointer whose recorded `cwd` no longer exists; deleting `.pio/` is the remedy |
| **Build artifacts (cont.)** | **`homeworks/project-baseline/.pio/build/<env>/`** — objects, `.d` files and the ELF. Changing `platformio.ini` at all triggers a **full** rebuild (measured: the whole `FrameworkArduino` tree recompiled). Editing a shared library source does **not** — it recompiles exactly one TU | Expected; do not "optimize" it. CONTEXT already records this |
| **Build artifacts (cont.)** | `compile_commands.json`, `.vscode/c_cpp_properties.json`, `.vscode/launch.json` inside the baseline — already gitignored by the project's own `.gitignore` [VERIFIED: `homeworks/project-baseline/.gitignore`] | None |

**Nothing found in the first four categories is a claim of absence on my part** — each was checked against the repository tree and the machine's launch-agent directory this session.

## Common Pitfalls

### Pitfall 1: `Serial` is not reachable from a `.c` file

**What goes wrong:** The backend is written as `emb_hal_arduino.c` (D-01 requires C) and uses the obvious `Serial.println(line)`. `#include <Arduino.h>` parses fine as C, but `Serial` is a C++ object, so the compile fails with an undeclared-identifier error that suggests an unrelated libm function.
**Why it happens:** `Arduino.h` compiles under C — the parse succeeds — so the failure looks like a missing include rather than a language mismatch.
**How to avoid:** Reach the console through `esp32-hal-uart.h` (`uartBegin`/`uartWrite`/`uartWriteBuf`, inside `extern "C"`).
**Warning signs:** `error: 'Serial' undeclared (first use in this function); did you mean 'erfcl'?`

### Pitfall 2: A missing `version` fails silently, not loudly

**What goes wrong:** The manifest is written as `{"name": "emb_log"}` with no `version`. PlatformIO installs it anyway and reports `emb_log@0.0.0+20261017022453` — a **timestamp**, regenerated on every install, so the dependency graph is not reproducible and a diff of `pio pkg list` churns.
**Why it happens:** For a `symlink://` dependency the mechanism does not enforce `version`. `build_metadata` (`platformio/package/manager/base.py:200-219`) reads `version=manifest.get("version")` and then: `if not metadata.version: metadata.version = self.generate_rand_version()`, where `generate_rand_version` (`:196-198`) is `return datetime.now().strftime("0.0.0+%Y%m%d%H%M%S")`. [VERIFIED: source read this session] Measured: absent → `0.0.0+20261017022453`; `"v1"` → `0.0.0+v1`; `"1.0"` → `1.0.0`.
**How to avoid:** Treat "name **and** version" as a repository policy whose enforcement is the review, not the tool — and say so where the rule is written. `version` is a reproducibility declaration.
**Warning signs:** A version string containing a date-time; a `library.json` with one key.

### Pitfall 3: A name mismatch between the `lib_deps` key and the manifest produces two names for one library

**What goes wrong:** `lib_deps = totallywrongname=symlink://../../shared/lib/emb_log` installs a pointer **named** `totallywrongname.pio-link`, while `pio pkg list` and the Dependency Graph report the library as `probe_log` from the manifest. Measured both this session.
**Why it happens:** `_symlink.py:55-58` builds the pointer filename from `spec.name or basename(...)` — the LHS is a *storage-folder override*, which the docs state plainly: "You can override a package folder name in the Package Manager storage using the `<name>=` syntax." [CITED: docs.platformio.org/core/userguide/pkg/cmd_install] Meanwhile `base.py:208` overrides `metadata.name` with `spec.name` only when a custom name is present, and the LDF reads the manifest directly.
**How to avoid:** Keep the LHS and `library.json`'s `name` byte-identical. This is exactly the invariant criterion 1 states; it is worth an explicit assertion rather than a convention.
**Warning signs:** A `.pio-link` basename that does not equal the library name in `pio pkg list`.

### Pitfall 4: The deeper-copy failure is not the one the criterion describes

**What goes wrong:** Moving the baseline one level deeper is expected to fail at library installation with the `PackageException`. On the committed tree it instead fails earlier, at environment assembly, with `UndefinedEnvPlatformError: Please specify platform for 'projectbaseline_s3' environment` — because `extra_configs = ../../shared/pio/base.ini` is *also* project-relative and stops resolving first, taking `platform` with it.
**Why it happens:** Two project-relative paths exist, not one, and the config layer is evaluated before the Library Manager.
**How to avoid:** Discharge criterion 5 with a **two-arm** fixture. Arm A: the copy exactly as-is — record the `UndefinedEnvPlatformError` for what it is. Arm B: the same copy with the `extra_configs` path corrected to depth 3 and `lib_deps` left at depth 2 — that arm reproduces the literal mechanism, verbatim below. Record both, and update the `ROADMAP.md` note rather than asserting the simpler story. Both arms measured this session:

```
# arm A — unmodified deeper copy
UndefinedEnvPlatformError: Please specify platform for 'projectbaseline_s3' environment

# arm B — fragment path corrected to ../../../, lib_deps left at ../../
Library Manager: Installing symlink://../../shared/lib/emb_hal
PackageException: Can not create a symbolic link for `../../shared/lib/emb_hal`, not a directory
# exit 1, 0 object files compiled
```

**Warning signs:** A depth demonstration whose failure message names `platform` instead of a path.

### Pitfall 5: The repository's `sections()` reader silently mis-parses a multi-line `lib_deps`

**What goes wrong:** `sections()` (`tools/tests/env-baseline.test.mjs:52-77`) reads the `[env:..._s3]` block of a project whose `lib_deps` is written on multiple lines and returns `lib_deps => ""` **plus three phantom keys** named after the libraries. Measured this session by running the function verbatim:

```
"lib_deps" => ""
"probe_hal" => "symlink://../../shared/lib/probe_hal"
"probe_hal_arduino" => "symlink://../../shared/lib/probe_hal_arduino"
"probe_log" => "symlink://../../shared/lib/probe_log"
```

This is worse than the reader's own documented limit ("multi-line values read as empty"): it does not fail loudly, it produces a wrong map.
**Why it happens:** Each continuation line contains an `=` and is read as its own key.
**How to avoid:** Write `lib_deps` on one comma-separated line (Pattern 2), or extend `sections()` with a continuation-line rule before asserting on it. Do not write a test that assumes the current reader handles the multi-line form.
**Warning signs:** A test asserting `lib_deps === ""` passing for the wrong reason.

### Pitfall 6: PlatformIO telemetry reaches out during a build

**What goes wrong:** A build attempt contacts `collector.platformio.org:443`. In a sandboxed or offline context this is denied and surfaces as a network error in the build log, which reads like a build failure and is not one. Measured: denied, build continued and succeeded.
**Why it happens:** Core sends anonymous usage statistics.
**How to avoid:** Set `PLATFORMIO_SETTING_ENABLE_TELEMETRY=false` in any scripted build context. In CI it is worth setting explicitly rather than relying on the default.
**Warning signs:** `collector.platformio.org` in a failure log beside a successful build.

### Pitfall 7: `frameworks`-based exclusion is not the seam check

**What goes wrong:** Declaring `"frameworks": ["arduino"]` on `emb_hal_arduino` is mistaken for the thing that keeps the framework out of the other libraries. It does nothing of the sort — the LDF `soft` compatibility mode only excludes a library from an incompatible *build environment*; it says nothing about what a `#include` inside the library may name.
**Why it happens:** The field name reads like a boundary.
**How to avoid:** D-11 stands — the exemption is the check's named `ALLOWED` list. Adding `"frameworks": ["arduino"]` to the backend's manifest as a plain correctness declaration is worthwhile and was measured harmless under the Arduino build, but it must not be documented as the enforcement.
**Warning signs:** A seam story that mentions `library.json` fields.

## Code Examples

### The consumer line — one comma-separated `lib_deps`, measured working

```ini
; homeworks/project-baseline/platformio.ini — shape verified by build this session
[platformio]
extra_configs = ../../shared/pio/base.ini

[env:projectbaseline_s3]
board = esp32-s3-devkitc-1
framework = arduino
lib_deps = emb_hal=symlink://../../shared/lib/emb_hal, emb_hal_arduino=symlink://../../shared/lib/emb_hal_arduino, emb_log=symlink://../../shared/lib/emb_log
```

Measured acceptance, in the mirrored fixture with the real `shared/pio/base.ini`:

```
Library Manager: Installing symlink://../../shared/lib/emb_hal
Library Manager: emb_hal@0.1.0 has been installed!
Library Manager: Installing symlink://../../shared/lib/emb_hal_arduino
Library Manager: emb_hal_arduino@0.1.0 has been installed!
Library Manager: Installing symlink://../../shared/lib/emb_log
Library Manager: emb_log@0.1.0 has been installed!
Dependency Graph
|-- emb_hal @ 0.1.0
|-- emb_hal_arduino @ 0.1.0
|-- emb_log @ 0.1.0
Flash: [          ]   3.9% (used 258741 bytes from 6553600 bytes)
========================= [SUCCESS] Took 2.58 seconds =========================
```

The `6553600`-byte application partition is the proof that `base.ini`'s N16R8 overrides are still in effect while three `symlink://` libraries are consumed.

### The public C header — `extern "C"` guards are mandatory

```c
/* shared/lib/emb_hal/include/emb_hal.h */
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

Without the guard the C++ shim links against a mangled name and the linker error names the symbol, never the missing guard.

### The host-compilation demonstration (D-12, by hand, recorded verbatim in the plan summary)

Measured working this session — one `clang` invocation, one `-I` per library, no build system:

```
$ clang -std=gnu99 -Wall -Wextra -pedantic -Werror \
    -I shared/lib/emb_hal/include \
    -I shared/lib/emb_log/include \
    shared/lib/emb_log/src/emb_log.c <host-backend-and-main>.c -o hostdemo
$ ./hostdemo
REHEARSAL-MARKER flash=1234 t=0
```

Note the practical point: **there is no LDF on the host**, so the command carries the union of every shared library's `include/` directory. Omit one and the demonstration fails with a missing header, not a missing library — measured exactly that way first.

### A user-facing evidence command

`pio pkg list -d homeworks/project-baseline` prints, among the platform packages:

```
Libraries
├── emb_hal @ 0.1.0 (required: symlink://../../shared/lib/emb_hal)
├── emb_hal_arduino @ 0.1.0 (required: symlink://../../shared/lib/emb_hal_arduino)
└── emb_log @ 0.1.0 (required: symlink://../../shared/lib/emb_log)
```

This is the machine-readable project→shared-library mapping, and it echoes the `symlink://` spec verbatim. It is the natural input for Phase 6's "build every consumer of a changed shared library" mapping.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `lib_extra_dirs` | `lib_deps = <name>=symlink://<path>` | Deprecated since Core 6.0 | `lib_extra_dirs` still works in 6.2.0 — which is why the mistake survives; removal is slated for the next major |
| `file://` local dependency | `symlink://` local dependency | — | Docs, verbatim: `file://` — "Making changes in the source folder **WILL NOT** affect the installed package"; `symlink://` — "Making changes in the source folder **WILL** affect the installed package" [CITED: docs.platformio.org/core/userguide/pkg/cmd_install] |
| Reading the standard from `platform.txt` | Reading it from `tools/platformio-build-<board>.py` | — | The Arduino side gets its standard from the prebuilt core's build script, not from `platform.txt` — this is what made `STACK.md:185`'s figure MEDIUM until it was measured here |

**Deprecated/outdated:**
- **`lib_extra_dirs` / `globallib_dir`** — deprecated, slated for removal. Already excluded by REQUIREMENTS.md; the phase's criterion 4 grep must find no surviving reference.
- **The `0.0.0+<timestamp>` version synthesis** — not deprecated, but a silent-degradation path that the phase's policy exists to avoid.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `platform = native` with `/usr/bin/gcc` (an Apple clang shim, measured `Apple clang version 21.0.0`) will accept the shared sources — the host route was demonstrated with `clang`, not with `gcc` through PlatformIO's native platform | Pattern 4 / Environment Availability | Phase 5's host test environment may need a real GCC, a `CC`/`CXX` override, or `-stdlib`/`-std` adjustment. Already flagged in STATE.md; `D-12` deliberately leaves it to Phase 5 |
| A2 | `uartBegin(0, 115200, 0x800001c, -1, -1, 256, 256, false, 112)` drives UART0 in a way a monitor on the bridge will show — the fixture **built and linked** but was never run on hardware | Pattern 5 | If the console does not come up, criterion 2's evidence is still valid (it is a build/firmware-content measurement), but the module would not be usable as a real logger. No board is attached today, so this cannot be settled here |
| A3 | The three libraries should each carry a distinct `version` value rather than all `0.1.0` | Pitfall 2 | Cosmetic only for `symlink://` deps (no range resolution happens); a wrong choice costs nothing beyond a future edit |
| A4 | The seam check belongs at `tools/check-hal-seam.mjs` with its test at `tools/tests/check-hal-seam.test.mjs` | Pattern 6 | Phase 6 must move a file and update one path; low cost. CONTEXT's Integration Points already assume `tools/` |

## Open Questions

1. **Which failure discharges criterion 5 — the unmodified deeper copy, or the arm-B fixture?**
   - **What we know:** Arm A (unmodified) fails with `UndefinedEnvPlatformError: Please specify platform for 'projectbaseline_s3' environment`, exit 1, zero objects. Arm B (fragment path corrected to depth 3, `lib_deps` left at depth 2) fails with ``PackageException: Can not create a symbolic link for `../../shared/lib/emb_hal`, not a directory``, exit 1, zero objects. Arm C (both paths corrected to depth 3) **builds successfully**.
   - **What's unclear:** Whether the criterion's explanatory sentence ("the failure arrives at library installation, before any translation unit is compiled") is discharged by arm B alone, by arm A alone, or by both together.
   - **Recommendation:** Carry **both** arms as the measurement, with arm C as the control that proves the failure is path arithmetic rather than an inherent prohibition. Record the divergence in `ROADMAP.md` beside the criterion, in the established override style. This is the phase's highest-value correctness decision and it is the owner's to make.

2. **Is `version` enforced anywhere, or is the "Required fields" claim only a docs-level contract?**
   - **What we know:** Docs say the folder "must contain a manifest file with name and version properties" [CITED]. Measured, `version` is not enforced for a `symlink://` dep — it degrades silently to `0.0.0+<timestamp>` (`base.py:215-216`).
   - **What's unclear:** Whether `pio pkg pack` or registry publish would reject an absent version (never exercised here).
   - **Recommendation:** Keep the policy (name **and** version) and state in `shared/lib/README.md` that its enforcement is review, not the tool — so a later reader does not assume a gate that is not there. Optionally, the seam check or a sibling check can assert every `library.json` has both keys; that is a cheap addition and is falsifiable.

3. **Should the transitive dependency be declared per consumer, or in the library's own `library.json` `dependencies`?**
   - **What we know:** Both were A/B measured. Only-`lib_deps` without the transitive line → `fatal error: probe_hal.h: No such file or directory`. With `"dependencies": {"probe_hal": "symlink://../../shared/lib/probe_hal"}` in `probe_log`'s manifest and only the `probe_log` line in the consumer → `probe_hal` auto-installed and the include resolved. The dependency path is resolved against the consumer's project directory (a `file://../probe_hal` spec raised `FileNotFoundError: [Errno 2] No such file or directory: '../probe_hal'` against the raw relative string).
   - **What's unclear:** Whether a `dependencies` entry survives a consumer whose depth differs, and whether it interacts with a registry-spec sibling.
   - **Recommendation:** **D-08 stands** — per-consumer `lib_deps`, because it keeps the shared library consumer-independent and keeps the dependency visible to `grep` and to Phase 6's change-mapping. Record the alternative and its cost in `shared/lib/README.md` or the plan summary so the decision is traceable, rather than leaving a future reader to rediscover it as a "trick".

4. **Does `emb_hal` need a `src/` directory at all?**
   - **What we know:** An interface-only library with `include/` and no `src/` was measured to install and resolve correctly.
   - **What's unclear:** Nothing functional. It is a layout question: whether an absent `src/` reads as "interface" or as "incomplete".
   - **Recommendation:** Omit `src/` for `emb_hal_arduino`-style reasons — the directory's presence or absence should be meaningful. `emb_hal` has no implementation, so it needs no `src/`; `emb_hal_arduino` has no public API, so it needs no `include/`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| PlatformIO Core | Every build in this phase | ✓ | `6.2.0` at `~/.platformio/penv/bin/pio` — **not on the interactive PATH** | Use the absolute path, or `PATH="$HOME/.platformio/penv/bin:$PATH"` |
| `espressif32` platform | The `_s3` environment | ✓ | `7.1.3` (also a leftover `6.13.0`) | — |
| Arduino core | The `_s3` environment | ✓ | `4.20017.260907+sha.dcc1105b` (2.0.17 / IDF 4.4.7) | — |
| Xtensa toolchain | The `_s3` environment | ✓ | `toolchain-xtensa-esp32s3 @ 8.4.0+2021r2-patch5` | — |
| `native` platform | **Not this phase** (D-12) | ✓ installed | `1.2.1` | Phase 5 owns it |
| Host C compiler | The by-hand host demonstration | ✓ | `Apple clang version 21.0.0` at `/usr/bin/gcc` | `clang` directly — which is what the demonstration used |
| Node | The seam check and its test | ✓ | `v26.7.0` | — |
| Physical board | **Nothing in this phase** | ✗ | — | None needed — no criterion here is hardware-dependent |
| `clang-format`, `clang-tidy`, `cppcheck` | **Not this phase** (Phase 5) | ✗ | — | `uv 0.13.1` is present if a pinned binary is ever needed |
| `pre-commit` | **Not this phase** (Phase 6) | ✓ | `4.6.0` | — |
| `wokwi-cli` | **Not this phase** (Phase 4) | ✗ | — | — |
| Network to `registry.platformio.org` | First-time package resolution only | ✓ — and unnecessary: every package is already installed, so the phase builds offline | — | — |

**Missing dependencies with no fallback:** none. Every dependency this phase's criteria need is present.
**Missing dependencies with fallback:** none.

One environmental note that is not a missing dependency but is a live risk: builds attempt to contact `collector.platformio.org` for telemetry. In a sandboxed shell this is denied and the denial appears in the build log beside a successful build. Set `PLATFORMIO_SETTING_ENABLE_TELEMETRY=false` in scripted contexts.

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json`, so this section is included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `node:test` (built-in) on Node `v26.7.0` — no `package.json`, no dependency |
| Config file | none — `node --test` with a quoted glob |
| Quick run command | `node --test tools/tests/check-hal-seam.test.mjs` |
| Full suite command | `node --test "tools/**/*.test.mjs"` — the quoting is mandatory; an unquoted glob errors under zsh when it matches nothing (`01-01-PLAN.md:247`) |
| Existing suites | `discover`, `sweep`, `generate-workspace`, `ignore-rules`, `env-baseline` — all pure-filesystem, no child processes |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| SHARED-01 | Each `shared/lib/<name>/` carries a `library.json` with `name` and `version` | unit (fs) | `node --test tools/tests/check-hal-seam.test.mjs` (or a sibling manifest test) | ❌ Wave 0 |
| SHARED-01 | The set of library directories equals the expected three | unit (fs) | same | ❌ Wave 0 |
| SHARED-02 | The baseline's `lib_deps` declares exactly the three `symlink://` specs; each LHS equals its manifest `name` | unit (fs) | same — **requires the single-line comma form** (Pitfall 5) | ❌ Wave 0 |
| SHARED-02 | Editing a shared source changes the firmware | **manual, by hand** (D-12) | `pio run -d … && strings firmware.bin \| grep <marker>` — recorded verbatim in the plan `SUMMARY.md` | n/a — deliberately not automated |
| SHARED-03 | A planted framework include is named and exits non-zero | unit (fs) — spawned CLI, no `pio` | `node --test tools/tests/check-hal-seam.test.mjs` | ❌ Wave 0 |
| SHARED-03 | The allow-list skips exactly `emb_hal_arduino` and no other directory | unit (fs) | same, with a falsification arm that renames the backend | ❌ Wave 0 |
| SHARED-03 | Zero libraries under `shared/lib` exits non-zero with a named message | unit (fs) | same, with an empty fixture | ❌ Wave 0 |
| SHARED-04 | The repo-wide scan for `lib_extra_dirs`/`globallib_dir` is clean outside the dated research files | unit (fs) | grep command, or a test reusing `ignore-rules.test.mjs`'s idiom | ❌ Wave 0 |

**Deliberately manual:** the live-edit propagation (criterion 2) and the depth failure (criterion 5) are *build* observations. A test that spawned `pio` would couple every task commit to a binary the repository cannot assume is resolvable — the reason `env-baseline.test.mjs` states for staying filesystem-only. Both are taken once, by hand, and recorded.

### Sampling Rate

- **Per task commit:** `node --test tools/tests/check-hal-seam.test.mjs`
- **Per wave merge:** `node --test "tools/**/*.test.mjs"`
- **Phase gate:** full suite green, plus the hand-recorded build evidence, before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tools/tests/check-hal-seam.test.mjs` — covers SHARED-01, SHARED-02, SHARED-03, SHARED-04
- [ ] A fixture helper for a shared-library tree — `tools/tests/helpers.mjs` has `makeFragmentConsumer` but nothing that plants `shared/lib/<name>/`; extend it rather than forking the builder
- [ ] Framework install: none — `node:test` is built in

## Security Domain

`security_enforcement` is `true` and `security_asvs_level` is `1` in `.planning/config.json`, so this section is included. The phase's security surface is deliberately small: it adds no network surface, no authentication, no persistence and no user input path. The one non-trivial class is supply-chain-adjacent and repository-integrity-adjacent.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | The repository has no authentication surface |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | Yes | The seam check must parse untrusted *content* (any file under `shared/lib/`) into a decision. Mitigation: match the include path with a bounded regex, never `eval`, never a shell interpolation; treat every path as data |
| V6 Cryptography | No | Nothing in this phase hashes, signs or encrypts. `integrity.dat` in `.pio/libdeps` is PlatformIO's own and is gitignored |
| V7 Error Handling and Logging | Yes (minor) | The backend's console write must not silently swallow a not-ready sink — D-06's explicit decision. Surface it as a distinct state (`emb_hal_console_ready()`), not as a silent drop |
| V14 Configuration | Yes | `shared/pio/base.ini` is the single enforcement point for the platform pin and the N16R8 overrides; this phase must not fork or duplicate it (Phase 2 CR-01) |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| A symlinked dependency escaping the repository boundary — `symlink://../../..` outside the tree | Tampering / Elevation | The path is a reviewed literal in `platformio.ini`; D-16's project-scoped names and the one-level depth rule keep it an invariant. `_symlink.py` performs no containment check — measured: a wrong path is reported only as "not a directory" |
| A stale `.pio-link` pointer pointing at replaced content | Tampering | Measured self-healing: `uninstall_symlink` removes pointers whose `spec.uri` no longer matches, and the recorded `cwd` is validated on every resolve. `rm -rf .pio` remains the manual remedy |
| A framework include leaking into a framework-free module | Tampering (of the architectural invariant) | The seam check — this phase's whole SHARED-04 deliverable |
| A machine-local absolute path reaching a public history | Information Disclosure | `.pio-link` files are gitignored; no phase artifact may print an absolute toolchain path (Phase 2 already asserts this for `VERSIONS.md`) |
| Telemetry from a build host | Information Disclosure | `PLATFORMIO_SETTING_ENABLE_TELEMETRY=false` in scripted contexts; never commit a machine identifier |
| A malicious `library.json` `scripts.postinstall` in a shared library | Tampering | In-repo libraries are reviewed; the manifest schema constrains `scripts` keys to `postinstall`/`preuninstall` (`manifest/schema.py:171-175`), so the field is real and worth an explicit "no `scripts` in any shared manifest" rule |

## Project Constraints (from AGENTS.md)

The repository keeps its agent guide at `./AGENTS.md`; there is no `./CLAUDE.md` or `./.claude/CLAUDE.md` (verified this session), which is the documented requirement — a `CLAUDE.md` would switch `AGENTS.md` off for Claude Code. Directives from `AGENTS.md` that bind this phase:

- **Tech stack:** PlatformIO + ESP32-S3 + Arduino core (2.x) now, ESP-IDF later — **so shared code must not call Arduino APIs directly.** This is `SHARED-03`'s constraint, stated as a repo constraint.
- **Version discipline:** pin every tool and platform to an exact version; **never use ranges and never `#develop`**. Applies to any manifest field, not just `platform`.
- **Public repository:** every committed artifact is read by the instructor and possibly employers; commits must be clean and must never contain secrets. No machine-local path may reach a committed file.
- **Solo maintenance:** every added file and check is a cost; the design must stay small. This argues against a second ini reader, a second test runner, or a manifest parser in the seam check.
- **Language:** all repository artifacts — rules, docs, comments, commit messages — in **English**.
- **Board:** N16R8 — `board` definitions must be overridden; GPIO35/36/37 are unavailable. Not touched this phase (D-06), but the shared layer must not assume otherwise.
- **Wokwi budget:** 50 simulation-minutes per rolling 30 days; simulation must not be a per-commit gate. Not relevant here — this phase simulates nothing.
- **GSD workflow enforcement:** file-changing work must start through a GSD command; no direct repo edits outside a workflow.
- **Established repo idioms this phase must follow:** generate → drift check; fail loudly on zero matches (the single escape hatch is a named flag, never a silent bypass); exact version pins; one canonical source per fact; evidence is verbatim or the slot stays empty; pure-filesystem tests with no child processes.

## Sources

### Primary (HIGH confidence — measured or source-read this session)

- **Measured builds, 2026-10-17, PlatformIO Core 6.2.0 / `espressif32@7.1.3` / Arduino core 2.0.17 / GCC 8.4.0**, on throwaway fixtures outside the repository (`$TMPDIR/p3-probe`, `$TMPDIR/p3-rehearsal`):
  - three `symlink://` libraries installed and linked; `Flash: … from 6553600 bytes` proving `base.ini`'s overrides were in effect
  - `.pio/libdeps/<env>/` contains `integrity.dat` + one `<name>.pio-link` JSON; `find -type l` returns nothing
  - live edit of `shared/lib/emb_log/src/emb_log.c` → exactly one TU recompiled → new string in `firmware.bin`, old absent, pointer mtimes unchanged
  - depth failure: arm A `UndefinedEnvPlatformError`; arm B ``PackageException: Can not create a symbolic link for `../../shared/lib/emb_hal`, not a directory`` at `Library Manager: Installing`, exit 1, zero objects; arm C (both paths corrected) builds
  - transitive trap: `fatal error: probe_hal.h: No such file or directory`
  - `library.json` `dependencies` A/B: without → compile failure; with → auto-install and compile success
  - `library.json` without `version` → `probe_log@0.0.0+20261017022453`; `"v1"` → `0.0.0+v1`; `"1.0"` → `1.0.0`
  - LHS/manifest name mismatch → `totallywrongname.pio-link`, library reported as `probe_log`
  - missing manifest → `MissingPackageManifestError: Could not find one of 'library.json, library.properties, module.json' manifest files in the package`; no manifest written into `shared/lib/`
  - comma-separated single-line `lib_deps` accepted, order-preserved
  - fragment-relative vs project-relative discriminator: a fragment at `<root>/pio/frag.ini` carrying `../../shared/lib/X` still resolved project-relative; `.pio-link` `"cwd"` = the project dir
  - `Serial` unreachable from `.c`; `esp32-hal-uart.h` reachable and callable
  - host compile/link/run of the pure-C modules with `clang -std=gnu99 …` → `REHEARSAL-MARKER flash=1234 t=0`
  - `emb_hal_arduino.c` fails on the host: `'esp32-hal-uart.h' file not found`
  - seam-check prototype falsified against `Arduino.h`, `esp32-hal-gpio.h`, `freertos/`, `driver/`, and cleared on `ArduinoJson.h`
  - `sections()` verbatim against a multi-line `lib_deps` → `lib_deps => ""` plus three phantom keys
  - `pio pkg list` Libraries section; `pio project config` rendering
- **Source read this session:**
  - `~/.platformio/penv/lib/python3.13/site-packages/platformio/package/manager/_symlink.py:25-26, 34-36, 50-62` — verbatim: `pkg_dir = spec.uri[10:]`, ``f"Can not create a symbolic link for `{pkg_dir}`, not a directory"``, `"%s.pio-link" % (spec.name or os.path.basename(os.path.abspath(pkg_dir)))`, `json.dump(dict(cwd=os.getcwd(), spec=spec.as_dict()), fp)`
  - `…/platformio/package/manager/base.py:196-198` — `return datetime.now().strftime("0.0.0+%Y%m%d%H%M%S")`; `:208` — `if not metadata.name or spec.has_custom_name():`; `:215-216` — `if not metadata.version: metadata.version = self.generate_rand_version()`
  - `…/platformio/package/meta.py:44-48` — the LIBRARY manifest-name tuple
  - `…/platformio/package/exception.py:50` — `MESSAGE = "Could not find one of '{0}' manifest files in the package"`
  - `~/.platformio/packages/framework-arduinoespressif32/tools/platformio-build-esp32s3.py:45` — `"-std=gnu99",`; `:50` — `"-std=gnu++11",`
  - `…/cores/esp32/esp32-hal-uart.h:19` — `extern "C" {`; `:33` — `uart_t* uartBegin(uint8_t uart_nr, uint32_t baudrate, uint32_t config, int8_t rxPin, int8_t txPin, uint32_t rx_buffer_size, uint32_t tx_buffer_size, bool inverted, uint8_t rxfifo_full_thrhd);`; `:45-46` — `void uartWrite(uart_t* uart, uint8_t c);` / `void uartWriteBuf(uart_t* uart, const uint8_t * data, size_t len);`
- **In-repo read this session:** `shared/lib/README.md`, `shared/pio/base.ini`, `shared/pio/VERSIONS.md`, `homeworks/project-baseline/{platformio.ini,README.md,.gitignore,src/main.cpp}`, `tools/lib/discover.mjs`, `tools/tests/helpers.mjs`, `tools/tests/env-baseline.test.mjs:52-77`, `.planning/{config.json,REQUIREMENTS.md,STATE.md,ROADMAP.md,PROJECT.md}`, `.planning/phases/03-…/03-CONTEXT.md`

### Secondary (MEDIUM confidence — official documentation)

- `docs.platformio.org/core/userguide/pkg/cmd_install` — Local Folder table: `file://` "WILL NOT", `symlink://` "WILL affect the installed package"; "must contain a manifest file (`library.json`, `platform.json`, or `package.json`) with name and version properties"; the `<name>=` storage-name override
- `docs.platformio.org/librarymanager/ldf` — LDF modes and Case 2 (`chain` does not parse a library's own `.cpp`)
- `docs.platformio.org/projectconf/…/lib_ldf_mode` — default `chain`; `/lib_compat_mode` — default `soft`
- `docs.platformio.org/projectconf/…/lib_extra_dirs` — "Deprecated since version 6.0 … will be removed in the next major release"
- Retrieved via Context7 (`/platformio/platformio-docs`), cross-checked against the installed package source

### Tertiary (LOW confidence)

- None. Every claim above is either measured this session, read from installed source this session, or quoted from official documentation. Nothing rests on training knowledge alone.

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH — every version was read from a build banner or from the installed package source this session; the two `-std` flags come from the framework's own build script
- **Architecture (library layout, seam shape, check design):** HIGH — the three-library set, the `symlink://` mechanism, the live-edit propagation and the depth failure were each reproduced end-to-end on a fixture mirroring the committed layout
- **Pitfalls:** HIGH — seven of the eight were reproduced by command, including the two that contradict a recorded assumption (the criterion-5 failure mode and the `version` requirement)
- **The one genuinely open item:** the criterion-5 discharge choice (Open Question 1) is a decision for the owner, not a research gap

**Research date:** 2026-10-17
**Valid until:** 2026-11-16 (30 days) — the mechanism findings are stable for the pinned Core 6.2.0 / platform 7.1.3; any bump of either invalidates the `.pio-link` internals and should re-run the two-arm depth measurement
