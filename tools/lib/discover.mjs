// The single discovery and validation source.
//
// The generator, the sweep and (from Phase 6) the CI matrix all import this
// module, so "what counts as a homework" has exactly one definition:
//
//   a directory directly under `homeworks/` whose name matches the frozen id
//   grammar and which contains a `platformio.ini`.
//
// Node standard library only — no glob package, no argument parser.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** The one directory homework projects live in. */
export const HOMEWORKS_DIR = "homeworks";

// D-05 + D-06: the frozen id grammar. The id IS the whole folder name.
export const ID_PATTERN = /^(?:m[0-9]{2}-l[0-9]{2}|project)-[a-z0-9]+(?:-[a-z0-9]+)*$/;

// The same pattern without slashes, so the sweep can quote the expected shape
// in a failure message without printing a regex literal.
export const ID_PATTERN_TEXT = "^(?:m[0-9]{2}-l[0-9]{2}|project)-[a-z0-9]+(?:-[a-z0-9]+)*$";

/**
 * Names of the immediate subdirectories of `dir`, sorted.
 *
 * `isDirectory()` is false for a symlink, which is the symlink-escape control:
 * a symlinked directory under `homeworks/` can never walk the filesystem. A
 * missing directory yields an empty list rather than throwing, so discovery
 * reports "nothing found" instead of an exception.
 */
function directoriesIn(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

/**
 * Every `platformio.ini` deeper than `homeworks/<id>/` (D-07).
 *
 * A pure filesystem walk that compiles nothing, so the depth rule fires in the
 * same second a folder is misplaced instead of surfacing later as a dependency
 * error that points at the wrong thing.
 *
 * @param {string} repoRoot
 * @returns {string[]} repository-relative paths, sorted
 */
export function findDepthViolations(repoRoot) {
  const base = join(repoRoot, HOMEWORKS_DIR);
  const violations = [];
  const walk = (dir, depth) => {
    for (const name of directoriesIn(dir)) {
      const child = join(dir, name);
      if (depth >= 1 && existsSync(join(child, "platformio.ini"))) {
        violations.push(child.slice(repoRoot.length + 1));
      }
      walk(child, depth + 1);
    }
  };
  walk(base, 0);
  return violations.sort();
}

/**
 * One call returning everything all three consumers need, so a consumer that
 * only wanted the list cannot skip validation.
 *
 * @param {string} repoRoot
 * @returns {{found: Array<{id: string, dir: string}>, malformed: string[], violations: string[]}}
 */
export function discoverHomeworks(repoRoot) {
  const base = join(repoRoot, HOMEWORKS_DIR);
  const found = [];
  const malformed = [];
  for (const name of directoriesIn(base)) {
    const projectDir = join(base, name);
    if (!existsSync(join(projectDir, "platformio.ini"))) continue;
    if (ID_PATTERN.test(name)) found.push({ id: name, dir: `${HOMEWORKS_DIR}/${name}` });
    else malformed.push(name);
  }
  return { found, malformed, violations: findDepthViolations(repoRoot) };
}

/**
 * D-16: project-scoped environment names, hyphens stripped from the id.
 *
 * Identical environment names across projects make the IDE build the wrong
 * homework, so the names are derived mechanically from the id.
 *
 * @param {string} id
 * @returns {{s3: string, native: string}}
 */
export function envNames(id) {
  const stem = id.replaceAll("-", "");
  return { s3: `${stem}_s3`, native: `${stem}_native` };
}
