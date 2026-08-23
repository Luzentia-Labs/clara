# US-01M0GMGZ: The `as` polymorphism idiom

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKGS
> **Serves:** Sofia Marchetti
> **Affects:** packages/react/src/lib/polymorphic.ts, packages/react/src/lib/polymorphic.type-test.tsx, packages/react/src/components/__tests__/primitives.test.tsx
> **Points:** 3

## User Story

**As a** Sofia Marchetti
**I want** one typed polymorphism utility used by every component that renders a variable element
**So that** design principle 2 is enforced by a shared mechanism rather than asserted in prose

## Context

### Persona Reference

**Anton Reis**
[Full persona details](../personas/seats/anton-reis.md)

### Background

`as` is Clara's single polymorphism idiom (D0008). Three idioms answering one question broke the PRD's "guessable" principle before any code existed.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| TRD Section 4 rule 8 / D0008 | API | `as` is the only polymorphism idiom | Every polymorphic prop type |
| AGENTS.md | Types | No `any`; closed sets are literal unions | Enforced by the surface contract |
| TRD Section 6 | CSS | Component CSS reads tier 2 or 3 only | Gate 2 |
| TSD gate 5 | a11y | Zero serious or critical axe violations | Every component, in four theme/density combinations |

## Acceptance Criteria

### AC1: Single idiom

- **Given** the public API
- **When** I inspect it
- **Then** `as` is the only polymorphism idiom; `asChild` appears nowhere (D0008)
- **Verify:** shell node scripts/api-report.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: Props are inferred

- **Given** a component with `as="a"`
- **When** I pass an invalid attribute for that element
- **Then** it is a TypeScript error
- **Verify:** shell npx vitest run packages/react/src/components/__tests__/primitives.test.tsx -t "as prop infers target element props"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: Refs forward through

- **Given** a polymorphic component
- **When** I attach a ref
- **Then** it reaches the rendered element
- **Verify:** shell npx vitest run packages/react/src/components/__tests__/primitives.test.tsx -t "polymorphic ref forwarding"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- The `as` polymorphism idiom

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 3 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

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

**Points:** 3
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
