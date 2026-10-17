// The seam contract: the check falsified against every class of framework include it
// claims to catch, and the shared tree's own invariants asserted read-only.
//
// The stance is the one `ignore-rules.test.mjs` and `env-baseline.test.mjs` established.
// The check is spawned as the real CLI against a throwaway fixture root, and every case
// is judged on the names it printed as well as on its exit status: a case that asserted
// only the status would pass for any failure at all, including the failure of the
// fixture rather than of the check. Nothing here spawns a PlatformIO process — a suite
// that did would couple every commit to a binary this repository cannot assume is
// resolvable, which is the same reason the sibling suites stay filesystem-only.
//
// Read-only against the repository, by construction: the static facts are asserted
// against the real tree, and every fixture lives under `os.tmpdir()` and is removed by
// `test.after`. Nothing here writes to `shared/lib/`; a fixture that leaked there would
// be read as a real library by the check itself.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { ALLOWED } from "../check-hal-seam.mjs";
import { envNames } from "../lib/discover.mjs";

import {
  DEFAULT_SHARED_LIBS,
  EXEMPT_BACKEND,
  NEAR_MISS_BACKEND,
  SHARED_LIB_DIR,
  cleanupAll,
  makeSharedLibTree,
  makeTree,
  runSeamCheck,
  sections,
  sharedLibSpec,
  writeFileAt,
} from "./helpers.mjs";

test.after(cleanupAll);

/** A spawned check's output, whichever channel it chose. */
function outputOf(result) {
  return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}

/**
 * The one report line a planted include must produce: the file it was planted in, the
 * line it sits on, and the include itself. The fixture writes a comment line and the
 * library's own header first, so a planted include lands on line 3.
 */
function plantedLine(library, include, line = 3) {
  return `shared/lib/${library}/src/${library}.c:${line}: ${include}`;
}

/**
 * Build one fixture with one planted include and spawn the real check against it.
 *
 * Each case gets its own throwaway tree; nothing is shared and nothing is written into
 * the repository. `options` is forwarded to the builder, so a case can combine a planted
 * include with a renamed backend without re-implementing fixture construction.
 */
function spawnWithPlanted(plant, options = {}) {
  const fixture = makeSharedLibTree(makeTree(), DEFAULT_SHARED_LIBS, {
    ...options,
    plantInclude: plant,
  });
  const result = runSeamCheck(fixture.root);
  return { fixture, result, output: outputOf(result) };
}

test("a framework include planted under the shared tree is named and refused", () => {
  const { fixture, result, output } = spawnWithPlanted({ in: "emb_log", include: "Arduino.h" });

  assert.notEqual(
    result.status,
    0,
    `the check exited 0 on a tree carrying a framework include (${fixture.root}):\n${output}`,
  );
  assert.ok(
    output.includes(plantedLine("emb_log", "Arduino.h")),
    `the check did not name the file and line the include was planted at (${fixture.root}):\n${output}`,
  );
});

test("the quoted include form is caught as well as the angled one", () => {
  // The include pattern accepts both forms, and a scanner that accepted only one would
  // have a hole exactly where a reader is least likely to look.
  const { fixture, result, output } = spawnWithPlanted({
    in: "emb_log",
    include: "Arduino.h",
    form: "quote",
  });

  assert.notEqual(result.status, 0, `the quoted form was passed over (${fixture.root}):\n${output}`);
  assert.ok(
    output.includes(plantedLine("emb_log", "Arduino.h")),
    `the quoted form was not named with its file and line (${fixture.root}):\n${output}`,
  );
});

test("the platform's own header prefix is caught", () => {
  const { fixture, result, output } = spawnWithPlanted({ in: "emb_log", include: "esp_system.h" });

  assert.notEqual(result.status, 0, `esp_ was not caught (${fixture.root}):\n${output}`);
  assert.ok(
    output.includes(plantedLine("emb_log", "esp_system.h")),
    `the esp_ header was not named with its file and line (${fixture.root}):\n${output}`,
  );
});

test("the Arduino HAL prefix is caught, which the platform prefix does not cover", () => {
  // The class the criterion's literal wording misses: these headers begin with the chip
  // name and a hyphen, not with `esp_`.
  const { fixture, result, output } = spawnWithPlanted({
    in: "emb_log",
    include: "esp32-hal-gpio.h",
  });

  assert.notEqual(result.status, 0, `esp32-hal- was not caught (${fixture.root}):\n${output}`);
  assert.ok(
    output.includes(plantedLine("emb_log", "esp32-hal-gpio.h")),
    `the Arduino HAL header was not named with its file and line (${fixture.root}):\n${output}`,
  );
});

test("the real-time operating system's directory is caught", () => {
  const { fixture, result, output } = spawnWithPlanted({
    in: "emb_log",
    include: "freertos/FreeRTOS.h",
  });

  assert.notEqual(result.status, 0, `freertos/ was not caught (${fixture.root}):\n${output}`);
  assert.ok(
    output.includes(plantedLine("emb_log", "freertos/FreeRTOS.h")),
    `the freertos/ include was not named with its file and line (${fixture.root}):\n${output}`,
  );
});

test("the peripheral driver's directory is caught", () => {
  const { fixture, result, output } = spawnWithPlanted({ in: "emb_log", include: "driver/gpio.h" });

  assert.notEqual(result.status, 0, `driver/ was not caught (${fixture.root}):\n${output}`);
  assert.ok(
    output.includes(plantedLine("emb_log", "driver/gpio.h")),
    `the driver/ include was not named with its file and line (${fixture.root}):\n${output}`,
  );
});

test("a third-party header whose name merely contains the framework's is left alone", () => {
  // The case that fails the moment anyone replaces the path match with a substring
  // search: `ArduinoJson.h` contains `Arduino` and is not `Arduino.h`.
  const { fixture, result, output } = spawnWithPlanted({ in: "emb_log", include: "ArduinoJson.h" });

  assert.equal(
    result.status,
    0,
    `a third-party header was flagged — the match is a substring search, not a path match (${fixture.root}):\n${output}`,
  );
  assert.ok(
    output.includes("no framework include found"),
    `the clean path did not say what it found (${fixture.root}):\n${output}`,
  );
});

test("the exemption is exactly one directory, named literally, and nothing else", () => {
  // Read from the module rather than from a fixture: this is the boundary itself. A
  // pattern here, or a second entry, would exempt more than the one backend the phase
  // decided on — and that widening would be invisible in every behavioural case below.
  assert.deepEqual(
    ALLOWED,
    ["emb_hal_arduino"],
    "the exemption list is not the single named backend — every entry added to it is a silent widening of the seam",
  );
});

test("the exempt backend directory passes the same include over", () => {
  // The positive half of the exemption, and the pair to the negative case below: the
  // same include is planted in both, and only the directory name differs.
  const { fixture, result, output } = spawnWithPlanted({
    in: EXEMPT_BACKEND,
    include: "Arduino.h",
  });

  assert.equal(
    result.status,
    0,
    `the exempt directory was scanned (${fixture.root}):\n${output}`,
  );
  assert.ok(
    !output.includes(EXEMPT_BACKEND),
    `the exempt directory was named in the report (${fixture.root}):\n${output}`,
  );
});

test("renaming the backend to a near-miss makes the check name the include", () => {
  // Why this case exists: an exemption keyed to a pattern would pass the case above and
  // fail this one. The two together are what prove the exemption is an exact name.
  assert.notEqual(
    NEAR_MISS_BACKEND,
    EXEMPT_BACKEND,
    "the fixture's near-miss carries the exempt name itself, so this case proves nothing",
  );

  const { fixture, result, output } = spawnWithPlanted(
    { in: EXEMPT_BACKEND, include: "Arduino.h" },
    { renameBackend: true },
  );

  assert.notEqual(
    result.status,
    0,
    `a near-miss directory was exempted, so the exemption is a pattern (${fixture.root}):\n${output}`,
  );
  assert.ok(
    output.includes(`shared/lib/${NEAR_MISS_BACKEND}/src/${EXEMPT_BACKEND}.c:3: Arduino.h`),
    `the near-miss directory was not named with its file and line (${fixture.root}):\n${output}`,
  );
});

test("an empty library set refuses loudly and names the directory it scanned", () => {
  // Not hypothetical: this is what the tree looked like before the libraries were written.
  const root = makeTree();
  writeFileAt(root, "shared/lib/README.md", "no library here, only a plain file\n");

  const result = runSeamCheck(root);
  const output = outputOf(result);

  assert.notEqual(result.status, 0, `a tree holding no library exited 0 (${root}):\n${output}`);
  assert.ok(
    output.includes("shared/lib"),
    `the refusal does not name the directory it scanned (${root}):\n${output}`,
  );
  assert.ok(
    output.includes("scanned 0 libraries"),
    `the refusal does not state the library count, so "found nothing" and "scanned nothing" read alike (${root}):\n${output}`,
  );
});

test("an absent library directory refuses rather than crashing", () => {
  const root = makeTree();

  const result = runSeamCheck(root);
  const output = outputOf(result);

  assert.notEqual(result.status, 0, `an absent library directory exited 0 (${root}):\n${output}`);
  assert.ok(
    output.includes("scanned 0 libraries under shared/lib"),
    `the absent directory did not produce the named refusal (${root}):\n${output}`,
  );
  assert.equal(
    result.stderr.trim(),
    "",
    `the check wrote to stderr, so it threw rather than refusing — the missing-directory case fell through (${root}):\n${output}`,
  );
});

test("the report is stable and sorted across runs", () => {
  // What this proves: the report does not depend on the directory order the filesystem
  // happens to return, because it is sorted by path and then by line before printing.
  // What it does NOT prove: it cannot force the filesystem to hand back an unstable
  // order, so the sorted assertion below is the part that carries the weight.
  const fixture = makeSharedLibTree(makeTree(), DEFAULT_SHARED_LIBS, {
    plantInclude: [
      { in: "emb_log", include: "Arduino.h" },
      { in: "emb_hal", include: "esp_system.h" },
    ],
  });

  const first = runSeamCheck(fixture.root);
  const second = runSeamCheck(fixture.root);

  assert.notEqual(first.status, 0, `neither run reported the two includes (${fixture.root})`);
  assert.equal(
    outputOf(first),
    outputOf(second),
    `two runs against the same tree printed different output (${fixture.root})`,
  );

  const reported = first.stdout
    .split("\n")
    .filter((line) => line.startsWith("shared/lib/"))
    .map((line) => line.trim());
  assert.deepEqual(
    reported,
    [
      "shared/lib/emb_hal/src/emb_hal.c:3: esp_system.h",
      "shared/lib/emb_log/src/emb_log.c:3: Arduino.h",
    ],
    `the report is not sorted by path and then by line (${fixture.root}):\n${first.stdout}`,
  );
});

// Two directories up from `tools/tests/`.
const TESTS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(TESTS_DIR, "..", "..");
const SHARED_LIB_ROOT = join(REPO_ROOT, SHARED_LIB_DIR);
const BASELINE_INI = join(REPO_ROOT, "homeworks", "project-baseline", "platformio.ini");

// The consumer whose dependency line the assertions below read. Named once, so the
// environment name it implies is derived by `envNames()` rather than spelled here.
const CONSUMER_ID = "project-baseline";

/**
 * Everything wrong with the shared library tree's manifests, as an empty list when the
 * tree is right.
 *
 * Returned rather than thrown, so the real-tree arm and the fixture arm run the SAME
 * predicate: a fixture that passed its own private check would prove nothing about the
 * check the real tree is held to.
 *
 * @param {string} sharedLibRoot absolute path of the shared library directory
 * @param {string[]} expectedNames the library directories the phase decided on
 * @returns {string[]}
 */
function manifestProblems(sharedLibRoot, expectedNames) {
  if (!existsSync(sharedLibRoot)) {
    return [`there is no shared library directory at ${sharedLibRoot}`];
  }

  // A library is a directory carrying a manifest. A plain file beside them — the
  // directory's own README — is not one, and a directory without a manifest is not one
  // either, which is why the set is compared rather than merely counted.
  const declared = readdirSync(sharedLibRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => existsSync(join(sharedLibRoot, name, "library.json")))
    .sort();

  const problems = [];
  const expected = [...expectedNames].sort();
  if (JSON.stringify(declared) !== JSON.stringify(expected)) {
    const missing = expected.filter((name) => !declared.includes(name));
    const unexpected = declared.filter((name) => !expected.includes(name));
    problems.push(
      `the manifest-carrying directories are ${JSON.stringify(declared)}, where the phase decided on ${JSON.stringify(expected)}` +
        (missing.length > 0 ? ` — missing: ${missing.join(", ")}` : "") +
        (unexpected.length > 0 ? ` — unexpected: ${unexpected.join(", ")}` : ""),
    );
  }

  for (const name of declared) {
    const manifestPath = join(sharedLibRoot, name, "library.json");
    let manifest;
    try {
      manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    } catch (error) {
      problems.push(`${manifestPath} is not readable JSON: ${error.message}`);
      continue;
    }

    // Byte equality on the ASCII identifier — never case-folded and never trimmed. The
    // left-hand side of a dependency line overrides the installed folder name while the
    // dependency scanner reads the manifest, so two spellings make two names for one
    // library.
    if (manifest.name !== name) {
      problems.push(
        `${manifestPath} declares name ${JSON.stringify(manifest.name)}, not its directory name ${JSON.stringify(name)} — the two must be byte-identical`,
      );
    }

    if (typeof manifest.version !== "string" || manifest.version === "") {
      problems.push(
        `${manifestPath} declares no non-empty version — the tool then synthesises one from the clock, so the dependency graph stops being reproducible and a listing diff churns on every install`,
      );
    }

    if (manifest.scripts !== undefined) {
      problems.push(
        `${manifestPath} carries a scripts key — an install-time hook in a shared library is a supply-chain surface in a public repository, and these manifests are declarative data`,
      );
    }
  }

  return problems;
}

/**
 * Everything wrong with a consumer's dependency line, as an empty list when it is right.
 *
 * The value is read with the repository's own section reader, so this assertion sees
 * exactly what the repository's other suites see. Returned rather than thrown, for the
 * same reason `manifestProblems` is.
 *
 * @param {string} iniText the consumer's `platformio.ini` contents
 * @param {string} projectId the consumer's directory name
 * @param {string} sharedLibRoot absolute path of the shared library directory
 * @param {string[]} expectedNames the library names the phase decided on
 * @returns {string[]}
 */
function consumerProblems(iniText, projectId, sharedLibRoot, expectedNames) {
  const section = `env:${envNames(projectId).s3}`;
  const environment = sections(iniText).get(section);
  if (environment === undefined) {
    return [`the file declares no [${section}] section, so it names no dependent library`];
  }

  const value = environment.get("lib_deps");
  if (value === undefined || value === "") {
    return [
      `the [${section}] lib_deps key is absent, or reads as empty — if the value is written across several lines this reader returns "" here and leaves one phantom key per continuation line, which is the trap this assertion exists to name rather than to pass as an empty value`,
    ];
  }

  const problems = [];
  const named = [];
  for (const entry of value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "")) {
    // Split on the FIRST equals sign, so a separator inside the path form is never
    // mistaken for a delimiter.
    const eq = entry.indexOf("=");
    if (eq === -1) {
      problems.push(
        `the dependency entry ${JSON.stringify(entry)} carries no name — the form is <Name>=symlink://../../shared/lib/<Name>`,
      );
      continue;
    }
    const lhs = entry.slice(0, eq);
    const rhs = entry.slice(eq + 1);
    named.push(lhs);

    // Compared as written: never resolved and never normalised, because resolving it
    // would put a machine-local absolute path into a public history.
    const expectedRhs = `symlink://../../shared/lib/${lhs}`;
    if (rhs !== expectedRhs) {
      problems.push(
        `the entry ${JSON.stringify(entry)} names ${JSON.stringify(rhs)}, where the contract writes ${JSON.stringify(expectedRhs)}`,
      );
    }

    const libDir = rhs.split("/").pop();
    const manifestPath = join(sharedLibRoot, libDir, "library.json");
    if (!existsSync(manifestPath)) {
      problems.push(
        `the entry ${JSON.stringify(entry)} names ${JSON.stringify(libDir)}, which carries no library.json under ${sharedLibRoot}`,
      );
      continue;
    }
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (manifest.name !== lhs) {
      problems.push(
        `the entry's left-hand side ${JSON.stringify(lhs)} is not the manifest name ${JSON.stringify(manifest.name)} of ${JSON.stringify(libDir)} — two names then exist for one library`,
      );
    }
  }

  const expected = [...expectedNames].sort();
  const declaredNames = [...named].sort();
  if (JSON.stringify(declaredNames) !== JSON.stringify(expected)) {
    const missing = expected.filter((name) => !declaredNames.includes(name));
    const unexpected = declaredNames.filter((name) => !expected.includes(name));
    problems.push(
      `the dependency line names ${JSON.stringify(declaredNames)}, where the contract names ${JSON.stringify(expected)}` +
        (missing.length > 0 ? ` — missing: ${missing.join(", ")}` : "") +
        (unexpected.length > 0 ? ` — unexpected: ${unexpected.join(", ")}` : ""),
    );
  }

  return problems;
}

test("every shared library carries a manifest whose name and version hold, and the layout split does too", () => {
  assert.deepEqual(
    manifestProblems(SHARED_LIB_ROOT, DEFAULT_SHARED_LIBS),
    [],
    `the shared library tree's manifests are not as the contract states them (${SHARED_LIB_ROOT})`,
  );

  // The plain file that sits beside the libraries, named explicitly so the property
  // that it is not counted as a library is exercised rather than vacuous.
  assert.ok(
    existsSync(join(SHARED_LIB_ROOT, "README.md")),
    `${SHARED_LIB_ROOT}/README.md is gone, so nothing exercises "a plain file is not a library" any more`,
  );

  // Two absences are structural rather than incidental: an interface has no translation
  // unit, and a backend exposes no public header.
  for (const name of DEFAULT_SHARED_LIBS) {
    const carriesInterface = existsSync(join(SHARED_LIB_ROOT, name, "include"));
    assert.equal(
      carriesInterface,
      name !== EXEMPT_BACKEND,
      `${name} ${carriesInterface ? "carries" : "carries no"} include/ — the two interface libraries carry one and the backend does not, and that split is what makes the boundary structural instead of conventional`,
    );
  }
});

test("the baseline's dependency line names exactly the three libraries, each matching its manifest", () => {
  assert.deepEqual(
    consumerProblems(
      readFileSync(BASELINE_INI, "utf8"),
      CONSUMER_ID,
      SHARED_LIB_ROOT,
      DEFAULT_SHARED_LIBS,
    ),
    [],
    `${BASELINE_INI} does not declare the three libraries the contract states`,
  );
});

test("the manifest assertion turns red on an omitted version, a mismatched name and an absent manifest", () => {
  const cases = [
    {
      option: { omitVersionIn: "emb_log" },
      expected: "version",
      why: "a manifest with no version should not pass, because the tool silently synthesises one from the clock",
    },
    {
      option: { wrongNameIn: "emb_log" },
      expected: "name",
      why: "a manifest whose name differs from its directory only in case should not pass, because the comparison is byte equality",
    },
    {
      option: { omitManifest: "emb_log" },
      expected: "directories",
      why: "a library directory with no manifest should not be counted as a library",
    },
  ];

  for (const { option, expected, why } of cases) {
    const fixture = makeSharedLibTree(makeTree(), DEFAULT_SHARED_LIBS, option);
    const problems = manifestProblems(fixture.sharedLibDir, DEFAULT_SHARED_LIBS);

    assert.ok(
      problems.some((problem) => problem.includes("emb_log") && problem.includes(expected)),
      `${why} — the fixture produced ${JSON.stringify(problems)} (${fixture.root})`,
    );
  }
});

test("the consumer assertion turns red on a short dependency line and on an absent key", () => {
  const short = makeSharedLibTree(makeTree(), DEFAULT_SHARED_LIBS, {
    consumer: { id: CONSUMER_ID, specs: [sharedLibSpec("emb_hal")] },
  });
  const shortProblems = consumerProblems(
    readFileSync(short.consumerIni, "utf8"),
    CONSUMER_ID,
    short.sharedLibDir,
    DEFAULT_SHARED_LIBS,
  );
  assert.ok(
    shortProblems.some(
      (problem) => problem.includes("missing") && problem.includes("emb_hal_arduino"),
    ),
    `a dependency line naming one library instead of three passed, and its message names no missing spec: ${JSON.stringify(shortProblems)} (${short.root})`,
  );

  const absent = makeSharedLibTree(makeTree(), DEFAULT_SHARED_LIBS, {
    consumer: { id: CONSUMER_ID, specs: null },
  });
  const absentProblems = consumerProblems(
    readFileSync(absent.consumerIni, "utf8"),
    CONSUMER_ID,
    absent.sharedLibDir,
    DEFAULT_SHARED_LIBS,
  );
  assert.ok(
    absentProblems.some((problem) => problem.includes("lib_deps")),
    `a consumer with no dependency key passed, or failed without naming the trap: ${JSON.stringify(absentProblems)} (${absent.root})`,
  );
});

// ---------------------------------------------------------------------------------------
// The repository-wide scan for a USE of the deprecated global-library directives.
//
// Why this case lives in THIS file rather than in a suite of its own: the repository pays
// for every added file and check forever, and this suite is already the shared tree's
// regression gate. A fourth suite would mean a fourth runner, a fourth cleanup hook and a
// fourth place to look when the phase's regression gate goes red.
//
// Why the scan's subject is a USE and not a MENTION. The criterion's literal reading — that
// no reference to either directive survives *anywhere* in the repository — is already false
// at the moment it was written, and not by accident: `.planning/REQUIREMENTS.md`'s
// out-of-scope table and `AGENTS.md`'s avoid table both name both directives on purpose,
// because their job is to forbid them, and this phase's own dated research files name them
// throughout. A mention-scan would force those documents to be edited so that a scan could
// pass, which is the one thing this plan forbids. The scan therefore looks for the directive
// where it would actually do something: on the left-hand side of an assignment — the shape
// `lib_extra_dirs = ../../shared/libs` takes in a `platformio.ini`, and the shape an
// assignment takes in a build script or a source file.
//
// The exception list below is the reviewed record of the files permitted to NAME a
// directive. It is deliberately a literal list rather than a pattern: a new file that names
// one of these strings is a failure to be looked at rather than a silent pass, and widening
// the list costs the same review a new repository rule costs. It enumerates only what is
// needed today — the two directories that carry the dated research and plan files are named
// rather than the whole planning tree, so a NEW planning file elsewhere still fails.

/** The two global-library directives PlatformIO deprecated in Core 6.0 and will remove. */
const DEPRECATED_DIRECTIVES = ["lib_extra_dirs", "globallib_dir"];

/** The reviewed literal list of tracked files permitted to NAME a deprecated directive. */
const DIRECTIVE_MENTION_EXCEPTIONS = [
  // The agent guide: its avoid table names both, and must keep naming them.
  "AGENTS.md",
  // The project brief: its constraint and key-decision tables name one of them.
  ".planning/PROJECT.md",
  // The requirement document: its out-of-scope table names both, by design.
  ".planning/REQUIREMENTS.md",
  // The roadmap: its criteria state the rule, and plan 03-03 records the readings beside it.
  ".planning/ROADMAP.md",
  // The dated research, plan, summary, verification and UAT files, by directory.
  ".planning/phases/",
  ".planning/research/",
  // This scan's own source: it names both directives because it searches for them.
  "tools/tests/check-hal-seam.test.mjs",
];

/**
 * The lines of one file's text that USE a deprecated directive, as an empty list when the
 * file names neither or mentions them only in prose.
 *
 * A use is a line whose left-hand side is the directive and whose separator is an equals
 * sign. A prose sentence, a markdown table row, a `grep -E 'a|b'` argument and a JavaScript
 * array literal are none of those — which is exactly the distinction this case rests on,
 * and the reason the predicate is a shape test rather than a substring test.
 *
 * @param {string} text the file's contents
 * @returns {Array<{line: number, text: string}>}
 */
function directiveUses(text) {
  const offenders = [];
  text.split("\n").forEach((line, index) => {
    const assignment = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(line);
    if (assignment !== null && DEPRECATED_DIRECTIVES.includes(assignment[1])) {
      offenders.push({ line: index + 1, text: line.trim() });
    }
  });
  return offenders;
}

/**
 * Read a file as text, or null when it is not text at all.
 *
 * The tracked tree ships no binary today, but the scan reads EVERY tracked file, so a
 * future image would otherwise be decoded as UTF-8 and matched against by accident. A NUL
 * byte is the same heuristic git itself uses to call a blob binary.
 *
 * @param {string} absPath absolute path of the tracked file
 * @returns {string | null}
 */
function readTrackedText(absPath) {
  const buffer = readFileSync(absPath);
  return buffer.includes(0) ? null : buffer.toString("utf8");
}

/** The tracked files that name either deprecated directive, in the order git returned them. */
function filesNamingDirectives(root, files) {
  return files.filter((file) => {
    const text = readTrackedText(join(root, file));
    return text !== null && DEPRECATED_DIRECTIVES.some((directive) => text.includes(directive));
  });
}

/**
 * Everything wrong with one file list, as an empty list when the tree is clean.
 *
 * Two questions are asked of the same list, and both must come back empty: does any file
 * USE a directive, and does any file NAME one without being on the reviewed exception list.
 *
 * Returned rather than thrown, so the real-tree arm and the fixture arm run the SAME
 * predicate. A fixture arm holding its own private check would prove nothing about the tree
 * the repository is actually held to — the same reason `manifestProblems` and
 * `consumerProblems` above return their findings.
 *
 * @param {string} root the tree the file names are relative to
 * @param {string[]} files tracked file paths, relative to `root`
 * @param {string[]} [exceptions] the reviewed list of files permitted to name a directive
 * @returns {string[]}
 */
function directiveProblems(root, files, exceptions = DIRECTIVE_MENTION_EXCEPTIONS) {
  const problems = [];

  for (const file of files) {
    let text;
    try {
      text = readTrackedText(join(root, file));
    } catch (error) {
      // Loud, not silent: a file the scan could not read must not read as a file that was
      // clean, which is the same failure the seam check's zero-library branch exists for.
      problems.push(`${file} is tracked but could not be read: ${error.message}`);
      continue;
    }
    if (text === null) continue;

    for (const offender of directiveUses(text)) {
      problems.push(
        `${file}:${offender.line} uses the deprecated directive ${JSON.stringify(offender.text)} — the live-path form is lib_deps = <Name>=symlink://../../shared/lib/<Name>`,
      );
    }

    const named = DEPRECATED_DIRECTIVES.filter((directive) => text.includes(directive));
    const permitted = exceptions.some((allowed) => file.startsWith(allowed));
    if (named.length > 0 && !permitted) {
      problems.push(
        `${file} names ${named.join(" and ")} without being on the reviewed exception list — look at the file, then either widen the list in this case deliberately or remove the mention`,
      );
    }
  }

  return problems;
}

/**
 * The repository's tracked file list as git reports it, or a loud failure.
 *
 * `--cached` is the index rather than the working tree — the set a clone actually inherits —
 * and `-z` keeps a path holding a space or a quote intact. Resolved through the same spawn
 * idiom `ignore-rules.test.mjs` uses, so a git failure is an assertion failure and never an
 * empty list that reads as a clean repository.
 *
 * @returns {string[]}
 */
function trackedFiles() {
  const result = spawnSync("git", ["ls-files", "--cached", "-z"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert.equal(
    result.status,
    0,
    `git ls-files failed in ${REPO_ROOT}: ${result.stderr || result.error?.message}`,
  );
  return result.stdout.split("\0").filter((path) => path !== "");
}

test("no tracked file uses a deprecated global-library directive, and only the reviewed list names one", () => {
  const files = trackedFiles();

  // A scan over nothing passes for the wrong reason. This is the same guard the seam check's
  // zero-library branch carries, and it is the first thing a broken git invocation produces.
  assert.ok(
    files.length > 0,
    `git reported no tracked file under ${REPO_ROOT}, so the scan below would pass vacuously`,
  );

  assert.deepEqual(
    directiveProblems(REPO_ROOT, files),
    [],
    `the tracked tree is not clean — each line names a file and what to do about it`,
  );

  // The reading the plan records, asserted rather than left to a hand-written list: the tree
  // must still contain files that name a directive, or the exception list has silently become
  // an unfalsifiable claim about documents that no longer say what it says they say.
  const naming = filesNamingDirectives(REPO_ROOT, files);
  assert.ok(
    naming.length > 0,
    "no tracked file names either directive, so the exception list above guards nothing and a widened list would be invisible",
  );
});

test("the directive scan reports a planted use, and reads the same string in prose as a mention", () => {
  // The falsification arm. Without it the case above would pass on a scan that silently
  // matched nothing — the failure mode the seam check's empty case exists to prevent, and
  // the reason both live in this suite.
  const root = makeTree();
  const planted = writeFileAt(
    root,
    "homeworks/planted-directive/platformio.ini",
    [
      "[platformio]",
      "; this comment names lib_extra_dirs, which is a mention and not a use",
      "lib_extra_dirs = ../../shared/libs",
      "",
    ].join("\n"),
  );

  const problems = directiveProblems(root, ["homeworks/planted-directive/platformio.ini"]);
  assert.ok(
    problems.some(
      (problem) =>
        problem.includes("homeworks/planted-directive/platformio.ini") &&
        problem.includes("uses the deprecated directive") &&
        problem.includes("lib_extra_dirs"),
    ),
    `the planted use was not reported, so the predicate can match nothing: ${JSON.stringify(problems)} (${planted})`,
  );

  // The other half of the shape test: the same string in a sentence, in a file that is not on
  // the exception list, is a *mention* — reported for review, never as a use. Both halves are
  // asserted together because a scan that reported every mention would also pass the arm above.
  const prose = writeFileAt(root, "notes.md", "Never write lib_extra_dirs in a project file.\n");
  const proseProblems = directiveProblems(root, ["notes.md"]);
  assert.ok(
    proseProblems.some((problem) => problem.includes("reviewed exception list")),
    `a mention outside the reviewed exception list went unreported: ${JSON.stringify(proseProblems)} (${prose})`,
  );
  assert.ok(
    !proseProblems.some((problem) => problem.includes("uses the deprecated directive")),
    `a prose mention was reported as a use, so the scan is a substring search: ${JSON.stringify(proseProblems)} (${prose})`,
  );
});
