# US-01M0GM3D: Field framework

> **Status:** Ready
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKM2
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Field/**, packages/react/src/components/Field/verification.md, scripts/check-component-css.mjs
> **Points:** 8

## User Story

**As a** Grace Adeyemi
**I want** label, description, error and required state wired to every control automatically
**So that** shipping a form field with broken accessibility is not possible by construction

## Context

### Persona Reference

**Idris Vale** - UX amigo - owns inclusive design decisions; accessibility is decided here and proved by QA
[Seat detail](../personas/seats/idris-vale.md)

### Background

Every control in this epic inherits its accessibility from the Field, so the Field is where the
wiring is either right once or wrong nine times. An ERP form is the densest accessibility surface
Clara has: dozens of controls, each needing a label, a description, an error, and the associations
between them. Doing that per control guarantees drift; doing it in one place makes it checkable.

Reclassified to client-only during implementation (D0060): a Field renders a context Provider, and
a Server Component cannot.

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

### AC1: Compound composition

- **Given** a Field
- **When** I compose Label, Control, Description and Error
- **Then** each part renders and associates without manual wiring
- **Verify:** vitest "Field compound composition"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: ARIA is automatic and SSR-safe

- **Given** a Field
- **When** it renders on the server and hydrates
- **Then** id, aria-describedby, aria-invalid and aria-errormessage are wired with stable generated ids
- **Verify:** vitest "Field ARIA wiring is SSR-stable"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: Real label, never a placeholder

- **Given** any Field
- **When** it renders
- **Then** the label is a real element associated with the control; there is no placeholder-as-label pattern anywhere
- **Verify:** vitest "Field always renders a real label"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC4: Error announces once

- **Given** a Field entering the error state after interaction
- **When** it renders
- **Then** aria-invalid is set, the message is linked by aria-errormessage, and role=alert announces it once
- **Verify:** vitest "Field error announces once"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC5: Description and error coexist, in a documented order

- **Given** a Field with both a description and an error
- **When** it renders
- **Then** `aria-describedby` lists the description first and the error second, both ids resolve,
  and neither is listed twice
- **Verify:** vitest "Field description and error coexist"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

> Split from the announcement criterion below. The ORDER and the de-duplication are properties of
> the DOM and were already asserted by a test that no AC selected - so an automatable half was
> sitting behind a manual verifier, which is how a manual AC becomes a place things go to stop being
> checked.

### AC6: Both are actually announced

- **Given** a Field with both
- **When** a screen reader reads it
- **Then** both are announced, neither dropped nor doubled - verified on VoiceOver and the strings
  recorded in `packages/react/src/components/Field/verification.md` before export
- **And** this has **not** been done. The record says so under its manual keyboard pass, which is
  outstanding for the same reason: what a screen reader speaks is not observable from this repo.
  The DOM order and de-duplication that the announcement depends on ARE verified, by AC5
- **Verify:** manual VoiceOver: record announced strings for description plus error
- **Verification target:** conversational

### AC7: Uncontrolled and controlled

- **Given** a Field
- **When** it is used with native submission and with React Hook Form
- **Then** both work with no wrapper component required
- **Verify:** vitest "Field works uncontrolled and with RHF"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC8: Token-only styling

- **Given** the Field framework stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs --component Field
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC9: Both themes and densities

- **Given** a Field framework
- **When** it renders in dark theme and compact density
- **Then** it renders inside the themed scope in all four combinations, the attributes it stamps
  are the ones the emitted theme stylesheets select on, and axe reports no blocking violation
- **And** its APPEARANCE is explicitly NOT covered here: visual regression is gate 7, unwired,
  tracked by US-01M0GMZW. Contrast is measured against real token values by `check:contrast`,
  because jsdom computes no layout
- **Verify:** vitest "^Field framework theme and density matrix|stylesheets select on"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC10: Disabled stays reachable

- **Given** a disabled Field
- **When** it renders
- **Then** the control is aria-disabled and readOnly, NOT natively disabled - it keeps its tab stop, so the reason attached to it can be reached (D0058, D0028)
- **Verify:** vitest "keeps every disabled control REACHABLE"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC11: A wrapped control is still wired

- **Given** a control nested inside a wrapper rather than a direct child
- **When** the Field renders
- **Then** the wiring still reaches it, because it travels by context and not by cloning children
- **Verify:** vitest "wires a control that is WRAPPED"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC12: Disabled suppresses the interaction

- **Given** a disabled Field around any control
- **When** the user clicks or presses Space, steps a NumberInput, or presses a clear or reveal button
- **Then** no consumer handler runs by any route - `onChange` or `onClick` - and no value, checked
  state, or masked value changes
- **Verify:** vitest "a disabled Field suppresses the interaction by pointer and keyboard alike|a disabled control runs no consumer handler by any route"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC13: Required is announced, by whichever route the control has

- **Given** a required Field
- **When** it wraps a single control, a RadioGroup, or a CheckboxGroup
- **Then** the requirement reaches the user exactly once - `aria-required` where the role supports it (a single control, a `radiogroup`), and a visually-hidden marker composed into the name where it does not (a `<fieldset>`, which is role=group). The visible asterisk is `aria-hidden` either way and is never the only signal
- **Verify:** vitest "a required group announces the requirement exactly once"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC14: Definition of done

- **Given** the Field framework story
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
- **Verify:** shell node scripts/check-verification.mjs --component Field
- **Verified:** yes (2026-08-23)
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

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| A control is wrapped - in a Tooltip, a layout primitive, a fragment | The wiring still reaches it. This is why the Field passes by CONTEXT rather than cloning children: `React.Children.map` sees only the immediate child, so cloning would silently skip exactly the compositions a real form is built from (D0060). |
| A Field has both a description and an error | `aria-describedby` lists description then error, in that DOM order, so the hint is heard before the correction rather than after it. |
| A Field has no error | The error region is not rendered at all. Rendering it empty makes `role="alert"` fire on mount, announcing nothing, and trains the user to ignore it. |
| The same form renders on the server and hydrates | Ids come from `useId()`, so server and client markup agree; a random id re-wires `aria-describedby` at hydration and the association is lost. |
| A consumer passes their own `id` | **They cannot.** `id` is omitted from `FieldProps` and from every control's props, deliberately: AC2 requires ids that are stable across server render and hydration, and a consumer-supplied id cannot be guaranteed unique on a page that renders the same form twice. An earlier version of this row promised the opposite. |
| A Field is given no label | It does not compile. There is no placeholder-as-label path. |


## Test Scenarios

- [x] Compound composition renders label, control, description and error in DOM order
- [x] Ids are stable across a server render and hydration
- [x] A wrapped control still receives the wiring through context
- [x] The error region appears only when there is an error, and announces on appearance
- [x] Works uncontrolled, and under react-hook-form's register
- [x] axe reports zero serious or critical violations in all four theme x density combinations


## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| -- | -- | This story IS the framework the others depend on | -- |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| React 18 / 19 (`useId`, `useContext`) | Peer | Available |
| Tier 2 geometry and colour tokens (D0056) | Internal | Available |

## Estimation

**Points:** 8
**Complexity:** High

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
| AC1 | Stop rendering the description element, so `aria-describedby` resolves to nothing. (Dropping `htmlFor` kills eight tests, but seven are under AC3 - a row must name the mutant that kills THIS criterion, not one that kills somewhere in the suite.) | Compound composition |
| AC2 | Replace `useId()` with `String(Math.random())`; hydration reports a mismatch and the test asserts on that report, because React keeps the server DOM and comparing markup cannot see it. | ARIA is automatic and SSR-safe |
| AC3 | Render the label as a `<span>` with no association. | Real label, never a placeholder |
| AC4 | Render the error region unconditionally instead of only when there is an error, so `role="alert"` fires on mount. | Error announces once |
| AC5 | Reverse the `aria-describedby` order so the error precedes the description. | Description and error coexist, in a documented order |
| AC6 | MANUAL. No mutant: what VoiceOver speaks is not observable from a test. | Both are actually announced |
| AC7 | Ignore the consumer `value`/`defaultValue` so the control stops tracking it. | Uncontrolled and controlled |
| AC8 | Add a raw literal or a tier 1 token reference to the stylesheet. | Token-only styling |
| AC9 | Rename `data-clara-theme` in `resolve.ts` so the attribute no longer matches what the emitted theme stylesheet selects on. | Both themes and densities |
| AC10 | Emit the native `disabled` attribute instead of `aria-disabled` + `readOnly`; the control leaves the tab order and the focus assertion dies. | Disabled stays reachable |
| AC11 | Pass the wiring by cloning children instead of by context - a wrapped control stops being wired. | A wrapped control is still wired |
| AC12 | Delete the guard from `onClick` (consumer handler runs) or from `onChange` (the toggle happens). Both are covered separately. | Disabled suppresses the interaction |
| AC13 | Delete a verification record, empty its Stated gaps, remove its keyboard table, or delete a docs page. | Definition of done |

## Revision History

| Date | Author | Change |
| --- | --- | --- |
