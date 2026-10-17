// Fixture builders shared by every test file.
//
// No test may run against the repository root: exercising the generator there
// would find the real baseline and dirty `.pio/` in the act of testing the rule
// that says the tree must stay clean. Every fixture therefore lives under
// `os.tmpdir()` and is removed when the run ends.
//
// The `.ini` reader lives here too, so there is exactly one of it: two copies
// would drift, and the one that drifts is the one a reader trusts.
import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { envNames } from "../lib/discover.mjs";

// Read-only: the tool tree under test is copied INTO a fixture; no fixture is
// ever built here, and no test asserts against the repository's own root.
const TOOLS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(TOOLS_DIR, "..");

/** Absolute path of the sweep under test. */
export const SWEEP_PATH = join(TOOLS_DIR, "sweep-homeworks.mjs");

/** Absolute path of the seam check under test. */
export const SEAM_CHECK_PATH = join(TOOLS_DIR, "check-hal-seam.mjs");

/** The directory under a scanned root that holds the shared libraries. */
export const SHARED_LIB_DIR = "shared/lib";

/** The three libraries the repository ships, in the order the phase decided them. */
export const DEFAULT_SHARED_LIBS = ["emb_hal", "emb_hal_arduino", "emb_log"];

/** The one directory the seam check exempts by name. */
export const EXEMPT_BACKEND = "emb_hal_arduino";

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
 * Split an `.ini` file into its `[section]` blocks, the way PlatformIO addresses them.
 *
 * Returns a Map from section name to a Map of key to value. Whole-line `;` or `#`
 * comments are skipped, and an inline `;` or `#` ends the value — PlatformIO builds its
 * reader with `configparser(inline_comment_prefixes=("#", ";"))`, which strips the marker
 * at its first occurrence with no whitespace required, so `platform = espressif32@7.1.3 ; x`
 * resolves to the pin and not to the whole annotated line. This is the opposite of the
 * `.gitignore` rule `ignore-rules.test.mjs` guards: there an inline marker is not a comment,
 * here it is.
 *
 * Multi-line (indented continuation) values are not modelled; PlatformIO accepts them, so an
 * indented `build_flags` list reads as the empty string here and fails loudly rather than
 * silently — flagged, not hidden. The one place that limit is load-bearing is `lib_deps`,
 * where a value written across several lines reads as empty AND leaves one phantom key per
 * continuation line, so the assertion built on it must name the trap rather than pass for an
 * empty value.
 *
 * @param {string} text the file's contents
 * @returns {Map<string, Map<string, string>>}
 */
export function sections(text) {
  const out = new Map();
  let heading = null;

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line === "" || line.startsWith(";") || line.startsWith("#")) continue;

    const header = /^\[([^\]]+)\]$/.exec(line);
    if (header) {
      heading = header[1].trim();
      if (!out.has(heading)) out.set(heading, new Map());
      continue;
    }

    if (heading === null) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    // PlatformIO reads this file with configparser(inline_comment_prefixes=("#", ";")),
    // so an inline marker ends the value. Keep this in step with that, not with .gitignore.
    const value = line.slice(eq + 1).split(/[;#]/)[0].trim();
    out.get(heading).set(line.slice(0, eq).trim(), value);
  }

  return out;
}

/**
 * Install one shared environment fragment and one project that consumes it, so the
 * fragment's location can be exercised without touching the repository's own tree.
 *
 * The consumer's `extra-configs` key is written from the arithmetic a real project
 * uses: out of `homeworks/<id>/` two levels, then into the shared tree. The path is
 * relative to the project directory, which is where PlatformIO resolves it. Nothing
 * here is built, and PlatformIO is never pointed at the repository root.
 *
 * The options are what make the resolved-path assertion falsifiable rather than
 * merely passable: `wrongPath` plants the fragment one directory away from where the
 * key points, and `fragment: false` omits it, so a caller can show the assertion
 * failing on a layout that is visibly wrong instead of only succeeding.
 *
 * @param {string} root fixture root
 * @param {string} id the homework directory name; the environment name is derived
 *   from it by `envNames`, never spelled by hand
 * @param {{fragment?: boolean, wrongPath?: boolean}} [options]
 * @returns {{homeDir: string, iniPath: string, fragmentPath: string, declared: string}}
 *   absolute paths, plus the `extra-configs` value as written in the file
 */
export function makeFragmentConsumer(root, id, options = {}) {
  const { fragment = true, wrongPath = false } = options;
  const homeDir = join(root, "homeworks", id);
  mkdirSync(homeDir, { recursive: true });

  const declared = "../../shared/pio/base.ini";
  const iniPath = join(homeDir, "platformio.ini");
  writeFileSync(
    iniPath,
    ["[platformio]", `extra_configs = ${declared}`, "", `[env:${envNames(id).s3}]`, ""].join("\n"),
  );

  const fragmentPath = join(
    root,
    ...(wrongPath ? ["shared", "config", "base.ini"] : ["shared", "pio", "base.ini"]),
  );
  if (fragment) {
    mkdirSync(dirname(fragmentPath), { recursive: true });
    writeFileSync(fragmentPath, "[env]\nplatform = espressif32@7.1.3\n");
  }

  return { homeDir, iniPath, fragmentPath, declared };
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

/** The dependency spec a consumer writes for one shared library, as the contract spells it. */
export function sharedLibSpec(name) {
  return `${name}=symlink://../../shared/lib/${name}`;
}

/** The one near-miss directory name a `renameBackend` fixture plants. */
const NEAR_MISS_BACKEND = `${EXEMPT_BACKEND}_alt`;

/** Normalise an option that accepts a single value or a list of them. */
function asList(value) {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Plant a shared library tree under a fixture root, in the layout the repository
 * ships: `shared/lib/<name>/library.json`, `include/<name>.h` and `src/<name>.c`.
 *
 * The options are what make an assertion built on this **falsifiable** rather than
 * merely passable, in the idiom `makeFragmentConsumer` established: each one
 * plants a layout that is visibly wrong, or content that is visibly wrong, so a
 * caller can show the assertion failing instead of only succeeding.
 *
 * @param {string} root fixture root
 * @param {string[]} [names] library directory names; defaults to the three the
 *   repository ships, in the order the phase decided them
 * @param {{
 *   omitVersionIn?: string | string[],
 *   wrongNameIn?: string | string[],
 *   omitManifest?: string | string[],
 *   plantInclude?: {in: string, include: string, form?: "angle" | "quote"}
 *     | Array<{in: string, include: string, form?: "angle" | "quote"}>,
 *   renameBackend?: boolean | string,
 *   consumer?: {id?: string, specs?: string[] | null} | null,
 * }} [options] `wrongNameIn` uppercases the directory name, so the mismatch is one
 *   a case-folded comparison would wrongly accept; `consumer.specs` of `null` omits
 *   the `lib_deps` key entirely, while omitting `specs` writes the full three.
 * @returns {{root: string, sharedLibDir: string, manifests: Record<string, string>,
 *   consumerIni: string | null}} `manifests` is keyed by the directory name as it
 *   stands after any rename; `consumerIni` is the fixture consumer's ini path, or
 *   null when none was asked for
 */
export function makeSharedLibTree(root, names = DEFAULT_SHARED_LIBS, options = {}) {
  const { omitVersionIn, wrongNameIn, omitManifest, renameBackend = false, consumer = null } =
    options;

  const omitVersions = asList(omitVersionIn);
  const wrongNames = asList(wrongNameIn);
  const omitManifests = asList(omitManifest);
  const plants = asList(options.plantInclude);

  const sharedLibDir = join(root, SHARED_LIB_DIR);
  const manifests = {};

  for (const name of names) {
    const dir = join(sharedLibDir, name);
    mkdirSync(join(dir, "include"), { recursive: true });
    mkdirSync(join(dir, "src"), { recursive: true });

    if (!omitManifests.includes(name)) {
      const manifest = { name: wrongNames.includes(name) ? name.toUpperCase() : name };
      if (!omitVersions.includes(name)) manifest.version = "0.1.0";
      const manifestPath = join(dir, "library.json");
      writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
      manifests[name] = manifestPath;
    }

    writeFileSync(
      join(dir, "include", `${name}.h`),
      `/* fixture library ${name} — written by the test fixture, never by the repository */\n#pragma once\n`,
    );
    const sourcePath = join(dir, "src", `${name}.c`);
    writeFileSync(
      sourcePath,
      `/* fixture library ${name} — written by the test fixture, never by the repository */\n#include "${name}.h"\n`,
    );

    for (const plant of plants.filter((entry) => entry.in === name)) {
      const opening = (plant.form ?? "angle") === "quote" ? '"' : "<";
      const closing = opening === '"' ? '"' : ">";
      appendFileSync(sourcePath, `#include ${opening}${plant.include}${closing}\n`);
    }
  }

  // The exemption's falsification: the same directory under a name that merely
  // resembles the exempt one. A pattern-shaped exemption would pass this over; an
  // exact-name list reports it, which is what the paired cases prove.
  if (renameBackend && names.includes(EXEMPT_BACKEND)) {
    const to = typeof renameBackend === "string" ? renameBackend : NEAR_MISS_BACKEND;
    renameSync(join(sharedLibDir, EXEMPT_BACKEND), join(sharedLibDir, to));
    if (manifests[EXEMPT_BACKEND] !== undefined) {
      manifests[to] = manifests[EXEMPT_BACKEND];
      delete manifests[EXEMPT_BACKEND];
    }
  }

  let consumerIni = null;
  if (consumer !== null) {
    const id = consumer.id ?? "project-baseline";
    const specs =
      consumer.specs === undefined ? DEFAULT_SHARED_LIBS.map(sharedLibSpec) : consumer.specs;
    const homeDir = join(root, "homeworks", id);
    mkdirSync(homeDir, { recursive: true });
    consumerIni = join(homeDir, "platformio.ini");
    const lines = [
      "[platformio]",
      "extra_configs = ../../shared/pio/base.ini",
      "",
      `[env:${envNames(id).s3}]`,
      "board = esp32-s3-devkitc-1",
      "framework = arduino",
    ];
    if (specs !== null) lines.push(`lib_deps = ${specs.join(", ")}`);
    writeFileSync(consumerIni, `${lines.join("\n")}\n`);
  }

  if (!created.includes(root)) created.push(root);

  return { root, sharedLibDir, manifests, consumerIni };
}

/**
 * Spawn the real seam check against a fixture root and return its status, stdout
 * and stderr separately.
 *
 * The check takes an explicit `--root`, so the script under test never has to be
 * copied into the fixture and the repository is never the scanned tree. Its
 * working directory is the checkout that owns it, not the fixture: the check must
 * derive nothing from where it happens to run.
 *
 * @param {string} root fixture root to scan
 * @param {string[]} [args] extra flags
 * @param {Record<string, string>} [env] environment overrides
 * @returns {import("node:child_process").SpawnSyncReturns<string>}
 */
export function runSeamCheck(root, args = [], env = {}) {
  return spawnSync(process.execPath, [SEAM_CHECK_PATH, "--root", root, ...args], {
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
