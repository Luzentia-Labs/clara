# US-01M0GM0R: Server and client boundary classification

> **Status:** Draft
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
- **Verify:** file packages/react/CLIENT-BOUNDARY.md
- **Verification target:** functional

### AC2: Directive survives bundling

- **Given** the built output
- **When** I inspect ESM and CJS for a client component
- **Then** `"use client"` is present at the top of both
- **Verify:** grep "use client" packages/react/dist/index.js
- **Verification target:** functional

### AC3: No browser API during render

- **Given** every component
- **When** the server render runs
- **Then** no component reads window, document, or matchMedia during render
- **Verify:** vitest "server render is clean"
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
