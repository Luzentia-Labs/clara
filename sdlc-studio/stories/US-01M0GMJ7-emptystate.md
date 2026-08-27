# US-01M0GMJ7: EmptyState

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/EmptyState/**, packages/react/src/components/EmptyState/index.tsx, scripts/check-component-css.mjs
> **Points:** 2

## User Story

**As a** Grace Adeyemi
**I want** an empty state that distinguishes no-data-yet from no-results
**So that** I know whether to add a record or clear my filter

## Context

### Persona Reference

**Grace Adeyemi** - "No results" tells her the list is empty. It does not tell her whether to add
something or to widen a filter, and those are opposite actions.
[Full persona details](../personas.md#grace-adeyemi)

**Sofia Marchetti** - has written the same two empty screens on four projects and wants the
distinction built in rather than remembered.
[Full persona details](../personas.md#sofia-marchetti)

### Background

There are two kinds of nothing on an ERP list, and confusing them wastes real time.

**Empty** means nothing has been added yet: the way forward is to create something. **Filtered**
means the data exists and the current filters exclude it: the way forward is to widen the filters,
and telling that user to "add your first supplier" is actively misleading when there are four
hundred suppliers behind a date range.

`reason` is a required two-member union rather than an optional hint, because the distinction is the
component's entire reason to exist and a default would silently pick one. It reaches the DOM as
`data-reason` as well as the copy, so the distinction is machine-visible and not merely a sentence
somebody wrote.

The `action` prop is required on `filtered` and optional on `empty` - a filtered state without a way
to clear the filters is a dead end, whereas an empty list a user cannot add to is a legitimate
read-only screen.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| Epic | Accessibility | No state in Clara is carried by colour alone, and none by motion alone (D0100). The seat that DECIDES inclusive design (Idris, ux) is not the seat that PROVES it (Mira, qa) - neither may assume the other covered it | AC1 - the two cases are distinguishable in the DOM and not only in prose, and it announces politely rather than interrupting |
| PRD F01 | API surface | Tier 2 tokens are public and permanent at publish; tiers 1 and 3 are not. Prop types use literal unions, never a bare `string`, wherever the value set is closed | `EmptyStateReason` is a two-member literal union and `reason` is REQUIRED. `action` is required on the filtered variant and optional on the empty one |
| PRD | Styling | Component CSS may reference tier 2 and tier 3 tokens only - a tier 1 reference or a raw literal fails CI. All CSS emits inside `@layer clara.reset, clara.tokens, clara.components;` | AC2 |
| TRD Section 7 | Boundary | Every component is classified server or client, and the classification is proved by three oracles that deliberately do not share a reader (D0051) | EmptyState is SERVER - it holds nothing, so a list screen can be a Server Component. `renders on the server` asserts it directly |
| PRD | Performance | Per-component JavaScript budgets apply; CSS is deliberately not tree-shaken and ships as one stylesheet | No AC of its own - held by `pnpm size` |

## Acceptance Criteria

### AC1: Two distinct cases

- **Given** an EmptyState
- **When** it renders
- **Then** documented guidance and distinct content separate 'no data yet' from 'no results for this filter'
- **Verify:** vitest "EmptyState distinguishes empty from filtered"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC2: Token-only styling

- **Given** the EmptyState stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC3: Both themes and densities

- **Given** a EmptyState
- **When** it renders in dark theme and compact density
- **Then** it renders inside the correct scope and passes axe in all four combinations
- **Verify:** vitest "EmptyState theme and density matrix"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC4: Definition of done

- **Given** the EmptyState story
- **When** it is proposed for export
- **Then** a verification record, its cited tests, an axe assertion, and a docs page all exist and
  resolve
- **Verify:** shell node scripts/check-verification.mjs --component EmptyState
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- EmptyState

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 2 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold.

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| `reason="empty"` | Guidance points at CREATING something. `data-reason="empty"` in the DOM |
| `reason="filtered"` | Guidance points at WIDENING the filters. Telling this user to add their first record is misleading when the records exist |
| No `reason` | A type error. It is required, because a default would silently pick one of two opposite messages |
| The author replacing the guidance with their own `children` | The distinction SURVIVES. `data-reason` and the modifier class are set from `reason`, not from the copy, so custom prose cannot erase it |
| `filtered` with no `action` | A type error. A filtered state with no way to clear the filters is a dead end |
| `empty` with no `action` | Allowed. A read-only list a user cannot add to is legitimate |
| A screen reader arriving | `role="status"` - polite. An empty list is already what the user is looking at, so interrupting adds nothing |
| Rendered in a Server Component | Works. No directive, no browser API - which is the point, since a list screen is the natural Server Component |

## Test Scenarios

- [x] It marks which kind of nothing it is IN THE DOM, rather than only in the copy
- [x] Each case gets different default guidance, pointing at a different way forward
- [x] An author can replace the guidance without losing the distinction
- [x] It announces politely, because an empty list is already what the user is looking at
- [x] It renders the action when one is given, and nothing when there is none
- [x] It renders on the server, so a list screen can be a Server Component
- [x] axe passes in both cases
- [x] All four theme and density combinations render and pass axe

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0GMAE](US-01M0GMAE-semantic-token-layer.md) | Blocking | The tier 2 semantic tokens every colour here resolves through | Done |
| [US-01M0GM5M](US-01M0GM5M-theming-light-dark-and-context-based-scoping.md) | Blocking | `ClaraProvider`, and the rule that light lives on `:root` while only the dark selector scopes anything | Done |
| [US-01M0GMC6](US-01M0GMC6-density-modes-with-computed-geometry-assertions.md) | Blocking | The density scale the matrix criterion renders against | Done |
| [US-01M0WSME](US-01M0WSME-chromatic-visual-regression-blocking-on-unreviewed-diffs.md) | Non-blocking | Gate 7. Nothing here can see what the component LOOKS like | Draft |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| None at runtime | - | This component imports no third-party package. The library reads no environment variables and makes no network call |

## Estimation

**Points:** 2
**Complexity:** Low

A 2 rather than a 1: the render is trivial, but the API carries two asymmetric requirements -
`reason` required, `action` required on one variant and optional on the other - and both are
one-way doors that have to be right before publish.

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

This is a library. It runs no service, holds no data and is never deployed - so there is nothing to
roll back operationally. What it HAS is a one-way door: once `EmptyState` and its props are published
under `@luzentialabs/clara-react`, a rename breaks consumers already shipped, and a bad release is
fixed FORWARD with a patch and never unpublished.

| Component | Reversal | Expected time |
| --- | --- | --- |
| The `EmptyState` export, before any publish | Revert the commit. `NPM_TOKEN` is unset deliberately, so nothing has left this repository | Minutes |
| The `EmptyState` export, after a publish | Not reversible. Deprecate the release, ship a corrected patch, leave the bad version in place - releases are immutable by policy | One release cycle |
| The `--clara-empty-state-*` tier 3 tokens | Not independently reversible | Requires re-running every consumer of the shared surface |

## Open Questions

- [x] Should `reason` default to `empty`, so the common case is one prop shorter?
      **No - settled by AC1.** The two cases point at opposite actions, and a default means every
      author who forgets the prop ships the misleading one. Required is what makes the distinction
      the component's guarantee rather than its suggestion.

## Resolved Questions

- [x] Should the distinction live only in the copy, since that is what the user reads?
      **No - it reaches the DOM as `data-reason` too.** Copy is what an author can replace, and the
      assertion that survives a replaced sentence is the one worth having. It also makes the
      distinction machine-visible, which is what AC1 checks.

## Test Plan

Every row below was RUN against this tree. `Mutant` is the production edit the criterion's own
verifier must fail on, and the verdict beside it is what happened when that edit was made.

| Criterion | Touches | Mutant - the production change this test must fail on | Title |
| --- | --- | --- | --- |
| AC1 | packages/react/src/components/EmptyState/EmptyState.tsx | THREE mutants, all KILLED. Also add `aria-live="off"` beside `role="status"` - KILLED. **(review)** That silences the region in every screen reader while leaving the role intact, and it previously survived 1200 unit tests, `check:axe` at 212 passed and `check:verification`: the role's PRESENCE was standing in for the announcement. ZERO announcements is a failure here, not only forty. (a) Give both reasons the SAME guidance string in `GUIDANCE` - 1 test fails, and the two cases stop pointing at different ways forward. (b) Hardcode the modifier to `'clara-empty-state--empty'` - 1 fails, and the distinction vanishes from the DOM while the copy still carries it. (b) is the one worth having: copy is what an author replaces, so an assertion that survives replaced prose is the one that means something. | Two distinct cases |
| AC2 | packages/react/src/styles.css | Add `border-radius: 7px` to `.clara-empty-state` - a raw literal where a token belongs. KILLED, `check-component-css` exits 1. The verifier is a guard that READS the stylesheet, which is required here: no test imports a CSS file, so a vitest-only verifier over this mutant would be green by construction. | Token-only styling |
| AC3 | packages/react/src/theme/resolve.ts | `claraAttributes` returns `{}`, so the provider stops stamping its scope. KILLED, 4 of 4 combinations. Mutating the PROVIDER rather than the component is what proves the assertion reads the scope rather than merely finding the component. What this criterion claims is bounded and the story says so: jsdom sees no layout and resolves no custom property, so the APPEARANCE is gate 7's. | Both themes and densities |
| AC4 | packages/react/src/components/EmptyState/verification.md | Rename `## Keyboard` to `## Keys`. KILLED - `missing section "## Keyboard"`, exit 1. Renaming it to anything CONTAINING `## Keyboard` was accepted until 2026-08-27, when `sectionBody`'s prefix match was anchored to a whole line; that suffix form is now `prove-guards` mutation 147. | Definition of done |

## Revision History

| Date | Author | Change |
| --- | --- | --- |
