// The workspace-renderer contract: a pure function of the tree, plus its drift check.
//
// Every fixture is built under `os.tmpdir()` by `helpers.mjs`. The `--check`
// assertions spawn the CLI from a fixture that carries its own copy of the tool
// tree, so the real `homework.code-workspace` is never read or written here.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { renderWorkspace } from "../generate-workspace.mjs";
import { cleanupAll, installTools, makeHomework, makeTree, writeFileAt } from "./helpers.mjs";

test.after(cleanupAll);

/** Spawn the generator's CLI from inside a fixture that carries a copy of it. */
function runGenerator(root, args = []) {
  return spawnSync(process.execPath, ["tools/generate-workspace.mjs", ...args], {
    cwd: root,
    encoding: "utf8",
  });
}

test("renderWorkspace lists the root, shared and each id, sorted regardless of creation order", () => {
  const root = makeTree();
  // Created in an order that is deliberately not the sorted one.
  makeHomework(root, "project-zzz");
  makeHomework(root, "m02-l01-alpha");
  makeHomework(root, "project-baseline");

  const parsed = JSON.parse(renderWorkspace(root));

  assert.deepEqual(parsed.folders, [
    { name: "root", path: "." },
    { name: "shared", path: "shared" },
    { name: "m02-l01-alpha", path: "homeworks/m02-l01-alpha" },
    { name: "project-baseline", path: "homeworks/project-baseline" },
    { name: "project-zzz", path: "homeworks/project-zzz" },
  ]);
});

test("rendering an unchanged tree twice is byte-identical", () => {
  const root = makeTree();
  makeHomework(root, "project-baseline");
  makeHomework(root, "m01-l03-blink");

  assert.equal(renderWorkspace(root), renderWorkspace(root));
});

test("the emitted text uses LF and ends with exactly one newline", () => {
  const root = makeTree();
  makeHomework(root, "project-baseline");

  const text = renderWorkspace(root);

  assert.equal(text.includes("\r"), false);
  assert.equal(text.endsWith("}\n"), true);
  assert.equal(text.endsWith("}\n\n"), false);
});

test("folders is the only top-level key and its entries carry only name and path", () => {
  const root = makeTree();
  makeHomework(root, "project-baseline");

  const parsed = JSON.parse(renderWorkspace(root));

  assert.deepEqual(Object.keys(parsed), ["folders"]);
  for (const folder of parsed.folders) {
    assert.deepEqual(Object.keys(folder), ["name", "path"]);
  }
});

test("--check exits 0 when the fixture's workspace file is current", () => {
  const root = makeTree();
  makeHomework(root, "project-baseline");
  installTools(root);
  writeFileSync(join(root, "homework.code-workspace"), renderWorkspace(root));

  const result = runGenerator(root, ["--check"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /up to date/);
});

test("--check exits 1 naming the file and the remedy when the fixture's file is stale", () => {
  const root = makeTree();
  makeHomework(root, "project-baseline");
  installTools(root);
  writeFileAt(root, "homework.code-workspace", '{"folders": []}\n');

  const result = runGenerator(root, ["--check"]);

  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /homework\.code-workspace is STALE/);
  assert.match(result.stderr, /node tools\/generate-workspace\.mjs/);
});
