# US-01M0GM2K: Textarea

> **Status:** Ready
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKM2
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Textarea/**, packages/react/src/components/Textarea/verification.md, scripts/check-component-css.mjs
> **Points:** 3

## User Story

**As a** Grace Adeyemi
**I want** a multi-line input that grows without losing my place
**So that** long notes are readable without a scroll box the size of a stamp

## Context

### Persona Reference

**Rhea Okonjo** - Product Owner amigo - holds the ERP data-entry brief
[Seat detail](../personas/seats/rhea-okonjo.md)

### Background

A notes field on a purchase order is the common case. Auto-resize is wanted, but unbounded
auto-resize is worse than none: the field grows until the submit button is off screen, and the user
cannot see the action they are about to take.

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

### AC1: Auto-resize with a cap

- **Given** a Textarea
- **When** I type past its initial height
- **Then** it grows to maxRows then scrolls
- **Verify:** vitest "Textarea auto-resize respects maxRows"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: Token-only styling

- **Given** the Textarea stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: Both themes and densities

- **Given** a Textarea
- **When** it renders in dark theme and compact density
- **Then** it renders inside the themed scope in all four combinations, the attributes it stamps
  are the ones the emitted theme stylesheets select on, and axe reports no blocking violation
- **And** its APPEARANCE is explicitly NOT covered here: visual regression is gate 7, unwired,
  tracked by US-01M0GMZW. Contrast is measured against real token values by `check:contrast`,
  because jsdom computes no layout
- **Verify:** vitest "Textarea theme and density matrix|stylesheets select on"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC4: Enter and Tab behave

- **Given** a Textarea in a form
- **When** the user presses Enter, then Tab
- **Then** Enter inserts a newline and does not submit; Tab leaves the control rather than indenting
- **Verify:** vitest "Textarea auto-resize respects maxRows, and its keyboard keys behave"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC5: Definition of done

- **Given** the Textarea story
- **When** it is proposed for export
- **Then** the artefacts that CAN exist today do: unit and interaction tests using accessible
  queries, an axe assertion over default and error states, a docs page, a documented keyboard table
  and a recorded manual keyboard pass - all checked by `check-verification.mjs`, which fails on a
  missing one and on a section with no content
- **And** the two that cannot are named rather than claimed: **Storybook stories** and a **visual baseline** - both
  belong to US-01M0GMZW, which wires the Storybook workspace and gate 7 together (`ci-gates.json`
  records gate 7 as `pending`, owned by that story). This AC previously asserted all seven and was stamped `Verified: yes` while five
  did not exist anywhere in the repo
- **Verify:** shell node scripts/check-verification.mjs --component Textarea
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Textarea

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
| `maxRows` is set and the content exceeds it | The control stops growing and scrolls. The cap is the point of the feature, not a limit bolted onto it. |
| `maxRows` is omitted | No auto-resize at all. The behaviour is opt-in, so an existing fixed-height textarea does not silently start moving. |
| Enter is pressed | A newline is inserted; the form is not submitted. |
| Tab is pressed | Focus leaves the control rather than indenting. |
| Content is removed | The control shrinks back, down to its `rows` floor, rather than keeping the height it once needed. |


## Test Scenarios

- [x] Grows with content when maxRows is set
- [x] Scrolls rather than growing past the cap
- [x] Stays a fixed height when maxRows is omitted
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

## Revision History

| Date | Author | Change |
| --- | --- | --- |
