# Phase 1: Repository Skeleton and Project Layout - Pattern Map

**Mapped:** 2026-10-15
**Files analyzed:** 20 (17 created, 3 modified)
**Analogs found:** 13 / 20 (9 exact, 3 role-match, 1 negative-only, 7 with no analog)
**Planner note:** this repository has essentially no executable code at HEAD. Two analog sources carry this phase, and they are different in kind:
1. **`01-RESEARCH.md` executed skeletons** — code that was *written and run* in `/tmp/repo-probe` on 2026-10-15. These are the **positive** analogs. Quote them exactly; the exit codes, the regex and the ignore lines were measured.
2. **The abandoned scaffold on `origin/vl/init`** — real, previously-working files for this same repository, read as history. These are the **negative** analogs: the plan must show which shape is *not* reproduced.

---

## ⚠️ Two corrections the planner must carry into every plan

### Correction 1 — the ref is `origin/vl/init`, not `vl/init`

The tasking said `git show vl/init:<path>`. **That ref does not resolve in this repository.** Verified 2026-10-15:

```
$ git rev-parse --verify --quiet vl/init   →  (no output, exit 1)
$ git for-each-ref --format='%(refname)'   → refs/remotes/origin/vl/init   ← the only match
```

Also: the checked-out branch is **`repo/init`**, not `main`. Every scaffold read must be spelled:

```bash
git show origin/vl/init:<path>          # correct
git ls-tree -r --name-only origin/vl/init
```

Never check the branch out, never switch, never create it.

### Correction 2 — the scaffold files are branch-scoped, not working-tree files

All nine scaffold analogs below are **TRACKED** (committed on `origin/vl/init`) — verified with `git ls-tree -r --name-only origin/vl/init -- <path>`, which returns each path. This satisfies the tracked-source gate: none of them is a gitignored install/runtime mirror. But **none of them exists in the working tree at HEAD**, so a plan action may not say "read `scripts/pio-build.sh`". The action must say `git show origin/vl/init:scripts/pio-build.sh`. A plan that names a bare working-tree path for these will fail when the executor runs it.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `homework.code-workspace` | generated artifact | transform (pure function of tree → bytes) | `01-RESEARCH.md` § Code Examples lines 521–574 | **exact (executed)** |
| `.gitignore` | config | n/a (git semantics) | `01-RESEARCH.md` lines 718–839 | **exact (verified)** |
| `.editorconfig` | config | n/a (editor semantics) | `01-RESEARCH.md` lines 847–880 | **exact (spec-checked)** |
| `.gitattributes` | config | n/a (index semantics) | `01-RESEARCH.md` lines 882–923 | **exact (spec-checked)** |
| `.vscode/settings.json` | config | n/a | `origin/vl/init:.vscode/settings.json` | **role-match (superseded in 3 places)** |
| `.vscode/extensions.json` | config | n/a | `origin/vl/init:.vscode/extensions.json` | **role-match (superseded in 1 place)** |
| `tools/lib/discover.mjs` | utility (module) | filesystem walk / transform | `01-RESEARCH.md` lines 456–510 | **exact (executed)** |
| `tools/generate-workspace.mjs` | utility (CLI generator) | transform + drift check | `01-RESEARCH.md` lines 521–560 | **exact (executed)** |
| `tools/sweep-homeworks.mjs` | utility (CLI sweep) | batch + subprocess orchestration | `01-RESEARCH.md` lines 576–650 | **exact (executed)**, + negative `origin/vl/init:scripts/pio-build.sh` |
| `tools/tests/discover.test.mjs` | test | unit | none (framework pattern in RESEARCH lines 1002–1057) | **no analog** |
| `tools/tests/generate-workspace.test.mjs` | test | unit + integration | none | **no analog** |
| `tools/tests/sweep.test.mjs` | test | integration (temp fixtures) | none | **no analog** |
| `tools/tests/helpers.mjs` | test helper | fixture builder | none | **no analog** |
| `shared/lib/README.md` | doc | n/a | `origin/vl/init:shared/libs/README.md` | **negative (content inverted)** |
| `homeworks/project-baseline/platformio.ini` | config (build) | n/a | `01-RESEARCH.md` lines 681–694 | **exact (build measured)** |
| `homeworks/project-baseline/src/main.cpp` | source | boot-time output (transform) | `01-RESEARCH.md` lines 696–705 | **exact (compile measured)** |
| `homeworks/project-baseline/README.md` | doc | n/a | none | **no analog** |
| `README.md` (modify) | doc | n/a | `origin/vl/init:README.md` | **role-match (every convention superseded)** |
| `AGENTS.md` (modify) | doc | n/a | none — direct string corrections | **no analog** |
| `.planning/PROJECT.md` (modify) | doc | n/a | none — direct corrections + new section | **no analog** |

---

## Pattern Assignments

### `homework.code-workspace` (generated artifact, transform)

**Analog (positive):** `01-RESEARCH.md` lines 521–574 — the generator that produces it, executed in `/tmp/repo-probe`.
**Analog (negative):** `origin/vl/init:homework.code-workspace` — the hand-maintained shape D-01/D-02/D-03 exist to replace.

**The artifact is never authored by hand.** Do not write a plan action that creates this file with the Write tool. The only action is: write `tools/generate-workspace.mjs`, run `node tools/generate-workspace.mjs`, then verify with `--check`.

**Verified output shape** (RESEARCH lines 564–572):
```json
{
  "folders": [
    { "name": "root",   "path": "." },
    { "name": "shared", "path": "shared" },
    { "name": "project-baseline", "path": "homeworks/project-baseline" }
  ]
}
```
Two-space indent, one key per line, LF, exactly one trailing `\n`, **no comments**. `folders` is the only top-level key (D-03: pure folder list).

**The three determinism requirements** (RESEARCH lines 247–250), all verified:
1. sort every list (`readdirSync` order is filesystem-dependent);
2. fixed key order + `JSON.stringify(value, null, 2)` + one trailing newline;
3. never emit comments — VS Code accepts JSONC, so a hand-added comment is a plausible edit that any byte comparison flags.

**Must NOT copy from the scaffold** (`origin/vl/init:homework.code-workspace`):
- **Emoji folder names** — `"name": "📦 Root & Configs"`, `"🛡️ Rules & Standards"`, `"📚 Shared Libs"`. The generator emits the literal names `root`, `shared`, `<id>`.
- **Paths `.agents` and `shared/libs`** — neither exists in the frozen layout; `shared/libs` is the D-24 plural trap.
- **A workspace-level `"settings"` block** (~25 duplicated keys) and an `"extensions"` block. D-03 removes both; the workspace file stays a pure folder list.
- **Per-folder `"settings": { "files.exclude": {...} }`** on the root entry (the scaffold hid `shared` and `.agents` as duplicates). D-02 explicitly declines this dedupe and accepts the duplicate-visibility consequence.
- **Tab indentation.** The generator's `JSON.stringify(…, null, 2)` emits spaces.
- The scaffold's README *instructs the human to hand-edit this file* (step 3 of "Adding a New Homework Assignment"). That instruction is the failure D-01 makes structurally impossible.

---

### `.gitignore` (config)

**Analog (positive):** `01-RESEARCH.md` lines 718–839 — authored deliberately and validated with `git check-ignore -v` against a realistic tree.
**Analog (negative):** `origin/vl/init:.gitignore` — superseded by D-17/D-18.

**Copy the RESEARCH list verbatim.** It is ~120 lines; do not paraphrase it in the plan. The load-bearing properties to preserve in the plan action:

- **`.pio/` and `compile_commands.json` are unanchored** — verified to match at any depth (`git check-ignore -v` resolved `homeworks/m01-l03-x/.pio/env` and `homeworks/m01-l03-x/compile_commands.json` to the root `.gitignore`). No `**/` prefix.
- **No inline comments, ever.** Pitfall 5, measured: `*.pem  # certificates` does **not** ignore `secret.pem` — `git check-ignore secret.pem` exits 1 and the file stages normally. This is the failure that could put a private key in a public repository.
- **`sdkconfig.*` must be followed by `!sdkconfig.defaults`** — Pitfall 9, measured. `sdkconfig.defaults` is hand-authored input (`espidf.py:138`) and a blanket glob silently uncommits it.
- **Never a bare `.claude/` rule** — verified `git check-ignore -q .claude/skills/new-homework/SKILL.md` exits 1 (not ignored), so Phase 7's symlinked skills stay trackable.
- **`include/secrets.h`** is listed separately from `secrets.h` — nested includes do not match the bare name in every case the RESEARCH list covers.
- **`.planning/research/.cache/`** must be present. This is one of the lines that fixes a **currently-failing** criterion: `git status --porcelain` reports `?? .planning/research/.cache/` **today** (re-verified 2026-10-15). The same criterion's third live entry is closed by the exact-path rule for `.planning/state.json` — GSD's generated state file, timestamped and rewritten on every state transition, so it is ignored rather than committed, and it is named as a full path because a glob over the planning directory would swallow the tracked planning data beside it (`.planning/config.json` is committed today).
- The file opens with a header comment recording the escape hatch: a `!` negation on its **own line**, never `git add -f`.

**Must NOT copy from the scaffold** (`origin/vl/init:.gitignore`):
- **`.vscode/*` plus `!` negations.** D-18 names the generated files individually instead, so a *future* generated file is ignored by default rather than committed by accident. The scaffold's negation block also force-tracked `.vscode/launch.json`, which D-18 ignores.
- **`build/` and `build-*/`** — RESEARCH deliberately omits them (lines 843): PlatformIO's output already lives in `.pio/build/`, so a top-level `build/` only risks silently ignoring a directory someone names `build` on purpose.
- **`.pio/build/`** — redundant once `.pio/` is present.
- Missing entirely from the scaffold: `sdkconfig` handling, `.env` / `.env.*`, `.claude/worktrees/`, `.claude/agent-memory-local/`, `CLAUDE.local.md`, `.planning/research/.cache/`, `.planning/state.json`.
- Extra in the scaffold and not carried forward: `.gemini/`, `docs/superpowers/`, `*.ko`, `*.ilk`, `*.exp`, `*.su`, `*.idb`, `*.lai`, `*.app`.

> ⚠️ **`.DS_Store` is required for a currently-real failure.** `git status --porcelain` reports `?? .DS_Store` at the repo root **today**.

---

### `.editorconfig` (config)

**Analog (positive):** `01-RESEARCH.md` lines 847–880.
**Analog (negative):** `origin/vl/init:.editorconfig` — carries two inert properties.

**The whole file is ~30 lines; quote it from RESEARCH lines 847–880.** Load-bearing properties:

- **Only the nine real EditorConfig properties.** `root`, `indent_style`, `indent_size`, `tab_width`, `end_of_line`, `charset`, `spelling_language`, `trim_trailing_whitespace`, `insert_final_newline`.
- **`[*.{md,markdown}]` sets `trim_trailing_whitespace = false`** with the comment: two trailing spaces are a Markdown hard line break. This is the one place the "trim everything" rule is deliberately inverted.
- `[Makefile]` uses `indent_style = tab`.
- **`max_line_length` and `trim_final_newlines` are NOT EditorConfig properties** (Pitfall 6). The spec defines nine keys and requires plugins to ignore unknown ones, so an unknown key **fails silently by design**. The scaffold wrote both. Note the confusable pair: `insert_final_newline` **is** real; `trim_final_newlines` is not.
- Column-limit ownership: the ruler lives in `.vscode/settings.json` (`editor.rulers`), not here (D-22).

**Must NOT copy from the scaffold:** `max_line_length = 100` (in `[*]` and again in `[*.{md,markdown}]`), `trim_final_newlines = true`, and the `[*.py]` section (RESEARCH's version drops it — no Python source exists in the frozen tree).

---

### `.gitattributes` (config)

**Analog (positive):** `01-RESEARCH.md` lines 882–923.
**Analog (negative):** `origin/vl/init:.gitattributes` — same skeleton, missing three entries.

**Copy RESEARCH lines 882–923.** Two verified semantics behind it, both worth a plan comment:
- `binary` is a built-in macro that expands to `-diff -merge -text`.
- **`*.svg text` matters**: an SVG marked binary would render as `Binary files differ`, hiding exactly the drift Phase 4's generate-then-diff guard exists to surface.

**Must NOT copy from the scaffold:** the trailing `.pio/** linguist-generated=true -diff` block — `.pio/` is gitignored, so the attribute is unreachable dead config. Also missing from the scaffold and required by RESEARCH: `*.mjs text`, `*.sh text`, `*.svg text`.

Note the deliberate non-duplication: `.editorconfig` governs the **editor's** EOL, `.gitattributes` governs **what git stores and checks out**. Both are present and neither is redundant (RESEARCH line 105).

---

### `.vscode/settings.json` (config)

**Analog:** `origin/vl/init:.vscode/settings.json` — read via `git show`. Use it for **shape only**; three of its keys are superseded.

**Reusable shape** (the scaffold file, kept keys):
```json
{
  "files.eol": "\n",
  "files.insertFinalNewline": true,
  "files.trimFinalNewlines": true,
  "files.trimTrailingWhitespace": true,
  "editor.insertSpaces": true,
  "editor.tabSize": 4,
  "editor.rulers": [100],
  "editor.formatOnSave": true,
  "[c]":  { "editor.defaultFormatter": "ms-vscode.cpptools" },
  "[cpp]": { "editor.defaultFormatter": "ms-vscode.cpptools" },
  "[markdown]": { "editor.wordWrap": "on", "editor.formatOnSave": false },
  "C_Cpp.formatting": "clangFormat",
  "C_Cpp.default.cStandard": "c11",
  "C_Cpp.default.cppStandard": "c++17"
}
```

**Three keys MUST NOT be copied** — all measured against the installed `platformio.platformio-ide 3.3.4` on 2026-10-15 (D-04):

| Scaffold key | Verdict | Action |
|---|---|---|
| `platformio-ide.activateOnlyOnPlatformIOProject` | ❌ **does not exist** (removed) | delete |
| `platformio-ide.autoRebuildAutocompleteCache` | ❌ **renamed** to `autoRebuildAutocompleteIndex` | rename, or omit — it is not in any Phase 1 decision |
| `platformio-ide.activateProjectOnTextEditorChange` | ✅ exists | **add — this is the only PlatformIO IDE key D-04 keeps** |

**Two more keys must NOT be copied, per D-23:**
- `"markdown.validate.enabled": true`
- `"markdownlint.run": "onSave"`

Markdown linting is out of v1 — it is not in VERIFY-04's list, which names only clang-format, clang-tidy and cppcheck. Both keys reference an extension that will not be recommended (see next file).

**One judgment point, flagged rather than decided:** the scaffold also carried `"files.exclude": { "**/.git": true, "**/.pio": true, "**/.DS_Store": true }`. D-02's "no per-folder `files.exclude` dedupe" is about the **workspace file's** root entry, not this one — so keeping a `.pio`/`.DS_Store` explorer filter here is not obviously forbidden, but no decision authorizes it either. The planner should either omit it or state the choice explicitly. Do not silently carry it.

**Ownership boundary (D-22), worth a comment in the file:** `.editorconfig` owns text-level rules; `.clang-format` (Phase 5) alone owns C/C++ indentation and column limit; this file keeps only what editorconfig cannot express — rulers, formatters, `C_Cpp.*`, `platformio-ide.*`. The scaffold had three files carrying the same values.

---

### `.vscode/extensions.json` (config)

**Analog:** `origin/vl/init:.vscode/extensions.json`.

```json
{
  "recommendations": [
    "platformio.platformio-ide",
    "ms-vscode.cpptools-extension-pack",
    "editorconfig.editorconfig",
    "davidanson.vscode-markdownlint",
    "streetsidesoftware.vscode-markdownlint"
  ]
}
```

**One removal is forced:** `davidanson.vscode-markdownlint` — D-23 puts markdown linting out of v1, and recommending the extension while removing its settings keys is a contradiction.

Two entries have no decision behind them either way: `streetsidesoftware.code-spell-checker` and `ms-vscode.cpptools-extension-pack`. `platformio.platformio-ide` and `editorconfig.editorconfig` are both justified by D-04 and D-22 respectively.

**Assumption A2 applies here** (RESEARCH line 947): a multi-root window surfaces `extensions.recommendations` from the workspace file, and `.vscode/extensions.json` is documented for *folder-level*. D-18 commits this file anyway. If recommendations do not appear on first open, the fix (moving them into the workspace file's `extensions` key) **conflicts with D-03's "pure folder list"** and needs a decision — do not resolve it silently in Phase 1.

---

### `tools/lib/discover.mjs` (utility module, filesystem walk / transform)

**Analog:** `01-RESEARCH.md` lines 456–510 — an executed, verified implementation. **Copy it.** It is the single discovery source (ARCHITECTURE Pattern 2) that the generator, the sweep and Phase 6's CI matrix all import.

**Imports pattern** (lines 458–459):
```javascript
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
```
Node standard library only. No third-party glob, no `fs-extra`, no argument parser (RESEARCH line 124).

**The frozen contracts** (lines 461–465) — these are the values the plan must preserve *exactly*:
```javascript
export const HOMEWORKS_DIR = "homeworks";
export const ID_PATTERN = /^(?:m[0-9]{2}-l[0-9]{2}|project)-[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ID_PATTERN_TEXT = "^(?:m[0-9]{2}-l[0-9]{2}|project)-[a-z0-9]+(?:-[a-z0-9]+)*$";
```
`ID_PATTERN` is the two-branch alternation from D-05 + D-06. `ID_PATTERN_TEXT` exists so the sweep can print the expected pattern without `/`-slashes.

**The one-call contract** (Pattern 2, RESEARCH line 262):
```javascript
discoverHomeworks(repoRoot) -> { found: [{id, dir}], malformed: [name], violations: [path] }
```
One call returns everything all three consumers need, so validation can never be skipped by a consumer that only wanted the list.

**Three measured safety properties the plan must not "simplify" away:**
1. `directoriesIn()` filters `e.isDirectory()` on a `withFileTypes` entry — **false for a symlink**, which is the symlink-escape control (RESEARCH line 1079). Without it a symlink under `homeworks/` could walk the filesystem.
2. `.sort()` on every list — determinism (Pitfall 7).
3. The id regex excludes `.` and `/` by construction, so path traversal is impossible before the value is used (RESEARCH line 1070).

**`envNames` — D-16's normalization rule** (lines 505–509):
```javascript
export function envNames(id) {
  const stem = id.replaceAll("-", "");
  return { s3: `${stem}_s3`, native: `${stem}_native` };
}
```
Verified: `project-baseline` → `projectbaseline_s3` / `projectbaseline_native`.

**Grammar behaviour table — use it as the test-case source** (RESEARCH lines 514–519), quoted verbatim:
```text
true   "m01-l03-blink"          false  "m1-l3-blink"      false  "m01-l03-"       false  "project-"
true   "m01-l03-blink-led"      false  "m01-l3-blink"     false  "m01-l03"        true   "project-baseline-v2"
true   "project-baseline"       false  "M01-L03-Blink"    false  "hw01-blink"     true   "m99-l99-a"
true   "project-final-project"  false  "m01-l03-Blink"    false  "m01-l03-blink_led"
```

---

### `tools/generate-workspace.mjs` (utility CLI, transform + drift check)

**Analog:** `01-RESEARCH.md` lines 521–560 — executed; `--check` was observed to detect a hand-edit.

**Imports and root resolution** (lines 526–532):
```javascript
#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverHomeworks } from "./lib/discover.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WORKSPACE_FILE = join(REPO_ROOT, "homework.code-workspace");
```
Note `import.meta.url` → `fileURLToPath` → `dirname` → `".."`: the script resolves the repo root from **its own location**, so it works from any cwd. Copy this idiom into all three scripts.

**Core pattern** (lines 534–543) — `renderWorkspace` is an **exported pure function** (the seam the unit test asserts on):
```javascript
export function renderWorkspace(repoRoot) {
  const { found } = discoverHomeworks(repoRoot);
  const folders = [
    { name: "root",   path: "." },        // REPO-01: the repo root
    { name: "shared", path: "shared" },   // REPO-01: the shared-library tree
    ...found.map((h) => ({ name: h.id, path: h.dir })),
  ];
  return JSON.stringify({ folders }, null, 2) + "\n";
}
```

**Drift-check pattern** (lines 545–559) — exit 0 with a confirmation, exit 1 with a three-line readable remedy:
```javascript
if (check) {
  if (actual === expected) { console.log("homework.code-workspace is up to date"); process.exit(0); }
  console.error(
    "homework.code-workspace is STALE.\n" +
      "It is generated from the filesystem and must never be hand-edited.\n" +
      "Run: node tools/generate-workspace.mjs",
  );
  process.exit(1);
}
```
Measured: two runs produced a byte-identical file (`diff` empty); replacing the file with `{"folders": []}` made `--check` exit 1 with `homework.code-workspace is STALE.`

**Design note the plan should record** (RESEARCH line 254): prefer `--check` over `git diff --exit-code`. Both catch drift, but `--check` works outside a git checkout, does not depend on the file being tracked, and prints the rule and the remedy instead of a raw diff.

---

### `tools/sweep-homeworks.mjs` (utility CLI, batch + subprocess orchestration)

**Analog (positive):** `01-RESEARCH.md` lines 576–650 — all four failure modes verified with observed output.
**Analog (negative):** `origin/vl/init:scripts/pio-build.sh` — **the file D-13 and success criterion 4 exist to prevent.**

**The negative analog, verbatim** (`git show origin/vl/init:scripts/pio-build.sh`):
```sh
#!/bin/sh
set -u

fail=0
found=0

for ini in hw-*/platformio.ini; do
    [ -e "$ini" ] || continue
    found=1
    dir=$(dirname "$ini")
    echo "--- pio run in $dir"
    pio run -d "$dir" || fail=1
done

if [ "$found" -eq 0 ]; then
    echo "No homework projects yet - nothing to build."
fi

exit "$fail"
```
**Why it is wrong, and what the plan must show:**
- **Line 17–19 is the bug.** The zero-match path prints a *reassuring* message and falls through to `exit "$fail"` — which is `exit 0`. Pitfall 2 / Pitfall 11 exactly: a gate that built nothing exits green. Reproduced by measurement (`/bin/sh` leaves an unmatched glob literal, and the `[ -e ]` guard then skips it). Compare the required behaviour: exit 1 with three readable lines.
- **Line 8's glob `hw-*/platformio.ini`** is both the wrong path (`hw-*` at the repo root — the flat layout the provenance audit rejected) and shell-dependent: under **zsh**, `for f in homeworks/*/platformio.ini` prints `zsh:1: no matches found: homeworks/*/platformio.ini` and exits 1 — failing for the wrong reason, naming no rule.
- **`pio` on line 13 is a bare command.** `pio` is **not on PATH** on this machine (re-verified 2026-10-15: `command -v pio` → nothing). Pitfall 3, measured: `spawnSync("pio", …, {stdio:"inherit"})` prints *only* the `--- pio run -d …` line and exits 1, with no error text at all.

**Copy the positive analog instead** (RESEARCH lines 578–650). The structure the plan must preserve:

1. **Depth rule named as a rule** (lines 594–602) — `DEPTH RULE VIOLATED` plus the *reason*, before anything is built. Pattern 3: the tool's own error is `PackageException: Can not create a symbolic link for ../../shared/lib/foo, not a directory` — accurate but pointed at the dependency, not the rule.
2. **Id grammar** (lines 604–610) — `MALFORMED HOMEWORK ID` + `Expected: ${ID_PATTERN_TEXT}` + the offending folder. Then `if (failed) process.exit(1);` **before** any zero-match or build logic.
3. **Zero matches is a failure** (lines 613–620), D-13's exact three lines:
   ```javascript
   console.error("sweep: found ZERO homework projects under homeworks/*/platformio.ini");
   console.error("A gate that built nothing must not exit 0.");
   console.error("Pass --allow-empty only if an empty tree is genuinely expected.");
   process.exit(1);
   ```
   `--allow-empty` is the **single named escape hatch**: `console.log("sweep: no homework projects found (--allow-empty)"); process.exit(0);`
4. **`--list`** (line 622) — `for (const h of found) console.log(h.id); process.exit(0);` This is what Phase 6's CI matrix consumes. It exits **after** validation and the zero-match check, so a consumer can never get an unvalidated id.
5. **Explicit `pio` resolution** (lines 624–638) — the fix for Pitfall 3:
   ```javascript
   function resolvePio() {
     if (process.env.PLATFORMIO_CORE) return process.env.PLATFORMIO_CORE;
     const local = join(process.env.HOME ?? "", ".platformio", "penv", "bin", "pio");
     if (existsSync(local)) return local;
     const onPath = spawnSync("pio", ["--version"], { stdio: "ignore" });
     return onPath.error ? null : "pio";
   }
   ```
   On failure, print the absolute path **and the export line**: `export PLATFORMIO_CORE=$HOME/.platformio/penv/bin/pio`.
6. **The loop, and the `r.error` / `r.status` split** (lines 640–649) — PlatformIO has no recursive command (`pio run` accepts only `-e/-t/-d/-c`, verified from `pio run --help`), so the loop **accumulates** failures and never stops early:
   ```javascript
   const r = spawnSync(pio, ["run", "-d", h.dir], { cwd: REPO_ROOT, stdio: "inherit" });
   if (r.error) { console.error(`failed to start ${pio}: ${r.error.message}`); exitCode = 1; }
   else if (r.status !== 0) exitCode = 1;
   ```
   The `r.error` branch is the one that distinguishes a **spawn failure** from a **build failure** — without it, Pitfall 3 is silent. `spawnSync` with an argument array means no shell, so no word-splitting or command injection (RESEARCH line 1081).

**All four exit-1 paths, with observed output** (RESEARCH lines 654–677) — these are the assertions the integration tests should make:
```text
$ node tools/sweep-homeworks.mjs                       # zero matches          → exit 1
$ node tools/sweep-homeworks.mjs --allow-empty                                → exit 0
$ node tools/sweep-homeworks.mjs                       # deeper platformio.ini → exit 1, "DEPTH RULE VIOLATED"
$ node tools/sweep-homeworks.mjs                       # folder `hw01-Blink`   → exit 1, "MALFORMED HOMEWORK ID"
$ node tools/sweep-homeworks.mjs --list                #                       → exit 0, prints `project-baseline`
```

**Open question 1 (RESEARCH line 956), unresolved by design:** keep `--list` and the build loop in one script, or split. D-09 says one *folder*, not one file. Recommendation recorded: keep one script while it shares the zero-match and validation logic; if it passes ~150 lines, split at the already-existing `discover.mjs` seam. **The planner should pick one and state it** — do not leave it implicit.

---

### `tools/tests/*.test.mjs` and `tools/tests/helpers.mjs` (tests, unit + integration)

**No codebase analog.** The framework pattern comes from `01-RESEARCH.md` § Validation Architecture, lines 1002–1057.

**Framework:** `node:test` with `node:assert/strict`. Built into Node v26.7.0 — **no install, no config file, no `package.json`.** The package legitimacy audit (RESEARCH lines 153–164) is deliberately empty and stays empty: do not add a `package.json` to get a test runner (line 1055).

**Runner command — the quoting is mandatory** (Pitfall 10, lines 1012–1022):
```text
$ node --test "tools/**/*.test.mjs"     →  ℹ tests 2   ℹ pass 2      exit 0   ✅ use this
$ node --test tools/tests/discover.test.mjs →  ℹ pass 2             exit 0   ✅ works
$ node --test tools/                    →  Error: Cannot find module '.../tools'  exit 1  ❌
$ node --test                           →  walks the tree; ran a test found in
                                           homeworks/project-baseline/visible/     ❌ scope grows silently
```
Quote the glob, or zsh expands it (and **errors** if it matches nothing). `node --test <dir>` is not a directory scan — measured `MODULE_NOT_FOUND`.

**Four files, from the Wave 0 gap list** (lines 1049–1057):
- `discover.test.mjs` — the accept/reject table from RESEARCH lines 514–519, `findDepthViolations`, `envNames`
- `generate-workspace.test.mjs` — determinism (render twice, compare strings), sorted order, the exact folder set, `--check` both ways
- `sweep.test.mjs` — zero-match exit 1, `--allow-empty` exit 0, malformed-id message, depth-violation message
- `helpers.mjs` — **a throwaway fixture tree under `os.tmpdir()`; all three test files need it**

**Critical caution for the planner** (RESEARCH line 1057): the sweep tests must **never** run against the repository root, or they will build the real baseline and dirty `.pio/`. Every test that executes the sweep builds its own temp tree.

**Measured baseline:** `duration_ms 34` for two tests — there is no reason to run the suite less often than per task commit (line 1043).

---

### `shared/lib/README.md` (doc)

**Analog (negative):** `origin/vl/init:shared/libs/README.md`. Read it to know **what to leave out**; almost none of its substance survives.

**Why it is mostly a negative analog:**
- **The entire "Consuming Shared Libraries" section documents `lib_extra_dirs`** — the approach AGENTS.md forbids ("Deprecated since version 6.0 … will be removed in the next major release"). The frozen mechanism is `lib_deps = <Name>=symlink://../../shared/lib/<Name>`. Do not carry a single line of that section.
- **The path is `shared/libs/`** — the D-24 plural trap.
- **It links `../../.agents/rules/shared-libs.md` and `../../.agents/rules/testing-contracts.md`** — `.agents/` does not exist in the frozen tree and Phase 7 owns agent rules. A Phase 1 file must not link to a nonexistent path (Phase 6's CI adds a link checker — RESEARCH line 1095 / the scaffold's `lychee` hook).
- **It documents a `PascalCase` per-library folder layout with `library.json`, `CHANGELOG.md`, `examples/`.** Phase 3 owns the library contract; D-11 scopes this file to "tracking the folder so git can commit it".

**What is reusable:** only the framing — a short statement of what the folder is for, and that the binding rules live elsewhere. **D-11's requirement is existence**, and RESEARCH assumption A5 (line 950) rates its body as low-risk. This file is also the only in-tree statement of the frozen naming until Phase 3 fills the folder.

---

### `homeworks/project-baseline/platformio.ini` (config, build)

**Analog:** `01-RESEARCH.md` lines 681–694 — the env set measured working in `/tmp/repo-probe` (build `[SUCCESS] Took 2.81 seconds`). *(The `/tmp/pio-n16r8-probe` project is a measurement, not a tracked analog — do not cite it as a source to copy from; `/tmp` is outside the repo.)*

```ini
[env:projectbaseline_s3]
platform = espressif32@7.1.3
board = esp32-s3-devkitc-1
framework = arduino
board_upload.flash_size = 16MB
board_build.partitions = default_16MB.csv
board_build.arduino.memory_type = qio_opi
build_flags = -DBOARD_HAS_PSRAM
monitor_speed = 115200
```

**Everything here is load-bearing:**
- `esp32-s3-devkitc-1` with **no overrides** is the N8/no-PSRAM manifest — the four override lines are what retarget it to N16R8 (AGENTS.md "What NOT to Use").
- `board_build.arduino.memory_type = qio_opi` selects which **prebuilt core library set** is linked — a wrong value is not cosmetic. Verified: the linked IDF lib is `tools/sdk/esp32s3/**qio_opi**/libesp_hw_support.a`.
- `default_16MB.csv`, never `default_4MB.csv` (which is not shipped in the pinned core). Verified: app partition `6,553,600` bytes = `0x640000`, vs `0x330000` on `default_8MB.csv`.
- `monitor_speed = 115200` — the default is 9600 and the UART bridge prints garbage at it.
- **Deliberately absent: `upload_port` / `monitor_port`** (D-12). `pio device list` shows no usable port on this machine, and the repository is public — a committed port would be a guess or a build-breaker elsewhere.
- **`platform = espressif32@7.1.3` is an exact pin.** Never a range, never `#develop` — the project constraint.

> ⚠️ **Gap the planner must resolve.** D-16 fixes the normalization rule for **both** envs (`projectbaseline_s3` *and* `projectbaseline_native`), and VERIFY-01's intent is "one source tree, two environments". The RESEARCH skeleton shows **only the `_s3` env**. `envNames()` returns both. Either the ini gains a `[env:projectbaseline_native]` block or the plan states why Phase 1 ships one env. Do not leave this implicit — it is the difference between D-16 being implemented and D-16 being merely documented.

> ⚠️ Also relevant: RESEARCH line 281 — `pio run -d` on a directory whose `platformio.ini` has no `[env:` section fails with `ProjectEnvsNotAvailableError` (exit 1). Never create a root or `shared/` `platformio.ini`.

---

### `homeworks/project-baseline/src/main.cpp` (source, boot-time output)

**Analog:** `01-RESEARCH.md` lines 696–705 — compiled in the measured build.

```cpp
#include <Arduino.h>
void setup() {
  Serial.begin(115200);
  Serial.printf("flash=%u psram=%d psramSize=%u\n", (unsigned)ESP.getFlashChipSize(),
                (int)psramFound(), (unsigned)ESP.getPsramSize());
}
void loop() {}
```

**Why exactly this and nothing more (D-14):**
- **It touches no GPIO.** A blink was rejected because the RGB-LED GPIO is *unverified* (GPIO48 on the initial revision vs GPIO38), and committing `pinMode(48)` is precisely the "invent an unverified pin" failure AGENT-05 forbids.
- It reports exactly what **Phase 2's acceptance criterion 2** needs — `psramFound()` over the monitor — so it doubles as Phase 2's acceptance vehicle without adding a single unverified board fact.
- `Serial.begin(115200)` must match the ini's `monitor_speed = 115200`.

---

### `homeworks/project-baseline/README.md` (doc)

**No analog.** D-15: a short file saying what it is and that it is **not a course homework**. It exists because the folder will appear in the Phase 8 index and would otherwise read as an unfinished assignment. This is **not** the DELIV-01 contract — Phase 8 owns that. Keep it to a few lines.

---

### `README.md` — root (doc, MODIFY)

**Analog:** `origin/vl/init:README.md` — a full-length README for this same repository. Use it for **section skeleton only**; every convention in it is superseded.

**Reusable section skeleton:** title → one-paragraph what-this-is → Repository Structure (tree) → Prerequisites (table) → "These tools are installed but not on `PATH`" → Getting Started with VS Code → Common Commands → Conventions → License.

**The "not on PATH" section is the single most reusable part** — it explains exactly the trap the tool layer guards against (Pitfall 3), and its `export PATH="$HOME/.platformio/penv/bin:$PATH"` line is the same remedy the sweep's error message prints.

**Must NOT carry (every one of these contradicts a frozen decision):**
- The `hw-XX-name/` layout and the tree showing `shared/libs/` — the frozen layout is `homeworks/<id>/` (D-05) and `shared/lib/` (D-24).
- The `lib_extra_dirs` / `[env]` recipe in "Adding a New Homework Assignment" — AGENTS.md forbids it.
- `pio run -e esp32s3` / `-e native` — D-16 makes env names project-scoped (`projectbaseline_s3`).
- The `scripts/` folder, `.agents/`, `.claude/rules/`, `.markdownlint*`, `.pre-commit-config.yaml`, `.github/workflows/` — **none of these exists in Phase 1.** Documenting them is documenting a tree that isn't there. Phase 4/5/6/7 own their own README updates.
- `.clang-format` in the tree — Phase 5 (D-21).

**Required by D-26 and RESEARCH open question 4 (line 974):** the README must
1. say what the repository is,
2. **name `homework.code-workspace` and how to open it** — this is the reason the task is Phase 1's: without a mention, nobody will know the file exists,
3. give the one-command build (`pio run -d homeworks/<id>`),
4. say where the conventions live (AGENTS.md),
5. **state the homework definition in one sentence** — RESEARCH Pitfall 8 / line 974: *a homework is a directory directly under `homeworks/` whose name matches the id grammar and which contains a `platformio.ini`.* Phase 7's scaffolding skill and a human reader both need it, and it costs one line.
6. **not** add a homework index table — that is DELIV-02, Phase 8.

---

### `AGENTS.md` (doc, MODIFY — D-24)

**No analog — this is a direct string correction.** Two live traps, verified in the working tree on 2026-10-15:

| Line | Current (wrong) | Correct |
|---|---|---|
| `AGENTS.md:45` | ``Shared modules under `shared/libs/<Module>/` `` … `` `lib_deps = <Name>=symlink://../../shared/libs/<Name>` `` | `shared/lib/<module>/` and `…/shared/lib/<Name>` |
| `AGENTS.md:107` | `` `lib_deps = <Name>=symlink://../../shared/libs/<Name>` `` | `…/shared/lib/<Name>` |

Line 173 also contains the string `shared/libs` but only inside the prose phrase "the `lib_extra_dirs`/`globallib_dir` deprecations" — **it is not a path and needs no change.** The plan should name lines 45 and 107 specifically rather than a blind `sed` over the file.

**Why it must be this phase:** agents read `AGENTS.md` every session, so the trap is live, and Phase 3 could create the wrong folder on the strength of it. **Known risk (D-24):** `AGENTS.md` is GSD-generated and a regeneration may revert the fix — worst case returns to the current state, not worse. Note it in the commit body so a future revert is diagnosable.

**Boundary:** `ARCHITECTURE.md` and the other `.planning/research/*.md` files are **left untouched** as dated evidence — they deliberately keep contradictions visible, and editing them retroactively erases what was established on 2026-10-15.

---

### `.planning/PROJECT.md` (doc, MODIFY — D-24 + D-25)

**No analog — direct corrections plus one new section.**

**Corrections** (verified in the working tree 2026-10-15) — REQUIREMENTS.md says `shared/lib/`; PROJECT.md says `shared/`:
- `PROJECT.md:24` — `` `shared/` holds reusable modules as real PlatformIO libraries … `` → `shared/lib/`
- `PROJECT.md:26` — `` Pure logic in `shared/` is unit-tested on the host … `` → `shared/lib/`

*(Reference, unmodified: `REQUIREMENTS.md:26,27,29` already use the correct `shared/lib/`. `REQUIREMENTS.md:20` uses `shared/hardware/`, which is a different folder and not in scope.)*

**New section (D-25):** a **Traps** section listing what later phases must see live. Rationale the plan should record: PROJECT.md is read by every phase's `load_prior_context`, evolves at transitions, and is a project-level document — so **one edit covers all eight phases**, whereas `01-CONTEXT.md` reaches only this phase's planner and a standalone `TRAPS.md` would be read by no workflow at all. Minimum content: the `shared/lib` vs `shared/libs` trap, and the Phase 8 baseline-retirement obligation (D-10).

---

## Shared Patterns

### Node ES module conventions — apply to all four `tools/*.mjs` scripts
**Source:** `01-RESEARCH.md` lines 526–532 (and identically in the sweep, 579–586).
```javascript
#!/usr/bin/env node
import { ... } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverHomeworks } from "./lib/discover.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
```
Node standard library only — no `package.json`, no third-party dependency (RESEARCH lines 137–141). The `import.meta.url` → `".."` root resolution appears in both generators; copy it rather than hardcoding a cwd.

### Named-rule failure over tool-native error (ARCHITECTURE Pattern 3)
**Source:** `01-RESEARCH.md` lines 264–270. **Applies to:** the sweep's depth check, the sweep's id check, and the generator's `--check`.
**Rule:** never delegate a policy failure to a downstream tool's error message. Measured counter-example: the tool's own depth error is `PackageException: Can not create a symbolic link for ../../shared/lib/foo, not a directory` — accurate, but it points at the dependency instead of the rule that was broken. The repo-owned message names the rule, the reason, and the remedy.

### Fail loudly on zero matches (Pitfall 11)
**Source:** `01-RESEARCH.md` lines 272–276; D-13. **Applies to:** the sweep.
Zero discovered projects is exit 1 with a readable message. `--allow-empty` is the **one** named escape hatch — same philosophy as D6's `SKIP=<hook-id>`, never `--no-verify`. Phase 6's CI never passes the flag.

### Generate → drift check (ARCHITECTURE Pattern 3)
**Source:** `01-RESEARCH.md` lines 241–254. **Applies to:** `homework.code-workspace` in this phase; `docs/*` from Phase 4.
The generator writes; `--check` compares on-disk bytes to freshly rendered bytes and exits 1 naming the file and the fix. Requires determinism: sort, fixed key order, `JSON.stringify(…, null, 2)`, one trailing `\n`, LF, **no comments**.

### Git is the oracle for ignore semantics
**Source:** `01-RESEARCH.md` line 103. **Applies to:** every `.gitignore` / `.gitattributes` verification step in this phase, and Phase 6's CI check.
Never hand-implement or eyeball matching. Assert with `git status --porcelain` (the clean-tree criterion) and diagnose with `git check-ignore -v`. Two real defects were found only this way: Pitfall 5's trailing comment and Pitfall 9's `sdkconfig.*`.

### Exact version pins, never ranges
**Source:** AGENTS.md project constraint. **Applies to:** `platform = espressif32@7.1.3` in the baseline ini, and every tool version the plan writes down (Node v26.7.0, PlatformIO Core 6.2.0, git 2.50.1, `mirrors-clang-format @ v23.1.3` where referenced).

### One canonical source per generated artifact
**Source:** D-01; CONTEXT.md Integration Points. `homework.code-workspace` ↔ `homeworks/*/platformio.ini` ↔ the sweep: **one folder list, one discovery glob, one id validator.** All three must go through `discoverHomeworks()`; a consumer that re-implements discovery is how the workspace file ends up listing fewer homeworks than the tree contains (Pitfall 8's warning sign).

### Id validation before use (V5 Input Validation — this phase's one real security control)
**Source:** `01-RESEARCH.md` lines 1070, 1078. **Applies to:** every place a discovered folder name becomes a path.
The regex is applied **before** the value is interpolated into `homeworks/<id>` or passed to a child process. The character class excludes `.` and `/`, so traversal is impossible by construction; symlinks are never followed (`withFileTypes` + `isDirectory()` — false for a symlink); no shell is involved (`spawnSync` with an argument array).

### The public-repository secret rule
**Source:** D-19, Pitfall 5. **Applies to:** the `.gitignore` secret block.
The secret patterns land now, before any code exists, because a credential in public git history is the one irreversible failure here. **Comments go on their own line** — a trailing `#` makes the pattern a literal string that matches nothing. Phase 6 owns gitleaks/detect-secrets; no `.secrets.baseline` is committed yet.

---

## No Analog Found

Files with no close match in the codebase or in the scaffold. The planner should build these from `01-RESEARCH.md` and the decisions, not from an existing file.

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `tools/tests/discover.test.mjs` | test | unit | No test file exists anywhere; `node:test` is built in and the framework shape is RESEARCH lines 1002–1057 |
| `tools/tests/generate-workspace.test.mjs` | test | unit + integration | same |
| `tools/tests/sweep.test.mjs` | test | integration (tmp fixtures) | same |
| `tools/tests/helpers.mjs` | test helper | fixture builder | same — the fixture tree under `os.tmpdir()` is described but not implemented in RESEARCH |
| `homeworks/project-baseline/README.md` | doc | n/a | New artifact type; D-15 defines its content directly |
| `AGENTS.md` (modification) | doc | n/a | A two-line string correction at known line numbers; no analog is meaningful |
| `.planning/PROJECT.md` (modification) | doc | n/a | Corrections at known line numbers plus a new section D-25 specifies |

*(7 rows: the four test files, the baseline README, and the two doc modifications. The two doc edits are edits to existing files rather than new artifacts, but they are counted here because neither has an analog to copy from.)*

---

## Metadata

**Analog search scope:**
- Working tree at HEAD (`repo/init`) — full tracked list read: only `.planning/**`, `AGENTS.md`, `LICENSE`, `README.md`. Confirmed there is no `tools/`, `homeworks/`, `shared/`, `.gitignore`, `.vscode/`, or any `platformio.ini`.
- `origin/vl/init` — the abandoned scaffold, 29 files, read via `git ls-tree -r --name-only origin/vl/init` and `git show origin/vl/init:<path>`. Read in full: `scripts/pio-build.sh`, `homework.code-workspace`, `.gitignore`, `.editorconfig`, `.gitattributes`, `.vscode/settings.json`, `.vscode/extensions.json`, `shared/libs/README.md`, `README.md`, `.pre-commit-config.yaml`. **(Not the literal ref `vl/init` — that does not resolve; see Correction 1.)**
- `01-RESEARCH.md`, all 1136 lines — the executed-skeleton analog source.
- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md` — for the D-24 trap line numbers.

**Files scanned:** 15 in the scaffold + 1 current README + 2 planning docs + the full RESEARCH document.
**Pattern extraction date:** 2026-10-15
**Tracked-source gate:** verified. All nine scaffold analogs return a non-empty `git ls-tree -r --name-only origin/vl/init -- <path>`, i.e. they are committed source on that ref, not gitignored install/runtime mirrors. They are **branch-scoped**, so every plan action must reach them through `git show origin/vl/init:<path>`.
