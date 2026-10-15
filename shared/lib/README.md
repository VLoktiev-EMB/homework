# Shared libraries

One directory per reusable module, each a real PlatformIO library: `shared/lib/<name>/` carrying a
`library.json` with `name` and `version`.

Homework projects consume them with one `lib_deps` line per library, including transitive ones:

    lib_deps = <Name>=symlink://../../shared/lib/<Name>

The path is relative to the homework project, which sits one level below `homeworks/` — that is why
every homework must sit exactly there and nothing may be placed deeper.

`symlink://` is the only sanctioned mechanism: it reflects source edits immediately, while `file://`
copies into `.pio/libdeps` and silently compiles stale code on the next build. PlatformIO's
global-library directives, deprecated since Core 6.0 and slated for removal, are not used anywhere
in this repository.

This directory is here in Phase 1 because it must appear as a workspace root and git cannot track an
empty directory. The binding library layout, HAL seam and testing rules arrive with Phase 3.
