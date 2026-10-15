# Walking Skeleton — homework (Embedded Coursework Repository)

**Phase:** 1 — Repository Skeleton and Project Layout
**Generated:** 2026-10-15
**Status:** contract for every later vertical slice; treat as architectural backbone, not a scratchpad

---

## Adapter note — how this document departs from the template

The canonical `SKELETON.md` template describes a web application: project scaffold → routing → database read/write → UI interaction → dev deployment. **This repository has none of those.** It is a public, single-author, multi-project embedded-coursework repository: no server, no routing, no database, no browser UI, no deployment target.

The *concept* the template encodes is "the thinnest possible end-to-end working slice, proven before anything is built on it". Mapped onto this repository, the full stack that must be proven end-to-end is:

```text
a homework folder on disk
  -> the repo tool layer discovers and validates it
  -> a generated workspace file lists it as a top-level root
  -> PlatformIO builds it from the repo root with one command
  -> the build output stays out of git
  -> a repo-wide sweep finds it, and fails loudly when it finds nothing
```

That is exactly Phase 1's success criteria 1, 2 and 4. The template rows below are therefore **re-labelled to the stacks this repository actually has**; the "Stack Touched in Phase 1" checklist is the template's list with the web-only rows replaced by their analogues. Nothing was dropped — the web rows (routing, DB read/write, UI interaction, dev deployment) have no analogue here and are recorded as such rather than silently omitted.

Second departure: the template's `## Subsequent Slice Plan` assumes each later phase adds a *user-visible capability*. Here each later phase adds a **mechanism** that the eventual capability (Phase 8's real homework) is made of. The slice plan below is written in those terms.

---

## Capability Proven End-to-End

> One sentence: the smallest user-visible capability that exercises the full stack.

**A reader who clones this repository can open one committed workspace file and see the repository root, the shared-library tree and every homework as top-level roots — and can build any one of those homeworks from the repository root with a single command.**

Verification of that sentence does not require the physical board: the baseline project compiles, it is not flashed.

---

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Build system | PlatformIO Core **6.2.0**, invoked as `pio run -d homeworks/<id>` | The pinned project toolchain; `-d/--project-dir` is the whole multi-project story. PlatformIO is deliberately **not** on the interactive PATH on this machine, so every script and every documented command resolves it explicitly. |
| Platform pin | `platform = espressif32@7.1.3` — an exact version, never a range, never the unreleased development branch | Project constraint. The platform manifest declares the Arduino core as a `~` range, so the *platform* pin is what makes a build reproducible. |
| Board | `board = esp32-s3-devkitc-1` plus four explicit N16R8 overrides (16 MB flash size, `default_16MB.csv`, `qio_opi` memory type, `-DBOARD_HAS_PSRAM`) | The official manifest describes the **N8 / no-PSRAM** module. `memory_type` selects which prebuilt core library set is linked, so a wrong value is not cosmetic. |
| Console port | **Deliberately unset** in Phase 1 | The repository is public and `pio device list` shows no usable port on this machine. A committed port would be either a private machine detail or a build-breaker elsewhere. Phase 2 settles port and console after the on-hardware acceptance run. |
| Directory layout | `homeworks/<module>-<lesson>-<slug>/` (one level), `shared/lib/<module>/`, `tools/`, `docs/` (Phase 4) | Frozen by ROADMAP/REQUIREMENTS. The one-level depth is load-bearing: every shared-library path is relative to the project, so `symlink://../../shared/lib/<Name>` cannot resolve from a deeper folder. |
| Tooling language | **Node.js v26.7.0 ES modules** over the Node standard library only, tested with built-in `node:test` | One tooling language under one `tools/` folder. Zero install, zero `package.json`, zero dependency — and it removes the shell-glob divergence class entirely (zsh aborts on an unmatched glob; POSIX `sh` silently exits 0). |
| Homework identity | One frozen regex, applied **before** a name becomes a path, in one shared module (`tools/lib/discover.mjs`) | Input validation is this phase's one real security control, and one discovery source is what stops the workspace file, the sweep and the future CI matrix from disagreeing about what a homework is. |
| Generated artifacts | `homework.code-workspace` is generated from the filesystem and guarded by a `--check` drift test; it is **never** hand-edited | The generator is a pure function of the tree, so "the workspace file lists fewer homeworks than the tree contains" becomes structurally impossible instead of merely discouraged. Phase 4 reuses the same idiom for the wiring artifacts. |
| Ignore semantics | Git is the oracle: `git status --porcelain` asserts, `git check-ignore -v` diagnoses | gitignore has real subtleties (unanchored patterns, negation, the trailing-comment trap). Re-implementing it in the tool layer fails silently and late. |
| Editor/format ownership | One owner per rule: `.editorconfig` owns text-level rules; `.vscode/settings.json` owns only what EditorConfig cannot express; `.clang-format` (Phase 5) alone owns C/C++ indentation and column limit | The abandoned scaffold had three files carrying the same values, which is how a rule ends up contradicting itself. |
| Agent rules | One root `AGENTS.md`; **no** `CLAUDE.md` anywhere | A stray `CLAUDE.md` silently switches `AGENTS.md` off for Claude Code. Skills mirroring is Phase 7. |

---

## Stack Touched in Phase 1

Template rows replaced by their analogues for this repository (see the adapter note):

- [x] **Project scaffold** — `tools/` (the Node tool layer), the root `.gitignore` / `.editorconfig` / `.gitattributes` / `.vscode/*`, and the committed baseline PlatformIO project
- [x] **"Routing"** — *analogue:* **discovery**. One module decides what a homework is, and every consumer routes through it. There is no request routing in this repository.
- [x] **"Database read/write"** — *analogue:* **the filesystem as the single source of truth**. One real write (the generator rewrites `homework.code-workspace` from the tree) and one real read-back (the `--check` drift test compares on-disk bytes against freshly rendered bytes). There is no database.
- [x] **"UI interaction"** — *analogue:* **the VS Code window**. Opening the committed workspace file and seeing three top-level roots is the human-visible interaction. It is a manual observation because opening a window is not automatable.
- [x] **"Deployment"** — *analogue:* **the one-command build from the repository root**, `pio run -d homeworks/project-baseline`, plus the repo-wide sweep that reproduces it for every homework. There is no deployment environment; "running the full stack" here means "the compile happens and the tree stays clean".
- [x] **Failure path proven in Phase 1** — *not in the template:* a repo-wide gate that matches zero homework projects must exit non-zero with a readable message. A skeleton whose only proven path is the happy path is the exact failure the previous scaffold shipped.

---

## Out of Scope (Deferred to Later Slices)

Explicit, so later phases do not re-litigate Phase 1's minimalism:

- **Board and environment acceptance** — flashing, monitoring, the eFuse banner, `psramFound()` on real silicon, the console-port decision (Phase 2)
- **Shared libraries** — real PlatformIO libraries, `library.json`, the `symlink://` dependency line, the framework-include seam (Phase 3)
- **Wiring artifacts** — `diagram.json`, the generated SVG and netlist, the pin database, the pin-safety check (Phase 4)
- **Static checks** — `.clang-format`, `.clang-tidy`, cppcheck, the host test environment, warning-flag scoping (Phase 5)
- **Hooks and CI** — pre-commit, pre-push, the CI matrix, gitleaks/detect-secrets (Phase 6)
- **Agent rules and the scaffolding skill** — `.agents/skills/`, the `.claude/skills/` mirror, the `new-homework` skill (Phase 7)
- **The deliverable contract** — the instructor-facing README contract, the repository homework index, AI-participation trailers (Phase 8)
- **Markdown linting** — out of v1 entirely (D-23)
- **Wokwi simulation in CI and QEMU boot smoke** — v2 by owner decision
- **A native (`platform = native`) environment for the baseline** — Phase 5 owns it; adding it in Phase 1 would make the un-flagged `pio run -d` build two environments and fail, because the baseline source is Arduino-only. Phase 1 fixes the *name* the native environment will use (`projectbaseline_native`) so Phase 5 does not have to invent it.
- **A `platformio.ini` at the repository root or under `shared/`** — never; a root project gives the IDE a second candidate for "active project", and an ini with no `[env:]` section makes `pio run -d` exit 1.

---

## Subsequent Slice Plan

Each later phase adds one mechanism on top of this skeleton without altering its architectural decisions. The capability the mechanisms are for arrives in Phase 8.

- **Phase 2 — Board and environment baseline:** proves the skeleton's *pinned environment* on real silicon. Rewrites `homeworks/project-baseline/platformio.ini` to add the console port and the resolved-version record; does not change the layout, the tool layer or the workspace file.
- **Phase 3 — Shared libraries and the hardware seam:** fills `shared/lib/` and adds the first `lib_deps = <Name>=symlink://../../shared/lib/<Name>` line. This is the phase where the one-level depth rule stops being merely enforced and starts being *observed* as a real PlatformIO failure when violated.
- **Phase 4 — Wiring pipeline and pin safety:** adds `docs/` and reuses the generate-then-drift-check idiom established here for `docs/wiring.svg` and `docs/netlist.md`.
- **Phase 5 — Verification layers and pinned static checks:** adds `[env:projectbaseline_native]` under the name fixed in Phase 1, plus the pinned analyzers.
- **Phase 6 — Hook and CI gates:** wires this phase's `--check`, `--list` and sweep into pre-commit, pre-push and CI. The clean-tree assertion Phase 1 demonstrates by hand becomes a CI assertion here.
- **Phase 7 — Agent rules and the scaffolding skill:** the skill reproduces this skeleton for the sixtieth homework, using the same id grammar and the same discovery definition.
- **Phase 8 — The first real homework, end to end:** the capability. One real homework runs the whole loop and reads to the instructor as submitted.
