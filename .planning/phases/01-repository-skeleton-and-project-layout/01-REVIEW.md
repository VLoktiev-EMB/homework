---
phase: 01-repository-skeleton-and-project-layout
reviewed: 2026-10-15T14:53:40Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - .editorconfig
  - .gitattributes
  - .gitignore
  - .vscode/extensions.json
  - .vscode/settings.json
  - AGENTS.md
  - README.md
  - homeworks/project-baseline/README.md
  - homeworks/project-baseline/platformio.ini
  - homeworks/project-baseline/src/main.cpp
  - shared/lib/README.md
  - tools/generate-workspace.mjs
  - tools/lib/discover.mjs
  - tools/sweep-homeworks.mjs
  - tools/tests/discover.test.mjs
  - tools/tests/generate-workspace.test.mjs
  - tools/tests/helpers.mjs
  - tools/tests/ignore-rules.test.mjs
  - tools/tests/sweep.test.mjs
findings:
  critical: 1
  warning: 8
  info: 7
  total: 16
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-10-15T14:53:40Z
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

This is the second review of Phase 01. It re-reviews the phase's full current change set — the
19 files below — because the first review (`2026-10-15T13:05:00Z`) predated the two gap-closure
plans. Two of the 19 have never been reviewed by anyone: `tools/tests/ignore-rules.test.mjs`
(new, plan 01-06) and `.gitignore` (one additive line, plan 01-06). The remaining 17 are
unchanged since the first pass and are in scope so that the first pass's findings are carried
forward on evidence rather than archived on trust.

**One of the sixteen prior findings is now closed**: WR-09 (`.planning/milestone.lock` untracked
and unignored) is fixed by `.gitignore:96` (`.planning/*.lock`) and is recorded under
*Superseded Prior Findings* below. The other fifteen were each re-opened and re-verified against
the current tree; **all fifteen are still live**, and most were re-reproduced rather than merely
re-read.

The new ignore contract test is good work and I could not break it. It asserts the *source* git
reports for each ignored path, not just the exit status, which is the right oracle: this machine
carries a `~/.config/git/ignore`, so a status-only assertion could pass with no repository rule
at all. Its five assertions are each falsifiable. Its one weakness is diagnostic (IN-07), not
correctness, and its `git ls-files -i -c --exclude-standard` guard is the right way to keep a
deliberately broad glob honest without a hand-written survivor list.

The defects still cluster in the same place the first pass found them: the *enforcement* layer,
not the layout. The drift gate can still report success while never running (CR-01 — and this
pass narrows the trigger to something ordinary, see below). The depth rule is still evaluated
against the filesystem rather than the committed tree (WR-01, re-reproduced: a built `.pio/` tree
turns the repo-wide gate red). `--list --allow-empty` still emits prose on the channel its own
header reserves for ids (WR-02, re-reproduced). The generator still drops a homework it cannot
name and exits 0 (WR-03, re-reproduced).

No security findings. There are no secrets, no network access, and no shell interpolation — the
sweep passes an argv array to `spawnSync` with no shell, so a discovered path cannot be
reinterpreted as a command, and the new test spawns `git` the same way.

All reproductions ran against the tree at `a257926`, in throwaway fixtures; the repository's own
`homework.code-workspace` was not modified, and `node --test "tools/**/*.test.mjs"` is 32/32 green
both before and after this review.

## Critical Issues

### CR-01: The entry-point guard fails open — `--check` exits 0 without checking when the script path carries a symlink

**File:** `tools/generate-workspace.mjs:68`

**Issue:** The guard is unchanged:

```js
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
```

`pathToFileURL()` does not resolve symlinks; Node's ESM loader always realpaths `import.meta.url`.
When the two disagree the comparison is false, `main()` is never called, the module falls off the
end, and the process exits **0 with no output** — for both the write path and `--check`. A
`--check` that cannot distinguish "verified current" from "never ran" is not a gate, on a
repository whose stated core value is that a stale workspace file must never go unnoticed.

Re-reproduced in a fixture carrying a copy of `tools/`:

```
direct  --check  : rc=1  "homework.code-workspace is STALE."     (correct)
symlink --check  : rc=0  stdout="" stderr=""                     (guard failed open)
```

**This pass narrows the trigger, and the narrowing makes the defect materially more reachable
than "a hand-made symlink" suggests.** The guard compares the *string* `argv[1]` against a
realpath'd URL, so it fires whenever that string carries a symlinked path component. Measured:

```
node /tmp/<fix>/tools/generate-workspace.mjs --check   -> rc=0, silent   (fails open)
node tools/generate-workspace.mjs --check  (cwd=/tmp/<fix>) -> rc=1 STALE (correct)
```

The second line is safe only because `getcwd()` returns the *physical* path, so the relative
argument is resolved physically and the two sides converge. The first is not exotic: on this
machine `TMPDIR=/var/folders/...` and `realpath "$TMPDIR"` is `/private/var/folders/...`, so
**every** absolute invocation whose path string runs through `$TMPDIR` — the natural way to run
the generator from a script, a CI job, or a fixture — silently no-ops. Any checkout reached
through a symlinked parent directory (a common container and CI layout) has the same property.
The existing suite cannot catch it: `tools/tests/generate-workspace.test.mjs:19` spawns the CLI
with the *relative* path `tools/generate-workspace.mjs` and a fixture cwd, which is the one
spelling that converges.

**Fix:** Normalize both sides, and fail loudly rather than silently when the module is a CLI
target it did not recognize:

```js
import { realpathSync } from "node:fs";

// pathToFileURL() does not resolve symlinks, but the ESM loader does, so an
// entry point reached through a symlinked path component would otherwise
// fall through and exit 0 having done nothing.
let entry = null;
try {
  entry = process.argv[1] ? realpathSync(process.argv[1]) : null;
} catch {
  // argv[1] does not exist: not this module's entry point.
}
if (entry && import.meta.url === pathToFileURL(entry).href) {
  process.exit(main());
}
```

A stronger variant is to move the CLI into its own `tools/generate-workspace-cli.mjs`, so the
library module carries no entry-point logic at all. Add a regression test that spawns the CLI
through a symlinked absolute path and asserts a non-empty result — the current suite is
structurally blind to this.

## Warnings

### WR-01: The depth rule is evaluated against the filesystem, not the committed tree — `.pio/` can turn the repo-wide gate red

**File:** `tools/lib/discover.mjs:49-63`

**Issue:** `findDepthViolations` recurses through every directory under `homeworks/` with no
exclusion for build trees or caches. `.pio/` is gitignored but present on disk after any build,
and PlatformIO populates `.pio/libdeps/<env>/<Lib>/` with copies of registry libraries that carry
`examples/<name>/platformio.ini` — PlatformIO's own canonical layout. Since
`tools/sweep-homeworks.mjs:64` runs the depth check first and exits non-zero immediately, one
such file becomes a hard gate failure *before any build runs*.

Re-reproduced:

```
violations (built tree): [
  "homeworks/project-baseline/.pio/libdeps/project-baseline/SomeLib/examples/demo"
]
```

The same commit therefore passes on a clean clone and fails on any machine that has run a build:
the gate's verdict is a function of uncommitted machine state, which is exactly the
nondeterminism the module's own comment claims to eliminate.

**Fix:** Skip ignored trees by name at the top of the walk:

```js
const SKIP_DIRS = new Set([".pio", ".pio-cache", "node_modules", ".git"]);

const walk = (dir, depth) => {
  for (const name of directoriesIn(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    /* ... */
  }
};
```

### WR-02: `--list --allow-empty` prints a prose line on stdout, breaking the documented `--list` contract

**File:** `tools/sweep-homeworks.mjs:92`

**Issue:** The file header declares `--list` as "print the validated ids, one per line, and exit
0" and calls it "the contract Phase 6's CI matrix consumes". The zero-match branch (lines 90-99)
runs before the `--list` branch (line 102), and its `--allow-empty` path writes a sentence to
stdout rather than nothing. Re-reproduced:

```
$ node tools/sweep-homeworks.mjs --root <empty-fixture> --list --allow-empty
sweep: no homework projects found (--allow-empty)      <- stdout, rc=0
```

A consumer doing `for id in $(node tools/sweep-homeworks.mjs --list --allow-empty)` receives the
token `sweep:` as a project id and will try to build it. `--allow-empty` is the documented way to
accept an empty tree, so the combination is reachable, not contrived.

**Fix:** Route the notice to stderr — stdout is reserved for the contract:

```js
if (allowEmpty) {
  console.error("sweep: no homework projects found (--allow-empty)");
  process.exit(0);
}
```

`tools/tests/sweep.test.mjs:70-75` asserts one output line, which passes today precisely *because*
of the prose; tighten it to `assert.equal(result.stdout, "")` alongside the fix.

### WR-03: The generator silently drops homeworks it cannot name, and exits 0

**File:** `tools/generate-workspace.mjs:31`, `44-47`

**Issue:** `renderWorkspace` destructures only `{ found }`, discarding `malformed` and
`violations`; `main()` then writes the file, prints `wrote ...`, and exits 0. Re-reproduced in a
fixture holding `homeworks/project-baseline/` and `homeworks/hw01-Blink/`: the written workspace
lists only `project-baseline`, `hw01-Blink` is absent, no diagnostic was printed, and the process
exited 0. This is the precise failure the root README warns about two paragraphs above the command
it tells the reader to run. The sweep would catch the misnamed id — but the README instructs the
reader to run the generator, and the generator is the one that lies.

**Fix:** Refuse to write into an inconsistent tree, mirroring the sweep's policy ordering:

```js
function main() {
  const { malformed, violations } = discoverHomeworks(REPO_ROOT);
  if (malformed.length > 0 || violations.length > 0) {
    console.error("Refusing to write: discovery reported problems the workspace file cannot represent.");
    for (const name of malformed) console.error(`  malformed id: homeworks/${name}/`);
    for (const path of violations) console.error(`  depth rule: ${path}`);
    return 1;
  }
  /* ... */
}
```

### WR-04: `.editorconfig` assigns 4-space indent to `homework.code-workspace`, but the generator emits 2 spaces

**File:** `.editorconfig:22`, `tools/generate-workspace.mjs:37`

**Issue:** The JSON section is `[*.{json,jsonc,yml,yaml,ini,cfg,properties}]` (line 22). Brace
expansion produces literal suffixes, and `homework.code-workspace` ends in `.code-workspace`, so
it matches none of them and falls through to `[*]`, inheriting `indent_size = 4` (line 15). The
generator writes `JSON.stringify({folders}, null, 2)` — two spaces. The repository declares two
indent sizes for one file, and `.vscode/settings.json:11` turns on `editor.formatOnSave` globally
while the recommended extension set includes `editorconfig.editorconfig`, so the mismatch is
reachable by pressing save.

This matters because `--check` is a byte comparison (line 50): any reformat turns a correct tree
into a reported STALE, and the README tells the reader the file is generated and must not be
touched — so the natural response is to re-run the generator, which rewrites it, which the next
save reverts.

**Fix:**

```ini
[*.{json,jsonc,code-workspace,yml,yaml,ini,cfg,properties}]
indent_size = 2
```

### WR-05: `envNames()` encodes a rule that nothing enforces

**File:** `tools/lib/discover.mjs:94-97`

**Issue:** The docstring is emphatic — "Identical environment names across projects make the IDE
build the wrong homework, so the names are derived mechanically from the id" — and both
`homeworks/project-baseline/platformio.ini:14` and `homeworks/project-baseline/README.md:28` treat
the derived name as contractual. Re-verified by grep: the only consumers are
`tools/tests/discover.test.mjs` and prose. `sweep-homeworks.mjs` imports only
`discoverHomeworks` and `ID_PATTERN_TEXT`; `generate-workspace.mjs` imports only
`discoverHomeworks`. Nothing parses `platformio.ini`, so a homework may declare `[env:main]`, or
the same env name as another project, and the full gate still exits 0 — the rationale for
one-command builds is exactly the failure the gate cannot see.

**Fix:** Have the sweep read each discovered `platformio.ini` and assert the declared env names
are precisely the two `envNames(id)` returns (the `[env:<name>]` headers are one `matchAll`
away), reporting a mismatch the way `MALFORMED HOMEWORK ID` is reported. If that check is
deliberately deferred to Phase 6, say so in the docstring — as written it reads as enforced.

### WR-06: Format-on-save is enabled for C/C++ with no `.clang-format` in the repository, and the only committed C++ file is unstable under it

**File:** `.vscode/settings.json:11-24`, `homeworks/project-baseline/src/main.cpp:11-15`, `.editorconfig:25-26`

**Issue:** `editor.formatOnSave: true` applies globally, `[c]`/`[cpp]` select
`ms-vscode.cpptools`, and `C_Cpp.formatting: "clangFormat"` selects clang-format. Re-verified:
there is no `.clang-format` anywhere in the repository (correctly deferred to Phase 5), so the
formatter runs with LLVM defaults — `IndentWidth: 2`, `ColumnLimit: 80`. The committed file is
neither. Measured:

```
 13  108    Serial.printf("baseline: flash=%u psram=%d psramSize=%u\n", static_cast<unsigned>(ESP.getFlashChipSize()),
 14   91                  static_cast<int>(psramFound()), static_cast<unsigned>(ESP.getPsramSize()));
```

Line 13 is 108 columns — past `editor.rulers: [100]` and far past clang-format's 80 — while the
body is indented with 2 spaces, contradicting `.editorconfig:26` (`indent_size = 4` for
`*.{c,h,cpp,hpp,cc,ixx}`). Opening `main.cpp` and saving rewrites it, on a repository whose
commits are read by the instructor.

**Fix:** Pick one owner now. The smallest change that removes the surprise is
`"editor.formatOnSave": false`, re-enabled in Phase 5 when `.clang-format` lands. If it stays on,
`.editorconfig:26` should be `indent_size = 2` (or the file re-indented to 4).

### WR-07: The default-root test hard-codes this repository's current contents and contradicts its own file header

**File:** `tools/tests/sweep.test.mjs:145`

**Issue:** The assertion is still
`assert.deepEqual(result.stdout.trim().split("\n"), ["project-baseline"])`, which makes the
suite's outcome a function of the repository's homework list. Phase 2 adds homeworks; the moment
it does, this test fails for a reason unrelated to what it tests. It also points the sweep at the
real repository root, which the file's own header forbids ("No test may point the sweep at the
repository root") — `--list` does not build, so the rule's *purpose* is not violated, but the
test still couples the suite to checkout state and the header is now false as written.

**Fix:** Assert the property, not the contents:

```js
assert.ok(result.stdout.trim().length > 0, "default root found nothing");
assert.match(result.stderr, /^$/, "the empty cwd must not have been scanned");
```

and amend the header to "no test may *build* against the repository root".

### WR-08: A test silently requires a working PlatformIO installation, with no skip guard

**File:** `tools/tests/sweep.test.mjs:119-132`

**Issue:** "a project that fails to build is reported, not swallowed" is the only test that
reaches `resolvePio()`; every other sweep test exits at the policy or zero-match stage. It runs
the real `pio` against a fixture. On a machine without PlatformIO, `resolvePio()` returns `null`,
the sweep prints `PlatformIO Core was not found.` and exits 1, and the assertion
`assert.match(result.stderr, /1 project\(s\) checked; at least one failed/)` fails with a message
about the gate rather than about the missing tool. On this machine it resolves via the
`~/.platformio/penv/bin/pio` fallback and passes; the suite's green result is contingent on that
install, so a red suite on another machine may mean nothing more than "PlatformIO is absent".

**Fix:** Skip rather than fail when PlatformIO is unavailable:

```js
const pioAvailable = ["PLATFORMIO_CORE", "HOME"].every((k) => k in process.env);
test("a project that fails to build is reported, not swallowed",
  { skip: pioAvailable ? false : "PlatformIO Core is not installed" }, () => { /* ... */ });
```

## Info

### IN-01: `findDepthViolations` builds violation paths by slicing, so a non-normalized `repoRoot` yields a garbled path

**File:** `tools/lib/discover.mjs:56`

**Issue:** `child.slice(repoRoot.length + 1)` assumes `repoRoot` is exactly the prefix of `child`
with no trailing separator. True for `resolve()`-normalized absolute paths — which is why the CLI
is safe today — but the function is exported and documented as taking an arbitrary `repoRoot`.
Re-reproduced:

```
findDepthViolations(root)     -> ["homeworks/hw-x/deeper"]
findDepthViolations(root+"/") -> ["omeworks/hw-x/deeper"]   # first character eaten
```

**Fix:** Use the path module instead of arithmetic: `violations.push(relative(repoRoot, child))`.

### IN-02: `installTools` leaves an empty `tools/tests/` directory in every fixture

**File:** `tools/tests/helpers.mjs:77-81`

**Issue:** `const testsDir = \`${join("tools", "tests")}${sep}\`` carries the trailing separator,
but `cpSync` calls the filter on the directory itself as `.../tools/tests`, which does not contain
`tools/tests/`, so the directory is created and only its children are filtered. Harmless as
written, but the filter does not do what its name says, and a future test asserting a clean copied
tree will be surprised.

**Fix:** `filter: (src) => src !== join(TOOLS_DIR, "tests")`.

### IN-03: `resolvePio` accepts a `pio` that starts but exits non-zero, and hard-codes the POSIX virtualenv path

**File:** `tools/sweep-homeworks.mjs:111-120`

**Issue:** `spawnSync("pio", ["--version"], { stdio: "ignore" })` distinguishes only spawn failure
from anything else — `return onPath.error ? null : "pio"` accepts a `pio` present on `PATH` but
broken, and the ensuing per-project failures are then attributed to the projects rather than to
the tool. Separately, `~/.platformio/penv/bin/pio` is the macOS/Linux layout (`Scripts/pio.exe` on
Windows), so the fallback silently does nothing there. Both are degradation paths, not current
defects, since a failure still exits non-zero.

**Fix:** Check `onPath.status === 0` before accepting the PATH candidate, and derive the fallback
from `process.platform` or accept `PLATFORMIO_CORE` as the only override.

### IN-04: One unit test asserts nothing

**File:** `tools/tests/discover.test.mjs:132-134`

**Issue:** `assert.deepEqual(envNames("m01-l03-blink"), envNames("m01-l03-blink"))` cannot fail —
`envNames` is pure and returns a fresh object literal from the same input, so the assertion holds
even if the implementation returned `{s3: undefined, native: undefined}`. It contributes a green
tick and no coverage, which is worse than no test when the suite count is read as evidence.

**Fix:** Assert the property the collision rationale depends on instead, e.g. that the stem is
hyphen-free and that distinct ids produce distinct env names.

### IN-05: The root README documents neither the sweep gate nor the test command, and overstates `AGENTS.md`'s role

**File:** `README.md:44-48`, `README.md:93-96`

**Issue:** The structure diagram lists `sweep-homeworks.mjs` as "validates ids and builds every
homework" (line 46), but re-verified: the README never states how to run it, what its exit codes
mean, or what `--list` / `--allow-empty` / `--root` are for — and `node --test "tools/**/*.test.mjs"`
appears nowhere. Meanwhile the README declares `AGENTS.md` "the single source of truth for
repository rules", while `AGENTS.md` says "Conventions not yet established." The id grammar, the
one-level depth rule, and the env-naming rule live only in code comments.

**Fix:** Add a short "Checking the repository" section documenting
`node tools/sweep-homeworks.mjs` and `node --test "tools/**/*.test.mjs"`, and either move the four
rules into `AGENTS.md`'s Conventions section or soften the README's claim.

### IN-06: Nested workspace roots may prevent the root `.vscode/settings.json` from reaching homework files

**File:** `tools/generate-workspace.mjs:32-37`, `.vscode/settings.json`

**Issue:** The generated workspace lists `root` (`.`) *and* one folder per homework, so every
homework folder is nested inside the root folder. VS Code folder-scoped settings are applied per
workspace folder, and `C_Cpp.formatting`, `editor.rulers` and `editor.formatOnSave` in the root's
`.vscode/settings.json` are folder-scoped, so a `.cpp` file opened from `homeworks/<id>/` may not
receive them. Re-verified that `renderWorkspace` emits only `{folders}` — the workspace-level
`settings` key is unavailable as a fallback by design. Flagged for verification rather than
asserted: VS Code's resolution between overlapping roots is not documented precisely enough to
call it.

**Fix:** Open `homeworks/project-baseline/src/main.cpp` in the generated workspace and check
`editor.rulers` and `C_Cpp.formatting` in the effective settings. If they are not applied, either
emit a `settings` key (a deliberate decision — it breaks the pure-folder-list property) or drop
`root` from the folder list.

### IN-07: The new ignore-contract test cannot tell "git could not run" from "the rule was widened"

**File:** `tools/tests/ignore-rules.test.mjs:26-28`, `130`

**Issue:** `git(args)` returns the raw `spawnSync` result and no caller inspects `result.error`.
When git cannot be spawned, `status` is `null`, and both failure paths then report a confidently
wrong diagnosis rather than the real cause:

- `ignoreSource` returns `null` for any non-zero status, so `assert.notEqual(source, null, ...)`
  reports "`X` is not ignored at all" — for every member of the table.
- `assert.equal(result.status, 1, ...)` in the unignored test reports "`X` is ignored — the rule
  was widened past what it was written for" when git actually exited 128 (`not a git
  repository`), which is the same status family as a genuine finding.

Both paths still fail loudly — this is never a false green, and the assertions are otherwise
falsifiable — so the defect is confined to diagnostics. It is worth fixing because the file's own
header makes a point of distinguishing *why* a rule matched, and a misdiagnosis sends the reader
to widen or narrow a glob that was never the problem. Note also that this test adds `git` as an
undeclared prerequisite of the suite (unlike WR-08's PlatformIO, `git` is intrinsic to the
repository, so a skip guard is not warranted).

**Fix:** Surface the spawn error, and distinguish the two statuses:

```js
function git(args) {
  const result = spawnSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" });
  if (result.error) throw new Error(`git ${args.join(" ")} failed to start: ${result.error.message}`);
  return result;
}
```

and assert `result.status === 1 || result.status === 128` with a message naming which one was
observed, or keep `=== 1` but include `result.stderr` in the failure message.

## Superseded Prior Findings

Prior findings from the `2026-10-15T13:05:00Z` review that are **no longer live**. Each was
re-opened against the current tree before being recorded here.

| id | disposition | evidence |
|----|-------------|----------|
| WR-09 | **fixed** | `.planning/milestone.lock` is untracked and unignored no longer. `.gitignore:95-96` now carries `.planning/state.json` and `.planning/*.lock`; `git check-ignore -v .planning/milestone.lock` reports `.gitignore:96:.planning/*.lock` and `git status --porcelain` is empty. Plan 01-06 closed it, and `tools/tests/ignore-rules.test.mjs:47-51` now holds it shut as the first member of the ignored table. |

All fifteen remaining prior findings (CR-01, WR-01..WR-08, IN-01..IN-06) were re-verified as
still present and are re-reported above under their original ids. No prior finding was rejected
as mistaken, and none was dropped.

---

_Reviewed: 2026-10-15T14:53:40Z_
_Reviewer: Claude (gsd-code-review workflow — re-review of the phase's full current change set)_
_Depth: standard_
