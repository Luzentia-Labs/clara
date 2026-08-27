# US-01M0GMSQ: Skeleton

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Skeleton/Skeleton.tsx, packages/react/src/components/Skeleton/Skeleton.stories.tsx, packages/react/src/components/Skeleton/__tests__/skeleton.test.tsx, packages/react/src/styles.css, apps/docs/src/content/components/skeleton.md, scripts/check-verification.mjs, packages/react/src/components/Skeleton/index.tsx, scripts/check-component-css.mjs
> **Points:** 1

## User Story

**As a** Grace Adeyemi
**I want** loading placeholders that do not spam a screen reader
**So that** a loading list announces once rather than forty times

## Context

### Persona Reference

**Grace Adeyemi** - a table skeleton is forty grey rectangles. Announced individually, that is forty
interruptions describing nothing.
[Full persona details](../personas.md#grace-adeyemi)

**Sofia Marchetti** - lays out a loading table and expects the placeholders to match the shape of
the real rows without writing widths by hand.
[Full persona details](../personas.md#sofia-marchetti)

### Background

A skeleton is a shape standing in for content that has not arrived. Visually it is useful: it says
where things will be, so the layout does not jump. To assistive technology it is noise, and the
amount of noise scales with how good the skeleton looks - a convincing table skeleton is forty
elements, and forty announcements of "image" is a worse experience than a blank screen.

So the component is split in two, and the split IS the design. `Skeleton` is a single placeholder,
`aria-hidden` with no way to become announceable - it takes no `children`, no `role`, no `aria-*`.
`SkeletonGroup` is the container, and it is the ONLY thing that speaks: `role="status"` and one
required `label`.

The result is that a loading table announces once, however many placeholders it contains.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| Epic | Accessibility | No state in Clara is carried by colour alone, and none by motion alone (D0100). The seat that DECIDES inclusive design (Idris, ux) is not the seat that PROVES it (Mira, qa) - neither may assume the other covered it | AC1 - the GROUP announces once, and no individual placeholder can ever be announced |
| PRD F01 | API surface | Tier 2 tokens are public and permanent at publish; tiers 1 and 3 are not. Prop types use literal unions, never a bare `string`, wherever the value set is closed | `SkeletonWidth` is a four-member literal union, so a width is a token class rather than an inline style. `SkeletonProps` exposes no `children` and no ARIA escape hatch |
| PRD | Styling | Component CSS may reference tier 2 and tier 3 tokens only - a tier 1 reference or a raw literal fails CI. All CSS emits inside `@layer clara.reset, clara.tokens, clara.components;` | AC2 |
| TRD Section 7 | Boundary | Every component is classified server or client, and the classification is proved by three oracles that deliberately do not share a reader (D0051) | Skeleton is SERVER - it holds nothing. `renders on the server` asserts it directly |
| PRD | Performance | Per-component JavaScript budgets apply; CSS is deliberately not tree-shaken and ships as one stylesheet | No AC of its own - held by `pnpm size` |

## Acceptance Criteria

### AC1: Hidden from AT

- **Given** a set of Skeletons
- **When** they render
- **Then** each is aria-hidden and the loading state is announced once at the container level
- **Verify:** vitest "Skeleton container announces once"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC2: Token-only styling

- **Given** the Skeleton stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC3: Both themes and densities

- **Given** a Skeleton
- **When** it renders in dark theme and compact density
- **Then** it renders inside the correct scope and passes axe in all four combinations
- **Verify:** vitest "Skeleton theme and density matrix"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC4: Definition of done

- **Given** the Skeleton story
- **When** it is proposed for export
- **Then** a verification record, its cited tests, an axe assertion, and a docs page all exist and
  resolve
- **Verify:** shell node scripts/check-verification.mjs --component Skeleton
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Skeleton

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 1 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold.

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| Forty placeholders in a table skeleton | ONE announcement, from the group. Forty would be worse than silence |
| A placeholder reached by a screen reader | Nothing. It is `aria-hidden="true"`. `children`, `role` and a bad `width` are all type errors - but **`aria-*` is not**, because TypeScript does not type-check hyphenated JSX attributes at all. `<Skeleton aria-live="assertive" />` compiles clean and is then silently DROPPED at runtime, since the component spreads no rest props. The guarantee holds; it is enforced by the absence of a spread rather than by the type, and an author gets a no-op instead of an error |
| A `SkeletonGroup` with no `label` | A type error. The group is the only thing that speaks, so an unlabelled one announces "status" and nothing more |
| An author wanting a custom width | Four token classes, not an inline style. `SkeletonWidth` is a closed union, so widths stay on the scale and cannot drift into arbitrary pixels |
| axe over forty placeholders | Passes. Asserted at that scale on purpose - the failure modes here are all about volume |
| Rendered in a Server Component | Works. No directive, no browser API |
| Motion | None to remove. A shimmer was considered and is not present; the placeholder's presence is already the information, so a shimmer would be Class A decoration with a vestibular cost and no benefit |

## Test Scenarios

- [x] It announces the loading state ONCE, however many placeholders there are
- [x] Every placeholder is hidden from the accessibility tree
- [x] A placeholder has NO WAY to become announceable - the API exposes no route to it
- [x] Width maps to a token class rather than an inline style
- [x] axe passes with forty placeholders
- [x] It renders on the server
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

**Points:** 1
**Complexity:** Low

A 1: two elements and a four-member union. The judgement - that the group speaks and the
placeholder cannot - is one decision, and once made the implementation follows from it.

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
roll back operationally. What it HAS is a one-way door: once `Skeleton` and its props are published
under `@luzentialabs/clara-react`, a rename breaks consumers already shipped, and a bad release is
fixed FORWARD with a patch and never unpublished.

| Component | Reversal | Expected time |
| --- | --- | --- |
| The `Skeleton` export, before any publish | Revert the commit. `NPM_TOKEN` is unset deliberately, so nothing has left this repository | Minutes |
| The `Skeleton` export, after a publish | Not reversible. Deprecate the release, ship a corrected patch, leave the bad version in place - releases are immutable by policy | One release cycle |
| The `--clara-skeleton-*` tier 3 tokens | Not independently reversible | Requires re-running every consumer of the shared surface |

## Open Questions

- [ ] None. Both questions below were answered during the
      review round and are recorded under Resolved Questions.

## Resolved Questions

- [x] Should a placeholder be able to opt IN to being announced, for a one-off case?
      **No - settled by AC1.** An escape hatch here is a route to the forty-announcement failure,
      and the case it would serve (one meaningful placeholder) is better served by the group's
      label. The API exposing no route is what makes AC1 assertable as "no way to become
      announceable" rather than "is not announced today".


- [x] Should the placeholder shimmer while it waits? **No.** The placeholder's PRESENCE is already
      the information, so a shimmer is Class A decoration under D0100 - it would have to be removed
      under reduced motion anyway, and it carries a vestibular cost across a screen full of them for
      no state that is not already conveyed.

## Test Plan

Every row below was RUN against this tree. `Mutant` is the production edit the criterion's own
verifier must fail on, and the verdict beside it is what happened when that edit was made.

| Criterion | Touches | Mutant - the production change this test must fail on | Title |
| --- | --- | --- | --- |
| AC1 | packages/react/src/components/Skeleton/Skeleton.tsx | THREE mutants, all KILLED. Also add `aria-live="off"` beside `role="status"` - KILLED. **(review)** That silences the region in every screen reader while leaving the role intact, and it previously survived 1200 unit tests, `check:axe` at 212 passed and `check:verification`: the role's PRESENCE was standing in for the announcement. ZERO announcements is a failure here, not only forty. (a) Drop `aria-hidden="true"` from the placeholder - 2 tests fail. **The consequence this row first claimed was wrong and a review caught it:** it said a forty-placeholder skeleton becomes forty announcements, and it does not. The placeholders are empty spans with no role and no text, inside a `role="status"` region that implies `aria-atomic="true"`, so they contribute nothing to announce. What `aria-hidden` actually buys is that they never become announceable as the markup grows, which is a claim about the API's shape rather than about today's output. (b) Delete the group's `<span className="clara-visually-hidden">{label}</span>` - 2 fail, and the loading state is announced zero times instead of once. The criterion is "announces exactly once", so both directions have to redden. | Hidden from AT |
| AC2 | packages/react/src/styles.css | Add `border-radius: 7px` to `.clara-skeleton` - a raw literal where a token belongs. KILLED, `check-component-css` exits 1. The verifier is a guard that READS the stylesheet, which is required here: no test imports a CSS file, so a vitest-only verifier over this mutant would be green by construction. | Token-only styling |
| AC3 | packages/react/src/theme/resolve.ts | `claraAttributes` returns `{}`, so the provider stops stamping its scope. KILLED, 4 of 4 combinations. Mutating the PROVIDER rather than the component is what proves the assertion reads the scope rather than merely finding the component. What this criterion claims is bounded and the story says so: jsdom sees no layout and resolves no custom property, so the APPEARANCE is gate 7's. | Both themes and densities |
| AC4 | packages/react/src/components/Skeleton/verification.md | Rename `## Keyboard` to `## Keys`. KILLED - `missing section "## Keyboard"`, exit 1. Renaming it to anything CONTAINING `## Keyboard` was accepted until 2026-08-27, when `sectionBody`'s prefix match was anchored to a whole line; that suffix form is now `prove-guards` mutation 147. | Definition of done |

## Revision History

| Date | Author | Change |
| --- | --- | --- |
