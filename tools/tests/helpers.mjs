// Fixture builder shared by every test file.
//
// No test may run against the repository root: exercising the generator there
// would find the real baseline and dirty `.pio/` in the act of testing the rule
// that says the tree must stay clean. Every fixture therefore lives under
// `os.tmpdir()` and is removed when the run ends.
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

/** Absolute path of the repository's own `tools/` directory. */
export const TOOLS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Absolute path of the repository's own root. */
export const REPO_ROOT = join(TOOLS_DIR, "..");

const created = [];

/**
 * Create an empty throwaway tree and return its root.
 *
 * @returns {string} absolute path of the fixture root
 */
export function makeTree() {
  const root = mkdtempSync(join(tmpdir(), "homework-fixture-"));
  created.push(root);
  return root;
}

/**
 * Create `homeworks/<id>/` inside a fixture tree.
 *
 * @param {string} root fixture root
 * @param {string} id the directory name, grammar-valid or deliberately not
 * @param {{ini?: boolean}} [options] `ini: false` omits `platformio.ini`
 * @returns {string} absolute path of the created homework directory
 */
export function makeHomework(root, id, options = {}) {
  const dir = join(root, "homeworks", id);
  mkdirSync(dir, { recursive: true });
  if (options.ini !== false) {
    writeFileSync(join(dir, "platformio.ini"), "[env:fixture]\nplatform = native\n");
  }
  return dir;
}

/**
 * Write a file at an arbitrary path relative to a fixture root.
 *
 * @param {string} root fixture root
 * @param {string} relPath path relative to the root, e.g. `docs/wiring.svg`
 * @param {string} [contents]
 * @returns {string} absolute path of the written file
 */
export function writeFileAt(root, relPath, contents = "") {
  const abs = join(root, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, contents);
  return abs;
}

/**
 * Copy the repository's `tools/` tree into a fixture, test files excluded, so a
 * spawned CLI resolves the fixture as its repository root.
 *
 * Both scripts derive their root from `import.meta.url`, so a copy sitting at
 * `<fixture>/tools/generate-workspace.mjs` operates on `<fixture>` — which is
 * what lets the `--check` contract be asserted without touching the real tree.
 *
 * @param {string} root fixture root
 */
export function installTools(root) {
  const testsDir = `${join("tools", "tests")}${sep}`;
  cpSync(TOOLS_DIR, join(root, "tools"), {
    recursive: true,
    filter: (src) => !src.includes(testsDir),
  });
}

/** Remove every fixture tree this module created. Safe to call more than once. */
export function cleanupAll() {
  while (created.length > 0) {
    const root = created.pop();
    rmSync(root, { recursive: true, force: true });
  }
}
