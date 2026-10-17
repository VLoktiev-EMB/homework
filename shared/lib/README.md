# Shared libraries

One directory per reusable module, each a real PlatformIO library: `shared/lib/<name>/` carrying a
`library.json` with `name` and `version`.

## The language rule

**This tree is pure C.** Every translation unit under `shared/lib/` is a `.c` file, and no header
here names a framework header. The reason runs in both directions: a C ABI is implementable from
the C++ framework era and from the C framework era alike, with no adapter layer, so the shared
layer survives the framework change instead of being rewritten by it. C also compiles where the
course has not been yet — a bare-metal target included — so shared logic is not tied to one
vendor's toolchain.

The consequence a reader meets immediately: **a homework is a thin C++ shim plus C logic.**
`src/main.cpp` stays C++ because the framework requires it — `Arduino.h` declares `setup()` and
`loop()` without an `extern "C"` guard, so a `.c` definition would emit an unmangled name the core
never looks for. Everything below the shim is C.

## Layout

One directory per module, in the default PlatformIO layout:

- `library.json` — the manifest.
- `include/` — what the dependency finder puts on the compiler's `-I` path.
- `src/` — what gets compiled.

Two absences are meaningful rather than incidental:

- `emb_hal` carries `include/` and **no `src/`**. It is the seam's interface: declarations with no
  implementation, so it has no translation unit.
- `emb_hal_arduino` carries `src/` and **no `include/`**. It is the seam's backend. A backend must
  expose no public header, and the directory split makes that boundary structural instead of
  conventional.

No manifest carries a `build` section, and none may be given one. A custom `srcDir`/`srcFilter` is
the cause of the trap it looks like it fixes: a library whose sources sit outside the default
`src/` compiles its headers and silently drops its translation units, producing `undefined
reference` errors that point away from the cause.

## The manifest invariants

- **`name` and `version` are both required.** `name` is enforced by the tool, because the
  dependency finder reads the manifest to build the graph. `version` is **enforced by review,
  not by the tool**: a manifest without one still installs, at a version the tool synthesises
  from the clock, so the dependency graph stops being reproducible and a listing diff churns on
  every install. No gate in this repository checks it today.
- **`name` must be byte-identical to the left-hand side of the consumer's dependency line.** The
  left-hand side overrides the installed folder name while the dependency scanner reads the
  manifest, so a mismatch creates two names for one library: a storage folder named after the
  left-hand side, and a graph entry named after the manifest.
- **No `scripts` key.** The manifest schema permits install-time hooks; a library in this tree is
  reviewed source, not a package that runs code when it is installed.

## The C++ guard rule

Every public C header in this tree is wrapped in both an include guard and a C++ guard — the
`#ifdef __cplusplus` block around an `extern "C"` opening. The shim is C++, so without the guard it
would link against a mangled name, and the failure is a linker error that names the symbol rather
than the missing guard. That sends a reader looking in the wrong file, which is why the guard is
stated as a rule here rather than left to a template.

## The seam rule

**Exactly one directory in this tree may see a framework header: `emb_hal_arduino`.**

That is the property which keeps the rest of `shared/lib/` host-testable and framework-portable.
A repository-owned check is what keeps it true as the tree grows: it names the offending include
with its file and line and exits non-zero. The exemption is a named list inside that check, not a
pattern — a directory-name pattern would silently exempt whatever happened to match it, and
inferring the exemption from a manifest field would turn a statement into an inference. Adding the
ESP-IDF backend later is one new directory plus one line in that list. The check itself arrives with
this phase; wiring it into a gate is a later phase's to do.

`emb_hal_arduino`'s manifest also declares `"frameworks": ["arduino"]`. That is a plain
compatibility statement and nothing more: it is not the exemption mechanism, and it does not keep
a framework header out of any other directory.

## Consumption

Homework projects consume these libraries with one `lib_deps` line per library, including
transitive ones:

    lib_deps = <Name>=symlink://../../shared/lib/<Name>

The path is relative to the homework project, which sits one level below `homeworks/` — that is
why every homework must sit exactly there and nothing may be placed deeper.

One line per library is required even when the library is reached only from inside another one:
the dependency scanner does not read a library's own source, so an include that exists only inside
another library fails at compile with a missing-header error that names the header rather than the
missing line.

`symlink://` is the only sanctioned mechanism: it reflects source edits immediately, while
`file://` copies into `.pio/libdeps` and silently compiles stale code on the next build.
PlatformIO's global-library directives, deprecated since Core 6.0 and slated for removal, are not
used anywhere in this repository.

### The measured alternative, recorded rather than left to be rediscovered

A shared library's own manifest may carry a `dependencies` map, and the package manager honours
it: the transitive library is then installed from the consumer's single line, which would remove
the duplicated lines and the whole failure class they bring. It was measured to work on this
platform.

It was not chosen. The cost is that the path inside that map resolves against the **consumer's**
project directory, so the shared library would carry an assumption about the depth of whoever
consumes it — it would stop being consumer-independent, and the dependency would stop being
visible to a plain `grep` of the consumer. The per-consumer line is chosen for exactly that
reason, and the alternative is written down here so a later reader meets it as a decision instead
of rediscovering it as a trick.

## The C standard

`shared/lib/` compiles at **C99**, the standard the framework's own build script imposes on every
`.c` file. That is a ceiling, not a starting point: there is no `_Static_assert`, no
`stdatomic.h`, and no C11 feature to reach for in this tree. The two measured standard values this
repository actually runs are recorded in [`shared/pio/VERSIONS.md`](../pio/VERSIONS.md) beside the
platform pin.

---

This directory is here from Phase 1 because it must appear as a workspace root and git cannot
track an empty directory.
