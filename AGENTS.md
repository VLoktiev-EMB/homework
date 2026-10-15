<!-- GSD:project-start source:PROJECT.md -->

## Project

**homework — Embedded Coursework Repository**

A personal coursework repository for an embedded-development course (C/C++, PlatformIO, ESP32-S3-DevKitC-1). It is the main working tool for every homework and every course project: each homework is its own self-contained PlatformIO project, a shared library folder holds reusable code, and the whole thing opens as one VS Code workspace. The repository is public, and the course instructor reviews the homework through it.

**Core Value:** **Every homework stays buildable, demonstrable and self-explanatory long after it was submitted.** A homework written in week 3 must still compile, explain its own wiring, and be demoable in week 40 — without the owner reconstructing anything from memory.

### Constraints

- **Tech stack**: PlatformIO + ESP32-S3 + Arduino core (2.x) now, ESP-IDF later — so shared code must not call Arduino APIs directly
- **Version discipline**: pin every tool and platform to an exact version; never use ranges and never `#develop`
- **Budget**: Wokwi's free tier allows 50 simulation-minutes per rolling 30 days — simulation cannot be a per-commit gate
- **Public repository**: the git history is an artifact read by the instructor and possibly employers — commits must be clean and must never contain secrets
- **Solo maintenance**: one person studying full time — every added file and check is a cost, and the design must stay small
- **Language**: all repository artifacts (rules, docs, comments, commit messages) in English
- **Board**: N16R8 module — 16 MB flash and 8 MB octal PSRAM, so board definitions must be overridden and GPIO35/36/37 are unavailable

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Technologies

| Technology | Version (2026-10-15) | Purpose | Why Recommended |
|------------|----------------------|---------|-----------------|
| PlatformIO Core | **6.2.0** (released 2026-09-05; docs "latest" channel shows 6.2.1b2). Measured here: `PlatformIO Core, version 6.2.0` from `/Users/vloktiev/.platformio/penv/bin/pio` | Build system, package manager, test runner, static-analysis driver, serial monitor | Single binary drives every homework project; `-d/--project-dir` exists on `run`/`check`/`test`/`device monitor`/`project config`/`project metadata`/`pkg install`, which is the whole multi-project story. **Not on the interactive PATH on this machine** — every command needs `export PATH="$HOME/.platformio/penv/bin:$PATH"` or the absolute path. |
| `platformio/espressif32` (official registry platform, per the owner's decision) | **7.1.3** (published 2026-09-11); measured locally in `~/.platformio/platforms/espressif32/platform.json` | Provides the board definitions, framework packages and toolchains for ESP32-S3 | Official platform = registry-resolved, checksummed, semver-pinnable. Its `esp32-s3-devkitc-1` board exists for both `arduino` and `espidf` frameworks, and the N16R8 retarget is four override lines (verified below). |
| Arduino core, carried by that platform | `framework-arduinoespressif32` **4.20017.260907+sha.dcc1105b** installed (= **Arduino core 2.0.17 on ESP-IDF 4.4.7**; the platform pins `~4.20017.0`). Measured proof: the actual core compile line carries `-DIDF_VER="v4.4.7-dirty"` | The framework for all first-phase homeworks | This is what "official platform" means today — the released tag still ships Arduino 2.x. The `develop` branch has already moved to 3.3.12 + IDF 6.1 but is **unreleased**. |
| ESP-IDF framework (for the later migration) | `framework-espidf` **4.60100.0** installed; v7.1.3 pins `~4.60100.0` = **ESP-IDF 6.1.0** | Second-phase framework behind the same platform pin | Same platform, same board, `framework = espidf`; the migration is a per-env change, not a re-platforming. Note the released IDF (6.1.0) is *newer* than the IDF under Arduino 2.0.17 (4.4.7). |
| Xtensa toolchains (installed by the platform) | `toolchain-xtensa-esp32s3` **8.4.0+2021r2-patch5** (Arduino builds) and `toolchain-xtensa-esp-elf` **15.2.0+20251204** (IDF builds) | Compilers | Two different GCC generations are on disk at once; warnings and accepted code differ between the Arduino and IDF paths (see Version Compatibility). |
| esptool | `tool-esptoolpy` **2.41100.0** (esptool **4.11.0** — printed by the build) | Flashing, `flash-id`, `merge_bin` for the QEMU smoke image | Provides the eFuse-derived chip banner ("Embedded Flash 8/16 MB", "Embedded PSRAM …") that is the only reliable way to confirm which module variant is physically attached. |
| Unity test framework | Bundled with PlatformIO Core (no install); runners `unity.py`, `googletest.py`, `doctest.py` confirmed present in Core 6.2.0 at `~/.platformio/penv/lib/python3.13/site-packages/platformio/test/runners/` | On-device (L4) and, if wanted, host-side test framework | Zero extra dependency; `pio test` is the same command on `platform = native` and on the ESP32-S3, so L1 and L4 use one runner and one report format. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Shared modules under `shared/lib/<Module>/` | in-repo, each a real PlatformIO library (`library.json` with `name` + `version`, both Required fields) | The course's reusable code | Always consumed per project as `lib_deps = <Name>=symlink://../../shared/lib/<Name>`. `symlink://` reflects source edits live; `file://` hard-copies and is only for frozen snapshots. |
| Wokwi board/pin catalog | `https://wokwi.github.io/wokwi-boards/boards.json` (live, 54 board definitions) and `parts.json` inside the `@wokwi/diagram-lint` tarball (137 part types with exact pin strings) | Pin names, geometry and part-id validation for `diagram.json` | Fetch at authoring time; do not let a model author pins from memory (see What NOT to Use). |
| `@wokwi/diagram-lint` | **0.1.1**, MIT, npm | The lint engine behind `wokwi-cli lint`, usable standalone with nine named rules | Only if the repo wants a Node-native lint step instead of shelling out to `wokwi-cli`. |
| `esp32_exception_decoder` monitor filter | built into Core 6.2.0 (`monitor_filters` list) | Decodes ESP32 crash backtraces on the serial monitor | Every hardware-facing homework; pair with `monitor_speed = 115200`. |
| `build_cache_dir` (Core option, not a library) | `[platformio] build_cache_dir = <repo>/.pio-cache` | Cross-project object cache for the shared Arduino/IDF core | Enable once the repo has several homeworks; this is the option the docs describe as shared *between* projects, unlike `workspace_dir`. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| clang-format, pinned at **LLVM 23.1.3** (LLVM release 2026-10-06) via `pre-commit/mirrors-clang-format @ rev v23.1.3` | Formatting gate | The mirror rev *is* the LLVM version; the hook pip-installs `clang-format==23.1.3` (`ssciwr/clang-format-wheel`), so the hook result cannot be changed by `brew upgrade llvm`, by the ESP32 toolchain, or by the CI runner image. Never call bare `clang-format` in CI (runner images ship 16.0.6/17.0.6/18.1.3 — guaranteed reformat drift). |
| clang-tidy via PlatformIO `tool-clangtidy` **1.190100.0 = LLVM 19.1.0** | Deep static analysis in CI through `pio check` | Not installed on this machine (measured); the first `pio check` downloads it. **Skew: the repo formats with LLVM 23 and analyses with LLVM 19** — see Version Compatibility. |
| cppcheck via PlatformIO `tool-cppcheck` **1.22200.0 = cppcheck 2.22.0** (released 2026-09-19) | Default `pio check` tool | Also not installed here yet. `check_tool = cppcheck, clangtidy` runs both; `--fail-on-defect=high --skip-packages` is the CI-grade invocation. |
| pre-commit **4.6.0** (measured at `/Users/vloktiev/.local/bin/pre-commit`); PyPI/GitHub 4.7.0 exists (uploaded 2026-10-12) | Local gate (pre-commit + pre-push stages) | A research finding claiming 4.7.0 was installed on this machine is **falsified by measurement**; 4.6.0 is also what the scaffold's CI pins. Pin `pre-commit==4.6.0` and `minimum_pre_commit_version: 4.0.0`. |
| Wokwi CLI | Diagram lint + headless simulation | **v0.28.1** (2026-10-05), MIT. Not installed on this machine (measured). |
| Wokwi for VS Code | Interactive simulation for human use | **4.0.0** (published 2026-10-01); requires an internet connection and a licence-activation step ("Wokwi: Request a new License"). |
| `wokwi/wokwi-ci-action@v1` | First-party CI action | Inputs: `token`, `path`, `timeout` (default 10000), `expect_text`, `fail_text`, `scenario`, `serial_log_file`, `diagram_file`, `elf`. Token in the repo secret `WOKWI_CLI_TOKEN`. CI use is **deliberately deferred** by the owner; the action is listed here because it is the shape the deferred layer will take. |
| VS Code extension | Editor integration | Official `platformio.platformio-ide` v3.3.4 is frozen (last release 2025-01-11, no releases in 20 months); the active fork is `pioarduino.pioarduino-vscode-ide` (last push 2026-05-11). This is an **IDE** choice, independent of the official-platform decision. Multi-root workspaces are officially supported, but set `platformio-ide.activateProjectOnTextEditorChange: true` or Ctrl+Alt+B builds the wrong homework. |

## Installation

# ---- PlatformIO Core (already installed here at 6.2.0; not on PATH) ----

# Fresh machine / CI (official docs pattern): pip install --upgrade platformio  (docs snippet uses actions/setup-python with '3.14')

# ---- Platform + framework (registry, already resolved here) ----

# Each homework env pins explicitly, e.g.:

#   platform = espressif32@7.1.3

# ---- Native-host tests need no install (platform native 1.2.1 is on this machine) ----

# ---- Static analysis tools (downloaded by Core on first use; neither is installed here yet) ----

# tool-cppcheck 1.22200.0 (= cppcheck 2.22.0), tool-clangtidy 1.190100.0 (= LLVM 19.1.0)

# ---- clang-format 23.1.3 (pipx is NOT installed here; uv 0.13.1 is, at ~/.local/bin/uv) ----

# or let pre-commit own it — the hook pip-installs exactly 23.1.3:

# ---- Wokwi CLI v0.28.1 (macOS/Linux) ----

# Windows: iwr https://wokwi.com/ci/install.ps1 -useb | iex

# or a release binary from github.com/wokwi/wokwi-cli/releases/latest, then chmod +x

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Official `platformio/espressif32@7.1.3` (owner decision) | `pioarduino` platform, `55.03.312-1` (2026-09-22) = Arduino 3.3.12 / IDF 5.5.5 / GCC 14.2.0, distributed as a GitHub release ZIP resolved by URL; `61.04.00-RC1` = Arduino 4.0.0-RC1 / IDF 6.1 | Only when a homework genuinely requires an Arduino **3.x** API (or IDF 5.5+/6.x under Arduino). Cost: non-registry dependency, no semver range, no registry checksum, community maintainership, and its README steers users to its own IDE extension. Never reference the floating `stable` URL; never `#develop`. |
| `board = esp32-s3-devkitc-1` + four override lines | pioarduino's per-variant board IDs (`esp32-s3-devkitc1-n16r8`, `-n8r8`, `-n32r8v`, …) or a repo-local `boards/*.json` | Per-variant IDs give correct flags by construction but only exist on the fork — which the owner's platform decision excludes. A repo-local board JSON (`boards_dir`) is the escape hatch if the repo ever needs a variant the official platform lacks. |
| UART bridge port for upload/monitor/tests; `upload_port`/`monitor_port` pinned | Native USB (`-DARDUINO_USB_MODE=1 -DARDUINO_USB_CDC_ON_BOOT=1`, `Serial` = HWCDC on `/dev/cu.usbmodem*`) | Native USB is worth it for a dedicated HWCDC/OTG homework and is what `debug_tool = esp-builtin` shares. It disappears from the OS whenever the firmware touches GPIO19/20 or sleeps. Keep it an opt-in env, never the repo default. |
| `tool-clangtidy` (LLVM 19.1.0) through `pio check`, with `pio run -t compiledb` before it | `cpp-linter/cpp-linter-hooks` v1.6.1, which pip-installs the clang-tidy you pin (`--version=21.1.8`-style) | Use it only if a single LLVM 23 config for both clang-format and clang-tidy is worth a second tool path. The `pocc/pre-commit-hooks` v1.4.0 clang-tidy hook is worse: without a compilation database it silently analyses nothing and passes green. |
| Wokwi CLI lint locally (`--offline`), simulation deferred | `@wokwi/diagram-lint` 0.1.1 as a Node devDependency | Same engine, no Python/shell wrapper — fine if the repo already runs Node tooling for the diagram renderer. |
| `wokwi-cli --expect-text` assertions | Wokwi automation scenarios (YAML) | Only for homeworks that need input injection (button press, potentiometer turn, `take-screenshot` compare-with). Scenarios are **officially ALPHA**: "The API is not fully documented yet, and may change in the future." |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `lib_extra_dirs`, `globallib_dir` | `lib_extra_dirs`: "Deprecated since version 6.0 … will be removed in the next major release" (still read by Core 6.2.0, which is exactly why the mistake is easy). `globallib_dir`: marked DEPRECATED with an explicit anti-global-libraries rationale | `lib_deps = <Name>=symlink://../../shared/lib/<Name>`, one line per module actually used |
| `board = esp32-s3-devkitc-1` with no overrides | The official manifest is "Espressif ESP32-S3-DevKitC-1-**N8** (8 MB QD, **No PSRAM**)" — read locally from `~/.platformio/platforms/espressif32/boards/esp32-s3-devkitc-1.json`: `flash_size 8MB`, `partitions default_8MB.csv`, no `-DBOARD_HAS_PSRAM` | The four overrides in the Installation block above. A half-16 MB module silently loses half its flash and all 8 MB of PSRAM. |
| `default_4MB.csv` as a partition table | Not shipped in the installed Arduino core 2.0.17 partition set, nor in core 3.3.12 (both verified by directory listing / HTTP probes); pioarduino's `n4r2` board JSON still references it, so that board id alone fails the build | `default_16MB.csv` with `board_upload.flash_size = 16MB`, or another CSV that actually exists in the core |
| Trusting `psramFound() == false` as evidence the module has no PSRAM | PSRAM is absent unless the build enabled it; a firmware that never enabled PSRAM cannot report it | `esptool flash-id` / the connection banner (eFuse-derived chip features), plus the module shield marking |
| `-std=` guessing across the two frameworks | The IDF under Arduino 2.0.17 is `-std=gnu++11` and the IDF under pioarduino's Arduino 3.3.12 is `-std=gnu++2b` (IDF master has moved to `gnu++26`); the Arduino side gets its standard from the prebuilt core, not from `platform.txt`. Confidence in this claim: **medium** | Keep shared code inside the C++11-and-up intersection the pinned framework accepts; state the standard explicitly in the repo rules and re-verify per platform bump |
| Bare `clang-format` from the CI runner or the ESP32 toolchain | Three different LLVM generations are in play (runner 16/17/18 vs repo pin 23.1.3) and formatting differs across 19/20/22 | Only the pinned `mirrors-clang-format @ v23.1.3` hook; point `C_Cpp.clang_format_path` at the same binary if the editor must agree |
| `clang-format`-style config keys invented for LLVM 23, fed to `tool-clangtidy` (LLVM 19) | Checks were renamed in 19/20/22; `.h` is treated as C from clang-format 20 onwards. Config written against LLVM 23 silently warns or differs on 19 | Validate every `.clang-tidy` check name against LLVM 19.1.0 before committing it |
| Leaving `monitor_speed` at the default | Default is **9600**; the UART bridge then prints garbage (USB CDC ignores baud, the bridge does not) | `monitor_speed = 115200` in every env |
| Any eFuse burning (`USB_PHY_SEL`, disabling `USB_SERIAL_JTAG`) | On ESP32-S3 the built-in USB Serial/JTAG and USB-OTG on the internal PHY are mutually exclusive by eFuse; burning it is irreversible | Accept the mutual exclusion per homework; use an external probe if a homework needs the USB peripheral *and* GDB |
| Committing `compile_commands.json`, `.vscode/c_cpp_properties.json`, `.vscode/launch.json` | All three are machine-generated with absolute toolchain paths; PlatformIO's own optional gitignore ignores the two `.vscode` files | Gitignore them; `pio run -t compiledb` regenerates per project, and `.vscode/settings.json`, `tasks.json`, `extensions.json` are the hand-written files worth committing |
| Reading `--timeout-exit-code`'s default (42) as "the test failed" | Wokwi's default timeout exit code is **42**, distinct from an assertion failure; treating any non-zero exit as a failure misreports overruns | Pass an explicit `--timeout-exit-code` (e.g. 43) so timeout and assertion failure stay distinguishable in CI |
| Expecting a whole-diagram image from Wokwi | Confirmed three independent ways: the CLI only documents `--screenshot-part` (single part), the official `@wokwi/client` exposes only `framebufferRead(partId)`, and the feature request (wokwi-features #345, "Circuit Photo Download") has been open since 2022-04-15 | A repo-owned renderer from `diagram.json` (see the wiring/generation research); Wokwi screenshots stay part-scoped display evidence |
| `wokwi-autoroute` (npm, v1.0.0, published 2026-07-12) on the critical path | Unofficial single-maintainer package ("Wokwi has no auto-router"), README-only documentation, not a Wokwi product; confidence in this assessment: **medium** | Omit wire-routing instructions entirely (`[]` in each connection) — Wokwi routes the remainder and routing is cosmetic |

## Stack Patterns by Variant

- Add `board_build.arduino.memory_type = qio_opi` + `build_flags = -DBOARD_HAS_PSRAM`. The installed core 2.0.17 package ships per-memory-type prebuilt IDF libs (`tools/sdk/esp32s3/{qio_opi,opi_opi,dio_opi,qio_qspi,opi_qspi,dio_qspi}`); the build probe confirmed `qio_opi` is the variant linked.
- Because the choice of `memory_type` decides which prebuilt core library set is linked, a wrong value is not cosmetic.
- Separate env with `build_flags = -DARDUINO_USB_MODE=1 -DARDUINO_USB_CDC_ON_BOOT=1` (`Serial` becomes HWCDC), and expect the port to vanish whenever the firmware touches GPIO19/20 or sleeps. Recovery is BOOT+RESET.
- Add the one shared `merge_firmware.py` extra script and point `wokwi.toml` at `firmware.merged.bin`; otherwise Wokwi substitutes its own bootloader and a default single-app 4 MB table and the filesystem fails with `partition "spiffs" could not be found`. PlatformIO's `FLASH_EXTRA_IMAGES` is populated only by the ESP-IDF builder, so Arduino projects need the script too.
- This is the point where the official-platform pin becomes the constraint. Either drop that homework's API requirement, run it as `framework = espidf` on the same official platform (IDF 6.1.0 is available there, and that is the stated migration target), or escalate the pioarduino decision rather than forking the platform per homework.
- `[env:native] platform = native` (platform **1.2.1**, already installed). PlatformIO Core 6.2.0 ships unity, googletest and doctest runners for it. Note the documented requirement that native tests use the host compiler; on this Mac `/usr/bin/gcc` is Apple clang 21.0.0, which has not been smoke-tested with `platform = native` (see Uncertainties).
- The toolchain cannot verify it: Wokwi marks Bluetooth "not implemented" for every ESP32 variant (feature request still open), and I2S/MCPWM are not implemented on the S3 (RTC only partially modelled). These are hardware-only (L4) homeworks and the README must say so.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| PlatformIO Core 6.2.0 | `espressif32` 7.1.3 | Measured: the resolved env built cleanly. `pio project config --lint` needs Core ≥ 6.1.8; `check_src_filters`/`--src-filters` need ≥ 6.1.7 — both satisfied. |
| `espressif32` 7.1.3 | Arduino core 2.0.17 (IDF 4.4.7), GCC 8.4.0+2021r2-patch5 | The platform manifest pins `framework-arduinoespressif32: ~4.20017.0` and `toolchain-xtensa-esp32s3: 8.4.0+2021r2-patch5`. Toolchains are exact while the Arduino core is a `~` range, so **pin the platform version per env and write the resolved versions into the repo** (`pio pkg list -v` after the first build), or an old homework can silently link a different core. |
| `espressif32` 7.1.3 | ESP-IDF 6.1.0 (`framework-espidf ~4.60100.0`), GCC `toolchain-xtensa-esp-elf 15.2.0+20251204` | Two GCC generations coexist on disk: 8.4 for Arduino, 15.2 for IDF. |
| `espressif32` `develop` (unreleased) | Arduino 3.3.12 + IDF 6.1 | Landed 2026-09-30 ("Update Arduino core package to v3.3.12", "Switch to esptool binaries"). Not pinnable as a version; do not use a branch. |
| pioarduino `55.03.312-1` | Arduino 3.3.12 / IDF 5.5.5 / GCC 14.2.0 / esptool 5.4.0 / cppcheck 2.20.1 / clang-tidy 21.1.0 / clangd-esp 21.1.3 | The alternative platform, listed for completeness. Its bundled cppcheck/clang-tidy versions **differ from the registry tool packages** (2.20.1 / 21.1.0 vs 2.22.0 / 19.1.0) — one more reason a lint config cannot be shared across platform choices. |
| `tool-cppcheck` 1.22200.0 (cppcheck 2.22.0) | `tool-clangtidy` 1.190100.0 (LLVM 19.1.0) | The two `pio check` tools the repo will actually run. Both are downloaded on first use (neither is installed on this machine as of 2026-10-15). |
| mirrors-clang-format v23.1.3 (LLVM 23.1.3) | PlatformIO `tool-clangtidy` (LLVM 19.1.0) | **The deliberate skew.** The formatter is 4 LLVM majors ahead of the analyser. Consequence: a `.clang-tidy` written against LLVM 23 checks silently does less on 19, and `.h` files changed kind (C, not C++) in clang-format 20. Keep `.clang-format` and `.clang-tidy` version-scoped and re-validate check names on every LLVM bump. |
| pre-commit 4.6.0 (installed) | mirror/hook revs: `pre-commit-hooks v6.0.0`, `mirrors-clang-format v23.1.3`, `codespell v2.4.3`, `gitleaks v8.30.1`, `detect-secrets v1.5.0`, `conventional-pre-commit v4.4.0`, `pocc/pre-commit-hooks v1.4.0` | The rev convention differs per repo: for `mirrors-*` the rev *is* the tool version; for `pocc/*` and `cpp-linter/*` the rev is the hook project's version and the tool comes from PATH or an explicit `--version`. |
| Wokwi CLI v0.28.1 | Wokwi CI free tier | 50 simulation-minutes per rolling 30-day window (pooled across the whole workflow), 5-minute max wall clock per CI session. A 60-homework sweep at ~10 s each is ~10 min, i.e. ~5 full sweeps per month. A careless 30 s default timeout across 60 homeworks would burn 30 min — 60% of a monthly budget — in one run. |
| QEMU (vendored `espressif/qemu` xtensa binary) | `merge_bin` output from esptool 4.11.0 | The L2 smoke layer accepts only 2/4/8/16 MB merged images; `tool-qemu-xtensa` does not exist in the PlatformIO registry (404), so the repo owns a vendored binary plus a per-platform fetch script. |

### Measured on this machine (2026-10-15)

| Fact | Measured value |
|------|----------------|
| PlatformIO Core | `PlatformIO Core, version 6.2.0` at `/Users/vloktiev/.platformio/penv/bin/pio`; **not** on the interactive PATH |
| Installed platforms | `espressif32` 7.1.3 (plus a leftover `espressif32@6.13.0`), `native` 1.2.1, `atmelavr` |
| Installed Arduino core | `framework-arduinoespressif32` 4.20017.260907+sha.dcc1105b (core 2.0.17, IDF_VER `v4.4.7-dirty` in the compile line) |
| Installed IDF | `framework-espidf` 4.60100.0 (plus a leftover 3.50503.0) |
| Installed toolchains | `toolchain-xtensa-esp32s3` (Arduino), `toolchain-xtensa-esp-elf` 15.2.0+20251204, `tool-esptoolpy` 2.41100.260830, `tool-scons` 4.41101.0 |
| **Missing** tools | `tool-cppcheck`, `tool-clangtidy`, `clang-format`, `wokwi-cli`, `pipx` — none installed; `uv` 0.13.1 is at `~/.local/bin/uv` |
| `pre-commit` | 4.6.0 at `/Users/vloktiev/.local/bin/pre-commit` (a finding claiming 4.7.0 here is wrong) |
| Host tooling | `python3` 3.13.13, `node` v26.7.0, `git` 2.50.1, Apple clang 21.0.0 |
| Board attached | None: `pio device list` shows only `/dev/cu.debug-console` and `/dev/cu.Bluetooth-Incoming-Port`, so no upload/monitor port can be named today and every L4 step is unverified |
| **N16R8 override probe** (scratch project `/tmp/pio-n16r8-probe`, env as in Installation) | `pio project config` accepts all four overrides with no unknown-option warning; first build `[SUCCESS] Took 2.62 seconds`; app partition `6,553,600` bytes (= `0x640000` from `default_16MB.csv`, vs `0x330000` on `default_8MB.csv`); image header decodes as flash size **16MB**, mode `DIO`, 80 MHz; `-DBOARD_HAS_PSRAM` present in the core compile line; linked IDF lib is `tools/sdk/esp32s3/**qio_opi**/libesp_hw_support.a`; esptool 4.11.0 |

## Contradictions and Uncertainties Kept

## Sources

- `docs.platformio.org/en/latest/…` — `cmd_check`, `cmd_run`, `cmd_config`, `pkg/cmd_install`, `librarymanager/ldf`, `manifest/library-json`, `projectconf/…` (`lib_extra_dirs`, `globallib_dir`, `lib_dir`, `shared_dir`, `build_cache_dir`, `extra_configs`, `extends`, `build_src_filter`, `check_tool`, `monitor_speed`, `upload_port`), `integration/ide/vscode`, `advanced/static-code-analysis/configuration` — read 2026-10-15
- `github.com/platformio/platformio-core` releases + `develop` source (`project/options.py`, `project/config.py`, `package/manager/_symlink.py`, `builder/main.py`) — Core 6.2.0, `--lint` ≥ 6.1.8, `compiledb` path, symlink resolution semantics
- `github.com/platformio/platform-espressif32` — releases `v7.1.3` (2026-09-11) / `v6.13.0`, `platform.json`, `boards/esp32-s3-devkitc-1.json`, `builder/main.py` (memory-type resolution, `dout`/`opi` rewriting)
- `github.com/pioarduino/platform-espressif32` — `55.03.312-1` README + `platform.json` + per-variant board JSONs (alternative platform; listed, not adopted)
- `github.com/espressif/arduino-esp32` — release 3.3.12, partition CSVs, `cores/esp32/HardwareSerial.h` (CDC macros), `platform.txt`
- Espressif: ESP32-S3-WROOM-1 datasheet v1.8, ESP32-S3 datasheet v2.2 (strapping, ADC2/Wi-Fi, octal pins), DevKitC-1 user guide v1.1 (two USB ports, GPIO35/36/37 unavailable), esptool docs (`flash-id`, reset modes, boot-mode selection), IDF `usb-otg-console` / `usb-serial-jtag-console`
- `docs.wokwi.com` (`diagram-format`, `vscode/project-config`, `vscode/platformio`, `wokwi-ci/cli-installation`, `wokwi-ci/cli-usage`, `wokwi-ci/getting-started`, `wokwi-ci/automation-scenarios`, `guides/esp32`, `guides/esp32-wifi`) + `github.com/wokwi/wokwi-cli` (v0.28.1, 2026-10-05) + `wokwi/wokwi-ci-action@v1` + `wokwi-features` issues #225, #345, #1026 — read 2026-10-15
- Local measurements, 2026-10-15: `~/.platformio/penv/bin/pio --version`, `pio project config`, `pio device list`, `pio pkg list`/package manifests, `/Users/vloktiev/.platformio/platforms/espressif32/boards/esp32-s3-devkitc-1.json`, `builder/main.py`, `framework-arduinoespressif32/tools/partitions/`, `tools/sdk/esp32s3/`, `~/.local/bin/pre-commit --version`, and the N16R8 override build probe in `/tmp/pio-n16r8-probe` (compile line, partition sizes, image header, link map)
- Confidence tags in the source slice: the `lib_extra_dirs`/`globallib_dir` deprecations, `symlink://` semantics, board JSON contents, USB/CDC routing, PSRAM and partition facts are HIGH; the C++-standard drift, the `develop`-branch state, and the Wokwi private-repo/plan boundary are MEDIUM and are marked as such above.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-fast` for a trivial task inline, with no subagents and no PLAN.md
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
