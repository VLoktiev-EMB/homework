---
created: 2026-10-17T00:03:46.979Z
title: Add linters, formatters and pre-commit checks
area: tooling
severity: minor
files:
  - .planning/ROADMAP.md:135
  - .planning/ROADMAP.md:150
  - AGENTS.md
---

## Problem

The owner asked (2026-10-17) for linters, code-style checkers, autoformatters and
enforcement of all of it at the **pre-commit** stage.

**This is already roadmap work — do not plan it as new.** Two phases own it:

- **Phase 5 — Verification Layers and Pinned Static Checks** (`ROADMAP.md:135`), success
  criterion 3 (`:144`): "clang-format, clang-tidy and cppcheck are pinned to exact versions
  with committed configuration, and the committed clang-tidy configuration validates against
  the analyzer version PlatformIO bundles."
- **Phase 6 — Hook and CI Gates** (`ROADMAP.md:150`): "Pre-commit, pre-push and CI run the same
  checks, and a check cannot exist in one gate and be missing from another." Criterion 1 (`:157`)
  requires each fast check to be demonstrated by planting one violation per check and seeing the
  offending hook named and the commit refused.

The stack is already researched and pinned in `AGENTS.md` (PlatformIO Core 6.2.0;
`mirrors-clang-format @ v23.1.3` = LLVM 23.1.3; `tool-clangtidy` 1.190100.0 = LLVM 19.1.0;
`tool-cppcheck` 1.22200.0 = cppcheck 2.22.0; `pre-commit` 4.6.0; plus codespell, gitleaks,
detect-secrets, conventional-pre-commit). **The deliberate LLVM 23-vs-19 skew is documented
there** — the formatter is four majors ahead of the analyser, so `.clang-format` and
`.clang-tidy` must stay version-scoped and every check name re-validated against LLVM 19.1.0.

**The one genuine gap this todo adds:** Phases 5/6 name only the three **C/C++** tools. The
repository is not only C/C++. It also carries Node ESM tooling (`tools/*.mjs`,
`tools/tests/*.test.mjs`), `diagram.json`, `platformio.ini`, Markdown (`AGENTS.md`, `README.md`,
`homeworks/*/README.md`) and `.planning/*`. The owner's phrasing was generic — "linters,
code-style checkers, autoformatters" — so when Phases 5/6 are planned, the scope question is
explicitly: **does the check set cover the non-C/C++ artifacts too, or is it deliberately
C/C++-only?** If deliberately narrow, the README must say so, because an instructor reading a
public repo will assume "formatting is enforced" means everywhere.

Related constraint already in force: all three phase-3 plans declare
`.clang-format`, `.clang-tidy`, any cppcheck invocation and any pre-commit hook as **out of
scope for Phase 3** (`.planning/phases/03-*/03-0{1,2,3}-PLAN.md` "Not produced here or anywhere
in this phase" lines). Do not bolt them onto Phase 3.

## Solution

Fold into the existing Phase 5 / Phase 6 planning rather than opening new work. When
`/gsd-plan-phase 5` runs, resolve the scope question above and record the answer in that
phase's plan. Nothing here is urgent — the repo builds and its suite
(`node --test "tools/**/*.test.mjs"`) is green without any of it.
