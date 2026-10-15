#!/usr/bin/env node
// INTERFACE PLACEHOLDER — the bodies land with the GREEN commit of this task.
//
// `renderWorkspace` is the pure seam the unit test asserts on; the CLI is the
// seam the `--check` integration test spawns. Both are placeholders here so the
// failing tests fail on their assertions rather than on a missing module.
//
// The CLI is behind an entry-point guard on purpose: the test imports this
// module, and module-scope CLI work would rewrite the repository's own
// `homework.code-workspace` merely by being imported.
import { pathToFileURL } from "node:url";

export function renderWorkspace(repoRoot) {
  return JSON.stringify({ folders: [] }, null, 2) + "\n";
}

function main() {
  if (process.argv.includes("--check")) {
    console.error("homework.code-workspace: the drift check is not implemented yet");
    return 1;
  }
  console.error("tools/generate-workspace.mjs: the generator is not implemented yet");
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
