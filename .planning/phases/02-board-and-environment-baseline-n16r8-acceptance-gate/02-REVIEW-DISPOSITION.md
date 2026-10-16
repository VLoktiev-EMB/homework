---
phase: 02
review: 02-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: open
    title: "the fragment injects `board` and `framework` into every environment, and PlatformIO cannot unset an inherited key — the documented `native` environment is impossible"
  - id: WR-01
    severity: warning
    disposition: open
    title: "the gate's ini parser models inline comments backwards, so a pin hidden in a trailing comment passes the pin assertion"
  - id: WR-02
    severity: warning
    disposition: open
    title: "six of the fragment's twelve keys are ungated, including the port glob this phase changed"
  - id: WR-03
    severity: warning
    disposition: open
    title: "an `espidf` environment inherits the Arduino partition table and fails to build"
  - id: WR-04
    severity: warning
    disposition: open
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
open: 8
total: 8
recorded: 2026-10-16T21:03:36.598Z
---

# Phase 02: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | open | - |
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| WR-04 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
