// The baseline environment contract, asserted against the real repository read-only.
//
// Three files carry ROADMAP criterion 3 and the static halves of HW-01 and HW-04: the
// shared fragment every project reaches through its `extra-configs` key, the project
// that consumes it, and the version record beside the fragment. Nothing here spawns a
// PlatformIO process. `pio project config` is the reader that reports the *resolved*
// configuration, and it is deliberately not spawned: this suite is pure Node today,
// and adding a child process would couple every task commit to a binary the repository
// cannot assume is resolvable. The resolved reading is taken once and recorded in the
// phase log; what this file gates is that an edit dropping a required value turns the
// suite red — which is the half a run of `pio` cannot give, because a fragment that is
// not there and a key that is not set both exit zero.
//
// Read-only by construction, in the stance of `ignore-rules.test.mjs`: the static facts
// are asserted against the real tree, and the one fixture this file builds lives under
// `os.tmpdir()` and is removed by `test.after`. Nothing here duplicates the sweep's or
// the generator's coverage.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { cleanupAll, makeFragmentConsumer, makeTree } from "./helpers.mjs";

test.after(cleanupAll);

// Two directories up from `tools/tests/`.
const TESTS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(TESTS_DIR, "..", "..");

const BASELINE_DIR = join(REPO_ROOT, "homeworks", "project-baseline");
const BASELINE_INI = join(BASELINE_DIR, "platformio.ini");
const FRAGMENT_PATH = join(REPO_ROOT, "shared", "pio", "base.ini");
const RECORD_PATH = join(REPO_ROOT, "shared", "pio", "VERSIONS.md");

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
 * silently — flagged, not hidden.
 */
function sections(text) {
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

/** The `extra-configs` value a project declares, exactly as the file writes it. */
function extraConfigsValue(iniPath) {
  const declared = sections(readFileSync(iniPath, "utf8")).get("platformio")?.get("extra_configs");
  assert.ok(declared, `${iniPath} declares no extra_configs key`);
  return declared;
}

/**
 * Resolve a project-relative `extra-configs` path the way PlatformIO does — against the
 * project's own directory, not against the repository root and not against the cwd.
 */
function resolveFromProject(projectDir, declared) {
  return join(projectDir, declared);
}

// The fragment's required keys, kept as data with the reason each is required, so an
// edit that drops one fails with the reason rather than a bare status.
const REQUIRED_FRAGMENT_KEYS = [
  {
    key: "board_upload.flash_size",
    value: "16MB",
    reason: "the module carries 16 MB of flash, and the stock board definition's 8 MB would halve it",
  },
  {
    key: "board_build.partitions",
    value: "default_16MB.csv",
    reason: "the 16 MB partition table, which is what produces the 6553600-byte application partition",
  },
  {
    key: "board_build.arduino.memory_type",
    value: "qio_opi",
    reason:
      "quad-in / octal-PSRAM: this key decides which prebuilt IDF library set is linked, so a wrong value is a library-selection mistake",
  },
  {
    key: "build_flags",
    value: "-DBOARD_HAS_PSRAM",
    contains: true,
    reason:
      "without the PSRAM define the PSRAM HAL is compiled out, so psramFound() cannot report on hardware that has it",
  },
  {
    key: "monitor_speed",
    value: "115200",
    reason: "the UART bridge honours the baud rate — the 9600 default prints garbage",
  },
  {
    key: "upload_port",
    value: "/dev/cu.usbmodem*",
    reason:
      "the measured bridge prefix; the previously committed /dev/cu.usbserial-* matched no node, and nothing else in the suite would catch a revert",
  },
  { key: "monitor_port", value: "/dev/cu.usbmodem*", reason: "the same measured bridge prefix" },
  { key: "test_port", value: "/dev/cu.usbmodem*", reason: "the same measured bridge prefix" },
];

// The keys each project names for itself, with the reason each is required. They are
// deliberately NOT in the fragment's [env] block: extra_configs merges that block into every
// environment of every consuming project, and the ini format can only overwrite an inherited
// key, never unset it. A `platform = native` environment must name neither, so putting them in
// the fragment would make that environment impossible. Each project's own [env:<id>_s3] names
// them instead, which is why the value the phase measured is gated here rather than left to
// the diff.
const REQUIRED_PROJECT_KEYS = [
  {
    key: "board",
    value: "esp32-s3-devkitc-1",
    reason: "the N16R8 devkit board id the fragment's four overrides are written against",
  },
  {
    key: "framework",
    value: "arduino",
    reason: "the Arduino core is what the four overrides and the PSRAM flag were measured against",
  },
];

// The version record's required names, each with the reason it is required.
const REQUIRED_RECORD_ENTRIES = [
  {
    match: "espressif32 @ 7.1.3",
    reason: "the resolved platform and its exact version — the fact ROADMAP criterion 3 exists for",
  },
  {
    match: "framework-arduinoespressif32",
    reason: "the resolved Arduino framework package every build compiles against",
  },
  {
    match: "tool-esptoolpy",
    reason: "the resolved uploader package, which is what flashes the board",
  },
  {
    match: "toolchain-xtensa-esp32s3",
    reason: "the resolved compiler toolchain the Arduino build uses",
  },
];

test("the baseline project's extra-configs key resolves to the shared fragment", () => {
  const declared = extraConfigsValue(BASELINE_INI);
  const resolved = resolveFromProject(BASELINE_DIR, declared);

  assert.equal(
    resolved,
    FRAGMENT_PATH,
    `the baseline's extra_configs key "${declared}" resolves to ${resolved}, which is not the shared fragment this phase records`,
  );
  assert.ok(
    existsSync(resolved),
    `no fragment at ${resolved} — the path the extra_configs key "${declared}" resolves to`,
  );
});

test("the resolved-path check distinguishes a correct layout from a misplaced or absent one", () => {
  const correct = makeFragmentConsumer(makeTree(), "project-baseline");
  const correctResolved = resolveFromProject(correct.homeDir, extraConfigsValue(correct.iniPath));
  assert.ok(
    existsSync(correctResolved),
    `the correct fixture layout resolved to ${correctResolved}, where its fragment was planted — the check is wrong, not the fixture`,
  );

  const misplaced = makeFragmentConsumer(makeTree(), "project-baseline", { wrongPath: true });
  const misplacedResolved = resolveFromProject(misplaced.homeDir, extraConfigsValue(misplaced.iniPath));
  assert.equal(
    existsSync(misplacedResolved),
    false,
    `a fragment planted at ${misplaced.fragmentPath} satisfied a check looking at ${misplacedResolved} — the assertion cannot tell a correct location from a wrong one`,
  );

  const absent = makeFragmentConsumer(makeTree(), "project-baseline", { fragment: false });
  const absentResolved = resolveFromProject(absent.homeDir, extraConfigsValue(absent.iniPath));
  assert.equal(
    existsSync(absentResolved),
    false,
    `an omitted fragment still satisfied a check looking at ${absentResolved} — the silent missing-fragment case is not covered`,
  );
});

test("the fragment carries the N16R8 module overrides and the PSRAM build flag", () => {
  const fragment = sections(readFileSync(FRAGMENT_PATH, "utf8"));
  const defaults = fragment.get("env");

  assert.ok(
    defaults,
    `${FRAGMENT_PATH} declares no bare [env] defaults block — the fragment is a shared layer, and every project inherits from that block`,
  );

  const environments = [...fragment.keys()].filter((name) => name.startsWith("env:"));
  assert.deepEqual(
    environments,
    [],
    `${FRAGMENT_PATH} declares ${environments.join(", ")} — the fragment is a shared defaults layer and must declare no environment of its own`,
  );

  for (const { key, value, contains, reason } of REQUIRED_FRAGMENT_KEYS) {
    const actual = defaults.get(key);
    assert.ok(actual !== undefined, `the fragment does not set ${key} — ${reason}`);

    if (contains) {
      assert.ok(
        actual.split(/\s+/).includes(value),
        `the fragment's ${key} is "${actual}", which does not carry ${value} — ${reason}`,
      );
    } else {
      assert.equal(actual, value, `the fragment's ${key} is "${actual}", not "${value}" — ${reason}`);
    }
  }
});

test("the baseline project names its own board and framework, and the fragment does not", () => {
  const project = sections(readFileSync(BASELINE_INI, "utf8"));
  const defaults = sections(readFileSync(FRAGMENT_PATH, "utf8")).get("env") ?? new Map();

  // The fragment must not carry these: extra_configs merges its [env] block into every
  // environment of every consuming project and an inherited key cannot be unset, so a
  // `platform = native` environment could not exist if board or framework lived there.
  for (const { key } of REQUIRED_PROJECT_KEYS) {
    assert.equal(
      defaults.get(key),
      undefined,
      `the fragment's [env] block sets ${key} — it is inherited by every environment of every consuming project and cannot be unset, so each project must name it instead and a platform = native environment must stay possible`,
    );
  }

  const environments = [...project.keys()].filter(
    (name) => name.startsWith("env:") && name.endsWith("_s3"),
  );
  assert.ok(
    environments.length > 0,
    `${BASELINE_INI} declares no [env:<id>_s3] section — the Arduino environment the board and framework belong to`,
  );

  for (const name of environments) {
    const env = project.get(name);
    for (const { key, value, reason } of REQUIRED_PROJECT_KEYS) {
      assert.equal(
        env.get(key),
        value,
        `${name}'s ${key} is "${env.get(key)}", not "${value}" — ${reason}`,
      );
    }
  }
});

test("the version record names the resolved package set", () => {
  const record = readFileSync(RECORD_PATH, "utf8");

  for (const { match, reason } of REQUIRED_RECORD_ENTRIES) {
    assert.ok(record.includes(match), `shared/pio/VERSIONS.md does not name ${match} — ${reason}`);
  }
});

test("the version record carries no machine-local path", () => {
  // The listing tool's verbose form appends an absolute package-cache prefix. Copying it
  // is one keystroke away and would expose a private machine detail in a public history
  // forever, so the absence is asserted rather than left to a reader's eye.
  const offenders = readFileSync(RECORD_PATH, "utf8")
    .split("\n")
    .filter((line) => /\/Users\/|\/home\/|\/opt\/|\.platformio\//.test(line));

  assert.deepEqual(
    offenders,
    [],
    "a machine-local package or toolchain path reached the public record — the non-verbose listing form is trimmed to name and version for exactly this reason",
  );
});

test("every environment the baseline declares pins the platform to an exact version", () => {
  const project = sections(readFileSync(BASELINE_INI, "utf8"));

  // The defaults layer the fragment contributes, read for inheritance only. The
  // machine-readable reader reports environments as `env:<name>` entries and does not
  // surface this bare block as one, so it must never be selected as an environment.
  const defaults = sections(readFileSync(FRAGMENT_PATH, "utf8")).get("env") ?? new Map();

  const environments = [...project.keys()].filter((name) => name.startsWith("env:"));
  assert.ok(
    environments.length > 0,
    `${BASELINE_INI} declares no [env:<name>] section — a project carrying only the extra-configs key creates no environment at all`,
  );

  for (const name of environments) {
    const platform = project.get(name).get("platform") ?? defaults.get("platform");
    assert.ok(platform, `${name} has no platform value, directly or inherited — the pin is the environment's`);

    // `native` is the platform's whole specification; it has no version to pin, and pinning it
    // as `native@<ver>` is legal but not the canonical form every native project uses. Everything
    // else is pinned. The project README announces a `projectbaseline_native` environment, so the
    // rule must let the spelling that environment will carry through instead of turning it red.
    if (platform === "native") continue;

    assert.match(
      platform,
      /@\d/,
      `${name} pins "${platform}", which names no exact version: an "@" followed by a digit is required, and a range is not a pin`,
    );
    assert.ok(
      !platform.includes("#"),
      `${name} pins "${platform}", which carries a branch marker ("#") — a released version is required, never a development branch`,
    );
  }
});
