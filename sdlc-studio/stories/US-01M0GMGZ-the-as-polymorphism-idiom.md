# US-01M0GMGZ: The `as` polymorphism idiom

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKGS
> **Serves:** Sofia Marchetti
> **Affects:** packages/react/etc/clara-react.api.md, packages/react/src/utils/polymorphic.ts
> **Points:** 3

## User Story

**As a** Sofia Marchetti
**I want** one typed polymorphism utility used by every component that renders a variable element
**So that** design principle 2 is enforced by a shared mechanism rather than asserted in prose

## Acceptance Criteria

### AC1: Single idiom

- **Given** the public API
- **When** I inspect it
- **Then** `as` is the only polymorphism idiom; `asChild` appears nowhere (D0008)
- **Verify:** shell ! grep -q "asChild" packages/react/etc/clara-react.api.md
- **Verification target:** functional

### AC2: Props are inferred

- **Given** a component with `as="a"`
- **When** I pass an invalid attribute for that element
- **Then** it is a TypeScript error
- **Verify:** vitest "as prop infers target element props"
- **Verification target:** functional

### AC3: Refs forward through

- **Given** a polymorphic component
- **When** I attach a ref
- **Then** it reaches the rendered element
- **Verify:** vitest "polymorphic ref forwarding"
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- The `as` polymorphism idiom

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
