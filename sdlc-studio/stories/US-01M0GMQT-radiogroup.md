# US-01M0GMQT: RadioGroup

> **Status:** Ready
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKM2
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/etc/clara-react.api.md, packages/react/src/components/RadioGroup/**, packages/react/src/components/RadioGroup/verification.md, scripts/check-component-css.mjs
> **Points:** 5

## User Story

**As a** Grace Adeyemi
**I want** a radio group with correct roving focus
**So that** arrow keys move between options as a screen reader user expects

## Context

### Persona Reference

**Mira Calderon** - QA amigo - proves the accessibility that UX decided
[Seat detail](../personas/seats/mira-calderon.md)

### Background

One answer to one question. Two requirements matter: the keyboard model, and where an error
belongs when the thing that is wrong is that nothing was chosen.

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

### AC1: Roving focus

- **Given** a RadioGroup
- **When** I tab in and press arrow keys
- **Then** the group is one tab stop and arrows move and select per WAI-ARIA
- **Verify:** vitest "RadioGroup roving focus|RadioGroup is a single tab stop"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: Radio only exists in a group

- **Given** the public API
- **When** I inspect it
- **Then** Radio is not exported for standalone use outside RadioGroup
- **Verify:** shell test -s packages/react/dist/index.d.ts && grep -q "RadioGroupProps" packages/react/dist/index.d.ts && ! grep -qE "^(export )?declare (function|const|type|interface) Radio[^A-Za-z0-9_]" packages/react/dist/index.d.ts
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: Group error

- **Given** a RadioGroup in error
- **When** it renders
- **Then** the error associates with the group, not an individual option
- **Verify:** vitest "RadioGroup error associates with group"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC4: Token-only styling

- **Given** the RadioGroup stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs --component RadioGroup
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC5: Both themes and densities

- **Given** a RadioGroup
- **When** it renders in dark theme and compact density
- **Then** it renders inside the themed scope in all four combinations, the attributes it stamps
  are the ones the emitted theme stylesheets select on, and axe reports no blocking violation
- **And** its APPEARANCE is explicitly NOT covered here: visual regression is gate 7, unwired,
  tracked by US-01M0GMZW. Contrast is measured against real token values by `check:contrast`,
  because jsdom computes no layout
- **Verify:** vitest "^RadioGroup theme and density matrix|stylesheets select on"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC6: The Field label names the group

- **Given** a RadioGroup inside a Field with labelFor="group"
- **When** it renders
- **Then** the group is named by aria-labelledby; no label points at an element that cannot receive it
- **Verify:** vitest "Field labelFor group names the group instead of orphaning a label"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC7: Definition of done

- **Given** the RadioGroup story
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
- **Verify:** shell node scripts/check-verification.mjs --component RadioGroup
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- RadioGroup

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**TDD.** This component has a documented keyboard interaction table, so the table is the specification and its tests are written first (D0024).

**Points:** 5 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold, a documented keyboard interaction table, and a recorded manual keyboard pass.

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| The user tabs into the group | The group is ONE tab stop, and arrow keys move and choose within it. This is the browser's own behaviour for same-named radios, not a roving-tabindex implementation, so it stays correct in every browser without Clara maintaining it. |
| The group is in error | `aria-invalid` and `aria-errormessage` sit on the FIELDSET, not on an individual radio. Marking every option invalid says each answer is wrong, when what is wrong is that none was chosen. |
| A caller wants a single radio | None is exported. A lone radio is a control the user cannot deselect, and shipping one invites it. |
| The group has a legend | It names the QUESTION, and each radio names an answer, so a screen reader announces the question before each option. |


## Test Scenarios

- [x] The group is one tab stop and arrow keys choose
- [x] The error is associated with the fieldset, not an option
- [x] No bare Radio appears in the public API report
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

**Points:** 5
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
| AC1 | Add `tabIndex={0}` to every radio, or give each a distinct `name`. Note the LIMIT: `userEvent.tab()` implements radio grouping itself, so the outcome is not observable in jsdom - what is asserted is the shared name and the absent tabIndex, and the outcome belongs in Playwright. | Roving focus |
| AC2 | Export a bare `Radio`. The verifier also asserts the API report exists and is non-empty, so deleting it fails rather than passing. | Radio only exists in a group |
| AC3 | Move `aria-invalid`/`aria-errormessage` from the fieldset onto an individual radio. | Group error |
| AC4 | Add a raw literal or a tier 1 token reference to the stylesheet. | Token-only styling |
| AC5 | Rename the theme or density attribute. | Both themes and densities |
| AC6 | Delete `aria-labelledby` from the fieldset, or stop hiding the legend in group mode. Both are asserted on BOTH groups. | The Field label names the group |
| AC7 | Delete the RadioGroup verification record or its docs page. | Definition of done |

## Revision History

| Date | Author | Change |
| --- | --- | --- |
