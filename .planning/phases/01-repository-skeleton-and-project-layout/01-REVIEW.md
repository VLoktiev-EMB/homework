---
phase: 01-repository-skeleton-and-project-layout
reviewed: 2026-10-15T13:05:00Z
depth: standard
files_reviewed: 18
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
  - tools/tests/sweep.test.mjs
findings:
  critical: 1
  warning: 9
  info: 6
  total: 16
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-10-15T13:05:00Z
**Depth:** standard
**Files Reviewed:** 18
**Status:** issues_found

## Summary

The phase delivers a coherent, unusually well-reasoned skeleton: the `.editorconfig` / `.gitattributes` / `.gitignore` ownership split is stated explicitly ("one owner per rule") and actually holds on inspection; `tools/lib/discover.mjs` is genuinely the single discovery source for both consumers; and the sweep's policy-before-build ordering is correct and provable, not just asserted. The `platformio.ini` N16R8 override set and `src/main.cpp` match the measured facts in `AGENTS.md`, and the entry-point guard in the generator does work for every invocation documented in the README.

The defects cluster in the *enforcement* layer rather than the layout. The drift gate can be made to report success while doing nothing (CR-01, proven). The depth rule is evaluated against the filesystem rather than the committed tree, so a built project can turn the repo-wide gate red through artifacts that are gitignored (WR-01, proven). The `--list` contract that Phase 6's CI matrix is declared to consume emits a prose line instead of ids under `--allow-empty` (WR-02, proven). The generator can silently omit a homework from the workspace file — the exact failure the README warns the reader about (WR-03, proven). And the invariant `envNames()` encodes is exported but enforced nowhere (WR-05).

No security findings: there are no secrets, no network or shell interpolation, and the sweep passes an argv array to `spawnSync` with no shell, so a discovered path cannot be reinterpreted as a command.

All reproduction below was executed against the tree at `2caf3c37`, in throwaway fixtures under `os.tmpdir()`. The repository's own `homework.code-workspace` was not modified.

## Critical Issues

### CR-01: The entry-point guard fails open — `--check` exits 0 without checking when the script is reached through a symlink

**File:** `tools/generate-workspace.mjs:68`

**Issue:** The guard is

```js
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
```

`pathToFileURL()` resolves `argv[1]` against the physical cwd but does **not** resolve symlinks, while Node's ESM loader always realpaths `import.meta.url`. When those differ, the comparison is false, `main()` is never called, and the process falls off the end of the module and exits **0 silently** — for both the write path and the `--check` path. `--check` therefore reports success having checked nothing.

Reproduced in a fixture carrying a copy of `tools/` plus a symlinked entry point (`ln -s tools/generate-workspace.mjs gen.mjs`):

```
direct  run : status= 0  stdout= "wrote /private/var/.../homework.code-workspace"  file written? true
symlink run : status= 0  stdout= ""  stderr= ""
symlink --check: status= 0  stdout= ""  stderr= ""
```

The normal documented invocations (`node tools/generate-workspace.mjs`, `node tools/generate-workspace.mjs --check` from the repository root) are detected correctly — I verified both — because the kernel cwd is already physical, so relative `argv[1]` and `import.meta.url` converge. The failure needs the *script path itself* to be symlinked (or `--preserve-symlinks`), which is why it is not visible today. But the guard is load-bearing by design, its failure mode is a silent green, and the repository's stated core value is that a stale workspace file must never go unnoticed. A `--check` that cannot distinguish "verified current" from "never ran" is not a gate.

**Fix:** Make the two sides comparable by normalizing both, and fail loudly rather than silently when the module is a CLI target it did not recognize:

```js
import { realpathSync } from "node:fs";

// realpath() on both sides: pathToFileURL does not resolve symlinks, but the
// ESM loader does, so a symlinked entry point would otherwise fall through.
const entry = process.argv[1] ? realpathSync(process.argv[1]) : null;
if (entry && import.meta.url === pathToFileURL(entry).href) {
  process.exit(main());
}
```

`realpathSync` needs a `try`/`catch` for the `argv[1]`-does-not-exist case. A stronger variant is to move the CLI into its own `tools/generate-workspace-cli.mjs` so the library module has no entry-point logic at all — but the one-line normalization restores the property the phase context calls load-bearing.

## Warnings

### WR-01: The depth rule is evaluated against the filesystem, not the committed tree — `.pio/` can turn the repo-wide gate red

**File:** `tools/lib/discover.mjs:49-63`

**Issue:** `findDepthViolations` recurses through every directory under `homeworks/` with no exclusion for build trees, caches, or anything `.gitignore` lists. `.pio/` is gitignored (`git check-ignore -v homeworks/project-baseline/.pio/build/x.o` → `.gitignore:16:.pio/`), but it is present on disk after any build, and `pio` populates `.pio/libdeps/<env>/<Lib>/` with copies of registry libraries. Libraries that ship an example project carry `examples/<name>/platformio.ini` — that is PlatformIO's own canonical layout, and this machine has 30 instances of it inside PlatformIO's installed packages (`~/.platformio/platforms/espressif32/examples/arduino-blink/platformio.ini`, and so on).

Because `sweep-homeworks.mjs:64` runs the depth check first and exits non-zero immediately, a single such file anywhere under `homeworks/<id>/.pio/` becomes a hard gate failure *before any build runs*. Reproduced:

```
violations (built tree): [
  "homeworks/m01-l03-blink/.pio/libdeps/m01-l03-blink/SomeLib/examples/demo"
]
```

The consequence is that the same commit passes on a clean clone and fails on any machine that has run a build — the gate's verdict is a function of uncommitted machine state, which is exactly the nondeterminism the module's own comment ("a pure filesystem walk ... so the depth rule fires in the same second a folder is misplaced") claims to eliminate.

**Fix:** Skip ignored trees by name at the top of the walk. `.pio` is the one that matters; the same exclusion covers `.pio-cache`:

```js
// Build output is not part of the committed tree: a library's own
// examples/<x>/platformio.ini inside .pio/libdeps must not be read as a
// misplaced homework. The gate must give the same answer before and after
// a build.
const SKIP_DIRS = new Set([".pio", ".pio-cache", "node_modules", ".git"]);

const walk = (dir, depth) => {
  for (const name of directoriesIn(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    ...
  }
};
```

### WR-02: `--list --allow-empty` prints a prose line on stdout, breaking the documented `--list` contract

**File:** `tools/sweep-homeworks.mjs:90-105`

**Issue:** The file header declares `--list` as "print the validated ids, one per line, and exit 0" and calls it "the contract Phase 6's CI matrix consumes". The zero-match branch runs *before* the `--list` branch, and its `--allow-empty` path writes a sentence to stdout rather than nothing:

```
["--list","--allow-empty"] status= 0  stdout= "sweep: no homework projects found (--allow-empty)\n"
["--allow-empty","--list"] status= 0  stdout= "sweep: no homework projects found (--allow-empty)\n"
["--list"]                 status= 1  stdout= ""  stderr= "sweep: found ZERO homework projects under homeworks/*/platformio.ini\n..."
```

A consumer doing `for id in $(node tools/sweep-homeworks.mjs --list --allow-empty)` receives the token `sweep:` as a project id and will try to build it. The `--allow-empty` escape hatch is the documented way to accept an empty tree, so this combination is reachable, not contrived.

**Fix:** Route the human-readable notice to stderr, or suppress it entirely in list mode:

```js
if (found.length === 0) {
  if (allowEmpty) {
    // stdout is reserved for the --list contract; the notice is for a human.
    console.error("sweep: no homework projects found (--allow-empty)");
    process.exit(0);
  }
  ...
}
```

Note that `tools/tests/sweep.test.mjs:70-75` asserts `result.stdout.trim().split("\n").length === 1` — which passes today precisely *because* of the prose line. That assertion should be tightened to `assert.equal(result.stdout, "")` alongside the fix.

### WR-03: The generator silently drops homeworks it cannot name, and exits 0

**File:** `tools/generate-workspace.mjs:30-37`, `40-48`

**Issue:** `renderWorkspace` destructures only `{ found }` from `discoverHomeworks`, discarding `malformed` and `violations`. `main()` then writes the file and prints `wrote ...` with exit 0. A directory under `homeworks/` that carries a `platformio.ini` but a name outside the frozen grammar therefore vanishes from the workspace file with no diagnostic anywhere. Reproduced against a fixture containing `homeworks/project-baseline/` and `homeworks/hw01-Blink/`:

```json
{
  "folders": [
    { "name": "root", "path": "." },
    { "name": "shared", "path": "shared" },
    { "name": "project-baseline", "path": "homeworks/project-baseline" }
  ]
}
```

`hw01-Blink` is absent, no warning was printed, and the process exited 0. This is the precise failure the root README warns about two paragraphs above the command it tells the user to run: "a stale file silently hides a homework from the Explorer." The sweep would catch the misnamed id — but the README instructs the reader to run the generator, and the generator is the one that lies.

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
  ...
}
```

### WR-04: `.editorconfig` assigns 4-space indent to `homework.code-workspace`, but the generator emits 2 spaces

**File:** `.editorconfig:9-23`, `tools/generate-workspace.mjs:37`

**Issue:** The JSON section is `[*.{json,jsonc,yml,yaml,ini,cfg,properties}]` — the brace expansion produces literal suffixes, and `homework.code-workspace` ends in `.code-workspace`, so it matches none of them and falls through to `[*]`, inheriting `indent_size = 4`. The generator writes `JSON.stringify({folders}, null, 2)` — two spaces. The repository therefore declares two different indent sizes for one file, and `.vscode/settings.json:2-11` turns on `editor.formatOnSave` globally while the extension set recommends `editorconfig.editorconfig`, so the mismatch is reachable by pressing save rather than by any deliberate edit.

This matters because `--check` is a byte comparison (`tools/generate-workspace.mjs:50`). Any reformat of the file — format-on-save, a Tab press under the EditorConfig plugin, a third-party formatter — turns a correct tree into a reported STALE, and the README tells the reader the file is generated and must not be touched, so the natural response is to re-run the generator, which rewrites it, which the next save reverts. The `json,jsonc` entry shows the 2-space intent was explicit; `.code-workspace` was simply not listed.

**Fix:** Name the extension the generator actually writes, and pin it out of format-on-save's reach:

```ini
[*.{json,jsonc,code-workspace,yml,yaml,ini,cfg,properties}]
indent_size = 2
```

and in `.vscode/settings.json`:

```json
"[jsonc]": { "editor.formatOnSave": false }
```

(only if `.code-workspace` is in fact handled as JSONC by the editor — the `.editorconfig` line above is correct regardless).

### WR-05: `envNames()` encodes a rule that nothing enforces

**File:** `tools/lib/discover.mjs:94-97`

**Issue:** The docstring is emphatic — "D-16: project-scoped environment names, hyphens stripped from the id. Identical environment names across projects make the IDE build the wrong homework" — and `homeworks/project-baseline/platformio.ini:13-15` plus `homeworks/project-baseline/README.md:28-29` both treat the derived name as contractual ("The name it will take, `projectbaseline_native`, is already fixed by `envNames()`"). But the function has no production consumer: `sweep-homeworks.mjs` imports only `discoverHomeworks` and `ID_PATTERN_TEXT`, and `generate-workspace.mjs` imports only `discoverHomeworks`. Nothing parses `platformio.ini`, so a homework may declare `[env:main]`, or the same env name as another project, and the full gate still exits 0. The stated rationale for one-command builds — the IDE building the wrong homework — is exactly the failure the gate cannot see.

**Fix:** Have the sweep read each discovered `platformio.ini` and assert the declared env names are precisely the two `envNames(id)` returns (the `[env:<name>]` headers are one `matchAll` away), reporting a mismatch the same way `MALFORMED HOMEWORK ID` is reported. If that check is deliberately deferred to Phase 6, say so in the `envNames` docstring — as written it reads as enforced.

### WR-06: Format-on-save is enabled for C/C++ with no `.clang-format` in the repository, and the only committed C++ file is unstable under it

**File:** `.vscode/settings.json:11-24`, `homeworks/project-baseline/src/main.cpp:11-15`, `.editorconfig:25-26`

**Issue:** `editor.formatOnSave: true` applies globally, `[c]`/`[cpp]` set `ms-vscode.cpptools` as the default formatter, and `C_Cpp.formatting: "clangFormat"` selects clang-format. No `.clang-format` exists (correctly deferred to Phase 5), so the formatter runs with LLVM defaults: `IndentWidth: 2`, `ColumnLimit: 80`. The committed file is neither. Measured line widths:

```
 13  108    Serial.printf("baseline: flash=%u psram=%d psramSize=%u\n", static_cast<unsigned>(ESP.getFlashChipSize()),
 14   91                  static_cast<int>(psramFound()), static_cast<unsigned>(ESP.getPsramSize()));
```

Line 13 is 108 columns — past `editor.rulers: [100]` and far past clang-format's 80 — while the function body is indented with 2 spaces, contradicting `.editorconfig:25-26` (`indent_size = 4` for `*.{c,h,cpp,hpp,cc,ixx}`). Opening `main.cpp` and saving it therefore rewrites it, on a repository whose constraints state that commits are read by the instructor and must be clean. The file is formatted to a 100-column budget that matches neither `.editorconfig` nor the formatter the editor is configured to run.

**Fix:** Pick one owner now rather than at Phase 5. The smallest change that removes the surprise is to stop the editor from formatting before the config that governs formatting exists:

```json
"editor.formatOnSave": false,
```

and re-enable it in Phase 5 when `.clang-format` lands and the column limit has an owner. If format-on-save is meant to stay on, `.editorconfig:26` should be `indent_size = 2` (or the file re-indented to 4) so the written and the declared styles agree.

### WR-07: The default-root test hard-codes this repository's current contents and contradicts its own file header

**File:** `tools/tests/sweep.test.mjs:134-146`

**Issue:** The test is:

```js
test("the scanned root defaults to the repository, never the process working directory", () => {
  const elsewhere = makeTree();
  const result = spawnSync(process.execPath, [SWEEP_PATH, "--list"], { cwd: elsewhere, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.stdout.trim().split("\n"), ["project-baseline"]);
});
```

The last assertion makes the suite's outcome a function of the repository's homework list. Phase 2 adds homeworks; the moment it does, this test fails for a reason unrelated to what it tests. It also points the sweep at the real repository root, which the file's own header forbids: "No test may point the sweep at the repository root". `--list` does not build, so no `.pio/` is created and the rule's *purpose* is not violated — but the test still couples the suite to checkout state, and the header comment as written is now false.

**Fix:** Assert the property, not the contents — the default root must be non-empty and must be the repository, which is provable from any cwd:

```js
// The default root is the repository, so the ids are this checkout's — assert the
// property (discovery ran against the repo, not against the empty cwd), not the list.
assert.ok(result.stdout.trim().length > 0, "default root found nothing");
assert.match(result.stderr, /^$/, "the empty cwd must not have been scanned");
```

and amend the header comment to say "no test may *build* against the repository root" so the exception is visible.

### WR-08: A test silently requires a working PlatformIO installation, with no skip guard

**File:** `tools/tests/sweep.test.mjs:119-132`

**Issue:** "a project that fails to build is reported, not swallowed" is the only test that reaches `resolvePio()`; every other sweep test exits at the policy or zero-match stage. It runs the real `pio` against a fixture. On a machine where PlatformIO is absent, `resolvePio()` returns `null`, the sweep prints `PlatformIO Core was not found.` and exits 1 — and the assertion `assert.match(result.stderr, /1 project\(s\) checked; at least one failed/)` fails with a message about the gate rather than about the missing tool. On this machine it resolves via the `~/.platformio/penv/bin/pio` fallback and passes (369 ms); the suite's green result is contingent on that install. The tool under test handles the missing-binary case deliberately (`tools/sweep-homeworks.mjs:122-128`), so the suite should too.

**Fix:** Skip rather than fail when PlatformIO is unavailable, so a red suite always means a defect:

```js
const pioAvailable = ["PLATFORMIO_CORE", "HOME"].every((k) => k in process.env);
test("a project that fails to build is reported, not swallowed",
  { skip: pioAvailable ? false : "PlatformIO Core is not installed" }, () => { ... });
```

### WR-09: `.planning/milestone.lock` is untracked and unignored — the tree is dirty, which the `.gitignore` section above it exists to prevent

**File:** `.gitignore:115-120`

**Issue:** The GSD section explains its own reason for existing: the research cache "sits INSIDE the tracked `.planning/research/` tree, so without this line `git status` is dirty on a fresh research run — the exact state criterion 3 forbids." The same reasoning applies to the sibling GSD artifact `.planning/milestone.lock`, and no line covers it. Measured:

```
$ git status --porcelain
?? .planning/milestone.lock
$ git check-ignore -v .planning/milestone.lock
(NOT IGNORED)
```

`.gsd/` is fine — it carries its own `.gitignore` with `*` — but `.planning/milestone.lock` leaves every `git status` on a working checkout reporting a change, which is precisely the signal a contributor is trained to read as "something needs committing." Since the phase authored this file and articulated the invariant, the gap is in scope.

**Fix:** Add it to the GSD section:

```gitignore
.planning/state.json
.planning/milestone.lock
```

## Info

### IN-01: `findDepthViolations` builds violation paths by slicing, so a non-normalized `repoRoot` yields a garbled path

**File:** `tools/lib/discover.mjs:56`

**Issue:** `child.slice(repoRoot.length + 1)` assumes `repoRoot` is exactly the prefix of `child` with no trailing separator. It is true for `resolve()`-normalized absolute paths, which is why the CLI is safe today, but the function is exported and documented as taking an arbitrary `repoRoot`. Measured:

```
findDepthViolations(root + "/") -> ["omeworks/m01-l03-blink/.pio/libdeps/..."]   # leading char eaten
findDepthViolations(".")        -> ["meworks/m01-l03-x/deeper"]                 # silently wrong
```

**Fix:** Use the path module instead of arithmetic:

```js
import { relative } from "node:path";
...
violations.push(relative(repoRoot, child));
```

### IN-02: `installTools` leaves an empty `tools/tests/` directory in every fixture

**File:** `tools/tests/helpers.mjs:76-82`

**Issue:** The filter is `(src) => !src.includes(testsDir)` where `testsDir = "tools/tests/"` — with the trailing separator. `cpSync` calls the filter on the directory itself as `.../tools/tests`, which does not contain `tools/tests/`, so the directory is created; only its children are filtered. Verified: the fixture's `tools/` is `['generate-workspace.mjs', 'lib', 'sweep-homeworks.mjs', 'tests']` and `tools/tests/` is empty. Harmless as written, but it means the filter does not do what its name says, and a future test that asserts a clean copied tree will be surprised.

**Fix:** Match the separator-less form, or use the destination argument:

```js
filter: (src) => src !== join(TOOLS_DIR, "tests"),
```

### IN-03: `resolvePio` accepts a `pio` that starts but exits non-zero, and hard-codes the POSIX virtualenv path

**File:** `tools/sweep-homeworks.mjs:111-120`

**Issue:** `spawnSync("pio", ["--version"], { stdio: "ignore" })` distinguishes only spawn failure from anything else; a `pio` present on `PATH` but broken (`return onPath.error ? null : "pio"`) is accepted, and the ensuing per-project failures are attributed to the projects rather than to the tool. Separately, `~/.platformio/penv/bin/pio` is the macOS/Linux layout — on Windows it is `Scripts/pio.exe` — so the fallback silently does nothing there and the PATH probe is the only remaining route. Both are degradation paths, not current defects, since a failure still exits non-zero.

**Fix:** Check `onPath.status === 0` before accepting the PATH candidate, and derive the fallback from `process.platform` or accept `PLATFORMIO_CORE` as the only override (which the error message already documents).

### IN-04: One unit test asserts nothing

**File:** `tools/tests/discover.test.mjs:132-134`

**Issue:** `assert.deepEqual(envNames("m01-l03-blink"), envNames("m01-l03-blink"))` cannot fail — `envNames` is a pure function returning a fresh object literal from the same input, so the assertion holds even if the implementation returns `{s3: undefined, native: undefined}`. It contributes a green tick and no coverage, which is worse than having no test when the suite's count is read as evidence.

**Fix:** Replace it with an assertion with content, e.g. that the stem is hyphen-free and that distinct ids produce distinct env names (`assert.notDeepEqual(envNames("m01-l03-a"), envNames("m01-l03-b"))`), which is the property the collision rationale actually depends on.

### IN-05: The root README documents neither the sweep gate nor the test command, and overstates `AGENTS.md`'s role

**File:** `README.md:93-96`, `README.md:44-48`

**Issue:** `/gsd-code-review`'s phase context names "a repo-wide sweep gate" as a phase deliverable, and the structure diagram lists `sweep-homeworks.mjs` as "validates ids and builds every homework" — but the README never states how to run it, what its exit codes mean, or what `--list` / `--allow-empty` / `--root` are for. The test command (`node --test "tools/**/*.test.mjs"`) is likewise absent. Meanwhile line 95 declares `AGENTS.md` "the single source of truth for repository rules", while `AGENTS.md:181` says "Conventions not yet established. Will populate as patterns emerge during development." The id grammar, the one-level depth rule, and the env-naming rule live only in code comments.

**Fix:** Add a short "Checking the repository" section documenting `node tools/sweep-homeworks.mjs` and `node --test "tools/**/*.test.mjs"`, and either move the four rules into `AGENTS.md`'s Conventions section or soften the README's claim to "repository rules live in the code that enforces them."

### IN-06: Nested workspace roots may prevent the root `.vscode/settings.json` from reaching homework files

**File:** `tools/generate-workspace.mjs:32-36`, `.vscode/settings.json`

**Issue:** The generated workspace lists `root` (`.`) *and* one folder per homework, so every homework folder is nested inside the root folder. VS Code folder-scoped settings are applied per workspace folder, and `C_Cpp.formatting`, `editor.rulers` and `editor.formatOnSave` in the root's `.vscode/settings.json` are folder-scoped — so a `.cpp` file opened from `homeworks/<id>/` may not receive them. Flagging for verification rather than asserting, because VS Code's resolution between overlapping roots is not documented precisely enough for me to call it, and because the generator deliberately refuses to emit settings ("a PURE FOLDER LIST ... never a template with settings spliced in", lines 4-7) — which is a good reason, but it means the workspace-level `settings` key is unavailable as a fallback.

**Fix:** Verify by opening `homeworks/project-baseline/src/main.cpp` in the generated multi-root workspace and checking `editor.rulers` and `C_Cpp.formatting` in the effective settings. If they are not applied, either emit a `settings` key (which breaks the pure-folder-list property and should be a deliberate decision) or drop `root` from the folder list so the settings file's own folder is unambiguous.

---

_Reviewed: 2026-10-15T13:05:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
