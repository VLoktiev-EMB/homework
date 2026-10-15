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
import { cleanupAll, installTools, makeHomework, makeTree } from "./helpers.mjs";

test.after(cleanupAll);

test("renderWorkspace lists the root, shared and each discovered id, in that order", () => {
  const root = makeTree();
  makeHomework(root, "project-baseline");

  const parsed = JSON.parse(renderWorkspace(root));

  assert.deepEqual(Object.keys(parsed), ["folders"]);
  assert.deepEqual(
    parsed.folders.map((folder) => folder.path),
    [".", "shared", "homeworks/project-baseline"],
  );
});

test("rendering an unchanged tree twice is byte-identical", () => {
  const root = makeTree();
  makeHomework(root, "project-baseline");

  assert.equal(renderWorkspace(root), renderWorkspace(root));
});

test("--check exits 0 when the fixture's workspace file is current", () => {
  const root = makeTree();
  makeHomework(root, "project-baseline");
  installTools(root);
  writeFileSync(join(root, "homework.code-workspace"), renderWorkspace(root));

  const result = spawnSync(process.execPath, ["tools/generate-workspace.mjs", "--check"], {
    cwd: root,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
});
