# Feature Research

**Domain:** personal embedded-course coursework repository — agent-operated PlatformIO / ESP32-S3 homeworks, consumed by an instructor, driven by two agent harnesses
**Researched:** 2026-10-15
**Confidence:** MEDIUM — tool versions, commands and failure modes are high-confidence (each verified live on 2026-10-15); the board-derived facts and several CI/Wokwi facts are not. See "Discrepancies To Resolve" and the per-row notes.

Scope of this document: the capabilities the repository itself must provide. Research inputs (three workflows, archived at `/tmp/gsd-research-src/features.json`) were produced before the owner's correction that the module is **ESP32-S3-WROOM-1 N16R8** (16 MB quad flash, 8 MB octal PSRAM, so GPIO35/36/37 are consumed). Where a slice was written against the N8 assumption or against a different toolchain pin set, that is marked below rather than silently rewritten.

## Feature Landscape

### Table Stakes (Users Expect These)

Missing any of these and the repository is not a coursework repository — a homework cannot be built, explained or handed in.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Per-homework self-contained PlatformIO project | The instructor's unit of review is one homework; the owner's unit of work is one homework | LOW | `homeworks/m01-l03-blink/` (module-lesson-slug; non-numbered projects use a different prefix in the same folder). Each carries `platformio.ini`, `src/`, `test/`, `diagram.json`, `wokwi.toml`, `verify.sh`, README. Buildable from the root: `pio run -d homeworks/m01-l03-blink`. **Depth rule:** every project sits exactly one level below `homeworks/`, because `../../shared/lib/<name>` is a relative path in every `lib_deps` line — moving a project deeper breaks every link line (loudly: `PackageException` before compiling). |
| N16R8 board overrides in every environment | PlatformIO's `board = esp32-s3-devkitc-1` is the N8 variant (8 MB flash, no PSRAM); with the real module the default configuration is wrong | MEDIUM | Override flash size, partition table and `qio_opi` PSRAM flags per environment. Research slice wf2 set Wokwi's `flashSize: "8"`; with N16R8 it must be `"16"` plus `psramType: "octal"`. Exact override values are a phase-1 task (not resolved by any slice). |
| One VS Code multi-root workspace | The owner's stated workflow: repo root + shared libraries + one folder per homework, one window | LOW | `homework.code-workspace` at the root. It currently contains a single stale entry pointing outside the repo (`../../../Documents/PlatformIO/Projects/1_3-Blink`) and must be regenerated to list the root, `shared/`, and every homework folder. |
| Shared code as real PlatformIO libraries | Reuse without copies; a fix once reaches every consumer | LOW | `shared/lib/<name>/` with `library.json`, consumed as `lib_deps = emb_log=symlink://../../shared/lib/emb_log`. One line per library **including transitive ones** — the LDF chain does not follow an include that exists only inside another library's `.cpp` (verified failure: `fatal error: emb_hal.h: No such file or directory`). `symlink://` compiles shared sources in place and writes only a `.pio/libdeps/<env>/<name>.pio-link` JSON pointer — no second copy that can go stale. |
| Hardware-abstraction seam in shared code | The stated Arduino → ESP-IDF migration must be a backend swap, not a rewrite | MEDIUM | `shared/lib/` code takes hardware through narrow interfaces (`emb_hal`, `emb_hal_arduino` now, `emb_hal_idf` later) and contains **no** `Arduino.h`, `esp_*`, `driver/` or `freertos/` includes. This is the enabling condition for the whole L1 layer, not a style preference. |
| One canonical `diagram.json` per homework | The picture, the pin table and the simulation must not be able to disagree | LOW | Agent-authored, flat JSON, committed. Conventions the generator emits: board part `board-esp32-s3-devkitc-1`; bare GPIO pin names (`"esp:4"`, never `D4`); `flashSize` `"16"` + `psramType` `"octal"` for N16R8; every connection's 4th element `[]` (never hand-author the `v`/`h`/`*` route mini-language); `left`/`top` at part level, never `x`/`y` and never inside `attrs`; part ids split `wokwi-*` (generic parts) / `board-*` (dev boards). |
| Offline diagram lint gate | Wiring errors must fail before they reach a README | LOW | `wokwi-cli lint homeworks/<hw>/diagram.json --warnings-as-errors --offline`. `--offline` skips the board-definition download, which is what makes it pre-commit-viable (local, token-free). |
| Generated wiring artifact per homework | "Recall how to wire a given module in minutes" is priority #1 one year out | MEDIUM | Generated **from `diagram.json`**, never hand-drawn: `homeworks/<hw>/docs/wiring.svg` (board substrate, connected pins highlighted, each module a labelled box, one labelled wire per connection) and `homeworks/<hw>/docs/netlist.md` (Net \| GPIO \| Header J1/J3 + position \| Module pin \| Direction \| Voltage \| Notes). Wokwi has **no** whole-diagram image export (confirmed three ways: CLI documents only `--screenshot-part`; `@wokwi/client` exposes only `framebufferRead(partId)`; feature request wokwi-features #345 open since 2022-04-15), so the SVG is ours, not a screenshot. |
| Mermaid overview in the README | A one-glance topology before the detail | LOW | Agent-authored, not generated, not under the drift gate. Mermaid is the only diagram language GitHub renders natively and VS Code 1.121 previews built in. Overview only — never the sole wiring reference (node graphs cannot express header holes, pull-ups or rails). |
| Pinned static checks | "Pinned once and enforced" is an owner decision; version drift silently changes results | MEDIUM | clang-format + clang-tidy + cppcheck + compiler warnings, all pinned. clang-format via `pre-commit/mirrors-clang-format` rev `v23.1.3` (that rev pip-installs exactly `clang-format==23.1.3`; the PyPI wheel and LLVM 23.1.3 both released 2026-10-06). A committed `.clang-format` is mandatory — the file has **no version key**, so the pin lives outside it. PlatformIO's bundled `tool-clangtidy` is `1.190100.0` = LLVM 19.1.0 (2024-09-19), three majors behind; validate every check name against that binary. |
| Two-stage local hooks | Owner decision: commits stay cheap, breakage is still caught before it leaves the machine | MEDIUM | `.pre-commit-config.yaml` with `default_install_hook_types: [pre-commit, pre-push, commit-msg]`. See "Hook Stage Split" below for the contents and for the disagreement between slices. |
| CI that builds changed projects and lints everything | The authoritative, machine-checked record; also the instructor-visible signal | MEDIUM | GitHub Actions via the documented manual install (**`platformio/platformio-action` is 404 — the repository no longer exists**; any `uses: platformio/platformio-action@v1` snippet found online is dead): `actions/checkout@v7`, `actions/setup-python@v7`, `actions/cache@v4` on `~/.cache/pip` + `~/.platformio/.cache` keyed `${{ runner.os }}-pio`. Changed projects discovered from `**/platformio.ini`. |
| Instructor-facing README per homework | The instructor reviews through the public repo; the demo/defence happens in class | LOW | See "Per-Homework Deliverable Contract" below. |
| AI participation declared | Owner decision; also what keeps the git history honest | LOW | Stated in each homework README and in commit trailers (Zephyr's AGENTS.md is the model: never fabricate `Signed-off-by`, one `Assisted-by` trailer, state what was not tested). Public repo `VLoktiev-EMB/homework`. |
| Cross-harness agent rules | Claude Code is primary, Antigravity must work nearly as well | MEDIUM | Short `AGENTS.md` at the root as the single source of truth, plus skills. Owner decision: **no `CLAUDE.md`** — research nuance to preserve: a `CLAUDE.md` anywhere at or above the working directory silently switches `AGENTS.md` off for Claude Code unless Project instructions is set to `claude-md-and-agents-md`; with no `CLAUDE.md` at all, Claude Code (v2.1.277+, reliably v2.1.281+) reads `AGENTS.md` natively. |
| Host unit-test environment | Free, offline, milliseconds — the highest-value verification per unit of effort, and it forces the seam | MEDIUM | `[env:native] platform = native` with `test_ignore = test_device`; `[env:esp32s3]` with `test_ignore = test_host` (one source tree, suites partitioned by capability). Run: `pio test -e native --junit-output-path build/reports/host.xml`. Note the research flag: `pio test -e native` pulls Unity from the network unpinned unless it is pinned. |
| One scaffolding skill, two modes | Owner decision, and the mechanism by which a 60-homework repo gets built consistently | HIGH | `guide` (teaches, stops, never writes homework logic unprompted) / `auto` (one-shot, no questions). An unspecified request must ask. Details in "The Two-Mode Scaffolding Skill" below. |

### Differentiators (Competitive Advantage)

Not required for the repo to work; these are what make 60 homeworks stay coherent under agent authorship.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Pin validation against a machine-readable board database | Turns the N16R8 constraint (GPIO35/36/37 dead) and 20-odd chip traps into a build-time check instead of prose an agent will skip | MEDIUM | `node tools/check-pins.mjs <hw>` validating every net against `shared/hardware/esp32-s3-devkitc-1-pins.json` + constraints. Rejects: GPIO22–34 (not on the headers; GPIO26–32 are in-package flash/PSRAM), GPIO35/36/37 on octal-PSRAM modules, external drive of strapping GPIO0/3/45/46, 5 V logic on a GPIO without a stated level shifter (abs max 3.6 V), and ADC2 (GPIO11–20) + WiFi in one homework. Also: ESP32-S3 has **no input-only GPIOs** — never write "GPIO46 is input-only". |
| Render drift guard in CI | The README image can never be a stale hand-edited file | LOW | CI re-runs `node tools/render-diagram/render.mjs <hw>` and fails on `git diff --exit-code -- <hw>/docs`. Generated files are never hand-edited; `diagram.json` and `docs/` are committed together. |
| Hardware-seam grep as a hook | Prevents L1 from silently degrading over 60 homeworks | LOW | Fail if `Arduino.h`, `esp_`, `driver/` or `freertos/` appear under `shared/lib`. This is what keeps the seam real after week 20. |
| L2 QEMU boot smoke wired as a normal test env | Free, offline proof that the real merged image boots, with results in the same format as L1 | HIGH | `[env:esp32s3-qemu]` with `test_testing_command`, run as `pio test -e esp32s3-qemu --without-uploading`. Requires a merged image: `esptool --chip esp32s3 merge_bin --fill-flash-size 16MB 0x0 bootloader.bin 0x8000 partitions.bin 0x10000 firmware.bin` (QEMU accepts only 2/4/8/16 MB images; offsets confirmed from the platform-espressif32 builder source), run with `qemu-system-xtensa -nographic -machine esp32s3 -drive file=flash_image.bin,if=mtd,format=raw -global driver=timer.esp32c3.timg,property=wdt_disable,value=true`. Vendor the prebuilt `espressif/qemu` binary under `tools/qemu/` (no PlatformIO package exists — `tool-qemu-xtensa` is 404) with a per-runner-OS fetch script. |
| L3 Wokwi behavior + wiring simulation | The only layer that can see the wiring at all (GPIO, I2C, SPI, OneWire, PWM, displays, WiFi) | HIGH | `wokwi-cli homeworks/<hw> --expect-text "…" --timeout 15000 --timeout-exit-code 43`, or a scenario YAML (`expect-pin`, `set-control`, `wait-serial`, `take-screenshot` with `compare-with`). Scenarios are officially **ALPHA** — pin `wokwi-cli` (v0.28.1 as of 2026-10-15). Default timeout exit code is **42**, so keep 42 = timeout distinct from assertion failure (default is 42, not 1). |
| Per-homework `verify.sh` declaring which layers apply | Makes verification a declared contract instead of a habit, and keeps residual risk visible | LOW | Names the layers that apply and what each is expected to prove; CI enforces the automatable ones. Routing that the research proposes: GPIO/peripherals → L1+L3 (QEMU is useless there); I2C/SPI/OneWire → L1+L3; WiFi → L1+L2+L3; BLE → L1 then L4; RTOS/timers → L1+L2+L3 with deep sleep always L4. |
| Machine-readable board facts under `shared/hardware/` | Agents skip prose under context pressure; a check cannot | LOW | The pin database plus the constraint list as data files that `check-pins.mjs` and the scaffolding skill both read. The 8-input questionnaire collapses to reading this file plus one owner confirmation. |
| `diagram.json` → optional IEC-style schematic sheet | A true schematic is what a portfolio-level reader recognises | HIGH | Only via a converter we write (`tools/render-diagram/to-tsx.mjs`) feeding `npx tsci export … -f schematic-svg`, because tscircuit's input is TSX and it cannot read `diagram.json`. tscircuit auto-layout is officially beta, its parts engine has no SSD1306/BME280/HC-SR04, and it is pre-1.0 with near-daily releases. **Deferred** until the base pipeline runs and a real schematic sheet is confirmed wanted. |
| Rotating nightly Wokwi subset | Extends L3 coverage to untouched homeworks without a full sweep | MEDIUM | ~5 homeworks/night ≈ 1 min/night ≈ 30 min/month of the 50-minute free window. **Deferred** with Wokwi-in-CI. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| A Wokwi-look wiring image (editor screenshot, whole-diagram export, or headless-browser render of `@wokwi/elements`) | It is the picture people expect from Wokwi | No whole-diagram render exists (see above); manual screenshots are not generated and drift silently after any wiring edit; the browser route means reimplementing Wokwi's `v`/`h`/`*` routing mini-language (including reverse-order semantics after `*`) plus a browser dependency in CI | Our deterministic, repo-owned, no-browser renderer over `diagram.json`; letting Wokwi route (empty route arrays) removes the routing problem entirely |
| `tscircuit` TSX as the canonical wiring source | Schematic-grade output, one file | TSX is its *input*, so it cannot be generated from `diagram.json` without a converter we write — a second source of truth that drifts; auto-layout is beta; missing parts | `diagram.json` canonical; TSX generated only if a real schematic sheet is wanted |
| KiCad / SKiDL / netlistsvg / atopile as the authoring path | Real EDA output, ERC | `kicad-cli` is a renderer only — KiCad has no netlist→schematic path; SKiDL's SVG route shells out to netlistsvg (npm release frozen 2020-12-12); `kicad-skip` stale (2024); `kicad-python` is a live-app IPC API; atopile pre-release | Keep the diagram pipeline in-repo; KiCad ERC only as a later second-stage validator on tscircuit's export, if ever |
| Fritzing (.fzz) with headless export | Familiar breadboard look, `.fzz` is a file format | Qt GUI app whose only batch mode is folder-wide `fritzing -svg folder` (all sketches, all views); Linux CI needs xvfb; authoring `.fzz` means emitting connector GUIDs tied to the fritzing-parts database an LLM cannot verify | Generated SVG |
| Mermaid / D2 / Graphviz / PlantUML **as** the wiring diagram | Zero tooling, renders everywhere | Node graphs cannot express pin numbers, rails, pull-ups or which header hole — a reader can mis-wire from them | Mermaid only as the README overview; the SVG + pin table carry the wiring |
| Image-generation models or hand-authored SVG as documentation | Fast, pretty | They invent pin labels and have no validation surface | Generated from the validated `diagram.json` |
| Renode as the ESP32-S3 emulator | Free, offline, scriptable | Zero ESP32 support: no `esp32` string on its supported-boards page; the only XTENSA entry is `xtensa-sample-controller`; issues #262/#704/#946 open; PlatformIO's `tool-renode` stale at 1.13.3 | QEMU, narrowly, for boot smoke only |
| QEMU as the primary hardware-free gate | Free and offline | On ESP32-S3 it explicitly does not emulate GPIO matrix/IOMUX, I2C, SPI, LEDC, RMT, USB, WiFi or Bluetooth — it cannot blink an LED | QEMU as L2 boot/RTOS/timer smoke; Wokwi (or hardware) for anything that touches a pin |
| Hardware-only verification (`pio test -e esp32s3` flashing the board) | It is the ground truth | It is the owner's stated pain; needs the board plugged in and a human; an agent cannot close the loop | Keep it as L4, pre-submission, and as the *only* proof for BLE, deep sleep/RTC, ADC reality, RF and timing |
| Nightly full Wokwi sweep (all 60 homeworks) | "Just run everything" | 60 × ~10 s ≈ 10 min per sweep against 50 simulation-minutes per rolling 30 days with a 5-minute session cap ⇒ ~5 sweeps/month; it does not fit | Changed-paths runs in CI (deferred) + a rotating nightly subset |
| `lib_extra_dirs` | One line points 60 projects at `shared/` | Deprecated since PlatformIO Core 6.0, removal slated; it also makes every library in the folder a candidate for every project's include resolution, so one badly named folder can silently change an existing `#include` in an unrelated homework | `lib_deps = Name=symlink://../../shared/lib/Name` (per-project, declarative) |
| `file://` local deps without a guard | Same intent as symlink | It **copies** into `.pio/libdeps/<env>/` and is never refreshed — a rebuild goes green in ~0.55 s compiling the old code (verified silent staleness) | `symlink://` |
| `test_build_src = yes` to test code in `src/` | Avoids moving files | PlatformIO docs mark it NOT RECOMMENDED; forces `PIO_UNIT_TESTING` guards around `main`/`setup`/`loop` | Move logic into `shared/lib/` — which is the actual reuse goal |
| Git submodules for shared code | Isolation, provenance | A repo cannot cleanly submodule itself; 60 submodules for one person; a clone without `--recursive` (or a GitHub tarball) yields a broken build | One commit graph already gives the matching-pair guarantee |
| Per-module semver, private registry, lockfiles | "Proper" versioning | The owner's stated cost they cannot pay; registry deps re-resolve to latest unless pinned, so the pinning has to be redone anyway | The commit is the version; exact pins live in each `platformio.ini` |
| Frozen submission tags (`git tag hwNN-submitted`) | Recovers exactly what was graded | **Out of scope by owner decision** ("git history is sufficient; tags would be ceremony for a solo repository") | Record the commit SHA in the README index row instead. Residual risk stays open: with live `symlink://` shared code, an already-submitted homework rebuilds differently after a later shared edit (and one silent-drift case was reproduced: a shared edit changed the firmware of an untouched project, green build). A freeze-on-evidence path (vendor the library into the homework's own `lib/`, remove the `symlink://` line, record the shared commit SHA + hashes in `SHARED.lock`) exists if a submitted homework ever breaks at HEAD. |
| Wokwi simulation in CI right now | Real wiring verification per PR | **Deferred by owner decision** pending the free-tier quota trade-off; also, CI uploads the firmware binary to Wokwi's cloud each run (deleted afterwards; offline mode is Pro-only, no opt-out short of on-prem) | Keep L3 local (Wokwi for VS Code 4.0.0) and manual; wire `wokwi.yml` when the trade-off is accepted |
| A heavy rule constitution (8 rulebooks, `.agents/` mirror, three-stage configs) | Comprehensiveness | The abandoned `vl/init` branch's exact failure mode — configuration overhead, not technical failure | Short `AGENTS.md` + a few reference docs + a few skills |
| Restating formatter/naming/line-length rules in `AGENTS.md` | "The agent reads the rules" | 62% of surveyed agent-config files do this (Lint Leakage): deterministic problems solved deterministically by pre-commit, consuming always-loaded context | One line — "style is enforced by `.clang-format` + pre-commit; run `pre-commit run --all-files`" — plus only the traps no tool can catch |
| A per-homework `AGENTS.md` for every homework | Keeps rules near the code | Nested-`AGENTS.md` semantics differ per tool (Copilot/Cursor nest natively; Claude Code only under conditions; VS Code's support is experimental and off by default); 60 instruction files is the configuration smell at directory scale | Root rules + the homework README + `platformio.ini` comments; add a nested file only for a genuinely divergent homework |
| `-Werror` in global `build_flags` | Warnings that never ship | The next framework update adds a warning inside code the owner does not control and the build stops compiling, which trains people to delete the flag | `build_src_flags = -Werror` (scoped to `src_dir`) when it is introduced; **the owner's decision is no `-Werror` initially** |
| `check_tool = clangtidy` with no `--checks` | "Turn on clang-tidy" | PlatformIO then appends `--checks=*` — every LLVM 19 check including `abseil-*`/`boost-*`/`fuchsia-*`/`objc-*`; the newcomer concludes the linter is useless | Explicit `clangtidy: --checks=…` in `check_flags`, and the shared config in `.clang-tidy` |
| Setting cppcheck `check_flags` without restating the defaults | Add one flag | **Any** `check_flags` value silently drops PlatformIO's `--inline-suppr`, `--platform=unspecified` and `--enable=warning,style,performance,portability,unusedFunction` — the hook reports *fewer* defects while looking unchanged | Always restate all three in the same line |
| Whole-repo static analysis inside every commit | Catches everything | Static analysis needs a successful build of that project first; a whole-repo gate is slow, flaky and reports defects from half-finished assignments | Changed files in hooks; `pio check -d <project>` in CI |
| Committing `compile_commands.json` / `.pio/` | "Reproducible editor state" | It is generated, contains absolute machine-specific paths, and each homework is its own PlatformIO project — so a committed DB from one homework silently misleads clangd/clang-tidy in another; `.pio/` is described by PlatformIO's own docs as a cache directory that can be deleted without risk | Gitignore both; regenerate with `pio run -t compiledb -d <hw>` (0.31 s measured) after any shared change, because the editor is the one component that goes stale silently |
| A symlinked or duplicated `CLAUDE.md` | "Point Claude at AGENTS.md" | `Edit`/`Write` refuse to write through a symlink; on Windows a committed symlink checks out as a plain text file unless `core.symlinks` is enabled; a second copy drifts silently | Owner decision: no `CLAUDE.md`; `AGENTS.md` is read natively when none exists |

### Discrepancies To Resolve (sources disagree — do not silently pick)

1. **Toolchain pin set.** Slice wf3 verified end-to-end on this machine with `platform = espressif32@6.13.0` + `platformio/framework-arduinoespressif32@3.20017.241212+sha.dcc1105b`. Slice wf1 (lint-format) and `.planning/PROJECT.md` both report the live/installed state on 2026-10-15 as `platformio/platform-espressif32` **7.1.3** (2026-09-11) with Arduino core 2.0.17, `framework-espidf` 6.1.0 and `toolchain-xtensa-esp-elf` 15.2.0+20251204. These are incompatible pin sets. One must be chosen and used in every `platformio.ini` and in CI; the 6.13.0 values were the ones actually exercised, the 7.1.3 values are current.
2. **Which module the wiring is generated for.** wf2's top open question was N8 vs N16R8 and it wrote `flashSize: "8"`. Resolved by the owner: **N16R8** ⇒ Wokwi attr `flashSize "16"` + `psramType "octal"`, `--fill-flash-size 16MB` in the QEMU merge, and GPIO35/36/37 rejected by the pin check. Any N8-era text in the slices is superseded.
3. **Where L1 runs.** wf2 puts native host tests on **pre-commit**; wf1 puts everything that compiles on **pre-push** (with `manual` as backup). The owner's fixed split ("pre-commit fast, pre-push builds changed projects") matches wf1. Resolution proposed below under "Hook Stage Split".
4. **Board revision and RGB LED pin** (GPIO48 on the initial revision, GPIO38 on v1.1; arduino-esp32's generic `esp32s3` variant hardcodes 48) is a single owner fact that must be captured once into `shared/hardware/` — otherwise `auto` mode can never be one-shot.
5. **Root tooling directory name**: `tools/` (wf2: `tools/render-diagram/`, `tools/check-pins.mjs`, `tools/qemu/`) vs `tooling/` (wf3: `tooling/templates/`, `tooling/scripts/`). Pick one before the scaffolding skill hardcodes it.
6. **Local pre-commit version**: 4.6.0 (PROJECT.md and wf1 lint-format) vs 4.7.0 (wf1 git-hygiene, which also reports it installed at `~/.local/bin/pre-commit`). PyPI's current release is 4.7.0 (uploaded 2026-10-12).
7. **`.claude/skills` mirroring.** The owner's decision is `.agents/skills/` mirrored into `.claude/skills/` by symlink. Claude Code documents symlinks at the **individual skill-entry** level (and for `.claude/rules/`), not for the `.claude/skills` directory itself; a broken symlink fails silently. Recommendation: mirror per skill entry, and add a check (`find .claude -type l ! -exec test -e {} \; -print`) plus a one-time `/context` smoke test.
8. **`-Wpedantic` noise.** wf3 measured ~2300 warnings in one build, all from Espressif headers, zero from repo code, and suggests moving `-Wpedantic` to the clang-tidy/native layer if it becomes distracting. The owner's decision keeps strict flags with no `-Werror`.

## Feature Dependencies

```
[diagram.json (canonical)]
    └──requires──> [Wokwi part-id + coord conventions] ──requires──> [wokwi-boards pin catalog vendored]
    ├──feeds──> [wokwi-cli lint --offline] ──enables──> [pre-commit gate + CI gate]
    ├──feeds──> [renderer tools/render-diagram/render.mjs] ──emits──> [docs/wiring.svg + docs/netlist.md]
    │                                              └──enables──> [render drift guard (CI)]
    ├──feeds──> [tools/check-pins.mjs] ──requires──> [shared/hardware/esp32-s3-devkitc-1-pins.json + constraints]
    └──feeds──> [wokwi.toml (wokwi-cli init)] ──requires──> [firmware build] ──requires──> [merge_firmware.py for FS/OTA/custom partitions]

[HAL seam (shared/lib, no Arduino/ESP-IDF includes)]
    ├──requires──> [lib_deps = Name=symlink://…] ──requires──> [library.json per library + full transitive closure]
    ├──enables──> [L1 native tests] ──requires──> [env:native + test_host/test_device split]
    └──enables──> [ESP-IDF migration as a backend swap]

[L2 QEMU smoke] ──requires──> [esptool merge + vendored espressif/qemu] ──requires──> [env:esp32s3-qemu + test_testing_command]
[L3 Wokwi] ──requires──> [lint-clean diagram.json + wokwi.toml + built firmware]
[L4 hardware] ──requires──> [human + board]   (no agent can close this loop)

[verify.sh per homework] ──requires──> [layers declared in AGENTS.md/docs]

[Scaffolding skill (guide|auto)]
    └──requires──> [homework template + diagram conventions + check-pins + renderer + verify.sh template + shared/hardware facts]
                       └──requires──> [board facts captured once (module, revision, console port)]

[pre-push build hook] ──requires──> [changed-file → nearest platformio.ini mapping]
                                  └──requires──> [shared/** → consuming projects mapping (parse symlink:// lines)]

[CI changed-project matrix] ──requires──> [platformio.ini discovery + caching]

[README contract] ──requires──> [generated docs/ + verify.sh results + AI-participation declaration]

[Wokwi-in-CI] ──conflicts──> [owner deferral / 50 sim-min quota]      (design kept, wiring deferred)
[Frozen submission tags] ──conflicts──> [owner out-of-scope decision]  (residual archive risk accepted)
[per-homework AGENTS.md for all] ──conflicts──> [short-AGENTS.md decision]
[lib/ vendoring] ──conflicts──> [symlink:// line]  (both present = the lib/ copy wins; the line must be removed)
[whole-directory .claude/skills symlink] ──conflicts──> [documented per-entry symlink support]  (unverified)
```

### Dependency Notes

- **The renderer needs its vendored board artifacts.** `tools/render-diagram/boards/esp32-s3-devkitc-1/{board.json,board.svg}`: `board.json` gives the 44 pins in mm with targets; `board.svg` is a true vector drawing at pt = mm × 2.8346. That factor was verified on only two pins — eyeball the first overlay before trusting it. The board definition exposes exactly 44 pin names (bare GPIOs plus `3V3.x`, `5V`, `GND.x`, `RST`, `RX`, `TX`) — any `D`-prefixed name is an invalid-pin lint error.
- **Pin validation requires the pin database to exist first**, and the database is what makes `auto` mode possible without questions. It must be sourced from ESP32-S3 Series Datasheet v2.2 (Table 7-1; Sec 3 strapping; Sec 2.3.5 peripheral pin assignment), WROOM-1 datasheet v1.8 Table 3-1, DevKitC-1 User Guide v1.1 header tables (J1/J3 order), and a pinned `wokwi-boards` commit — so a later regeneration can be diffed against the same sources. If a pin fact is absent from the database, cite the datasheet table; never invent.
- **L1 depends on the seam, not on discipline.** Without "no Arduino/ESP-IDF includes in `shared/lib`", host tests decay to tests of nothing over 60 homeworks. The seam grep in pre-commit is what keeps the dependency real.
- **L2 and L3 both need a merged image when the homework uses LittleFS/SPIFFS, OTA, a custom partition table, or >4 MB.** Otherwise Wokwi substitutes its own bootloader and default single-app 4 MB table and LittleFS fails with `partition "spiffs" could not be found`. PlatformIO's `FLASH_EXTRA_IMAGES` is populated only by the ESP-IDF framework builder, so Arduino-framework projects need the shared `merge_firmware.py` extra script too — write it once, reuse it.
- **The pre-push hook is where `shared/` edits become dangerous.** A file under `shared/` has no `platformio.ini` ancestor, so a naive nearest-ancestor mapping builds nothing for the most dangerous change type. The hook must parse each `platformio.ini`'s `symlink://` targets and build every consumer.
- **L3 cannot prove BLE, I2S, MCPWM, ULP, or full RTC/deep-sleep**, and no simulator is cycle-accurate. Any test may assert ordering, state transitions and final values — never durations.
- **`verify.sh` must exist before CI can route per homework**, and the README's "how to verify" section is generated from it.
- **The scaffolding skill is the single point through which every other convention reaches the repo.** If it is wrong, 60 homeworks are wrong; hence the refuse-don't-guess contract below.

## The Two-Mode Scaffolding Skill

One skill, two modes chosen per request; an unspecified request must ask which. This is the only place where "what a homework is" is defined, so its contract is a feature in its own right.

**Inputs it must collect (eight).** (1) exact module marking — now fixed to N16R8 by the repo, so this collapses to a confirmation; (2) board revision (initial → RGB LED GPIO48, v1.1 → GPIO38; arduino-esp32's generic `esp32s3` variant hardcodes 48); (3) which USB port is the console — USB-to-UART (GPIO43/44) vs native USB (GPIO19/20); (4) peripheral list with exact part numbers and their supply/logic voltage (3.3 V-native vs 5 V module); (5) bus pin assignment — accept an explicit choice or "choose for me", never silently invent; (6) whether WiFi/BLE is used in the same homework (kills ADC2, GPIO11–20); (7) power source and expected current, and whether anything inductive needs its own supply and a common ground; (8) breadboard vs direct module wiring, so the diagram matches what will be built.

**Mode behaviour.**
- `guide`: asks the eight, teaches the reasoning, writes the skeleton, and **stops** before writing homework logic — it never writes that logic unprompted.
- `auto`: one-shot, no questions. It resolves inputs (1)(2)(3)(7)(8) from committed facts in `shared/hardware/` and the homework brief, and chooses pins per (5) with the rationale recorded in the generated docs.
- Because `auto` may not ask, the board facts must be captured **once** into `shared/hardware/`; anything still unknown forces an explicit `unverified` note rather than a guess.

**Emits per homework:** lint-clean `diagram.json`; regenerated `docs/wiring.svg` + `docs/netlist.md` (never hand-edited); `wokwi.toml` via `wokwi-cli init` with the env paths corrected; `verify.sh` declaring the layers; the README wiring section (SVG + Mermaid overview + netlist link + a *cited* official pin-layout image — `ESP32-S3_DevKitC-1_pinlayout_v1.1.jpg` from `esp-dev-kits`, never redrawn); and, for FS/OTA/custom-partition projects, the shared `merge_firmware.py` extra script with `wokwi.toml` pointed at `firmware.merged.bin`. After writing it must run `wokwi-cli lint --warnings-as-errors --offline` and the renderer, and only a lint-clean diagram with regenerated artifacts may be committed.

**Refuses (explicit `unverified` note and stop) when:** any requested pin is GPIO22–34; the module marking is unknown **and** GPIO35–37 or GPIO47/48 are requested; 5 V logic meets a GPIO without a stated level shifter; ADC2 + WiFi in one homework; a strapping pin (GPIO0/3/45/46) is also driven by external hardware at reset; or any pin fact is absent from the pin database.

**Report contract:** after generating, state which layers ran (L0/L1/L2/L3) and which remain human-only (BLE, deep sleep/RTC, timing), plus which pin facts remain unverified. No unqualified "verified" — BLE is not simulated by any tool and neither simulator is cycle-accurate.

**Version hygiene:** fetch the pin catalog at authoring time (`wokwi-boards` `boards.json` + the `parts.json` bundled in `@wokwi/diagram-lint` instead of trusting model memory, and never trust a `.pio`-era part name like `wokwi-esp32-s3-devkitc-1`, which is a plausible LLM invention and an unknown-part-type error).

## Verification Layers — What Each Proves

| Layer | Runs where | Proves | Does **not** prove | Cost |
|-------|-----------|--------|--------------------|------|
| L0 static + build | pre-commit (fast subset) + every CI run | It compiles; clang-format/clang-tidy/cppcheck clean; diagram is lint-clean; every net is electrically legal against the pin DB; `shared/lib` is framework-free | Nothing about behaviour | Offline, seconds, free |
| L1 native host unit tests | pre-push (see Hook Stage Split) + every CI run | Protocols, parsers, state machines, math, config, error handling — the majority of most homeworks | GPIO, buses, FreeRTOS, timers, flash/NVS, timing, memory limits (the host has GBs; the S3 has ~327 KB usable DRAM, so host tests pass code that OOMs on target) | Offline, milliseconds, free |
| L2 QEMU boot smoke | CI every push; local optional | The real merged image boots, the RTOS starts, timers fire, no panic/backtrace | GPIO matrix/IOMUX, I2C, SPI, LEDC, RMT, USB, WiFi, Bluetooth (all explicitly unsupported on S3 in QEMU) — it cannot blink an LED | Offline, seconds, free |
| L3 Wokwi behavior/wiring | Local VS Code + (deferred) CI on changed paths | The wiring is electrically consistent with a simulation and the firmware behaves against simulated parts — GPIO + interrupts, I2C/SPI/OneWire sensors (DS18B20, MPU6050, SSD1306, MFRC522, ILI9341, microSD, HC-SR04, servo), WiFi | BLE (marked unimplemented for all ESP32 chips), I2S, MCPWM, ULP, RTC/deep-sleep (partial); anything timing-accurate | Token + network + quota: 50 simulation-minutes per rolling 30 days, 5-minute session cap |
| L4 real hardware | Human, pre-submission, never CI | BLE, deep sleep/RTC, ADC reality, RF, timing-sensitive work — mandatory and non-substitutable | Repeatability (it is human-supplied evidence, recorded as such) | The owner's time; an agent cannot close this loop |

Routing by course phase (encoded in each `verify.sh`): GPIO/peripherals → L1+L3 (QEMU is useless here); I2C/SPI/OneWire → L1+L3; WiFi → L1+L2+L3; BLE → L1 then L4; RTOS/timers → L1+L2+L3, with deep sleep always L4. Agents must report which layers ran and which remain human-only instead of an unqualified pass.

## Hook Stage Split

`SKIP=<hook-id>` is the sanctioned escape hatch; `--no-verify` is not (it disables everything).

**pre-commit (fast, offline, no token, no network):** clang-format, clang-tidy (needs a fresh `compile_commands.json` — a clang-tidy hook without one is a **silent no-op**, pocc ignores the missing-CDB error), cppcheck via `pocc/pre-commit-hooks@v1.4.0` (`require_serial: true`, persistent cache outside the repo), `pio check`, `wokwi-cli lint --offline`, `node tools/check-pins.mjs`, the render + `git diff --exit-code` drift guard, and the hardware-seam grep.

**pre-push (or `manual`):** build the changed projects, and for any change under `shared/lib/<name>`, every project whose `platformio.ini` references it. Mechanism: a `language: system` hook with an explicit `files:` regex (`\.(c|cc|cpp|h|hh|hpp|ino|S)$` **or** `/platformio\.ini$` — do not use `types_or`, it cannot cover `.ino`/`.S`/`platformio.ini`), `require_serial: true` (parallel `pio` runs race on `~/.platformio` package installs), `pass_filenames: true`, running `pio run -d <dir>` per discovered project. The script pre-checks `shutil.which('pio')` and exits with an actionable message — `pio` is not on the interactive PATH on this machine (`~/.platformio/penv/bin/pio`) and VS Code's Source Control panel uses a different PATH than the login shell.

**The disagreement, stated explicitly:** wf2 places **L1 native tests and `pio run` build in pre-commit**; wf1 places **everything that compiles in pre-push/manual**. The owner's fixed decision is "pre-commit fast, pre-push builds changed projects". Proposed resolution: pre-commit keeps the non-compiling checks (format, file checks, seam grep, pin validation, diagram lint, render-drift — the renderer is a Node script, not a compiler), and pre-push runs L1 for changed projects plus the changed-project build. A native test suite still requires a native compile on first run per project, which is why it is not free. CI remains authoritative either way.

**CI skips the build hook explicitly** (`SKIP=pio-build-changed`) because the matrix job does the real build; `pre-commit run --all-files` in CI runs with `--show-diff-on-failure` (mutating hooks can only fail there, never re-stage).

## CI Behaviour

`.github/workflows/`, four workflows, all manual install (no PlatformIO action exists — 404):

1. **`checks.yml`** — on push/PR. Computes the changed homework dirs, then per dir: format check; `pio check -e esp32s3`; `pio run -e esp32s3`; `wokwi-cli lint <hw>/diagram.json --warnings-as-errors --offline`; `node tools/check-pins.mjs <hw>`; seam grep; `node tools/render-diagram/render.mjs <hw> && git diff --exit-code -- <hw>/docs`. Lints **all** projects, not only changed ones.
2. **`native.yml`** — matrix over changed dirs (all dirs on the main branch): `pio test -e native --junit-output-path build/reports/host.xml`, XML uploaded as an artifact.
3. **`qemu.yml`** — matrix over changed dirs: fetch/vendor the platform-matched `espressif/qemu` asset (cached), build, `esptool … merge_bin --fill-flash-size 16MB`, run `qemu-system-xtensa -nographic -machine esp32s3` with the `wdt_disable` global, capture serial, fail on non-zero exit or a panic/backtrace pattern, artifact the log.
4. **`wokwi.yml`** — **deferred by owner decision.** Designed shape when it lands: gated to PRs/pushes touching `homeworks/**`, per-changed-dir jobs running `wokwi/wokwi-ci-action@v1` with `token: ${{ secrets.WOKWI_CLI_TOKEN }}`, `path: homeworks/<hw>`, `timeout`, `expect_text` (or `scenario:`), plus a `concurrency` group with cancel-in-progress so superseded pushes do not burn quota. Budget arithmetic to encode in a workflow comment: 60 homeworks × ~10 s ≈ 10 min per full sweep; free tier = 50 simulation-minutes per rolling 30 days with a 5-minute session cap ⇒ full sweeps only on merge-to-main or manually (~5/month); a rotating nightly subset of ~5 homeworks ≈ 1 min/night ≈ 30 min/month. Wokwi Hobby raises the window to 200 min.

Matrix shape: a discover job emitting `{"project": [...]}` into `$GITHUB_OUTPUT` (from `find . -name platformio.ini`), consumed with `strategy: matrix: project: ${{ fromJSON(needs.discover.outputs.matrix) }}`, `fail-fast: false`, and a low `max-parallel` to bound concurrent `pio` package installs. Cache `~/.cache/pip` + `~/.platformio/.cache` keyed on `hashFiles('**/platformio.ini')` with `restore-keys` (GitHub evicts caches untouched for 7 days; 10 GB per repository).

**Open CI uncertainties to smoke-test before hardening:** (a) the documented `wokwi-ci-action` inputs are `token`, `path`, `timeout` (default 10000), `expect_text`, `fail_text`, `scenario`, `serial_log_file`, `diagram_file`, `elf` — there is **no** documented timeout-exit-code input, so distinguishing timeout (42) from assertion failure may require calling `wokwi-cli` directly in a step; (b) the QEMU binary is platform-specific and the fetch script must resolve per runner OS/arch; (c) CI uploads the firmware binary to Wokwi's cloud per run (deleted after; no opt-out short of on-prem) — confirm that is acceptable for coursework before enabling L3 in CI.

## Agent Rules and Skills for Two Harnesses

- **`AGENTS.md`** at the root, short (Anthropic's own target is under 200 lines; 42% of surveyed public files exceed it), English, ordered: language policy (English artifacts; Ukrainian conversation allowed), repository layout, exact toolchain commands including `~/.platformio/penv/bin/pio`, a loading protocol naming each reference doc and when to read it, definition of done, never-do list. Repository overviews are the part of context files with **no** measured task-success benefit — keep them out.
- **No `CLAUDE.md`** (owner decision). Preserve the hazard note: `AGENTS.md` is read natively only while no `CLAUDE.md`/`.claude/CLAUDE.md`/`CLAUDE.local.md` exists at or above the working directory; if one is ever added, it must be the single line `@AGENTS.md`.
- **Skills canonical at `.agents/skills/<name>/SKILL.md`**, mirrored into `.claude/skills/<name>` per entry (see discrepancy 7). Author to the six cross-tool fields — `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools` — because strict validators reject extra keys such as `argument-hint`. `name` must match the parent directory; `description` is 1–1024 chars and trigger-first (the skill listing is budgeted at 1% of the context window and entries are truncated at 1,536 chars, dropped least-used-first on overflow). Frontmatter is only read when `---` is the first line; malformed YAML loads the skill with no metadata and automatic invocation never fires. Keep `SKILL.md` under 500 lines, detail in `references/` beside it. Never use `.agents/workflows` (legacy workflows stop working 19 Oct 2026).
- **Keep the always-loaded file free of mechanically-enforced style** — Lint Leakage is the most common configuration smell (62% of analysed files). One pointer line is the whole prose budget for style.
- **Never-dos worth writing down because no tool catches them:** no heap allocation in ISRs or hot paths; no `Serial`/`printf` in an ISR (ESP-IDF: never register an `ESP_INTR_FLAG_IRAM` handler unless everything it touches is in IRAM/DRAM, and do not call C code from a high-priority interrupt); no blocking wait without a timeout in a task; hand off with the `*FromISR` variants and `portYIELD_FROM_ISR` when `pxHigherPriorityTaskWoken` becomes `pdTRUE`; do not use strapping GPIO0/3/45/46 or flash/PSRAM GPIO26–37 for application I/O; treat ADC2-versus-Wi-Fi per the ESP32-S3 driver docs (`adc_oneshot_read()` arbitrates between the Wi-Fi driver and ADC2 oneshot mode on S3), not from generic ESP32 lore.
- **Recommended skill set (research suggestion, to be trimmed to "a few"):** `new-homework` (the two-mode scaffolding skill), `new-shared-lib`/`promote-to-shared` (add or move a module into `shared/lib` with manifest + DI constructor + lifecycle), `verify-work` (the definition of done: `pre-commit run --all-files`, `pio test -e native`, warning-clean build — report raw output, never claim success by assumption), `build-flash-monitor`, and optionally `debug-hardware` (boot loops, strapping, panic backtraces). Every skill ends with literal commands and the rule "report the actual output; if a check was skipped, say so".

## Per-Homework Deliverable Contract (instructor-facing README)

Fixed shape; generated parts are marked. This is what the instructor reads, and it is also what makes a homework demoable in week 40.

````
# <module>-<lesson>-<slug> — <one-line what it demonstrates>

Objective / what was built          (agent-authored prose)
Hardware                            (board + modules with exact part numbers, from diagram.json)
Wiring
  ![wiring](docs/wiring.svg)                       <- GENERATED by tools/render-diagram/render.mjs
  ```mermaid flowchart LR ... ```                  <- agent-authored overview; GitHub-native
  [Pin connections](docs/netlist.md)               <- GENERATED table
  Board pin layout: (cited, never redrawn) official ESP32-S3_DevKitC-1_pinlayout_v1.1.jpg
How to build and run                (pio run -d homeworks/<hw>; monitor at 115200; console port)
How to verify                       (from verify.sh: which layers apply and what each proves)
What is NOT verified                (BLE / deep sleep / timing / unverified pin facts — explicit)
AI participation                    (what was agent-generated; Assisted-by trailer in the commit)
<README index row>: id | slug | board | one-line | commit SHA
````

Rules that make this a contract rather than a template: `docs/` is never hand-edited and is committed together with `diagram.json`; the index row carries the **commit SHA** (tags are out of scope — see discrepancy in Anti-Features); the "what is NOT verified" section is mandatory whenever L3 or L4 was skipped, because BLE is not simulated by any tool and neither simulator is cycle-accurate.

## MVP Definition

### Launch With (v1)

Minimum that proves the whole loop on one real homework (`homeworks/m01-l03-blink` is the obvious first):

- [ ] Repository skeleton: `AGENTS.md` (short), `docs/` reference set, `.agents/skills/new-homework/` + `.claude/skills` entry symlink, root `.clang-format`/`.clang-tidy`/`.editorconfig`, `.pre-commit-config.yaml`, regenerated `homework.code-workspace` — without these nothing else has a home
- [ ] One homework as a real PlatformIO project with N16R8 overrides, `[env:esp32s3]`, `[env:native]`, `src/`, `test/test_host/`
- [ ] `shared/lib/emb_hal` + `emb_hal_arduino` + `emb_log`, each with `library.json`, consumed via `symlink://`, and the seam grep proving it stays framework-free
- [ ] `diagram.json` + `wokwi-cli lint --offline` + the renderer producing `docs/wiring.svg` and `docs/netlist.md`
- [ ] `shared/hardware/esp32-s3-devkitc-1-pins.json` + `tools/check-pins.mjs`, with GPIO35/36/37 rejected (N16R8) — the single highest-value check, because the PlatformIO board default is wrong for this module
- [ ] pre-commit (format + lint + diagram lint + pin check + drift guard + seam grep) and pre-push (build changed projects)
- [ ] `checks.yml` + `native.yml` in CI with the discover→matrix shape
- [ ] Instructor-facing README with the generated wiring section and the "not verified" section
- [ ] `guide` mode of the scaffolding skill (the mode that teaches; it is also the mode that validates the template by hand)

### Add After Validation (v1.x)

- [ ] `auto` mode — once the template, the board facts and the pin database have been exercised once by hand
- [ ] `verify.sh` + layer routing per homework — once there is more than one homework to route
- [ ] L2 QEMU env + vendored binary + fetch script — when the first RTOS/timer/WiFi homework needs a boot check
- [ ] L3 Wokwi locally (VS Code, `wokwi-cli`) on homeworks with real modules — when GPIO/I2C/SPI content starts
- [ ] `merge_firmware.py` — when the first LittleFS/OTA/custom-partition homework appears
- [ ] `new-shared-lib` and `verify-work` skills — when a second homework needs the same module

### Future Consideration (v2+)

- [ ] Wokwi in CI (`wokwi.yml` + changed-path gating + rotating nightly subset) — blocked on the quota trade-off and on the firmware-upload question
- [ ] Optional tscircuit schematic sheet (`tools/render-diagram/to-tsx.mjs`) — only if a true IEC-style sheet is wanted after the base pipeline runs
- [ ] Freeze-on-evidence for submitted homeworks (vendor into `<hw>/lib/`, remove the `symlink://` line, write `SHARED.lock`) — trigger: the first submitted homework that no longer builds or behaves as submitted at HEAD, or a shared header change touching more than ~10 homeworks
- [ ] L4 evidence recorded per homework (board output, photo of the wiring) — nice for the portfolio, not required for correctness

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Per-homework project skeleton + N16R8 overrides | HIGH | LOW | P1 |
| `diagram.json` + offline lint gate | HIGH | LOW | P1 |
| Generated `wiring.svg` + `netlist.md` + drift guard | HIGH | MEDIUM | P1 |
| Pin database + `check-pins.mjs` (N16R8, strapping, ADC2/WiFi, 5 V) | HIGH | MEDIUM | P1 |
| HAL seam + `symlink://` shared libraries | HIGH | MEDIUM | P1 |
| L1 native tests + `env:native` split | HIGH | LOW | P1 |
| Pinned clang-format/clang-tidy/cppcheck in pre-commit | HIGH | MEDIUM | P1 |
| pre-commit / pre-push split with changed-project mapping | HIGH | MEDIUM | P1 |
| CI `checks.yml` + `native.yml` (discover→matrix) | HIGH | MEDIUM | P1 |
| Short `AGENTS.md` + skills layout for both harnesses | HIGH | MEDIUM | P1 |
| Instructor-facing README contract | HIGH | LOW | P1 |
| `guide` mode of the scaffolding skill | HIGH | MEDIUM | P1 |
| `auto` mode of the scaffolding skill | HIGH | MEDIUM | P2 |
| `verify.sh` layer declaration + routing | MEDIUM | LOW | P2 |
| L2 QEMU boot smoke | MEDIUM | HIGH | P2 |
| L3 Wokwi locally (VS Code) | HIGH | MEDIUM | P2 |
| `merge_firmware.py` for FS/OTA/partitions | MEDIUM | MEDIUM | P2 |
| Mermaid overview + cited official pin layout in README | MEDIUM | LOW | P2 |
| Rotating nightly Wokwi subset | LOW | MEDIUM | P3 |
| Wokwi in CI | MEDIUM | HIGH | P3 (deferred) |
| tscircuit schematic sheet | LOW | HIGH | P3 |
| Freeze-on-evidence (`SHARED.lock`) | MEDIUM | MEDIUM | P3 (triggered) |
| L4 evidence capture in the repo | LOW | LOW | P3 |

## Competitor Feature Analysis

There is no competing product — this is a personal coursework repository. The comparison below is against the alternative toolchains the research evaluated and rejected, because that is the decision surface a roadmap planner has to respect.

| Capability | Alternative A | Alternative B | Our Approach |
|------------|---------------|---------------|--------------|
| Wiring image from a source of truth | Wokwi editor screenshot / `--screenshot-part` (part-scoped; no whole-diagram export) | Headless Playwright over `@wokwi/elements` (must reimplement Wokwi's route mini-language; browser in CI) | Repo-owned deterministic Node renderer over `diagram.json`, emitting SVG + netlist table, with a CI drift guard |
| True schematic sheet | KiCad + SKiDL/netlistsvg (no netlist→schematic path; frozen deps) | Fritzing `.fzz` (Qt GUI, `xvfb`, unverifiable connector GUIDs) | Optional later: `diagram.json` → TSX converter → `tsci export -f schematic-svg` (tscircuit beta, missing parts) |
| Hardware-free behavior verification | QEMU (no GPIO/I2C/SPI/WiFi/BT on S3) | Renode (zero ESP32 support) | L2 QEMU narrowly for boot/RTOS/timer smoke; L3 Wokwi for wiring + parts; L4 hardware for BLE/deep-sleep |
| Hook manager | lefthook v2.2.2 (faster/parallel; manages no tool environments) | husky v9.1.7 (Node-only shim; no env isolation) | pre-commit 4.7.0 — rev-pinned hook environments, so local == CI |
| Static analysis runner | standalone clang-tidy on `compile_commands.json` (real flags; per-homework DB to regenerate) | `pio check` (turnkey; no `-std`, `-I` not `-isystem`, bundled LLVM 19.1.0) | Both, sharing one `.clang-tidy`; `.clang-tidy` validated with `clang-tidy --verify-config` in the hook |
| Agent rules layout | One monolithic always-loaded file (Bloat: 42% exceed 200 lines) | 8-rulebook constitution (the abandoned `vl/init` design) | Short `AGENTS.md` + a few reference docs + a few skills, mirrored per harness |
| Shared-code consumption | `lib_extra_dirs` (deprecated since Core 6.0, global include namespace) | `file://` local deps (silently stale copies) / git submodules (cannot self-submodule; broken clones) | `lib_deps = Name=symlink://../../shared/lib/Name`, one line per library including transitives |

## Sources

- Research slices read in full: `/tmp/gsd-research-src/features.json` — `wf2.recommendation` (wiring/diagram pipeline, verification pipeline, CI wiring, rejected alternatives, generator-skill notes), `wf3.final` (shared-code mechanism, layout, rules to codify, staged path), `wf1.git-hygiene`, `wf1.lint-format`, `wf1.agent-rules`. All version figures verified live on 2026-10-15 against PyPI JSON, GitHub release/contents APIs and official docs.
- Project context: `/Users/vloktiev/Dev/miltech/homework/.planning/PROJECT.md` (owner decisions, measured workstation state, out-of-scope list), `.planning/config.json`, `homework.code-workspace`, `.claude/settings.local.json`.
- Tool version baseline (2026-10-15, carry the date with every figure): wokwi-cli v0.28.1; Wokwi for VS Code 4.0.0; @wokwi/diagram-lint 0.1.1; `wokwi/wokwi-ci-action@v1`; `espressif/qemu` esp-develop-9.2.2-20260417; PlatformIO Core 6.2.0 (PyPI 2026-09-05; docs `latest` is v6.2.1b2); platformio/platform-espressif32 7.1.3 (2026-09-11); framework-arduinoespressif32 4.30312.261011 (2026-10-12); toolchain-xtensa-esp-elf 15.2.0+20251204; tool-cppcheck 1.22200.0 (cppcheck 2.22.0, 2026-09-23); tool-clangtidy 1.190100.0 (LLVM 19.1.0, 2024-09-19); pre-commit 4.7.0 (2026-10-12); pre-commit-hooks v6.0.0; mirrors-clang-format v23.1.3 (clang-format 23.1.3 / LLVM 23.1.3, 2026-10-06); pocc/pre-commit-hooks v1.4.0; cpp-linter-hooks v1.6.1; codespell v2.4.3; gitleaks v8.30.1; detect-secrets v1.5.0; conventional-pre-commit v4.4.0; lefthook v2.2.2; husky v9.1.7.
- Documentation referenced by the slices: `docs.platformio.org` (build/monitor/flags, `build_src_flags`, `lib_deps` local-folder & symbolic-link, `check_*` options, static-code-analysis tools, CI recipes, `projectconf` interpolation); `pre-commit.com` and the hook repos' own `.pre-commit-hooks.yaml`; `docs.wokwi.com` and the `wokwi/wokwi-cli` repo; `agents.md`; `docs.claude.com` (skills, rules, memory); `agentskills.io/specification`; VS Code agent-customizations docs; Cursor rules docs; EditorConfig spec 0.17.2; LLVM release notes 19/20/22/23; cppcheck manual (suppressions, baseline); ESP-IDF programming guide (interrupt allocation, watchdogs, ADC2/Wi-Fi); ESP32-S3 Series Datasheet v2.2; ESP32-S3-WROOM-1 datasheet v1.8; ESP32-S3-DevKitC-1 User Guide v1.1; `wokwi-boards` board definitions.
- Cited as unverified in the sources and kept so here: `board.svg` mm→pt scale (verified on two pins only); whether Wokwi part screenshots can frame anything like the whole circuit; the Wokwi plan tier needed for interactive VS Code simulation on a private repo (irrelevant here — repo is public); which `wokwi-ci-action` input, if any, controls the timeout exit code.

---
*Feature research for: embedded coursework repository (PlatformIO / ESP32-S3-N16R8, two agent harnesses)*
*Researched: 2026-10-15*
