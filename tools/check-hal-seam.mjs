#!/usr/bin/env node
// The seam gate: a pure-filesystem walk of the shared library tree that names
// every framework include it finds, with the file and the line, and refuses a
// tree it could not check at all.
//
// Why a check rather than a convention: `shared/lib/` is pure C, and exactly one
// directory in it is allowed to see a framework header. Nothing else holds that
// property — the build compiles a framework include happily, the seam is gone
// silently, and the loss is only noticed when the framework era changes. This
// script is the thing that refuses instead.
//
// Two shapes carry the whole design, and each closes a failure this repository
// would otherwise keep:
//
// 1. It matches include *paths*, never substrings. The framework's own core
//    header is an exact trailing-name match; the platform's header prefix, the
//    Arduino HAL prefix, the real-time operating system's directory and the
//    peripheral driver's directory are prefix/subpath matches. A substring
//    search would both leak its target — `esp32-hal-*` is the actual Arduino HAL
//    prefix and `esp_` does not cover it — and cry wolf on `ArduinoJson.h`, a
//    third-party header whose name merely contains the framework's. A gate that
//    both leaks and cries wolf is exactly the failure this check exists to
//    remove.
//
// 2. The exemption is a named list of exactly one directory, applied at the
//    first level and by exact name (ALLOWED, below). A directory-name pattern
//    would silently exempt whatever happened to match it; inferring the
//    exemption from a manifest field would add a parser and turn a statement
//    into an inference. Adding the ESP-IDF backend later is one new directory
//    plus one line in that list.
//
// Every regular file beneath a library is read, with NO extension filter. An
// allow-list of extensions is a second place a newly introduced file type can
// be silently missed, and the include pattern is anchored, so a file that is
// not source simply never matches.
//
// Flags — the whole surface, nothing else:
//   --root <dir>  scan <dir>/shared/lib instead of the repository's own tree.
//                 It exists for the tests, which must never point the check at
//                 the repository itself: a planted include belongs in a
//                 throwaway fixture. The default is the repository root derived
//                 from this script's own location, never the process working
//                 directory, so the check behaves identically from any cwd. A
//                 missing value after the flag, and any argument that is not
//                 this flag, exit 2: a mistyped command line that silently scans
//                 the wrong tree is the same class of quiet mistake.
//
// Zero libraries is a failure, not a success. A gate that checked nothing must
// never exit 0, and this is not a hypothetical state — it is what the tree
// looked like before the libraries were written, so the check's first execution
// had to be correct. The clean path prints how many libraries it scanned, which
// is what separates "found nothing" from "scanned nothing" from the output
// rather than from trusting the exit status.
//
// This script is deliberately not wired into any hook, any CI job or the
// repository sweep. It is a script until the phase that owns the wiring turns it
// into a gate; a reader must not mistake one for the other.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Resolved from this module's own location, so the script works from any cwd.
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** The directory under the scanned root that holds the shared libraries. */
export const SHARED_LIB_DIR = "shared/lib";

/**
 * The one directory under `shared/lib/` allowed to see a framework header.
 *
 * Exact names, applied at the first level only. This is the seam's whole
 * boundary: every entry added here is a silent widening of it.
 */
export const ALLOWED = ["emb_hal_arduino"];

/** An `#include` directive, capturing its path, in both the angled and the quoted form. */
export const INCLUDE_PATTERN = /^[ \t]*#[ \t]*include[ \t]*[<"]([^>"]+)[>"]/;

/**
 * Whether a captured include path names a framework header.
 *
 * Path matching, never substring matching — the reason is in the block comment
 * above. The trailing name is compared for the header names, so `ArduinoJson.h`
 * is not `Arduino.h`; the two directory forms are compared against the whole
 * path, because that is what a directory prefix is.
 *
 * @param {string} includePath the text between the delimiters, e.g. `esp32-hal-uart.h`
 * @returns {boolean}
 */
export function isFrameworkInclude(includePath) {
  const base = includePath.split("/").pop();
  return (
    base === "Arduino.h" || // exact trailing name — never a substring
    base.startsWith("esp_") || // the real IDF header prefix
    base.startsWith("esp32-hal-") || // the Arduino HAL prefix, which `esp_` does not cover
    includePath.startsWith("driver/") || // the peripheral driver's directory
    includePath.startsWith("freertos/") // the real-time operating system's directory
  );
}

/**
 * Names of the immediate subdirectories of `dir`, sorted.
 *
 * `isDirectory()` is false for a symlink, which is the escape control: a
 * symlinked directory can never walk the filesystem. A missing directory yields
 * an empty list rather than throwing, so the caller reports "nothing found"
 * instead of an exception. Same predicate and same reason as the discovery
 * module the sweep and the generator share.
 */
function directoriesIn(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

/**
 * Every regular file beneath `dir`, recursively, with no extension filter.
 *
 * `isFile()` is false for a symlink for the same reason `isDirectory()` is, so a
 * symlinked file is left alone rather than followed out of the tree.
 */
function regularFilesIn(dir) {
  const out = [];
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const child = join(current, entry.name);
      if (entry.isDirectory()) walk(child);
      else if (entry.isFile()) out.push(child);
    }
  };
  if (existsSync(dir)) walk(dir);
  return out;
}

/**
 * Scan one shared library directory.
 *
 * @param {string} scanRoot absolute path of `<root>/shared/lib`
 * @returns {{libraries: string[], hits: Array<{file: string, line: number, include: string}>}}
 *   `libraries` is what was actually scanned, with the exempt directory already
 *   removed; `hits` comes back in filesystem order and is sorted by the caller
 *   before it is printed.
 */
export function scanSeam(scanRoot) {
  const libraries = directoriesIn(scanRoot).filter((name) => !ALLOWED.includes(name));
  const hits = [];
  for (const name of libraries) {
    for (const file of regularFilesIn(join(scanRoot, name))) {
      const lines = readFileSync(file, "utf8").split("\n");
      for (let index = 0; index < lines.length; index += 1) {
        const match = INCLUDE_PATTERN.exec(lines[index]);
        if (match && isFrameworkInclude(match[1])) {
          hits.push({ file, line: index + 1, include: match[1] });
        }
      }
    }
  }
  return { libraries, hits };
}

/** The scanned root: `--root <dir>` when given, otherwise the repository itself. */
function parseArgs(argv) {
  let root = REPO_ROOT;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg !== "--root") {
      console.error(`check-hal-seam: unknown argument "${arg}"`);
      console.error("Usage: check-hal-seam.mjs [--root <dir>]");
      process.exit(2);
    }
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) {
      console.error("--root needs a directory: --root <dir>");
      process.exit(2);
    }
    root = resolve(value);
    index += 1;
  }
  return root;
}

function main() {
  const root = parseArgs(process.argv.slice(2));
  const scanRoot = join(root, SHARED_LIB_DIR);
  const { libraries, hits } = scanSeam(scanRoot);
  const where = relative(root, scanRoot) || scanRoot;

  if (libraries.length === 0) {
    console.log(`check-hal-seam: scanned 0 libraries under ${where}`);
    if (!existsSync(scanRoot)) console.log(`  (there is no directory at ${where})`);
    console.log("A gate that checked nothing must not exit 0.");
    return 1;
  }

  if (hits.length === 0) {
    console.log(
      `check-hal-seam: scanned ${libraries.length} libraries under ${where}; no framework include found`,
    );
    return 0;
  }

  // Sorted by path and then by line, so two runs against the same tree print
  // byte-identical output and the report never depends on the directory order
  // the filesystem happens to return.
  hits.sort((left, right) => {
    const a = relative(root, left.file);
    const b = relative(root, right.file);
    if (a !== b) return a < b ? -1 : 1;
    return left.line - right.line;
  });

  console.log(`check-hal-seam: ${hits.length} framework include(s) under ${where}`);
  for (const hit of hits) {
    console.log(`${relative(root, hit.file)}:${hit.line}: ${hit.include}`);
  }
  return 1;
}

// Entry-point guard: this module is also imported by its own test, and CLI work
// at module scope would scan and exit merely by being imported.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
