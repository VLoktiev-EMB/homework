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
import test from "node:test";

import { ALLOWED } from "../check-hal-seam.mjs";

import {
  DEFAULT_SHARED_LIBS,
  EXEMPT_BACKEND,
  NEAR_MISS_BACKEND,
  cleanupAll,
  makeSharedLibTree,
  makeTree,
  runSeamCheck,
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
