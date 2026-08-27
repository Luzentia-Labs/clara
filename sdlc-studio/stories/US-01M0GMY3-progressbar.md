# US-01M0GMY3: ProgressBar

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/ProgressBar/**, packages/react/src/components/ProgressBar/index.tsx, scripts/check-component-css.mjs
> **Points:** 2

## User Story

**As a** Grace Adeyemi
**I want** determinate and indeterminate progress with correct ARIA
**So that** I can tell how far through a long operation I am

## Context

### Persona Reference

**Grace Adeyemi** - needs the progress reported as a value she can hear, not as a width she cannot
see.
[Full persona details](../personas.md#grace-adeyemi)

**Sofia Marchetti** - runs long imports and posts, and needs both the "42 of 300" case and the "we
genuinely do not know" case from one component.
[Full persona details](../personas.md#sofia-marchetti)

### Background

An ERP screen runs jobs that take minutes: a period close, a stock revaluation, a bulk import. A
progress bar is how long a job says how far along it is.

Two modes, and the split is the story. A DETERMINATE bar knows its fraction and must report it -
`aria-valuenow`, `aria-valuemin`, `aria-valuemax` - because the width is invisible to anyone not
looking at it. An INDETERMINATE bar does not know, and must therefore report NOTHING numeric:
`aria-valuenow` absent, and no inline width, so nothing reads as a parked percentage.

That second half is the one that goes wrong. A bar that traverses forever while reporting
`aria-valuenow="0"` tells a screen-reader user the job has not started, which is worse than silence.
The type shape makes it unrepresentable: `value` and `indeterminate` are mutually exclusive.

D0100 applies here too, and differently from Spinner: the determinate bar neither animates nor
transitions, because it states its value rather than travelling toward it.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| Epic | Accessibility | No state in Clara is carried by colour alone, and none by motion alone (D0100). The seat that DECIDES inclusive design (Idris, ux) is not the seat that PROVES it (Mira, qa) - neither may assume the other covered it | AC1 - the value is REPORTED, not merely painted; AC2 - the indeterminate mode reports nothing numeric rather than reporting zero |
| PRD F01 | API surface | Tier 2 tokens are public and permanent at publish; tiers 1 and 3 are not. Prop types use literal unions, never a bare `string`, wherever the value set is closed | `ProgressBarDeterminateProps` and `ProgressBarIndeterminateProps` are a discriminated pair, so `value` and `indeterminate` cannot appear together. `label` is required |
| PRD | Styling | Component CSS may reference tier 2 and tier 3 tokens only - a tier 1 reference or a raw literal fails CI. All CSS emits inside `@layer clara.reset, clara.tokens, clara.components;` | AC3 |
| TRD Section 7 | Boundary | Every component is classified server or client, and the classification is proved by three oracles that deliberately do not share a reader (D0051) | ProgressBar is SERVER - it holds nothing. `renders on the server` asserts it directly |
| PRD | Performance | Per-component JavaScript budgets apply; CSS is deliberately not tree-shaken and ships as one stylesheet | No AC of its own - held by `pnpm size` |

## Acceptance Criteria

### AC1: ARIA values

- **Given** a determinate ProgressBar
- **When** it renders
- **Then** aria-valuenow, valuemin and valuemax are correct and update
- **Verify:** vitest "ProgressBar aria values"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC2: Indeterminate mode

- **Given** an indeterminate ProgressBar
- **When** it renders
- **Then** it announces as busy without claiming a false percentage
- **Verify:** vitest "ProgressBar indeterminate mode"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC3: Token-only styling

- **Given** the ProgressBar stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC4: Both themes and densities

- **Given** a ProgressBar
- **When** it renders in dark theme and compact density
- **Then** it renders inside the correct scope and passes axe in all four combinations
- **Verify:** vitest "ProgressBar theme and density matrix"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC5: Definition of done

- **Given** the ProgressBar story
- **When** it is proposed for export
- **Then** a verification record, its cited tests, an axe assertion, and a docs page all exist and
  resolve
- **Verify:** shell node scripts/check-verification.mjs --component ProgressBar
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC6: It states its value rather than travelling toward it

- **Given** a determinate ProgressBar, and an indeterminate one
- **When** each is measured in a real browser, under both motion preferences
- **Then** the determinate bar neither animates nor transitions; the indeterminate one traverses
  forever and never backwards; and under `prefers-reduced-motion: reduce` it stops traversing,
  spans the full track, and cycles colour on a period no faster than 3Hz
- **And** the criterion exists because **this story had no D0100 criterion at all**. The gate did -
  `e2e/geometry.spec.ts` has held these assertions since the component was built - but nothing
  named it, so `reconcile --verify` was green with the defect installed. A review measured it:
  adding `transition: inline-size ... linear` to `.clara-progress__fill` - the precise edit this
  story's own Open Question calls "settled by D0100 and asserted in the browser" - passed all five
  of the then-existing verifiers, and failed `check:geometry` the moment anything ran it
- **And** a transition is not a style choice here. `aria-valuenow` reports the NEW value immediately
  while a transitioned width still paints the old one, so for the length of the transition a sighted
  user and a screen-reader user are told different numbers
- **And** the full-track width under `reduce` is load-bearing, not tidiness: stop a quarter-width
  segment travelling without widening it and it parks at the start of the track, reading as "25%
  complete" - a percentage the bar does not know and AC2 explicitly refuses to claim
- **Verify:** shell pnpm check:geometry
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- ProgressBar

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
| `value` above `max`, or below zero | Clamped, not overflowed. An unclamped value paints a fill wider than its own track |
| A `max` other than 100 | Honoured. "42 of 300" is the ordinary ERP shape, and forcing the caller to convert to a percentage first is where rounding errors come from |
| `indeterminate` | Announces as a progressbar with NO `aria-valuenow`, and sets no inline width. Reporting `0` would say the job has not started, which is worse than saying nothing |
| `value` and `indeterminate` together | A type error. The two prop shapes are a discriminated union with `never` on the opposite member |
| The value changing | `aria-valuenow` changes with it. A bar whose width moves and whose reported value does not is the defect AC1 exists for |
| Determinate, under any motion preference | It neither animates nor transitions. It STATES its value rather than travelling toward it (D0100) - a transition would make the reported value and the painted value disagree mid-flight |
| Indeterminate, under reduced motion | It stops traversing and cycles colour instead - a Class B substitution, like Spinner's |
| Rendered in a Server Component | Works. No directive, no browser API |

## Test Scenarios

- [x] It reports now, min and max
- [x] `aria-valuenow` updates when the value does
- [x] A `max` other than 100 is honoured
- [x] The value is clamped rather than overflowing its own track
- [x] The fill width is set from the datum, which is the one thing a class cannot express
- [x] Indeterminate announces as a progressbar without claiming a percentage
- [x] Indeterminate sets no inline width, so nothing reads as a parked percentage
- [x] Indeterminate carries a class the stylesheet can drive the traverse from
- [x] axe passes determinate and indeterminate
- [x] It renders on the server
- [x] All four theme and density combinations render and pass axe
- [x] **In a browser:** determinate neither animates nor transitions
- [x] **In a browser:** indeterminate traverses, forever, and never backwards
- [x] **In a browser:** under reduced motion it stops traversing and cycles colour instead

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
**Complexity:** Low-Medium

A 2: the render is simple, but there are two modes with genuinely different ARIA contracts, and
getting the indeterminate one wrong is silent - it reports a number that is not true rather than
failing. The discriminated union is what makes the wrong shape unwriteable.

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
roll back operationally. What it HAS is a one-way door: once `ProgressBar` and its props are published
under `@luzentialabs/clara-react`, a rename breaks consumers already shipped, and a bad release is
fixed FORWARD with a patch and never unpublished.

| Component | Reversal | Expected time |
| --- | --- | --- |
| The `ProgressBar` export, before any publish | Revert the commit. `NPM_TOKEN` is unset deliberately, so nothing has left this repository | Minutes |
| The `ProgressBar` export, after a publish | Not reversible. Deprecate the release, ship a corrected patch, leave the bad version in place - releases are immutable by policy | One release cycle |
| The `--clara-progress-*` tier 3 tokens and the traverse keyframes | Not independently reversible | Requires re-running every consumer of the shared surface |

## Open Questions

- [x] Should the determinate bar transition between values, so a jump looks smooth?
      **No - settled by D0100 and asserted in the browser.** A transition makes the painted value and
      the reported value disagree for the length of the transition, and the reported one is the only
      one a screen-reader user has. It states its value; it does not travel toward it.

## Resolved Questions

- [x] Should an indeterminate bar report `aria-valuenow="0"`, so the attribute is always present?
      **No.** "Zero percent complete" is a claim, and it is false - the job may be nearly finished.
      An absent `aria-valuenow` is the ARIA-defined way to say the value is unknown, and saying
      nothing is strictly better than saying something untrue.

## Test Plan

Every row below was RUN against this tree. `Mutant` is the production edit the criterion's own
verifier must fail on, and the verdict beside it is what happened when that edit was made.

| Criterion | Touches | Mutant - the production change this test must fail on | Title |
| --- | --- | --- | --- |
| AC1 | packages/react/src/components/ProgressBar/ProgressBar.tsx | Delete `aria-valuenow={value}`. KILLED, 5 tests. The width is invisible to anyone not looking at it, so the reported value is the only channel a screen-reader user has. | ARIA values |
| AC2 | packages/react/src/components/ProgressBar/ProgressBar.tsx | `const indeterminate = false`, so an indeterminate bar reports a number. KILLED, 3 tests. This is the mutant that matters: the failure is not a missing attribute but a FALSE one - `aria-valuenow="0"` tells a screen-reader user the job has not started when it may be nearly finished, which is worse than silence. | Indeterminate mode |
| AC3 | packages/react/src/styles.css | Add `border-radius: 7px` to `.clara-progress` - a raw literal where a token belongs. KILLED, `check-component-css` exits 1. The verifier is a guard that READS the stylesheet, which is required here: no test imports a CSS file, so a vitest-only verifier over this mutant would be green by construction. | Token-only styling |
| AC4 | packages/react/src/theme/resolve.ts | `claraAttributes` returns `{}`, so the provider stops stamping its scope. KILLED, 4 of 4 combinations. Mutating the PROVIDER rather than the component is what proves the assertion reads the scope rather than merely finding the component. What this criterion claims is bounded and the story says so: jsdom sees no layout and resolves no custom property, so the APPEARANCE is gate 7's. | Both themes and densities |
| AC5 | packages/react/src/components/ProgressBar/verification.md | Rename `## Keyboard` to `## Keys`. KILLED - `missing section "## Keyboard"`, exit 1. Renaming it to anything CONTAINING `## Keyboard` was accepted until 2026-08-27, when `sectionBody`'s prefix match was anchored to a whole line; that suffix form is now `prove-guards` mutation 147. | Definition of done |
| AC6 | packages/react/src/styles.css | THREE mutants, all KILLED by `check:geometry`, one per clause. (a) Add `transition: inline-size var(--clara-duration-state-change) linear` to `.clara-progress__fill` - `a transitioned width lies about the current value for its duration`. **This survived every one of the five criteria that existed before AC6**, because none of them ran a browser. (b) Delete `inline-size: 100%` from the reduced-motion block - `the fill is a parked segment, which reads as a percentage the bar does not know`; it previously survived because the samples read `transform` and `backgroundColor` and never the width. (c) Speed the reduced colour cycle below 3Hz - `faster than 3Hz, which is the flash hazard WCAG 2.3.1 bounds`; the period was bounded only in the `no-preference` branch, which is the branch a motion-sensitive user never sees. | It states its value rather than travelling toward it |

## Revision History

| Date | Author | Change |
| --- | --- | --- |
