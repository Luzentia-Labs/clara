# US-01M0GM3D: Field framework

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKM2
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Field/**, packages/react/src/components/Field/verification.md, scripts/check-component-css.mjs
> **Points:** 8

## User Story

**As a** Grace Adeyemi
**I want** label, description, error and required state wired to every control automatically
**So that** shipping a form field with broken accessibility is not possible by construction

## Acceptance Criteria

### AC1: Compound composition

- **Given** a Field
- **When** I compose Label, Control, Description and Error
- **Then** each part renders and associates without manual wiring
- **Verify:** vitest "Field compound composition"
- **Verification target:** functional

### AC2: ARIA is automatic and SSR-safe

- **Given** a Field
- **When** it renders on the server and hydrates
- **Then** id, aria-describedby, aria-invalid and aria-errormessage are wired with stable generated ids
- **Verify:** vitest "Field ARIA wiring is SSR-stable"
- **Verification target:** functional

### AC3: Real label, never a placeholder

- **Given** any Field
- **When** it renders
- **Then** the label is a real element associated with the control; there is no placeholder-as-label pattern anywhere
- **Verify:** vitest "Field always renders a real label"
- **Verification target:** functional

### AC4: Error announces once

- **Given** a Field entering the error state after interaction
- **When** it renders
- **Then** aria-invalid is set, the message is linked by aria-errormessage, and role=alert announces it once
- **Verify:** vitest "Field error announces once"
- **Verification target:** functional

### AC5: Description and error coexist

- **Given** a Field with both
- **When** a screen reader reads it
- **Then** both are announced, in a documented order, neither dropped nor doubled - verified on VoiceOver and recorded before export
- **Verify:** manual VoiceOver: record announced strings for description plus error
- **Verification target:** conversational

### AC6: Uncontrolled and controlled

- **Given** a Field
- **When** it is used with native submission and with React Hook Form
- **Then** both work with no wrapper component required
- **Verify:** vitest "Field works uncontrolled and with RHF"
- **Verification target:** functional

### AC7: Token-only styling

- **Given** the Field framework stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verification target:** functional

### AC8: Both themes and densities

- **Given** a Field framework
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "Field framework theme and density matrix"
- **Verification target:** functional

### AC9: Definition of done

- **Given** the Field framework story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** file packages/react/src/components/Field/verification.md
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Field framework

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**TDD.** This component has a documented keyboard interaction table, so the table is the specification and its tests are written first (D0024).

**Points:** 8 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold, a documented keyboard interaction table, and a recorded manual keyboard pass.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
