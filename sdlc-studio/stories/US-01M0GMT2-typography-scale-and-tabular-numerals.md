# US-01M0GMT2: Typography scale and tabular numerals

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKNG
> **Serves:** Sofia Marchetti
> **Affects:** packages/react/src/components/Text, packages/tokens/dist/tokens.css, packages/tokens/src/semantic/typography.json
> **Points:** 3

## User Story

**As a** Sofia Marchetti
**I want** a type scale with paired line heights and correct numeric alignment
**So that** dense financial columns can be scanned without misreading figures

## Acceptance Criteria

### AC1: Scale is tokenised

- **Given** the type system
- **When** I read the tokens
- **Then** at least seven steps, each with a paired line height
- **Verify:** grep "font-size-" packages/tokens/dist/tokens.css
- **Verification target:** functional

### AC2: Tabular numerals

- **Given** a numeric table cell
- **When** it renders
- **Then** font-variant-numeric is tabular-nums by default
- **Verify:** vitest "numeric cells use tabular numerals"
- **Verification target:** functional

### AC3: Heading semantics are decoupled

- **Given** a Heading
- **When** level and size are set independently
- **Then** semantic heading order is preserved regardless of visual size
- **Verify:** vitest "heading level and size are independent"
- **Verification target:** functional

### AC4: Truncation is recoverable by keyboard

- **Given** a truncated value
- **When** a keyboard-only user encounters it
- **Then** the full value is recoverable without a pointer, since title and hover tooltips are unreachable on a non-focusable cell
- **Verify:** vitest "truncated value recoverable by keyboard"
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Typography scale and tabular numerals

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
