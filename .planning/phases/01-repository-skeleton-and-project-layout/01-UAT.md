---
status: testing
phase: 01-repository-skeleton-and-project-layout
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md, 01-04-SUMMARY.md, 01-05-SUMMARY.md, 01-06-SUMMARY.md, 01-07-SUMMARY.md]
started: 2026-10-16T11:19:34Z
updated: 2026-10-16T11:19:34Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: The baseline README records, in prose, the one-environment rationale and the no-console-port rationale so a later reader does not re-open either
expected: |
  The baseline README records, in prose, the one-environment rationale and the no-console-port rationale so a later reader does not re-open either
awaiting: user response

## Tests

<!-- Human checkpoints first, then the automated ones. The automated entries are
     pre-resolved as `result: pass` / `source: automated` by uat classify-coverage and
     are never presented to the user (#1602). -->

### 1. The baseline README records, in prose, the one-environment rationale and the no-console-port rationale so a later reader does not re-open either
expected: The baseline README records, in prose, the one-environment rationale and the no-console-port rationale so a later reader does not re-open either
why_human: |
  Automation proves the file exists, is tracked and begins with the disclaimer. Whether the recorded reasoning actually stops a reader from re-litigating the environment set or the absent port is a judgment about prose, not a property a command can assert.
reason: human_judgment
result: [pending]

### 2. .vscode/settings.json and .vscode/extensions.json hold the editor settings in their single home, with exactly one PlatformIO IDE key and a recommendation list that agrees with the settings
expected: .vscode/settings.json and .vscode/extensions.json hold the editor settings in their single home, with exactly one PlatformIO IDE key and a recommendation list that agrees with the settings
why_human: |
  The automated gates prove parseability and key presence, not that the editor honours them: the editor-hygiene group, the C/C++ formatter bindings and the C_Cpp.* group are asserted by inspection only, and RESEARCH assumption A2 (whether a multi-root window surfaces .vscode/extensions.json recommendations at all) is explicitly flagged as unverified and deliberately left unresolved in Phase 1.
reason: human_judgment
result: [pending]

### 3. The root README names the generated workspace file and how to open it, gives the one-command build, states what a homework is, and describes only the tree Phase 1 ships
expected: The root README names the generated workspace file and how to open it, gives the one-command build, states what a homework is, and describes only the tree Phase 1 ships
why_human: |
  The README gates prove the absence of forbidden content and the presence of required strings, but whether the prose actually reads as an entry point — and whether the section order and tree framing serve a human cloning the repository for the first time — is a judgement no grep makes. A verifier reading the file is the check.
reason: human_judgment
result: [pending]

### 4. The four failure messages read as the repository's own account of a rule that was broken — the rule, the reason and the remedy — rather than as a downstream tool's error or silence
expected: The four failure messages read as the repository's own account of a rule that was broken — the rule, the reason and the remedy — rather than as a downstream tool's error or silence
why_human: |
  Automation proves the strings are present and correctly placed, and that the spawn-failure branch is reachable separately from the build-failure branch. Whether the prose actually lets a reader who misplaced a folder know what to do — and whether the zero-match message reads as a refusal rather than as reassurance, which is the exact failure the abandoned scaffold's `No homework projects yet - nothing to build.` line committed — is a judgement about wording that no grep makes.
reason: human_judgment
result: [pending]

### 5. Criterion 1's manual half: opening homework.code-workspace in VS Code shows exactly three top-level roots, and the shared-library root resolves without an unresolved-path marker
expected: Criterion 1's manual half: opening homework.code-workspace in VS Code shows exactly three top-level roots, and the shared-library root resolves without an unresolved-path marker
why_human: |
  Opening an editor window is not automatable and no agent can see what it renders. The observation is DEFERRED to end-of-phase verification (/gsd-verify-work 1) per this phase's human_verify_mode; the log carries the exact file to open, the exact three root names expected, and an explicitly unfilled output slot. An invented observation would enter later phases as fact.
reason: human_judgment
result: [pending]

### 6. Criterion 3's editor half: after opening and saving one tracked file in each of the three roots, `git status --porcelain` still prints nothing — the modification source a build cannot exercise
expected: Criterion 3's editor half: after opening and saving one tracked file in each of the three roots, `git status --porcelain` still prints nothing — the modification source a build cannot exercise
why_human: |
  The reading is a property of a human editor session with format-on-save enabled, and it must be taken before the observations are appended to this log. It is DEFERRED to end-of-phase verification with an explicitly unfilled output slot and the exact command and its required timing written down.
reason: human_judgment
result: [pending]

### 7. The depth rule's build-failure mechanism is measured on a two-arm throwaway fixture and recorded verbatim — arm A resolves the symlinked dependency at one level below homeworks/, arm B fails one level deeper
expected: The depth rule's build-failure mechanism is measured on a two-arm throwaway fixture and recorded verbatim — arm A resolves the symlinked dependency at one level below homeworks/, arm B fails one level deeper
why_human: |
  The deliverable is the truthful record of a measurement later phases read as fact, and the plan's own anti-fabrication contract is what makes it worth anything: no test can assert that the recorded output was not chosen after seeing both arms. Plan 01-07's ratification checkpoint is where that clause's discharge is read, and it needs a human to confirm the record matches the mechanism the criterion names.
reason: human_judgment
result: [pending]

### 8. The record states whether the two-arm measurement confirms the owner's stated reason or disagrees with any material part of it — the one thing that makes the override checkable
expected: The record states whether the two-arm measurement confirms the owner's stated reason or disagrees with any material part of it — the one thing that makes the override checkable
why_human: |
  The deliverable is a judgement about whether a human-recorded rationale survives contact with a measurement, written into a record the milestone audit and the instructor read as fact. No test can assert that the comparison was made honestly rather than smoothed over; the paragraph's worth is that a human can read both and check it. Section 'Does the measurement confirm the owner's stated reason?' below is where that judgement is written.
reason: human_judgment
result: [pending]

### 9. Discovery and validation have exactly one definition: a directory directly under homeworks/ whose name matches the frozen id grammar and which contains a platformio.ini
expected: Discovery and validation have exactly one definition: a directory directly under homeworks/ whose name matches the frozen id grammar and which contains a platformio.ini
result: pass
source: automated
coverage_id: D1
requirement: REPO-02
covered_by: unit:tools/tests/discover.test.mjs

### 10. homework.code-workspace is a pure function of the filesystem — sorted, fixed key order, LF with one trailing newline, no comments — and --check exits 1 naming the file and the remedy when it drifts
expected: homework.code-workspace is a pure function of the filesystem — sorted, fixed key order, LF with one trailing newline, no comments — and --check exits 1 naming the file and the remedy when it drifts
result: pass
source: automated
coverage_id: D2
requirement: REPO-01
covered_by: unit:tools/tests/generate-workspace.test.mjs, integration:node tools/generate-workspace.mjs --check

### 11. pio run -d homeworks/project-baseline succeeds from the repository root, a directory that carries no platformio.ini of its own, and reports the 16 MB application partition
expected: pio run -d homeworks/project-baseline succeeds from the repository root, a directory that carries no platformio.ini of its own, and reports the 16 MB application partition
result: pass
source: automated
coverage_id: D3
requirement: REPO-02
covered_by: integration:pio run -d homeworks/project-baseline

### 12. shared/lib survives a clone because it holds a tracked README stating the frozen dependency form, and no deprecated global-library directive leaked into it
expected: shared/lib survives a clone because it holds a tracked README stating the frozen dependency form, and no deprecated global-library directive leaked into it
result: pass
source: automated
coverage_id: D4
requirement: REPO-01
covered_by: integration:git ls-files shared/lib, integration:grep -Ec 'lib_extra_dirs|globallib_dir' shared/lib/README.md

### 13. Root .gitignore ignores machine-generated and machine-local artifacts at any depth and closes the three untracked entries that existed at plan start (OS junk, GSD research cache, GSD state file)
expected: Root .gitignore ignores machine-generated and machine-local artifacts at any depth and closes the three untracked entries that existed at plan start (OS junk, GSD research cache, GSD state file)
result: pass
source: automated
coverage_id: D1
requirement: REPO-04
covered_by: other:git check-ignore -v over the ten required paths (.pio/build, compile_commands.json, c_cpp_properties.json, launch.json, .claude/settings.local.json, .DS_Store, .planning/research/.cache/, .planning/state.json, secret.pem, sdkconfig.projectbaseline_s3) -> every line reports .gitignore as its source, other:git status --porcelain with the three artifacts created on disk -> only '?? .gitignore'; git status --porcelain --ignored lists all three as '!!', other:git check-ignore -q sdkconfig.defaults / .planning/config.json / .claude/skills/new-homework/SKILL.md / build/ -> exit 1 for all four, other:grep -cE '^[^#][^#]*#' .gitignore -> 0; grep -cE '^\\.pio/$' .gitignore -> 1

### 14. .editorconfig owns text-level rules using only the nine EditorConfig properties, and .gitattributes owns index-level normalisation with SVG classified as text
expected: .editorconfig owns text-level rules using only the nine EditorConfig properties, and .gitattributes owns index-level normalisation with SVG classified as text
result: pass
source: automated
coverage_id: D2
requirement: 
covered_by: other:node -e key-set check against the nine allowed property names -> OK keys=13; no max_line_length, no trim_final_newlines, no [*.py] section, other:git check-attr text eol -- README.md -> set, lf; git check-attr text eol -- docs/wiring.svg -> set, lf; git check-attr binary -- firmware.bin -> set, other:diff against 01-RESEARCH.md lines 848-879 (.editorconfig), 883-922 (.gitattributes) and 719-838 (.gitignore) -> all three byte-identical, exit 0

### 15. AGENTS.md no longer names a library folder that does not exist in the frozen layout; the plural is gone from the file an agent reads every session
expected: AGENTS.md no longer names a library folder that does not exist in the frozen layout; the plural is gone from the file an agent reads every session
result: pass
source: automated
coverage_id: D1
requirement: REPO-02
covered_by: other:grep -n 'shared/libs' AGENTS.md -> no match; grep -c 'shared/lib/' AGENTS.md -> 2; grep -c 'shared/lib/<Module>/' AGENTS.md -> 1; sed -n '45p;107p' AGENTS.md | grep -c 'symlink://../../shared/lib/<Name>' -> 2, other:git diff -U0 AGENTS.md -> exactly two hunks, at lines 45 and 107; wc -l < AGENTS.md -> 219 (unchanged)

### 16. .planning/PROJECT.md agrees with the frozen library path in REQUIREMENTS.md, so a phase reading only PROJECT.md cannot create the wrong directory
expected: .planning/PROJECT.md agrees with the frozen library path in REQUIREMENTS.md, so a phase reading only PROJECT.md cannot create the wrong directory
result: pass
source: automated
coverage_id: D2
requirement: REPO-02
covered_by: other:grep -cE 'shared/([^l]|$)' .planning/PROJECT.md -> 0; grep -c 'shared/lib/' .planning/PROJECT.md -> 3

### 17. The cross-phase traps section exists in the one document all eight phases load, immediately before `## Evolution`, with the four obligations the plan names
expected: The cross-phase traps section exists in the one document all eight phases load, immediately before `## Evolution`, with the four obligations the plan names
result: pass
source: automated
coverage_id: D3
requirement: REPO-01
covered_by: other:grep -c '^## Traps for Later Phases$' .planning/PROJECT.md -> 1; awk bullet floor -> 4; heading-order gate -> `## Evolution` immediately follows

### 18. The dated research evidence under .planning/research/ is untouched, so the audit trail of what was established on 2026-10-15 survives
expected: The dated research evidence under .planning/research/ is untouched, so the audit trail of what was established on 2026-10-15 survives
result: pass
source: automated
coverage_id: D4
requirement: 
covered_by: other:git status --porcelain .planning/research -> empty

### 19. tools/sweep-homeworks.mjs enforces the one-level depth rule and the frozen id grammar by name, before any build, and exits 1 immediately when either is broken — criterion 2's second half is discharged by a rule-naming detector rather than by a manufactured build failure
expected: tools/sweep-homeworks.mjs enforces the one-level depth rule and the frozen id grammar by name, before any build, and exits 1 immediately when either is broken — criterion 2's second half is discharged by a rule-naming detector rather than by a manufactured build failure
result: pass
source: automated
coverage_id: D1
requirement: REPO-03
covered_by: integration:tools/tests/sweep.test.mjs#a platformio.ini below a homework folder exits 1 naming the rule, before any build, integration:tools/tests/sweep.test.mjs#a folder name outside the frozen grammar exits 1 with the expected pattern, integration:node tools/sweep-homeworks.mjs --root <fixture> | grep -c 'DEPTH RULE VIOLATED' -> 1

### 20. A tree with zero homework projects exits non-zero with three readable lines naming what was found, and --allow-empty is the single named escape hatch that has to be asked for — criterion 4 satisfied literally
expected: A tree with zero homework projects exits non-zero with three readable lines naming what was found, and --allow-empty is the single named escape hatch that has to be asked for — criterion 4 satisfied literally
result: pass
source: automated
coverage_id: D2
requirement: REPO-03
covered_by: integration:tools/tests/sweep.test.mjs#a tree with no homework projects exits 1 and says zero were found, integration:tools/tests/sweep.test.mjs#--allow-empty is the single escape hatch: it exits 0 and prints one line, integration:node tools/sweep-homeworks.mjs --root <empty fixture> -> exit 1, stderr carries 'ZERO homework projects'

### 21. The sweep builds every discovered project from the scanned root with an argument array and no shell, accumulates failures instead of stopping at the first, resolves PlatformIO explicitly, and makes an unstartable binary a named failure distinct from a build failure
expected: The sweep builds every discovered project from the scanned root with an argument array and no shell, accumulates failures instead of stopping at the first, resolves PlatformIO explicitly, and makes an unstartable binary a named failure distinct from a build failure
result: pass
source: automated
coverage_id: D3
requirement: REPO-02
covered_by: integration:tools/tests/sweep.test.mjs#an unstartable PlatformIO binary exits 1 with a spawn failure, not a build failure, integration:tools/tests/sweep.test.mjs#a project that fails to build is reported, not swallowed, e2e:node tools/sweep-homeworks.mjs -> exit 0; '--- /Users/vloktiev/.platformio/penv/bin/pio run -d homeworks/project-baseline' then '[SUCCESS] Took 2.49 seconds', Flash 'used 268177 bytes from 6553600 bytes', other:node -e \"...if(/\\bexec(Sync)?\\(|\\bshell:\\s*true/.test(src))process.exit(1)\" -> exit 0

### 22. Every sweep exit path — the list contract, sorted output, zero matches, the escape hatch, the depth rule, the id grammar, an unstartable binary, a failing build and the default scanned root — is covered by an integration test that runs against a throwaway os.tmpdir() tree and leaves the repository untouched
expected: Every sweep exit path — the list contract, sorted output, zero matches, the escape hatch, the depth rule, the id grammar, an unstartable binary, a failing build and the default scanned root — is covered by an integration test that runs against a throwaway os.tmpdir() tree and leaves the repository untouched
result: pass
source: automated
coverage_id: D4
requirement: REPO-02
covered_by: integration:node --test \"tools/**/*.test.mjs\" -> tests 27, pass 27, fail 0 across all four test files, integration:tools/tests/sweep.test.mjs#the scanned root defaults to the repository, never the process working directory, other:git status --porcelain after the full suite -> no entry matching '\\.pio/|compile_commands\\.json'

### 23. Criterion 3's build half: a full `pio run` plus a `-t compiledb` run leave `git status --porcelain` completely empty — the build directory and the compilation database exist on disk and match no tracked path because the ignore rules close them at any depth
expected: Criterion 3's build half: a full `pio run` plus a `-t compiledb` run leave `git status --porcelain` completely empty — the build directory and the compilation database exist on disk and match no tracked path because the ignore rules close them at any depth
result: pass
source: automated
coverage_id: D1
requirement: REPO-04
covered_by: integration:test -z \"$(git status --porcelain)\" after `pio run -d homeworks/project-baseline` and `-t compiledb`, integration:git check-ignore -v homeworks/project-baseline/compile_commands.json -> .gitignore:20

### 24. Criterion 2 half (a): the baseline builds from the repository root — a directory carrying no platformio.ini of its own — with one command, and reports the 16 MB application partition, so the N16R8 overrides are in effect
expected: Criterion 2 half (a): the baseline builds from the repository root — a directory carrying no platformio.ini of its own — with one command, and reports the 16 MB application partition, so the N16R8 overrides are in effect
result: pass
source: automated
coverage_id: D2
requirement: REPO-02
covered_by: integration:pio run -d homeworks/project-baseline -> exit 0, '[SUCCESS] Took 2.44 seconds', Flash 'used 268177 bytes from 6553600 bytes', integration:pio run -d homeworks/project-baseline 2>&1 | grep -c 6553600 -> 1

### 25. Criterion 2 half (b): a platformio.ini placed one level below a homework folder makes the sweep exit 1 with DEPTH RULE VIOLATED, the reason, and the offending repository-relative path — demonstrated against the real tree without weakening the detector
expected: Criterion 2 half (b): a platformio.ini placed one level below a homework folder makes the sweep exit 1 with DEPTH RULE VIOLATED, the reason, and the offending repository-relative path — demonstrated against the real tree without weakening the detector
result: pass
source: automated
coverage_id: D3
requirement: REPO-03
covered_by: integration:node tools/sweep-homeworks.mjs 2>&1 | grep -c 'DEPTH RULE VIOLATED' against a live probe tree -> 1, exit 1, integration:rm -rf homeworks/m01-l03-depthprobe; test ! -d homeworks/m01-l03-depthprobe -> exit 0 (no residue)

### 26. Criterion 1's automated half: the committed workspace file passes its drift check against the tree, so it lists exactly the repository root, the shared-library tree and the baseline project
expected: Criterion 1's automated half: the committed workspace file passes its drift check against the tree, so it lists exactly the repository root, the shared-library tree and the baseline project
result: pass
source: automated
coverage_id: D4
requirement: REPO-01
covered_by: integration:node tools/generate-workspace.mjs --check -> 'homework.code-workspace is up to date', exit 0

### 27. The one criterion-3 judgement this phase had to make is recorded: the generated state file is closed by an ignore rule because it is timestamped machine state rewritten on every transition, and it was explicitly NOT committed
expected: The one criterion-3 judgement this phase had to make is recorded: the generated state file is closed by an ignore rule because it is timestamped machine state rewritten on every transition, and it was explicitly NOT committed
result: pass
source: automated
coverage_id: D7
requirement: REPO-04
covered_by: other:grep -c 'state.json' .planning/phases/01-repository-skeleton-and-project-layout/01-05-SUMMARY.md -> >= 1, other:git check-ignore -v .planning/state.json -> .gitignore:91

### 28. The GSD lock-file class is invisible to git by the repository's own rule, and no tracked path became ignored as collateral
expected: The GSD lock-file class is invisible to git by the repository's own rule, and no tracked path became ignored as collateral
result: pass
source: automated
coverage_id: D1
requirement: REPO-04
covered_by: integration:git check-ignore -v .planning/milestone.lock -> .gitignore:96:.planning/*.lock, exit 0, integration:test -z \"$(git ls-files -i -c --exclude-standard)\" -> empty, exit 0, integration:! git check-ignore -q .planning/config.json / .planning/PROJECT.md / sdkconfig.defaults / .claude/skills/new-homework/SKILL.md / build/ -> all exit 1

### 29. The ignore contract has a two-direction regression gate, so the next dropped rule turns the suite red instead of requiring a human to notice a dirty tree
expected: The ignore contract has a two-direction regression gate, so the next dropped rule turns the suite red instead of requiring a human to notice a dirty tree
result: pass
source: automated
coverage_id: D2
requirement: REPO-04
covered_by: unit:tools/tests/ignore-rules.test.mjs — tests 5, pass 5, fail 0, unit:node --test \"tools/**/*.test.mjs\" -> tests 32, pass 32, fail 0, skipped 0, todo 0 (27 before this file was added)

### 30. The measurement left no residue: the fixture root is gone, no grammar-matching directory was added under homeworks/, and the repository porcelain report is empty
expected: The measurement left no residue: the fixture root is gone, no grammar-matching directory was added under homeworks/, and the repository porcelain report is empty
result: pass
source: automated
coverage_id: D4
requirement: REPO-03
covered_by: integration:test ! -d \"${TMPDIR:-/tmp}/phase01-depth-probe\" -> exit 0, integration:test ! -d homeworks/m01-l03-probe -> exit 0; ls homeworks/ -> project-baseline only, integration:git status --porcelain -> empty, after the summary was committed

### 31. ROADMAP Phase 1 carries the owner's accepted override as a dated discharge note beside a byte-identical criterion 2, naming the sanctioned detector, the reason, the measured evidence and the Phase 3 trigger
expected: ROADMAP Phase 1 carries the owner's accepted override as a dated discharge note beside a byte-identical criterion 2, naming the sanctioned detector, the reason, the measured evidence and the Phase 3 trigger
result: pass
source: automated
coverage_id: D1
requirement: REPO-03
covered_by: integration:grep -c '^> \\*\\*Verification discharge (criterion 2, second conjunct):\\*\\*' .planning/ROADMAP.md -> 1, integration:sed -n '/^  2\\. A PlatformIO project placed at/p' .planning/ROADMAP.md | shasum -a 256 -> 1f03e2c72b1bed66621f8f040e729f39508ade65811772566a7de1b4bf90e5d9 (the criterion line is byte-identical), integration:grep -c 'DEPTH RULE VIOLATED' .planning/ROADMAP.md -> 1; grep -c 'checkpoint' .planning/ROADMAP.md -> 0

### 32. ROADMAP Phase 3 carries an additional numbered success criterion making the depth rule's build-failure half observable on the committed tree once a symlinked shared-library dependency exists
expected: ROADMAP Phase 3 carries an additional numbered success criterion making the depth rule's build-failure half observable on the committed tree once a symlinked shared-library dependency exists
result: pass
source: automated
coverage_id: D2
requirement: REPO-03
covered_by: integration:grep -c 'fail to resolve the shared-library symlink dependency' .planning/ROADMAP.md -> 1, other:Phase 3 criteria 1-4 unaltered and `**Plans:** TBD` unchanged — criterion 5 was appended, never inserted

### 33. The verification record carries exactly one override entry, its `must_have` quoting the failing clause's own vocabulary and its attribution read from the owner-decision commit rather than typed
expected: The verification record carries exactly one override entry, its `must_have` quoting the failing clause's own vocabulary and its attribution read from the owner-decision commit rather than typed
result: pass
source: automated
coverage_id: D3
requirement: REPO-03
covered_by: integration:grep -c 'overrides_applied: 1' .planning/phases/01-repository-skeleton-and-project-layout/01-VERIFICATION.md -> 1, integration:grep -c 'accepted_by: ' .planning/phases/01-repository-skeleton-and-project-layout/01-VERIFICATION.md -> 1; value 4oc3p equals `git log -1 --format=%an --grep='record owner decisions on the two verification gaps'`, integration:grep -c '^status: gaps_found' .planning/phases/01-repository-skeleton-and-project-layout/01-VERIFICATION.md -> 1 (the verifier's verdict fields untouched)

### 34. The decision is carried into the cross-phase channel every later phase reads: one Key Decisions row in `.planning/PROJECT.md` containing `criterion 2 second conjunct`
expected: The decision is carried into the cross-phase channel every later phase reads: one Key Decisions row in `.planning/PROJECT.md` containing `criterion 2 second conjunct`
result: pass
source: automated
coverage_id: D4
requirement: REPO-03
covered_by: integration:grep -c 'criterion 2 second conjunct' .planning/PROJECT.md -> 1

### 35. The phase's own gates are re-run against the recorded state and are green, and the tree is clean once the summary is committed
expected: The phase's own gates are re-run against the recorded state and are green, and the tree is clean once the summary is committed
result: pass
source: automated
coverage_id: D5
requirement: REPO-01
covered_by: integration:node tools/generate-workspace.mjs --check -> 'homework.code-workspace is up to date', exit 0, integration:node tools/sweep-homeworks.mjs --list -> 'project-baseline', exit 0, integration:pio run -d homeworks/project-baseline 2>&1 | grep -c 6553600 -> 1; [SUCCESS] Took 2.80 seconds, unit:node --test \"tools/**/*.test.mjs\" -> tests 32, pass 32, fail 0, skipped 0, todo 0, integration:test -z \"$(git status --porcelain)\" -> exit 0, empty, after this summary was committed

## Summary

total: 35
passed: 27
issues: 0
pending: 8
skipped: 0
blocked: 0

## Gaps

<!-- YAML format for plan-phase --gaps consumption -->
