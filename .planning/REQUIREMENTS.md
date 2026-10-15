# Requirements: homework — Embedded Coursework Repository

**Defined:** 2026-10-15
**Core Value:** Every homework stays buildable, demonstrable and self-explanatory long after it was submitted.

## v1 Requirements

The first milestone proves the whole loop on one real homework. Scope below was confirmed by the owner on 2026-10-15.

### Repository & workspace

- [ ] **REPO-01**: The repository opens as ONE VS Code workspace listing the repo root, `shared/`, and one folder per homework
- [ ] **REPO-02**: Each homework lives at `homeworks/<module>-<lesson>-<slug>/` as a self-contained PlatformIO project, buildable from the root with `pio run -d homeworks/<id>`
- [ ] **REPO-03**: Every homework sits exactly one directory level below `homeworks/`, because every shared-library path in `lib_deps` is relative to the project
- [ ] **REPO-04**: Machine-generated and machine-local artifacts (`.pio/`, `compile_commands.json`) are gitignored, never committed

### Board facts & pin safety

- [ ] **HW-01**: Every homework environment overrides the board for the N16R8 module — flash size 16 MB, the 16 MB partition table, `qio_opi` memory type, and the PSRAM build flag
- [ ] **HW-02**: `shared/hardware/` holds machine-readable board facts: the pin database, the constraint list, the module marking (N16R8), the board revision (initial revision, RGB LED on GPIO48) and the console port
- [ ] **HW-03**: A pin-validation check rejects electrically illegal nets — GPIO22-34 (absent from the headers), GPIO35/36/37 (consumed by octal PSRAM), external drive of strapping GPIO0/3/45/46, 5 V logic on a GPIO without a stated level shifter, and ADC2 (GPIO11-20) used together with WiFi
- [ ] **HW-04**: Every environment pins the platform to an exact version, never a range, and names its console port explicitly

### Shared libraries & the hardware seam

- [ ] **SHARED-01**: `shared/lib/<module>/` holds one real PlatformIO library per module, each with a `library.json` carrying name and version
- [ ] **SHARED-02**: Homework projects consume them through `lib_deps = <name>=symlink://../../shared/lib/<name>` — one line per library, including transitive ones
- [ ] **SHARED-03**: Shared code contains no Arduino or ESP-IDF includes; hardware is reached only through a narrow HAL interface, so the later IDF migration is a backend swap
- [ ] **SHARED-04**: A check fails the commit if a framework include appears under `shared/lib`, keeping the seam real as the repository grows

### Wiring artifacts

- [ ] **WIRE-01**: Each homework carries exactly one canonical `diagram.json`, agent-authored and committed
- [ ] **WIRE-02**: `diagram.json` passes the offline Wokwi lint (`wokwi-cli lint --warnings-as-errors --offline`) in pre-commit, with no token and no network
- [ ] **WIRE-03**: A repo-owned renderer generates `docs/wiring.svg` and `docs/netlist.md` from `diagram.json`; generated files are never hand-edited
- [ ] **WIRE-04**: CI fails when regenerating the artifacts produces a diff, so the committed image can never be stale
- [ ] **WIRE-05**: Each homework README shows a Mermaid topology overview and cites the official board pin-layout image rather than redrawing it

### Verification & quality gates

- [ ] **VERIFY-01**: `[env:native]` runs host unit tests for pure logic, while `[env:esp32s3]` ignores them — one source tree, two environments
- [ ] **VERIFY-02**: Pre-commit runs the fast non-compiling checks (format, lint, diagram lint, pin check, render-drift, seam grep); pre-push builds the changed projects and every consumer of a changed shared library
- [ ] **VERIFY-03**: CI builds changed projects and lints all of them, through a discover-then-matrix job with caching
- [ ] **VERIFY-04**: clang-format, clang-tidy and cppcheck are pinned once with committed configuration, valid for the analyser version actually bundled by PlatformIO
- [ ] **VERIFY-05**: Warning flags stay strict without `-Werror`, and `-Wpedantic` is scoped to the repository's own sources so framework-header noise cannot drown the signal

### Agent tooling

- [ ] **AGENT-01**: A short `AGENTS.md` at the root (target: under 200 lines, English) is the single source of truth for agent rules, with no `CLAUDE.md` present
- [ ] **AGENT-02**: Google Antigravity finds the same rules through the same file, with skills reachable from its own directory
- [ ] **AGENT-03**: Skills are canonical at `.agents/skills/<name>/SKILL.md` and mirrored per entry into `.claude/skills/`, with a broken-symlink check
- [ ] **AGENT-04**: A `new-homework` skill scaffolds a homework in one of two explicit modes — `guide` (teaches, and stops before writing homework logic) or `auto` (one-shot, no questions); an unspecified request asks which
- [ ] **AGENT-05**: The skill refuses to invent unverified pin or board facts, emitting an explicit unverified note instead of guessing

### Deliverable contract

- [ ] **DELIV-01**: Each homework README follows the instructor-facing contract: objective, hardware, wiring, how to build and run, how to verify, what is NOT verified, and AI participation
- [ ] **DELIV-02**: A repository README index lists every homework with its id, slug, board, one-line description and commit SHA
- [ ] **DELIV-03**: AI participation is declared in every homework README and in commit trailers

## v2 Requirements

Deferred until the v1 loop is validated on a real homework. Tracked, not in the current roadmap.

### Agent tooling

- **AGENT-06**: The `auto` mode of the scaffolding skill, once the template, board facts and pin database have been exercised by hand
- **AGENT-07**: `new-shared-lib` and `verify-work` skills, once a second homework needs the same module

### Verification

- **VERIFY-06**: `verify.sh` per homework declaring which layers apply and what each proves, with CI routing by it
- **VERIFY-07**: L2 QEMU boot smoke as a normal test environment, with a vendored emulator binary
- **VERIFY-08**: L3 Wokwi simulation run locally, once wiring-dependent homeworks begin
- **VERIFY-09**: A shared firmware-merge script for homeworks using a filesystem, OTA or a custom partition table

### Wiring

- **WIRE-06**: An optional true schematic sheet generated from `diagram.json`

### Operations

- **OPS-01**: Wokwi simulation in CI, gated to changed homeworks — blocked on the free-tier quota and firmware-upload trade-off
- **OPS-02**: Freeze-on-evidence for submitted homeworks, triggered if a submitted homework stops building or behaving as submitted
- **OPS-03**: Recorded hardware evidence per homework

## Out of Scope

| Feature | Reason |
|---------|--------|
| `lib_extra_dirs` / `globallib_dir` for shared code | Deprecated since PlatformIO Core 6.0, removal slated for the next major; it also makes every shared library a resolution candidate for every project |
| `file://` local dependencies | Copies into `.pio/libdeps` and is never refreshed — a rebuild silently compiles stale code |
| Git submodules for shared code | A repository cannot cleanly submodule itself; a clone without `--recursive` yields a broken build |
| Per-module semver, private registry, lockfiles | The owner's stated maintenance cost they cannot pay; exact pins in each configuration already cover it |
| Frozen submission tags | Owner decision — git history is sufficient; the README index row carries the commit SHA instead |
| A Wokwi-look wiring image (editor screenshot or whole-diagram export) | No whole-diagram render exists in Wokwi — confirmed three ways; the SVG is generated instead |
| `tscircuit` as the canonical wiring source | Its input is TSX, so it cannot be generated from the canonical file without a drifting second source |
| KiCad / SKiDL / Fritzing as the authoring path | No netlist-to-schematic path; frozen or GUI-only dependencies |
| Mermaid / D2 / Graphviz **as** the wiring diagram | Node graphs cannot express pin numbers, rails or header positions — a reader can mis-wire from them; Mermaid is kept as the README overview only |
| Renode as the emulator | Zero ESP32 support |
| QEMU as the primary hardware-free gate | On the ESP32-S3 it does not emulate the GPIO matrix, I2C, SPI, LEDC, USB, WiFi or Bluetooth — it cannot blink an LED |
| Hardware-only verification | Needs the board and a human; kept only as the final pre-submission layer |
| `-Werror` in global build flags | The next framework update would add a warning inside code the owner does not control, and the build stops compiling |
| `check_tool = clangtidy` without an explicit check list | PlatformIO then enables every check, including irrelevant language families, and the linter looks useless |
| Committing `compile_commands.json` or `.pio/` | Generated, contains absolute machine-local paths, and misleads tooling across projects |
| A symlinked or duplicated `CLAUDE.md` | Editing through a symlink is refused; a copy drifts silently; and its mere presence switches `AGENTS.md` off for Claude Code |
| A per-homework `AGENTS.md` for every homework | Nested-file semantics differ per harness; dozens of instruction files is the configuration smell at directory scale |
| Lecture notes, transcripts and theory | They live in a separate Obsidian vault |
| BLE simulation | Not implemented by Wokwi or QEMU — BLE work is host tests plus real hardware |

## Traceability

Which phases cover which requirements. Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| REPO-01 | Phase 1 | Gaps Found |
| REPO-02 | Phase 1 | Gaps Found |
| REPO-03 | Phase 1 | Gaps Found |
| REPO-04 | Phase 1 | Gaps Found |
| HW-01 | Phase 2 | Pending |
| HW-02 | Phase 4 | Pending |
| HW-03 | Phase 4 | Pending |
| HW-04 | Phase 2 | Pending |
| SHARED-01 | Phase 3 | Pending |
| SHARED-02 | Phase 3 | Pending |
| SHARED-03 | Phase 3 | Pending |
| SHARED-04 | Phase 3 | Pending |
| WIRE-01 | Phase 4 | Pending |
| WIRE-02 | Phase 4 | Pending |
| WIRE-03 | Phase 4 | Pending |
| WIRE-04 | Phase 4 | Pending |
| WIRE-05 | Phase 4 | Pending |
| VERIFY-01 | Phase 5 | Pending |
| VERIFY-02 | Phase 6 | Pending |
| VERIFY-03 | Phase 6 | Pending |
| VERIFY-04 | Phase 5 | Pending |
| VERIFY-05 | Phase 5 | Pending |
| AGENT-01 | Phase 7 | Pending |
| AGENT-02 | Phase 7 | Pending |
| AGENT-03 | Phase 7 | Pending |
| AGENT-04 | Phase 7 | Pending |
| AGENT-05 | Phase 7 | Pending |
| DELIV-01 | Phase 8 | Pending |
| DELIV-02 | Phase 8 | Pending |
| DELIV-03 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 30 ✓
- Unmapped: 0

**Per-phase counts:**
- Phase 1 (Repository Skeleton and Project Layout): REPO-01..04 — 4
- Phase 2 (Board and Environment Baseline, N16R8 Acceptance Gate): HW-01, HW-04 — 2
- Phase 3 (Shared Libraries and the Hardware Seam): SHARED-01..04 — 4
- Phase 4 (Wiring Pipeline and Pin Safety): WIRE-01..05, HW-02, HW-03 — 7
- Phase 5 (Verification Layers and Pinned Static Checks): VERIFY-01, VERIFY-04, VERIFY-05 — 3
- Phase 6 (Hook and CI Gates): VERIFY-02, VERIFY-03 — 2
- Phase 7 (Agent Rules and the Scaffolding Skill): AGENT-01..05 — 5
- Phase 8 (The First Real Homework, End to End): DELIV-01..03 — 3

---
*Requirements defined: 2026-10-15*
*Last updated: 2026-10-15 after roadmap creation (traceability populated, 30/30 mapped)*
