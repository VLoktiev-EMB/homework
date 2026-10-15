# Project Research Summary

**Project:** homework — Embedded Coursework Repository
**Domain:** embedded coursework monorepo — ~60 self-contained PlatformIO/ESP32-S3 projects, one shared-library folder, two AI harnesses (Claude Code + Google Antigravity)
**Researched:** 2026-10-15
**Confidence:** MEDIUM overall — the toolchain/mechanics half is HIGH and measured on this machine; the course-facing half is unresolved (see Gaps)

## Executive Summary

This is a personal coursework repository: roughly 60 lessons at three per week, one self-contained PlatformIO project per homework under `homeworks/<module>-<lesson>-<slug>/`, plus a shared-library folder, all opened as one VS Code workspace and mostly written by AI agents under two harnesses. The research converges on a small set of mechanisms: keep every project self-contained and exactly one directory level below `homeworks/`, consume shared code as real PlatformIO libraries through `lib_deps = Name=symlink://../../shared/libs/Name` (never `lib_extra_dirs`, deprecated since Core 6.0), keep ONE canonical `diagram.json` per homework from which the README image, the pin table and the simulator all derive, keep shared code behind a hardware seam with no Arduino/ESP-IDF includes so host unit tests (`platform = native`) can prove pure logic for free, and run a five-layer verification ladder — L0 lint+build, L1 native host tests, L2 QEMU boot smoke, L3 Wokwi, L4 real hardware — in which L1 is the only layer that is simultaneously free, offline and behaviourally meaningful for most homeworks.

The recommended path is to adopt the carried-over decisions from the abandoned `vl/init` scaffold (its volume, not its mechanisms, was the problem) and to apply the corrections on the required path first: (1) N16R8 board overrides in every environment, (2) `symlink://` shared deps plus a `library.json` per module, (3) an exact platform pin with the resolved core recorded via `pio pkg list`. Everything else — CI build matrix, cross-project build cache, extra analyzers, clangd — is deferred until three or more homeworks exist. Week 0 must end with one recorded end-to-end acceptance run on hardware (build → flash → monitor → esptool banner → `psramFound()` → one native test → one hook dry run) before the first homework is scaffolded.

The dominant risk is that `board = esp32-s3-devkitc-1` describes the **N8** module (8 MB flash, no PSRAM) while the physical module is **N16R8** (16 MB quad flash, 8 MB octal PSRAM, GPIO35/36/37 consumed) — a wrong-by-default configuration on the required path, and nothing on `vl/init` has ever built, flashed, monitored or tested this hardware end-to-end. The second risk is not technical: the course-facing contract (are PlatformIO projects acceptable to the instructor, in what language is a grader-facing report expected, what AI disclosure does the course require, what may be red in a WIP push) is unanswered, and several of those answers can invalidate tooling choices this research already recommends.

## Key Findings

### Recommended Stack

Full detail: `STACK.md`. Every figure below was verified on 2026-10-15 and must carry that date.

**Core technologies:**
- **PlatformIO Core 6.2.0** (released 2026-09-05) — the single binary driving every project; measured at `~/.platformio/penv/bin/pio` and deliberately **not on the interactive PATH**, so hooks and scripts must address it explicitly or set `export PATH="$HOME/.platformio/penv/bin:$PATH"`.
- **`platformio/espressif32` pinned exactly at 7.1.3** (2026-09-11) — the official platform per the owner decision. It resolves to **Arduino core 2.0.17 on ESP-IDF 4.4.7** (installed `framework-arduinoespressif32 4.20017.260907+sha.dcc1105b`, compile line carries `-DIDF_VER="v4.4.7-dirty"`) and also ships `framework-espidf` 6.1.0 for the later migration on the same platform pin. The platform manifest declares the Arduino core as a `~4.20017.0` **range**, so the resolved core must be written into the repo after the first build (`pio pkg list -v`), or an old homework can silently link a different core.
- **N16R8 overrides in every env** — `board = esp32-s3-devkitc-1` plus `board_upload.flash_size = 16MB`, `board_build.partitions = default_16MB.csv`, `board_build.arduino.memory_type = qio_opi`, `build_flags = -DBOARD_HAS_PSRAM`. Verified by build probe in `/tmp/pio-n16r8-probe`: first build `[SUCCESS]`, app partition `6,553,600` bytes (`0x640000` vs `0x330000` at the N8 default), image header flash size 16 MB, linked IDF lib `tools/sdk/esp32s3/qio_opi/`. On the official platform the N16R8 is a four-line override — so the platform choice is driven by the Arduino-core question, not by board-variant support.
- **Static checks, pinned:** clang-format **23.1.3** (LLVM 23.1.3, 2026-10-06) via `mirrors-clang-format@v23.1.3`; `pio check` with PlatformIO's own `tool-clangtidy 1.190100.0` (LLVM 19.1.0) and `tool-cppcheck 1.22200.0` (cppcheck 2.22.0). The 4-major formatter/analyzer skew is deliberate but must be managed (see Pitfalls).
- **pre-commit 4.6.0** — measured at `/Users/vloktiev/.local/bin/pre-commit`; PyPI's 4.7.0 exists (2026-10-12). A research finding claiming 4.7.0 was installed here is **falsified by measurement**.
- **Wokwi:** `wokwi-cli` v0.28.1 (2026-10-05), Wokwi for VS Code 4.0.0 (2026-10-01), `@wokwi/diagram-lint` 0.1.1, `wokwi/wokwi-ci-action@v1`. `wokwi-cli lint <hw>/diagram.json --warnings-as-errors --offline` is offline and token-free, which is what makes it pre-commit-viable. `wokwi-autoroute` is off the critical path (unofficial, single maintainer, README-only docs).
- **QEMU (L2):** vendored `espressif/qemu` `esp-develop-9.2.2-20260417` — no PlatformIO package exists (`tool-qemu-xtensa` is 404), so the repo owns the binary and a per-runner fetch script.
- **Not chosen:** pioarduino `55.03.312-1` (2026-09-22, Arduino 3.3.12 / IDF 5.5.5 / GCC 14.2) — kept on record only as the escape hatch if a homework genuinely needs an Arduino 3.x API.

### Expected Features

Full detail: `FEATURES.md`.

**Must have (table stakes):**
- Per-homework self-contained PlatformIO project at exactly one level under `homeworks/` — the relative `../../shared/libs/<Name>` path in every `lib_deps` line is what makes the depth rule load-bearing.
- N16R8 overrides in every environment; one regenerated VS Code multi-root workspace; short instructor-facing README per homework; AI participation declared.
- One canonical `diagram.json` per homework plus the offline lint gate; generated `docs/wiring.svg` + `docs/netlist.md`; Mermaid overview (agent-authored, overview only — a node graph cannot express header holes).
- Shared modules as real PlatformIO libraries with `library.json` (`name` + `version` are Required fields), consumed only via `symlink://`.
- Host unit-test environment (`[env:native] platform = native`, suites partitioned by `test_ignore`), pinned clang-format/clang-tidy/cppcheck, two-stage hooks, CI that builds changed projects and lints all, short `AGENTS.md` working in both harnesses, one scaffolding skill with `guide`/`auto` modes.
- Instructor-facing README contract with a mandatory "what is NOT verified" section.

**Should have (differentiators):**
- Machine-readable pin database (`shared/hardware/esp32-s3-devkitc-1-pins.json`) plus `tools/check-pins.mjs`, rejecting GPIO22–34, GPIO35/36/37 on this module, external drive of strapping GPIO0/3/45/46, 5 V logic on a GPIO without a level shifter, and ADC2 + Wi-Fi in one homework.
- Render drift guard in CI (`git diff --exit-code -- <hw>/docs`), hardware-seam grep in pre-commit, per-homework `verify.sh` declaring which layers apply.
- L2 QEMU wired as a normal test env (`[env:esp32s3-qemu]` + `test_testing_command`), L3 Wokwi local.

**Defer (v2+):** Wokwi in CI (owner-deferred; design preserved), rotating nightly Wokwi subset, optional tscircuit IEC-style schematic sheet, freeze-on-evidence vendoring for submitted homeworks, L4 evidence capture.

**Anti-features already rejected with reasons:** Wokwi whole-diagram image or editor screenshots, Playwright over `@wokwi/elements`, tscircuit/KiCad/Fritzing as authoring paths, Mermaid *as* the wiring diagram, image-generation models, Renode (zero ESP32 support), QEMU as the primary gate, hardware-only verification, `lib_extra_dirs`, `file://` without a guard, `test_build_src = yes`, git submodules, per-module semver, `-Werror` in global `build_flags`, whole-repo static analysis inside every commit.

### Architecture Approach

Full detail: `ARCHITECTURE.md`. Five layers, one-way dependencies: agent layer (`AGENTS.md` + `.agents/`, mirrored into `.claude/`) → repo layer (one self-contained project per homework) → shared code layer (`shared/libs/<Module>/` via `lib_deps symlink://`) → config layer (`shared/pio/base.ini` via `extra_configs`, optional) → verification layer (the same checks invoked from pre-commit, pre-push and CI).

**Major components:**
1. `homeworks/<id>/` — one PlatformIO project: `platformio.ini`, `include/board_pins.h`, `src/`, `test/`, `diagram.json`, `docs/` (generated), `README.md`. `pio run -d homeworks/<id>` from the root is the single build verb; there is no recursive PlatformIO command, so root sweeps are shell loops that accumulate `fail` rather than exiting on the first error.
2. `shared/libs/<Module>/` — a real PlatformIO library (`library.json` with `name` + `version`, sources under `src/`; nested layouts need `build.srcDir`/`build.srcFilter` per platformio-core #5493). The HAL seam lives here: no `Arduino.h`, `esp_*`, `driver/` or `freertos/` above the seam.
3. `tools/` + `scripts/` — repo-owned renderer, `check-pins.mjs`, seam grep, and the pio sweep scripts (there is no PlatformIO feature for these).
4. `.pre-commit-config.yaml` — the single definition of every static check; pre-commit, pre-push and CI all invoke it, so a check cannot exist in one gate and not another.
5. `.github/workflows/` — one workflow per verification layer: `checks.yml` (lint all, build changed), `native.yml` (L1 matrix), `qemu.yml` (L2), `wokwi.yml` (**deferred** by owner decision).

**Two mechanisms are undocumented and must be smoke-tested before the roadmap relies on them:** a **whole-directory** symlink `.claude/skills` → `../.agents/skills` (Claude Code documents per-skill-entry symlinks and `.claude/rules/`, not a symlinked skills directory) and Antigravity reading the root `AGENTS.md` marker (inferred from exhaustive absence in the docs, not from a local test). Keep the broken-symlink check `find .claude -type l ! -exec test -e {} \; -print` in pre-push/manual.

**Structural traps the architecture research settled:** `extends` does not merge (only the last profile's value survives — a list option is silently lost); `extra_configs` globs resolve against the **project** dir, not the fragment that declared them; a missing `extra_configs` file exits 0 and silently drops board/framework/flags; an env-level `build_flags` **replaces** the inherited one (hence the `${env.build_flags}` idiom); a `platformio.ini` at the repo root or under `shared/` raises `ProjectEnvsNotAvailableError`; empty `[section]` headers in shared fragments broke on Core 6.1.6+; a shared `workspace_dir` makes two homeworks fight over `libdeps` (share `build_cache_dir` only); and identical `[env:NAME]` across projects makes the IDE build the wrong one.

### Critical Pitfalls

Full detail: `PITFALLS.md`. Top 5 by roadmap impact:

1. **The board in `platformio.ini` is not the board on the desk** — `esp32-s3-devkitc-1` = N8. Without the four overrides half the flash and all PSRAM vanish silently; PSRAM is absent unless the build enabled it, so `psramFound() == false` proves nothing. Confirm once via the esptool eFuse banner and record it in every homework README. Board revision is still unknown: RGB LED is GPIO48 on the initial revision, GPIO38 on v1.1.
2. **The scaffold is verified as files, not as behaviour** — nothing on `vl/init` has ever built, flashed, monitored or tested this hardware, and no homework exists. Make the phase-2 exit criterion one dated end-to-end acceptance run on hardware, including the console decision (UART bridge default vs the `-D ARDUINO_USB_CDC_ON_BOOT=1` template default, which is the riskier monitor/test path — the native-USB port disappears whenever firmware touches GPIO19/20 or sleeps, and `pio test` on such a port needs `--no-reset` or >2 s before `UNITY_BEGIN`).
3. **`lib_extra_dirs` is deprecated but still works in Core 6.2.0** — which is exactly why it survives; and `file://` deps copy into `.pio/libdeps/` and are never refreshed (a verified rebuild went green in ~0.55 s compiling the OLD code). Only `symlink://` is live; a manifest-less folder is not a package at all.
4. **Config-layer silent failures and silent static-analysis switches** — `check_patterns` does not exist (`check_src_filters` does); any cppcheck `check_flags` value silently drops PlatformIO's `--inline-suppr`, `--platform` and `--enable` defaults; clang-tidy left at its implied `--checks=*` reports noise; a clang-tidy hook without a compilation database is a silent no-op; `-Werror` belongs in `build_src_flags`, never global `build_flags`.
5. **Agent-file footguns fail without an error** — a stray `CLAUDE.md` at or above CWD silently switches `AGENTS.md` off for Claude Code while Antigravity keeps reading it; malformed skill frontmatter loads the skill with no metadata so auto-invocation never fires; an oversized `AGENTS.md` is silently demoted from always-on to a pointer by Antigravity and loses nothing visible. The measured `AGENTS.md` on `vl/init` is **288 lines** against the ≤~200-line target, and nothing in the bundle says whether to trim, split or relax it.

## Implications for Roadmap

Phase names below reuse the placeholder set the pitfalls research already used so the roadmap planner can map them one-to-one.

### Phase 1: Repo and project layout
**Rationale:** Every other phase writes files into this tree, and the current scaffold's repo-wide scripts still glob `hw-*/platformio.ini` — under the decided layout that gate becomes a permanently green no-op (`scripts/pio-build.sh` prints "No homework projects yet" and **exits 0** when the glob matches nothing).
**Delivers:** the decided tree (`homeworks/<id>/`, `shared/libs/`, `tools/`, `scripts/`, `docs/`); a deliberately authored root `.gitignore` (`.pio/`, `.pio-cache/`, `.vscode/c_cpp_properties.json`, `.vscode/launch.json`, `compile_commands.json` — never commit generated editor state); a regenerated `homework.code-workspace` (it currently holds one stale absolute path pointing outside the repo); every repo-wide glob re-pointed at `homeworks/**/platformio.ini` and made to fail loudly on zero matches; and a freeze on the naming that the scaffolding skill will hardcode.
**Addresses:** per-homework project skeleton, one VS Code multi-root workspace.
**Avoids:** Pitfall 11 (stale glob, green CI that built nothing), Pitfall 10 (layout rules), Anti-Pattern 7 (inherited `.gitignore` — `pio project init` writes only `.pio` and returns early if a file exists).

### Phase 2: Board and environment baseline (N16R8) — the acceptance gate
**Rationale:** This is the required path for every later phase and the only phase whose exit criterion is physical. Corrections 1–3 of the scaffold review (board overrides, `symlink://` deps, exact platform pin) all land here, and the ordering research is explicit that matrix/caches/extra analyzers must wait until 3+ homeworks.
**Delivers:** the per-homework `platformio.ini` template with the four N16R8 overrides, an exact `platform = espressif32@7.1.3`, `monitor_speed = 115200`, pinned `upload_port`/`monitor_port`/`test_port`, `debug_tool = esp-builtin`, the decided console default; the resolved core/toolchain written into the repo from `~/.platformio/penv/bin/pio pkg list -v` after the first build; the partition CSV name taken from the pinned core's own `tools/partitions/`; and **one dated acceptance run**: build → flash → monitor → esptool eFuse banner → `psramFound()` → one native test → one hook dry run.
**Uses:** PlatformIO Core 6.2.0, `espressif32@7.1.3` (Arduino 2.0.17 / IDF 4.4.7), esptool 4.11.0.
**Avoids:** Pitfalls 1, 2, 3, 5, 6 and 18 (the whole class of "defaults that look correct").
**Research flag:** the console decision and the board revision are still open; the acceptance run is what closes both.

### Phase 3: Shared library layer
**Rationale:** The seam and the `symlink://` mechanism are prerequisites for L1 tests (Phase 5) and for the IDF migration, and the C++ standard must be stated next to the platform pin before the layer grows.
**Delivers:** `shared/libs/<Module>/` with `library.json` (`name`, `version`, `frameworks`, `platforms`), a HAL seam (`emb_hal` + `emb_hal_arduino` now, `emb_hal_idf` later), naming/prefix rules, and the mechanical gates: a `grep -r lib_extra_dirs` gate, a hardware-seam grep, and the C++-standard contract for shared code.
**Implements:** the shared code layer and the hardware seam (Architecture Patterns 1 and 5).
**Avoids:** Pitfall 7 (toolchain skew — IDF 4.4.7 at `gnu++11` vs IDF 5.5.5 at `gnu++2b`), Pitfall 8 (`lib_extra_dirs`), Pitfall 9 (manifest/source-layout/stale-copy traps, including the "shared change that builds no project" mapping).

### Phase 4: Wiring artifact pipeline
**Rationale:** One canonical `diagram.json` is the source of the image, the pin table and the simulation — the feature that keeps 60 homeworks self-explanatory a year later — and its lint gate is offline, so it can be introduced early and cheaply.
**Delivers:** the `diagram.json` authoring conventions (board part `board-esp32-s3-devkitc-1`, bare GPIO pin names, **`flashSize: "16"` + `psramType: "octal"` for N16R8**, empty route arrays, `left`/`top` at part level, unique part ids split `wokwi-*`/`board-*`); the repo-owned deterministic renderer emitting `docs/wiring.svg` + `docs/netlist.md`; the vendored board artifacts (`board.json` + `board.svg`; the mm→pt factor 2.8346 was verified on two pins only — eyeball the first overlay); `wokwi.toml` via `wokwi-cli init`; the pin database and `check-pins.mjs`; the CI drift guard.
**Addresses:** generated wiring artifact, offline lint gate, Mermaid overview, pin validation.
**Avoids:** Pitfall 17 (no whole-diagram export exists — `--screenshot-part` only; feature request #345 open since 2022-04-15; manual screenshots drift silently).

### Phase 5: Verification layers
**Rationale:** Each layer must be declared honestly per homework because their coverage does not overlap: QEMU on ESP32-S3 emulates no GPIO matrix/IOMUX, I2C, SPI, LEDC, RMT, USB, Wi-Fi or Bluetooth (it cannot blink an LED); Wokwi has no Bluetooth and is quota-metered; hardware is the only truth for BLE, deep sleep, ADC reality and timing.
**Delivers:** `[env:native]` with suites partitioned (`test_ignore`), `pio test -e native --junit-output-path build/reports/host.xml`; `[env:esp32s3-qemu]` plus the vendored QEMU asset and the merge command `esptool --chip esp32s3 merge_bin --fill-flash-size 16MB 0x0 bootloader.bin 0x8000 partitions.bin 0x10000 firmware.bin` run under `qemu-system-xtensa -nographic -machine esp32s3 -drive file=flash_image.bin,if=mtd,format=raw -global driver=timer.esp32c3.timg,property=wdt_disable,value=true`; the shared `merge_firmware.py` for LittleFS/OTA/custom partitions; per-homework `verify.sh` declaring which layers apply; L3 kept local (VS Code 4.0.0 + `wokwi-cli`), with `wokwi-cli <hw> --expect-text … --timeout 15000 --timeout-exit-code 43` so the default timeout code **42** stays distinguishable from an assertion failure.
**Routing to encode:** GPIO/peripherals → L1+L3; I2C/SPI/OneWire → L1+L3; Wi-Fi → L1+L2+L3; BLE → L1 then L4; RTOS/timers → L1+L2+L3 with deep sleep always L4. Never assert on durations in any simulator.
**Avoids:** Pitfall 16 (layer confusion producing false confidence).

### Phase 6: Static checks and formatting
**Rationale:** The pinned checks are a stated requirement, and the formatter/analyzer stack has three LLVM generations in play — misconfigured analyzers fail silently, not loudly.
**Delivers:** the committed `.clang-format` with its style direction decided (the committed file on `vl/init` is 4-space, ColumnLimit 100, `Standard: c++17`, and still uses pre-rename keys such as `ReflowComments: true` and `KeepEmptyLinesAtTheStartOfBlocks` — note `.h` is handled as **C** from clang-format 20); `.clang-tidy` validated with `clang-tidy --verify-config` against LLVM 19.1.0; `pio check -d <project> --fail-on-defect=high --skip-packages` kept flag-light until deliberately configured; `C_Cpp.clang_format_path` pointed at the pinned 23.1.3 binary or format-on-save disabled.
**Avoids:** Pitfalls 12 and 13.

### Phase 7: Hooks and CI
**Rationale:** The owner's split (pre-commit fast, pre-push builds changed projects, CI builds changed and lints all) is fixed, but the WIP policy is not — and repo-wide gates on every branch push are red by construction, which is the documented path to `--no-verify` or to losing remote backup.
**Delivers:** the three-stage `.pre-commit-config.yaml` with the pio hook on pre-push/`manual`, `require_serial: true` for any hook that runs `pio`, `shutil.which('pio')` pre-checks with an actionable message, an explicit `stages` key per hook, and `--show-diff-on-failure` in CI; `checks.yml` + `native.yml` with a discover→matrix shape (`fail-fast: false`, low `max-parallel`); the shared→consumer mapping (parse each `platformio.ini`'s `symlink://` targets — a file under `shared/` has no `platformio.ini` ancestor, so a naive nearest-ancestor mapping builds nothing for the most dangerous change type); a re-keyed cache on `hashFiles('**/platformio.ini')` with `restore-keys`; the documented WIP policy and its sanctioned escape hatch (`SKIP=<hook-id>`, never `--no-verify`).
**Avoids:** Pitfalls 11 and 14. Note `platformio/platformio-action` is a verified **404** — CI must use manual steps.

### Phase 8: Agent rules and skills
**Rationale:** This is the single point through which every convention reaches the repo; if the scaffolding skill is wrong, 60 homeworks are wrong. It comes last because the skill must emit the template, the diagram conventions, the pin database and `verify.sh` that earlier phases created.
**Delivers:** the short root `AGENTS.md` (with a decision on the 288-line problem), the canonical `.agents/skills/<name>/SKILL.md` tree with per-entry symlinks into `.claude/skills/`, the six cross-tool frontmatter fields, the scaffolding skill in `guide` mode first (it also validates the template by hand), then `auto` mode once the board facts are captured in `shared/hardware/`; the instructor-facing README contract; and the two smoke tests (skills appear and load in a live session; no `CLAUDE.md` anywhere at or above CWD).
**Avoids:** Pitfall 15. Never build procedures on `.agents/workflows/*.md` — legacy workflows stop working on **19 October 2026**.

### Open Decisions (genuinely unresolved — the roadmap should force them)

| # | Decision | Why it cannot be deferred | Recommended default carried from research |
|---|----------|--------------------------|------------------------------------------|
| D1 | **Which Arduino core the course targets (2.x vs 3.x)** | 2.x and 3.x are not source-compatible (`ledcSetup/ledcAttachPin` vs `ledcAttach`, reworked `analogWrite`); the official platform ships 2.0.17 while pioarduino ships 3.3.12. It changes every homework's code. | Ask the instructor / inspect a course example. Meanwhile pin `espressif32@7.1.3` exactly. |
| D2 | **Console default: USB CDC on boot vs UART bridge** | The scaffold's template sets `-DARDUINO_USB_CDC_ON_BOOT=1`; that is the riskier monitor/test path. | UART bridge as default, native USB as an explicit opt-in env, ports pinned per env. |
| D3 | **Exact platform pin, and the resolved core written down** | The manifest declares the core as a `~` range; sources **contradict** each other on what 7.1.3 ships (2.0.17 vs 3.3.12). Note `STACK.md` measured 2.0.17 (`4.20017.260907`) while `FEATURES.md`'s version baseline quotes `4.30312.261011` (3.3.12) — do not copy either number into docs before `pio pkg list -v` confirms it. | `espressif32@7.1.3` + a recorded `pio pkg list -v` output. Never `#develop`. |
| D4 | **C++ standard contract for homework and shared code** | `Standard: c++17` in `.clang-format` and `C_Cpp.default.cppStandard` are formatting/IntelliSense metadata, **not** a compile decision; the pinned core-2.x toolchain may refuse C++17 code the repo already formats. | State the standard next to the platform pin; shared code targets the intersection of every pinned env; re-verify on each platform bump (the `gnu++11` / `gnu++2b` figures are **medium confidence**). |
| D5 | **Hook stage split for L1 and the build** | Sources disagree: one puts native tests and `pio run` in pre-commit, the other puts everything that compiles in pre-push/manual. The owner's fixed decision matches the second. | pre-commit keeps the non-compiling checks (format, seam grep, pin validation, diagram lint, render drift); pre-push runs the changed-project build + L1. |
| D6 | **WIP tolerance of repo-wide gates** | Feature-branch pushes are red by construction; the ways out are `--no-verify`, `SKIP`, or never pushing WIP. | Document what must be green for a WIP push vs a merge; build-all only on `main`/PR; make the gate fail loudly when it matches zero projects. |
| D7 | **Naming freeze before the scaffolding skill hardcodes it** | Sources use `shared/lib/` and `shared/libs/`, and `tools/` and `tooling/`, for the same folders; the skill is where the convention becomes permanent. | Pick one of each pair in Phase 1 and write it into the template. |
| D8 | **Submission/freeze model** | The owner decided tags are ceremony (git history is sufficient; the README index row records the commit SHA). Residual risk stays open: with live `symlink://` shared code an already-submitted homework rebuilds differently after a later shared edit (one silent-drift case was reproduced: a shared edit changed the firmware of an untouched project with a green build). | Keep live linking; freeze on evidence — first submitted homework that breaks at HEAD, or a shared header change over ~10 homeworks — by vendoring into `<hw>/lib/`, removing the `symlink://` line, and writing `SHARED.lock`. |
| D9 | **`AGENTS.md` size: trim, split, or treat the target as soft** | The artifact recommended for adoption is 288 lines against the ≤~200 target it cites; Antigravity demotes oversized always-on rule sets silently. | Decide inside Phase 8, before the file grows with every homework. |
| D10 | **`.claude/skills` mirror shape** | Directory-level symlinks are the undocumented case and the abandoned scaffold chose them; broken symlinks fail silently. | Per-skill-entry symlinks; one live smoke test; keep the broken-link check. |
| D11 | **VS Code extension: official (frozen v3.3.4, 2025-01-11) vs pioarduino fork (active, 2026-05-11)** | The workspace sets `platformio-ide.activateOnlyOnPlatformIOProject` (reported removed) and `autoRebuildAutocompleteCache` (docs reportedly `autoRebuildAutocompleteIndex`); this is an **IDE** choice, independent of the official-platform decision. | Inspect the installed extension's schema; set `activateProjectOnTextEditorChange: true` either way, and use project-scoped env names. |
| D12 | **Board revision (RGB LED GPIO48 vs GPIO38)** and **ADC2-while-Wi-Fi** | The revision is invisible until a blink produces nothing; on ADC2 the datasheet v2.2 (ADC2 unusable while Wi-Fi runs) and the ESP-IDF `adc_oneshot_read()` arbitration note **contradict** each other. | Settle the revision in the Phase 2 acceptance run; keep the conservative ADC1 (GPIO1–10) rule for analog, or verify on hardware with the pinned core/IDF. |

### Phase Ordering Rationale

- **The board baseline and its acceptance run come before any homework.** Every later phase inherits the environment; discovering a wrong partition CSV or a silent N8 default under deadline pressure is the failure mode the sequencing exists to prevent. One dated end-to-end run converts the whole scaffold from "verified as files" to "verified as behaviour".
- **Layout before mechanisms.** The repo-wide scripts, the workspace file and the scaffolding skill all encode the folder convention; freezing it once in Phase 1 is what stops a mid-course change that touches the workspace file, the scripts, the skill and CI simultaneously.
- **Shared code before verification layers**, because L1 exists only if pure logic sits behind the seam; **wiring artifacts before agent skills**, because the skill emits them; **agent skills last**, because they are the funnel through which all of the above is reproduced 60 times.
- **Deferral is part of the ordering.** CI build matrix, cross-project cache, extra analyzers, clangd and Wokwi-in-CI all arrive at 3+ homeworks; the research is explicit that a solo learner can otherwise spend course weeks on infrastructure instead of assignments.
- **Pitfall avoidance is structural, not additive:** the drift guard, the seam grep, the pin check and the `lib_extra_dirs` grep are cheap in their own phases and expensive to retrofit once 60 projects exist.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (board/environment):** the acceptance run **is** the research — it settles the console decision, the board revision, the partition CSV, the resolved core/toolchain, and whether `platform = native` works with Apple clang 21.0.0 as the host compiler (docs assume system GCC; not smoke-tested here).
- **Phase 4 (wiring pipeline):** the renderer is unbuilt code; the `board.svg` mm→pt factor (2.8346) was verified on two pins only, and whether Wokwi part screenshots can frame anything close to a whole circuit is unverified.
- **Phase 5 (verification layers):** QEMU's `test_testing_command` wiring, the per-runner binary fetch, and the merged-image requirement are the highest-complexity items in the research.
- **Phase 7 (hooks/CI):** cache size and job time under the current all-`~/.platformio` key are **unmeasured**; the Wokwi action documents no timeout-exit-code input, so distinguishing timeout (42) from assertion failure may require calling `wokwi-cli` directly.
- **Phase 8 (agent layer):** the whole-directory symlink case and Antigravity's `AGENTS.md` discovery both need a live test.

Phases with standard patterns (skip research-phase):
- **Phase 1 (layout):** folder conventions, `.gitignore` contents and workspace shape are settled; the work is mechanical.
- **Phase 3 (shared libraries):** the mechanism is documented, measured end-to-end and its failure modes are known (`PackageException`, `MissingPackageManifestError`, the nested-src linker trap).
- **Phase 6 (static checks):** the pins and their failure modes are fully enumerated; the work is validating names against LLVM 19 and proving a planted defect is reported.

### What the Plan Does NOT Yet Cover (adversarial critique — real gaps, not noise)

These come from a critique of the research plan itself and remain open; several are answerable only by the instructor, and three of them can invalidate tooling choices already recommended.

1. **Submission and grading contract.** PROJECT.md states the instructor reviews the public repo and demos in class, but whether the instructor accepts a PlatformIO project at all (versus Arduino-IDE `.ino` sketches), or expects an archive/LMS upload in addition, is unconfirmed. If the grader expects a sketch folder or a specific environment, the whole monorepo shape can be orthogonal to what is graded.
2. **Per-homework writeup, demo evidence and report language.** The abandoned `new-homework` skill emitted no README at all (verified: `platformio.ini`, `include/board_pins.h`, `src/main.cpp`, `test/` only). The deliverable contract in `FEATURES.md` fixes the shape for English artifacts, but a Ukrainian-language course may require Ukrainian reports, and where demo media lives (git, LFS, or external links) is undecided — a few weeks of screenshots pollute history before anyone notices.
3. **Academic-integrity and AI-assistance policy.** This is an agent-first repo whose agent will author code; the owner decided AI participation is declared in READMEs and commit trailers, but the course's own rule (permitted / must be disclosed / forbidden) is **unknown**, and an integrity violation is the one failure mode here that cannot be fixed afterward.
4. **Pedagogical contract of the agent for a learner.** Largely answered by the two-mode skill (`guide` stops before writing homework logic; `auto` one-shots) — but the *default* for an unspecified request, and what the agent may write in tooling versus `hw/src/`, should be written into `AGENTS.md` explicitly, because the "reuse first" guidance otherwise makes it frictionless for the agent to do the assignment.
5. **Per-week structure, status and a frozen "as submitted" state.** No file maps homeworks to weeks/topics/status, and there are zero tags (owner decision) — the mitigation is the commit SHA in the README index row. With no hard deadlines this is lower priority, but the mapping is cheaper to create before week 1 than to reconstruct.
6. **Structural home for non-numbered course projects.** They live under `homeworks/` with a different prefix, but the workspace-registration rule, the repo-wide scripts' glob, the `guide`/`auto` skill and the naming convention are currently written for numbered homeworks only. A final/multi-week project does not fit that semantics; decide the prefix and make the skill a shared project-skeleton skill now.
7. **Hardware kit inventory.** Only the board plus basic components (buttons, LEDs, resistors, breadboard) are inventoried; more modules are owned but not listed. The pin-reservation template (`include/board_pins.h`), the ADC1-versus-ADC2 rule and the strapping-pin guidance only become actionable once the kit is known.
8. **Multi-machine / Windows use.** The committed design relies on symlinks (`.claude/`), POSIX shell scripts, and `~/.platformio/penv` paths. On a Windows machine, committed symlinks check out as plain text unless `core.symlinks` is enabled, the scripts do not run natively, and the pio PATH story breaks. The repo is public (owner decision), so the visibility question is settled; portability is not.
9. **The scaffold-acceptance and adoption sequencing itself.** The eight corrections arrive unordered with no effort budget; without the sequencing above, infrastructure can consume course weeks.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions, deprecations and the N16R8 override set were measured on this machine on 2026-10-15 (build probe in `/tmp/pio-n16r8-probe`). Two items stay MEDIUM because the sources flag them: C++-standard drift across frameworks, and the Wokwi plan/repo-visibility boundary. One contradiction is kept: what 7.1.3's Arduino core actually is. |
| Features | MEDIUM | Commands and failure modes are high-confidence and verified live; the board-derived facts and several CI/Wokwi facts are not, and the source slices were partly written against the N8 assumption and against a different toolchain pin set (see the N16R8 correction and the pin-set discrepancy). |
| Architecture | HIGH for PlatformIO mechanics; MEDIUM for the two-harness agent layer | Every PlatformIO rule was read from live docs or Core source; the symlinked `.claude/skills` directory and Antigravity's `AGENTS.md` discovery are undocumented and need a live smoke test. |
| Pitfalls | HIGH for docs-measured items; MEDIUM for board-physical and unsimulated layers | All contested and falsified claims are kept marked in `PITFALLS.md` and are not upgraded here. |

**Overall confidence:** MEDIUM — the engineering half is decision-ready and measured; the course-facing half is unresolved and can change the shape.

### Gaps to Address

- **Resolved by measurement (do not re-open):** PlatformIO Core 6.2.0 **is** installed at `~/.platformio/penv/bin/pio`; pre-commit is 4.6.0, not 4.7.0; the scaffold on `vl/init` does use `lib_extra_dirs` and `espressif32@^6.0.0` plus an `ARDUINO_USB_CDC_ON_BOOT=1` default, so corrections 1–3 are real; the CI cache does key on `.pre-commit-config.yaml` and caches all of `~/.platformio`, so correction 5 stays open.
- **Kept uncertain:** espressif32 7.1.3's Arduino-core pairing; the C++ standard actually compiled (medium); `platform = native` with Apple clang as the host compiler (not smoke-tested); the symlinked skills directory; the VS Code `platformio-ide.*` keys; the board revision; ADC2-while-Wi-Fi; the Wokwi tier boundary and the firmware-upload privacy decision; CI cache size/job time; and the 288-line `AGENTS.md` against its own target.
- **How to handle during planning:** treat D1–D12 in Phase 2–8 as explicit decision points rather than assumptions; make every phase's verification produce a recorded artifact (a banner, a `pio pkg list` output, a dated log line), because this repo's failure mode is documentation that silently disagrees with the hardware.

## Sources

### Primary (HIGH confidence)
- Local measurements on this machine, 2026-10-15: `~/.platformio/penv/bin/pio --version` (6.2.0), `pio project config`, `pio device list`, `pio pkg list`, `~/.platformio/platforms/espressif32/boards/esp32-s3-devkitc-1.json`, `builder/main.py`, the installed `framework-arduinoespressif32/tools/partitions/`, `~/.local/bin/pre-commit --version` (4.6.0), and the N16R8 override build probe in `/tmp/pio-n16r8-probe`.
- `docs.platformio.org/en/latest/…` — `lib_extra_dirs` deprecation, `globallib_dir`, `extra_configs`, `extends`, `build_cache_dir`, `workspace_dir`, `lib_ldf_mode`, `check_tool`/`check_src_filters`, `cmd_run`, `cmd_check`, `cmd_config`, `librarymanager/ldf`, `manifest/library-json` — read 2026-10-15.
- `github.com/platformio/platform-espressif32` releases v7.1.3 (2026-09-11) / v6.13.0, `platform.json`, board JSON, `builder/main.py`.
- `docs.wokwi.com` (`diagram-format`, `vscode/project-config`, `vscode/platformio`, `wokwi-ci/cli-usage`, `wokwi-ci/getting-started`, `wokwi-ci/automation-scenarios`, `guides/esp32`) and `github.com/wokwi/wokwi-cli` v0.28.1 (2026-10-05) — read 2026-10-15.
- Espressif documentation: ESP32-S3-DevKitC-1 User Guide v1.1 (GPIO35/36/37 unavailable), ESP32-S3 Series Datasheet v2.2 (strapping, ADC2 vs Wi-Fi, octal pins), ESP32-S3-WROOM-1 datasheet v1.8, esptool docs (`flash-id`, reset modes), ESP-IDF `USB_PHY_SEL` eFuse.

### Secondary (MEDIUM confidence)
- PlatformIO issue tracker: #5493 (nested-src Local Folder trap), #5384/#5387 (`extra_configs` path resolution), #4884 (empty sections on 6.1.6+), #2252/#2320 (VS Code project activation, env-name re-sync).
- Anthropic Claude Code docs (`AGENTS.md`/`CLAUDE.md` precedence, `.claude` symlink semantics, skill frontmatter and listing budget) and Antigravity docs (rules discovery, mandatory frontmatter, size limits, workflows→skills sunset 2026-10-19).
- Repository state, 2026-10-15: branch `repo/init` (HEAD `a9b043c`, with `.planning/`) and the abandoned scaffold on branch `vl/init` (12 commits, pushed) — `AGENTS.md` (288 lines), `.agents/{rules,skills}`, `.claude/{rules,skills}` symlinks, committed `.clang-format`, three-stage `.pre-commit-config.yaml`, `.github/workflows/ci.yml`, `scripts/pio-{build,check,test-native}.sh`, a stale `homework.code-workspace`.

### Tertiary (LOW confidence)
- `wokwi-autoroute` (unofficial, v1.0.0, README-only docs) — off the critical path; keep it there.
- The Wokwi Community/Hobby tier boundary for the VS Code diagram editor and for a private repo — unconfirmed; the repo is public, which fits the free tier's stated aim, but verify before enabling any paid-dependent step.
- Whether Wokwi part screenshots can frame anything like a whole circuit — unverified; never promise a Wokwi-look wiring image from `--screenshot-part`.

---

*Research completed: 2026-10-15*
*Ready for roadmap: yes*
