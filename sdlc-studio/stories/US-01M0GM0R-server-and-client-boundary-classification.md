# US-01M0GM0R: Server and client boundary classification

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKNH
> **Serves:** Sofia Marchetti
> **Affects:** packages/react/CLIENT-BOUNDARY.md, packages/react/client-boundary.json, scripts/check-client-boundary.mjs, packages/react/src/components
> **Points:** 3

## User Story

**As a** Sofia Marchetti
**I want** an explicit client/server classification and a check that the directive survives bundling
**So that** consumers on Next.js App Router get no hydration warnings and no unnecessary client boundaries

## Context

### Persona Reference

**Sofia Marchetti** - runs Clara in three applications, one on Next.js App Router.
[Full persona details](../personas/sofia-marchetti.md)

### Background

A component is client-only if its public props include a function, or if it uses state, effects,
refs, or browser APIs internally. Everything else is server-capable and carries no directive
(TRD Section 7).

Both halves matter. Marking nothing means every client component crashes an App Router server
render on its first hook. Marking everything means Sofia has to wrap her whole page in a client
boundary, which is what PRD F23's user story exists to prevent.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| TRD Section 7 | Boundary | The classification rule, and that server-capable components carry NO directive | AC1, AC2 |
| PRD F23 | Boundary | The classification is an explicit LIST, not a principle | AC1 |
| PRD F23 | Boundary | The directive survives bundling in both ESM and CJS | AC2 |
| PRD F23 | SSR | No component reads window, document or matchMedia during render | AC3 |
| D0041 | Architecture | Manual chunks driven by the classification | AC2 - delivered by US-01M0MQYN |

## Acceptance Criteria

### AC1: Classification exists as a list

- **Given** the repo
- **When** I look for the classification
- **Then** every v1 component is named server-capable or client-only per the rule in TRD Section 7
- **Verify:** shell node scripts/check-client-boundary.mjs
- **Verified:** yes (2026-08-22)
- **Verification target:** functional

### AC2: Directive survives bundling

**UNBLOCKED 2026-08-22.** CR-01M0MK20 landed in US-01M0MQYN: the build is cut into a client chunk
and a server chunk from `client-boundary.json`, and the directive is stamped on the client chunk in
both formats. Measured: `clara-client.js` and `clara-client.cjs` both open with `"use client";`,
while `clara-server.*` and the entry carry none.

*Original finding, kept because it is why the AC could not pass:*

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
- **Verify:** shell node scripts/check-client-boundary.mjs
- **Verified:** yes (2026-08-22)
- **Verification target:** functional

### AC3: No browser API during render

- **Given** every component
- **When** the server render runs
- **Then** no component reads window, document, or matchMedia during render
**Armed 2026-08-22.** Two fixture components now exist, so the suite asserts over a real set. It
uses the SERVER renderer rather than jsdom - jsdom would supply the very browser globals the rule
forbids touching, so the test would pass by providing what it is meant to detect. The globals are
replaced with getters that record access, and the assertion is that nothing recorded.

- **Verify:** shell npx vitest run packages/react/src/components/__tests__/boundary.test.tsx
- **Verified:** yes (2026-08-22)
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

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| A component ships without appearing in the classification | Fails - the guard reads what the package EXPORTS, never its own list |
| A component is exported while still marked `planned` | Fails - the file claims it is unbuilt while it is shipping |
| The bundle is minified to one line | Still read correctly; the first reader was line-anchored and reported zero exports |
| An export name contains `_` or `$` | Reported, not silently dropped - the first name filter discarded them |
| A client component ships with no directive | Fails, per format, pinned by a mutation each |
| A directive appears on the server chunk or entry | Fails - the other half of the rule, which a presence check would miss |

> **Minimum edge cases:** 5 - 6 recorded.

## Test Scenarios

- [ ] Every exported component appears in the classification
- [ ] A minified single-line bundle is read correctly
- [ ] The directive is present on the client chunk in ESM and in CJS
- [ ] The server chunk and the entry carry no directive
- [ ] A server render of a server-capable component produces exact markup
- [ ] A server render of a client component reads no browser global
- [ ] Two renders of the same component produce identical markup

> **Minimum test scenarios:** 7 - 7 recorded.

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0MQYN](US-01M0MQYN-manual-chunks-so-the-use-client-directive-survives.md) | Blocked by (resolved) | The output shape that lets the directive survive | Review |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| `react-dom/server` | Test | Used instead of jsdom - jsdom would supply the globals the rule forbids |

## Estimation

**Points:** 3
**Complexity:** Low as delivered. The hard part was the output shape, which became CR-01M0MK20 and
its own 8-point story.

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

**Affects production runtime:** false - nothing is published.

*Reversal is `git revert`.* The classification itself is cheap to change; what is permanent is the
output shape it drives, which is why that was settled before F01.

## Open Questions

None. Both previously-blocked criteria now pass.

**Honest limit:** verified by reading built output and by a server render, not yet by a running
Next.js App Router app. That is US-01M0GMDV.

## Delivery note (2026-08-22)

Delivered: the classification as **build input** (`client-boundary.json`, 39 components - 14
server-capable, 25 client-only), a generated human page, and `check-client-boundary.mjs` wired into
`pnpm check`, CI gate 15, and the publish path.

The guard is driven by **what the package exports**, never by the list. A guard keyed off the list
would have printed a healthy "39 classified" while an unclassified component shipped beside it.
Three mutations pin it: an unclassified export, a built client component whose directive did not
survive, and an invalid boundary value - 20 killed in total.

**Update 2026-08-22:** AC2 and AC3 are now delivered. CR-01M0MK20 landed as US-01M0MQYN, so the
directive survives and the guard's directive branch executes for real; two fixture components mean
the server-render suite asserts over a non-empty set. All three criteria pass.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
