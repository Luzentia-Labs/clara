# US-01M0GMBC: Spinner

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Spinner/Spinner.tsx, packages/react/src/components/Spinner/Spinner.stories.tsx, packages/react/src/components/Spinner/__tests__/spinner.test.tsx, packages/react/src/styles.css, e2e/geometry.spec.ts, scripts/build-geometry-fixture.mjs, package.json, packages/react/src/components/Spinner/index.tsx, scripts/check-component-css.mjs
> **Points:** 1

## User Story

**As a** Grace Adeyemi
**I want** a busy indicator with an accessible label
**So that** I know the system is working rather than stuck

## Context

### Persona Reference

**Grace Adeyemi** - hears "Loading" on a screen with four regions and learns that something is
loading, not which of them.
[Full persona details](../personas.md#grace-adeyemi)

**Sofia Marchetti** - drops a spinner into a panel and expects it to be the same spinner the button
already uses, turning at the same rate.
[Full persona details](../personas.md#sofia-marchetti)

### Background

A spinner says "right now". It cannot say what, and that is the entire design of this component's
API: `label` is required and is NOT defaulted to "Loading", because the word Clara could supply is
exactly the word that carries no information on a dense ERP screen.

The second decision is that the ring is ONE implementation. `.clara-spinner__ring` is the same class
`<Button loading>` renders, so the two cannot drift into spinners that turn at different rates - the
argument D0100 made for the shared ring, and the same argument the overlay focus machinery rests on.

The third is D0100 itself, in its temporal form: **no state in Clara is carried by motion alone.**
The ring says "right now"; the label says what. Under `prefers-reduced-motion: reduce` the ring is
not simply stopped - it is a **Class B** case, where the motion IS the information, so the rotation
is REPLACED by a pulse on the same period rather than removed. A stopped ring reads as a broken one.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| Epic | Accessibility | No state in Clara is carried by colour alone, and none by motion alone (D0100). The seat that DECIDES inclusive design (Idris, ux) is not the seat that PROVES it (Mira, qa) - neither may assume the other covered it | AC1 - a required, non-defaulted `label`; AC2 - reduced motion SUBSTITUTES rather than removes, because the motion is the information (D0100 Class B) |
| PRD F01 | API surface | Tier 2 tokens are public and permanent at publish; tiers 1 and 3 are not. Prop types use literal unions, never a bare `string`, wherever the value set is closed | `label: string` is required. There is no intent or size union to get wrong |
| PRD | Styling | Component CSS may reference tier 2 and tier 3 tokens only - a tier 1 reference or a raw literal fails CI. All CSS emits inside `@layer clara.reset, clara.tokens, clara.components;` | AC3 |
| TRD Section 7 | Boundary | Every component is classified server or client, and the classification is proved by three oracles that deliberately do not share a reader (D0051) | Spinner is SERVER - it holds nothing. `renders on the server` asserts it directly |
| PRD | Performance | Per-component JavaScript budgets apply; CSS is deliberately not tree-shaken and ships as one stylesheet | No AC of its own - held by `pnpm size` |

## Acceptance Criteria

### AC1: Labelled

- **Given** a Spinner
- **When** it renders
- **Then** it carries an accessible label describing what is loading
- **Verify:** vitest "Spinner has accessible label"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC2: Respects reduced motion

- **Given** a Spinner
- **When** prefers-reduced-motion is set
- **Then** the motion is REPLACED, not removed: the ring displaces nothing across the cycle and
  still changes over time, on the same period (D0100)
- **Verify:** shell pnpm check:geometry
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC3: Token-only styling

- **Given** the Spinner stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC4: Both themes and densities

- **Given** a Spinner
- **When** it renders in dark theme and compact density
- **Then** it renders inside the correct scope and passes axe in all four combinations
- **Verify:** vitest "Spinner theme and density matrix"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC5: Definition of done

- **Given** the Spinner story
- **When** it is proposed for export
- **Then** a verification record, its cited tests, an axe assertion, and a docs page all exist and
  resolve
- **Verify:** shell node scripts/check-verification.mjs --component Spinner
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC6: Placing the shared ring does not resize its host

- **Given** a `<Button loading>` and an identical idle button
- **When** both are measured in a real browser
- **Then** their boxes are the same size
- **And** this is the other half of "one ring implementation". The story already claims Spinner and
  Button render the SAME class so the two cannot drift; what holds the button's size while that ring
  is inside it is `.clara-button__spinner { position: absolute }`, which overlays the ring on the
  label box the button has already reserved
- **And** deleting that one rule left the ENTIRE repository green - 1200 unit tests,
  `check:geometry`, `pnpm test:e2e` at 34 passed, `check-component-css` and `check-stylesheets`.
  The `motion-button-loading` fixture case is `kind: 'motion'`, so the geometry suite measured its
  animation and never its box. Without the rule the ring joins the flex row and the button grows the
  moment it starts saving, moving every control after it mid-click
- **Verify:** shell pnpm check:geometry
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Spinner

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
| No `label` | A type error. It is required and not defaulted, because "Loading" is the one word that adds nothing |
| A screen reader reaching the ring | Nothing. The ring is `aria-hidden` - it is the visual half, and the label below is what is announced |
| `prefers-reduced-motion: reduce` | The rotation is REPLACED by a pulse on the same period, not removed. **Class B**: the motion is the information, so removing it would remove the state. A stopped ring reads as broken |
| `role="status"`, not `alert` | A spinner is not an interruption; a screen reader reaches it in its own time |
| Beside a `<Button loading>` | The same ring class, so the two cannot turn at different rates. Deleting the shared class would be caught by the test that asserts the identity |
| Rendered in a Server Component | Works. No directive, no browser API |
| Measured in jsdom | Nothing about the motion can be seen there - jsdom returns no animation. AC2's verifier is a browser gate for that reason |

## Test Scenarios

- [x] It announces WHAT is loading, not merely that something is
- [x] The ring is hidden from the accessibility tree, so the label is announced once
- [x] It renders the SAME ring class Button renders, so the two cannot drift
- [x] It renders on the server
- [x] axe passes
- [x] All four theme and density combinations render and pass axe
- [x] **In a browser:** it animates, and it never stops
- [x] **In a browser:** under reduced motion it displaces nothing AND still changes over time - both
      halves, because "it stopped moving" would satisfy the first alone and is the defect

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

A 1: one element, one required prop, no variants. The reduced-motion substitution is the only
judgement in it, and it was made once in D0100 and applies to the shared ring rather than to this
component alone.

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
roll back operationally. What it HAS is a one-way door: once `Spinner` and its props are published
under `@luzentialabs/clara-react`, a rename breaks consumers already shipped, and a bad release is
fixed FORWARD with a patch and never unpublished.

| Component | Reversal | Expected time |
| --- | --- | --- |
| The `Spinner` export, before any publish | Revert the commit. `NPM_TOKEN` is unset deliberately, so nothing has left this repository | Minutes |
| The `Spinner` export, after a publish | Not reversible. Deprecate the release, ship a corrected patch, leave the bad version in place - releases are immutable by policy | One release cycle |
| `.clara-spinner__ring`, which `<Button loading>` also renders | Not independently reversible | Requires re-running every consumer of the shared surface |

## Open Questions

- [ ] None. Both questions below were answered during the
      review round and are recorded under Resolved Questions.

## Resolved Questions

- [x] Should `label` default to "Loading", so the component is one prop easier to use?
      **No - settled by AC1.** A default makes the uninformative case the easy one, and on a screen
      with four loading regions "Loading" tells a screen-reader user nothing they did not know. The
      same argument makes Badge's `countLabel` required.


- [x] Under reduced motion, should the ring simply stop? **No - it is Class B under D0100 and the
      motion is REPLACED.** A stopped ring is indistinguishable from a broken one, and the state it
      was carrying ("right now") would be gone. The substitution changes on the same period, so
      liveness survives without the rotation that triggers the vestibular response.

## Test Plan

Every row below was RUN against this tree. `Mutant` is the production edit the criterion's own
verifier must fail on, and the verdict beside it is what happened when that edit was made.

| Criterion | Touches | Mutant - the production change this test must fail on | Title |
| --- | --- | --- | --- |
| AC1 | packages/react/src/components/Spinner/Spinner.tsx | Delete `<span className="clara-visually-hidden">{label}</span>`. KILLED, 2 tests. The ring is `aria-hidden`, so with the label gone the component announces nothing at all - which is the state a defaulted "Loading" would also leave a user in, one screen region at a time. | Labelled |
| AC2 | packages/react/src/styles.css | Inside `@media (prefers-reduced-motion: reduce)`, replace the pulse with `animation: none` - a plain STOP rather than a substitution. KILLED by `check:geometry` in a browser: `under reduced motion it displaces nothing, and still changes over time`. Both halves matter and the mutant targets the second: a stopped ring displaces nothing and reads as broken. D0100 Class B - the motion IS the information here, so it is replaced, not removed. jsdom returns no animation and could decide none of this. | Respects reduced motion |
| AC3 | packages/react/src/styles.css | Add `border-radius: 7px` to `.clara-spinner` - a raw literal where a token belongs. KILLED, `check-component-css` exits 1. The verifier is a guard that READS the stylesheet, which is required here: no test imports a CSS file, so a vitest-only verifier over this mutant would be green by construction. | Token-only styling |
| AC4 | packages/react/src/theme/resolve.ts | `claraAttributes` returns `{}`, so the provider stops stamping its scope. KILLED, 4 of 4 combinations. Mutating the PROVIDER rather than the component is what proves the assertion reads the scope rather than merely finding the component. What this criterion claims is bounded and the story says so: jsdom sees no layout and resolves no custom property, so the APPEARANCE is gate 7's. | Both themes and densities |
| AC5 | packages/react/src/components/Spinner/verification.md | Rename `## Keyboard` to `## Keys`. KILLED - `missing section "## Keyboard"`, exit 1. Renaming it to anything CONTAINING `## Keyboard` was accepted until 2026-08-27, when `sectionBody`'s prefix match was anchored to a whole line; that suffix form is now `prove-guards` mutation 147. | Definition of done |
| AC6 | packages/react/src/styles.css | Delete `.clara-button__spinner { position: absolute; }`. KILLED by `check:geometry` - `a loading button ... resizes when it starts working`. It previously survived EVERYTHING: 1200 unit tests, `check:geometry`, `pnpm test:e2e` at 34 passed, `check-component-css` and `check-stylesheets`, because the `motion-button-loading` fixture case is `kind: 'motion'` and the suite measured its animation and never its box. The fixture now carries an idle twin so both boxes are on the page at once - a size claim needs something to be the same size AS. | Placing the shared ring does not resize its host |

## Revision History

| Date | Author | Change |
| --- | --- | --- |
