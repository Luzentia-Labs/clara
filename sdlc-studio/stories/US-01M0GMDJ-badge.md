# US-01M0GMDJ: Badge

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Badge/Badge.tsx, packages/react/src/components/Badge/Badge.stories.tsx, packages/react/src/components/Badge/__tests__/badge.test.tsx, packages/react/src/styles.css, e2e/stacking.spec.ts, packages/react/src/components/__tests__/prop-shapes.test-d.tsx, packages/react/src/index.ts, packages/react/src/components/Badge/index.tsx, scripts/check-component-css.mjs
> **Points:** 2

## User Story

**As a** Grace Adeyemi
**I want** a count indicator whose intent is readable without colour
**So that** a hundred badges on a list screen do not become a colour puzzle

## Context

### Persona Reference

**Grace Adeyemi** - a red "3" and a green "3" are the same "3" to her, which is exactly the case
this component's API is shaped around.
[Full persona details](../personas.md#grace-adeyemi)

**Sofia Marchetti** - puts a count on a tab label and expects it to announce as something, not as a
bare number.
[Full persona details](../personas.md#sofia-marchetti)

### Background

A badge is the smallest surface in the library and it carries the sharpest version of the
colour-alone problem. `<Badge intent="danger">Open</Badge>` beside
`<Badge intent="success">Open</Badge>` reads identically to a sighted user who cannot separate the
two hues, and no API can stop an author writing that.

So the component draws a line and the documentation states it plainly rather than implying the
component solves WCAG 1.4.1 on the author's behalf. What it GUARANTEES is that the intent reaches
the accessible name, so a screen reader never depends on the colour. What it CANNOT guarantee is
that the visible text distinguishes two badges.

The count variant is where the API does more than document. `countLabel` is REQUIRED and not
optional-with-a-default, because a bare number is the one badge shape where the visible text cannot
carry its own meaning. Making it required is the difference between a component that permits an
unannounced count and one that cannot express it.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| Epic | Accessibility | No state in Clara is carried by colour alone, and none by motion alone (D0100). The seat that DECIDES inclusive design (Idris, ux) is not the seat that PROVES it (Mira, qa) - neither may assume the other covered it | AC1 - the intent reaches the accessible name as a word; AC2 - a count announces WHAT is counted; AC6 - the class resolves to its own intent's colours |
| PRD F01 | API surface | Tier 2 tokens are public and permanent at publish; tiers 1 and 3 are not. Prop types use literal unions, never a bare `string`, wherever the value set is closed | `BadgeIntent` is a five-member literal union, and `BadgeLabelProps`/`BadgeCountProps` are a discriminated pair so `count` and `children` are mutually exclusive at the type level |
| PRD | Styling | Component CSS may reference tier 2 and tier 3 tokens only - a tier 1 reference or a raw literal fails CI. All CSS emits inside `@layer clara.reset, clara.tokens, clara.components;` | AC3 |
| TRD Section 7 | Boundary | Every component is classified server or client, and the classification is proved by three oracles that deliberately do not share a reader (D0051) | Badge is SERVER - it holds no state and no handler. `Badge renders on the server` asserts it directly, and `check:client-boundary` proves the classification |
| PRD | Performance | Per-component JavaScript budgets apply; CSS is deliberately not tree-shaken and ships as one stylesheet | No AC of its own - held by `pnpm size` |

## Acceptance Criteria

### AC1: Intent is not colour alone

- **Given** a Badge with an intent
- **When** it renders
- **Then** the intent reaches the ACCESSIBLE NAME as a word, and the intent prop reaches its own
  class so the colour is a token rather than an inline style
- **And** the criterion used to read "a mark, icon or text label accompanies the colour", and
  Badge renders none of those three - only a `clara-visually-hidden` word. **BG-01M11KT6** carries
  the gap: Grace Adeyemi is named in this story's `Serves:` and is SIGHTED with a red-green
  deficiency, so an accessibility-tree carrier does not reach her, and red/green is exactly the pair
  she cannot separate. The title is left as written rather than quietly reworded, because it points
  at a real gap that renaming would hide
- **And** what IS guaranteed is stated in the component's own docblock and now in the criterion: the
  intent never depends on the colour for a screen-reader user. What is NOT guaranteed is that two
  badges with the same text and different intents look different, and no API can promise that
- **Verify:** vitest "Badge intent is not colour alone"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC2: Counts are announced

- **Given** a Badge carrying a count
- **When** a screen reader encounters it
- **Then** the count and its meaning are announced, not just the number
- **Verify:** vitest "Badge count is announced with meaning"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC3: Token-only styling

- **Given** the Badge stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC4: Both themes and densities

- **Given** a Badge
- **When** it renders in dark theme and compact density
- **Then** it renders inside the correct scope and passes axe in all four combinations
- **Verify:** vitest "Badge theme and density matrix"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC5: Definition of done

- **Given** the Badge story
- **When** it is proposed for export
- **Then** a verification record, its cited tests, an axe assertion, and a docs page all exist and
  resolve
- **Verify:** shell node scripts/check-verification.mjs --component Badge
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC6: An intent class renders its OWN intent's colours

- **Given** a Badge in each of its four intents
- **When** its computed colours are read in a real browser, in both themes
- **Then** each intent class resolves to that intent's tier 2 pair, and the four intents are
  mutually distinct
- **And** BOTH halves are load-bearing. Without the distinctness check, a build that collapsed all
  four tier 2 aliases to one colour would satisfy the per-intent comparison and prove nothing
- **And** **this is not a contrast criterion and no contrast assertion could replace it.** Measured:
  repointing `.clara-badge--danger` at the info tokens left 1200 unit tests,
  `check-component-css` and `check-contrast` all green - because info-on-info is a perfectly good AA
  pair. The failure is a danger badge that renders as an information badge, with the colour
  saying one thing and the announced word saying another
- **And** it cannot be asserted in jsdom, which resolves no `var()` at all, so any verdict it
  reached here would be a false green by construction rather than a flaky one
- **Verify:** shell pnpm test:e2e -g "every intent class renders its own intent colours"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC7: The prop shapes cannot be written wrong

- **Given** the discriminated prop pairs on Badge
- **When** the workspace is type-checked
- **Then** every shape the component refuses is a COMPILE error, and each refusal is asserted
- **And** the guarantees held and NOTHING held them. Deleting a `?: never` discriminator left
  `pnpm typecheck` at exit 0, 1219 tests passing and the API report clean, and the variant
  interfaces were not even exported - so they reached `clara-react.api.md` only as
  `(ae-forgotten-export)` warnings and a breaking change to one would not have appeared in the public
  surface diff at all. They are exported now, which is what puts them under `check:api-report`
- **And** the assertions are written in TWO forms on purpose. A confirmation seat proved the JSX form
  insufficient by itself: JSX applies its own excess-children check, so deleting `children?: never`
  from `BadgeCountProps` was invisible through that route. Sweeping all seven discriminators one at a
  time, five were caught through JSX and two were not. Non-literal assignability assertions cover the
  rest, and narrowing assertions cover the two that a component merely happened to hold by reading
  the prop
- **And** an `@ts-expect-error` that would never have errored is dead weight reading as coverage, so
  the seat also replaced every directive with an inert token and confirmed all 14 sites produce a
  real `TS2322` naming the asserted cause
- **Verify:** shell pnpm typecheck
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Badge

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
| `intent="neutral"` (the default) | Announces NOTHING extra. Neutral means "no intent", so a word here would add a syllable to every badge that says nothing |
| A count of `0` | Renders `0`. Treating zero as absent hides the one state a user most often wants confirmed - that there are none |
| A count with no `countLabel` | A type error, not a runtime warning. `countLabel` is required on `BadgeCountProps`, so the unannounced-count shape cannot be written |
| `count` and `children` together | A type error. The two prop shapes are a discriminated union with `never` on the opposite member |
| A column of counts | Digits line up. `font-variant-numeric: tabular-nums`, because a ragged column of counts is harder to scan than a padded one |
| Two badges whose text is identical and whose intent differs | **Indistinguishable to a sighted user who cannot separate the hues, and the component cannot fix it.** The docs say so rather than implying otherwise. A screen-reader user is unaffected - the word is in the accessible name |
| Rendered in a Server Component | Works. No directive, no browser API |
| An intent repointed at another intent's tokens | Caught by AC6 in a browser, and by nothing else |

## Test Scenarios

- [x] Every non-neutral intent joins its word to the accessible name
- [x] The neutral default says nothing extra
- [x] The intent is carried in a CLASS as well, so the colour comes from a token and not a style prop
- [x] A count announces what is being counted, not just the number
- [x] Zero renders rather than being treated as absent
- [x] Digits sit on a tabular figure, so a column of counts lines up
- [x] axe passes with a count and with a label
- [x] It renders on the server, producing markup with no directive and no browser API
- [x] All four theme and density combinations render and pass axe
- [x] **In a browser:** every intent class resolves to its OWN intent's colour pair, in both themes

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

A 2 rather than a 1: the component is trivial to render, and the work is in the API shape -
making `countLabel` required and the two variants mutually exclusive is a decision that has to be
right before publish, because widening it later is easy and narrowing it is a major.

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
roll back operationally. What it HAS is a one-way door: once `Badge` and its props are published
under `@luzentialabs/clara-react`, a rename breaks consumers already shipped, and a bad release is
fixed FORWARD with a patch and never unpublished.

| Component | Reversal | Expected time |
| --- | --- | --- |
| The `Badge` export, before any publish | Revert the commit. `NPM_TOKEN` is unset deliberately, so nothing has left this repository | Minutes |
| The `Badge` export, after a publish | Not reversible. Deprecate the release, ship a corrected patch, leave the bad version in place - releases are immutable by policy | One release cycle |
| The four `--clara-badge-*` tier 3 token pairs | Not independently reversible | Requires re-running every consumer of the shared surface |

## Open Questions

- [ ] None. Both questions below were answered during the
      review round and are recorded under Resolved Questions.

## Resolved Questions

- [x] Should Badge refuse two badges whose visible text is identical and whose intent differs?
      **It cannot, and pretending otherwise would be the defect.** Whether two badges on a screen
      read alike is a property of the page, not of a component that renders one of them. Settled in
      the component's own docblock and in the docs page, both of which state the limit rather than
      implying the component solves WCAG 1.4.1 for the author.


- [x] Should `countLabel` default to something, so the count variant is easier to reach for?
      **No.** The only default available is a generic word, and a generic word is exactly the one
      that carries no information - the same argument Spinner's required `label` rests on. A
      required prop that makes the bad shape unwriteable beats an optional one that makes it easy.

## Test Plan

Every row below was RUN against this tree. `Mutant` is the production edit the criterion's own
verifier must fail on, and the verdict beside it is what happened when that edit was made.

| Criterion | Touches | Mutant - the production change this test must fail on | Title |
| --- | --- | --- | --- |
| AC1 | packages/react/src/components/Badge/Badge.tsx | **(review)** Also hardcode the modifier to `'clara-badge--info'`, and repoint the base rule's neutral tokens at danger - both KILLED now, both previously survived everything including `test:e2e`. `neutral` is in the loop deliberately: it is the DEFAULT and takes its colour from the base rule rather than a modifier, so a loop over the four non-neutral intents left the most-used path bound to nothing. Then, the announcement mutant: suppress it with `{intent !== 'neutral' && (` becomes `{false && (`. KILLED, 4 tests. Written as a suppression rather than a deletion on purpose - deleting the span outright leaves invalid JSX, and a suite that fails to COMPILE reports a lower test count rather than a failing assertion, which reads as a kill and proves nothing. Total stayed 1200. | Intent is not colour alone |
| AC2 | packages/react/src/components/Badge/Badge.tsx | Delete `<span className="clara-visually-hidden"> {input.countLabel}</span>`. KILLED, 2 tests. A bare number is the one badge shape whose visible text cannot carry its own meaning, which is why `countLabel` is required rather than defaulted. | Counts are announced |
| AC3 | packages/react/src/styles.css | Add `border-radius: 7px` to `.clara-badge` - a raw literal where a token belongs. KILLED, `check-component-css` exits 1. The verifier is a guard that READS the stylesheet, which is required here: no test imports a CSS file, so a vitest-only verifier over this mutant would be green by construction. | Token-only styling |
| AC4 | packages/react/src/theme/resolve.ts | `claraAttributes` returns `{}`, so the provider stops stamping its scope. KILLED, 4 of 4 combinations. Mutating the PROVIDER rather than the component is what proves the assertion reads the scope rather than merely finding the component. What this criterion claims is bounded and the story says so: jsdom sees no layout and resolves no custom property, so the APPEARANCE is gate 7's. | Both themes and densities |
| AC5 | packages/react/src/components/Badge/verification.md | Rename `## Keyboard` to `## Keys`. KILLED - `missing section "## Keyboard"`, exit 1. Renaming it to anything CONTAINING `## Keyboard` was accepted until 2026-08-27, when `sectionBody`'s prefix match was anchored to a whole line; that suffix form is now `prove-guards` mutation 147. | Definition of done |
| AC6 | packages/react/src/styles.css | Repoint `.clara-badge--danger` at the info tokens, leaving the class name alone. KILLED by this criterion ALONE. Measured surviving everything else: 1200 unit tests, `check-component-css` and `check-contrast`. **No contrast assertion could ever catch it** - info-on-info is a good AA pair - which is why this criterion reads the computed colours and compares them against a probe carrying the intent's tier 2 pair, rather than measuring a ratio. | An intent class renders its OWN intent's colours |
| AC7 | packages/react/src/components/Badge/Badge.tsx, packages/react/src/components/__tests__/prop-shapes.test-d.tsx | Delete `BadgeLabelProps.count`, `BadgeLabelProps.countLabel` and `BadgeCountProps.children` - each `?: never` discriminator, one at a time. ALL KILLED, and the sweep is the point: run individually rather than together, because deleting two at once masks which one was doing the work. Two of the seven across the three components previously SURVIVED this sweep - JSX excess-children checking hid them - and two more reddened only the component file rather than the assertions, so a refactor that stopped reading the prop would have unguarded them. | The prop shapes cannot be written wrong |

## Revision History

| Date | Author | Change |
| --- | --- | --- |
