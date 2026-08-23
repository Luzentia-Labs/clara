# US-01M0GMDV: Consumer verification apps

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKNH
> **Serves:** Sofia Marchetti
> **Affects:** .github/workflows/ci.yml, apps/verify-next, apps/verify-vite, scripts/check-ci-gates.mjs, scripts/verify-consumers.mjs
> **Points:** 3

## User Story

**As a** Sofia Marchetti
**I want** fresh Vite and Next.js apps that build from the published tarball
**So that** the only real test of a package is a consumer, and everything else tests the source

## Context

### Persona Reference

**Sofia Marchetti** - installs Clara from npm into three applications, one on Next.js App Router.
[Full persona details](../personas/sofia-marchetti.md)

### Background

Everything else in this repo tests the source. A consumer is the only thing that tests the
*package*: the exports map, the `files` list, the dependency ranges, the peer resolution, and
whether the emitted chunks work outside the workspace that built them.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| TRD Section 9 gate 13 | CI | The tarball must install and build in a fresh Vite app and a fresh Next App Router app | AC1, AC2 |
| PRD F23 | SSR | No hydration warnings in the Next verification app | AC2 |
| D0042 | Integrity | BG-01M0MFMZ is verified in a consumer, not by another oracle | AC1 |
| D0040 | Packaging | The tarball is what a consumer resolves, not the workspace | The apps install OUTSIDE the workspace |

## Acceptance Criteria

### AC1: Vite app builds from tarball

- **Given** a packed tarball
- **When** the Vite app installs and builds
- **Then** the build succeeds
- **Verify:** shell node scripts/verify-consumers.mjs --app verify-vite
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: Next.js App Router builds clean

- **Given** the same tarball
- **When** the Next.js app builds
- **Then** it succeeds with zero hydration warnings
- **Verify:** shell node scripts/verify-consumers.mjs --app verify-next
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: The check is wired to CI

- **Given** the pipeline
- **When** a PR runs
- **Then** consumer verification is one of the blocking gates
- **Verify:** shell node scripts/check-ci-gates.mjs
- **Verified:** yes (2026-08-23)
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

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| The apps are built inside the workspace | pnpm would link `@luzentialabs/*` to `src` and the test would prove nothing - so they are copied out first |
| `"use client"` does not survive bundling | `next build` fails with a prerender error - reproduced by stripping the directive from the built chunk |
| clara-react bundles React instead of externalising it | Caught: the shipped chunks are scanned for React internals, and a nested `react` install fails |
| React resolves to a copy other than the consumer's | Fails - both paths are realpath'd first, because on macOS `/var` is a symlink to `/private/var` |
| The internal deps cannot be found on the registry | Handled by npm `overrides` pointing every `@luzentialabs/*` at its tarball |
| A build emits a hydration warning but still exits 0 | Fails - the build OUTPUT is scanned, not just the exit code |

> **Minimum edge cases:** 5 - 6 recorded.

## Test Scenarios

- [ ] The Vite app installs the tarball and builds
- [ ] The Next App Router app installs the tarball and builds
- [ ] A stripped directive fails the Next build (verified by doing it)
- [ ] React resolves from clara-react to the consumer's copy
- [ ] No nested react is installed beside clara-react
- [ ] No shipped chunk contains React itself
- [ ] The gate is wired into CI and the publish path

> **Minimum test scenarios:** 7 - 7 recorded.

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0MQYN](US-01M0MQYN-manual-chunks-so-the-use-client-directive-survives.md) | Blocked by (resolved) | The directive had to survive before an App Router app could build | Review |
| BG-01M0MFMZ | Closes | The peer-bundling Critical, per D0042 | Fixed |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| `next` ^16.3.2 | Consumer app | Requires Node >=20.9; our floor is 20.19, so no repeat of D0033 |
| `npm` | Install | Used deliberately instead of pnpm - a consumer is likelier to use it, and it will not reach back into this workspace |

## Estimation

**Points:** 3
**Complexity:** Medium. The apps are trivial; the harness is not - getting them OUT of the
workspace is what makes the test real.

> **Points** are a RELATIVE size on the modified Fibonacci scale (1, 2, 3, 5, 8, 13, 20) - not
> "how long will this take" but "is this bigger than that one", sized against stories already
> delivered. The gaps widen deliberately, because uncertainty grows with size: it is much harder
> to argue a story is a 7 rather than an 8 than to choose between a 5 and an 8. A value off the
> scale is REFUSED, never rounded - the scale IS the estimate. Above 8, SPLIT the story;
> estimator consistency collapses beyond it, so a bigger number is a triage failure rather than
> a harder estimate. This is the one size vocabulary: the planner, the forecast and the measured
> velocity all read this field.

## Rollback Envelope

> Required when `affects_production_runtime: true`; optional otherwise. See `reference-story.md#rollback-envelope`.

**Affects production runtime:** false - the apps are private and never published.

*Reversal is `git revert`.* The gate is slow (a real Next install), which is why it is a CI gate
rather than part of `pnpm check`.

## Open Questions

None blocking.

**Honest limit:** hydration is verified by a clean production build, not by loading the page in a
browser. `next build` prerenders the page, so a boundary violation fails it - which is the defect
class this story exists for - but a runtime-only hydration mismatch would need the Playwright suite
pointed at a running app. Recorded rather than implied.

## Delivery note (2026-08-22)

**Delivered 2026-08-23.** The descope note below is kept because it is why this story waited, and
because the packaging bug it found is real. Both apps now exist and build from the tarball.

Two things make them a real test rather than a green build. They are copied OUT of the workspace
before installing: inside it pnpm resolves `@luzentialabs/*` to a workspace link, so the app would
build against `src` and prove nothing about what a consumer receives. And the Next.js page is a
SERVER component rendering a client-only one, so if `"use client"` does not survive bundling,
`next build` fails - verified by stripping the directive from the built chunk and watching the
build fail with a prerender error, then restoring it.

**BG-01M0MFMZ closes here**, exactly as D0042 decided. Seven oracle rewrites failed because every
one inspected an artifact we also produced, so each fix moved the trust boundary rather than
closing it. The consumer install has no such loop: React is asserted to resolve from clara-react to
the consumer's own copy, no nested copy is installed, and no shipped chunk contains React itself
rather than a reference to it.

*Original descope note, 2026-08-22:*

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

## Revision History

| Date | Author | Change |
| --- | --- | --- |
