# US-01M0GMYZ: Icon pipeline and the enumerated v1 icon set

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKGS
> **Serves:** Sofia Marchetti
> **Affects:** packages/icons/svg, packages/icons/icons.json, packages/icons/ICONS.md, packages/icons/generate-icons.mjs, packages/icons/src, scripts/check-icons.mjs, packages/icons/src/__tests__/icons.test.tsx
> **Points:** 5

## User Story

**As a** Sofia Marchetti
**I want** a generated icon set from SVG source with a committed, counted list
**So that** the set is a specification rather than a promise to add icons as needed

## Context

### Persona Reference

**Sofia Marchetti**
[Full persona details](../personas/sofia-marchetti.md)

### Background

An enumerated, counted icon set committed before implementation (PRD:357) - because "at minimum the icons we need" is not a list, and CI cannot check it.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| TRD Section 4 rule 8 / D0008 | API | `as` is the only polymorphism idiom | Every polymorphic prop type |
| AGENTS.md | Types | No `any`; closed sets are literal unions | Enforced by the surface contract |
| TRD Section 6 | CSS | Component CSS reads tier 2 or 3 only | Gate 2 |
| TSD gate 5 | a11y | Zero serious or critical axe violations | Every component, in four theme/density combinations |

## Acceptance Criteria

### AC1: List is enumerated

- **Given** the repo
- **When** I look for the icon list
- **Then** `packages/icons/ICONS.md` names all 48 icons by category, committed before implementation
- **Verify:** shell node scripts/check-icons.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: List and exports agree

- **Given** the built package
- **When** CI runs
- **Then** an exported icon absent from the list, or a listed icon unexported, fails the build
- **Verify:** shell node scripts/check-icons.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: Icons inherit colour and size

- **Given** an icon
- **When** it renders inside text
- **Then** it uses currentColor and scales from font size, with a size prop override
- **Verify:** shell npx vitest run packages/icons/src/__tests__/icons.test.tsx -t "icon inherits currentColor and size"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC4: Decorative by default

- **Given** an icon with no aria-label
- **When** it renders
- **Then** it is aria-hidden and treated as decorative
- **Verify:** shell npx vitest run packages/icons/src/__tests__/icons.test.tsx -t "icon without label is aria-hidden"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC5: Import cost

- **Given** a single icon import
- **When** the bundle is measured
- **Then** it adds no more than 1KB gzipped
- **Verify:** shell pnpm size
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Icon pipeline and the enumerated v1 icon set

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 5 (modified Fibonacci; nothing here exceeds 8, the split threshold).

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

**Points:** 5
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
