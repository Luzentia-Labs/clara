# US-01M0GMBM: Input

> **Status:** Ready
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKM2
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Input/**, packages/react/src/components/Input/verification.md, scripts/check-component-css.mjs
> **Points:** 5

## User Story

**As a** Grace Adeyemi
**I want** a text input with prefix, suffix, clear and counter affordances
**So that** I can enter data all day without the control fighting me

## Context

### Persona Reference

**Rhea Okonjo** - Product Owner amigo - holds the ERP data-entry brief
[Seat detail](../personas/seats/rhea-okonjo.md)

### Background

The Input is the control an ERP user spends the day in, so two of its states carry more weight
than they usually would. Readonly and disabled look alike and are not alike: a readonly field
exists to be READ, and Clara does not take WCAG's contrast exemption for it (PRD F09).

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

### AC1: Affordances

- **Given** an Input
- **When** I configure it
- **Then** prefix, suffix, clearable and a character counter all render; the affixes are decoration
  and do not join the accessible name; clear returns focus to the input and disappears with the
  value; and the counter describes the field without imposing a `maxLength`
- **Verify:** vitest "Input affixes, clear and counter"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: Readonly versus disabled

- **Given** an Input
- **When** it is readonly or disabled
- **Then** the two are visually distinct and readonly text stays at full contrast
- **Verify:** vitest "Input readonly is distinct from disabled and full contrast"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: Native convention

- **Given** an Input
- **When** I control it
- **Then** value, defaultValue and onChange follow the native React convention receiving the native event (D0022 shape rule)
- **Verify:** vitest "Input uses native change convention"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC4: Autofill survives

- **Given** an Input
- **When** the browser autofills it
- **Then** the field remains usable and readable. Clara does NOT restyle it - an override was documented before it was implemented, and the honest statement is that the browser colour wins
- **Verify:** manual verify autofill styling in Chrome and Safari
- **Verification target:** conversational

### AC5: Token-only styling

- **Given** the Input stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs --component Input
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC6: Both themes and densities

- **Given** a Input
- **When** it renders in dark theme and compact density
- **Then** it renders inside the themed scope in all four combinations, the attributes it stamps
  are the ones the emitted theme stylesheets select on, and axe reports no blocking violation
- **And** its APPEARANCE is explicitly NOT covered here: visual regression is gate 7, unwired,
  tracked by US-01M0GMZW. Contrast is measured against real token values by `check:contrast`,
  because jsdom computes no layout
- **Verify:** vitest "^Input theme and density matrix|stylesheets select on"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC7: The ref reaches the real control

- **Given** any Clara text control
- **When** a consumer passes a ref - directly, or spread from `register()`
- **Then** it lands on the underlying element, not on a wrapper, even when the control renders a decorated group; a ref that stops at a wrapper breaks focus management and every form library that measures or focuses the field
- **Verify:** vitest "every text control forwards its ref to the real element"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC8: Definition of done

- **Given** the Input story
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
- **Verify:** shell node scripts/check-verification.mjs --component Input
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Input

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
| A field is readonly | It keeps its tab stop, stays selectable and copyable, and keeps FULL contrast. WCAG exempts disabled text from the contrast minimum; Clara does not extend that to readonly, because readonly text is there to be read. |
| A field is disabled | It is a visibly different state from readonly, not a lighter one. |
| The browser autofills the field | **Today: the browser's own background wins.** Clara does not override `:-webkit-autofill` - no such rule exists. The field still functions; it does not look like a Clara control while autofilled. Tracked as a gap, not a claim. |
| A consumer passes `onChange` | It receives the native event, not a bare value. Clara does not invent a change convention where the platform has one. |
| The field is in a compact-density subtree | It still meets the target-size floor; density scales padding, not the minimum. |


## Test Scenarios

- [ ] Renders with a visible boundary and fills the field width - **NOT verified and not verifiable
  here.** jsdom computes no layout and gate 7 (visual regression) is unwired, owned by US-01M0GMZW.
  `check-component-css.mjs` asserts only that the declarations giving the control a box EXIST; it
  cannot see the result. Previously ticked, which contradicted the rest of this story.
- [x] Readonly is focusable, copyable, and full-contrast; disabled is neither focusable-for-edit nor the same visual state
- [x] onChange receives the native event
- [ ] Autofill styling verified manually in Chrome and Safari - **not done, and there is nothing to
  verify yet.** No `:-webkit-autofill` rule exists in the repo; the override was documented before
  it was written. Recorded as a stated gap on the Input verification record.
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
| AC1 | Delete the `clearable` branch, the `maxCount` branch, or `aria-hidden` on an affix - each kills a different assertion. | Affordances |
| AC2 | Emit the native `disabled` attribute; the disabled control leaves the tab order. | Readonly versus disabled |
| AC3 | Report a bare value to `onChange` instead of the native event. | Native convention |
| AC4 | MANUAL. jsdom does not implement `:-webkit-autofill` and it is not drivable headless. | Autofill survives |
| AC5 | Add a raw literal or a tier 1 token reference to the stylesheet. | Token-only styling |
| AC6 | Rename the theme or density attribute so it no longer matches the emitted stylesheet. | Both themes and densities |
| AC7 | Stop forwarding the ref on the DECORATED path, so it lands on the wrapper span - the case that can actually break, since the plain path forwards trivially. | The ref reaches the real control |
| AC8 | Delete the Input verification record or its docs page. | Definition of done |

## Revision History

| Date | Author | Change |
| --- | --- | --- |
