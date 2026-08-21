# US-01M0GMXH: Colour-alone audit

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKVE
> **Serves:** Sofia Marchetti
> **Affects:** docs/audits/colour-alone.md
> **Points:** 3

## User Story

**As a** Maintainer
**I want** a per-component audit proving no meaning is carried by colour alone
**So that** the highest-volume accessibility failure in a component library is closed by name

## Acceptance Criteria

### AC1: Audit covers every component

- **Given** the component set
- **When** the audit runs
- **Then** each component is assessed and the result recorded
- **Verify:** file docs/audits/colour-alone.md
- **Verification target:** functional

### AC2: Badge and Tag by name

- **Given** the audit
- **When** I read it
- **Then** Badge and Tag are covered explicitly, since they appear most often on a list screen
- **Verify:** grep "Badge" docs/audits/colour-alone.md
- **Verification target:** functional

### AC3: Automated where possible

- **Given** status components
- **When** the suite runs
- **Then** a test renders them with colour removed and asserts the meaning survives
- **Verify:** vitest "meaning survives without colour"
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Colour-alone audit

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
