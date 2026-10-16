# API Coverage — Phase 1 (Repository Skeleton and Project Layout)

No external API integration: it edits an ignore file and appends dated planning notes, driving only local, already-installed binaries (git, Node's test runner, the PlatformIO CLI) — no remote service, credential or endpoint.

Nothing in this phase's scope contacts a remote service, holds a credential, or calls an endpoint.

## Why the detector fired anyway

`api-coverage.cjs` reports `detected: true` for this phase, with the signal snippet `#include <Arduino.h>`, `Serial.begin(115200)`, `ESP.getFlashChipSize()`. The matched noun is not a service: the trigger is the phrase "pin-driving API" in `01-01-PLAN.md` line 197, an instruction that the baseline's source must name no Arduino GPIO function — a local C++ library surface on a toolchain already installed on this machine.

There is no capability surface to enumerate because there is no integration: no verb/endpoint/method list exists for a phase whose only outbound calls are to binaries on the local disk. Inventing matrix rows here would manufacture decided capabilities for a surface that does not exist, which is the failure this gate is meant to prevent rather than to produce.

## What the phase touches instead

| Touched | Kind |
|---------|------|
| `.gitignore` | A local text file, edited by hand |
| `tools/tests/ignore-rules.test.mjs` | A local test file, run by the built-in Node test runner |
| `git check-ignore` | A local git binary, read-only, no network |
| Local PlatformIO Core CLI | A locally installed binary; the platform and framework packages it needs are already resolved on disk |
| `.planning/ROADMAP.md`, `.planning/PROJECT.md`, the phase verification record | Local planning documents |

No package is installed by this phase, no lockfile is touched, and no registry is contacted.
