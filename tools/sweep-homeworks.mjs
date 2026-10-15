#!/usr/bin/env node
// Interface placeholder — the RED half of this plan's TDD cycle.
//
// The sweep's flag surface and its exit paths are exercised by
// `tools/tests/sweep.test.mjs`. This file exists in the RED commit so those
// tests fail on the behaviour they assert rather than on a missing module: a
// bare absent file makes `node <path>` exit 1 with "Cannot find module", which
// is the very exit status one of the contract tests expects and would therefore
// pass for the wrong reason.
//
// The gate itself — discovery, id validation, depth-rule enforcement, the loud
// zero-match failure and the accumulate-and-continue build loop — lands in the
// GREEN commit that follows.
process.exit(0);
