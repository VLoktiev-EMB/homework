---
phase: 01
review: 01-REVIEW.md
titles: json
findings:
  - id: CR-02
    severity: critical
    disposition: open
    title: "`isRepoOwnedIgnoreSource` exempts the root `.gitignore` from the very check it exists to perform — a silent false green"
  - id: WR-10
    severity: warning
    disposition: open
    title: "The \"no tracked path is hidden\" guard is not hermetic — a machine-local exclude makes it red and the message blames the repository's own rule"
  - id: WR-11
    severity: warning
    disposition: open
    title: "The inline-comment guard rejects a valid escaped-hash pattern"
  - id: WR-12
    severity: warning
    disposition: open
    title: "The comment-marker guard reads one of the repository's two tracked ignore files, so a silently disabled rule in the other is invisible"
  - id: WR-13
    severity: warning
    disposition: open
    title: "The nested project's generated `.vscode/*` rules are asserted nowhere, so the 64 KB absolute-path file is protected by one unpinned line"
  - id: WR-14
    severity: warning
    disposition: open
    title: "The newly committed `extensions.json` contradicts `.editorconfig`'s JSON indentation rule — the mirror image of WR-04"
  - id: IN-07
    severity: info
    disposition: open
    title: "The ignore-contract test cannot tell \"git could not run\" from \"the rule was widened\""
  - id: IN-09
    severity: info
    disposition: open
    title: "The new docstring's justification for tracking the nested ignore file is factually wrong for the first rule it names"
  - id: CR-01
    severity: critical
    disposition: open
    title: "The entry-point guard fails open — `--check` exits 0 without checking when the script path carries a symlink"
  - id: WR-01
    severity: warning
    disposition: open
    title: "The depth rule is evaluated against the filesystem, not the committed tree — `.pio/` can turn the repo-wide gate red"
  - id: WR-02
    severity: warning
    disposition: open
    title: "`--list --allow-empty` prints a prose line on stdout, breaking the documented `--list` contract"
  - id: WR-03
    severity: warning
    disposition: open
    title: "The generator silently drops homeworks it cannot name, and exits 0"
  - id: WR-04
    severity: warning
    disposition: open
    title: "`.editorconfig` assigns 4-space indent to `homework.code-workspace`, but the generator emits 2 spaces"
  - id: WR-05
    severity: warning
    disposition: open
    title: "`envNames()` encodes a rule that nothing enforces"
  - id: WR-06
    severity: warning
    disposition: open
    title: "Format-on-save is enabled for C/C++ with no `.clang-format` in the repository, and the only committed C++ file is unstable under it"
  - id: WR-07
    severity: warning
    disposition: open
    title: "The default-root test hard-codes this repository's current contents and contradicts its own file header"
  - id: WR-08
    severity: warning
    disposition: open
    title: "A test requires a working PlatformIO installation, with no skip guard"
  - id: IN-01
    severity: info
    disposition: open
    title: "`findDepthViolations` builds violation paths by slicing, so a non-normalized `repoRoot` yields a garbled path"
  - id: IN-02
    severity: info
    disposition: open
    title: "`installTools` leaves an empty `tools/tests/` directory in every fixture"
  - id: IN-03
    severity: info
    disposition: open
    title: "`resolvePio` accepts a `pio` that starts but exits non-zero, and hard-codes the POSIX virtualenv path"
  - id: IN-04
    severity: info
    disposition: open
    title: "One unit test asserts nothing"
  - id: IN-05
    severity: info
    disposition: open
    title: "The root README documents neither the sweep gate nor the test command, and overstates `AGENTS.md`'s role"
  - id: IN-06
    severity: info
    disposition: open
    title: "Nested workspace roots may prevent the root `.vscode/settings.json` from reaching homework files"
  - id: IN-08
    severity: info
    disposition: open
    title: "Unknown flags are silently ignored, and the mutating path is the default"
  - id: WR-09
    severity: warning
    disposition: open
    title: "`.planning/milestone.lock` is untracked and unignored — the tree is dirty, which the `.gitignore` section above it exists to prevent"
open: 25
total: 25
recorded: 2026-10-16T11:42:39.058Z
---

# Phase 01: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-02 | critical | open | - |
| WR-10 | warning | open | - |
| WR-11 | warning | open | - |
| WR-12 | warning | open | - |
| WR-13 | warning | open | - |
| WR-14 | warning | open | - |
| IN-07 | info | open | - |
| IN-09 | info | open | - |
| CR-01 | critical | open | - (not in the current review) |
| WR-01 | warning | open | - (not in the current review) |
| WR-02 | warning | open | - (not in the current review) |
| WR-03 | warning | open | - (not in the current review) |
| WR-04 | warning | open | - (not in the current review) |
| WR-05 | warning | open | - (not in the current review) |
| WR-06 | warning | open | - (not in the current review) |
| WR-07 | warning | open | - (not in the current review) |
| WR-08 | warning | open | - (not in the current review) |
| IN-01 | info | open | - (not in the current review) |
| IN-02 | info | open | - (not in the current review) |
| IN-03 | info | open | - (not in the current review) |
| IN-04 | info | open | - (not in the current review) |
| IN-05 | info | open | - (not in the current review) |
| IN-06 | info | open | - (not in the current review) |
| IN-08 | info | open | - (not in the current review) |
| WR-09 | warning | open | - (not in the current review) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
