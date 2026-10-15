// The sweep's exit-path contract, driven against throwaway fixture trees.
//
// No test may point the sweep at the repository root: doing so would discover the
// real baseline, build it, and create `.pio/` inside the repository in the act of
// testing the rule that says the tree stays clean. Every fixture is built under
// `os.tmpdir()` by `helpers.mjs`, and the sweep is given an explicit `--root`
// except where the default itself is what is under test.
//
// The expected id pattern is imported from the discovery module rather than
// retyped, so this file cannot disagree with the grammar the sweep enforces.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { ID_PATTERN_TEXT } from "../lib/discover.mjs";
import {
  cleanupAll,
  makeDepthViolation,
  makeHomework,
  makeTree,
  runSweep,
  SWEEP_PATH,
  writeFileAt,
} from "./helpers.mjs";

test.after(cleanupAll);

// A path that cannot resolve, used to make an unstartable-PlatformIO failure
// happen on demand. It is deliberately not a directory that exists.
const BOGUS_PIO = join("nonexistent", "pio");

/** An empty `homeworks/` directory — the tree an empty repository presents. */
function emptyTree() {
  const root = makeTree();
  mkdirSync(join(root, "homeworks"), { recursive: true });
  return root;
}

test("--list prints exactly the id of a fixture's one valid project and exits 0", () => {
  const root = makeTree();
  makeHomework(root, "project-baseline");

  const result = runSweep(root, ["--list"]);

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.stdout.trim().split("\n"), ["project-baseline"]);
});

test("--list output is sorted regardless of the order the projects were created in", () => {
  const root = makeTree();
  // Created in an order that is deliberately not the sorted one.
  makeHomework(root, "project-zzz");
  makeHomework(root, "m02-l01-alpha");

  const result = runSweep(root, ["--list"]);

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.stdout.trim().split("\n"), ["m02-l01-alpha", "project-zzz"]);
});

test("a tree with no homework projects exits 1 and says zero were found", () => {
  const result = runSweep(emptyTree());

  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /ZERO homework projects/);
});

test("--allow-empty is the single escape hatch: it exits 0 and prints one line", () => {
  const result = runSweep(emptyTree(), ["--allow-empty"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim().split("\n").length, 1);
});

test("a platformio.ini below a homework folder exits 1 naming the rule, before any build", () => {
  const root = makeTree();
  makeHomework(root, "m01-l03-x");
  makeDepthViolation(root, "m01-l03-x");

  // The override cannot resolve, so a build stage that was reached would announce
  // itself with the spawn-failure message. Its absence is a fact about control
  // flow, not about the current wording: the policy check short-circuited.
  const result = runSweep(root, [], { PLATFORMIO_CORE: BOGUS_PIO });

  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /DEPTH RULE VIOLATED/);
  assert.match(result.stderr, /homeworks\/m01-l03-x\/deeper/);
  assert.doesNotMatch(result.stderr, /failed to start/);
});

test("a folder name outside the frozen grammar exits 1 with the expected pattern", () => {
  const root = makeTree();
  makeHomework(root, "hw01-Blink");

  const result = runSweep(root);

  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /MALFORMED HOMEWORK ID/);
  // Literal containment, not a pattern: the constant is the printable *spelling* of
  // the grammar, so interpolating it into a RegExp would assert a different language.
  assert.ok(result.stderr.includes(`Expected: ${ID_PATTERN_TEXT}`), result.stderr);
  assert.match(result.stderr, /homeworks\/hw01-Blink\//);
});

test("an unstartable PlatformIO binary exits 1 with a spawn failure, not a build failure", () => {
  const root = makeTree();
  makeHomework(root, "project-baseline");

  const result = runSweep(root, [], { PLATFORMIO_CORE: BOGUS_PIO });

  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /failed to start/);
  assert.match(result.stderr, /nonexistent/);
  assert.match(result.stderr, /1 project\(s\) checked; at least one failed/);
});

test("a project that fails to build is reported, not swallowed", () => {
  const root = makeTree();
  makeHomework(root, "m01-l03-x");
  // A valid id and a real platformio.ini, but no [env:] section, so PlatformIO
  // itself enumerates nothing and exits non-zero. This is the one case where the
  // binary starts and the project is what fails.
  writeFileAt(root, "homeworks/m01-l03-x/platformio.ini", "[platformio]\n");

  const result = runSweep(root);

  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /1 project\(s\) checked; at least one failed/);
  assert.doesNotMatch(result.stderr, /failed to start/);
});

test("the scanned root defaults to the repository, never the process working directory", () => {
  // Run from a fixture that carries no homeworks/ at all. If the default were the
  // working directory, the sweep would find nothing and take the zero-match path.
  const elsewhere = makeTree();

  const result = spawnSync(process.execPath, [SWEEP_PATH, "--list"], {
    cwd: elsewhere,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.stdout.trim().split("\n"), ["project-baseline"]);
});
