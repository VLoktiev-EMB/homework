# Architecture Research

**Domain:** embedded coursework monorepo — N self-contained PlatformIO/ESP32-S3 projects, one shared-library folder, two AI harnesses (Claude Code + Google Antigravity)
**Researched:** 2026-10-15
**Confidence:** PlatformIO layout mechanics — HIGH (each rule read from live docs or PlatformIO Core source on 2026-10-15). Two-harness agent layer — MEDIUM (two mechanisms are undocumented and need a local smoke test). Disputes between sources are kept inline, labelled, never silently resolved.

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│ AGENT LAYER — one rules file, two harnesses (2026-10-15)                 │
│   AGENTS.md at repo root, short, always-on, no frontmatter               │
│   .agents/rules/*.md ──┐        .agents/skills/<name>/SKILL.md ──┐       │
│   .claude/rules ───────┘ symlink  .claude/skills ────────────────┘ syml. │
│   Claude Code reads AGENTS.md directly ONLY when no CLAUDE.md exists     │
└───────────────┬──────────────────────────────────┬───────────────────────┘
                │ drives via skills / rules        │ drives same files
┌───────────────▼──────────────────────────────────▼───────────────────────┐
│ REPO LAYER — homeworks/<module>-<lesson>-<slug>/ (one project per hw)    │
│   platformio.ini  src/  include/board_pins.h  test/  README.md           │
│   diagram.json ──► docs/ wiring.svg + pin table + Mermaid (generated)    │
│   per-project .pio/ build dir (gitignored)                               │
└───────┬──────────────────────────────────────────┬───────────────────────┘
        │ lib_deps = Name=symlink://../../shared/libs/Name
┌───────▼──────────────────────────────────────────────────────────────────┐
│ SHARED CODE LAYER — shared/libs/<Module>/                                │
│   real PlatformIO library: library.json (name+version REQUIRED)         │
│   src/ + include/ (or build.srcDir + build.srcFilter)                   │
│   HAL seam: Arduino API only below the seam → native-testable, IDF-ready│
└───────┬──────────────────────────────────────────────────────────────────┘
        │ extra_configs = ../../shared/pio/base.ini
┌───────▼──────────────────────────────────────────────────────────────────┐
│ CONFIG LAYER — shared/pio/base.ini (common [env] defaults, pins, flags)  │
│   project platformio.ini re-declares single keys to override            │
└───────┬──────────────────────────────────────────────────────────────────┘
        │ same commands at three speeds
┌───────▼──────────────────────────────────────────────────────────────────┐
│ VERIFICATION LAYER                                                       │
│  pre-commit (fast, no network) → pre-push (build changed project)       │
│  CI: checks.yml (lint all, build changed) · native.yml (L1 matrix)      │
│      qemu.yml (L2 smoke) · wokwi.yml (L3, DEFERRED per owner)           │
│  local: L3 Wokwi editor · L4 real hardware                              │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `AGENTS.md` (repo root) | The whole always-on rule set: language policy, layout, exact commands, loading protocol, conflict precedence, Definition of Done | Plain Markdown, no frontmatter, kept short — Antigravity's 20 000-token always-on budget and Claude Code's ~200-line guidance both cap it |
| `.agents/` | Canonical agent tree — the single authored copy of rules and skills | `rules/*.md` (dual frontmatter), `skills/<name>/SKILL.md` |
| `.claude/` | Claude Code's required paths, nothing authored | `rules/` and `skills/` as symlinks into `../.agents/` (git mode 120000). No `CLAUDE.md` (owner decision, 2026-10-15) |
| `shared/libs/<Module>/` | Reusable code: drivers, pure logic, board facts | Real PlatformIO library: `library.json` with `name`+`version` (both Required), `src/`, `include/` |
| `shared/pio/base.ini` | Shared non-secret config: platform pin, board pin, board overrides, warning flags, `build_cache_dir` | Plain `.ini` fragment pulled in with `[platformio] extra_configs = ../../shared/pio/base.ini`; **never named `platformio.ini`**, no empty `[section]` headers |
| `homeworks/<id>/` | One self-contained PlatformIO project = one homework | `platformio.ini`, `src/`, `include/board_pins.h`, `test/`, `diagram.json`, `docs/` (generated), `README.md` |
| `diagram.json` (per homework) | THE canonical wiring artifact — simulation input, image source, pin-table source | Wokwi diagram format; rendered by a repo-owned generator, linted offline |
| `scripts/` | Root-level sweeps that PlatformIO does not provide | `pio-build.sh`, `pio-check.sh`, `pio-test-native.sh` — shell loops over discovered `platformio.ini` |
| `tools/` | Repo-owned generators/checks (not PlatformIO) | diagram renderer, pin-validator (`check-pins`), hardware-seam grep |
| `.pre-commit-config.yaml` | Single entry point for every static check, pinned | pre-commit 4.6.0, `default_install_hook_types: [pre-commit, pre-push]` |
| `.github/workflows/` | Same checks at scale + host/native and QEMU layers | `checks.yml`, `native.yml`, `qemu.yml`; `wokwi.yml` deferred |
| `homework.code-workspace` | One multi-root window: root, `.agents`, `shared/libs`, one folder per homework | Relative folder paths, workspace-level `platformio-ide.*` settings |

## Recommended Project Structure

```text
homework/                                   # workspace root (no platformio.ini here)
├── homework.code-workspace                 # folders: ".", ".agents", "shared/libs", homeworks/<id>...
├── AGENTS.md                               # constitution, short; single source of truth
├── README.md  LICENSE
├── .agents/                                # canonical agent tree
│   ├── rules/*.md                          # per-topic rules; dual frontmatter (see Pattern 4)
│   └── skills/<name>/SKILL.md              # canonical skill bodies
├── .claude/                                # rules/ + skills/ symlinks into ../.agents/ ; NO CLAUDE.md
├── .github/workflows/
│   ├── checks.yml                          # lint all, build changed
│   ├── native.yml                          # pio test -e native matrix
│   └── qemu.yml                            # L2 smoke on changed
├── .vscode/{settings,extensions}.json      # committed; generated files ignored
├── .clang-format .clang-tidy .editorconfig .gitattributes
├── .markdownlint-cli2.jsonc
├── .pre-commit-config.yaml
├── .gitignore                              # authored deliberately (see Anti-Pattern 7)
├── scripts/{pio-build,pio-check,pio-test-native}.sh
├── tools/                                  # diagram renderer, check-pins, seam grep
├── shared/
│   ├── pio/base.ini                        # shared .ini fragment (never platformio.ini)
│   └── libs/<Module>/{library.json,src/,include/}
├── homeworks/
│   └── m01-l03-blink/                      # one self-contained PlatformIO project per homework
│       ├── platformio.ini
│       ├── include/board_pins.h
│       ├── src/                            # firmware + (seam-split) logic
│       ├── test/                           # native unit tests (platform = native env)
│       ├── diagram.json                    # canonical wiring artifact
│       ├── docs/                           # GENERATED: wiring.svg, pin table, Mermaid
│       └── README.md                       # instructor-facing
└── .pio-cache/                             # shared build_cache_dir (gitignored)
```

**Naming contradiction, kept explicit.** This document uses `homeworks/m01-l03-blink/` (owner decision, 2026-10-15, and `.planning/PROJECT.md`). Two source findings use different names for the same folder: `homework/hw-XX-kebab-name/` (wf1.brief.arch and wf1.platformio-layout, which assume a root-level `homework/` prefix) and `homeworks/<hw>` (wf2.ci). The depth is the same (`homeworks/x/` and `homework/hw01/` are both one level below the repo root), so every relative path below — `../../shared/libs/...`, `../../shared/pio/base.ini` — is identical under either spelling. Only the folder name changes.

### Structure Rationale

- **`homeworks/<id>/` is self-contained:** one platformio.ini, its own `.pio/`, its own tests. A broken homework build cannot poison another, and `pio run -d homeworks/<id>` from the repo root is the single build verb. There is no recursive PlatformIO command — root sweeps are shell loops (see Pattern 6).
- **`shared/` splits code from config:** `shared/libs/<Module>/` holds real libraries (consumed via `lib_deps`), `shared/pio/base.ini` holds config (consumed via `extra_configs`). Do **not** set `[platformio] shared_dir` — that option (`pio remote` file sync, default `<Project>/shared`) has nothing to do with shared code, and using the word for both meanings in one repo is a documented trap.
- **Root and `shared/` carry no `platformio.ini`:** a project with no `[env:NAME]` raises `ProjectEnvsNotAvailableError`, and a root project would also confuse the workspace's "active project" resolution.
- **`.agents/` is canonical, `.claude/` is a mirror:** content that only lives in Claude's tree is invisible to Antigravity and vice versa; the mirror is the whole two-harness strategy (Pattern 4).
- **Generated artifacts have exactly one source:** `diagram.json` produces `docs/*` and the Wokwi simulation; a drift guard fails CI if `docs/` is stale (Pattern 3).
- **`.planning/` is committed** (owner decision) — the reasoning is part of what the public repo documents.

## Architectural Patterns

### Pattern 1: Shared code as real PlatformIO libraries, pulled per project with `symlink://` `lib_deps`

**What:** Every shared module is a real PlatformIO library (`library.json` with `name` + `version`, both Required fields) and each homework declares the modules it actually uses:

```ini
; homeworks/m01-l03-blink/platformio.ini
[env:m01l03_s3]
lib_deps =
    BoardPins=symlink://../../shared/libs/BoardPins
    BlinkLogic=symlink://../../shared/libs/BlinkLogic
```

**When to use:** Always, for anything containing a `.c`/`.cpp` translation unit.

**Trade-offs:** Requires one manifest per module and one `lib_deps` line per consumer, but it is the only mechanism the docs actively recommend, it survives the `lib_extra_dirs` removal, it keeps dependencies explicit per homework (which is what later makes `lib_ldf_mode = off` safe), and a symlink means a shared-code fix is live in every homework without re-install. Use `file://` only for deliberately frozen snapshots — it hard-copies, so source edits do **not** propagate.

**Rejected alternatives (with reasons):**

| Alternative | Why rejected |
|---|---|
| `lib_extra_dirs` | Deprecated since Core 6.0: "will be removed in the next major release"; the deprecation note itself prescribes `FooLib=symlink://../../shared-libraries/FooLib`. It is also what the abandoned `vl/init` scaffold used — a contradiction, resolved in favour of the docs. |
| `[platformio] lib_dir = ../../shared/libs` | Supported, not deprecated, but it makes the shared folder the project's *global* private lib storage: every project sees every shared lib, and it reinstates exactly the undifferentiated global storage the `globallib_dir` deprecation warns against. |
| `build_flags = -I...` only | Viable for header-only helpers only. `build_src_filter` paths are documented as relative to `src_dir` and cannot reach outside it, so no shared translation unit can be compiled this way. |
| git submodule / subtree | Adds a second versioning system for code in the same repo; the symlink form is already live-updating and needs no submodule discipline. |
| `globallib_dir` | Explicitly DEPRECATED; the docs' rationale ("We do not recommend using global libraries for new projects. Please use a declarative approach…") is the tiebreaker for the whole question. |

**The concrete trap:** a module whose sources are not in a plain `src/` tree compiles the headers but not the sources → undefined-reference linker errors (platformio-core issue #5493, opened 2026-08-06, closed as "forward to community"). Fix in the manifest, not in LDF mode:

```jsonc
// shared/libs/BlinkLogic/library.json
{
  "name": "BlinkLogic",
  "version": "0.1.0",
  "build": { "srcDir": ".", "srcFilter": ["+<*>", "-<test>", "-<examples>"] }
}
```

**Path resolution:** relative `symlink://`/`file://` paths resolve against the **project directory** (PlatformIO wraps commands in `fs.cd(project_dir)`; `_symlink.py` checks `os.path.isdir` against that CWD). From `homeworks/m01-l03-blink/` the correct spelling is `symlink://../../shared/libs/Name`, and it keeps working when driven as `pio run -d homeworks/m01-l03-blink`.

### Pattern 2: One-way config import — `extra_configs` fragment plus common `[env]`; `extends` only for whole profiles

**What:** Each homework imports one shared fragment and re-declares only what it changes:

```ini
; shared/pio/base.ini  (fragment — NOT named platformio.ini)
[common]
platform = espressif32@7.1.3        ; exact pin; the scaffold's ^6.0.0 range violates the owner's own rule
board = esp32-s3-devkitc-1          ; N8 baseline — every N16R8 project overrides below
monitor_speed = 115200              ; default 9600 is wrong
monitor_filters = esp32_exception_decoder
debug_tool = esp-builtin            ; built-in JTAG on GPIO19/20
[env]
build_flags = -Wall -Wextra
```
```ini
; homeworks/m01-l03-blink/platformio.ini
[platformio]
extra_configs = ../../shared/pio/base.ini
[env:m01l03_s3]
platform = ${common.platform}
board = ${common.board}
board_upload.flash_size = 16MB
board_build.partitions = default_16MB.csv      ; verify the CSV name against the installed core
board_build.arduino.memory_type = qio_opi      ; N16R8 = octal PSRAM
build_flags = ${env.build_flags} -DBOARD_HAS_PSRAM
```

**When to use:** Every project. Direction is strictly one-way: homework imports shared; shared never imports homework.

**Trade-offs:** Documented override rule makes this safe — "If you declare the same pair of 'group' + option in an extra configuration file which was previously declared in a base platformio.ini, it will be overwritten with a value from extra configuration." Two hazards are structural, not user error:

1. **`extra_configs` globs run against the project dir, not the file that declared them.** `ProjectConfig.read` does `glob.glob(pattern)` against the process CWD, and PlatformIO guarantees CWD = project dir. There is no per-option source tracking (open requests #5384/#5387, Feb 2026). Write every `extra_configs` path from the homework's point of view.
2. **`extends` does not merge.** "If multiple items specified in the `extends` field then only values from the latter one will be used" — the docs' own example has `lib_deps1` silently wiped out by `lib_deps2`. Use the common `[env]` section and `${env.x}` interpolation to combine list values; use `extends` only for whole named profiles (release/debug/board).

**Debugger:** `pio project config -d DIR` prints the fully expanded computed config; `pio project config -d DIR --lint` (added in Core 6.1.8, available on the pinned 6.2.0) reports parse errors with file + line, and `--json-output` makes it scriptable across all projects.

**Other pins that belong in the fragment:** `build_cache_dir = <repo>/.pio-cache` (documented cross-project object cache — cached objects are rejected when the source or build configuration changed), `lib_ldf_mode` (start `chain`, graduate to `off` once every dependency including transitive ones is declared; the docs call `deep`/`deep+` "not generally recommended" and publish no timing data, so any "% slower" claim is unverified folklore). Keep `workspace_dir` per project so two homeworks needing different versions of an Arduino library cannot fight over one `libdeps/`.

**Board reality (this hardware, 2026-10-15):** `board = esp32-s3-devkitc-1` in espressif32 v7.1.3 describes the **N8** module only — 8 MB quad flash, `default_8MB.csv`, no PSRAM, `-DARDUINO_USB_MODE=1` but no CDC-on-boot. The physical module is **N16R8** (16 MB quad flash, 8 MB octal PSRAM), so flash size, partition table, `memory_type = qio_opi` and `-DBOARD_HAS_PSRAM` must be overridden per project, and **GPIO35/36/37 are consumed by the PSRAM** — the pin-validator and the generated wiring diagrams must enforce that. Verify the physical variant once with the esptool eFuse banner ("Embedded Flash/PSRAM …") and record it in each homework README. Also pin `upload_speed = 460800` (official platform), pin `upload_port`/`monitor_port`/`test_port` explicitly (two USB ports invite mixups), and never burn the USB_PHY_SEL eFuse.

### Pattern 3: Canonical wiring artifact with a drift guard

**What:** One `diagram.json` per homework is simultaneously the Wokwi simulation input, the source of `docs/wiring.svg`, the pin-connection table and the Mermaid overview. Generation is a repo-owned tool (`tools/render-diagram/` — Wokwi has no whole-diagram image export), and the pipeline is checked, not trusted:

```bash
node tools/render-diagram/render.mjs homeworks/m01-l03-blink \
  && git diff --exit-code -- homeworks/m01-l03-blink/docs   # stale artifacts fail
wokwi-cli lint homeworks/m01-l03-blink/diagram.json --warnings-as-errors --offline
node tools/check-pins.mjs homeworks/m01-l03-blink           # rejects GPIO35/36/37 and unknown pins
```

**When to use:** Every homework, created by the scaffolding skill in the same run that creates the project.

**Trade-offs:** The renderer is repo code to maintain, and the drift guard makes `docs/` a build output that must be regenerated in the same commit as any `diagram.json` edit. In exchange the image, the table and the simulator can never disagree, and both checks are offline — so they run in pre-commit and in CI with no token and no quota.

### Pattern 4: One canonical agent tree in `.agents/`, mirrored into `.claude/`

**What:** `AGENTS.md` is the only file both harnesses read natively. Everything else is authored once under `.agents/` and exposed to Claude Code by symlink.

| Artifact | Antigravity reads | Claude Code reads | Shared? |
|---|---|---|---|
| Always-on rules | `<dir>/AGENTS.md` / `<dir>/GEMINI.md` at any level, cumulative, no frontmatter | `./AGENTS.md` (and ancestors) **only when no `CLAUDE.md`/`.claude/CLAUDE.md`/`CLAUDE.local.md` exists at or above CWD** | Yes — `AGENTS.md` is the only natively shared file |
| Per-topic rules | `.agents/rules/*.md` — frontmatter is **mandatory**: `trigger: always_on \| model_decision \| glob \| manual`, `description` (for `model_decision`), `globs` (for `glob`); missing/unrecognised trigger = **silently discarded** | `.claude/rules/**/*.md`; only the `paths:` field is read — every other field ignored without error; no `paths:` ⇒ loads unconditionally at launch; symlinks supported | Body yes, frontmatter no — one body, two frontmatter blocks, generate one from the other |
| Skills | `<workspace-root>/.agents/skills/<folder>/SKILL.md` | `.claude/skills/<name>/SKILL.md` | Body yes (Agent Skills standard); directory is not configurable on either side |
| Hooks | `.agents/hooks.json` (6 events, camelCase payloads) | `hooks` key in `.claude/settings.json` (~30 events, snake_case) | Scripts only — four event names overlap; schemas do not |
| Subagents / MCP / plugins | `.agents/agents/`, `.agents/mcp_config.json` (`serverUrl`) | `.claude/agents/`, `.mcp.json` (`url` + `type`) | Tool vocabulary is disjoint; sharing one `tools:` field can HANG an Antigravity subagent |
| Memory | none documented | auto memory under `~/.claude/projects/<project>/memory/`, machine-local, never committed | None — durable cross-harness knowledge must be written into AGENTS.md/rules/skills |

**Skills mirroring (the mechanism this repo needs):** one `SKILL.md` body per skill, authored to the agentskills.io six fields (`name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`), living at `.agents/skills/<name>/SKILL.md`, with `.claude/skills/<name>` → `../../.agents/skills/<name>` (git mode 120000) or a generated copy. Avoid Claude Code-only frontmatter in shared skills.

**Uncertain — needs a live smoke test before it is relied on:** Claude Code's docs state that a *`<skill-name>` entry* in a skills directory may be a symlink to a directory elsewhere on disk. A **whole-directory** symlink (`.claude/skills` → `../.agents/skills`) is **not documented**, and the abandoned `vl/init` scaffold chose directory-level symlinks (commit `c729f79`) — i.e. exactly the undocumented case. Test both shapes on the installed Claude Code 2.1.300 before the roadmap commits to one.

**Size limits make "short AGENTS.md" load-bearing, not stylistic:** Antigravity truncates any single rule file over 24 000 bytes and, when all always-on rules exceed a shared 20 000-token budget, silently demotes the largest files from inline text to pointers — an oversized `AGENTS.md` loses its guaranteed always-on status without an error. Claude Code's guidance is softer (<200 lines per file; files over 4 MiB skipped entirely).

**Anti-pattern, stated once:** never build reusable procedures on `.agents/workflows/*.md`. Antigravity's legacy workflows stop working on **19 October 2026** (four days after this research date) and are replaced by Agent Skills; `/migrate-workflows` converts leftovers.

### Pattern 5: Hardware seam inside shared libraries

**What:** Shared libraries sit behind a seam so the Arduino core (2.0.17, today) can be replaced by ESP-IDF without rewriting the modules: pure logic (state machines, protocol framing, formatting) is framework-free and host-testable; only the thin bottom layer touches Arduino APIs and the board.

**When to use:** Any shared module whose logic could ever be unit-tested without hardware.

**Trade-offs:** Costs one extra indirection (an interface/port header per module) and a `native` environment per project that pulls in no Arduino at all. It buys the L1 test layer — millisecond, offline, free — and it is the same seam that makes the later IDF migration mechanical. A repo-owned `seam grep` check in CI can enforce that no Arduino header appears above the seam in `shared/`.

### Pattern 6: Verification ladder mapped to gates

| Layer | What it proves | Where it runs | Cost/limits |
|---|---|---|---|
| L0 lint + build | Formats, static analysis, compiles for the target | pre-commit (fast checks), pre-push (build changed), CI (build changed + lint all) | Free, offline |
| L1 host unit tests | Pure logic on `platform = native` | pre-push for changed projects; CI matrix | Milliseconds |
| L2 QEMU smoke | Firmware boots, no panic/backtrace | CI on changed projects | Needs a platform-matched `espressif/qemu` asset (vendored + cached) |
| L3 Wokwi | Wiring + behaviour in simulation | Local editor now; **CI deliberately deferred** | Free tier 50 simulation-minutes per rolling 30 days, 5-minute session cap |
| L4 real hardware | Truth | Manual, by the owner | Requires the board |

Root sweep (there is no recursive PlatformIO command; `-d/--project-dir` exists on run/check/test/config/metadata):

```bash
find . -name platformio.ini -not -path '*/.pio/*' -print | while read -r f; do
  d=$(dirname "$f")
  ~/.platformio/penv/bin/pio project config -d "$d" --lint || fail=1
  ~/.platformio/penv/bin/pio run   -d "$d"                    || fail=1
  ~/.platformio/penv/bin/pio check -d "$d" --fail-on-defect=high --skip-packages || fail=1
done; exit ${fail:-0}
```

One project's failure must not hide the others — accumulate `fail` rather than exiting on the first error.

## Data Flow

### Flow 1 — Homework lifecycle (create → build → verify → submit)

```
freeform request
   ↓  scaffolding skill, mode = guide | auto (never guessed)
homeworks/<id>/ scaffolded from the template
   ↓  platformio.ini (extra_configs → shared/pio/base.ini) + lib_deps symlinks
   ↓  diagram.json authored  →  tools/render-diagram → docs/{svg,pin table,mermaid}
   ↓  workspace folder registered in homework.code-workspace (relative path)
pio run -d homeworks/<id>            # L0
pio test -e native -d homeworks/<id> # L1
wokwi-cli (local editor)             # L3
real board                           # L4
   ↓
README (instructor-facing, declares AI participation) + commit trailer
```

### Flow 2 — Configuration resolution (the "state" of a project)

```
homeworks/<id>/platformio.ini
   ↓ [platformio] extra_configs (globbed against the PROJECT dir)
shared/pio/base.ini
   ↓ section merge: [env] is the common, flattening section; extends takes ONLY the last profile
   ↓ interpolation: ${env.x}, ${common.x}, ${PROJECT_DIR}, ${this.__env__}
computed config  ── pio project config --lint / --json-output  (the only honest way to read it)
   ↓
.pio/ build dir (per project)  +  .pio-cache/ (shared object cache)
```

### Flow 3 — Shared-library change propagation

```
edit shared/libs/<Module>/
   ↓ symlink:// — no re-install, every consumer sees HEAD immediately
pre-push: pio-build.sh builds CHANGED projects
   ↓
CI checks.yml: build changed (+ build all on main)
```

### Flow 4 — Wiring-artifact generation and drift guard

```
diagram.json (canonical)  ──► tools/render-diagram ──► docs/wiring.svg + pin table + Mermaid
        │                                                  │
        │ wokwi-cli lint --offline                          │ git diff --exit-code (stale ⇒ fail)
        └──► tools/check-pins (GPIO35/36/37 + unknown pins rejected)
```

### Key Data Flows

1. **Rules → agent context:** `AGENTS.md` loads in both harnesses; `.agents/rules/*.md` load by trigger/glob in Antigravity and by `paths:` in Claude Code; skill bodies load on demand via progressive disclosure on `name` + `description` only.
2. **Requested dependency → compiled object:** `lib_deps` line → symlink resolved against the project dir → `library.json` manifest → LDF → `src/` sources compiled into the project's `.pio/` (with a manifest, nested sources need `build.srcDir`/`build.srcFilter`).
3. **Check definition → every gate:** `.pre-commit-config.yaml` is the single definition; pre-commit, pre-push and CI all invoke it, so a check cannot exist in one gate and not another.
4. **Board facts → all artifacts:** the N16R8 constraint (16 MB flash, octal PSRAM, GPIO35/36/37 unavailable) is stated once in `shared/libs/<BoardPins>`, consumed by firmware, by `check-pins`, and by the generated wiring artifact.

## Scaling Considerations

| Scale (repo size) | Architecture Adjustments |
|---|---|
| 1–3 homeworks | Per-project `.pio/` is enough; `.pio-cache` adds little; run sweeps by hand. Keep `lib_ldf_mode = chain`. AGENTS.md + skills only; no `.agents/rules/` yet. |
| ~10–20 homeworks | Shared `build_cache_dir` starts paying for itself; `.pre-commit-config.yaml` gains the changed-project pre-push hook; `.code-workspace` folder list becomes the main editor cost (see priorities). CI switched to changed-path detection. |
| ~60 homeworks (full course) | Changed-path matrices everywhere; `.agents/rules/` earns its keep; every extra file in the tree multiplies by 60 — resist adding per-homework files that are not the template's (see Anti-Pattern 8). Re-check Wokwi quota arithmetic if L3 is ever enabled in CI. |

### Scaling Priorities

1. **First bottleneck: repeated core compilation.** Ten projects each recompiling the same Arduino/ESP-IDF core. Fix: one `build_cache_dir` in the shared fragment (documented cross-project option; keep `workspace_dir` per project so `libdeps` never collide).
2. **Second bottleneck: the editor, not the build.** The workspace accumulates one folder per homework, each PlatformIO project carrying generated per-project `c_cpp_properties.json`/`launch.json`, and the IDE historically activates the *wrong* project by default. Fixes: `platformio-ide.activateProjectOnTextEditorChange: true`, project-scoped env names, and ignoring the generated files.
3. **Third bottleneck: CI wall-clock on the full sweep.** Fix: changed-path jobs with a full build only on `main`, plus the cache; do not add simulation to the per-push path.

## Anti-Patterns

### Anti-Pattern 1: Building the shared-code story on `lib_extra_dirs`

**What people do:** Point every project at one shared folder with `lib_extra_dirs = ../../shared/libs`.
**Why it's wrong:** Documented as "Deprecated since version 6.0 … will be removed in the next major release". It still works in Core 6.2.0, which is exactly why the mistake is easy to make and expensive to discover later. (The abandoned `vl/init` scaffold used it — a live contradiction, resolved in favour of the docs.) `globallib_dir` is deprecated with an explicit rationale against global libraries.
**Do this instead:** One real library per module + `lib_deps = Name=symlink://../../shared/libs/Name`.

### Anti-Pattern 2: A manifest-less or layout-wrong shared module

**What people do:** Symlink a bare folder of `.c`/`.cpp` files, or add `library.json` but leave sources outside the library's default `src/` layout.
**Why it's wrong:** `name` and `version` are Required fields — a manifest-less folder fails outright. With a manifest but the wrong layout the headers resolve and the sources never compile → undefined-reference linker errors from nested `src/` (platformio-core #5493), and LDF mode changes (`chain+`, `deep+`) do not help.
**Do this instead:** `library.json` per module with `build.srcDir: "."` and `build.srcFilter` excluding `test`/`examples`, and a build of at least one consumer in CI.

### Anti-Pattern 3: Expecting `extends` to merge

**What people do:** `extends = base, strict_ldf` and assume the union.
**Why it's wrong:** Only the last extended section's value survives for any option — the docs' own example loses `lib_deps1` entirely. A list-valued option silently loses data.
**Do this instead:** Common `[env]` for mergeable defaults, `${env.x}` interpolation to extend a list, `extends` only for whole profiles.

### Anti-Pattern 4: Assuming a relative path inside a shared `.ini` is relative to that file

**What people do:** Write `extra_configs = common/base.ini` inside a fragment, or a relative path in the fragment expecting it to resolve next to the fragment.
**Why it's wrong:** `extra_configs` patterns are globbed against the **project dir** (PlatformIO sets CWD to the project), and there is no per-option source tracking (#5384/#5387) — so "where did this flag come from" is a manual grep.
**Do this instead:** Express every `extra_configs` path from the homework's point of view (`../../shared/pio/base.ini`), and use `pio project config` to print the computed result.

### Anti-Pattern 5: A stray `CLAUDE.md`

**What people do:** Add a `CLAUDE.md` (an empty one, a leftover, or one written for a different purpose) at or above the working directory.
**Why it's wrong:** Under Claude Code's default `claude-md-or-agents-md` behaviour, any `CLAUDE.md`/`CLAUDE.local.md` at or above CWD makes Claude read **its CLAUDE.md files only** and ignore `AGENTS.md` entirely — while Antigravity keeps reading `AGENTS.md`. The two harnesses then run on divergent instructions with no error in either. This is the single highest-risk footgun in the two-harness design.
**Do this instead:** Owner decision (2026-10-15): **no `CLAUDE.md` anywhere** — Claude Code 2.1.277+ reads `AGENTS.md` directly (local version 2.1.300 verified; a session prints "no CLAUDE.md found; AGENTS.md loaded: …"). Guard it: a check that fails if a `CLAUDE.md`/`.claude/CLAUDE.md` appears. Note the alternative that other findings recommend — a one-line `CLAUDE.md` containing `@AGENTS.md`, which expands at launch and also works on versions/settings that cannot read AGENTS.md directly. The two positions are compatible on content and differ only on the shim; if the shim is ever added it must contain the import, never anything else. Also note: Claude Code does not read `AGENTS.local.md`, `AGENTS.override.md` or anything under `.agents/`, and direct AGENTS.md reading does not fire `InstructionsLoaded` hooks.

### Anti-Pattern 6: Building agent procedures on Antigravity workflows

**What people do:** Put reusable procedures in `.agents/workflows/*.md` (they still produce `/<name>` slash commands today).
**Why it's wrong:** Legacy workflows stop working on **19 October 2026**; after that they are not indexed or executed. Skills take precedence where both exist.
**Do this instead:** Skills only — `.agents/skills/<name>/SKILL.md`, which both harnesses also expose as `/<name>`.

### Anti-Pattern 7: Committing generated editor artifacts, or inheriting a `.gitignore`

**What people do:** Commit `.vscode/c_cpp_properties.json`, `.vscode/launch.json` and per-project `compile_commands.json`; or assume `pio project init` wrote a complete `.gitignore`.
**Why it's wrong:** All three carry absolute, machine-specific toolchain paths and are regenerated ("DO NOT MODIFY" header); PlatformIO's own optional template ignores the first two (the third predates clangd). And `pio project init` writes a `.gitignore` containing only `.pio` and **returns early if one already exists** — it will not merge.
**Do this instead:** Author the root `.gitignore` deliberately: `.pio/`, `.vscode/c_cpp_properties.json`, `.vscode/launch.json`, `.vscode/.browse.c_cpp.db*`, `.vscode/ipch`, `compile_commands.json`, `.pio-cache/`. Do commit `.vscode/settings.json`, `.vscode/tasks.json`, `.vscode/extensions.json`.

### Anti-Pattern 8: Treating `board = esp32-s3-devkitc-1` as this board

**What people do:** Take the platform's `esp32-s3-devkitc-1` definition at face value.
**Why it's wrong:** It describes the N8 module only — 8 MB quad flash, `default_8MB.csv`, **no PSRAM**. The physical module is N16R8: 16 MB flash and 8 MB octal PSRAM, and GPIO35/36/37 are consumed by that PSRAM. A homework that "works" in a default environment is running a wrong configuration.
**Do this instead:** Override `board_upload.flash_size`, `board_build.partitions`, `board_build.arduino.memory_type = qio_opi` and `-DBOARD_HAS_PSRAM` in every environment; verify the variant once with the esptool eFuse banner; enforce the pin restriction in `check-pins`.

### Anti-Pattern 9: Sharing one `workspace_dir`, or shipping empty `[section]`s

**What people do:** Centralise build output in one `[platformio] workspace_dir`, or keep empty section headers in a shared fragment as override slots.
**Why it's wrong:** A shared `workspace_dir` shares `libdeps/`, so two homeworks needing different versions of an Arduino library collide; empty sections in a fragment loaded by `extra_configs` broke on Core 6.1.6 and worsened through 6.1.14 (platformio-core #4884).
**Do this instead:** Per-project `.pio/` plus a shared `build_cache_dir` (the documented cross-project option); omit the section or give it a real placeholder value.

### Anti-Pattern 10: The same `[env:NAME]` in every homework

**What people do:** Copy `[env:esp32-s3]` into all projects.
**Why it's wrong:** Legal (env names need uniqueness only within a project) but the IDE fails to re-sync between projects that define the same environment name (platformio-vscode-ide #2320), so the wrong homework gets built.
**Do this instead:** Project-scoped env names (`[env:m01l03_s3]`), plus `platformio-ide.activateProjectOnTextEditorChange: true`.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---|---|---|
| PlatformIO Core | `~/.platformio/penv/bin/pio` (NOT on the interactive PATH); Core 6.2.0 (2026-09-05), pinned `additional_dependencies: ["platformio==6.2.0"]` in hooks and CI | Official `platformio/espressif32` **v7.1.3** (2026-09-11). Its `platform.json` pins `framework-arduinoespressif32: ~4.20017.0` → **Arduino core 2.0.17**; one finding, reading the registry's newest framework package (4.30312.261011 = core 3.3.12), claimed v7.1.3 ships 3.3.12 — **disputed**; the machine measurement in `.planning/PROJECT.md` (2026-10-15) agrees with 2.0.17. Confirm with `pio pkg list` after the first build before writing any number into docs. The pioarduino fork (55.03.312-1, 2026-09-22, Arduino 3.3.12/IDF 5.5.5) is **not used** (owner decision). Never `platformio/platform-espressif32.git#develop`. |
| Wokwi (local editor) | Author `diagram.json`; simulate in the editor | Free tier: 50 simulation-minutes per rolling 30 days, 5-minute session cap |
| `wokwi-cli` (lint) | `wokwi-cli lint <hw>/diagram.json --warnings-as-errors --offline` | Offline, token-free → safe for pre-commit and CI |
| Wokwi CI | `wokwi/wokwi-ci-action@v1` with `token: ${{ secrets.WOKWI_CLI_TOKEN }}` | **Deferred** (owner decision). Budget arithmetic to record when it is enabled: 60 homeworks × ~10 s ≈ 10 min per full sweep vs a 50-minute/month free window → full sweeps only on merge-to-main/manual (~5/month), changed-path on PRs, optional rotating nightly subset (~1 min/night ≈ 30 min/month); Wokwi Hobby = 200 min. Uncertainties: the action documents no timeout-exit-code input (distinguishing timeout 42 from an assertion failure may need direct `wokwi-cli` invocation), and each run uploads the firmware binary to Wokwi's cloud (deleted after the run; no opt-out short of on-prem). |
| QEMU (L2) | Vendored `espressif/qemu` asset matched to the runner OS/arch (cache it), build firmware, `esptool merge_bin`, `qemu-system-xtensa -nographic -machine esp32s3` with the `wdt_disable` global; fail on non-zero exit or a panic/backtrace pattern | The research's example merges with `--fill-flash-size 8MB` — **inconsistent with the N16R8 module**; use 16 MB. The binary is platform-specific, so the fetch script must resolve per runner. |
| Toolchain pins | clang-format 23.1.3 (LLVM 23.1.3, 2026-10-06) via `mirrors-clang-format v23.1.3`; markdownlint-cli2 v0.23.3; lychee v0.24.2; pre-commit **4.6.0** measured locally (a finding claiming 4.7.0 is contradicted by measurement) | PlatformIO's own bundled analysers are `tool-clangtidy` 1.190100.0 (LLVM 19.1.0) and `tool-cppcheck` 1.22200.0 (cppcheck 2.22.0) — a 3-major skew against clang-format 23.1.3. Validate `.clang-tidy` with `clang-tidy --verify-config` against the binary actually used; if `check_flags` is ever set, restate PlatformIO's cppcheck defaults (`--inline-suppr`, `--platform`, `--enable=…`) or they silently vanish; never leave clang-tidy at `--checks=*`. |
| VS Code / PlatformIO IDE | Committed `.vscode/settings.json` + `extensions.json`; workspace settings in `homework.code-workspace` | Official extension is frozen (v3.3.4, 2025-01-11, no releases in 20 months); the pioarduino fork is active (last push 2026-05-11) but is **not chosen** (owner decision: official platform). Multi-project workspaces are officially supported. |
| GitHub Actions | `checks.yml`, `native.yml`, `qemu.yml` (+ deferred `wokwi.yml`) | Cache keys must include the `platformio.ini` files, not only the hook config; respect GitHub's 10 GB/repo and 7-day LRU cache limits. |

### Internal Boundaries

| Boundary | Communication | Notes |
|---|---|---|
| homework project ↔ `shared/libs` | Declarative `lib_deps` + `symlink://` | Relative to the **project** dir; manifest required; live edits, no re-install |
| homework project ↔ `shared/pio/base.ini` | `extra_configs` (glob against project dir) + `[env]` + interpolation | One-way only; project re-declares single keys to override |
| `homework.code-workspace` ↔ each project | Relative folder path, registered when the homework is scaffolded | Root/`.agents`/`shared` folders carry no `platformio.ini` so the extension treats them as plain folders. The current file on branch `repo/init` is stale — it points at one absolute external path (`../../../Documents/PlatformIO/Projects/1_3-Blink`); the target shape lists the repo's own folders relatively. |
| `AGENTS.md` ↔ `.agents/rules` ↔ `.claude/rules` | Body shared; frontmatter per harness (`trigger`+`globs` vs `paths`) | Never hand-maintain both — generate one from the other and add a drift check |
| `.agents/skills` ↔ `.claude/skills` | Symlink (per-skill entry is documented; whole-directory is not) | Smoke-test before relying on the directory-level form |
| `diagram.json` ↔ `docs/` ↔ Wokwi | Generated + drift-guarded | One source, three consumers, no manual edits to `docs/` |
| `scripts/` ↔ pre-commit ↔ CI | Same scripts invoked from all gates | pre-commit stage = fast and network-free; token/quota work is CI-only by design, so a commit can never fail on Wokwi quota |
| Commit / push / CI gates | pre-commit (fast, per-commit) → pre-push (build + native tests for changed projects) → CI (build changed, lint **all**) | Owner decision. The CI research proposes four workflows; the abandoned scaffold had two jobs (static, platform) both driven by pre-commit. The reconcilable shape: keep `.pre-commit-config.yaml` as the single definition of the static checks and have CI run it, then split the heavy per-layer work (native matrix, QEMU) into their own workflows — one workflow per verification layer, one definition per check. |

## Sources

- PlatformIO project-config docs: `lib_extra_dirs` deprecation, `globallib_dir`, `lib_dir`, `shared_dir`, `build_cache_dir`, `workspace_dir`, `extra_configs`, `[env]`, `extends`, `lib_ldf_mode`, `build_src_filter`, `check_tool`, `check_src_filters`, interpolation — https://docs.platformio.org/en/latest/projectconf/…
- PlatformIO library manager: LDF storage priority and dependency-finder modes; dependency declaration philosophy — https://docs.platformio.org/en/latest/librarymanager/ldf.html and /dependencies.html
- PlatformIO manifests: `library.json` schema, Required `name`/`version`, `build.srcDir`/`build.srcFilter` — https://docs.platformio.org/en/latest/manifests/library-json/
- `pio install` local-folder semantics (`file://` copies, `symlink://` links live) and required manifest — https://docs.platformio.org/en/latest/core/userguide/pkg/cmd_install.html
- `pio run` / `pio check` / `pio project config` CLI references (including `--lint`, added 6.1.8, and `--fail-on-defect`) — https://docs.platformio.org/en/latest/core/userguide/…
- PlatformIO Core source (read on 2026-10-15): `project/options.py`, `project/config.py`, `package/manager/_symlink.py`, `builder/main.py`, `run/cli.py`, `fs.py`, `project/commands/init.py`, VS Code integration templates
- Issues: platformio-core #5493 (nested-src Local Folder trap), #4884 (empty sections in 6.1.6+), #5384/#5387 (no per-option source tracking, Feb 2026); platformio-vscode-ide #2320 and #2252 (active-project and env-name multi-root behaviour), #4527 (workspace management, 2026-10-09)
- Releases/registry (2026-10-15): Core 6.2.0 (2026-09-05); `platformio/espressif32` v7.1.3 (2026-09-11) and its `platform.json`; pioarduino `platform-espressif32` 55.03.312-1 (2026-09-22); official PlatformIO IDE v3.3.4 (2025-01-11) vs pioarduino-vscode-ide (2026-05-11)
- Antigravity docs: rules (discovery paths, mandatory frontmatter, size limits, `rules.json`), skills, hooks, subagents, MCP, plugins, workflows→skills migration (legacy sunset 2026-10-19) — https://antigravity.google/docs/…
- Claude Code docs: memory (`AGENTS.md` behaviour, the CLAUDE.md precedence rule, `.claude/rules/` `paths:` frontmatter, symlinks, imports), skills, hooks, sub-agents, MCP, plugins — https://code.claude.com/docs/en/…
- Agent Skills standard — https://agentskills.io/specification ; client showcase (Antigravity absent) — https://agentskills.io/clients
- VS Code: multi-root workspaces, IntelliSense/`C_Cpp.default.*`, cpptools #2060 (no global `c_cpp_properties.json`)
- Repository state, 2026-10-15: branch `repo/init` (HEAD `a9b043c`) — `.planning/PROJECT.md`, `.planning/config.json`, stale `homework.code-workspace` (absolute external path). Branch `vl/init` — the abandoned scaffold (12 commits, e.g. `0e2a1b9`, `c729f79`, `432862a`): `AGENTS.md`, `.agents/{rules×8,skills×3}`, `.claude/{rules,skills}` symlinks, `.clang-format` (LLVM base, 4-space, ColumnLimit 100, C++17), 3-stage `.pre-commit-config.yaml`, `.github/workflows/ci.yml`, `scripts/pio-{build,check,test-native}.sh`, `shared/libs/README.md`. `claude --version` = 2.1.300; pre-commit 4.6.0; PlatformIO Core 6.2.0 at `~/.platformio/penv/bin/pio`.

---

*Architecture research for: embedded coursework repository (PlatformIO / ESP32-S3, two AI harnesses)*
*Researched: 2026-10-15*
