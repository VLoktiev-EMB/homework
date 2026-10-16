# Pitfalls Research

**Domain:** Embedded coursework monorepo — PlatformIO + ESP32-S3-DevKitC-1 (ESP32-S3-WROOM-1 N16R8), Arduino core now, ESP-IDF later
**Researched:** 2026-10-15
**Confidence:** HIGH for anything quoted from live docs/releases/source on 2026-10-15 or measured on this machine; MEDIUM for board-physical facts and unsimulated layers; items still uncertain or disputed are marked inline and collected under "Contested and Falsified Claims" — none are upgraded.

Candidate phase names used in "Phase to address" (placeholders — no roadmap exists yet):
**P1** Repo & project layout · **P2** Board & environment baseline (N16R8) · **P3** Shared library layer · **P4** Wiring artifact pipeline · **P5** Verification layers · **P6** Static checks & formatting · **P7** Hooks & CI · **P8** Agent rules & skills

---

## Critical Pitfalls

### Pitfall 1: The board in `platformio.ini` is not the board on the desk

**What goes wrong:**
`board = esp32-s3-devkitc-1` hard-codes the N8 module: 8 MB flash, `default_8MB.csv`, no PSRAM. On this desk the module is an **N16R8** (16 MB quad flash, 8 MB octal PSRAM) — owner correction, 2026-10-15 — so half the flash and all PSRAM vanish silently unless `board_upload.flash_size`, `board_build.partitions`, the PSRAM flags and `board_build.arduino.memory_type` are overridden (or a per-variant board ID is used). The same override is also where a wrong partition CSV (see below) or a wrong PSRAM memory type sneaks in. Separately, the board **revision** is unknown: initial ESP32-S3-DevKitC-1 puts the RGB LED on GPIO48, v1.1 on GPIO38, and arduino-esp32's generic variant assumes one of them.

**Why it happens:**
The board ID is the one field everyone copies from a tutorial; the module silkscreen is easy to skip; PlatformIO's manifest is authoritative-looking and quiet. The revision issue is invisible until a blink produces nothing.

**How to avoid:**
Override explicitly in the per-homework env template: flash size, partition table from the pinned core's own `tools/partitions/`, `-DBOARD_HAS_PSRAM`, `board_build.arduino.memory_type = qio_opi` (N16R8 = quad flash + **octal** PSRAM). Record the truth in every homework README from the esptool connection banner (flash size + chip features) and a one-time boot print of `psramFound()`. Check the revision on the silkscreen; the first acceptance run (P2 exit criterion) is what settles GPIO48 vs 38.

**Warning signs:**
`pio run` size report tops out near 8 MB; `psramFound()` prints false; the first blink shows nothing or blinks an LED you did not wire; a README says "N8" anywhere.

**Phase to address:** P2 (the acceptance run that closes it).

---

### Pitfall 2: PSRAM that exists but no firmware ever enabled — and the console that never speaks

**What goes wrong:**
Two first-week failure modes share one root: defaults that look correct.
- Without `-DBOARD_HAS_PSRAM` and the right `memory_type`, `psramFound()` is false and PSRAM is simply absent; **never conclude the module has no PSRAM from firmware that never enabled it**.
- `qio_opi` vs `opi_opi` is not cosmetic: `opi_opi`/`opi_qspi` are the **octal-FLASH** cases (WROOM-2 / N32R16V, 1.8 V VDD_SPI via GPIO45). The builder additionally forces image flash mode `dio` and boot mode `opi` for the `opi_*` memory types, so the numbers in `platformio.ini` are not the whole story; wrong combinations produce boot loops or "invalid header" failures.
- The board manifest sets `ARDUINO_USB_MODE=1` but **not** `ARDUINO_USB_CDC_ON_BOOT`, so `Serial` is UART0 and the native USB port prints nothing. This is the most common first-day ESP32-S3 confusion. The scaffold's env template sets `-D ARDUINO_USB_CDC_ON_BOOT=1` (`.agents/rules/esp32-s3-hardware.md` §2, branch `vl/init`) — that is a decision to carry deliberately, not a default.
- Two enumerated USB ports invite auto-detection mistakes: PlatformIO's `upload_port`/`test_port`/`monitor_port` can pick the bridge when the firmware talks on the native port (or the reverse). `monitor_speed` left at its 9600 default shows garbage on the bridge (USB CDC ignores baud; the bridge does not).

**Why it happens:**
Every default is plausible, and "no output" is indistinguishable from "crash" to a beginner.

**How to avoid:**
Decide the console once (native CDC vs UART bridge), pin `upload_port` and `monitor_port` per environment (glob patterns allowed, e.g. `/dev/cu.usbserial-*`), set `monitor_speed = 115200`.

**Warning signs:**
"Works in the editor, silent over the port I opened"; a second port appearing in `pio device list`; garbled monitor output.

**Phase to address:** P2.

---

### Pitfall 3: Download mode, reset behaviour and the built-in debugger

**What goes wrong:**
The board refuses to behave like a normal USB device. esptool documents that on USB-Serial/JTAG, RTS acts as a core reset which does **not** re-sample the strapping pins — a manually entered download mode can persist after flashing, which reads as "the firmware is broken". Automatic download mode does not happen at all when the app has disabled or repurposed the USB peripheral, or after deep sleep: the device disappears from the OS and recovery is manual BOOT+RESET (GPIO0 needs a strong pull-down against its 45 k internal pull-up). The built-in JTAG dies when firmware reconfigures GPIO19/20, disables `USB_SERIAL_JTAG`, or sleeps, and it conflicts with TinyUSB/USB-OTG on the internal PHY; ESP-IDF documents the `USB_PHY_SEL` eFuse as the permanent switch — **do not burn it**. Missing Linux udev rules or Windows Espressif drivers surface as `LIBUSB_ERROR_NOT_FOUND` / permission denied.

**Why it happens:**
Reset semantics are peripheral-specific, and none of this is visible until a homework touches USB, sleep or JTAG.

**How to avoid:**
Use `--after watchdog-reset` (or power-cycle) instead of assuming a bad flash; document the BOOT+RESET recovery in the repo's hardware reference; check udev/driver setup once on the dev machine; treat the eFuse as untouchable.

**Warning signs:**
Board "will not leave" download mode; the port disappears after a deep-sleep experiment; debug sessions that work until GPIO19/20 are used.

**Phase to address:** P2 (documented recovery), re-verified in P5 for deep-sleep/USB homeworks.

---

### Pitfall 4: Strapping pins, reserved pins, and the N16R8 octal-PSRAM lines

**What goes wrong:**
A pin that "works" at runtime can still brick a boot. GPIO0/3/45/46 are sampled at reset (boot mode, JTAG source, VDD_SPI voltage); the hold time requirement is only **3 ms**, so marginal external circuits fail intermittently, and driving GPIO45 to 1.8 V logic expectations can break flash access. GPIO26–32 are always the SPI0/1 flash bus. On this module the 8-line interface to in-package PSRAM consumes GPIO33–37 — the DevKitC-1 guide explicitly lists **GPIO35/36/37 as unavailable**. ADC2 channels (GPIO11–20) cannot be used while Wi-Fi runs, and GPIO19/20 double as USB D-/D+, so USB + ADC2 + Wi-Fi is a three-way conflict; ADC1 (GPIO1–10) is the safe analog set.

**Why it happens:**
Pin-number tutorials ignore strapping and package-level buses; the N16R8 correction (2026-10-15) is what makes GPIO33–37 off-limits, and the default board variant does not say so.

**How to avoid:**
One reserved-pin list, enforced twice: `include/board_pins.h` as the single source of truth (already an operational invariant in the scaffold), and the generated wiring pin table rejecting GPIO26–37 and warning on GPIO0/3/45/46. `GPIO35/36/37` unavailable is an owner-fixed constraint (PROJECT.md, 2026-10-15).

**Warning signs:**
Intermittent boot failures that disappear when a wire is removed; a wiring diagram that routes anything through GPIO35/36/37; "it works when I hold the board".

**Phase to address:** P2 (reservation), P4 (generated artifacts enforce it).

---

### Pitfall 5: A partition CSV that the pinned core does not ship

**What goes wrong:**
Referencing a table the core does not contain fails the build with "Could not find the file ... with partitions table". `default_4MB.csv` is absent from Arduino core 3.3.12 — the shipped set is `default.csv`, `default_8MB.csv`, `default_16MB.csv`, `default_32MB.csv`, `huge_app.csv`, `minimal.csv`, `no_ota.csv`, `min_spiffs.csv` — and pioarduino's n4r2 board JSON still copies such a value. Because the N16R8 override **requires** a partition decision, this trap sits directly on the required path.

**Why it happens:**
Partition CSVs circulate in forum posts and board JSONs; the file set differs per core version.

**How to avoid:**
Take the CSV name from the pinned core's own `tools/partitions/` directory (or commit a repo-owned CSV next to the project) and record it next to the platform pin.

**Warning signs:**
Build error naming a partition file; a size report showing an 8 MB ceiling on a 16 MB part.

**Phase to address:** P2.

---

### Pitfall 6: A version range where the rulebook says exact pin — and a disputed pairing under it

**What goes wrong:**
The scaffold prescribes `platform = espressif32@^6.0.0` (`.agents/rules/esp32-s3-hardware.md` §2, branch `vl/init`) while its own constitution says "pin every tool and platform to an exact version; never ranges". A range re-resolves on every fresh install, so the toolchain silently moves. Underneath that, **the sources contradict each other on what `espressif32` 7.1.3 actually ships**: one dimension ties v7.1.3 to `framework-arduinoespressif32` 4.30312.261011 (Arduino 3.3.12) + `toolchain-xtensa-esp-elf` 15.2.0; two others read `platform.json@v7.1.3` as `~4.20017.0` (Arduino 2.0.17) + `toolchain-xtensa-esp32` 8.4.0, with 4.30312.261011 being only the registry's newest package. Measured on this machine 2026-10-15 (PROJECT.md): official `platformio/espressif32` 7.1.3 installed with Arduino core 2.0.17 and `framework-espidf` 6.1.0 — but the manifest declares the core as a `~` range, so a reinstall can link a different core build.

**Why it happens:**
Platform releases, registry packages and docs drift apart; a `~` range inside the manifest makes the resolved core invisible in `platformio.ini`.

**How to avoid:**
Pin the exact platform version per environment, then run `~/.platformio/penv/bin/pio pkg list` after the first build and write the **resolved** core/toolchain versions into the repo's own docs. Do not copy any version pairing from research notes into AGENTS.md or a README before that command confirms it.

**Warning signs:**
`platform = ...@^` or `@~` anywhere; a README quoting a framework version nobody measured; two homework projects resolving different cores.

**Phase to address:** P2 (pin + record), enforced again in P3.

---

### Pitfall 7: Toolchain skew that makes shared code compile in one homework and not the next

**What goes wrong:**
Arduino core 2.0.17 runs IDF 4.4.7 at `-std=gnu++11`; core 3.3.12 runs IDF 5.5.5 at `-std=gnu++2b`; the released official platform pins GCC 8.4 xtensa while pioarduino pins GCC 14.2 — warnings, diagnostics and even accepted code differ. Shared modules must therefore target the **intersection** of every environment the repo pins, and each env must pin its platform explicitly. Related and still undecided: the scaffold asserts `Standard: c++17` in `.clang-format` and `C_Cpp.default.cppStandard: c++17` in `.vscode/settings.json` and the workspace file (verified on `vl/init`), but those are formatting/IntelliSense metadata, **not a compile-standard decision** — the repo has not decided what homework and shared code may use, and C++17 code can be formatted and navigated today that the pinned core-2.x toolchain then refuses to build. Unresolved: which Arduino core the course requires (2.x vs 3.x APIs — `ledcAttach`, reworked `analogWrite`) is unknown and changes every homework's code.

**Why it happens:**
Formatting config looks like a language contract; "latest platform" feels safer than a boring pin; the course's API expectations were never checked against the toolchain.

**How to avoid:**
State the C++ standard next to the platform pin as a repo-wide contract (shared code must satisfy the lowest bar in play); ask the instructor which core the course targets before the shared layer grows; compile every shared module once under each pinned env in CI.

**Warning signs:**
`undefined reference` / "not declared" errors in a shared module that builds fine where it was written; a homework that stops compiling after an unrelated platform bump.

**Phase to address:** P3 (contract), verified in P2's build matrix.

---

### Pitfall 8: `lib_extra_dirs` — deprecated, still working, and prescribed by the scaffold

**What goes wrong:**
PlatformIO's docs state it is "Deprecated since version 6.0 ... will be removed in the next major release" and print the replacement in the deprecation note itself (`FooLib=symlink://../../shared-libraries/FooLib`). It still works in Core 6.2.0 — the version measured on this machine — which is exactly why the mistake survives: a repo built on it works today and breaks on the next major. It also makes **every** library in the folder a candidate for every project's include resolution, so one badly named folder can silently change the meaning of an existing `#include` in an unrelated homework. The scaffold prescribes it in four places: `AGENTS.md:236`, `.agents/rules/esp32-s3-hardware.md:142`, `.agents/rules/framework-transition.md:144` and `shared/libs/README.md:55` (all on `vl/init`) — and the `new-homework` skill writes it into every generated `platformio.ini`.

**Why it happens:**
It is the mechanism every older tutorial uses, the deprecation lives below the fold in the docs, and the scaffold carried it forward.

**How to avoid:**
`lib_deps = Name=symlink://../../shared/Name` only, plus a repo-wide grep gate so the string `lib_extra_dirs` cannot reappear. The same applies to `globallib_dir`.

**Warning signs:**
`lib_extra_dirs` in any generated `platformio.ini`; a `#include` resolving to an unexpected library; a platform upgrade that turns a green repo red with no code change.

**Phase to address:** P3, verified mechanically (`pio project config`, grep).

---

### Pitfall 9: The shared library that builds locally but does not link — and stays green anyway

**What goes wrong:**
This is the manifest/source-layout class the focus calls out, and it has several faces:
- A bare folder of sources with no `library.json` is not a package at all; `name` and `version` in that manifest are **Required**.
- With a manifest but a default layout, sources outside the library's `src/` are **not compiled** — headers resolve and the link fails with undefined references. Issue #5493 (2026) is exactly this report, and `lib_ldf_mode` `chain+` and `deep+` both fail to help.
- `file://` dependencies **copy** the library into `.pio/libdeps/<env>/` and PlatformIO never refreshes it when the source changes: a verified rebuild went green in ~0.55 s compiling the OLD code. This is the invisible stale-copy class; only `symlink://` is live.
- The CI variant: `shared/` has no `platformio.ini` ancestor, so a naive "nearest ancestor project" mapping builds nothing when shared code changes. The pre-push hook and CI path filters must parse each `platformio.ini`'s `symlink://` targets to find the consumers — this is precisely the "passes locally, fails (or silently skips) in CI" shape.

**Why it happens:**
PlatformIO's Library Dependency Finder is good enough locally (stale `.pio` state hides the difference) and the failure only appears on a clean clone or a CI runner.

**How to avoid:**
Every shared module is a real library: `library.json` with `name` + `version`, sources under its `src/`, consumed via `symlink://`; a clean-clone build of at least one consumer in CI; a check that fails loudly when an expected `compile_commands.json` is absent.

**Warning signs:**
Undefined-reference errors that "go away" after `rm -rf .pio`; a suspiciously fast rebuild after a shared edit; a CI run that builds no project at all when only `shared/` changed.

**Phase to address:** P3 (mechanism), P7 (change-to-project mapping).

---

### Pitfall 10: The config layer fails silently (extends, extra_configs, build_flags, empty sections)

**What goes wrong:**
Four documented traps, each silent:
- **`extends` does not merge.** "If multiple items specified in the extends field then only values from the latter one will be used" — the docs' own example has `lib_deps1` wiped out by `lib_deps2`. `extends = base, strict_ldf` loses list options.
- **`extra_configs` is globbed against the process CWD**, which PlatformIO sets to the project directory; there is no per-option source tracking (open requests #5384/#5387, Feb 2026). A relative path written inside a shared fragment resolves against the homework project, not the fragment.
- **A missing `extra_configs` file exits 0** — the project quietly loses board/framework/flags (verified in the design review of the rejected shared-`base.ini` design). And **any env-level `build_flags` silently REPLACES the inherited one** (the scaffold's own skill documents this, hence `${env.build_flags}` — keep that idiom everywhere).
- A bare `platformio.ini` at the repo root or inside the shared folder raises `ProjectEnvsNotAvailableError` (no `[env:NAME]`), and empty `[section]` headers in shared fragments broke in 6.1.6 and worsened through 6.1.14 (platformio-core #4884).

**Why it happens:**
The INI layer looks like inheritance; it is concatenation with replace semantics and CWD-relative resolution.

**How to avoid:**
Prefer one `[env]` block plus `${env.x}` interpolation over `extends`; express `extra_configs` paths from each **project's** point of view (or absolute/`~`); never ship empty sections; verify each generated project with `~/.platformio/penv/bin/pio project config`, which prints the resolved board, platform and flags.

**Warning signs:**
A homework that builds with the wrong board or without the warning flags; a "shared" fragment whose edits change nothing; `pio project config` output that does not match the intended env.

**Phase to address:** P1 (layout rules), P3 (fragment conventions), P7 (`pio project config` in the hook/CI).

---

### Pitfall 11: Repo-wide gates with a stale glob and zero WIP tolerance

**What goes wrong:**
Two verified facts from the scaffold collide with the owner's layout decision. First, `scripts/pio-build.sh` loops `hw-*/platformio.ini` and, when it finds none, prints "No homework projects yet - nothing to build" and **exits 0** — under the decided layout (`homeworks/m01-l03-blink`, non-numbered projects also under `homeworks/`) that gate becomes a permanently green no-op unless the glob, the workspace-registration invariant, the CI path filters and the `new-homework` skill are all re-pointed at `homeworks/**/platformio.ini`. Second, the same design runs repo-wide build/check on every push: `pre-commit run --all-files` with the pio hook builds every project, and a homework is WIP most of the week, so a feature branch's first push is red by construction — the documented path by which a solo learner learns `--no-verify` or stops pushing (i.e. loses remote backup).

**Why it happens:**
Scripts encode the naming convention of the scaffold that was abandoned; repo-wide gates are written before a WIP state exists.

**How to avoid:**
Re-point every glob to the decided layout during P1; keep the build hook on pre-push/manual and skip it in CI where the matrix does the real build (`SKIP=pio-build-changed`); write down what must be green for a WIP push versus a merge, and make the gate fail loudly when it matches zero projects.

**Warning signs:**
A green CI run that built nothing; `git push --no-verify` in the shell history; a workspace file that lists fewer homeworks than `homeworks/` contains.

**Phase to address:** P1 (glob/layout), P7 (WIP policy).

---

### Pitfall 12: `pio check` and warning flags — quiet options that report fewer defects

**What goes wrong:**
The static-analysis surface is full of options that look like tuning and behave like switches:
- **`check_patterns` does not exist.** The real option is `check_src_filters` (with `+<PATH>`/`-<PATH>` globs, plus `--src-filters`/`--flags`/`--severity`/`--fail-on-defect`/`--skip-packages` on the CLI). Any config referencing `check_patterns` is silently ignored.
- `check_tool = clangtidy` with no `clangtidy: --checks=...` runs clang-tidy with `--checks=*` — every check in LLVM 19, including `abseil-`/`boost-`/`llvm-`/`fuchsia-` families. Newcomers conclude "the linter is useless" after one run.
- **Setting any cppcheck `check_flags` (even just `--std=c++17`) silently removes `--inline-suppr`, `--platform=unspecified` and the default `--enable=warning,style,performance,portability,unusedFunction`** — the hook reports *fewer* defects while looking unchanged. Restate the defaults whenever `check_flags` is non-empty.
- clang-tidy under `pio check` **never** uses `compile_commands.json`: PlatformIO builds the flag list itself, passes no `-std=`, and passes framework includes with `-I` (not `-isystem`), so findings inside Arduino/ESP-IDF headers are reported under the default `HeaderFilterRegex '.*'`. Scope the regex to the repo's own directories.
- `--skip-packages` removes the framework include paths; PlatformIO's own docs warn parsers can then "fail to parse perfectly valid code and thus provide empty or partial check reports". Diagnostic step, never a default.
- `-Werror` in `build_flags` rather than `build_src_flags` means the next framework/library update adds a warning in code you do not own and the build stops — which trains people to delete the flag. And `-Wconversion`/`-Wsign-conversion` on day one of an Arduino course fire on correct beginner code (`uint8_t` pins, `size_t` lengths, `int` delays); `-Wshadow` and sign conversions are not covered by `-Wall -Wextra`.

**Why it happens:**
The option names invite guessing, and the failure mode of a misconfigured analyzer is silence, not an error.

**How to avoid:**
Keep the check script flag-light until deliberately configured; when configuring, restate the defaults explicitly; plant one known defect and confirm it is reported; on native-USB runs, remember the test-runner caveats in Pitfall 14.

**Warning signs:**
`--checks=*` in hook output; a cppcheck report that shrank after adding flags; a clang-tidy hook that passes in under a second; findings attributed to files under `.pio/libdeps`.

**Phase to address:** P6.

---

### Pitfall 13: Formatter/analyzer version skew decides your diffs, not your config

**What goes wrong:**
Three binaries with three LLVM generations are in play: the pre-commit mirror pins **clang-format v23.1.3** (verified in `.pre-commit-config.yaml` on `vl/init`), PlatformIO's `tool-clangtidy` is **LLVM 19.1.0**, `tool-cppcheck` is **2.22.0**. Config written against one warns or silently differs on another — renames in 19 (`AlwaysBreak*` → `Break*`, `KeepEmptyLines`), 20 (`ReflowComments` `true`/`false` → `Always`/`Never`; `.h` files start being handled as the **C** language), 21 and 22 (`AlignAfterOpenBracket` becomes a bool). The committed `.clang-format` on `vl/init` still uses pre-rename spellings (`ReflowComments: true`, `KeepEmptyLinesAtTheStartOfBlocks`) while its own comment claims clang-format ≥ 14 compatibility. `.h`-as-C in particular silently changes how headers look, and a style placed under a `Language: Cpp` section may no longer apply to them from v20. Separately, **the editor can become the formatter of record**: VS Code's C/C++ extension uses its own bundled clang-format unless `C_Cpp.clang_format_path` is set, and `formatOnSave` is enabled in the scaffold's settings — two devs (or one dev plus one hook) produce two diffs, and neither matches the pinned hook. Bare `clang-format` in CI is worse: ubuntu-24.04 (today's `ubuntu-latest`; becomes 26.04 in Nov 2026) ships 16.0.6/17.0.6/18.1.3, brew ships whatever LLVM is current, and the ESP32 toolchain ships yet another.

**Why it happens:**
Clang tooling versions are invisible until a config option is silently ignored; "format on save" is convenient and unconfigured by default.

**How to avoid:**
Never invoke clang-format outside the pinned hook; run the same `.pre-commit-config.yaml` in CI; keep the main style in the language-less first section; verify with the runner's own `--dump-config` / `--verify-config` and by formatting a header sample on the pinned version; point the editor at the same binary or disable format-on-save. Never rely on the `.clang-format` file alone: `-style=file` is the mirror hook's default, but a missing/uncommitted file silently falls back to LLVM style and rewrites the whole repo.

**Warning signs:**
A commit that reformats hundreds of lines nobody touched; header formatting differing from source formatting; `clang-format --version` in CI printing 18.x; settings drift between `.editorconfig` and `.clang-format` (indent 4/4 today — keep it that way; `max_line_length` is no longer in the EditorConfig spec, so nothing enforces it despite the comment in `.clang-format`).

**Phase to address:** P6.

---

### Pitfall 14: Hook and CI hygiene — the traps that teach `--no-verify`

**What goes wrong:**
A cluster of small, verified traps: mutating hooks (trailing-whitespace, end-of-file-fixer, mixed-line-ending, `clang-format -i`) **rewrite files and report failure on the first run**, so the flow is commit → hook fails → `git add -u` → commit again, and in CI they can only fail (always run with `--show-diff-on-failure`). `require_serial: true` is not optional for the pio hook — pre-commit splits the filename list across processes by default and N parallel `pio` runs race on `~/.platformio` package installs (bound the CI matrix with `max-parallel` too). `language: system` hooks fail confusingly when the binary is missing (`pio`, `cppcheck`) and VS Code's Source Control panel uses a different PATH than the login shell — guard with `shutil.which()` and an install hint. Editing `platformio.ini` or `src_dir` triggers PlatformIO's auto-clean of `build_dir`, so a commit touching the ini means a full rebuild in the hook — correct behaviour, do not "optimize" it. Caching all of `~/.platformio` is tempting but subject to GitHub's 10 GB/repo cache limit and 7-day LRU eviction/thrashing; the official docs cache only `~/.cache/pip` and `~/.platformio/.cache`, and the cache key should include `hashFiles('**/platformio.ini')` with `restore-keys`. `uses: platformio/platformio-action@...` is a **verified 404** — the repository is gone; use the documented manual steps. `detect-secrets` requires the committed `.secrets.baseline` passed as `args: ['--baseline', '.secrets.baseline']` and re-audited rather than regenerated, or every new secret silently becomes "known". The gitleaks hook with `language: golang` bootstraps a Go toolchain on first use. Hooks without an explicit `stages` key inherit `default_stages`. And `pio run` installs missing packages on demand, so a fresh clone's first hooked commit needs network (a cold espressif32 install is hundreds of megabytes).

**Why it happens:**
Each trap is individually reasonable; together they make the gates slow, noisy or silently useless, which is what produces a red-by-default workflow.

**How to avoid:**
Copy the scaffold's working shape (three stages split by cost — verified: `pre-commit` fast/file-scoped, `pre-push` toolchain, `manual` slow/networked in `.pre-commit-config.yaml` on `vl/init`), add `--show-diff-on-failure` in CI, `require_serial` on pio hooks, an explicit `stages` key on every hook, and a cache shape measured rather than guessed.

**Warning signs:**
Coloured hook failures on a clean commit; two `pio` processes in `ps` during a commit; a CI job that re-downloads the toolchain every run; a `.secrets.baseline` regenerated in a commit diff.

**Phase to address:** P7.

---

### Pitfall 15: Agent-file footguns — silent disabling, silent non-loading, silent bloat

**What goes wrong:**
The always-loaded layer can fail without any error:
- **A stray `CLAUDE.md` anywhere at or above the working directory silently disables `AGENTS.md`** for Claude Code (default Project instructions = `claude-md-or-agents-md`). This is the reason the owner's decision is "AGENTS.md only, no CLAUDE.md" — the footgun is latent for anyone who later adds one, including an agent. Confirm with `/memory` or `/context`, never by assumption.
- **Symlinks have sharp edges.** A symlinked `.claude/rules` entry or skill whose target resolves **outside** the working directory is treated as an external import: one-time approval, only non-path-scoped rules load afterwards, and network paths are never followed — which bites when Claude Code is launched inside a homework subfolder instead of the repo root. Broken symlinks fail silently; the documented check is `find .claude -type l ! -exec test -e {} \; -print`. Claude Code's documented symlink support covers `.claude/rules/` and individual skill entries but **not a symlinked skills directory** (the scaffold commits `.claude/rules` and `.claude/skills` as directory symlinks — git mode `120000`, verified) — this is unverified by the docs and must be smoke-tested live.
- **Skill frontmatter is read only when `---` is the file's first line**, and malformed YAML loads the skill with no metadata: `/name` still works, automatic invocation never fires, and nothing reports an error. Spec-validating tools reject extra keys beyond `name, description, license, compatibility, metadata, allowed-tools`; Claude Code accepts more, so a file written here may fail validation in Antigravity or any other harness. Descriptions are truncated at 1,536 chars (`description` + `when_to_use`) and dropped entirely, least-used first, when the 1% listing budget overflows — a buried trigger loses auto-invocation.
- **Context budget is measurable and small**: the 200-line threshold is Anthropic's own, and 42% of surveyed public files exceed it; Lint Leakage (restating formatting/naming rules in prose) appears in 62% of files; Skill Leakage plus Conflicting Instructions raises the odds of Context Bloat by 83%. The scaffold's `AGENTS.md` is **288 lines** on `vl/init` — the artifact the research recommends carrying forward already violates the target it cites, and nothing in the bundle says whether to trim, split or relax it.
- **Cross-harness assumptions do not carry**: Cursor ignores plain `.md` inside `.cursor/rules` (needs `.mdc`), VS Code's nested `AGENTS.md` support is experimental and disabled by default, and Windows clones of committed symlinks degrade to plain text files unless `core.symlinks` is enabled. Writing the always-loaded layer in Ukrainian costs roughly 1.7–2.2x the tokens of English (68–121% overhead) every session — English is both the owner's decision and the cheaper choice.
- **No vendor exemplar exists**: `espressif/esp-idf`, `espressif/arduino-esp32` and the PlatformIO repos ship no `AGENTS.md`, so embedded rule content (strapping pins, IRAM-safe interrupts, watchdog behaviour) must be authored from the chip's own docs.

**Why it happens:**
Discovery, budget and validation are all silent-failure surfaces; the scaffold optimizes for completeness instead of for the 200-line budget.

**How to avoid:**
One root `AGENTS.md` (short), a few reference docs, a few skills; no `CLAUDE.md` and a check that none exists; verify skills appear and load by starting a session in the repo; keep the broken-symlink check in pre-push/manual; avoid per-homework `AGENTS.md` files; never restate linter output in prose; reserve emphasis for the one instruction that keeps getting skipped.

**Warning signs:**
`/context` not listing `AGENTS.md`; a skill that never auto-invokes; an always-loaded file that grows with every homework; contradictory instructions between file, rule and skill; a Windows clone with text files where symlinks should be.

**Phase to address:** P8.

---

### Pitfall 16: What each verification layer cannot see

**What goes wrong:**
Layer confusion produces false confidence. On ESP32-S3, **QEMU explicitly does not emulate the GPIO matrix/IOMUX, I2C, SPI, LEDC, RMT, USB, Wi-Fi or Bluetooth** — it cannot blink an LED, so it proves nothing for most homework content and must stay a boot/RTOS/timer smoke test. **Wokwi** simulates the circuits QEMU cannot, but not Bluetooth, and its free tier is **50 simulation-minutes per rolling 30 days with a 5-minute cap per session** (≈5 full 60-homework sweeps per month); CI runs upload the firmware binary to Wokwi's cloud (deleted after; no opt-out short of on-prem), and the exact tier boundary for VS Code diagram editing is unconfirmed. **Renode is blocked, not suboptimal**: its supported-boards page contains no `esp32` string, the only XTENSA entry is `xtensa-sample-controller`, issues #262/#704/#946 remain open, and PlatformIO's `tool-renode` is stale at 1.13.3. **Hardware-only verification** (flashing the board for every test) is the owner's stated pain, needs a human, and an agent cannot close the loop — it is a pre-submission L4 layer, required for BLE, deep sleep, ADC and timing. Two more runner traps: `pio test` on a native-USB/HWCDC port flakes because the pre-test software reset uses DTR/RTS, which that peripheral interprets differently (docs require >2 s before `UNITY_BEGIN()` on boards without reliable serial reset; use `--no-reset` with a manual reset, or test over the UART bridge), and `test_build_src = yes` is marked **NOT RECOMMENDED** — it forces `PIO_UNIT_TESTING` guards around `main`/`setup`/`loop`; moving logic into `shared/lib` is the actual fix.

**Why it happens:**
"Simulation" sounds like one capability; the layers overlap in name and not in coverage.

**How to avoid:**
Route verification per homework from the course phase list (still unshared): host tests for pure logic, QEMU for boot/RTOS/timer, Wokwi locally for circuitry, hardware for BLE/sleep/ADC/timing — and mark BLE homeworks as host-tests-plus-hardware in their README from day one. Budget Wokwi minutes; do not gate on it per commit (already an owner decision: Wokwi-in-CI deferred).

**Warning signs:**
A green QEMU run cited as proof that a sensor works; a Wokwi quota exhausted by an automated sweep; a homework whose only evidence is a serial log from a simulation.

**Phase to address:** P5.

---

### Pitfall 17: The wiring artifact has no whole-diagram export — and drifts the moment you fake it

**What goes wrong:**
Wokwi does not render a whole diagram to an image: `wokwi-cli` documents only `--screenshot-part` (single part), `@wokwi/client` exposes only `framebufferRead(partId)`, and feature request #345 for exactly this has been open since 2022-04-15. The obvious shortcut — a manual editor screenshot — is not generated and silently drifts from `diagram.json` after any wiring edit, which defeats the one-canonical-source rule. Reimplementing the render (headless browser over `@wokwi/elements`) means rebuilding Wokwi's own `v`/`h`/`*` wire-routing mini-language, including the reverse-order semantics after `*`. Related constraints: `wokwi-cli lint --warnings-as-errors --offline` is the offline validator to keep in pre-commit; empty route arrays let Wokwi route the wires itself and remove the placement problem (the niche `wokwi-autoroute` package is v1.0.0, single-maintainer, README-only — off the critical path); and the free Community licence is aimed at open source (the repo is public, so that fits, but the paid tier boundary for the VS Code diagram editor stays unconfirmed).

**Why it happens:**
Every renderer path looks one step shorter than it is; screenshotting is effortless and wrong.

**How to avoid:**
Treat `diagram.json` as canonical and generate the SVG, the pin table and the Mermaid overview from it (a repo-owned renderer); let Wokwi route wires (empty route arrays); lint the file offline in pre-commit; regenerate and diff in CI so drift is a red build, not a stale image.

**Warning signs:**
A README image that shows a wire the diagram does not have; a manual screenshot in git history; pin tables maintained by hand.

**Phase to address:** P4.

---

### Pitfall 18: The scaffold is verified as files, not as behaviour

**What goes wrong:**
Everything on `vl/init` exists and much of it is correct, but **nothing has ever built, flashed, monitored or tested this hardware end-to-end**, and there is no homework yet. Every claim about the scaffold ("esp32s3 env builds clean", "native env works", "CI green with a real project") is unverified until one acceptance run happens — and without explicit sequencing, a solo learner can spend course weeks on infrastructure (CI matrix, caches, extra analyzers, clangd) instead of the assignments the repository exists for.

**Why it happens:**
Files are cheap to review; the first real build under deadline pressure is where every latent default surfaces at once.

**How to avoid:**
Make P2 end with one recorded end-to-end acceptance run on hardware — build, flash, monitor, the esptool banner, `psramFound()`, and a native test — plus a hook dry run, **before** the first homework is scaffolded. Sequence the corrections: fixes on the required path first (board overrides, symlink deps, exact platform pin), matrix/caches/extra analyzers only at 3+ homeworks.

**Warning signs:**
A repository with more CI configuration than code; "should work" instead of a dated log line; the first homework being the first thing ever flashed.

**Phase to address:** P2 (exit criterion), sequencing across P1-P8.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `lib_extra_dirs = ../shared/libs` (as prescribed by the scaffold) | Two saved lines per `platformio.ini` | Documented removal in the next PlatformIO major plus a global include namespace | Never — `lib_deps = Name=symlink://...` is the same effort |
| `file://` for shared code | No symlink support needed on the host filesystem | Silent stale copies in `.pio/libdeps` (verified ~0.55 s green rebuild of old code) | Never outside a guard framework that the repo does not have |
| Vendoring shared code into every homework (Scaffold-time freeze) | Frozen, reproducible bytes; no live-link risk | No fix-once while shared modules are still being written — every driver fix re-vendored per homework; 200-400 copies | Later, as a per-homework freeze stage triggered by a real need (Stage 1 keeps guard-free `lib/` storage) |
| `test_build_src = yes` to test `src/` | Tests reach code that "lives in the main sketch" | Docs mark it NOT RECOMMENDED; `PIO_UNIT_TESTING` guards around `main`/`setup`/`loop` everywhere | Never — move logic into `shared/lib` |
| Manual editor screenshots as the README wiring image | Zero tooling | Silent drift from `diagram.json` after every wiring edit | Never |
| A shared `workspace_dir` (build + libdeps) across homeworks | One place for artifacts | Two projects needing different versions of the same Arduino library fight over libdeps | Only `build_cache_dir` may be shared — that is the documented cross-project option |
| Committing `.vscode/c_cpp_properties.json`, `launch.json`, `compile_commands.json` | "Reproducible" IntelliSense | Absolute machine-specific paths, "DO NOT MODIFY" headers, per-project DBs read by clangd/hooks from the wrong homework | Never; commit `settings.json`/`tasks.json`/`extensions.json` instead |
| Repo-wide build/check on every branch push | Simple CI | Feature branches red by construction → `--no-verify`, SKIP, or no WIP backups | Only with a decided WIP policy |
| Per-homework `AGENTS.md` files | Local instructions feel close to the code | Configuration smell at directory scale; nested discovery differs per tool and per VS Code setting | Never |
| `--no-verify` / `SKIP=pio-build-changed` as a habit | Unblocks a commit | The gate that exists precisely to catch breakage stops running | Only as the documented, narrow WIP escape hatch |
| Caching all of `~/.platformio` | Fast CI after the first run | GitHub 10 GB/repo limit, 7-day LRU eviction, cache thrashing; the official docs cache only `~/.cache/pip` and `~/.platformio/.cache` | Until measured; then narrow and re-key on `hashFiles('**/platformio.ini')` |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Wokwi CLI | Expecting a whole-diagram image; only `--screenshot-part` exists and #345 is open since 2022-04-15 | Generate the image from `diagram.json` with a repo-owned renderer; use `wokwi-cli lint --warnings-as-errors --offline` for validation |
| Wokwi cloud / licensing | Assuming CI simulation is free and unlimited | Free tier = 50 simulation-minutes per rolling 30 days, 5-minute cap per session; each run uploads the firmware binary to the cloud. CI use stays deferred; the VS Code diagram-editor tier boundary is unconfirmed |
| GitHub Actions | Reaching for `uses: platformio/platformio-action@...` (verified 404, repo gone) | Manual documented steps: checkout, setup-python, `actions/cache`, `pip install --upgrade platformio`. The scaffold pins `actions/checkout@v4`/`setup-python@v5`; the docs read on 2026-10-15 name v7 majors — either is a fine pin, a dead action is not |
| GitHub cache | Caching all of `~/.platformio` keyed on a hook-config hash | Cache `~/.cache/pip` + `~/.platformio/.cache`; key on `hashFiles('**/platformio.ini')` with `restore-keys`; measure before widening |
| pre-commit mirrors | Bare `clang-format` on the runner; missing `.clang-format` silently falls back to LLVM style | Run only the pinned mirror (`v23.1.3`, verified); keep `.clang-format` committed; CI runs the same `.pre-commit-config.yaml` with `--show-diff-on-failure` |
| esptool | Assuming a failed flash is broken firmware | RTS on USB-Serial/JTAG does not re-sample strapping pins — use `--after watchdog-reset` or power-cycle; record the connection banner (flash size, features) as the board's identity |
| PlatformIO registry/docs | Copying version pairings or partition filenames from release notes | `~/.platformio/penv/bin/pio pkg list` after the first build is the only authority; take CSVs from the pinned core's `tools/partitions/` |
| VS Code PlatformIO extension | Trusting the workspace's `platformio-ide.*` keys | The scaffold sets `activateOnlyOnPlatformIOProject` (reported now-removed) and `autoRebuildAutocompleteCache` (docs reportedly `autoRebuildAutocompleteIndex`); the official extension is frozen at v3.3.4 (Jan 2025) while the pioarduino fork is active (2026-05-11) and lists pioarduino under its own `unwantedRecommendations`. Check the installed extension's schema; decide official vs fork deliberately |
| VS Code multi-root workspace | Leaving `platformio-ide.activateProjectOnTextEditorChange` at its default `false` with dozens of homework folders (the scaffold's workspace does not set it, verified) | Set it on, or accept that Ctrl+Alt+B builds the wrong project; also note env names should be project-scoped (`hw01_esp32s3`) — issue #2320 documents the IDE failing to re-sync between projects with identical env names |
| Antigravity | Assuming repo-local agent state | Antigravity keeps per-project state outside the repo (`~/.gemini/config/projects/<id>.json`); `.agents/skills/` mirrored into `.claude/skills/` is the portable arrangement |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Whole-repo gates (`pio run` over every project) | Multi-minute hooks; people stop committing | pre-commit fast, pre-push builds changed projects, CI builds changed + lints all (the owner's decided shape) | Around 5-10 homeworks |
| Cold platform install | First clone/hook commit downloads hundreds of MB | Cache keyed on `**/platformio.ini`; expect network on first hooked commit | First commit on any fresh machine or CI cache miss |
| PlatformIO auto-clean on `platformio.ini`/`src_dir` edit | A one-line ini change triggers a full rebuild in the hook | Accept it as correct behaviour; do not "optimize" it away and chase stale artifacts | Every ini edit |
| Shared `build_cache_dir` misused as `workspace_dir` | Two homeworks needing different library versions clash in libdeps | Share `build_cache_dir` only; keep `libdeps_dir` per project | 2+ homeworks with divergent library versions |
| Wokwi free-tier minutes | Simulation stops mid-sweep; CI job fails on quota | Route simulation to changed homeworks; keep CI simulation out until budgeted | ~5 full 60-homework sweeps per rolling 30 days (5-minute cap per session) |
| `.pio` tree growth across 60 projects | Gigabytes on disk; slow editor indexing | Keep `.pio` ignored and per project; exclude it in workspace settings (the scaffold already does) | Dozens of projects with toolchains kept per env |
| Per-homework clangd databases read from the wrong project | Wrong diagnostics, phantom includes | `pio run -t compiledb` per project; keep `compile_commands.json` gitignored (already in the scaffold's `.gitignore`) | As soon as two homework projects exist |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Committing credentials into a public repository | Wi-Fi/API keys in public git history forever; history rewrite is expensive | `secrets.h`/`include/secrets.h`, `*.pem`, `*.key` ignored (verified in the scaffold's `.gitignore`); secrets scanning (detect-secrets/gitleaks) in the hook with a committed, re-audited `.secrets.baseline` |
| Regenerating `.secrets.baseline` to make a red run go away | Every newly detected secret silently becomes "known" | Re-audit (`detect-secrets audit`); treat baseline edits as reviewable changes |
| Burning the `USB_PHY_SEL` eFuse to "fix" USB debugging | One-way change: the USB PHY source is permanently switched | Never burn eFuses during coursework; recover by other means (Pitfall 3) |
| Publishing solutions the course may not allow | A public solutions repo can be copied by future cohorts — possibly an explicit course violation; the instructor reads this repo | The repo is public by owner decision (2026-10-15) and reviewed by the instructor; the course's publishing rule was never explicitly confirmed — resolve before the first homework is pushed if it is unclear |
| Uploading firmware to a third-party cloud per simulation run | Firmware bytes leave the machine on every Wokwi run (deleted after; no opt-out short of on-prem) | Keep Wokwi to local use; CI simulation stays deferred (owner decision) |
| AI-written assignments presented as the owner's work | Academic-integrity exposure; the point of the course is the learner's skill | Declared in READMEs and commit trailers (owner decision); `guide` mode must stop and must never write homework logic unprompted |
| Driving GPIO45 into a 1.8 V-logic design | Marginal circuits fail intermittently; flash access can break | Treat GPIO45 as a strap pin, not an I/O (Pitfall 4) |

---

## UX Pitfalls

The "users" here are the owner (solo learner), the instructor, and a future employer reading the public repo.

| Pitfall | User Impact | Better Approach |
|---------|-------------|------------------|
| A green CI that built nothing (stale `hw-*` glob under `homeworks/`) | False confidence; breakage discovered at demo time | Make gates fail loudly on zero matches; re-point globs at the decided layout |
| Red-by-construction branch pushes | The owner learns `--no-verify` or stops backing up WIP | Decide and document what must be green for a WIP push vs a merge |
| Silent hook pass (clang-tidy without a compilation database, cppcheck defaults dropped) | The gate feels present but analyzes nothing | Fail loudly when the DB is missing; plant a known defect to prove the hook works |
| The scaffolding skill emits no README (verified: `platformio.ini`, `include/board_pins.h`, `src/main.cpp`, `test/` only) while every homework must be instructor-facing | Re-inventing the writeup each week; missing demo evidence at review time | Extend the skill to emit the README skeleton (what/how/wiring/verify/evidence) from day one |
| Ctrl+Alt+B builds the wrong homework in a many-folder workspace | Wasted debugging time, wrong flashing | Set `platformio-ide.activateProjectOnTextEditorChange`; project-scoped env names |
| Stale wiring screenshots | Miswiring from documentation that lies | Generate from `diagram.json`; diff in CI |
| English-only artifacts vs a possibly Ukrainian-language course | Reports the instructor cannot grade as expected | Unconfirmed — ask the instructor; owner decision is English repo artifacts, which may need a per-homework Ukrainian report exception |
| No evidence contract for demo/defence | Live demo becomes improvisation | Decide the evidence set (serial log, photo/video, wiring table) and where media lives (git vs LFS vs links) before it accumulates |

---

## "Looks Done But Isn't" Checklist

- [ ] **Board identity:** Often missing the N16R8 overrides — verify `pio run` size report near 16 MB, `psramFound()` true, and the esptool banner recorded in the README (GPIO35/36/37 excluded from the pin table).
- [ ] **Console:** Often missing the CDC-vs-UART decision — verify output appears on the pinned `monitor_port` at 115200 and that `upload_port`/`monitor_port` are explicit, not auto-detected.
- [ ] **Platform pin:** Often missing exactness — verify no `@^`/`@~` anywhere and that `pio pkg list`'s resolved core/toolchain is written down.
- [ ] **Shared dependency:** Often missing the manifest/layout — verify each shared module has `library.json` with `name`+`version`, sources under its `src/`, consumed only via `symlink://`, and links after `rm -rf .pio`.
- [ ] **Shared change mapping:** Often missing in CI — verify a commit touching only `shared/` actually builds its consumers (and that the gate fails when it matches zero projects).
- [ ] **Config resolution:** Often missing proof — verify `pio project config` shows the intended board, platform and flags for a freshly scaffolded project.
- [ ] **Static checks:** Often missing a real defect sample — verify `pio check` runs with explicit `--checks=`, cppcheck defaults restated, and a planted bug is reported.
- [ ] **Formatter parity:** Often missing the version check — verify `clang-format --version` inside the hook equals the pinned mirror and that a header sample formats to zero diff.
- [ ] **Hooks:** Often missing `require_serial`/`stages`/`--show-diff-on-failure` — verify by making a deliberate violation and watching CI explain it.
- [ ] **Agent layer:** Often missing the load proof — verify `/context` lists `AGENTS.md`, no `CLAUDE.md` exists anywhere at or above the cwd, all skills appear and load, and the broken-symlink check passes.
- [ ] **Verification routing:** Often missing the per-layer honest label — verify BLE/sleep/ADC homeworks say "host + hardware only" and no QEMU result is used as proof of peripherals.
- [ ] **Submission state:** Often missing a freeze point — the owner decided git history is sufficient (no tags, 2026-10-15); verify each homework's final commit is identifiable in the log before post-feedback edits land.
- [ ] **Acceptance run:** Often missing entirely — verify one dated end-to-end run (build → flash → monitor → native test → hook dry run) exists before the first homework is scaffolded.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong board variant shipped in an env | LOW | Add the overrides, `rm -rf .pio`, rebuild, re-record the banner; no code changes |
| Download mode stuck / board invisible | LOW | `--after watchdog-reset`, or BOOT+RESET with GPIO0 pull-down, or power-cycle; document it once |
| Shared library links locally, fails on clean clone | MEDIUM | Move sources under the library's `src/`, add `library.json` fields, drop `file://`, rebuild from a clean clone |
| `lib_extra_dirs` in N homeworks after deprecation removal | MEDIUM | Sed the ini files to `lib_deps = Name=symlink://...`; verify each project with `pio project config`; add a grep gate |
| Config layer silently dropping flags/board (missed `extra_configs`, replaced `build_flags`) | MEDIUM | Diff `pio project config` against intent; restore `${env.build_flags}`; never use empty sections |
| Formatter divergence across machines/CLIs | LOW-MEDIUM | Re-run the pinned hook over the tree once, commit the reformat as its own commit, set `C_Cpp.clang_format_path` or disable format-on-save |
| Stale `.pio`/`compile_commands.json` producing phantom results | LOW | `rm -rf .pio` per project; regenerate `compiledb`; keep the DB gitignored |
| Red-by-construction CI teaching `--no-verify` | MEDIUM | Introduce the WIP policy (skip incomplete homeworks, build-all on main/PR only), make the failure named and actionable |
| Wrong-project IDE builds across many folders | LOW | Enable `activateProjectOnTextEditorChange`; project-scoped env names |
| A wiring image that drifted from `diagram.json` | LOW | Regenerate from the canonical file; add the drift diff to CI |
| Burned eFuse / hardware damage | HIGH | Only recovery is different hardware — prevention (Pitfall 3/4) is the strategy |
| A stray `CLAUDE.md` disabling `AGENTS.md` | LOW but silent | Delete it (or rename to `CLAUDE.local.md`, gitignored); confirm via `/context`; add a repo check |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1 Board identity & flash/PSRAM overrides | P2 | esptool banner recorded; size report near 16 MB; `psramFound()` true in the acceptance run |
| 2 PSRAM flags, memory type, partition CSV | P2 | Boot log clean (no boot loop); partition CSV exists in the pinned core; `pio run` green on a clean checkout |
| 3 Console, ports, download mode, JTAG | P2 | One recorded flash+monitor run on the pinned port; recovery steps written in the hardware reference |
| 4 Strapping/reserved/octal-PSRAM pins | P2, enforced in P4 | `board_pins.h` lists reservations; a wiring edit targeting GPIO35/36/37 fails validation |
| 5 Partition CSV / core file set | P2 | `pio run` green; CSV name matches the pinned core's `tools/partitions/` |
| 6 Exact platform pin + resolved versions | P2, re-checked in P3 | No ranges in any `platformio.ini`; `pio pkg list` output committed to the docs |
| 7 Toolchain skew & C++ standard contract | P3 | Every shared module compiles in each pinned env; the standard is stated next to the pin |
| 8 `lib_extra_dirs` | P3 | `grep -r lib_extra_dirs` empty; `pio project config` clean |
| 9 Manifest/source-layout/stale-copy traps | P3, mapping in P7 | Clean-clone build of a consumer succeeds; a `shared/`-only commit builds its consumers in CI |
| 10 Config-layer silent failures | P1, P3 | `pio project config` matches intent on a fresh project |
| 11 Stale repo-wide globs & WIP tolerance | P1, P7 | The gate fails loudly on zero matches; WIP policy documented and exercised once |
| 12 `pio check`/warning-flag foot-guns | P6 | Explicit `--checks=`, restated cppcheck defaults, a planted defect reported |
| 13 Formatter/analyzer skew | P6 | Hook-version check in CI; header sample formats to zero diff |
| 14 Hook/CI hygiene | P7 | Deliberate violation shows a readable CI diff; cache size and job time measured |
| 15 Agent-file footguns | P8 | `/context` shows `AGENTS.md` and no `CLAUDE.md`; skills load; broken-symlink check runs |
| 16 Verification-layer limits | P5 | Per-homework layer routing documented; BLE labelled hardware-only; Wokwi minutes budgeted |
| 17 Wiring artifact generation/drift | P4 | Regenerate from `diagram.json` → zero diff; `wokwi-cli lint --offline` green |
| 18 Unverified scaffold | P2 exit criterion | One dated end-to-end acceptance run before the first homework |

---

## Rejected Alternatives (with the concrete reason each lost)

These are settled; the roadmap must not re-open them without new evidence.

| Rejected option | Concrete reason it lost |
|-----------------|-------------------------|
| Wokwi whole-diagram image / manual editor screenshots | No whole-diagram render exists (`--screenshot-part` only; `@wokwi/client` only `framebufferRead(partId)`; feature request #345 open since 2022-04-15); manual screenshots drift silently |
| Headless browser (Playwright) over `@wokwi/elements` | Requires reimplementing Wokwi's `v`/`h`/`*` wire-routing mini-language (including reverse-order semantics after `*`) plus a browser dependency in CI — high cost for a look; empty route arrays remove the problem |
| tscircuit as the canonical wiring source | TSX input cannot be generated from `diagram.json` without a converter we write (second source of truth); auto-layout officially beta; JLCPCB parts engine returned nothing usable for SSD1306/BME280/HC-SR04; pre-1.0 with thousands of releases. Kept only as an optional renderer fed from `diagram.json` |
| KiCad as the authoring path (SKiDL / netlistsvg / atopile) | `kicad-cli` is a renderer only — no netlist-to-schematic converter; netlistsvg's npm release frozen since 2020-12-12; kicad-skip stale (2024); kicad-python is a live-app IPC API; atopile pre-release and PCB-oriented |
| Fritzing headless export | Qt GUI whose only batch mode is folder-wide `fritzing -svg folder`; Linux CI needs xvfb; no official container/action; `.fzz` authoring means emitting connector GUIDs an LLM cannot verify |
| Mermaid / D2 / Graphviz / PlantUML as **the wiring diagram** | Node graphs cannot express pin numbers, power rails, pull-ups or which header hole — a reader can mis-wire from them. Mermaid kept only as the README overview (the only one GitHub renders natively and VS Code 1.121 previews built in) |
| Image-generation models / hand-authored SVG | They invent pin labels and have no validation surface — unusable as engineering documentation |
| Renode as an ESP32-S3 emulator | Zero ESP32 support (no `esp32` on the supported-boards page; only XTENSA entry is `xtensa-sample-controller`; issues #262/#704/#946 open; `tool-renode` stale at 1.13.3). Blocked, not suboptimal |
| QEMU as the **primary** hardware-free gate | On ESP32-S3 it does not emulate GPIO matrix/IOMUX, I2C, SPI, LEDC, RMT, USB, Wi-Fi or Bluetooth — cannot blink an LED. Kept narrowly as boot/RTOS/timer smoke |
| Hardware-only verification | Needs the board plugged in and a human; an agent cannot close the loop. Kept as pre-submission L4, mandatory for BLE/deep-sleep/ADC/timing |
| `lib_extra_dirs` (any use) | Deprecated since Core 6.0, removal slated for the next major; makes every library in the folder a candidate for every project's include resolution |
| `test_build_src = yes` | Docs mark it NOT RECOMMENDED; forces `PIO_UNIT_TESTING` guards around entry points; moving logic to `shared/lib` is the real fix |
| `wokwi-autoroute` for wire placement | Unofficial v1.0.0 single-maintainer package, README-only docs; empty route arrays already solve it — off the critical path |
| KiCad ERC as a second electrical validator | Viable later (documented exit codes, headless `sch export svg`) but an extra heavyweight toolchain with historical xvfb caveats for marginal proof at homework scale |
| **Vendored Freeze with a lock-file guard (Design 2) as day-1 default** | Won archive-integrity (9/10) and agent-operability (8/10) but lost solo-maintenance (5/10, last): compiled bytes live in a gitignored `.pio` copy whose equality with `vendor/` is asserted by a ~60-line hand-written pre-script load-bearing for every build — if it breaks, the failure mode is the silent staleness it exists to prevent; 400-600 lines of tooling, per-homework adoption ceremony, 200-400 vendored copies. Its guarantee survives as a later freeze stage in guard-free `lib/` form |
| **Sealed Snapshots (Design 3) as day-1 default** | Cleanest freeze (lib/-vendored code compiles in place, no guard) and ranked 2nd on solo-maintenance (7/10), but scaffold-time vendoring means no fix-once while shared modules are still being built (every driver fix re-vendored per homework); its seal is a gated ritual the design itself predicts will be skipped, degrading silently; its "exact pin" claim is half-true (the platform manifest declares the core as a `~` range) and its hash checks are blind to the migration's most natural mechanical edits. Best parts kept: guard-free `lib/` storage + `SHARED.lock` provenance |
| **Declared live-link deps via a shared `tooling/pio/base.ini` (Design 4)** | Best pure agent-operability, ideas absorbed, but its config layer puts shared mutable state (platform pin, board, framework, warning flags) in one file outside every homework — editing it retroactively changes all 60 builds while `git log homeworks/...` shows nothing; two verified silent traps: a missing `extra_configs` file exits 0, and env-level `build_flags` replaces the inherited `-Wall -Wextra`. Both judges that priced silence ranked it last or near-last |
| `file://` local folder deps without a guard | Verified silent staleness: PlatformIO copies into `.pio/libdeps/<env>/` and never refreshes (a rebuild compiled the OLD code in ~0.55 s). Safe only inside a guard framework the repo does not have |
| git submodules for shared code | A repository cannot cleanly submodule itself; 60 submodules is unmaintainable solo; a clone without `--recursive` (or a GitHub tarball) yields a broken build — the opposite of the requirement. One commit graph already gives the matching-pair guarantee |
| Per-module semver / private registry / committed version pins | The owner's stated cost they cannot pay; registry deps re-resolve unless pinned, local deps need no registry. The commit is the version; a per-homework freeze adds only a copy plus a SHA record, and only when needed |

---

## Contested and Falsified Claims

Keep these marked; do not let a plan depend on the un-settled half.

| Claim | Status | Settle by |
|-------|--------|-----------|
| `espressif32` 7.1.3 ships Arduino core 3.3.12 (`4.30312.261011`, toolchain 15.2.0) **vs** 2.0.17 (`~4.20017.0`, toolchain 8.4.0) | **Contradictory** across sources; one dimension's numbers are internally inconsistent with the manifest readings in the others | `~/.platformio/penv/bin/pio pkg list` after the first build; record the resolved core/toolchain (PROJECT.md records 7.1.3 + 2.0.17 + IDF 6.1.0 as installed on 2026-10-15) |
| "PlatformIO is not installed on this machine" | **Falsified** — measured: PlatformIO Core 6.2.0 at `~/.platformio/penv/bin/pio` | Already measured (2026-10-15); do not re-scaffold around the false claim |
| "pre-commit 4.7.0 is installed" | **Falsified** — measured: 4.6.0 at `~/.local/bin/pre-commit`, and CI pins 4.6.0 | Measured 2026-10-15; upgrade only deliberately and re-pin CI |
| Symlinked `.claude/skills/` directory is supported | **Unverified** — documented support covers `.claude/rules/` and individual skill entries, not a symlinked skills directory; the scaffold uses directory symlinks (git mode `120000`) | Live smoke test: start a session in the repo, confirm the skills appear and load; keep the broken-link check in pre-push/manual |
| VS Code workspace keys `platformio-ide.activateOnlyOnPlatformIOProject` / `autoRebuildAutocompleteCache` | **Disputed** — reported removed / reportedly renamed (`autoRebuildAutocompleteIndex`); the official extension is frozen at v3.3.4 (Jan 2025) while the pioarduino fork is active (2026-05-11) | Inspect the installed extension's settings schema; decide official vs fork deliberately |
| Board revision (RGB LED GPIO48 vs GPIO38) | **Unresolved** — arduino-esp32's generic variant assumes one of them | Silkscreen/model marking, plus the P2 acceptance run |
| ADC2 usable alongside Wi-Fi on ESP32-S3 | **Contested** — datasheet v2.2 says ADC2 cannot be used while Wi-Fi is active; another source cites ESP-IDF `adc_oneshot_read()` arbitration between the Wi-Fi driver and the ADC2 oneshot driver | Keep the conservative ADC1 rule (GPIO1-10) or verify on hardware with the pinned core/IDF |
| Arduino core 2.x vs 3.x as the course target | **Unknown** — changes every homework's APIs (`ledcAttach`, reworked `analogWrite`) | Ask the instructor / inspect course example code before the shared layer grows |
| Wokwi CI simulation visibility gating; VS Code diagram editor tier boundary | **Unconfirmed (medium confidence)** — free Community licence is aimed at open source; one source says the VS Code diagram editor needs Hobby+ (~EUR 5.6/mo annual, 200 min); "unlisted projects" is paid | Verify against Wokwi's current pricing before enabling any CI simulation |
| CI cache size / job time under the current all-`~/.platformio` key | **Unmeasured** | Measure cache size and job time, then re-key on `platformio.ini` files and narrow paths |
| The scaffold's `AGENTS.md` (288 lines, measured on `vl/init`) against the ≤~200-line target and the 200-line Context Bloat threshold | **Violated by the artifact recommended for adoption** | Decide: trim, split into references, or treat the target as soft — before P8 starts |
| Language of grader-facing reports (English repo artifacts vs a possibly Ukrainian-language course) | **Unresolved** — could conflict with a course requirement | Ask the instructor |
| Submission/grading contract (repo link vs LMS upload vs zip vs live demo) | **Unresolved for this repo's shape** — PROJECT.md states the instructor reviews the public repo and demos in class (2026-10-15) | Confirm nothing else is expected; if the grader expects sketches, the tooling design changes |

---

## Sources

- PlatformIO Core documentation and deprecation notes (verified live 2026-10-15): `lib_extra_dirs` deprecated since 6.0, `extends` latter-wins semantics, `extra_configs` CWD globbing, check options (`check_src_filters`, no `check_patterns`), cppcheck/clang-tidy defaults, cache guidance.
- PlatformIO issue tracker: #5493 (library sources outside `src/` not compiled), #5384/#5387 (`extra_configs` path resolution), #4884 (empty config sections, 6.1.6+), #2252/#2320 (VS Code project activation and env-name re-sync).
- Espressif documentation: ESP32-S3-DevKitC-1 user guide (GPIO35/36/37 unavailable), ESP32-S3 datasheet v2.2 (strapping pins, ADC2 vs Wi-Fi), USB-Serial/JTAG reset semantics, eFuse `USB_PHY_SEL`.
- Wokwi: `wokwi-cli` and `@wokwi/client` reference, feature request #345 (whole-diagram render, open since 2022-04-15), pricing/tier pages.
- QEMU ESP32-S3 machine documentation (peripheral coverage); Renode supported-boards page and issues #262/#704/#946.
- Anthropic Claude Code documentation (AGENTS.md/CLAUDE.md discovery, `.claude` symlink semantics, skill frontmatter and listing budget) and the agent-context research the findings cite (200-line threshold, Lint/Skill Leakage percentages); Agent Skills spec key list.
- Local measurements on this machine (2026-10-15): `pio 6.2.0` at `~/.platformio/penv/bin/pio`, `pre-commit 4.6.0`, branch `vl/init` contents — `.clang-format`, `.pre-commit-config.yaml` (mirrors-clang-format `v23.1.3`), `.vscode/settings.json`, `homework.code-workspace`, `scripts/pio-build.sh`, `.agents/skills/new-homework/SKILL.md`, `AGENTS.md` (288 lines), committed `.claude/rules` and `.claude/skills` symlinks.
- Design-review verdicts from the shared-code architecture study (four candidate designs, judge lenses: archive-integrity, agent-operability, solo-maintenance).
- Two findings in the source bundle were falsified by measurement (PlatformIO installed; pre-commit 4.7.0) and are recorded here explicitly rather than inherited.

---
*Pitfalls research for: PlatformIO/ESP32-S3 coursework monorepo*
*Researched: 2026-10-15*
