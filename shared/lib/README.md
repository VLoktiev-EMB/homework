# Shared libraries

One directory per reusable module, each a real PlatformIO library: `shared/lib/<name>/` carrying a
`library.json` with `name` and `version`.

## How the seam is joined — the part that is not an `#include`

This tree inverts the usual direction of dependency. Ordinary code *calls the framework*:
`Serial.println("hi")` binds a homework to Arduino, and the framework change rewrites every line
that touched it. Here, every module above the seam calls **four functions this repository
invented**, and exactly one directory answers that call:

```
homeworks/<id>/src/main.cpp     C++ shim — the framework's own entry points live here
        │  #include <emb_log.h>
        ▼
shared/lib/emb_log/             pure C — does not know the word "Arduino"
        │  #include <emb_hal.h>
        ▼
shared/lib/emb_hal/             the interface: four declarations, no translation unit
        ▲
        │  (defines them — with no #include between the two)
        │
shared/lib/emb_hal_arduino/     the only directory in this tree that sees a framework header
```

**The upward arrow is the linker, not a preprocessor include, and that is the whole mechanism.**
`emb_log.c` never includes the backend, and the backend never includes `emb_log`. What happens
instead:

1. `emb_log.c` compiles to an object file carrying an **undefined** symbol, `emb_hal_write_line`.
   The compiler records "something will define this" and moves on.
2. `emb_hal_arduino.c` compiles to an object file carrying the **definition** of that same symbol.
3. The linker joins the two **by name**, at the end. Neither source names the other.

Three consequences follow, and each is the reason for a rule stated further down:

- **The name must survive both compilers**, which is what the C++ guard rule protects. Without
  `extern "C"`, a C++ translation unit emits a mangled name that the C definition cannot match, and
  the linker reports an undefined reference naming the symbol rather than the missing guard.
- **The interface directory has no `src/`**, because a declaration has nothing to compile. An
  interface that owned a translation unit would be a second place the seam could be implemented,
  and the seam would stop being singular.
- **The backend directory has no `include/`**, because a public header there could re-export the
  framework header it is allowed to see. The split makes the leak structurally impossible rather
  than merely forbidden.

A reader who takes one thing from this document: **swapping frameworks replaces the directory at
the bottom of that diagram and edits one consumer line. It touches no logic.**

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
  dependency finder reads the manifest to build the graph. `version` is **enforced by this
  repository's own suite, not by the tool**: a manifest without one still installs, at a version
  the tool synthesises from the clock, so the dependency graph stops being reproducible and a
  listing diff churns on every install. `tools/tests/check-hal-seam.test.mjs` asserts it against
  the real tree and is falsified against a manifest with an omitted version — so the rule is
  checked, but only where the suite runs.
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

## Swapping the framework

The migration this tree exists to absorb is Arduino core → ESP-IDF. It is a backend swap, and the
whole of it is four steps:

1. **Add the new backend directory** — `shared/lib/emb_hal_espidf/src/emb_hal_espidf.c`. The same
   four functions with the same signatures against the same `emb_hal.h`, reached through
   `driver/uart.h` and `esp_timer_get_time()` instead of `esp32-hal-uart.h` and `millis()`.
2. **In the consuming project's `platformio.ini`,** replace one entry of the `lib_deps` line:
   `emb_hal_arduino=…` out, `emb_hal_espidf=…` in.
3. **In the same file,** `framework = arduino` → `framework = espidf`.
4. **Add the new directory** to the exemption list inside `tools/check-hal-seam.mjs`.

**What does not move:** `emb_hal.h`, every file under `emb_log/`, every consumer's `src/`, and the
whole of the repository's test suite. That is not a hope — it is what the C ABI and the linker
mechanism described at the top of this document buy, and it is why the shared layer is C rather
than C++.

Step 4 is deliberate rather than incidental. A new framework-touching directory does not slip in
silently; it must be named. Because the exemption is a reviewed literal list, the act of adding a
backend is also the act of recording it.

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
