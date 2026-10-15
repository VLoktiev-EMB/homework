// The ignore contract, asserted against git itself rather than by reading patterns.
//
// Git is the oracle here. A rule that is written in the file but does not match is
// indistinguishable from a missing rule, and a bare `check-ignore -q` proves nothing
// about a fresh clone: this machine's `~/.config/git/ignore` already matches some of
// these paths, so an exit-status-only check can pass with no repository rule at all.
// Every member of the ignored table therefore asserts the *source* git reports as
// well as the exit status, and the source must be this repository's own `.gitignore`.
//
// Read-only by construction: `git check-ignore` and `git ls-files` answer about the
// real tree without writing to it, so this file needs no temporary fixture and must
// not build one. Nothing here duplicates the sweep's or the generator's coverage.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

// Two directories up from `tools/tests/`.
const TESTS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(TESTS_DIR, "..", "..");
const IGNORE_FILE = ".gitignore";

/** Run git in the repository root and return the child result. No shell, argv array only. */
function git(args) {
  return spawnSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" });
}

/**
 * The source `git check-ignore -v` reports for a path, or `null` when it is not ignored.
 *
 * `check-ignore -v` prints `<source>:<lineno>:<pattern>\t<pathname>`; the source is the
 * first colon-separated field, which is the field that distinguishes the repository's own
 * ignore file from a machine-local excludes file.
 */
function ignoreSource(path) {
  const result = git(["check-ignore", "-v", path]);
  if (result.status !== 0) return null;
  const [reported] = result.stdout.trim().split("\t");
  return reported.split(":")[0];
}

// Paths that must be ignored BY THIS REPOSITORY. The `protects` note states which rule each
// member stands for, so a future edit to the ignore file fails with a reason rather than a
// bare status.
const MUST_BE_IGNORED = [
  {
    path: ".planning/milestone.lock",
    protects: "the GSD lock-file class — the artifact that shipped unignored",
  },
  {
    path: ".planning/state.json",
    protects: "the generated, timestamped GSD state file",
  },
  {
    path: ".planning/research/.cache/",
    protects: "the research seam's cache directory inside the tracked research tree",
  },
  {
    path: ".DS_Store",
    protects: "OS junk at the repository root",
  },
  {
    path: "homeworks/project-baseline/.pio/",
    protects: "the PlatformIO build directory, at any depth",
  },
  {
    path: "homeworks/project-baseline/compile_commands.json",
    protects: "the compilation database, which carries absolute toolchain paths",
  },
  {
    path: ".vscode/c_cpp_properties.json",
    protects: "generated editor state carrying absolute machine paths",
  },
  {
    path: ".vscode/launch.json",
    protects: "generated editor state carrying absolute machine paths",
  },
  {
    path: ".claude/settings.local.json",
    protects: "machine-local editor settings, ignored by the repository and not only by this machine",
  },
  {
    path: "server.pem",
    protects: "the certificate/key secret extensions",
  },
];

// Paths that must stay UNIGNORED. Each is a plausible first-draft near-miss: a wildcard
// written one segment wider swallows one of these.
const MUST_NOT_BE_IGNORED = [
  {
    path: "sdkconfig.defaults",
    protects: "the hand-authored half of the generated-plus-authored ESP-IDF pair",
  },
  {
    path: ".planning/config.json",
    protects: "the tracked planning configuration — the guard that keeps the lock glob honest",
  },
  {
    path: ".planning/PROJECT.md",
    protects: "the tracked project brief, and the rest of the tracked planning data with it",
  },
  {
    path: ".claude/skills/new-homework/SKILL.md",
    protects: "Phase 7's skill mirrors, reached through the agent directory",
  },
  {
    path: "build/",
    protects: "a bare top-level build directory, which no Phase 1 rule claims",
  },
];

test("every machine-local artifact resolves to this repository's own ignore file", () => {
  for (const { path, protects } of MUST_BE_IGNORED) {
    const source = ignoreSource(path);
    assert.notEqual(source, null, `${path} is not ignored at all — protects ${protects}`);
    assert.equal(
      source,
      IGNORE_FILE,
      `${path} is ignored by ${source}, not by ${IGNORE_FILE} — a clone without that file inherits nothing; protects ${protects}`,
    );
  }
});

test("every hand-authored or tracked counterpart stays unignored", () => {
  for (const { path, protects } of MUST_NOT_BE_IGNORED) {
    const result = git(["check-ignore", "-q", path]);
    assert.equal(
      result.status,
      1,
      `${path} is ignored — protects ${protects}; the rule was widened past what it was written for`,
    );
  }
});

test("no tracked path is hidden by the ignore configuration", () => {
  // The guard that keeps a deliberately broad glob honest without a hand-written survivor
  // list: git answers over its own index, so this cannot go stale when someone tracks a
  // new file. An empty answer is the only correct one.
  const result = git(["ls-files", "-i", "-c", "--exclude-standard"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    result.stdout,
    "",
    "a path git tracks has become ignored — one segment too many was added to a rule",
  );
});

test("the tracked planning data the phase ships is still tracked", () => {
  const expected = [
    ".planning/PROJECT.md",
    ".planning/REQUIREMENTS.md",
    ".planning/ROADMAP.md",
    ".planning/STATE.md",
    ".planning/config.json",
  ];

  const result = git(["ls-files", ...expected]);
  const tracked = result.stdout.trim().split("\n");

  // The lock glob sits beside this data, so the list is asserted rather than assumed: a
  // rule that reached one segment further would drop one of these from the index.
  assert.deepEqual(tracked, expected);
});

test("no line outside column 1 of the ignore file carries a comment marker", () => {
  // Gitignore has no inline comments: `#` opens a comment only at the beginning of a line,
  // so a trailing comment becomes part of the pattern and silently disables it. This is the
  // defect that would let a secret reach a public repository from the one file whose whole
  // job is to prevent that.
  const offenders = readFileSync(join(REPO_ROOT, IGNORE_FILE), "utf8")
    .split("\n")
    .filter((line) => /^[^#][^#]*#/.test(line));

  assert.deepEqual(offenders, []);
});
