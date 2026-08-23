# US-01M0GM61: Portal, layer scale, and scoping infrastructure

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK4P
> **Serves:** Sofia Marchetti
> **Affects:** packages/react/src/utils/portal.tsx, packages/tokens/dist/tokens.css
> **Points:** 5

## User Story

**As a** Sofia Marchetti
**I want** one portal mechanism that carries theme and density and a defined stacking order
**So that** the scoping problem is solved once in the architecture rather than nine times in props

## Acceptance Criteria

### AC1: Portal re-applies scope

- **Given** a portal opened from inside a ClaraScope
- **When** it mounts
- **Then** the portal root carries the resolved data-clara-theme and data-clara-density
- **Verify:** vitest "portal inherits scoped theme"
- **Verification target:** functional

### AC2: Layer scale is tokenised

- **Given** the z-index scale
- **When** I inspect it
- **Then** every layer is a token and nested overlays stack in a documented, predictable order
- **Verify:** vitest "the overlay layer scale is tokenised"
- **Verification target:** functional

### AC3: Nested overlays stack correctly

- **Given** the layer scale
- **When** two overlays are nested
- **Then** the ORDER is right by construction: a popover sits above a modal (so a Select opened
  from inside a Modal clears the surface it was opened from), a modal above its own scrim, and the
  scrim above any dropdown that was already open
- **And** the composition itself - a real Select inside a real Modal - is NOT asserted here, because
  neither component exists yet. It arrives with Select in EP-01M0GK91, and the ordering this story
  fixes is what makes it work. Asserting a composition of two unbuilt components would be a test of
  nothing
- **Verify:** vitest "the overlay stacking order"
- **Verification target:** functional

### AC4: SSR-safe

- **Given** a server render
- **When** a portal component is included
- **Then** it renders nothing on the server and does not read document
- **Verify:** vitest "portal renders nothing on the server"
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Portal, layer scale, and scoping infrastructure

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 5 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
