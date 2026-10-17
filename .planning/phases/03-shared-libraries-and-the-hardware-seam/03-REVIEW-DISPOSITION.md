---
phase: 03
review: 03-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: open
    title: "`EMB_LOG_LINE_MAX` is published as the caller's buffer size, but the caller's real text budget is 86 characters — a longer line is dropped, not truncated"
  - id: WR-02
    severity: warning
    disposition: open
    title: "the baseline shim discards `emb_log_line`'s return value, so a dropped report is indistinguishable from a delivered one"
  - id: WR-03
    severity: warning
    disposition: open
    title: "the seam check's matcher recognises one Arduino-core header name and five framework prefixes, so the seam can break without the gate noticing"
  - id: WR-04
    severity: warning
    disposition: open
    title: "`shared/lib/README.md` states that no gate in the repository checks a manifest's `version`, and this phase's own suite does"
  - id: WR-05
    severity: warning
    disposition: open
    title: "four of the nine `uartBegin` arguments are unexplained literals in the one file permitted to touch the framework"
  - id: IN-01
    severity: info
    disposition: open
    title: "the root README's repository map omits `tools/check-hal-seam.mjs`"
  - id: IN-02
    severity: info
    disposition: open
    title: "the directive scan's mention exceptions are matched by prefix, so a file entry exempts more than the file"
  - id: IN-03
    severity: info
    disposition: open
    title: "the string `\"shared/lib\"` is defined twice, by the check and by the fixture builder"
  - id: IN-04
    severity: info
    disposition: open
    title: "an unreadable path or a file where a directory is expected crashes the check instead of producing its named refusal"
  - id: IN-05
    severity: info
    disposition: open
    title: "`emb_hal_write_line` writes the line and its terminator as two independent UART transactions, and the interleaving window is unrecorded"
  - id: IN-06
    severity: info
    disposition: open
    title: "both new comments locate `monitor_speed` in the project's `platformio.ini`, where it is not"
  - id: IN-07
    severity: info
    disposition: open
    title: "the seam's `millis()` and `ready()` accessors, and three exports of the seam check, have no consumer in the tree"
  - id: IN-08
    severity: info
    disposition: open
    title: "`uartBegin`'s documented failure mode is a clean `NULL`, and the installed core dereferences it on that path"
open: 13
total: 13
recorded: 2026-10-17T00:33:26.915Z
---

# Phase 03: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| WR-04 | warning | open | - |
| WR-05 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |
| IN-05 | info | open | - |
| IN-06 | info | open | - |
| IN-07 | info | open | - |
| IN-08 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
