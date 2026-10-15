// The discovery contract: what counts as a homework, and what does not.
//
// Every fixture is built under `os.tmpdir()` by `helpers.mjs`; nothing here
// reads the repository's own tree.
import assert from "node:assert/strict";
import test from "node:test";

import { ID_PATTERN, discoverHomeworks, envNames } from "../lib/discover.mjs";
import { cleanupAll, makeHomework, makeTree } from "./helpers.mjs";

test.after(cleanupAll);

test("the id grammar accepts a zero-padded module-lesson id", () => {
  assert.ok(ID_PATTERN.test("m01-l03-blink"));
});

test("the id grammar rejects an id whose numbers are not zero-padded", () => {
  assert.equal(ID_PATTERN.test("m1-l3-blink"), false);
});

test("discoverHomeworks finds a directory that carries a platformio.ini", () => {
  const root = makeTree();
  makeHomework(root, "project-baseline");

  const { found, malformed, violations } = discoverHomeworks(root);

  assert.deepEqual(found, [{ id: "project-baseline", dir: "homeworks/project-baseline" }]);
  assert.deepEqual(malformed, []);
  assert.deepEqual(violations, []);
});

test("envNames derives the project-scoped pair from the id", () => {
  assert.deepEqual(envNames("project-baseline"), {
    s3: "projectbaseline_s3",
    native: "projectbaseline_native",
  });
});
