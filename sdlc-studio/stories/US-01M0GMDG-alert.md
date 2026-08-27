# US-01M0GMDG: Alert

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Alert/Alert.tsx, packages/react/src/components/Alert/Alert.stories.tsx, packages/react/src/components/Alert/__tests__/alert.test.tsx, packages/react/src/styles.css, e2e/stacking.spec.ts, packages/react/src/components/__tests__/prop-shapes.test-d.tsx, packages/react/src/index.ts, packages/react/src/components/Alert/index.tsx, scripts/check-component-css.mjs
> **Points:** 3

## User Story

**As a** Grace Adeyemi
**I want** an inline banner whose meaning survives without colour
**So that** I can tell a warning from an error without distinguishing hues

## Context

### Persona Reference

**Grace Adeyemi** - cannot see the hue, so an alert whose intent lives only in its colour tells her
nothing at all.
[Full persona details](../personas.md#grace-adeyemi)

**Sofia Marchetti** - reaches for an alert on every screen she builds and expects the intent to be
one prop, not a colour she has to pick and then explain.
[Full persona details](../personas.md#sofia-marchetti)

### Background

An ERP screen is dense with results, and some of them are bad news: a period that will not close, a
supplier on hold, a posting that succeeded. An Alert is the surface that says which.

The reason this is its own unit is the rule underneath it: **no state in Clara is carried by colour
alone** (D0100 in its spatial form). A red box is not an error message to somebody who cannot see it
is red. So the intent reaches the accessible name as a WORD, and it reaches the eye as an ICON, and
the colour is the third carrier rather than the only one.

Two intents also change the ROLE, which is easy to miss and hard to retrofit: `warning` and `danger`
render `role="alert"` and interrupt; `info` and `success` render `role="status"` and wait their turn.
That is a judgement about how loud each intent should be, and it is made once here rather than by
every consumer.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| Epic | Accessibility | No state in Clara is carried by colour alone, and none by motion alone (D0100). The seat that DECIDES inclusive design (Idris, ux) is not the seat that PROVES it (Mira, qa) - neither may assume the other covered it | AC1 - the icon and the announced word, so hue is never the only carrier; AC6 - the class must resolve to its OWN intent's colours |
| PRD F01 | API surface | Tier 2 tokens are public and permanent at publish; tiers 1 and 3 are not. Prop types use literal unions, never a bare `string`, wherever the value set is closed | `AlertIntent` is a four-member literal union, and the dismissible variant is a discriminated pair so `dismissLabel` cannot appear without `onDismiss` |
| PRD | Styling | Component CSS may reference tier 2 and tier 3 tokens only - a tier 1 reference or a raw literal fails CI. All CSS emits inside `@layer clara.reset, clara.tokens, clara.components;` | AC3 |
| TRD Section 7 | Boundary | Every component is classified server or client, and the classification is proved by three oracles that deliberately do not share a reader (D0051) | Alert is CLIENT (`'use client'`), because a dismissible alert holds a click handler. `check:client-boundary` proves it |
| PRD | Performance | Per-component JavaScript budgets apply; CSS is deliberately not tree-shaken and ships as one stylesheet | No AC of its own - held by `pnpm size` |

## Acceptance Criteria

### AC1: Intent carries an icon

- **Given** an Alert of any intent
- **When** it renders
- **Then** an intent icon accompanies the colour so meaning is not colour-alone
- **Verify:** vitest "Alert intent is not colour alone"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC2: Contrast holds

- **Given** each intent
- **When** it renders in both themes
- **Then** the background and foreground pair meets AA
- **Verify:** vitest "Alert intent contrast both themes"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC3: Token-only styling

- **Given** the Alert stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC4: Both themes and densities

- **Given** a Alert
- **When** it renders in dark theme and compact density
- **Then** it renders inside the correct scope and passes axe in all four combinations
- **Verify:** vitest "Alert theme and density matrix"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC5: Definition of done

- **Given** the Alert story
- **When** it is proposed for export
- **Then** a verification record, its cited tests, an axe assertion, and a docs page all exist and
  resolve
- **Verify:** shell node scripts/check-verification.mjs --component Alert
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC6: An intent class renders its OWN intent's colours

- **Given** a Alert in each of its four intents
- **When** its computed colours are read in a real browser, in both themes
- **Then** each intent class resolves to that intent's tier 2 pair, and the four intents are
  mutually distinct
- **And** BOTH halves are load-bearing. Without the distinctness check, a build that collapsed all
  four tier 2 aliases to one colour would satisfy the per-intent comparison and prove nothing
- **And** **this is not a contrast criterion and no contrast assertion could replace it.** Measured:
  repointing `.clara-alert--danger` at the info tokens left 1200 unit tests,
  `check-component-css` and `check-contrast` all green - because info-on-info is a perfectly good AA
  pair. The failure is a danger alert that renders as an information alert, with the colour
  saying one thing and the announced word saying another
- **And** it cannot be asserted in jsdom, which resolves no `var()` at all, so any verdict it
  reached here would be a false green by construction rather than a flaky one
- **Verify:** shell pnpm test:e2e -g "every intent class renders its own intent colours"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC7: The prop shapes cannot be written wrong

- **Given** the discriminated prop pairs on Alert
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

- Alert

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 3 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold.

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| A user who cannot distinguish the hue | The intent is still available twice over: as an icon, and as a word joined to the accessible name |
| A screen reader reaching the icon | Nothing. `Icon` marks itself `aria-hidden`, because the word one line below already says it and announcing it twice is noise |
| `warning` or `danger` | `role="alert"` - it interrupts, because the user needs to know before continuing |
| `info` or `success` | `role="status"` - it waits its turn, because it is not an interruption |
| No `title` | The content stands alone. The title is optional and the announced word does not depend on it |
| A message that wraps to three lines | The icon does not shrink. `.clara-alert__icon { flex: 0 0 auto }` - a shrinking icon was the first thing that broke on a long message |
| Not dismissible | No control renders at all, rather than a disabled one. `onDismiss` and `dismissLabel` are a discriminated pair, so `dismissLabel` without `onDismiss` is a type error |
| Dismissible, reached by keyboard | The control is in the tab order and operable by Enter and Space, like any button |
| Dark theme | The intent pair is re-resolved per theme, and AC2 proves each pair still meets AA there rather than assuming the light ratio carries |
| An intent repointed at another intent's tokens | Caught by AC6 in a browser. It is NOT a contrast failure - info-on-info is a good AA pair - so no contrast assertion could ever see it |

## Test Scenarios

- [x] Every intent renders an icon, so the intent is visible without reading the hue
- [x] Every intent joins its word to the accessible name
- [x] The icon is `aria-hidden`, so the intent is announced once and not twice
- [x] `warning` and `danger` take `role="alert"`; `info` and `success` take `role="status"`
- [x] Every intent's token PAIR meets AA in both themes, computed from the token build's own measured
      values rather than from anything jsdom resolves
- [x] The dismiss control is reachable and operable from the keyboard
- [x] No control renders when the alert is not dismissible
- [x] axe passes dismissible and static, with and without a title
- [x] All four theme and density combinations render and pass axe
- [x] **In a browser:** every intent class resolves to its OWN intent's colour pair, in both themes,
      and the four intents are mutually distinct

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0GMAE](US-01M0GMAE-semantic-token-layer.md) | Blocking | The tier 2 semantic tokens every colour here resolves through | Done |
| [US-01M0GM5M](US-01M0GM5M-theming-light-dark-and-context-based-scoping.md) | Blocking | `ClaraProvider`, and the rule that light lives on `:root` while only the dark selector scopes anything | Done |
| [US-01M0GMC6](US-01M0GMC6-density-modes-with-computed-geometry-assertions.md) | Blocking | The density scale the matrix criterion renders against | Done |
| [US-01M0GM66](US-01M0GM66-legal-pairing-table-and-the-contrast-gate.md) | Blocking | The measured pairing table AC2 reads its ratios from | Done |
| [US-01M0WSME](US-01M0WSME-chromatic-visual-regression-blocking-on-unreviewed-diffs.md) | Non-blocking | Gate 7. Nothing here can see what the component LOOKS like | Draft |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| None at runtime | - | This component imports no third-party package. The library reads no environment variables and makes no network call |

## Estimation

**Points:** 3
**Complexity:** Low-Medium

The 3 sits above Badge and Tag (2 each) because Alert carries two things they do not: a
role that varies by intent, and a dismissible variant that is a discriminated union rather than an
optional prop. Neither is hard; both are decisions that have to be made once and then defended.

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
roll back operationally. What it HAS is a one-way door: once `Alert` and its props are published
under `@luzentialabs/clara-react`, a rename breaks consumers already shipped, and a bad release is
fixed FORWARD with a patch and never unpublished.

| Component | Reversal | Expected time |
| --- | --- | --- |
| The `Alert` export, before any publish | Revert the commit. `NPM_TOKEN` is unset deliberately, so nothing has left this repository | Minutes |
| The `Alert` export, after a publish | Not reversible. Deprecate the release, ship a corrected patch, leave the bad version in place - releases are immutable by policy | One release cycle |
| The four `--clara-alert-*` tier 3 token pairs | Not independently reversible | Requires re-running every consumer of the shared surface |

## Open Questions

- [x] Should the intent word be announced when the alert also has a title? **Yes - settled in AC1's
      own assertions.** The word is the only carrier of intent for a screen-reader user, and a title
      is free prose that may or may not name the intent. Dropping it when a title is present would
      make the guarantee depend on what the author happened to write.

## Resolved Questions

- [x] Should `info` and `success` also take `role="alert"`, for consistency? **No.** `role="alert"`
      interrupts whatever the user is doing, and a success message is not worth interrupting for. The
      inconsistency is deliberate and it is the point: the role encodes how loud the intent is.

## Test Plan

Every row below was RUN against this tree. `Mutant` is the production edit the criterion's own
verifier must fail on, and the verdict beside it is what happened when that edit was made.

| Criterion | Touches | Mutant - the production change this test must fail on | Title |
| --- | --- | --- | --- |
| AC1 | packages/react/src/components/Alert/Alert.tsx | FOUR mutants, all KILLED. **(review)** Two were added after a seat proved the first two insufficient: hardcoding the modifier to `'clara-alert--info'` (every intent renders info colours) and swapping `danger`'s entry to `InfoIcon` (a danger alert shows an "i") BOTH survived 1200 unit tests, `pnpm typecheck`, `test:e2e` at 34 passed and all 30 guards - because AC6 composes its markup by hand and never renders the component, and AC1 read icon PRESENCE as a proxy for icon IDENTITY. The suite now asserts each intent reaches its own class with no other intent's modifier, and that each renders its own glyph, compared against the icon component rendered standalone. (a) Delete `<Icon className="clara-alert__icon" />` - 5 tests fail, so the intent loses its VISIBLE non-colour carrier. (b) Delete `<span className="clara-visually-hidden">{word}: </span>` - 4 fail, so it loses its ANNOUNCED one. The criterion needs both, because either alone leaves a user for whom intent is carried by hue and nothing else. | Intent carries an icon |
| AC2 | packages/tokens/build/tokens.pairings.json, packages/tokens/build/tokens.pairings.dark.json | Lower a measured `value` in the emitted pairing table so the pair no longer clears its own `minRatio`, or delete the `fg-danger` on `bg-danger-subtle` row outright. KILLED - and the deletion case matters as much as the lowering, because a loop reporting success over four `undefined`s is the vacuous pass this test's own `toBeTruthy` guard exists for. `Touches` names the BUILD output rather than `src/component/alert.json`, and `check-story-verifiers` refused the source path: the test reads the emitted table with `readFileSync`, so a source edit is invisible to it until the token build runs. The test reads the token build's MEASURED values and computes the ratio, so it is not a jsdom colour claim - jsdom resolves no `var()` and could decide nothing here. Note precisely what it proves: the PAIRS are AA. That the CLASS uses the right pair is AC6, and the two were conflated until a mutant proved they were not the same claim. | Contrast holds |
| AC3 | packages/react/src/styles.css | Add `border-radius: 7px` to `.clara-alert` - a raw literal where a token belongs. KILLED, `check-component-css` exits 1. The verifier is a guard that READS the stylesheet, which is required here: no test imports a CSS file, so a vitest-only verifier over this mutant would be green by construction. | Token-only styling |
| AC4 | packages/react/src/theme/resolve.ts | `claraAttributes` returns `{}`, so the provider stops stamping its scope. KILLED, 4 of 4 combinations. Mutating the PROVIDER rather than the component is what proves the assertion reads the scope rather than merely finding the component. What this criterion claims is bounded and the story says so: jsdom sees no layout and resolves no custom property, so the APPEARANCE is gate 7's. | Both themes and densities |
| AC5 | packages/react/src/components/Alert/verification.md | Rename `## Keyboard` to `## Keys`. KILLED - `missing section "## Keyboard"`, exit 1. Renaming it to anything CONTAINING `## Keyboard` was accepted until 2026-08-27, when `sectionBody`'s prefix match was anchored to a whole line; that suffix form is now `prove-guards` mutation 147. | Definition of done |
| AC6 | packages/react/src/styles.css | Repoint `.clara-alert--danger` at the info tokens, leaving the class name alone. KILLED by this criterion ALONE. Measured surviving everything else: 1200 unit tests, `check-component-css` and `check-contrast`. **No contrast assertion could ever catch it** - info-on-info is a good AA pair - which is why this criterion reads the computed colours and compares them against a probe carrying the intent's tier 2 pair, rather than measuring a ratio. | An intent class renders its OWN intent's colours |
| AC7 | packages/react/src/components/Alert/Alert.tsx, packages/react/src/components/__tests__/prop-shapes.test-d.tsx | Delete `AlertStaticProps.onDismiss` and `AlertStaticProps.dismissLabel` - each `?: never` discriminator, one at a time. ALL KILLED, and the sweep is the point: run individually rather than together, because deleting two at once masks which one was doing the work. Two of the seven across the three components previously SURVIVED this sweep - JSX excess-children checking hid them - and two more reddened only the component file rather than the assertions, so a refactor that stopped reading the prop would have unguarded them. | The prop shapes cannot be written wrong |

## Revision History

| Date | Author | Change |
| --- | --- | --- |
