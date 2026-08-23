# US-01M0GM2X: SearchInput

> **Status:** Ready
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKM2
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** apps/docs/src/content/components/search-input.md, packages/react/src/components/SearchInput/**, packages/react/src/components/SearchInput/verification.md, scripts/check-component-css.mjs
> **Points:** 2

## User Story

**As a** Grace Adeyemi
**I want** a search field with a clear affordance
**So that** I can reset a filter without selecting and deleting text

## Context

### Persona Reference

**Rhea Okonjo** - Product Owner amigo - holds the ERP data-entry brief
[Seat detail](../personas/seats/rhea-okonjo.md)

### Background

Filtering a list. Two decisions carry the story: the clear button is Clara's own rather than the
browser's, and Clara does not debounce (D0062).

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| Epic | Accessibility | WCAG 2.2 AA, zero serious or critical axe violations | The theme x density matrix AC runs axe in all four combinations |
| Epic | Boundary | Field and every control are client-only (D0060) | `client-boundary.json` classifies them client; `check:client-boundary` fails if one is unclassified |
| PRD | Performance | Per-component JS budget, 5 kB gzipped (D0053) | `.size-limit.json` is generated from the classification, so a control cannot ship unbudgeted |
| PRD | Security | The library reads no environment variables and makes no network calls | No AC introduces either; nothing here has a runtime configuration surface |
| PRD F01 | API stability | Tier 2 tokens and every exported name are public API | The token-only styling AC forbids tier 1 reads and raw literals |

## Acceptance Criteria

### AC1: Clear is keyboard reachable

- **Given** a SearchInput with a value
- **When** I reach the clear control by keyboard
- **Then** it clears the value and returns focus to the input
- **Verify:** vitest "SearchInput clear returns focus"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: Debounce is guidance not policy

- **Given** the docs
- **When** a consumer implements search
- **Then** debounce guidance is documented; Clara does not impose a delay
- **Verify:** shell node scripts/check-verification.mjs --component SearchInput --docs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: Token-only styling

- **Given** the SearchInput stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC4: Both themes and densities

- **Given** a SearchInput
- **When** it renders in dark theme and compact density
- **Then** it renders inside the themed scope in all four combinations, the attributes it stamps
  are the ones the emitted theme stylesheets select on, and axe reports no blocking violation
- **And** its APPEARANCE is explicitly NOT covered here: visual regression is gate 7, unwired,
  tracked by US-01M0GMZW. Contrast is measured against real token values by `check:contrast`,
  because jsdom computes no layout
- **Verify:** vitest "SearchInput theme and density matrix|stylesheets select on"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC6: Clear exists only when there is something to clear

- **Given** a SearchInput
- **When** the field is empty
- **Then** no clear button is rendered, so there is no dead tab stop; it appears with a value, works uncontrolled, and calls onClear after the value is gone
- **Verify:** vitest "SearchInput clear appears only when there is something to clear"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC7: Definition of done

- **Given** the SearchInput story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** shell node scripts/check-verification.mjs --component SearchInput
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- SearchInput

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**TDD.** This component has a documented keyboard interaction table, so the table is the specification and its tests are written first (D0024).

**Points:** 2 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold, a documented keyboard interaction table, and a recorded manual keyboard pass.

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| The clear button is pressed | The value is cleared AND focus returns to the input. A clear button that keeps focus strands a keyboard user on a control that has just been removed from the page. |
| The browser would draw its own clear affordance | It is suppressed. The native one is unstyled, absent in Firefox, and not keyboard reachable in Safari. |
| The caller is filtering a local list | Nothing is debounced, so the list does not lag the typing. Debouncing a local filter adds latency to an operation that had none. |
| The caller is querying a server | They debounce it themselves, and discard a stale response. The docs page states both cases; a component cannot know which one it is in. |
| There is no value | No clear button is rendered, so there is no dead control in the tab order. |


## Test Scenarios

- [x] Clearing empties the value and returns focus to the input
- [x] The control is announced as a search field
- [x] The docs page records that debouncing is the caller's decision, and what to do in each case
- [x] axe clean in all four theme x density combinations


## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0GM3D](US-01M0GM3D-field-framework.md) | Blocking | The Field wiring this control reads from context | Done |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| React 18 / 19 (`useId`, `useContext`) | Peer | Available |
| Tier 2 geometry and colour tokens (D0056) | Internal | Available |

## Estimation

**Points:** 2
**Complexity:** Low

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

**Affects production runtime:** false

| Component | Reversal | Expected time |
| --- | --- | --- |
| -- | -- | -- |

*Not applicable - this is a library with no deployed runtime. A released version is reverted by publishing a patch forward; releases are immutable and never unpublished.*

## Open Questions

- None open.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
