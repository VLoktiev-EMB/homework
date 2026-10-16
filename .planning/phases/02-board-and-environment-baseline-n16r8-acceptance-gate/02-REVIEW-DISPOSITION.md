---
phase: 02
review: 02-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: fixed
    title: "the fragment injects `board` and `framework` into every environment, and PlatformIO cannot unset an inherited key — the documented `native` environment is impossible"
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "the gate's ini parser models inline comments backwards, so a pin hidden in a trailing comment passes the pin assertion"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "six of the fragment's twelve keys are ungated, including the port glob this phase changed"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "an `espidf` environment inherits the Arduino partition table and fails to build"
  - id: WR-04
    severity: warning
    disposition: fixed
    title: "the pin rule rejects the natural spelling of the `native` environment the project README says is coming"
  - id: IN-01
    severity: info
    disposition: open
    title: "`makeFragmentConsumer` returns a `declared` field no caller reads"
  - id: IN-02
    severity: info
    disposition: open
    title: "the pin rule is scoped to the baseline, while the README states it repository-wide"
  - id: IN-03
    severity: info
    disposition: open
    title: "adjacent — the phase summary's `AGENTS.md` correction item does not correspond to anything in `AGENTS.md`"
open: 3
total: 8
recorded: 2026-10-16T21:09:42.787Z
---

# Phase 02: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | fixed | 0ca6098 |
| WR-01 | warning | fixed | a29eb5c |
| WR-02 | warning | fixed | 865fae3 |
| WR-03 | warning | fixed | f361cb0 |
| WR-04 | warning | fixed | 4f65949 |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |

Four rows above — CR-01, WR-01, WR-02 and WR-04 — were set to `fixed` **by hand**, not by the reconciler. The fix report titled those four findings differently from the review, so the reconciler could not prove the id still named the same finding and correctly declined to reconcile them rather than record a silent `fixed` (its own stated safe direction). Each commit was opened and checked against its finding before the row was written:

- `0ca6098` — moves `board` and `framework` out of the fragment's inherited `[env]` block into the project's own env section. Verified by re-taking the criterion-4 reading, which changed shape, and by a build that still reports `6553600`.
- `a29eb5c` — the gate's ini section parser now strips an inline `;`/`#` at its first occurrence, mirroring PlatformIO's own reader.
- `865fae3` — gates every fragment key plus the per-project `board`/`framework`, and adds the CR-01 regression guard that the fragment must not set them. The suite went 38 → 39 tests here.
- `4f65949` — lets the canonical `platform = native` spelling through the pin rule.

IN-03 is correct and was acted on outside this ledger: the phase summary's claim about `AGENTS.md` was false and has been replaced with what `grep` actually returns.

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
