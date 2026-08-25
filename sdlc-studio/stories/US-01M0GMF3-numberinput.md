# US-01M0GMF3: NumberInput

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKM2
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/NumberInput/NumberInput.tsx, packages/react/src/components/NumberInput/index.tsx, packages/react/src/components/NumberInput/verification.md, packages/react/src/components/NumberInput/verification.md, scripts/check-component-css.mjs
> **Points:** 5

## User Story

**As a** Grace Adeyemi
**I want** numeric entry that does not change value when I scroll the page
**So that** I never post a wrong figure because the wheel moved over a field

## Context

### Persona Reference

**Rhea Okonjo** - Product Owner amigo - holds the ERP data-entry brief
[Seat detail](../personas/seats/rhea-okonjo.md)

### Background

Quantities, amounts and codes. `type="number"` has a poor reputation in data entry for two
specific reasons - it mutates on scroll, and it mangles values that only look numeric - and this
story is mostly about not inheriting either.

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

### AC1: No wheel mutation

- **Given** a focused NumberInput
- **When** I scroll the page
- **Then** the value does not change; it uses inputMode=decimal rather than type=number
- **Verify:** vitest "NumberInput ignores wheel"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: Constraints and formatting

- **Given** a NumberInput
- **When** I configure min, max and step
- **Then** `step` governs the size of a keyboard step and `min`/`max` clamp it; figures are tabular;
  and a leading zero is preserved
- **And** the bounds are NOT enforced against typing. They are deliberately kept off the DOM, so the
  browser blocks nothing: clamping as the user types fights them mid-entry, and rejecting a
  keystroke loses a paste. Nor does the control mark itself invalid: that fired on VALID entry (a
  correct `500` passes through `5` and `50` in a `min={100}` field), was invisible to sighted users,
  and would oblige Clara under SC 3.3.1 to write error text it has no honest basis for. Detection is
  the form's job, and the Field stays the single source of invalidity (D0086)
- **Verify:** vitest "NumberInput constraints and formatting|arrow keys step and clamp|does not detect errors of its own"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: Keyboard stepping

- **Given** a NumberInput that has opted into numeric semantics by naming a `min`, `max` or `step`
- **When** I focus it and press Arrow Up or Arrow Down
- **Then** the value steps by `step`, clamped to the bounds, reported through `onChange` so a
  controlled consumer stays in sync, and announced through the spinbutton role
- **And** a control that named NONE of the three does not step and does not swallow the key. That is
  the account-code case: unconditional stepping rewrote `4417` to `4418` on Arrow Up and called
  `preventDefault`, destroying caret navigation (D0077). This criterion previously read as though
  stepping were unconditional, which described the removed defect as correct
- **Verify:** vitest "NumberInput arrow keys step and clamp|leaves a plain code field alone"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC4: Token-only styling

- **Given** the NumberInput stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs --component NumberInput
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC5: Both themes and densities

- **Given** a NumberInput
- **When** it renders in dark theme and compact density
- **Then** it renders inside the themed scope in all four combinations, the attributes it stamps
  are the ones the emitted theme stylesheets select on, and axe reports no blocking violation
- **And** its APPEARANCE is explicitly NOT covered here: visual regression is gate 7, unwired,
  tracked by US-01M0GMZW. Contrast is measured against real token values by `check:contrast`,
  because jsdom computes no layout
- **Verify:** vitest "^NumberInput theme and density matrix|stylesheets select on"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC6: Reaching the bounds

- **Given** a bounded NumberInput
- **When** the user presses Home, End, PageUp or PageDown
- **Then** the value jumps to the bound, or steps by ten TIMES `step`, and a fractional step writes no float noise
- **Verify:** vitest "NumberInput keyboard reaches the bounds and holds precision"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC7: Definition of done

- **Given** the NumberInput story
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
- **Verify:** shell node scripts/check-verification.mjs --component NumberInput
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- NumberInput

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
| The page is scrolled while the control has focus | The value does not change, because the control is never `type="number"` - the guarantee is structural. An earlier implementation blurred the control on wheel; that protected against nothing and stole focus from anyone scrolling a long form, so it was removed (D0062). |
| Arrow Up or Down is pressed | The value steps by `step` and clamps to `min` and `max`. Stepping goes through the native value setter so React's own `onChange` fires and a CONTROLLED component stays in sync. |
| A leading zero is typed, as in an account code `00417` | It is preserved. An account code is not a quantity. |
| Amounts are shown in a column | Figures are tabular, so the digits align without a monospace face. |
| `min` or `max` is supplied | It is announced as `aria-valuemin` / `aria-valuemax`, and typed as `number` rather than the HTML attribute's `string | number` - a bound compared as a string makes `"9" > "10"` true. |


## Test Scenarios

- [x] Wheel over a focused control does not change the value
- [x] Arrow keys step and report through onChange, for a controlled component
- [x] Stepping clamps to the declared bounds
- [x] Bounds are announced to assistive technology
- [x] A leading zero survives
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

| Criterion | Touches | Mutant - the production change this test must fail on | Title |
| --- | --- | --- | --- |
| AC1 | packages/react/src/components/NumberInput/NumberInput.tsx | Change `type="text"` to `type="number"`, which is what makes the wheel harmless. Deleting the old `onWheel` blur handler proves nothing, which is why that handler was removed. | No wheel mutation |
| AC2 | packages/react/src/components/NumberInput/NumberInput.tsx | Re-introduce `aria-invalid` for an out-of-range typed value (it fires while a correct value is part-typed), or delete `font-variant-numeric` from `.clara-input--numeric`, or let a leading zero be stripped. | Constraints and formatting |
| AC3 | packages/react/src/components/NumberInput/NumberInput.tsx | Make Arrow Up a no-op, or disable `clamp()`. Both die under this criterion; the Home/End and precision mutants belong to the bounds criterion below. | Keyboard stepping |
| AC4 | packages/react/src/styles.css | Add a raw literal or a tier 1 token reference to the stylesheet. | Token-only styling |
| AC5 | packages/react/src/components/NumberInput/NumberInput.tsx | Rename the theme or density attribute. | Both themes and densities |
| AC6 | packages/react/src/components/NumberInput/NumberInput.tsx | Delete `Home`/`End`, or the `+ mantissa` term in `atStepPrecision`. These do NOT die under the arrow-stepping criterion above - the rows were the wrong way round. | Reaching the bounds |
| AC7 | packages/react/src/components/NumberInput/verification.md | Delete the NumberInput verification record or its docs page. | Definition of done |

## Revision History

| Date | Author | Change |
| --- | --- | --- |

## Deferred, deliberately

**Thousands separators are not built.** The original AC2 named them and nothing implemented them,
while the criterion was stamped `Verified: yes` - which is how a claim outlives the feature it
describes. Formatting a value while it is being typed has to preserve the caret across every
insertion, deletion and paste, and an implementation that gets that wrong is worse than none: the
caret jumps mid-entry and the user retypes the field. It is a story of its own, not a clause in this
one. Today, format for display outside the control; the docs page says so.

**Stepper buttons are not built either** (PRD F09). The control offers keyboard stepping and no
visible `+`/`-`. A stepper is two more tab stops on every numeric field in a dense form, which is a
real cost to the keyboard user the rest of this story is written for; and a stepper that is not also
a spinbutton misleads, so it has to arrive with the role, the bounds and the announcements together.
It was DROPPED rather than deferred until a spec review noticed - which is what this section is for.
