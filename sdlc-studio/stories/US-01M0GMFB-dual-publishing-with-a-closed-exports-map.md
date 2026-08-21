# US-01M0GMFB: Dual publishing with a closed exports map

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKNH
> **Serves:** Sofia Marchetti
> **Affects:** ./packages/react/package.json, packages/*/package.json, packages/react, scripts/check-exports.mjs
> **Points:** 3

## User Story

**As a** Sofia Marchetti
**I want** closed exports maps with no wildcard
**So that** no subpath becomes public API by accident, since every reachable subpath is permanent

## Acceptance Criteria

### AC1: Exports are enumerated

- **Given** each package.json
- **When** I read the exports map
- **Then** only the subpaths listed in TRD Section 5 appear, and no `./*` wildcard
- **Verify:** shell node -e "const e=require('./packages/react/package.json').exports; if(Object.keys(e).some(k=>k.includes('*')))process.exit(1)"
- **Verification target:** functional

### AC2: publint is clean

- **Given** the built packages
- **When** I run `publint`
- **Then** zero errors
- **Verify:** shell npx --yes publint packages/react
- **Verification target:** functional

### AC3: A wildcard fails CI

- **Given** an exports map
- **When** a `./*` wildcard is introduced
- **Then** the CI check fails
- **Verify:** shell node scripts/check-exports.mjs
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Dual publishing with a closed exports map

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
