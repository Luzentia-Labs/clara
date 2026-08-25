# US-01M0GM48: Modal

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Modal/**, packages/react/src/components/Modal/verification.md, packages/react/src/index.ts, packages/react/package.json, packages/react/vite.config.ts, packages/react/client-boundary.json, packages/react/src/styles.css, packages/tokens/src/primitive/base.json, packages/tokens/src/semantic/color.json, packages/tokens/src/themes/dark.json, packages/tokens/tokens.public.lock.json, apps/docs/src/content/foundations/tokens.md, design/foundations.md, .size-limit.json, scripts/check-component-css.mjs
> **Points:** 8

## User Story

**As a** Grace Adeyemi
**I want** a dialog that traps focus and returns me exactly where I was
**So that** keyboard navigation never strands me behind a closed dialog

## Acceptance Criteria

### AC1: Named focus targets

- **Given** a Modal
- **When** it opens
- **Then** focus moves to a NAMED element - the one the author marked as the initial target, or the
  Modal's own close button when none is marked - never to the document body and never to the panel
  itself. Asserted by element identity, not by "something is focused"
- **And** the focus is applied from INSIDE the portalled content. `ClaraPortal` creates its host in
  an effect, so the content lands on its second commit and an effect in Modal's own body would find
  a null ref (D0090). This criterion fails if the implementation moves it outward
- **Verify:** vitest "Modal initial focus target"
- **Verified:** yes (2026-08-24)
- **Verification target:** functional

### AC2: Restoration per route

- **Given** an open Modal
- **When** it closes by Escape, outside click, close button, or successful commit
- **Then** focus returns to the named restoration target on every route, asserted by element identity
- **And** all four routes are asserted separately. A single "it restores focus" test passes on an
  implementation that handles one route and drops the other three, which is the defect this
  criterion exists to prevent
- **Verify:** vitest "Modal focus restoration per dismissal route"
- **Verified:** yes (2026-08-24)
- **Verification target:** functional

### AC3: Background is unreachable

- **Given** an open Modal
- **When** I tab repeatedly
- **Then** focus never reaches background content, which is hidden from assistive technology and
  guarded by the focus scope - NOT via the `inert` attribute, which Clara does not use here
- **Verify:** vitest "Modal makes the background unreachable"
- **Verified:** yes (2026-08-24)
- **Verification target:** functional

### AC4: No scrollbar shift

- **Given** a Modal
- **When** it opens on a scrollable page
- **Then** scroll lock causes no layout shift
- **Verify:** vitest "Modal scroll lock causes no shift"
- **Verified:** yes (2026-08-24)
- **Verification target:** functional

### AC5: Content scrolls internally

- **Given** a Modal with long content
- **When** it renders
- **Then** the body scrolls while header and footer stay fixed
- **And** the verifier runs the CSS guard as well as the test, because jsdom computes no layout:
  flipping `.clara-modal__body` to `overflow-y: visible` left every Modal test green. The
  declaration is the only observable, so SHAPE_CONTRACT is what actually proves this criterion
- **Verify:** shell npx vitest run -t "Modal body scrolls internally" && node scripts/check-component-css.mjs --component Modal
- **Verified:** yes (2026-08-24)
- **Verification target:** functional

### AC6: Token-only styling

- **Given** the Modal stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-24)
- **Verification target:** functional

### AC7: Both themes and densities

- **Given** a Modal
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **And** the verifier runs the CSS guard as well as the test. The matrix test reads
  `data-clara-theme` and `data-clara-density` off the portal wrapper, which is true of ANY component
  inside a `ClaraPortal` - it never touches the panel. What actually pins the panel to a
  theme-resolving background is `VALUE_CONTRACT`, and a vitest-only verifier does not run it
- **Verify:** shell npx vitest run -t "Modal theme and density matrix" && node scripts/check-component-css.mjs --component Modal
- **Verified:** yes (2026-08-24)
- **Verification target:** functional

### AC9: Nesting resolves by open order, not by a constant

- **Given** a Modal open over a menu, or a menu opened from inside a Modal
- **When** both are on screen
- **Then** whichever was opened LAST paints on top, because scrim and panel share one portal host as
  siblings and every portalled surface shares `--clara-layer-overlay` (D0088)
- **And** no per-role z-index exists between the scrim and the panel: the panel follows the scrim in
  the host, and tree order is what separates them. The CSS guard runs in this verifier because the
  host ordering is a DOM fact a test can see, while "neither surface carries an offset" is a
  stylesheet fact it cannot
- **Verify:** shell npx vitest run -t "Modal stacks by open order" && node scripts/check-component-css.mjs --component Modal
- **Verified:** yes (2026-08-24)
- **Verification target:** functional

### AC10: The Radix boundary holds

- **Given** Clara's public API report
- **When** Modal is exported
- **Then** no Radix type, prop name, or `data-*` attribute appears in it - specifically not
  `asChild`, `onOpenChange` or `data-state` (ADR-004, D0003), and Modal is classified `client`
- **And** this is the most permanent thing in the story: a leaked prop name cannot be withdrawn
  after publish
- **Verify:** shell node scripts/api-report.mjs && node scripts/check-client-boundary.mjs
- **Verified:** yes (2026-08-24)
- **Verification target:** functional

### AC11: Radix stays external, so the budget stays honest

- **Given** the built package
- **When** the size budget runs
- **Then** `@radix-ui/react-dialog` is NOT inlined into any chunk, and Modal's own chunk is within
  the 5 kB per-component budget
- **And** the build's external list is derived from the manifest rather than hand-listed, so
  "declared dependencies and peers stay external" lives in one place instead of two. Measured:
  Radix Dialog is 15.19 kB gzipped, three times the whole per-component budget, so bundling it
  would not be a rounding error
- **Verify:** shell node scripts/check-bundled-peers.mjs && npx size-limit
- **Verified:** yes (2026-08-24)
- **Verification target:** functional

### AC8: Definition of done

- **Given** the Modal story
- **When** it is proposed for export
- **Then** tests, an axe assertion over BOTH the default and the error state, a docs page, a
  documented keyboard table, and a verification record whose stated gaps are real all exist
- **And** three things the TSD's definition of done also names are NOT claimed here, because they do
  not exist in this repo yet and a criterion that certifies absent artefacts is worse than one that
  omits them: **Storybook stories** (no `.storybook`, no `*.stories.*` anywhere), a **visual
  baseline** (gate 7 is unwired, US-01M0GMZW), and a **recorded manual keyboard pass** (outstanding,
  and the verification record says so). This criterion previously asserted all three and was stamped
  `Verified: yes` while none of them existed
- **Verify:** shell node scripts/check-verification.mjs --component Modal && npx vitest run -t "Modal accessible structure and axe"
- **Verified:** yes (2026-08-24)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Modal

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**TDD.** This component has a documented keyboard interaction table, so the table is the specification and its tests are written first (D0024).

**Points:** 8 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold, a documented keyboard interaction table, and a recorded manual keyboard pass.

## Keyboard interaction table

> D0024: this table is the SPECIFICATION, and its tests are written before the implementation. It
> follows the WAI-ARIA Authoring Practices dialog (modal) pattern, which is what Radix implements -
> the table states what Clara guarantees, so a Radix change that breaks one of these rows is caught
> here rather than by a consumer.

| Key | Result |
| --- | --- |
| Tab | Moves to the next focusable element INSIDE the panel. From the last, wraps to the first - focus never leaves an open modal. |
| Shift+Tab | The same in reverse. From the first, wraps to the last. |
| Escape | Closes the modal and returns focus to the element that opened it. Works from any focused element inside, including inside a text input. |
| Enter, in the footer's primary action | Commits. Focus returns to the opener, the same as every other route. |
| Tab, into background content | Impossible. The background is hidden from assistive technology and the focus scope pulls focus back, so nothing behind it is reachable - asserted by focusing a background element programmatically, not by reading an attribute. |
| Click on the scrim | Closes, and returns focus to the opener. The same route as Escape, and asserted separately because a shared code path is an assumption until it is tested. |
| Click inside the panel | Does not close. A drag that STARTS inside the panel and ends on the scrim does not close either - selecting text in a modal and releasing outside it is the ordinary way this misfires. |

## Test Plan

| Criterion | Touches | Mutant - the production change this test must fail on | Title |
| --- | --- | --- | --- |
| AC1 | packages/react/src/components/Modal/Modal.tsx | Focus the panel itself instead of a named element, or move the focus effect out of the portalled content into Modal's own body - the second is silent, because it fails only by finding a null ref (D0090). | Named focus targets |
| AC2 | packages/react/src/components/Modal/Modal.tsx | Restore focus on Escape only, leaving scrim-click, close-button and commit to the browser. Three of the four routes then land focus on `document.body`, which is the strand this story exists to prevent. | Restoration per route |
| AC3 | packages/react/src/components/Modal/Modal.tsx | Drop the background hiding (`modal={false}`). Radix still traps Tab, so a test that only presses Tab stays green - the mutant is caught by asserting the background is not reachable, not that Tab cycles. | Background is unreachable |
| AC4 | packages/react/src/components/Modal/Modal.tsx | Lock scroll with `overflow: hidden` and no scrollbar-width compensation, so the page jumps sideways by the scrollbar width the moment the modal opens. | No scrollbar shift |
| AC5 | packages/react/src/styles.css | Let the whole panel scroll instead of the body, so a long modal scrolls its header and footer off screen. | Content scrolls internally |
| AC6 | packages/react/src/styles.css, scripts/check-component-css.mjs | Hand-type a z-index, drop the companion `position` from the base class, or reference a tier 1 primitive - each is a separate entry in `prove-guards-fail.mjs`. | Token-only styling |
| AC7 | packages/react/src/styles.css | Give the panel one background that does not resolve per theme, so the dark modal renders on a light surface. | Both themes and densities |
| AC9 | packages/react/src/components/Modal/Modal.tsx, packages/react/src/styles.css | Put the panel in its own portal host, or give the scrim and panel different z-index values - either re-introduces a per-role constant and breaks nesting in one direction. | Nesting resolves by open order, not by a constant |
| AC10 | packages/react/src/components/Modal/Modal.tsx | Spread the Radix props through to Clara's surface, so `asChild` and `onOpenChange` become permanent public API. | The Radix boundary holds |
| AC11 | packages/react/vite.config.ts, scripts/sync-size-budgets.mjs | Remove `@radix-ui/*` from the build's external list, which inlines 15.19 kB gzipped into Modal's chunk against a 5 kB budget. | Radix stays external, so the budget stays honest |
| AC8 | packages/react/src/components/Modal/verification.md | Export Modal with no verification record or no docs page. NOTE: a keyboard table that CONTRADICTS the code is not caught - `check-verification.mjs` checks the table exists, not that it is true, and rewriting the Escape row to "Does nothing" leaves the gate green. That is the same class as CR-01M0SKZ6 and is recorded there rather than left implied here. | Definition of done |

## Revision History

| Date | Author | Change |
| --- | --- | --- |
