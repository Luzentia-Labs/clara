# US-01M0GM0D: CheckboxGroup

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKM2
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/CheckboxGroup/**, packages/react/src/components/CheckboxGroup/verification.md, scripts/check-component-css.mjs
> **Points:** 3

## User Story

**As a** Grace Adeyemi
**I want** a labelled group of checkboxes with group-level error handling
**So that** a validation message about the whole group is announced as such

## Context

### Persona Reference

**Mira Calderon** - QA amigo - proves the accessibility that UX decided
[Seat detail](../personas/seats/mira-calderon.md)

### Background

Many answers to one question. The mirror of RadioGroup, and deliberately NOT the same keyboard
model.

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

### AC1: Group semantics

- **Given** a CheckboxGroup
- **When** it renders
- **Then** role=group with an accessible group label and aria-describedby for group-level error
- **Verify:** vitest "CheckboxGroup group semantics"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: Token-only styling

- **Given** the CheckboxGroup stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs --component CheckboxGroup
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: Both themes and densities

- **Given** a CheckboxGroup
- **When** it renders in dark theme and compact density
- **Then** it renders inside the themed scope in all four combinations, the attributes it stamps
  are the ones the emitted theme stylesheets select on, and axe reports no blocking violation
- **And** its APPEARANCE is explicitly NOT covered here: visual regression is gate 7, unwired,
  tracked by US-01M0GMZW. Contrast is measured against real token values by `check:contrast`,
  because jsdom computes no layout
- **Verify:** vitest "^CheckboxGroup theme and density matrix|stylesheets select on"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC4: Uncontrolled use accumulates

- **Given** an uncontrolled CheckboxGroup
- **When** I tick more than one option
- **Then** onChange reports the FULL set, not the last box touched, and unticking removes from the accumulated set
- **Verify:** vitest "CheckboxGroup accumulates every choice"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC5: Group error

- **Given** a CheckboxGroup in a Field with an error
- **When** it renders
- **Then** the error is associated with the fieldset, not with an individual box - as RadioGroup does
- **Verify:** vitest "CheckboxGroup error associates with the group"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC6: Definition of done

- **Given** the CheckboxGroup story
- **When** it is proposed for export
- **Then** the artefacts that CAN exist today do: unit and interaction tests using accessible
  queries, an axe assertion over default and error states, a docs page and a documented keyboard
  table - all checked by `check-verification.mjs`, which fails on a missing one and on a section
  with no content
- **And** the manual keyboard pass is **outstanding, and says so in the record**. An earlier version
  of this criterion claimed one had been recorded, and an identical fabricated paragraph sat in all
  23 verification records. The guard now requires that section to state either a real pass - naming
  the browsers it was walked in - or that it is outstanding, and a record saying "Not done." fails
- **And** the two that cannot are named rather than claimed: **Storybook stories** and a **visual baseline** - both
  belong to US-01M0GMZW, which wires the Storybook workspace and gate 7 together (`ci-gates.json`
  records gate 7 as `pending`, owned by that story). This AC previously asserted all seven and was stamped `Verified: yes` while five
  did not exist anywhere in the repo
- **Verify:** shell node scripts/check-verification.mjs --component CheckboxGroup
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- CheckboxGroup

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**TDD.** This component has a documented keyboard interaction table, so the table is the specification and its tests are written first (D0024).

**Points:** 3 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold, a documented keyboard interaction table, and a recorded manual keyboard pass.

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| The user tabs through the group | Every box is its own tab stop, unlike RadioGroup. That is correct: the options are independent, so each is a separate decision. |
| The group has a legend | A `<fieldset>` with a `<legend>`. **Standalone**, the legend names the question. **Inside a Field**, the Field's label names it through `aria-labelledby` - which outranks a native legend - and the legend is visually hidden so the same words are not painted twice. |
| A box is checked | Each box carries its own label; the legend names the question and the label names the answer. |
| The group is in error | The error is associated with the fieldset, for the same reason as RadioGroup. |


## Test Scenarios

- [x] Renders a fieldset named by its legend standalone, and by the Field's label inside one
- [x] Every option is independently reachable and toggleable
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

**Points:** 3
**Complexity:** Medium

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

## Test Plan

| Criterion | Mutant - the production change this test must fail on | Title |
| --- | --- | --- |
| AC1 | Render the group as a `<div>` instead of a `<fieldset>`, so it has no group role. (Dropping the legend does NOT kill this one: inside a Field, `aria-labelledby` supplies the name.) | Group semantics |
| AC2 | Add a raw literal or a tier 1 token reference to the stylesheet. | Token-only styling |
| AC3 | Rename the theme or density attribute. | Both themes and densities |
| AC4 | Derive the selected set from `defaultValue` instead of state, so uncontrolled use reports only the last box touched. | Uncontrolled use accumulates |
| AC5 | Move the error association off the fieldset onto an individual box. | Group error |
| AC6 | Delete the CheckboxGroup verification record or its docs page. | Definition of done |

## Revision History

| Date | Author | Change |
| --- | --- | --- |
