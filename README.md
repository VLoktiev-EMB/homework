# homework

A personal coursework repository for an embedded-development course (C/C++, PlatformIO,
ESP32-S3-DevKitC-1). Each homework is its own self-contained PlatformIO project under
`homeworks/`, reusable code lives in a shared library tree, and the whole repository opens as one
VS Code workspace. The repository is public, and the course instructor reviews the homework
through it.

The core value: a homework written in week three must still compile, explain its own wiring and be
demoable in week forty — without its owner reconstructing anything from memory.

## The workspace file

`homework.code-workspace` is a VS Code multi-root workspace that lists the repository root, the
shared library tree, and one folder per homework. It is **generated from the filesystem** and
committed. Open it the normal way:

1. Open VS Code.
2. Choose **File → Open Workspace from File...**
3. Select `homework.code-workspace`.

Do not hand-edit it. The folder list is derived from what is on disk, so a manual edit is lost the
next time the file is regenerated — and a stale file silently hides a homework from the Explorer.
Regenerate it after adding or removing a homework, and check it for drift before committing:

```bash
node tools/generate-workspace.mjs          # regenerate the workspace file
node tools/generate-workspace.mjs --check  # exit non-zero if the committed file is stale
```

## Repository structure

```text
homework/
├── .editorconfig                 # cross-editor whitespace and encoding rules
├── .gitattributes                # EOL normalization and binary/generated-file marks
├── .gitignore                    # build output, caches, editor state and secrets
├── .vscode/                      # committed editor settings and recommended extensions
├── .planning/                    # roadmap, requirements and phase history
├── AGENTS.md                     # repository conventions — the single source of truth
├── LICENSE                       # Apache-2.0
├── README.md                     # this file
├── homework.code-workspace       # generated — see above
├── tools/                        # repo-owned scripts
│   ├── generate-workspace.mjs    # writes homework.code-workspace, or checks it
│   ├── sweep-homeworks.mjs       # validates ids and builds every homework
│   ├── lib/                      # discovery and id-grammar helpers
│   └── tests/                    # host tests for the scripts above
├── shared/
│   ├── lib/                      # reusable PlatformIO libraries
│   └── pio/                      # shared PlatformIO environment facts
│       ├── base.ini              # the N16R8 fragment every project consumes
│       └── VERSIONS.md           # the versions the platform pin resolves to
└── homeworks/
    └── project-baseline/         # the build-proof project — not a course homework
```

### Reusable code lives in `shared/lib/`

Every module under `shared/lib/` is a real PlatformIO library. A homework consumes the ones it
needs with one `lib_deps` line per library, transitive ones included:

    lib_deps = <Name>=symlink://../../shared/lib/<Name>

The path is relative to the consuming project, and `symlink://` compiles the library's source in
place: an edit is reflected by the next build, nothing is copied into the project and nothing goes
stale. That arithmetic is also why every homework sits exactly one level below `homeworks/`.

The conventions that bind the tree — the language rule, the layout, the manifest invariants and
the one directory allowed to see the framework — live in
[`shared/lib/README.md`](shared/lib/README.md).

## Prerequisites

| Tool | Purpose |
| :--- | :--- |
| **VS Code** with the **PlatformIO IDE** extension | Editor integration, and PlatformIO Core itself |
| **PlatformIO Core** (`pio`) | Build, upload, monitor and test |
| **git** | Version control |
| **Node.js** | Runs the scripts in `tools/` |

### These tools are installed but not on `PATH`

The PlatformIO IDE extension installs PlatformIO Core into a virtualenv at `~/.platformio/penv/`
and adds it only to VS Code's *integrated* terminal. That is why `pio` works inside the editor but
reports `command not found` in an external shell. To use it everywhere, add it to your shell
profile, or put it on the path of the current shell with:

```bash
export PATH="$HOME/.platformio/penv/bin:$PATH"
```

## Building a homework

Every homework builds from the repository root with one command, in the project-directory form:

```bash
pio run -d homeworks/<id>                    # build
pio run -d homeworks/<id> --target upload   # build and flash
pio device monitor -d homeworks/<id>        # watch the serial output
```

`<id>` is the homework's folder name. Environment names are project-scoped, so address a project by
its directory rather than by an environment flag.

Every environment takes its exact platform pin and its console ports from the shared fragment
`shared/pio/base.ini` — never a version range, never a development branch, and never an unset port.
The versions that pin resolves to are recorded in [`shared/pio/VERSIONS.md`](shared/pio/VERSIONS.md).

## What counts as a homework

A homework is a directory directly under `homeworks/` whose name matches the frozen id grammar —
`m01-l03-<slug>` for a lesson, `project-<slug>` for a course project — and which contains a
`platformio.ini`.

## Conventions

[`AGENTS.md`](AGENTS.md) is the single source of truth for repository rules. The shared-library
conventions live in [`shared/lib/README.md`](shared/lib/README.md).

## License

Licensed under the Apache License 2.0 — see [LICENSE](LICENSE).
