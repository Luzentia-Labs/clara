# US-01M0GM5M: Theming: light, dark, and context-based scoping

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKNG
> **Serves:** Sofia Marchetti
> **Affects:** packages/react/etc/clara-react.api.md, packages/react/src/theme/**, packages/tokens/dist/themes/dark.css
> **Points:** 8

## User Story

**As a** Sofia Marchetti
**I want** theme to propagate through React context so portaled content inherits correctly
**So that** a Popover opened inside a dark sidebar is not light

## Acceptance Criteria

### AC1: Default and system

- **Given** no explicit setting
- **When** the app renders
- **Then** light is the default and the theme follows prefers-color-scheme
- **Verify:** shell npx vitest run packages/react/src/theme/__tests__/theming.test.tsx -t "theme follows system preference"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: Explicit forcing

- **Given** data-clara-theme is set
- **When** the app renders
- **Then** the explicit value wins over the system preference
- **Verify:** shell npx vitest run packages/react/src/theme/__tests__/theming.test.tsx -t "explicit theme wins"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: Context, not DOM

- **Given** a ClaraScope with a dark theme
- **When** a descendant portals to document.body
- **Then** the portal root carries data-clara-theme=dark and renders dark (TRD ADR-006)
- **Verify:** shell npx vitest run packages/react/src/theme/__tests__/theming.test.tsx -t "portal inherits scoped theme"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC4: No overlay props

- **Given** the public API
- **When** I inspect every overlay
- **Then** none accepts a theme, density, or portalContainer prop
- **Verify:** shell node scripts/api-report.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC5: No flash in SSR

- **Given** a server render
- **When** the page hydrates
- **Then** no layout shift and no flash of the wrong theme
- **Verify:** shell npx vitest run packages/react/src/theme/__tests__/theming.test.tsx -t "no theme flash on hydration"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Theming: light, dark, and context-based scoping

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**TDD.** This component has a documented keyboard interaction table, so the table is the specification and its tests are written first (D0024).

**Points:** 8 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
