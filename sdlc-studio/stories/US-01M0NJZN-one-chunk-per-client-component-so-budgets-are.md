# US-01M0NJZN: One chunk per client component so budgets are real

> **Status:** Done
> **Template:** full
> **Created:** 2026-08-23
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** scripts/lib/chunk-plan.mjs, scripts/check-client-boundary.mjs, scripts/lib/finalize-dual.mjs, .size-limit.json
> **Epic:** EP-01M0GKNH
> **Points:** 5
> **Persona:** Sofia Marchetti

## User Story

**As a** Sofia Marchetti
**I want** to take only the client components I actually import
**So that** using one Clara button does not put every dialog, combobox and date picker into my client bundle

## Context

### Persona Reference

**Sofia Marchetti** - ships Clara in three applications and watches her client bundle.
[Full persona details](../personas/sofia-marchetti.md)

### Background

`"use client"` boundaries are module-granular. With one client chunk, importing `Button` makes
every other client component a client reference too - `Dialog`, `Combobox`, `DatePicker`, the lot.

AGENTS.md says per-component budgets apply to JavaScript only. That could not be true while the
unit of delivery was all-or-nothing, so one of the two had to give, and the budget is the half a
consumer actually feels.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| D0048 | Architecture | One chunk per client component; server components stay together | AC1 |
| AGENTS.md | Budgets | Per-component budgets apply to JavaScript only | AC3 |
| D0041 / D0047 | Boundary | The directive is on client chunks and nowhere else | AC4 |
| D0006 | Delivery | The exports map stays closed - chunks are internal | AC4 |

## Acceptance Criteria

- **AC1:** ### AC1: One chunk per built client component

- **Given** two or more built client components
- **When** the package builds
- **Then** each has its own chunk, named after it, carrying `"use client"` in both formats
- **Verify:** shell node scripts/check-client-boundary.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: A consumer takes only what it imports

- **Given** the built ESM output
- **When** a consumer imports one client component
- **Then** no other client component's code is reachable from that import
- **Verify:** shell npx vitest run test/build/chunk-placement.test.ts scripts/lib/__tests__/chunk-plan.test.ts
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: The budgets become per-component and real

- **Given** .size-limit.json
- **When** the budgets run
- **Then** each client component has its own JS budget, as AGENTS.md has always claimed
- **Verify:** shell node scripts/sync-size-budgets.mjs --check && pnpm size
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC4: The guard layer holds under the new shape

- **Given** many chunks rather than three
- **When** the full gate set runs
- **Then** pnpm check passes, every chunk is hash-matched, and no server or shared chunk imports any client chunk
- **Verify:** shell pnpm check
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

## Scope

### In Scope

- One chunk per built client component, named after it
- Server components continue to share one chunk; cross-cutting modules keep the shared chunk
- The size budgets generated from the classification, so a new component cannot land outside them
- Every guard, the finalizer and the end-to-end test taught that there are many client chunks

### Out of Scope

- Per-component budgets for server components - they carry no directive, so there is no boundary to pay for
- Calibrating the 5 kB figure against real components (F01)

## Technical Notes

The planner change is small: a client module's chunk is `clara-client-<Component>` instead of
`clara-client`. The work is everywhere else - four guards, `finalize-dual`, the end-to-end build
test and `.size-limit.json` all addressed the client chunk by one fixed filename.

`isClientChunk()` now lives in `chunk-plan.mjs` and is used by both the finalizer that STAMPS the
directive and the guard that CHECKS it, so "which files must carry a directive" cannot drift
between them.

The budgets are generated rather than hand-kept. A hand-kept list is how a component ends up with
no budget at all - the failure is silent, and silence is what these gates exist to remove.

### API Contracts

None. The exports map is unchanged: `.`, `./styles.css`, `./package.json`. Chunks are internal
files the entry imports - reachable by a bundler, never by a consumer's import specifier.

### Data Requirements

`packages/react/client-boundary.json` drives both the chunking and the generated budget list.

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| A module defines two client components | It cannot be split, so it takes one chunk named after the first alphabetically - deterministic, because a chunk name that moves between builds breaks the budgets and the record that address it |
| The chunks are collapsed back into one | Fails: every built client component must own a chunk, pinned by a mutation |
| A new client component is added | It arrives with its own budget - the budget file is generated from the classification, so a component cannot land outside the budgets |
| A server component is added | It joins the shared server chunk. It carries no directive, so it crosses no boundary and costs a consumer only bytes their bundler can tree-shake |
| A cross-cutting helper is shared | Still goes to the undirectived shared chunk, which neither side owns |

> **Minimum edge cases:** 5 - 5 recorded.

## Test Scenarios

- [ ] Each client component gets a chunk named after it
- [ ] One client component's code is not inside another's chunk
- [ ] Server components share one chunk
- [ ] A two-component module gets a deterministic name
- [ ] Every client chunk carries the directive; no other chunk does
- [ ] Each built client component has its own size budget
- [ ] Collapsing the chunks back into one fails the guard

> **Minimum test scenarios:** 7 - 7 recorded.

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0MQYN](US-01M0MQYN-manual-chunks-so-the-use-client-directive-survives.md) | Builds on | The chunking mechanism this refines | Review |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| `size-limit` ^12 | Budgets | Already present; the budget list is now generated rather than hand-kept |

## Estimation

**Points:** 5
**Complexity:** Medium. The planner change is three lines; the cost is that four guards, the
finalizer, the end-to-end test and the budgets all addressed the client chunk by one fixed name.

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

*Reversal is `git revert`.* Landing it before F01 is the point: the output shape is reachable from
the exports map, so changing it after the first publish is breaking, and re-cutting forty chunks
costs far more than re-cutting two.

## Open Questions

None blocking.

**Honest limit:** the per-component budget is 5 kB, chosen as a starting figure rather than
measured against real components - Button is the only built one and it is a fixture. Expect to
revisit the number with F01, when there is something to calibrate against.

## Summary

Give each client component its own chunk so a consumer importing Button does not take every other client component into their client bundle. Implements D0048, raised as F7 by the adversarial review of US-01M0MQYN. Server-capable components keep sharing clara-server (no directive, nothing to cross); cross-cutting modules keep sharing clara-shared. The placement guard, the bundle record and the size budgets all address chunks by name today, so each grows a per-component dimension.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-23 | sdlc-studio | Created via `new` (deterministic) |
