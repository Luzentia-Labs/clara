# US-01M0GMWW: Drawer

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Drawer/Drawer.tsx, packages/react/src/components/Drawer/index.tsx, packages/react/src/components/Drawer/Drawer.stories.tsx, packages/react/src/components/Drawer/__tests__/drawer.test.tsx, packages/react/src/lib/overlay-focus.ts, packages/react/src/styles.css, e2e/stacking.spec.ts, apps/docs/src/content/components/drawer.md, scripts/check-verification.mjs, scripts/prove-guards-fail.mjs, package.json, packages/react/src/components/Drawer/verification.md, scripts/check-component-css.mjs
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
- **Then** each renders with its own placement CLASS, names itself, and passes axe - and the default
  is right, so a consumer who does not choose gets the common case
- **And** the CLASS is all this criterion claims. Where the panel actually sits is AC7, and the split
  is deliberate: "renders correctly" was the original wording and it was verified by a class-name
  assertion, which is a proxy for a position (D0065). The two are separate criteria so that neither
  can be read as covering the other
- **Verify:** vitest "Drawer placements"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC2: Focus parity with Modal

- **Given** a Drawer
- **When** it opens and closes by any route
- **Then** initial focus and restoration behave identically to Modal, asserted by identity
- **And** the harness places a focusable DECOY ahead of the opener in document order, and that is
  load-bearing rather than scenery. `restoreFallback` walks `document.querySelectorAll` in document
  order, so with the opener first on the page BOTH the named restore and the anonymous fallback land
  on it and `expect(activeElement).toBe(opener)` is satisfied by either. A review measured exactly
  that: disabling `restoreNamed` alone left every test in this file GREEN and moved the failure into
  Modal's own suite - an identity assertion that was still a proxy. With the decoy ahead, the
  fallback lands on the decoy, the same mutation reddens six tests here, and each test asserts the
  negative (`not.toBe(decoy)`) beside the positive
- **And** `returnFocus` is covered, in BOTH components. It is public API on each; Modal tested it and
  Drawer did not, while AC2 claimed the same scenarios run against both
- **And** the mutation is made in the SHARED file, `packages/react/src/lib/overlay-focus.ts`, because
  AC2's parity is an implementation claim - a mutation only Drawer's own file could see would not
  prove it
- **Verify:** vitest "Drawer focus parity with Modal"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC3: Token-only styling

- **Given** the Drawer stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **And** the panel's CONTAINMENT and its scroll container are pinned by the same guard, not only
  its tokens: `.clara-drawer` must declare `box-sizing` and `max-block-size`, `.clara-drawer__body`
  must actually SCROLL its overflow, and `.clara-drawer__body > *` must not shrink
- **And** those three were deletable with every gate green until 2026-08-27. Modal's body carried the
  identical contract and Drawer's did not, although Drawer AC6 makes the same claim - a contract
  covering one of two components implementing one rule is how the rule returns in the component
  nobody enrolled. Both are named in this story's own Edge Cases table as fixes for measured defects:
  the panel escaping the viewport, and a fixed-height chart squashed to 18px instead of scrolled
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC4: Both themes and densities

- **Given** a Drawer
- **When** it renders in dark theme and compact density
- **Then** it renders inside the correct scope and passes axe in all four combinations
- **Verify:** vitest "Drawer theme and density matrix"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC5: Definition of done

- **Given** the Drawer story
- **When** it is proposed for export
- **Then** a verification record exists carrying a keyboard table, an accessibility section, at
  least three resolving citations to what is verified automatically, at least one stated gap, and a
  manual keyboard pass that is either recorded or plainly declared outstanding - and the docs page
  it names exists
- **And** "an axe assertion over default and ERROR states" is deliberately absent too. Drawer has no
  error state for one to cover, and `check-verification.mjs` carries no error-state rule - the phrase
  was copied from a form-control story where it means something. axe over the four theme and density
  combinations is real and is AC4's, asserted in `drawer.test.tsx`, not this criterion's
- **And** "stories" is deliberately ABSENT from that list, where the copied sentence has it.
  `grep -n "stories" scripts/check-verification.mjs` returns nothing, and moving
  `Drawer.stories.tsx` out of the tree leaves this criterion's verifier at
  `PASS [verification] Drawer: 1 verification record(s), 8 citation(s) resolved`. The requirement is
  real and it IS held - by AC7 and AC8, whose verifiers navigate to `overlays-drawer--left|right|bottom`
  and whose three browser tests all fail with the file gone. Naming it here as well would be a second
  criterion claiming a check it does not perform
- **And** the wording is deliberately NARROWER than the sentence the other 21 stories in this repo
  carry. Theirs asserts "a visual baseline ... and a recorded manual keyboard pass all exist", and
  `check-verification.mjs` checks neither: it has no baseline rule at all, and it accepts an honest
  "outstanding" for the manual pass by design (`scripts/check-verification.mjs:310-328`). A
  criterion must claim what the thing verifying it checks. **BG-01M107ND** carries the same
  correction for the other 21, which are already Done and cannot have their text rewritten under a
  live `Verified:` stamp
- **Verify:** shell node scripts/check-verification.mjs --component Drawer
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC6: Scroll lock without layout shift

- **Given** a Drawer that is open
- **When** the page behind it would otherwise scroll
- **Then** it does not, and locking the scroll causes no layout shift from the scrollbar being removed
- **And** this is asserted here rather than left to Modal AC4: a Drawer locks scroll for the same
  reason a Modal does, and an epic acceptance criterion owned by one of the two components is the
  "solved once or nine times" failure appearing at epic level (found by the foundation's spec review)
- **And** the "no layout shift" half is asserted as a MECHANISM, not as an observation, and the
  criterion says so rather than leaving it to a comment in the test file. jsdom computes no layout,
  so nothing here can see a shift; what it CAN see is that the page is locked and that the width the
  scrollbar occupied is handed back as padding, read from the injected stylesheet - jsdom does not
  apply injected rules to computed style, so reading the element instead would pass on a lock that
  compensates by zero. The expected value is DERIVED from the stub rather than hardcoded
- **Verify:** vitest "Drawer locks scroll"
- **Verified:** yes (2026-08-27)
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
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC8: It slides from its own edge, and stops entirely under reduced motion

- **Given** an open Drawer
- **When** motion is permitted, and again when `prefers-reduced-motion: reduce` is set
- **Then** it animates in on the axis its placement names, and under reduced motion it does not
  animate at all
- **And** D0100 Class A: the slide is spatial decoration, not the information. The state change is
  already carried by the dimmed viewport, the focus move and the inert background, so the rule says
  REMOVE it rather than substitute something. Toast is the Class B contrast in the same epic
- **And** it enters from OUTSIDE the edge it names, measured on the animation's paused first frame
  against the viewport box. The animation NAME is asserted too, but the name is a proxy (D0065) and
  was proved to be one: swapping only the keyframe BODIES - `translateX(-100%)` and
  `translateX(100%)`, both names untouched - made the left drawer enter from the middle of the
  screen (paused `startX` -448 to +448 at a 1280 viewport) while `animationName` still read
  `clara-drawer-in-start`, and 32 browser tests, 1191 unit tests and 26 guards stayed green. That is
  the AC1 -> AC7 defect reproduced one layer down, inside the criterion written to fix it
- **And** AC7 cannot cover the entrance, deliberately: AC7 emulates `reducedMotion: 'reduce'` so the
  box it reads is the RESTING position, which means nothing there ever observes the panel while it
  is moving. Resting position and entrance direction are two claims and they get two tests
- **And** the animation is PAUSED at `currentTime = 0` rather than raced against - sampling a running
  animation is how a test becomes flaky for a reason that is not a defect - and a panel with NO
  animation fails rather than reading as a pass
- **And** jsdom returns no animation, so any verdict it reached about this would be a false green by
  construction rather than a flaky one
- **Verify:** shell pnpm test:e2e -g "a drawer (slides in from the edge it is anchored to|enters from outside the edge it is anchored to|removes its slide entirely under reduced motion)"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC9: `dismissible={false}` blocks the accidental routes and keeps the exit

- **Given** a Drawer declared `dismissible={false}`
- **When** I press Escape, or press and release the pointer outside the panel
- **Then** it stays open and `onClose` is not called
- **And** the close BUTTON still works and calls `onClose` exactly once. `dismissible={false}` blocks
  the two routes that happen by accident; it does not remove the exit, because a panel with no way
  out is a trap rather than a safeguard
- **And** the DEFAULT is asserted in the same suite, and that is the load-bearing half. Modal's suite
  records why: a bare `click` on the scrim does not dismiss a dismissible overlay either, so
  asserting "it did not close" on a gesture that never closes anything is a tautology that passes on
  an implementation where the prop does nothing at all
- **And** the criterion exists because `dismissible` is public API that had ZERO tests. Replacing
  `blockIfNotDismissible` with an empty function - so a drawer declared `dismissible={false}`
  dismisses on Escape and on an outside pointer - left 1191 tests and all 30 guards green
- **Verify:** vitest "Drawer dismissible"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC10: A described drawer with a footer

- **Given** a Drawer carrying a `description` and a `footer`
- **When** it renders
- **Then** the description reaches the dialog's ACCESSIBLE DESCRIPTION, the footer renders, and the
  panel passes axe in that shape
- **And** a drawer with no `description` carries no `aria-describedby` at all. Both halves: a
  component that always emitted the attribute would satisfy the first clause while pointing every
  undescribed panel at an element that does not exist, which announces nothing and is the failure the
  id wiring exists to avoid
- **And** the accessible description is read, not `textContent` and not the attribute's presence -
  D0065, observe the property rather than a proxy for it
- **And** this is the shape an ERP filter panel actually takes, and nothing rendered it. Deleting
  `aria-describedby` and the whole `Dialog.Description` branch left every test green, because no test
  ever passed `description`; the `footer` branch and the axe runs over a panel carrying either were
  equally unwitnessed
- **Verify:** vitest "Drawer description and footer"
- **Verified:** yes (2026-08-27)
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

- [x] Does AC5's definition-of-done sentence match what its verifier checks? **No - filed as BG-01M107ND.**
      The copied wording claims "a visual baseline ... and a recorded manual keyboard pass all exist".
      `check-verification.mjs` has no baseline rule at all, and it deliberately accepts an honest "outstanding" for the manual pass. The same sentence
      appears in 22 criteria across this repo, so it is a copied wording defect rather than this
      story's, and it is filed rather than edited under four Done stamps. AC5's wording here is
      corrected in place, because this story is not yet closed. Owner: Mira Calderon (qa)

## Resolved Questions

- [x] Should a drawer trap focus, as a modal dialog does? **Yes, and it already does.**
      AC2's parity requirement settles it: Drawer renders through `@radix-ui/react-dialog`, so it inherits the
      focus scope, the inert background and the escape handling. The question is recorded because
      "drawer" suggests a lighter surface than "dialog" and the temptation to make it non-modal is
      real; a non-modal drawer is a Popover, which this epic already ships. Owner: Idris Vale (ux)

## Test Plan

Every row below was RUN. `Mutant` is the production edit the criterion's own verifier must fail on,
and the verdict beside it is what happened when that edit was made against this tree. Rows marked
**(review)** are mutants an adversarial seat produced that the previous version of this table did not
survive; each is now killed by the criterion beside it.

| Criterion | Touches | Mutant - the production change this test must fail on | Title |
| --- | --- | --- | --- |
| AC1 | packages/react/src/components/Drawer/Drawer.tsx | Drop the placement class: `cx('clara-drawer', className)`. KILLED - 4 of 6 in `Drawer placements`. The row claims the CLASS and nothing more; AC7 owns the position. | Placements |
| AC2 | packages/react/src/lib/overlay-focus.ts | TWO mutants, both KILLED, and the criterion needs both. (a) Disable the named restore ALONE - `restoreNamed.current = () => { openerRef.current = null; wasOpen.current = false; return false }`, fallback intact - reddens 6 tests. **(review)** The earlier mutant disabled the named path and the fallback together, and the earlier harness put the opener FIRST in document order, so both paths landed on it: a seat measured this exact edit leaving every test in the file green and failing only in Modal's suite. A decoy now sits ahead of the opener, so the fallback lands on the decoy. (b) `useOverlayFocusRestore(open)` in `Drawer.tsx` - the component's own call site dropping `returnFocus` - reddens 1. **(review)** That survived at 1191 passed while the byte-identical Modal edit reddened, so the one file that can actually DRIFT was never probed by the criterion whose purpose is preventing drift. | Focus parity with Modal |
| AC3 | packages/react/src/styles.css | FOUR mutants, all KILLED. (a) `color: #1a1a1a` on `.clara-drawer` - a raw literal where a token belongs. (b) `overflow-y: visible` on `.clara-drawer__body`. (c) delete `max-block-size` from `.clara-drawer`. (d) delete `.clara-drawer__body > * { flex-shrink: 0 }`. **(review)** (b), (c) and (d) all SURVIVED until 2026-08-27 - `PASS [component-css]`, `PASS [overlay-contract]`, 1191 tests, every drawer browser test - because Modal's body was enrolled in the value contract and Drawer's was not, although Drawer AC6 makes the same claim. All three are named in this story's Edge Cases table as fixes for measured defects. No test imports a CSS file, so the verifier must be a guard that READS the stylesheet or the row is green by construction. | Token-only styling |
| AC4 | packages/react/src/theme/ClaraPortal.tsx | Strip `{...claraAttributes(settings)}` from the portal root. KILLED, 4 of 4. Mutating the PORTAL is what proves the assertion walks up from inside the panel rather than reading the render container, which carries the same attributes. | Both themes and densities |
| AC5 | packages/react/src/components/Drawer/verification.md | Rename `## Keyboard` to `## Keys`, and separately to `## Keyboard notes`. BOTH KILLED. **(review)** The suffix form survived until 2026-08-27: `sectionBody` found headings with `indexOf`, so any required section could be renamed away by appending a word. A first probe here also renamed it to `## Keyboard-removed-by-mutant` and reported a SURVIVOR - a probe that could not fail, naming a gap that was not the real one underneath it. The suffix form is now `prove-guards` mutation 147, so restoring `indexOf` fails the prover: measured by reverting the anchor and watching it report SURVIVED. | Definition of done |
| AC6 | packages/react/src/components/Drawer/Drawer.tsx | Set `modal={false}` on `Dialog.Root`. KILLED. The lock is Radix's; what Clara controls, and what this asserts, is that the drawer asks for it. | Scroll lock without layout shift |
| AC7 | packages/react/src/styles.css | Swap `inset-inline-start: 0` and `inset-inline-end: 0` between `.clara-drawer--left` and `.clara-drawer--right`, keyframe names untouched. KILLED by this criterion ALONE. Measured surviving everything else: 1191 unit tests, `check-component-css`, and every other drawer browser test. | The panel rests against the edge it names |
| AC8 | packages/react/src/styles.css | TWO mutants, both KILLED, one per half of the criterion. (a) Narrow the reduced-motion rule to `.clara-drawer--right { animation: none; }` - **(review)** survived while the test visited one story of three, so a left or bottom drawer kept sliding for a reduced-motion user with the gate green; it now iterates all three. (b) Swap the keyframe BODIES, `translateX(-100%)` and `translateX(100%)`, leaving both NAMES alone - **(review)** survived 32 browser tests, 1191 unit tests and 26 guards, with the left drawer entering from the middle of the screen while `animationName` still read `clara-drawer-in-start`. The name was a proxy for the direction: the AC1 -> AC7 defect one layer down. Killed by the paused-first-frame assertion. | It slides from its own edge, and stops entirely under reduced motion |
| AC9 | packages/react/src/components/Drawer/Drawer.tsx | `const blockIfNotDismissible = (_event: Event) => {}` - so `dismissible={false}` dismisses on Escape and on an outside pointer. KILLED. **(review)** Previously survived at 1191 tests and 30 guards: `dismissible` is public API and had no test at all. | `dismissible={false}` blocks the accidental routes and keeps the exit |
| AC10 | packages/react/src/components/Drawer/Drawer.tsx | Delete `aria-describedby={description ? descriptionId : undefined}`; separately delete the `footer` branch. BOTH KILLED. **(review)** Both survived, because no test ever passed `description` or `footer`. | A described drawer with a footer |

**Running these.** A mutation aimed at AC3, AC7 or AC8 must rebuild BOTH the library and Storybook
before the browser tests can see it - `pnpm build` alone is not enough, because `e2e/stacking.spec.ts`
serves a static Storybook build from disk. The first attempt at AC7's mutant reported the new
assertion GREEN for exactly that reason, which reads as "the assertion is insensitive" when the
assertion had never been shown the mutation. `pnpm test:e2e` does both builds; a bare
`playwright test` does neither.

**One mechanism has no row, and that is recorded rather than hidden.** Deleting
`onCloseAutoFocus={(event) => event.preventDefault()}` from `Drawer.tsx` leaves all 1200 tests and
every guard green, and the same is true of Modal's identical line. It is not a missing assertion but
a jsdom limit - the two restores only disagree observably on the UNMOUNT route, in a browser - and it
is filed as **BG-01M10BB8** rather than left as a row nobody can fill.

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

## Specification delta (2026-08-27, review round)

Two independent seats reviewed this story in their own worktrees and **both REJECTed**: engineering
(anton-reis) with five blocking findings, QA (mira-calderon) with three. Every one was measured. The
fixes below are each proved by re-running the seat's own mutant against the repaired tree.

**The headline finding is the same defect a third time.** The first pass found AC1 verified by a
class name, a proxy for a position, and added AC7 to assert the box. QA then swapped only the
keyframe BODIES - `translateX(-100%)` and `translateX(100%)`, both NAMES untouched - and the left
drawer entered from the middle of the screen while `animationName` still read
`clara-drawer-in-start`. 32 browser tests, 1191 unit tests and 26 guards stayed green, and AC7 could
not see it because AC7 emulates reduced motion precisely so that the box it reads is the resting
position. The name was a proxy for the direction, exactly as the class had been a proxy for the
position. AC8 now measures the animation's PAUSED FIRST FRAME against the viewport.

**AC2's identity assertion was itself a proxy.** The harness put the opener FIRST in document order,
and `restoreFallback` walks `document.querySelectorAll` in document order - so both the named restore
and the anonymous fallback landed on it, and `expect(activeElement).toBe(opener)` was satisfied by
either. Disabling `restoreNamed` alone left every test in the file green and moved the failure into
Modal's suite. A focusable decoy now sits ahead of the opener, and each test asserts the negative
beside the positive. Separately, the criterion mutated only the SHARED file, so Drawer's own call
site - the one thing that can actually drift - was never probed: `useOverlayFocusRestore(open)`
survived at 1191 passed while the byte-identical Modal edit reddened. `returnFocus` now has parity
coverage.

**Two public props had no test at all.** `dismissible` (AC9) and the `description`/`footer` pair
(AC10). Neutering `blockIfNotDismissible` - so a drawer declared `dismissible={false}` dismisses on
Escape and on an outside pointer - left 1191 tests and 30 guards green.

**Drawer was outside the scroll-container contract Modal has carried since its own AC5.**
`overflow-y: visible` on `.clara-drawer__body`, deleting `max-block-size` from `.clara-drawer`, and
deleting the `flex-shrink: 0` on the body's children all passed every gate - while this story's own
Edge Cases table names all three as fixes for measured defects. A contract covering one of two
components implementing one rule is how the rule returns in the component nobody enrolled.

**The verification record stated a CLOSED gap as open.** It said the slide is not verified in a
browser; the assertions had existed since `ae6fd29`. A record that is not re-read when the thing it
describes changes is a record that cannot be trusted in either direction, and the correction is
recorded in place rather than deleted.

**Two guard defects fixed rather than filed**, because both are small and both were load-bearing
here: `sectionBody` in `check-verification.mjs` found headings with `indexOf`, so `## Keyboard notes`
satisfied a required `## Keyboard` and any required section could be renamed away by appending a
word; and `check:keyboard` did not run `drawer.test.tsx` at all.

**AC5 and AC6 narrowed again.** AC5 still claimed "stories" and "an axe assertion over error states",
neither of which its verifier checks - and it was rewritten in the previous commit under the banner
that a criterion must claim what verifies it. AC6's "no layout shift" now says in the criterion, not
only in the record, that jsdom computes no layout and what is asserted is the mechanism.

**Every stamp was re-earned.** All eight `Verified:` lines were stripped and `verify_ac.py run`
re-ran all ten criteria against the current text, because a stamp dated before a criterion's rewrite
certifies words that did not exist - BG-01M107ND's own defect, which the previous commit committed
while filing it.

**Filed, not fixed:** BG-01M10BB8 (`onCloseAutoFocus` suppression is unwitnessed in Drawer AND
Modal; the two restores only disagree observably in a browser, so this needs an e2e test rather than
a better jsdom one) and BG-01M10BWX (`check:keyboard` runs a hand-typed file list, so 33 of the 35
components with a keyboard table have no per-component keyboard gate).

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-27 | sdlc-studio | Promoted to full tier; AC7 (rendered placement) and AC8 (motion) added; AC5 narrowed to what its verifier checks; Test Plan filled from eight measured mutants |
| 2026-08-27 | sdlc-studio | Review round: both seats REJECT, 8 blocking findings fixed and each proved by re-running the seat's own mutant; AC9 and AC10 added; two guard defects closed; all stamps re-earned |
