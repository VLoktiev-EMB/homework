#!/usr/bin/env node
// Generate `homework.code-workspace` from the filesystem, or check it for drift.
//
// The file is a PURE FOLDER LIST built from `discoverHomeworks()`, never a
// template with settings spliced in: that is what makes "the workspace file
// lists fewer homeworks than the tree contains" structurally impossible rather
// than merely discouraged. Editor settings live in `.vscode/settings.json`.
//
// Determinism is the whole game — the drift check compares bytes:
//   1. every list is sorted (`readdirSync` order is filesystem-dependent);
//   2. the key order and the serialisation are fixed, LF only, one trailing \n;
//   3. no comments are ever emitted. VS Code accepts JSONC, so a hand-added
//      comment is a plausible edit that any byte comparison would flag.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { discoverHomeworks } from "./lib/discover.mjs";

// Resolved from this module's own location, so the script works from any cwd.
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WORKSPACE_FILE = join(REPO_ROOT, "homework.code-workspace");

/**
 * The workspace file's text — a pure function of the tree.
 *
 * @param {string} repoRoot
 * @returns {string}
 */
export function renderWorkspace(repoRoot) {
  const { found } = discoverHomeworks(repoRoot);
  const folders = [
    { name: "root", path: "." }, // REPO-01: the repository root
    { name: "shared", path: "shared" }, // REPO-01: the shared-library tree
    ...found.map((homework) => ({ name: homework.id, path: homework.dir })),
  ];
  return JSON.stringify({ folders }, null, 2) + "\n";
}

function main() {
  const expected = renderWorkspace(REPO_ROOT);
  const onDisk = existsSync(WORKSPACE_FILE) ? readFileSync(WORKSPACE_FILE, "utf8") : null;

  if (!process.argv.includes("--check")) {
    writeFileSync(WORKSPACE_FILE, expected);
    console.log(`wrote ${WORKSPACE_FILE}`);
    return 0;
  }

  if (onDisk === expected) {
    console.log("homework.code-workspace is up to date");
    return 0;
  }

  console.error(
    [
      "homework.code-workspace is STALE.",
      "It is generated from the filesystem and must never be hand-edited.",
      "Run: node tools/generate-workspace.mjs",
    ].join("\n"),
  );
  return 1;
}

// Entry-point guard: this module is also imported by its tests, and CLI work at
// module scope would rewrite the repository's own workspace file merely by
// being imported.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
