---
phase: 01-repository-skeleton-and-project-layout
reviewed: 2026-10-15T15:00:47Z
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
  warning: 10
  info: 8
  total: 19
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-10-15T15:00:47Z
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

This is the re-run of the Phase 01 review over the phase's full current change set (the evaluation
scope of `check evaluation-scope --phase 01`). All 19 files were re-opened and re-verified against
the current tree; no finding below is carried forward on the strength of a prior summary.

**Id reconciliation — read this before triaging.** The briefing for this run described the prior
pass as `2026-10-15T13:05:00Z` with 18 files and an id set of `CR-01, WR-01..WR-09, IN-01..IN-06`.
The artifacts actually on disk are a *later* pass: `01-REVIEW.md` is stamped
`2026-10-15T14:53:40Z` with 19 files (`tools/tests/ignore-rules.test.mjs` included) and reports
`CR-01, WR-01..WR-08, IN-01..IN-07` — and `01-REVIEW-DISPOSITION.md` carries 17 rows, adding `WR-09`
flagged `- (not in the current review)` and carrying **IN-07**, which the briefing omitted. The
on-disk artifacts are authoritative for id stability, so this report re-reports `IN-01..IN-07` (not
`IN-01..IN-06`), keeps `WR-09` in the superseded list, and numbers new findings from `WR-10` /
`IN-08`. Numbering a new info item `IN-07` would have reused a live id and caused the disposition
gate to silently drop the existing `IN-07` row. No prior finding was rejected as mistaken.

**Verdict:** the layout and the ignore contract hold up; the enforcement layer does not. The
generator's drift gate still reports success while doing nothing when the script is reached through
a symlink (CR-01, re-proven end to end). The sweep's depth rule is still evaluated against the
working tree rather than the committed tree, so gitignored build output can turn the repo-wide gate
red (WR-01, mechanism proven). `--list --allow-empty` still emits prose instead of ids (WR-02,
re-proven). The generator still drops a homework it cannot name and still exits 0 (WR-03, re-proven
— and a *symlinked* homework is dropped the same way, which is new evidence for that finding). Two
findings are new, both in the never-before-reviewed `tools/tests/ignore-rules.test.mjs`: the
"no tracked path is hidden" guard is not hermetic — a machine-local exclude makes it red and the
message blames the repository's own rule (WR-10), and the inline-comment guard is a false-positive
generator for a valid escaped-hash pattern (WR-11).

**What is genuinely good, and was verified rather than assumed.** The new ignore-contract test is
not decoration. I built throwaway git fixtures under `os.tmpdir()` carrying byte-identical copies of
`.gitignore` and mutated the copy one rule at a time: dropping `.planning/*.lock` (case 2), widening
to `.planning/` (case 3), ignoring `.claude/` whole (case 4), planting an inline comment on
`.DS_Store` (case 5), giving `*.pem` a trailing slash (case 6), dropping `.pio/` (case 7) and
shadowing the tracked `PROJECT.md` (case 8) each turned a specific assertion red, and the faithful
copy was green. That is a real gate. The `.gitignore` line plan 01-06 added is also correct: it
covers every lock file name the GSD runtime actually writes into `.planning/`
(`.lock`, `.WINDOWS.lock`, `milestone.lock`, `milestoneConflict.lock`,
`gsd-install-migration.lock` — all confirmed with `git check-ignore -v`), `git status --porcelain`
is empty, and no tracked path is shadowed. WR-09 is closed and stays closed. The id grammar is
sound under adversarial input — a trailing newline, CR, tab, space, NUL or U+2028 is rejected, so
the `$` anchor behaves (JavaScript `$` is strict end-of-input, unlike Python's), and the regex is
applied before a name ever becomes a path, so `homework.dir` cannot carry traversal. Both spawned
tools use argv arrays and no shell.

## Critical Issues

### CR-01: The entry-point guard fails open — `--check` exits 0 without checking when the script path carries a symlink

**File:** `tools/generate-workspace.mjs:68`

**Issue:** Still present, and re-proven. The guard is

```js
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
```

`import.meta.url` is the **realpath-resolved** URL of the module (Node resolves the entry module's
realpath by default), while `process.argv[1]` is the path exactly as typed. Any symlink component
anywhere in that path therefore breaks the equality, `main()` never runs, and the process falls off
the end of the module with status 0 — the same status `main()` returns on success.

Reproduction (throwaway fixture under `os.tmpdir()`; the workspace file deliberately stale, the
fixture's `tools/` carrying a verbatim copy of the tool tree):

| invocation | result |
|---|---|
| `node <real>/tools/generate-workspace.mjs --check` | `STALE -> run node tools/generate-workspace.mjs`, exit **1** |
| `cd <real> && node ./tools/generate-workspace.mjs --check` | exit **1** |
| `ln -s <real>/tools/generate-workspace.mjs <bin>/gen.mjs; node <bin>/gen.mjs --check` | **no output at all**, exit **0** |
| `node <bin>/gen.mjs` (no `--check`) | exit **0**, workspace file byte-identical: the write was silently skipped too |

The trigger is wider than "someone symlinks the script": *any* symlinked parent component does it.
On this machine `/tmp` is a symlink to `/private/tmp`, so a checkout, a CI workspace or a VS Code
task rooted under `/tmp` fails open. `git rev-parse --show-toplevel` is not involved, so nothing
warns. This is the whole point of the file — a drift check that reports success without reading
anything is worse than no check, because it is trusted.

**Fix:** compare realpaths, not raw paths.

```js
import { realpathSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

// fileURLToPath(import.meta.url) is already realpath-resolved.
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
```

Wrap the `realpathSync` in a try/catch returning "not the entry point" so a deleted argv[1] cannot
turn the import path into a crash. Do not "fix" this by making the guard unconditional — the tests
import `renderWorkspace` from this module.

## Warnings

### WR-01: The depth rule is evaluated against the filesystem, not the committed tree — `.pio/` can turn the repo-wide gate red

**File:** `tools/lib/discover.mjs:49-63` (walk at `52-59`, fed by `directoriesIn` at `31-37`)

**Issue:** Still present. `findDepthViolations` descends into *every* directory under `homeworks/`,
including directories the repository deliberately ignores. A fixture containing
`homeworks/proj-baseline/.pio/libdeps/s3/SomeLib/src/platformio.ini` — the shape a PlatformIO
library that ships its own test project leaves behind — yields

```
violations: ["homeworks/proj-baseline/.pio/libdeps/s3/SomeLib/src"]
```

and the sweep turns that into `DEPTH RULE VIOLATED` plus `process.exit(1)` at
`tools/sweep-homeworks.mjs:64-86`, before any build. The offending file is build output that git
never tracks, so the failure is not reproducible from a clone, not explainable by the printed
reason ("every shared-library path in `lib_deps` is relative to the project"), and not fixable by
moving anything the author owns. Two honest caveats: the trigger is **not realized in this tree
today** (`find homeworks -name platformio.ini` returns only
`homeworks/project-baseline/platformio.ini`; `.pio/` currently holds 6 directories, all under
`.pio/build/`), and one plausible route is closed — `symlink://` dependencies land in
`.pio/libdeps/<env>/<Name>` as symlinks, and `entry.isDirectory()` is false for a symlink, so
symlinked libraries are skipped. The open route is a transitively-resolved registry library whose
package contains a `platformio.ini` (library packages with examples routinely do).

**Fix:** skip ignored directories during the walk rather than walking the whole tree. The cheapest
correct form keeps the "single discovery source" property and adds no dependency:

```js
// Directories this rule must not descend into: build output, not homework layout.
const WALK_SKIP = new Set([".pio", ".pioenvs", ".piolibdeps", ".pio-cache", "node_modules"]);

function directoriesIn(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !WALK_SKIP.has(entry.name))
    .map((entry) => entry.name)
    .sort();
}
```

If "ignore the ignore rules" is the wrong call, the alternative is to state in the sweep's message
that a violation may be build output and print the offending path's ignore status. Do not leave it
as-is: a gate that can go red for a reason the operator cannot reproduce from a clone is a gate
people learn to bypass.

### WR-02: `--list --allow-empty` prints a prose line on stdout, breaking the documented `--list` contract

**File:** `tools/sweep-homeworks.mjs:90-99` (the offender is `console.log` at `92`)

**Issue:** Still present, re-proven. The flags are independent, and the zero-match branch runs before
the `listOnly` branch at `102`:

```
$ node tools/sweep-homeworks.mjs --root <empty-fixture> --list --allow-empty
sweep: no homework projects found (--allow-empty)
exit=0
```

The file's own header (`13-17`) declares `--list` to be "the contract Phase 6's CI matrix consumes"
and promises "the validated ids, one per line". A consumer that splits stdout on newlines and
treats each line as an id gets `["sweep: no homework projects found (--allow-empty)"]` — a
plausible-looking id that no discovery pass ever validated, from the one command whose whole job is
to be machine-readable. The existing test
(`tools/tests/sweep.test.mjs:70-75`, "--allow-empty is the single escape hatch: it exits 0 and
prints one line") passes because it never combines the two flags, so the interleaving is untested.

**Fix:** route the acknowledgment to stderr, or emit nothing under `--list`:

```js
if (found.length === 0) {
  if (allowEmpty) {
    // The id list is the contract; an empty one is exactly what --list promises here.
    if (!listOnly) console.log("sweep: no homework projects found (--allow-empty)");
    process.exit(0);
  }
  ...
}
```

Then extend the `--allow-empty` test with a `--list` case asserting `stdout === ""`.

### WR-03: The generator silently drops homeworks it cannot name, and exits 0

**File:** `tools/generate-workspace.mjs:30-38` (discard at `31`), `40-48`; `tools/lib/discover.mjs:31-37`, `76-81`

**Issue:** Still present, re-proven, and the class is wider than the prior report said.
`discoverHomeworks` returns `{found, malformed, violations}`; `renderWorkspace` destructures only
`found`, and `main()` never looks at `malformed` or `violations`, so both the generate and the
`--check` paths return 0 whatever discovery rejected. Fixture with one grammar-valid project and one
directory named `hw01-Blink` carrying a real `platformio.ini`:

```
$ node tools/generate-workspace.mjs
wrote .../homework.code-workspace          # the file lists root + shared only
generator exit=0
$ node tools/generate-workspace.mjs --check
homework.code-workspace is up to date
check exit=0
```

The workspace file therefore omits a project that exists on disk, and the drift gate ratifies the
omission — exactly the failure `README.md:22-24` warns the reader about ("a stale file silently
hides a homework from the Explorer"). The sweep *does* catch the same directory
(`MALFORMED HOMEWORK ID`, exit 1), so the two tools built on one discovery source reach opposite
verdicts on one tree.

**New evidence for the same id:** a *symlinked* homework is dropped the same way and just as
silently. `directoriesIn` filters on `entry.isDirectory()`, which is false for a symlink, so given
`homeworks/project-real` (real) and `homeworks/project-linked` → a symlinked directory,
`discoverHomeworks` returns `found: [project-real]`, `malformed: []` — the symlinked project is
neither found nor reported. It is invisible to the generator, the sweep, the drift check and the
workspace file alike. The module's comment frames `isDirectory()` as the symlink-escape control,
which is a legitimate purpose; the defect is that the control is silent, not that it exists.

**Fix:** fail loudly on both lists in `main()`, before deciding anything else:

```js
function main() {
  const { found, malformed, violations } = discoverHomeworks(REPO_ROOT);
  if (malformed.length > 0 || violations.length > 0) {
    for (const name of malformed) console.error(`not a valid homework id: homeworks/${name}/`);
    for (const v of violations) console.error(`deeper platformio.ini found: ${v}`);
    console.error("Refusing to write a workspace file that would omit a project on disk.");
    return 1;
  }
  ...
}
```

Have `renderWorkspace` keep taking the tree (it must stay a pure function of it) and report the
rejections from `main()`. For the symlink case, either add `entry.isSymbolicLink()` to a reported
list or document the omission in `discover.mjs`'s docstring.

### WR-04: `.editorconfig` assigns 4-space indent to `homework.code-workspace`, but the generator emits 2 spaces

**File:** `.editorconfig:9-15`, `tools/generate-workspace.mjs:37`

**Issue:** Still present. The sections are `[*]`, `[*.{md,markdown}]`,
`[*.{json,jsonc,yml,yaml,ini,cfg,properties}]`, `[*.{c,h,cpp,hpp,cc,ixx}]`, `[*.{sh,bash}]`,
`[Makefile]`. `homework.code-workspace`'s extensionless final segment (`.code-workspace`) matches
none of the brace groups, so only `[*]` applies and `indent_size = 4` governs it — while
`JSON.stringify({ folders }, null, 2) + "\n"` writes two-space indent, which is what is committed.
The file the reader is told never to hand-edit is the one file whose committed indentation violates
the repository's own whitespace contract, so an editor honouring EditorConfig will offer to reindent
every line of it.

**Fix:** add the extension to the JSON family in `.editorconfig` — it is a JSON file, and that reads
better than special-casing the generator:

```ini
[*.{json,jsonc,yml,yaml,ini,cfg,properties,code-workspace}]
indent_size = 2
```

### WR-05: `envNames()` encodes a rule that nothing enforces

**File:** `tools/lib/discover.mjs:94-97`

**Issue:** Still present. `envNames` has no production consumer: `grep -rn envNames` over `*.mjs`
finds it in `tools/lib/discover.mjs` (the definition) and `tools/tests/discover.test.mjs` (three
uses) and nowhere else. `sweep-homeworks.mjs` imports only `discoverHomeworks` and
`ID_PATTERN_TEXT`; `generate-workspace.mjs` imports only `discoverHomeworks`. Nothing parses a
`platformio.ini`, so a homework may declare `[env:main]` — or the same environment name as another
project — and the full gate still exits 0. The docstring is emphatic about the consequence
("Identical environment names across projects make the IDE build the wrong homework"), and
`homeworks/project-baseline/platformio.ini:13-15` and
`homeworks/project-baseline/README.md:28-29` both treat the derived name as contractual
("The name it will take, `projectbaseline_native`, is already fixed by `envNames()`"). The stated
rationale for one-command builds is precisely the failure the gate cannot see.

**Fix:** have the sweep read each discovered `platformio.ini` and assert the declared `[env:<name>]`
headers are exactly the members of `envNames(id)`, reporting a mismatch the way
`MALFORMED HOMEWORK ID` is reported (`homework.dir` is already in scope, and the headers are one
`matchAll(/^\[env:([^\]]+)\]/gm)` away). If that check is deliberately Phase 5/6 work, say so in
the docstring — as written it reads as enforced, and `homeworks/project-baseline/README.md` repeats
the claim.

### WR-06: Format-on-save is enabled for C/C++ with no `.clang-format` in the repository, and the only committed C++ file is unstable under it

**File:** `.vscode/settings.json:11-17`, `:22`; `homeworks/project-baseline/src/main.cpp:13-14`; `.editorconfig:25-26`

**Issue:** Still present. `.vscode/settings.json` sets `editor.formatOnSave: true` globally, routes
`[c]` and `[cpp]` to `ms-vscode.cpptools`, and sets `C_Cpp.formatting: "clangFormat"` — but
`ls .clang-format .clang-tidy` reports neither exists. clang-format therefore falls back to the
built-in LLVM style (IndentWidth 2, ColumnLimit 80), which **contradicts** `.editorconfig:25-26`,
where the repository's own owner of C/C++ whitespace declares `indent_size = 4` for
`*.{c,h,cpp,hpp,cc,ixx}`. So the two committed whitespace owners for C++ disagree with each other,
and the disagreement is resolved by whichever editor plugin happens to be installed.

The committed artifact already shows the cost: `src/main.cpp:13` is **108 columns**, against the
100-column ruler this same settings file declares at lines 8-10 and against LLVM's 80 — the file was
hand-wrapped to fit a limit that no committed configuration states. Line 14 is 91 columns. Since
this is the only C++ file in the repository, every C++ edit made with the committed editor settings
produces either a 4-to-2-space reindent or no formatting at all. (Not re-verified by running
clang-format: no clang-format binary exists on this machine — `~/.local/bin`, `/opt/homebrew/opt/llvm/bin`
and `tool-clangtidy` are all absent — so the instability is read off the two committed configs, not
measured.)

**Fix:** commit a minimal `.clang-format` (Phase 5 owns the full config, but the indentation decision
is needed now, and a stub is not a template — it is the missing half of a rule `.editorconfig`
explicitly delegates):

```yaml
# .clang-format — C/C++ formatting ONLY. Whitespace ownership is split:
# .editorconfig owns text-level rules, this file owns C/C++ shape.
BasedOnStyle: LLVM
IndentWidth: 4
ColumnLimit: 100
```

`IndentWidth`/`ColumnLimit` must agree with `.editorconfig:25-26` and `.vscode/settings.json:8-10`,
or one of the three must be changed to match. Also confirm `.vscode/extensions.json`'s
`ms-vscode.cpptools` recommendation is what resolves `editor.defaultFormatter` for these file types
(it is, so the fallback style is the live one).

### WR-07: The default-root test hard-codes this repository's current contents and contradicts its own file header

**File:** `tools/tests/sweep.test.mjs:134-146`

**Issue:** Still present, and it has acquired a second failure mode. The test asserts

```js
assert.deepEqual(result.stdout.trim().split("\n"), ["project-baseline"]);
```

against the **real repository**, while the file's header at lines 4-7 states the rule it breaks:
"No test may point the sweep at the repository root: doing so would discover the real baseline,
build it, and create `.pio/` inside the repository in the act of testing the rule that says the tree
stays clean. Every fixture is built under `os.tmpdir()` ... and the sweep is given an explicit
`--root` except where the default itself is what is under test." The carve-out is real — the test
*is* the exception it carves, and it passes `--list` so nothing is built — but the assertion is a
hard-coded census. The first course homework committed under `homeworks/` turns this test red for a
reason that has nothing to do with the property under test ("the default root is derived from
`import.meta.url`, not `process.cwd()`").

**Second failure mode, new:** the default root is the real repository, and `--list` runs *after* the
depth check (`tools/sweep-homeworks.mjs:64-86` exits before `:102`). WR-01's mechanism therefore
reaches this test directly: the day a transitively-resolved library deposits a `platformio.ini`
under `homeworks/project-baseline/.pio/libdeps/`, this test fails with `DEPTH RULE VIOLATED` in
stderr and no id list at all — a confusing cross-finding failure in a test about cwd handling.

**Fix:** assert the property, not the census. The point is that the default root is *not* the cwd, so
compare against what discovery independently reports for the repository:

```js
const expected = spawnSync(
  process.execPath,
  [SWEEP_PATH, "--root", REPO_ROOT, "--list"],
  { encoding: "utf8" },
);
assert.equal(result.status, expected.status, result.stderr);
assert.deepEqual(result.stdout, expected.stdout);
```

with `REPO_ROOT` exported from `helpers.mjs` (it already computes it at line 16). A census is fine
as a *separate* test that says "the repository ships exactly the baseline", but it should not be
fused to the cwd test.

### WR-08: A test requires a working PlatformIO installation, with no skip guard

**File:** `tools/tests/sweep.test.mjs:119-132`

**Issue:** Still present. The test relies on `runSweep(root)` with no `PLATFORMIO_CORE` override, so
it exercises `resolvePio()`'s default discovery (`tools/sweep-homeworks.mjs:111-120`) and needs a
real `~/.platformio/penv/bin/pio` with a working toolchain; there is no `t.skip()` guard and no
injection point. **Correcting the prior report's wording:** the failure is *loud*, not silent. I
reproduced the absence case (`HOME` unset, minimal `PATH`):

```
PlatformIO Core was not found.
Install it, or point at it explicitly:
  export PLATFORMIO_CORE=$HOME/.platformio/penv/bin/pio
sweep exit=1
```

`assert.equal(result.status, 1)` therefore *passes*, `assert.doesNotMatch(result.stderr,
/failed to start/)` also passes, and `assert.match(result.stderr, /1 project\(s\) checked; at least
one failed/)` fails — the suite fails, with a message that does not name the real cause. So the
defect is a portability/reliability one, not a false green. Two further fragilities in the same test:
it depends on PlatformIO exiting non-zero for a `platformio.ini` with no `[env:]` section (a
behaviour of the installed Core, not a contract), and it is the slowest test in the suite by an
order of magnitude (439 ms of a 701 ms run), which is the shape of thing that silently degrades as
homeworks accumulate.

**Fix:** inject the binary instead of discovering it. `runSweep` already accepts an env override
(`helpers.mjs:122-128`), so point `PLATFORMIO_CORE` at a small executable that exits non-zero
deliberately, written into the fixture:

```js
const fakePio = writeFileAt(root, "fake-pio", "#!/bin/sh\nexit 1\n");
chmodSync(fakePio, 0o755);
const result = runSweep(root, [], { PLATFORMIO_CORE: fakePio });
```

That asserts exactly what the test claims ("a project that fails to build is reported, not
swallowed") with no PlatformIO, no toolchain and no 439 ms. Reserve the real binary for a
separately named, environment-gated smoke test.

### WR-10: The "no tracked path is hidden" guard is not hermetic — a machine-local exclude makes it red and the message blames the repository's own rule

**File:** `tools/tests/ignore-rules.test.mjs:138-150` (the command is `:142`, the blame is `:145-149`)

**Issue:** New. `git ls-files -i -c --exclude-standard` consults **every** standard ignore source,
not just this repository's `.gitignore`: `.gitignore` files, `.git/info/exclude`, and
`core.excludesFile` (the user's global exclude). The test then asserts an empty result and attributes
any output to the repository's own rule — "a path git tracks has become ignored — one segment too
many was added to a rule". That inference is unsound, and the file's own header makes exactly this
distinction the reason test 1 exists: "a bare `check-ignore -q` proves nothing about a fresh clone:
this machine's `~/.config/git/ignore` already matches some of these paths". Test 1 asserts the
*source* git reports; test 3 does not, and it is the one test that reads a machine-wide setting.

Reproduction — a git fixture carrying a **byte-identical copy** of the repository's `.gitignore`
(`cmp` confirms), plus one tracked file `legit-source.txt` and a machine-local exclude that matches
it:

```
# control
$ node --test tools/tests/ignore-rules.test.mjs      ->  pass 5 / fail 0

# with .git/info/exclude containing "legit-source.txt"
$ git ls-files -i -c --exclude-standard
legit-source.txt
$ node --test tools/tests/ignore-rules.test.mjs
✖ no tracked path is hidden by the ignore configuration
  ℹ pass 4 / fail 1

# with core.excludesFile containing "legit-source.txt" instead — same result
✖ no tracked path is hidden by the ignore configuration
```

This repository is not hypothetical here: `~/.config/git/ignore` on the machine the phase was
developed on contains `**/.claude/settings.local.json`, and `.gitignore:98` deliberately ignores the
same path — so `.claude/settings.local.json` is a tracked-file candidate that a machine-local rule
can move out from under this test. The consequence is a red gate for a reason the operator did not
cause, with a message that sends them to widen or narrow a glob that was never the problem, in the
file whose stated job is to be trustworthy about *why* a rule matched.

**Fix:** name the repository's exclude file explicitly instead of accepting the standard set. `-i`
requires at least one `--exclude*` option, and `--exclude-from` **replaces** the standard set rather
than adding to it — measured in a fixture where only `.git/info/exclude` matched a tracked file:

| command | reports |
|---|---|
| `git ls-files -i -c --exclude-standard` | `tracked-ok.txt` (the false positive) |
| `git ls-files -i -c --exclude-from=.gitignore` | *(nothing)* — and it still reports `collision.txt` when the repository's own rule does match a tracked file |
| `git ls-files -i -c --exclude-from=/dev/null` | *(nothing)* |

So the correction is a one-argument change:

```js
const result = git(["ls-files", "-i", "-c", "--exclude-from=.gitignore"]);
assert.equal(result.status, 0, result.stderr);
assert.equal(result.stdout, "", "a path this repository tracks matches this repository's .gitignore");
```

`core.excludesFile` is suppressed by this form too (measured), so `.git/info/exclude` and the global
ignore must be opted into deliberately rather than inherited. If the broader "no ignore source
anywhere hides a tracked path" check is genuinely wanted, keep it as a *second*, separately named
test whose failure message says it may be machine-local and prints the source from
`git check-ignore -v --no-index <path>`; do not leave one assertion doing both jobs and blaming the
wrong one.

One further `--no-index` detail, worth fixing in the same pass because it makes the two tests fail
*consistently*. `ignoreSource` (`:37-42`) calls `git check-ignore -v <path>` with no `--no-index`,
and git refuses to answer for a path in the index: on a tracked-and-matching path it exits 1 with
empty output, while `git check-ignore -v --no-index <path>` exits 0 and reports the true source
(measured: `.gitignore:2:collision.txt` vs `.git/info/exclude:1:tracked-ok.txt` depending on the
file). So if a member of `MUST_BE_IGNORED` is ever *tracked* — which is precisely the state this
test exists to catch — test 1 reports "`X` is not ignored at all" and test 3 (currently) names the
wrong source, instead of both converging on "git tracks a path the ignore file also matches". Add
`--no-index` to `ignoreSource`'s argument list.

### WR-11: The inline-comment guard rejects a valid escaped-hash pattern

**File:** `tools/tests/ignore-rules.test.mjs:169-179` (the pattern is `:176`)

**Issue:** New. The guard is

```js
.filter((line) => /^[^#][^#]*#/.test(line));
```

which means "the first character is not `#` and some `#` appears later" — the right idea, because
gitignore has no inline comments and an unescaped `#` after column 1 becomes part of the pattern.
But git *does* allow a `#` in column 1 to be escaped: `\#literal.txt` is a pattern for a file
literally named `#literal.txt`, not a comment. Git honours it:

```
$ printf '\\#literal.txt\n' > .gitignore    # file begins with the two bytes  \  #
$ git check-ignore -v '#literal.txt'
.gitignore:1:\#literal.txt	#literal.txt
exit=0
```

while the guard flags the same line as an offender (`/^[^#][^#]*#/.test("\\#literal.txt")` is
`true`). So a correct, necessary rule — added precisely because the repository must ignore a file
whose name starts with `#` — turns the suite red and tells the author that gitignore has no escaped
hashes, which is false. The trigger is narrow (no such line exists today) but the failure is
*blocking*: the gate refuses a valid edit and offers no path forward except deleting the rule or
weakening the test. There is a second, quieter false positive in the same regex: a line whose `#` is
itself preceded by a backslash anywhere (`foo\#bar`) is also escaped and also flagged.

**Fix:** exclude an escaped `#` by requiring that the offending `#` is not preceded by an
unescaped backslash:

```js
// A '#' after column 1 is an inline comment unless it is escaped, and gitignore DOES
// allow a leading escaped hash: '\#file' is a pattern, not a comment.
const INLINE_HASH = /^[^#][^\n]*?(?<!\\)#/;
```

`(?<!\\)` covers the single-backslash case that actually occurs; if double-escaping must be handled
exactly, invert the test instead — match `/^(?:[^#\\]|\\.)*#/` — and keep the message. Either way,
extend the comment at `:169-173` that currently asserts "There are NO inline comments in gitignore"
to name the escape, and pin the guard's own limit with a `\#` mutation case rather than with prose.

## Info

### IN-01: `findDepthViolations` builds violation paths by slicing, so a non-normalized `repoRoot` yields a garbled path

**File:** `tools/lib/discover.mjs:56`

**Issue:** Still present. `violations.push(child.slice(repoRoot.length + 1))` assumes `repoRoot` is
exactly the prefix of the `join`-normalized `child`. A trailing separator breaks that:
`repoRoot = "/tmp/x/"` gives `base = "/tmp/x/homeworks"`, `child = "/tmp/x/homeworks/a"`, and
`slice(8)` yields `"omeworks/a"`. Currently latent — `sweep-homeworks.mjs:52` passes
`resolve(value)` for `--root`, and `REPO_ROOT` comes from `join(...)`, which normalizes both. Note
that `discoverHomeworks:79` builds `found[].dir` with a literal `/` while this function builds paths
with `join` and `slice`, so the two path styles can also diverge on a non-POSIX host.

**Fix:** derive the relative path instead of slicing it:

```js
import { relative } from "node:path";
violations.push(relative(repoRoot, child));
```

which normalizes and uses the platform separator consistently with the rest of the module.

### IN-02: `installTools` leaves an empty `tools/tests/` directory in every fixture

**File:** `tools/tests/helpers.mjs:76-82`

**Issue:** Still present, re-verified. `testsDir` is built with a trailing separator
(`${join("tools", "tests")}${sep}`), so the filter's `src.includes(testsDir)` is true for the
*children* of `tools/tests` but false for the directory entry itself, whose `src` is
`.../tools/tests`. `cpSync` therefore creates the directory and then copies nothing into it.
Measured on a fresh fixture: `tools/tests exists: true entries: 0`, with
`fixture tools/: generate-workspace.mjs, lib, sweep-homeworks.mjs, tests`. Harmless today, but it
means every `--check` fixture carries a directory that looks like a tool tree and is empty, and it
is a stray artifact in a suite whose stated discipline is that fixtures match their intent.

**Fix:** filter on the directory itself as well as its contents:

```js
const testsDir = join(TOOLS_DIR, "tests");
cpSync(TOOLS_DIR, join(root, "tools"), {
  recursive: true,
  filter: (src) => src !== testsDir && !src.startsWith(testsDir + sep),
});
```

### IN-03: `resolvePio` accepts a `pio` that starts but exits non-zero, and hard-codes the POSIX virtualenv path

**File:** `tools/sweep-homeworks.mjs:111-120`

**Issue:** Still present. `spawnSync("pio", ["--version"], { stdio: "ignore" })` is inspected only
for `onPath.error`, so a `pio` found on `PATH` that starts and fails (a shim, a broken virtualenv, a
permissions problem) is accepted and then reported per-project as a build failure rather than as a
missing tool — the same misdiagnosis `tools/sweep-homeworks.mjs:107-110`'s comment exists to
prevent. Separately, `join(home, ".platformio", "penv", "bin", "pio")` is the POSIX layout only;
PlatformIO on Windows installs to `%USERPROFILE%\.platformio\penv\Scripts\pio.exe`.

**Fix:** branch on the exit status as well as the spawn error —
`return onPath.error || onPath.status !== 0 ? null : "pio"` — so the "PlatformIO Core was not found"
message (which already names `PLATFORMIO_CORE` as the remedy) is what the operator sees. Leave the
Windows path alone unless Windows is in scope; the project is macOS-only and AGENTS.md records no
Windows target, so a comment saying so is the honest fix.

### IN-04: One unit test asserts nothing

**File:** `tools/tests/discover.test.mjs:132-134`

**Issue:** Still present.
`assert.deepEqual(envNames("m01-l03-blink"), envNames("m01-l03-blink"))` compares a pure function
with itself. Precisely: it can only fail if `envNames` becomes non-deterministic, which no plausible
change would do — `return {};` would pass it. So it has no discriminating power over D-16's actual
contract (hyphens stripped, suffix appended, distinct ids mapping to distinct names). It contributes
a green tick to a suite whose count is cited as evidence (`01-VERIFICATION.md:120` records "17
assertions" for this file), which is the reason a vacuous assertion is worth naming.

**Fix:** assert the property the collision rationale depends on:

```js
test("distinct ids yield distinct environment names", () => {
  const a = envNames("m01-l03-a");
  const b = envNames("m01-l03-b");
  assert.notDeepEqual(a, b);
  assert.deepEqual(a, { s3: "m01l03a_s3", native: "m01l03a_native" });
});
```

Note the existing test at `:125-130` already pins the mapping for `project-baseline`; the
replacement adds the collision property, which is what the docstring's warning is about.

### IN-05: The root README documents neither the sweep gate nor the test command, and overstates `AGENTS.md`'s role

**File:** `README.md:93-96`, `:44-48`

**Issue:** Still present. The README covers the workspace generator in detail (lines 12-29,
including both invocations) and lists `tools/sweep-homeworks.mjs` and `tools/tests/` in the tree
sketch (lines 44-48), but never shows how to run the gate or the suite. The two commands that decide
whether the repository is healthy — `node tools/sweep-homeworks.mjs` and
`node --test "tools/**/*.test.mjs"` — appear nowhere in the README, while the one that only writes a
workspace file appears twice. Line 95 then says "[`AGENTS.md`](AGENTS.md) is the single source of
truth for repository rules", but the document it points at ends its Conventions section with
"Conventions not yet established. Will populate as patterns emerge during development." and its
Architecture section with "Architecture not yet mapped." For a public repository whose stated core
value is that a homework "explains its own wiring" without reconstructing anything from memory, the
gate that proves it and the instruction file that is pointed to as authoritative both undersell
themselves.

**Fix:** add a short "Checking the repository" section to `README.md` with the two commands and
their exit semantics (`--list` for machine consumption, `--allow-empty` as the only escape hatch,
`generate-workspace.mjs --check` for drift), and soften line 95 to say what AGENTS.md does and does
not yet cover, or fill in AGENTS.md's Conventions section with the rules Phase 1 actually
established (the id grammar, the one-level rule, the ignore-file ownership split).

### IN-06: Nested workspace roots may prevent the root `.vscode/settings.json` from reaching homework files

**File:** `tools/generate-workspace.mjs:32-38`, `.vscode/settings.json:8-25`, `homework.code-workspace`

**Issue:** Still present, still an inference rather than a measurement — I could not execute VS Code
in this review, and I am keeping the prior pass's honest hedge. The generated workspace lists `root`
(`"."`) *and* one folder per homework, so every homework folder is nested inside the root folder.
VS Code applies folder-scoped settings per workspace folder and resolves a file to its innermost
containing root, so a file opened from `homeworks/<id>/` is expected to take the `project-baseline`
root's settings — and that root has no `.vscode/` — rather than the repository root's
`editor.rulers`, `editor.formatOnSave` and `[c]`/`[cpp]` formatter. The committed file confirms the
fallback is unavailable by design: `homework.code-workspace` contains only `folders`, and
`tools/tests/generate-workspace.test.mjs:62-72` asserts `folders` is the only top-level key — so the
workspace-level `settings` block that would normally fix this is not merely absent, it would be
*deleted* by the generator and reported as drift. That part is provable from the committed code;
only the VS Code resolution itself is unverified here.

**Fix:** settle it empirically — open the workspace, open
`homeworks/project-baseline/src/main.cpp`, and read `editor.rulers` and the effective C/C++
formatter from the effective settings. If they are not applied, either drop `root` from the folder
list (the shared tree is already its own root) or emit a `settings` key and update the renderer test
that currently forbids one. Record the outcome in the phase notes either way, because the answer
decides whether `.vscode/settings.json` is the repository's editor contract or one root's private
preference.

### IN-07: The ignore-contract test cannot tell "git could not run" from "the rule was widened"

**File:** `tools/tests/ignore-rules.test.mjs:26-28`, `:37-42`, `:118`, `:129-134`

**Issue:** Still present, re-verified. `git(args)` returns the raw `spawnSync` result and no caller
inspects `result.error`, so both failure paths collapse "git could not answer" into a confident
diagnosis about the rules. Reproduced by running the fixture suite with the repository's `.git`
removed (git present on `PATH`, but not in a repository, so `check-ignore` exits 128 —
`fatal: not a git repository`):

```
✖ .planning/milestone.lock is not ignored at all — protects the GSD lock-file class ...
✖ sdkconfig.defaults is ignored — protects the hand-authored half ... the rule was widened past
  what it was written for
ℹ pass 1 / fail 4
```

Both messages are wrong: nothing about the rules changed. `ignoreSource` returns `null` for *any*
non-zero status (`:39`), and `assert.equal(result.status, 1, ...)` (`:130`) cannot distinguish 1
("not ignored", the intended state) from 128 (git refused). The same misdiagnosis occurs when git
cannot be spawned at all (`status` is `null`), which is the case the prior report described. Both
paths fail loudly, so this is never a false green — it is a diagnostics defect, and it matters here
because the file's header makes a point of distinguishing *why* a rule matched. See WR-10 for the
distinct, non-overlapping case where git runs fine but is asked about the wrong set of rules, and
for the `--no-index` fix that keeps both tests' diagnoses consistent.

**Fix:** surface the spawn error and distinguish the statuses, per the prior report:

```js
function git(args) {
  const result = spawnSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" });
  if (result.error) throw new Error(`git ${args.join(" ")} failed to start: ${result.error.message}`);
  return result;
}
```

and in the unignored test either accept `1` or `128` with a message naming which was seen, or keep
`=== 1` and include `result.stderr` in the assertion message so `fatal: not a git repository` is
visible. On the prerequisite question the prior report was right: `git` is intrinsic to this
repository, so this does not need a skip guard — unlike WR-08, where the missing tool is genuinely
optional.

### IN-08: Unknown flags are silently ignored, and the mutating path is the default

**File:** `tools/generate-workspace.mjs:44-48`; same pattern at `tools/sweep-homeworks.mjs:39-41`

**Issue:** New. Both tools decide their mode with `argv.includes(...)` and never validate the rest
of `argv`. For the generator that is worse than for the sweep, because the *default* branch is the
one that writes: `node tools/generate-workspace.mjs --chekc` (or `--check=1`, or a future wrapper
passing `--check-only`) silently rewrites `homework.code-workspace` and exits 0 instead of
reporting drift. The sweep is mostly protected by its failure modes — a mistyped `--allow-empt`
falls through to the zero-match failure — but a mistyped `--lst` starts a full build of every
project, which for this repository is real wall-clock time and, in Phase 6, a CI budget.

**Fix:** reject anything unrecognised, so the mutating action must be asked for deliberately:

```js
const KNOWN = new Set(["--check"]);
const unknown = argv.filter((arg) => !KNOWN.has(arg));
if (unknown.length > 0) {
  console.error(`unknown argument(s): ${unknown.join(", ")}`);
  console.error("Usage: node tools/generate-workspace.mjs [--check]");
  process.exit(2);
}
```

and give the sweep the equivalent list (`--list`, `--allow-empty`, `--root`, plus `--root`'s value).
Exit 2 matches the sweep's existing "misuse" convention at `tools/sweep-homeworks.mjs:50`.

## Superseded Prior Findings

Findings from the `2026-10-15T14:53:40Z` review (and `WR-09` from the earlier
`2026-10-15T13:05:00Z` one) that are **no longer live**. Each was re-opened against the current tree
before being listed here, and the two fixes were re-proven rather than taken on faith.

| id | disposition | evidence |
|----|-------------|----------|
| WR-09 | **fixed** | `.planning/milestone.lock` is ignored. The line plan 01-06 added, `.gitignore:96` (`.planning/*.lock`), resolves it: `git check-ignore -v .planning/milestone.lock` → `.gitignore:96:.planning/*.lock`, and `git status --porcelain` is empty while the file exists on disk (143 bytes). I also checked the glob against every lock name the GSD runtime actually writes — `.planning/.lock`, `.planning/.WINDOWS.lock`, `.planning/milestone.lock`, `.planning/milestoneConflict.lock`, `.planning/gsd-install-migration.lock` all resolve to line 96, so leading-dot names are covered (`*` matches a leading dot in gitignore) and no tracked file matches (`git ls-files \| grep -i lock` is empty, and `git ls-files -i -c --exclude-standard` is empty). `tools/tests/ignore-rules.test.mjs:47-51` holds the specific case shut. No new finding replaces it — a nested `.planning/phases/*.lock` is *not* matched by the glob, but no GSD lock file is written at that depth, so that is a hypothetical and is not reported. |

All sixteen prior findings that were live at `2026-10-15T15:00:47Z` — `CR-01`, `WR-01..WR-08`
and `IN-01..IN-07` — were re-verified as still present on the current lines cited above and are
re-reported under their original ids. No prior finding was rejected as mistaken, and none was
dropped. Sixteen live prior ids plus three new ones (`WR-10`, `WR-11`, `IN-08`) is nineteen findings;
`WR-09` is the only row that leaves the ledger, and it leaves as `fixed`.

---

_Reviewed: 2026-10-15T15:00:47Z_
_Reviewer: Claude (gsd-code-review workflow — re-review of the phase's full current change set)_
_Depth: standard_
