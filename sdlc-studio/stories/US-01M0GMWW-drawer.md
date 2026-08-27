# US-01M0GMWW: Drawer

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Drawer/**, packages/react/src/components/Drawer/verification.md, scripts/check-component-css.mjs
> **Points:** 5

## User Story

**As a** Grace Adeyemi
**I want** a side panel with the same focus guarantees as a dialog
**So that** a drawer is not a second-class dialog with weaker keyboard behaviour

## Context

### Persona Reference

**Grace Adeyemi** - works the keyboard, so an overlay's focus behaviour is not a detail to her; it
is whether the overlay is usable at all.
[Full persona details](../personas.md#grace-adeyemi)

**Sofia Marchetti** - assembles ERP screens from Clara and expects the twenty-sixth component to be
predictable from the twenty-fifth. A Drawer whose focus rules differ from Modal's breaks that
promise in the place it costs most.
[Full persona details](../personas.md#sofia-marchetti)

### Background

An ERP screen runs out of room. Filters, a record's detail, a bulk-edit form - each needs a surface
that is clearly secondary to the table behind it, and a centred dialog is the wrong shape: it covers
the thing the user is filtering.

The reason this is a story and not a Modal variant is stated in AC2, and it is the whole point of
the unit: **a drawer is not a second-class dialog.** Every library Sofia has used before shipped a
drawer with weaker focus handling than its dialog - restoring to the body, or not restoring at all -
because the drawer was added later and nobody re-derived the rules. Modal's focus machinery here is
about a hundred lines whose every comment records a defect measured across nine adversarial review
rounds. Drawer gets that machinery itself, not a copy of it.

The second thing a drawer has that a dialog does not is **a spatial origin**. D0094 ruled Modal does
not animate, on an argument specific to centred dialogs: there is nowhere for a centred thing to
come from. A drawer comes from an edge, D0100 permits motion that carries meaning, so the panel
slides from the edge it is anchored to - and, being Class A decoration rather than information, the
slide is REMOVED under reduced motion rather than replaced.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| Epic | Stacking | Every portalled surface renders through `ClaraPortal` and takes its stacking from the shared overlay layer token; which of two overlays paints on top is decided by OPEN order, not mount order (D0088, D0102) | AC1 and AC7 assume the panel is portalled, which is why neither can be verified in the static geometry fixture - `ClaraPortal` returns null on the server by design (US-01M0GM61 AC4) |
| Epic | Motion | D0100 - no state in Clara is carried by motion alone; a Class A animation is REMOVED under reduced motion, a Class B one is replaced | AC8 asserts both halves in a browser, because jsdom returns no animation |
| PRD F01 | API surface | Tier 2 tokens are public and permanent at publish; tiers 1 and 3 are not. No Radix type, prop name or `data-*` attribute may reach the public surface | AC3 refuses a tier 1 reference or a raw literal in the panel's CSS |
| PRD | Performance | Per-component JavaScript budgets apply; CSS is deliberately not tree-shaken and ships as one stylesheet | No AC of its own - enforced by `pnpm size`, which holds Drawer inside the 5 kB client-chunk budget |
| PRD | Security | The library reads no environment variables and makes no network call | Not applicable to this component; recorded so its absence is a finding rather than an omission |

## Acceptance Criteria

### AC1: Placements

- **Given** a Drawer
- **When** I set placement
- **Then** left, right and bottom all render correctly
- **Verify:** vitest "Drawer placements"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC2: Focus parity with Modal

- **Given** a Drawer
- **When** it opens and closes by any route
- **Then** initial focus and restoration behave identically to Modal, asserted by identity
- **Verify:** vitest "Drawer focus parity with Modal"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC3: Token-only styling

- **Given** the Drawer stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC4: Both themes and densities

- **Given** a Drawer
- **When** it renders in dark theme and compact density
- **Then** it renders inside the correct scope and passes axe in all four combinations
- **Verify:** vitest "Drawer theme and density matrix"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC5: Definition of done

- **Given** the Drawer story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a docs page, a documented
  keyboard table, and a manual keyboard pass that is either recorded or plainly declared
  outstanding, all exist
- **And** the wording is deliberately NARROWER than the sentence the other 21 stories in this repo
  carry. Theirs asserts "a visual baseline ... and a recorded manual keyboard pass all exist", and
  `check-verification.mjs` checks neither: it has no baseline rule at all, and it accepts an honest
  "outstanding" for the manual pass by design (`scripts/check-verification.mjs:310-328`). A
  criterion must claim what the thing verifying it checks. **BG-01M107ND** carries the same
  correction for the other 21, which are already Done and cannot have their text rewritten under a
  live `Verified:` stamp
- **Verify:** shell node scripts/check-verification.mjs --component Drawer
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC6: Scroll lock without layout shift

- **Given** a Drawer that is open
- **When** the page behind it would otherwise scroll
- **Then** it does not, and locking the scroll causes no layout shift from the scrollbar being removed
- **And** this is asserted here rather than left to Modal AC4: a Drawer locks scroll for the same
  reason a Modal does, and an epic acceptance criterion owned by one of the two components is the
  "solved once or nine times" failure appearing at epic level (found by the foundation's spec review)
- **Verify:** vitest "Drawer locks scroll"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC7: The panel rests against the edge it names

- **Given** an open Drawer in each of its three placements
- **When** its box is measured against the viewport in a real browser
- **Then** it touches the edge it is named for, does not span the whole of that axis, and runs the
  full length of the other one
- **And** this is a SEPARATE criterion from AC1 on purpose. AC1 asserts the placement CLASS, which
  is a proxy for a position (D0065); this asserts the position. Measured: swapping
  `inset-inline-start: 0` and `inset-inline-end: 0` between `.clara-drawer--left` and
  `.clara-drawer--right`, leaving the keyframe names untouched, put every left drawer on the RIGHT
  edge and left all of it green - 1191 unit tests, both existing drawer browser tests, and
  `check-component-css`
- **And** it cannot be asserted in gate 9's static fixture: `build-geometry-fixture.mjs` renders with
  `renderToStaticMarkup` and `ClaraPortal` returns null on the server by design (US-01M0GM61 AC4),
  so no portalled surface appears in that fixture at all
- **Verify:** shell pnpm test:e2e -g "a drawer rests against the edge it names"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC8: It slides from its own edge, and stops entirely under reduced motion

- **Given** an open Drawer
- **When** motion is permitted, and again when `prefers-reduced-motion: reduce` is set
- **Then** it animates in on the axis its placement names, and under reduced motion it does not
  animate at all
- **And** D0100 Class A: the slide is spatial decoration, not the information. The state change is
  already carried by the dimmed viewport, the focus move and the inert background, so the rule says
  REMOVE it rather than substitute something. Toast is the Class B contrast in the same epic
- **And** the animation NAME is asserted, not merely its presence, so a drawer anchored left cannot
  silently reuse the right-hand keyframe and enter from the wrong side of the screen
- **And** jsdom returns no animation, so any verdict it reached about this would be a false green by
  construction rather than a flaky one
- **Verify:** shell pnpm test:e2e -g "a drawer (slides in from the edge it is anchored to|removes its slide entirely under reduced motion)"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Drawer

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**TDD.** This component has a documented keyboard interaction table, so the table is the specification and its tests are written first (D0024).

**Points:** 5 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold, a documented keyboard interaction table, and a recorded manual keyboard pass.

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| Rendered `open={false}`, the ordinary state of every drawer on a page | Takes no focus. The restore runs on the open -> closed TRANSITION, never on first commit - an earlier version ran on mount with both targets null, fell into the fallback loop and stole focus from whatever the user was on |
| Unmounted while open, the `{open && <Drawer open .../>}` shape | Focus still returns. There is no open -> closed transition on that route, so restoration also runs from a cleanup, deferred by a microtask so Clara's restore lands after Radix's FocusScope rather than before it |
| The opener was removed in the same commit that closed the drawer | Falls back to the first element that ACTUALLY takes focus, tried in order - not the first CSS match, which can be a `[hidden]` button whose `.focus()` is a silent no-op |
| A second overlay closes in the same commit | Every NAMED restore runs before any anonymous fallback anywhere. Single-phase restoration let a confirm dialog's fallback grab the page's skip link and lock out the edit drawer underneath it |
| The opener is `disabled` by the time the drawer closes | The named restore reports failure rather than success, so the fallback runs. `isConnected` is not focusable, and returning `true` regardless stranded focus on `document.body` |
| Content taller than the viewport | The BODY scrolls, not the panel - a panel that scrolls carries its header and footer away with it. `max-block-size: 100%` and `box-sizing: border-box` keep the panel inside the viewport in every placement |
| A fixed-height child inside the body, e.g. a chart | Does not shrink. `.clara-drawer__body > * { flex-shrink: 0 }`, because a flex column squashed such a child to 18px rather than letting the body scroll it - measured on Modal |
| The page behind has a scrollbar | Locked, and the width the scrollbar occupied is handed back as padding, so nothing reflows |
| A click on the background | Nothing happens to the background. Radix makes it genuinely inert with `pointer-events: none`; a test scenario written as a background click had to be rewritten because a user cannot perform it |
| Reduced motion | No slide at all. The state change is already carried by the dimmed viewport, the focus move and the inert background |
| Dark theme | The panel declares its own `color`. Portalled to `document.body`, an undeclared panel took its text colour from the PAGE and its background from the portal's scope - 1.26:1 in dark theme, and four gates were blind to it |

## Test Scenarios

- [x] Each of left, right and bottom renders with its own placement class, and the default is right
- [x] Each placement names itself, so the dialog does not announce as "dialog" and nothing more
- [x] Each placement passes axe, scoped to `document.body` rather than the render container - the
      panel is portalled out of the React root, so a container-scoped run inspects the opener alone
- [x] Focus returns to the opener BY IDENTITY, for Modal and Drawer, from the same harness
- [x] An `initialFocus` target wins over Radix's own first-tabbable choice, for both components
- [x] Neither component steals focus while closed
- [x] Both restore focus when they UNMOUNT rather than close, from a control inside the overlay
- [x] The page is locked AND the removed scrollbar width is handed back, read from the injected
      stylesheet because jsdom does not apply injected rules to computed style
- [x] The lock is released on close - asserting only the release passes on a drawer that never locked
- [x] All four theme and density combinations render and pass axe, with the scope walked UP from an
      element inside the panel rather than queried off the render container
- [x] **In a browser:** each placement rests against the edge it names and spans the other axis
- [x] **In a browser:** each placement slides in on its own axis, and the slide is removed entirely
      under reduced motion

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0GM61](US-01M0GM61-portal-layer-scale-and-scoping-infrastructure.md) | Blocking | `ClaraPortal`, the shared overlay layer token, and theme/density scoping on the portal root | Done |
| [US-01M0GM48](US-01M0GM48-modal.md) | Blocking | The focus machinery AC2 requires parity with. It was EXTRACTED to `packages/react/src/lib/overlay-focus.ts` rather than copied, and Modal's own 62 tests were re-run unchanged to prove the extraction preserved behaviour | Done |
| [US-01M0WSME](US-01M0WSME-chromatic-visual-regression-blocking-on-unreviewed-diffs.md) | Non-blocking | Gate 7. Nothing here can see what the panel LOOKS like; the browser assertions cover where it sits and whether it moves, not its appearance | Draft |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| `@radix-ui/react-dialog` | Runtime peer of the component | In use. Supplies the focus scope, the inert background and the escape handling; none of its props, types or `data-*` attributes reach Clara's public surface |
| Playwright + a built Storybook | Test-only | In use. The panel is portalled, so it cannot appear in the static geometry fixture at all - every rendered claim about it is asserted against a live Storybook build |

## Estimation

**Points:** 5
**Complexity:** Medium

The 5 is a relative size against the overlays already delivered, not a duration. It sits above
Popover (5, but with no scroll lock and no motion) and below DropdownMenu (8, which owns roving
focus and typeahead). What makes it a 5 rather than a 3 is that two of its six criteria - focus
parity and scroll lock - are behaviours no assertion can reach naively, and the parity one turned
into an extraction of Modal's machinery rather than a new implementation.

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
roll back in the operational sense. What it HAS is a one-way door: once `Drawer` and its props are
published under `@luzentialabs/clara-react`, a rename breaks consumers already shipped, and a bad
release is fixed FORWARD with a patch and never unpublished.

| Component | Reversal | Expected time |
| --- | --- | --- |
| The `Drawer` export, before any publish | Revert the commit. `NPM_TOKEN` is unset deliberately, so nothing has left this repository | Minutes |
| The `Drawer` export, after a publish | Not reversible. Deprecate the release, ship a corrected patch, leave the bad version in place - releases are immutable by policy | One release cycle |
| `packages/react/src/lib/overlay-focus.ts` | NOT independently reversible. Modal and Drawer both call it, so reverting it changes Modal's behaviour too. That is deliberate - it is what AC2's parity means - but it makes this the highest-blast-radius file the story touched | Requires re-running Modal's 62 tests and 11 criteria |

## Open Questions

- [x] Does AC5's "a visual baseline ... and a recorded manual keyboard pass all exist" match what its
      verifier checks? **No. Filed as BG-01M107ND.** `check-verification.mjs` has no baseline rule at
      all, and it deliberately accepts an honest "outstanding" for the manual pass. The same sentence
      appears in 22 criteria across this repo, so it is a copied wording defect rather than this
      story's, and it is filed rather than edited under four Done stamps. AC5's wording here is
      corrected in place, because this story is not yet closed. Owner: Mira Calderon (qa)
- [x] Should a drawer trap focus, as a modal dialog does? **Yes, and it already does** - AC2's parity
      requirement settles it: Drawer renders through `@radix-ui/react-dialog`, so it inherits the
      focus scope, the inert background and the escape handling. The question is recorded because
      "drawer" suggests a lighter surface than "dialog" and the temptation to make it non-modal is
      real; a non-modal drawer is a Popover, which this epic already ships. Owner: Idris Vale (ux)

## Test Plan

Every row below was RUN. `Mutant` is the production edit the criterion's own verifier must fail on,
and the verdict beside it is what happened when that edit was made against this tree.

| Criterion | Touches | Mutant - the production change this test must fail on | Title |
| --- | --- | --- | --- |
| AC1 | packages/react/src/components/Drawer/Drawer.tsx | Drop the placement class: `cx('clara-drawer', className)`. KILLED - `Drawer placements` goes red on all three. Note what this criterion does and does not claim: the CLASS, not the position. AC7 owns the position. | Placements |
| AC2 | packages/react/src/lib/overlay-focus.ts | Disable the close-path restore (`if (false && !restoreNamed.current())`). KILLED. Deliberately mutated in the SHARED file rather than in Drawer: AC2's parity is an implementation claim, so a mutation that only Drawer's tests can see would not prove it. | Focus parity with Modal |
| AC3 | packages/react/src/styles.css | Replace `color: var(--clara-drawer-fg)` on `.clara-drawer` with `#1a1a1a`. KILLED - `check-component-css` fails. The verifier is a guard that READS the stylesheet, which is required here: no test imports a CSS file, so a vitest-only verifier over this mutant would be green by construction. | Token-only styling |
| AC4 | packages/react/src/theme/ClaraPortal.tsx | Strip `{...claraAttributes(settings)}` from the portal root. KILLED - 4 of 4 matrix cases fail. Mutating the PORTAL, not Drawer, is what proves the assertion walks up from inside the panel; an earlier version of this assertion read the render container, which carries the same attributes and stayed green. | Both themes and densities |
| AC5 | packages/react/src/components/Drawer/verification.md | Rename `## Keyboard` to `## Keys`. KILLED. The first attempt renamed it to `## Keyboard-removed-by-mutant` and SURVIVED, because the guard finds a section with `indexOf` and the longer heading still contains the shorter one as a prefix - a probe that could not fail, reporting a gap that was not there. | Definition of done |
| AC6 | packages/react/src/components/Drawer/Drawer.tsx | Set `modal={false}` on `Dialog.Root`. KILLED - `Drawer locks scroll` fails. The lock itself is Radix's; what Clara controls, and what this asserts, is that the drawer asks for it. | Scroll lock without layout shift |
| AC7 | packages/react/src/styles.css | Swap `inset-inline-start: 0` and `inset-inline-end: 0` between `.clara-drawer--left` and `.clara-drawer--right`, leaving the keyframe names untouched. KILLED by this criterion ALONE. Measured surviving: 1191 unit tests, `check-component-css`, and both pre-existing drawer browser tests - the slide test reads the animation NAME, which the mutant does not change. | The panel rests against the edge it names |
| AC8 | packages/react/src/styles.css | Remove `.clara-drawer--left, .clara-drawer--right, .clara-drawer--bottom { animation: none; }` from the `prefers-reduced-motion: reduce` block. KILLED - the reduced-motion half fails, the slide half stays green, which is the correct split. | It slides from its own edge, and stops entirely under reduced motion |

**A note on running these.** A mutation aimed at AC3, AC7 or AC8 must rebuild BOTH the library and
Storybook before the browser tests can see it - `pnpm build` alone is not enough, because
`e2e/stacking.spec.ts` serves a static Storybook build from disk. The first attempt at AC7's mutant
reported the new assertion GREEN for exactly that reason, which reads as "the assertion is
insensitive" when the assertion had never been shown the mutation. `pnpm test:e2e` does both builds;
a bare `playwright test` does neither.

## Specification delta (2026-08-26)

**AC2 says "identically to Modal, asserted by identity", and that was read as a requirement on the
IMPLEMENTATION, not only on the assertions.** Modal's focus machinery - about a hundred lines whose
every comment records a defect measured across nine adversarial review rounds - was EXTRACTED to
`packages/react/src/lib/overlay-focus.ts` and is now called by both. A copy would have inherited the
code and not the reasons, and the first person to simplify one of them would reintroduce a strand in
one overlay and not the other. Modal's 62 tests and 11 criteria were re-run unchanged to prove the
extraction preserved behaviour; Modal went from 296 lines to 150.

The parity tests then run the SAME scenarios against BOTH components rather than asserting that
Drawer imports something. They are hard to fail today, which is the point: they fail the moment
somebody gives Drawer its own copy.

**Motion, which no criterion mentioned.** D0094 ruled Modal does not animate on an argument specific
to centred dialogs - no spatial origin. A drawer has one, D0100 permits that meaning, so the panel
slides from its own edge, exits instantly, and has the slide REMOVED under reduced motion (Class A:
the state change is already carried by the dimmed viewport, the focus move and the inert background).

**One test scenario had to be rewritten because the component was working.** The unmount route was
first written as a click on a background button, which fails with `pointer-events: none` - Radix
makes the background genuinely inert. A user cannot do that, so the scenario was not reachable. It
now unmounts from a control INSIDE the drawer ("Save and close"), which is the real route.

**AC4 corrected as in every other story in this epic** - a jsdom matrix cannot see a visual baseline.

## Specification delta (2026-08-27)

**This story was never reviewed.** The other four overlays went through five adversarial rounds; this
one shipped in the built package at `planning` tier with six green criteria and zero review rows. It
was not deferred - it was skipped. That is why the delta below is larger than a closing pass usually
is.

**1. AC1 was verified by a proxy, and the property was wrong-able in silence.** "left, right and
bottom all render correctly" was checked by asserting a CLASS NAME. Swapping `inset-inline-start: 0`
and `inset-inline-end: 0` between `.clara-drawer--left` and `.clara-drawer--right` - keeping the
keyframe names untouched - put every left drawer on the right edge, and left 1191 unit tests,
`check-component-css`, and both existing drawer browser tests GREEN. **AC7 is new** and asserts the
box against the viewport. AC1 keeps the class assertion and now says plainly that the class is all
it claims.

**2. Motion had no criterion at all.** The panel's slide and its removal under reduced motion were
implemented, described in the previous delta, asserted in `e2e/stacking.spec.ts` - and named by no
acceptance criterion, so nothing in the gate held them. **AC8 is new** and names both halves.

**3. AC5 claimed two artefacts its verifier does not check.** "a visual baseline ... and a recorded
manual keyboard pass all exist": `check-verification.mjs` has no baseline rule, and it deliberately
accepts an honest "outstanding" for the manual pass. Neither exists for any component in this repo.
AC5's wording is corrected here; the identical sentence in 21 other stories is **BG-01M107ND**,
filed rather than edited because those stories are Done and their `Verified:` stamps do not expire
when their text changes.

**4. The story carried no `## Test Plan`.** `check-story-verifiers.mjs` skips a story that has none,
so six `Verified: yes` stamps sat outside the gate AGENTS.md mandates for exactly this. The table
above is filled from mutants that were actually run, one per criterion, with the verdict recorded -
including the one that first SURVIVED because the probe could not fail.

**5. Promoted from `planning` to `full`.** Context, Inherited Constraints, Edge Cases, Test
Scenarios, Dependencies, Estimation, Rollback Envelope and Open Questions were template
placeholders. The Rollback Envelope is the one worth reading: `overlay-focus.ts` is shared with
Modal, so it is not independently reversible, and that is a property of the parity AC2 required
rather than a defect.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-27 | sdlc-studio | Promoted to full tier; AC7 (rendered placement) and AC8 (motion) added; AC5 narrowed to what its verifier checks; Test Plan filled from eight measured mutants |
