# US-01M0GM0R: Server and client boundary classification

> **Status:** Blocked
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKNH
> **Serves:** Sofia Marchetti
> **Affects:** packages/react/CLIENT-BOUNDARY.md, packages/react/dist/index.js, packages/react/src/**
> **Points:** 3

## User Story

**As a** Sofia Marchetti
**I want** an explicit client/server classification and a check that the directive survives bundling
**So that** consumers on Next.js App Router get no hydration warnings and no unnecessary client boundaries

## Acceptance Criteria

### AC1: Classification exists as a list

- **Given** the repo
- **When** I look for the classification
- **Then** every v1 component is named server-capable or client-only per the rule in TRD Section 7
- **Verify:** shell node scripts/check-client-boundary.mjs
- **Verified:** yes (2026-08-22)
- **Verification target:** functional

### AC2: Directive survives bundling

**BLOCKED on CR-01M0MK20 - cannot pass today, and the reason is the finding.**

Measured, not assumed: a probe component carrying `"use client"` built through this package's own
config emitted `function Probe() { return null; }` with the directive gone, and Rollup downgraded it
to a warning. Worse, a single bundled chunk has one top, so the directive is either on every
component or on none - and TRD Section 7 requires it on client components AND absent from
server-capable ones. The output shape has to change before this AC can be satisfied.

The guard for it is already written and already proven killable, so the first client component
cannot ship unmarked in the meantime.

- **Given** the built output
- **When** I inspect ESM and CJS for a client component
- **Then** `"use client"` is present at the top of both
- **Verify:** manual BLOCKED by CR-01M0MK20 - zero client components are built, so the guard's directive branch does not execute and a shell verify reports a vacuous pass
- **Verification target:** functional

### AC3: No browser API during render

- **Given** every component
- **When** the server render runs
- **Then** no component reads window, document, or matchMedia during render
**Deferred: nothing to render.** `packages/react/src` exports no components, so this test would
assert over an empty set and report green. It is authored with the first component (F01), not
faked now.

- **Verify:** manual no component reads window, document, or matchMedia during render - re-armed as a vitest suite with the first component
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Server and client boundary classification

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

Delivered: the classification as **build input** (`client-boundary.json`, 39 components - 14
server-capable, 25 client-only), a generated human page, and `check-client-boundary.mjs` wired into
`pnpm check`, CI gate 15, and the publish path.

The guard is driven by **what the package exports**, never by the list. A guard keyed off the list
would have printed a healthy "39 classified" while an unclassified component shipped beside it.
Three mutations pin it: an unclassified export, a built client component whose directive did not
survive, and an invalid boundary value - 20 killed in total.

Not delivered: AC2 and AC3, for the reasons recorded against each. AC2 is a genuine architectural
finding (CR-01M0MK20, 8 points), not a shortfall of effort - and it is far cheaper now, with
nothing published and no component written, than after either.
