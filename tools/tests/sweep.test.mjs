// The sweep's exit-path contract, driven against throwaway fixture trees.
//
// No test may point the sweep at the repository root: doing so would discover the
// real baseline, build it, and create `.pio/` inside the repository in the act of
// testing the rule that says the tree stays clean. Every fixture is built under
// `os.tmpdir()` by `helpers.mjs`, and the sweep is given an explicit `--root`.
//
// This is the RED half of the cycle: the sweep is still the interface placeholder,
// so each test below fails on the behaviour it asserts. The exit paths this file
// does not yet cover — a sorted two-project list, the policy short-circuit, an
// unstartable PlatformIO binary and a failing build — are added with the shared
// fixture builders once the gate exists.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { cleanupAll, makeHomework, makeTree } from "./helpers.mjs";

test.after(cleanupAll);

// Read-only: the sweep runs from its own checkout and is told which tree to scan,
// so nothing under the repository is ever discovered or built by a test.
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SWEEP = join(REPO_ROOT, "tools", "sweep-homeworks.mjs");

/** Spawn the sweep against a fixture root and return its status, stdout and stderr. */
function sweep(root, args = []) {
  return spawnSync(process.execPath, [SWEEP, "--root", root, ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
}

/** An empty `homeworks/` directory, the tree an empty repository presents. */
function emptyTree() {
  const root = makeTree();
  mkdirSync(join(root, "homeworks"), { recursive: true });
  return root;
}

test("--list prints the discovered id and exits 0", () => {
  const root = makeTree();
  makeHomework(root, "project-baseline");

  const result = sweep(root, ["--list"]);

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.stdout.trim().split("\n"), ["project-baseline"]);
});

test("a tree with no homework projects exits 1 and says zero were found", () => {
  const result = sweep(emptyTree());

  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /ZERO homework projects/);
});

test("--allow-empty is the single escape hatch and exits 0", () => {
  const result = sweep(emptyTree(), ["--allow-empty"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim().split("\n").length, 1);
});

test("a platformio.ini below a homework folder exits 1 naming the depth rule", () => {
  const root = makeTree();
  makeHomework(root, "m01-l03-x");
  const deeper = join(root, "homeworks", "m01-l03-x", "deeper");
  mkdirSync(deeper, { recursive: true });
  writeFileSync(join(deeper, "platformio.ini"), "[env:fixture]\nplatform = native\n");

  const result = sweep(root);

  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /DEPTH RULE VIOLATED/);
});

test("a folder name outside the frozen grammar exits 1 with the expected pattern", () => {
  const root = makeTree();
  makeHomework(root, "hw01-Blink");

  const result = sweep(root);

  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /MALFORMED HOMEWORK ID/);
  assert.match(result.stderr, /Expected: \^/);
});
