#!/usr/bin/env node
// The repo-wide gate: discover every homework, validate it, enforce the one-level
// depth rule by name, and build each project from the scanned root.
//
// PlatformIO has no recursive command — `pio run` accepts only `-e/-t/-d/-c` — so a
// repo-wide build is necessarily an external loop that accumulates failures rather
// than stopping at the first.
//
// Discovery, the id grammar and the depth walk are imported from `./lib/discover.mjs`
// and never re-implemented here: one discovery source means the generator, this
// sweep and (from Phase 6) the CI matrix cannot disagree about what a homework is.
//
// Flags — the whole surface, nothing else:
//   --list          print the validated ids, one per line, and exit 0.
//                   This is the contract Phase 6's CI matrix consumes, so it exits
//                   only AFTER validation and AFTER the zero-match check: no consumer
//                   can obtain an unvalidated or empty id list.
//   --allow-empty   the single named escape hatch for an intentionally empty tree.
//                   The failure path is the default; the override has to be asked for.
//   --root <dir>    scan <dir> instead of the repository. It exists for the tests,
//                   which must never point the sweep at the repository root — that
//                   would build the real baseline and dirty `.pio/` in the act of
//                   testing the rule that says the tree stays clean — and for
//                   inspecting a tree other than the repository's own. The default
//                   is the repository root derived from this script's own location,
//                   never the process working directory.
//
// A policy failure (depth or id) is a pure filesystem inspection that runs before any
// build and exits non-zero immediately, so a violating tree can never reach the build
// stage and be reported through a dependency error that names the wrong thing.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverHomeworks, ID_PATTERN_TEXT } from "./lib/discover.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const argv = process.argv.slice(2);
const listOnly = argv.includes("--list");
const allowEmpty = argv.includes("--allow-empty");

/** The scanned root: `--root <dir>` when given, otherwise the repository itself. */
function scannedRoot() {
  const at = argv.indexOf("--root");
  if (at === -1) return REPO_ROOT;
  const value = argv[at + 1];
  if (value === undefined || value.startsWith("--")) {
    console.error("--root needs a directory: --root <dir>");
    process.exit(2);
  }
  return resolve(value);
}

const root = scannedRoot();
const { found, malformed, violations } = discoverHomeworks(root);

let failed = false;

// 1. The depth rule first, named as a rule rather than delegated to the tool's own
//    error. PlatformIO's message is accurate -- "Can not create a symbolic link for
//    ../../shared/lib/foo, not a directory" -- but it points at the dependency, not
//    at the rule that was broken (D-07).
if (violations.length > 0) {
  failed = true;
  console.error("DEPTH RULE VIOLATED");
  console.error("Every homework must sit exactly one level below homeworks/.");
  console.error("Reason: every shared-library path in lib_deps is relative to the project,");
  console.error("so symlink://../../shared/lib/<name> cannot resolve from a deeper folder.");
  for (const violation of violations) {
    console.error(`  deeper platformio.ini found: ${violation}`);
  }
}

// 2. The id grammar second (D-05/D-06/D-08). The expected pattern is quoted from the
//    discovery module rather than retyped, so the rule and its message cannot drift.
if (malformed.length > 0) {
  failed = true;
  console.error("MALFORMED HOMEWORK ID");
  console.error(`Expected: ${ID_PATTERN_TEXT}`);
  for (const name of malformed) console.error(`  does not match: homeworks/${name}/`);
}

// 3. A policy failure short-circuits: no zero-match logic and no build may run after
//    one was found.
if (failed) process.exit(1);

// 4. Zero matches is a failure, not a success (D-13, Pitfall 11). A gate that built
//    nothing must never exit 0.
if (found.length === 0) {
  if (allowEmpty) {
    console.log("sweep: no homework projects found (--allow-empty)");
    process.exit(0);
  }
  console.error("sweep: found ZERO homework projects under homeworks/*/platformio.ini");
  console.error("A gate that built nothing must not exit 0.");
  console.error("Pass --allow-empty only if an empty tree is genuinely expected.");
  process.exit(1);
}

// 5. The list contract exits here, after validation and after the zero-match check.
if (listOnly) {
  for (const homework of found) console.log(homework.id);
  process.exit(0);
}

// 6. Resolve PlatformIO before the loop. `pio` is installed but is NOT on the
//    interactive PATH on this machine, and a spawnSync against a missing binary
//    reports the failure on a channel separate from the child's stderr -- so the
//    error branch below is the only thing that makes the failure audible.
function resolvePio() {
  if (process.env.PLATFORMIO_CORE) return process.env.PLATFORMIO_CORE;
  const home = process.env.HOME;
  if (home) {
    const local = join(home, ".platformio", "penv", "bin", "pio");
    if (existsSync(local)) return local;
  }
  const onPath = spawnSync("pio", ["--version"], { stdio: "ignore" });
  return onPath.error ? null : "pio";
}

const pio = resolvePio();
if (!pio) {
  console.error("PlatformIO Core was not found.");
  console.error("Install it, or point at it explicitly:");
  console.error("  export PLATFORMIO_CORE=$HOME/.platformio/penv/bin/pio");
  process.exit(1);
}

// 7. The loop. An argument array and no shell, so nothing is word-split or
//    re-interpreted and a discovered path can never be read as a command. The spawn
//    error is branched on separately from the child's exit status, and the loop never
//    stops early: a failure on one project must not hide a failure on the next.
let exitCode = 0;
for (const homework of found) {
  console.log(`--- ${pio} run -d ${homework.dir}`);
  const result = spawnSync(pio, ["run", "-d", homework.dir], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.error) {
    console.error(`failed to start ${pio}: ${result.error.message}`);
    exitCode = 1;
  } else if (result.status !== 0) {
    exitCode = 1;
  }
}

if (exitCode !== 0) {
  console.error(`sweep: ${found.length} project(s) checked; at least one failed`);
}
process.exit(exitCode);
