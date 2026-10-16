// Fixture builder shared by every test file.
//
// No test may run against the repository root: exercising the generator there
// would find the real baseline and dirty `.pio/` in the act of testing the rule
// that says the tree must stay clean. Every fixture therefore lives under
// `os.tmpdir()` and is removed when the run ends.
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Read-only: the tool tree under test is copied INTO a fixture; no fixture is
// ever built here, and no test asserts against the repository's own root.
const TOOLS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(TOOLS_DIR, "..");

/** Absolute path of the sweep under test. */
export const SWEEP_PATH = join(TOOLS_DIR, "sweep-homeworks.mjs");

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

/**
 * Manufacture a depth violation: a `platformio.ini` one level below a homework
 * folder, which the one-level rule forbids.
 *
 * Written at an arbitrary nested path rather than through `makeHomework`, because
 * the violation is precisely a file that sits where no homework may sit. Callers
 * normally also create `homeId` with `makeHomework`, so the fixture carries a
 * discoverable project beside the violation — which is what makes the policy
 * short-circuit provable instead of vacuous.
 *
 * @param {string} root fixture root
 * @param {string} homeId the homework directory the misplaced file hides under
 * @param {string} [nested] the offending subdirectory name
 * @returns {string} absolute path of the offending file
 */
export function makeDepthViolation(root, homeId, nested = "deeper") {
  return writeFileAt(
    root,
    join("homeworks", homeId, nested, "platformio.ini"),
    "[env:fixture]\nplatform = native\n",
  );
}

/**
 * Spawn the real sweep against a fixture root and return its status, stdout and
 * stderr separately.
 *
 * The sweep takes an explicit `--root`, so the script under test never has to be
 * copied into the fixture and the repository is never the scanned tree. Its
 * working directory is the checkout that owns it, not the fixture: the sweep must
 * derive nothing from where it happens to run.
 *
 * @param {string} root fixture root to scan
 * @param {string[]} [args] extra flags, e.g. `["--list"]`
 * @param {Record<string, string>} [env] environment overrides, e.g. a bogus
 *   `PLATFORMIO_CORE` to prove a spawn failure is reported rather than silent
 * @returns {import("node:child_process").SpawnSyncReturns<string>}
 */
export function runSweep(root, args = [], env = {}) {
  return spawnSync(process.execPath, [SWEEP_PATH, "--root", root, ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

/** Remove every fixture tree this module created. Safe to call more than once. */
export function cleanupAll() {
  while (created.length > 0) {
    const root = created.pop();
    rmSync(root, { recursive: true, force: true });
  }
}
