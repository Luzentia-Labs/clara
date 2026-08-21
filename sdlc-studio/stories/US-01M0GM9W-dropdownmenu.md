# US-01M0GM9W: DropdownMenu

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** apps/docs/src/content/components/dropdown-menu.md, packages/react/src/components/DropdownMenu/**, packages/react/src/components/DropdownMenu/verification.md
> **Points:** 8

## User Story

**As a** Grace Adeyemi
**I want** an actions menu implementing the WAI-ARIA menu pattern
**So that** keyboard users can drive every action without a pointer

## Acceptance Criteria

### AC1: Menu pattern

- **Given** an open DropdownMenu
- **When** I use the keyboard
- **Then** arrow navigation, typeahead, submenus and disabled-item skipping all behave per the WAI-ARIA authoring practices
- **Verify:** vitest "DropdownMenu keyboard pattern"
- **Verification target:** functional

### AC2: Focus restoration

- **Given** an open menu
- **When** it closes by any route
- **Then** focus returns to the trigger, asserted by element identity
- **Verify:** vitest "DropdownMenu focus restoration"
- **Verification target:** functional

### AC3: Distinct from navigation

- **Given** the docs
- **When** a consumer chooses between menus
- **Then** DropdownMenu is documented as actions-only; navigation Menu is v1.1 (D0020)
- **Verify:** grep "actions" apps/docs/src/content/components/dropdown-menu.md
- **Verification target:** functional

### AC4: Token-only styling

- **Given** the DropdownMenu stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell pnpm lint:css
- **Verification target:** functional

### AC5: Both themes and densities

- **Given** a DropdownMenu
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "DropdownMenu theme and density matrix"
- **Verification target:** functional

### AC6: Definition of done

- **Given** the DropdownMenu story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** file packages/react/src/components/DropdownMenu/verification.md
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- DropdownMenu

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
