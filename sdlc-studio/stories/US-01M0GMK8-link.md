# US-01M0GMK8: Link

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKGS
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Link/**, packages/react/src/components/Link/verification.md
> **Points:** 2

## User Story

**As a** Grace Adeyemi
**I want** a link that is distinguishable without relying on colour
**So that** I can tell a link from body text even if I cannot distinguish the colours

## Context

### Persona Reference

**Idris Vale**
[Full persona details](../personas/seats/idris-vale.md)

### Background

A link navigates and a button acts. Blurring the two is a common and expensive accessibility defect, so the API does not offer it.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| TRD Section 4 rule 8 / D0008 | API | `as` is the only polymorphism idiom | Every polymorphic prop type |
| AGENTS.md | Types | No `any`; closed sets are literal unions | Enforced by the surface contract |
| TRD Section 6 | CSS | Component CSS reads tier 2 or 3 only | Gate 2 |
| TSD gate 5 | a11y | Zero serious or critical axe violations | Every component, in four theme/density combinations |

## Acceptance Criteria

### AC1: Not colour alone

- **Given** a Link in body text
- **When** it renders
- **Then** an underline or other non-colour affordance distinguishes it
- **Verify:** shell npx vitest run packages/react/src/components/__tests__/matrix.test.tsx -t "Link is distinguishable without colour"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: External links are announced

- **Given** a Link to an external target
- **When** it renders
- **Then** the external destination is conveyed to assistive technology, not only by an icon
- **Verify:** shell npx vitest run packages/react/src/components/__tests__/matrix.test.tsx -t "external Link is announced"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: Token-only styling

- **Given** the Link stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC4: Both themes and densities

- **Given** a Link
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** shell npx vitest run packages/react/src/components/__tests__/matrix.test.tsx -t "Link theme and density matrix"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC5: Definition of done

- **Given** the Link story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** file packages/react/src/components/Link/verification.md
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Link

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
| A consumer passes an attribute invalid on the `as` target | Rejected at COMPILE time, asserted by `@ts-expect-error` |
| A component is rendered in the other theme or density | Renders from tokens; asserted across all four combinations |
| A raw literal or tier 1 token enters the CSS | Gate 2 fails |
| A ref is passed | Forwarded to the element `as` names, not a wrapper |
| An accessible name is omitted where one is required | A compile error, because the prop is required |

> **Minimum edge cases:** 5 - 5 recorded.

## Test Scenarios

- [ ] Renders its natural element, and the element `as` names
- [ ] Forwards a ref to the rendered element
- [ ] Passes axe in all four theme x density combinations
- [ ] Uses token classes only, never an inline style
- [ ] Keyboard behaviour matches the verification record

> **Minimum test scenarios:** 5 - recorded above.

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0GMGZ](US-01M0GMGZ-the-as-polymorphism-idiom.md) | Blocked by (resolved) | The polymorphism idiom | Done |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| EP-01M0GKNG (foundations) | Tokens | Done |

## Estimation

**Points:** 2
**Complexity:** Proportional to its surface. The types and the accessibility contract carry the weight, not the markup.

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

**Affects production runtime:** false - nothing is published.

*Reversal is `git revert`.* The component's name and props are public API and permanent once published.

## Open Questions

None.

**Honest limit:** screen reader announcements are not automated - axe checks the accessibility tree, not what NVDA or VoiceOver say. Visual regression (gate 7) is not yet wired, so appearance is unverified. Both are stated in the component's verification record.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
