# US-01M0GMDV: Consumer verification apps

> **Status:** Blocked
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKNH
> **Serves:** Sofia Marchetti
> **Affects:** .github/workflows/ci.yml, apps/verify-next, apps/verify-vite
> **Points:** 3

## User Story

**As a** Sofia Marchetti
**I want** fresh Vite and Next.js apps that build from the published tarball
**So that** the only real test of a package is a consumer, and everything else tests the source

## Acceptance Criteria

### AC1: Vite app builds from tarball

- **Given** a packed tarball
- **When** the Vite app installs and builds
- **Then** the build succeeds
- **Verify:** manual DEFERRED - see the delivery note; the packaging half of this AC is now covered by `pnpm check:pack`
- **Verification target:** functional

### AC2: Next.js App Router builds clean

- **Given** the same tarball
- **When** the Next.js app builds
- **Then** it succeeds with zero hydration warnings
- **Verify:** manual DEFERRED - blocked by CR-01M0MK20 and by F01; a hydration assertion over zero components is green by construction
- **Verification target:** functional

### AC3: The check is wired to CI

- **Given** the pipeline
- **When** a PR runs
- **Then** consumer verification is one of the blocking gates
- **Verify:** manual DEFERRED - gate 14 stays `pending` in ci-gates.json, bound to this story
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Consumer verification apps

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 3 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Revision History

| Date | Author | Change |
| --- | --- | --- |

## Delivery note (2026-08-22)

**Descoped, not abandoned - and the descope found the bug the apps were meant to find.**

The apps cannot do their job yet. `packages/react` exports zero components, so a Vite build proves
only that an empty module imports, and the Next.js app's entire unique value - hydration warnings
and `"use client"` survival - is unreachable with nothing to render. Worse, CR-01M0MK20 changes the
built output shape, so any assertion written against today's dist gets rewritten before it ever
catches anything.

What was reachable was the packaging question, and it was not theoretical. Packing the tarball
showed `npm pack` ships `"@luzentialabs/clara-tokens": "workspace:*"` verbatim. A consumer
installing that gets `EUNSUPPORTEDPROTOCOL` on every install, and a published release cannot be
withdrawn - only superseded. `pnpm pack` rewrites it to `0.0.0`, and the release path uses
changesets, so we are correct today **by accident of tool choice**. Nothing asserted it. Switching
to `npm publish` would have been a one-line change with permanent consequences.

`check-pack.mjs` now packs every publishable package the way the release publishes it and asserts
no `workspace:`, `link:`, or `file:` range survives in any resolved field, and that every exports
target is actually inside the tarball. The rules are a pure function (`lib/pack-inspect.mjs`) with
11 unit tests, because packing a deliberately-broken package would need a deliberately-broken
workspace.

Gate 14 (consumer verification) stays `pending` and bound to this story. Remaining when F01 lands:
the two apps, the hydration assertion, and the CI wiring - AC1 through AC3 above.
