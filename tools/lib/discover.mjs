// INTERFACE PLACEHOLDER — the bodies land with the GREEN commit of this task.
//
// The exported names and their arity are fixed here so the failing tests fail
// on the behaviour they assert, not on a missing module. Every export below is
// replaced by a real implementation before this task is committed as complete.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const HOMEWORKS_DIR = "homeworks";

export const ID_PATTERN_TEXT = ".*";
export const ID_PATTERN = new RegExp(`^${ID_PATTERN_TEXT}$`);

function directoriesIn(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function findDepthViolations(repoRoot) {
  return directoriesIn(join(repoRoot, HOMEWORKS_DIR)).slice(0, 0);
}

export function discoverHomeworks(repoRoot) {
  return { found: [], malformed: [], violations: findDepthViolations(repoRoot) };
}

export function envNames(id) {
  return { s3: id, native: id };
}
