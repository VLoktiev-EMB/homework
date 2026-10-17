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

import {
  DEFAULT_SHARED_LIBS,
  cleanupAll,
  makeSharedLibTree,
  makeTree,
  runSeamCheck,
} from "./helpers.mjs";

test.after(cleanupAll);

/** A spawned check's output, whichever channel it chose. */
function outputOf(result) {
  return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}

test("a framework include planted under the shared tree is named and refused", () => {
  const fixture = makeSharedLibTree(makeTree(), DEFAULT_SHARED_LIBS, {
    plantInclude: { in: "emb_log", include: "Arduino.h" },
  });

  const result = runSeamCheck(fixture.root);
  const output = outputOf(result);

  assert.notEqual(
    result.status,
    0,
    `the check exited 0 on a tree carrying a framework include (${fixture.root}):\n${output}`,
  );
  assert.ok(
    output.includes("shared/lib/emb_log/src/emb_log.c"),
    `the check did not name the file the include was planted in (${fixture.root}):\n${output}`,
  );
  assert.ok(
    output.includes("Arduino.h"),
    `the check did not name the include it found (${fixture.root}):\n${output}`,
  );
});
