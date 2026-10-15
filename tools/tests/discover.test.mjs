// The discovery contract: what counts as a homework, and what does not.
//
// Every fixture is built under `os.tmpdir()` by `helpers.mjs`; nothing here
// reads or writes the repository's own tree.
import assert from "node:assert/strict";
import test from "node:test";

import {
  ID_PATTERN,
  ID_PATTERN_TEXT,
  discoverHomeworks,
  envNames,
  findDepthViolations,
} from "../lib/discover.mjs";
import { cleanupAll, makeHomework, makeTree, writeFileAt } from "./helpers.mjs";

test.after(cleanupAll);

// The frozen grammar's accept/reject table, kept as data rather than as a
// hand-written case each, so a change to the grammar shows up in one place.
const ACCEPTED = [
  "m01-l03-blink",
  "m01-l03-blink-led",
  "project-baseline",
  "project-final-project",
  "project-baseline-v2",
  "m99-l99-a",
];

const REJECTED = [
  "m1-l3-blink",
  "m01-l3-blink",
  "M01-L03-Blink",
  "m01-l03-Blink",
  "m01-l03-",
  "m01-l03",
  "project-",
  "hw01-blink",
  "m01-l03-blink_led",
];

test("the id grammar accepts every course-shaped id", () => {
  for (const id of ACCEPTED) {
    assert.ok(ID_PATTERN.test(id), `expected the grammar to accept ${id}`);
  }
});

test("the id grammar rejects every malformed name", () => {
  for (const id of REJECTED) {
    assert.equal(ID_PATTERN.test(id), false, `expected the grammar to reject ${id}`);
  }
});

test("ID_PATTERN_TEXT is the pattern without its slashes", () => {
  assert.equal(ID_PATTERN_TEXT, ID_PATTERN.source);
});

test("discoverHomeworks finds a directory that carries a platformio.ini", () => {
  const root = makeTree();
  makeHomework(root, "project-baseline");

  const { found, malformed, violations } = discoverHomeworks(root);

  assert.deepEqual(found, [{ id: "project-baseline", dir: "homeworks/project-baseline" }]);
  assert.deepEqual(malformed, []);
  assert.deepEqual(violations, []);
});

test("a grammar-valid name without a platformio.ini is neither found nor malformed", () => {
  const root = makeTree();
  makeHomework(root, "m01-l03-scratch", { ini: false });

  const { found, malformed } = discoverHomeworks(root);

  assert.deepEqual(found, []);
  assert.deepEqual(malformed, []);
});

test("a directory with a platformio.ini but a malformed name is reported, not built", () => {
  const root = makeTree();
  makeHomework(root, "hw01-Blink");

  const { found, malformed } = discoverHomeworks(root);

  assert.deepEqual(found, []);
  assert.deepEqual(malformed, ["hw01-Blink"]);
});

test("an absent homeworks/ directory yields empty lists rather than throwing", () => {
  const root = makeTree();

  assert.deepEqual(discoverHomeworks(root), { found: [], malformed: [], violations: [] });
});

test("findDepthViolations is empty when every platformio.ini sits directly under a homework", () => {
  const root = makeTree();
  makeHomework(root, "m01-l03-blink");
  makeHomework(root, "project-baseline");

  assert.deepEqual(findDepthViolations(root), []);
});

test("findDepthViolations names a platformio.ini one level deeper", () => {
  const root = makeTree();
  makeHomework(root, "m01-l03-blink");
  writeFileAt(root, "homeworks/m01-l03-blink/deeper/platformio.ini", "[env:x]\n");

  assert.deepEqual(findDepthViolations(root), ["homeworks/m01-l03-blink/deeper"]);
});

test("discoverHomeworks reports the depth violation alongside what it found", () => {
  const root = makeTree();
  makeHomework(root, "m01-l03-blink");
  writeFileAt(root, "homeworks/m01-l03-blink/deeper/platformio.ini", "[env:x]\n");

  const { found, violations } = discoverHomeworks(root);

  assert.deepEqual(
    found.map((homework) => homework.id),
    ["m01-l03-blink"],
  );
  assert.deepEqual(violations, ["homeworks/m01-l03-blink/deeper"]);
});

test("envNames strips the hyphens and appends the project-scoped suffix", () => {
  assert.deepEqual(envNames("project-baseline"), {
    s3: "projectbaseline_s3",
    native: "projectbaseline_native",
  });
});

test("envNames returns equal values on repeated calls", () => {
  assert.deepEqual(envNames("m01-l03-blink"), envNames("m01-l03-blink"));
});
