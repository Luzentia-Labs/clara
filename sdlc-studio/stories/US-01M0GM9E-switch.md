# US-01M0GM9E: Switch

> **Status:** Ready
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKM2
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** apps/docs/src/content/components/switch.md, packages/react/src/components/Switch/**, packages/react/src/components/Switch/verification.md, scripts/check-component-css.mjs
> **Points:** 2

## User Story

**As a** Grace Adeyemi
**I want** a switch for settings that take effect immediately
**So that** I am not surprised by a control that saves without a submit

## Context

### Persona Reference

**Idris Vale** - UX amigo - owns inclusive design decisions
[Seat detail](../personas/seats/idris-vale.md)

### Background

A binary control that applies immediately. The whole story is the boundary between this and
Checkbox, which turns on WHEN the change takes effect and not on how the control looks.

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

### AC1: Switch role

- **Given** a Switch
- **When** a screen reader reads it
- **Then** role=switch with correct checked state
- **Verify:** vitest "Switch uses role switch"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: Documented usage boundary

- **Given** the docs
- **When** a consumer chooses between Switch and Checkbox
- **Then** Switch is documented as immediate-effect only, never for form values awaiting submission
- **Verify:** shell node scripts/check-verification.mjs --component Switch --docs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: Token-only styling

- **Given** the Switch stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC4: Both themes and densities

- **Given** a Switch
- **When** it renders in dark theme and compact density
- **Then** it renders inside the themed scope in all four combinations, the attributes it stamps
  are the ones the emitted theme stylesheets select on, and axe reports no blocking violation
- **And** its APPEARANCE is explicitly NOT covered here: visual regression is gate 7, unwired,
  tracked by US-01M0GMZW. Contrast is measured against real token values by `check:contrast`,
  because jsdom computes no layout
- **Verify:** vitest "Switch theme and density matrix|stylesheets select on"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC6: No third state

- **Given** the public API
- **When** it is generated
- **Then** SwitchProps exposes no indeterminate - a third state means the control should have been a Checkbox
- **Verify:** vitest "Switch has no third state"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC7: Definition of done

- **Given** the Switch story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** shell node scripts/check-verification.mjs --component Switch
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Switch

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
| The user flips it | The change applies immediately. There is no Save step. |
| The change would be part of a form submitted later | The wrong control has been chosen - use a Checkbox. A switch inside a form with a Save button promises immediacy the form does not deliver, so the user believes the setting is applied and navigates away. |
| The immediate write fails | The caller reverts the control and explains. A switch that applies immediately needs somewhere to put failure. |
| A third state is wanted | There is no indeterminate switch. A third state means the control should have been a Checkbox. |
| The user clicks the label text | The switch toggles; the label is a real click target, not just the track. |


## Test Scenarios

- [x] Announced as a switch, so it reads on/off rather than checked
- [x] The label text is a click target
- [x] The docs page records that the choice turns on immediacy, and names the Save-step distinction
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
