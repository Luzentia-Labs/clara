# US-01M0GM31: Tooltip

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** e2e/stacking.spec.ts, packages/react/src/components/Tooltip/**, packages/react/src/components/Tooltip/verification.md, scripts/check-component-css.mjs
> **Points:** 5

## User Story

**As a** Grace Adeyemi
**I want** a tooltip reachable by keyboard as well as pointer
**So that** the explanation is not invisible to the people most likely to need it

## Acceptance Criteria

### AC1: Keyboard reachable

- **Given** a Tooltip trigger
- **When** I focus it with the keyboard
- **Then** the tooltip appears on focus as well as hover
- **Verify:** vitest "Tooltip appears on keyboard focus"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC2: Escape dismissible and hover-safe

- **Given** an open Tooltip
- **When** I press Escape, or move the pointer toward the tooltip
- **Then** it dismisses on Escape and remains visible while the pointer travels to it
- **Verify:** vitest "Tooltip escape and hover bridge"
- **Verified:** yes (2026-08-26)
- **And** the HOVERABLE half of WCAG 1.4.13 is asserted in `e2e/stacking.spec.ts`, not here. Radix builds the bridge from a grace-area polygon over real bounding rectangles and a live pointer position; jsdom has neither, so any verdict it reached would be a false green by construction. Proved by mutation: setting `disableHoverableContent` turns the e2e assertion red and everything in jsdom stays green
- **Verification target:** functional

### AC3: Never the sole source

- **Given** any Tooltip
- **When** it carries content
- **Then** the same information is available elsewhere; a tooltip is never the only route to essential information
- **Verify:** manual audit tooltip content for sole-source information
- **Verification target:** conversational

### AC4: Token-only styling

- **Given** the Tooltip stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC5: Both themes and densities

- **Given** a Tooltip
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "Tooltip theme and density matrix"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC6: Definition of done

- **Given** the Tooltip story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** shell node scripts/check-verification.mjs --component Tooltip
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

### AC7: Above a toast, because it describes what is on top

- **Given** a Toast carrying an action
- **When** a Tooltip on that action opens
- **Then** the tooltip paints above the toast
- **Verify:** shell pnpm test:e2e -g "a tooltip on a toast action paints above it"
- **Verification target:** functional

> D0102. The two tokens share one layer and OPEN ORDER decides, so this criterion and Toast's AC7
> are the two directions of one mechanism - neither is meaningful without the other. Assert with
> `document.elementFromPoint` inside the overlap, not by comparing computed `z-index` values: D0065
> records what asserting a proxy for the property cost last time, and here the two elements have
> the SAME z-index by design, so a comparison would prove nothing.
>
> **Inherited constraints.** The Tooltip stylesheet takes `z-index` from
> `var(--clara-layer-tooltip)`, and the component sets no `z-index` in JavaScript - a computed
> number in an inline style is the one shape `check-component-css.mjs` cannot see.

## Scope

### In Scope

- Tooltip

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**TDD.** This component has a documented keyboard interaction table, so the table is the specification and its tests are written first (D0024).

**Points:** 5 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold, a documented keyboard interaction table, and a recorded manual keyboard pass.

## Test Plan

| Criterion | Touches | Mutant - the production change this test must fail on | Title |
| --- | --- | --- | --- |
| AC1 | packages/react/src/components/Tooltip/Tooltip.tsx | Stop the content reaching the panel. Measured: 13 of 15 tests in the suite fail. | Keyboard reachable |
| AC2 | packages/react/src/components/Tooltip/Tooltip.tsx | Pass `disableHoverableContent` to the provider. Measured: `e2e/stacking.spec.ts` goes red at a named step of the pointer walk and the jsdom suite stays green, which is why the criterion is split across the two. | Escape dismissible and hover-safe |
| AC3 | apps/docs/src/content/components/tooltip.md | Delete the "never the only route" section, or widen `content` from `string` to `ReactNode` so a control can be hidden inside a tooltip that nothing can focus. | Never the sole source |
| AC4 | packages/react/src/styles.css | Add a raw literal or a tier 1 token reference to `.clara-tooltip`. | Token-only styling |
| AC5 | packages/react/src/components/Tooltip/Tooltip.tsx | Rename the theme or density attribute. | Both themes and densities |
| AC6 | packages/react/src/components/Tooltip/verification.md | Delete the Tooltip verification record, its docs page, or its keyboard table. | Definition of done |
| AC7 | packages/react/src/styles.css | Give `.clara-tooltip` a layer other than `--clara-layer-tooltip`, breaking the shared-layer tie that open order resolves. **Not yet assertable - see below.** | Above a toast, because it describes what is on top |

## Spec delta

Derived before implementation, per the engagement floor.

**AC7 cannot be satisfied by this story alone, and is left open deliberately.** Tooltip's AC7 and
Toast's AC7 are the two directions of ONE mechanism: the two tokens resolve to the same layer
(D0102), so which paints on top is decided by open order, and a constant cannot satisfy both
directions. Asserting either direction needs both components on screen at once. Toast is not built,
so this criterion stays unverified until it is, and both directions are then asserted together in
`e2e/stacking.spec.ts`. The alternative - stamping AC7 verified against a Tooltip with nothing under
it - is the "claim asserting proof where no mutation demonstrates it" class that cost US-01M0GM61
ten review rounds.

**Interactions resolved during implementation:**

1. **`@radix-ui/react-tooltip` is a new runtime dependency.** The per-dependency size budget
   introduced with Popover requires an authored ceiling, and FAILS rather than defaulting - so
   adopting it forced a measurement. Measured 19.26 kB, budget 22 kB. It is 4.8 kB UNDER Popover
   despite carrying the same `@floating-ui` chain, because a tooltip has no dismissable layer and no
   focus scope.
2. **Radix throws without a provider ancestor** (measured: "Tooltip must be used within
   TooltipProvider"). Requiring `ClaraProvider` was rejected twice - the message names a Radix type
   in a consumer's console, which Section 4 rule 7 forbids, and it would charge ~19 kB of tooltip
   machinery to every consumer of the library's root. Each Tooltip opens its own provider. The cost
   is recorded rather than hidden: delay grouping is per-provider, so a toolbar re-incurs the 700 ms
   open delay on every button.
3. **`content` is typed `string`, not `ReactNode`.** A tooltip's content is not in the tab order, so
   anything focusable inside one is a control that paints and cannot be operated. The type makes
   that unrepresentable rather than leaving it to a documentation warning.
4. **No new tier 2 tokens.** The conventional inverted tooltip would need `color.bg.inverse` and
   `color.fg.inverse` in the PUBLIC layer, and neither exists. Surface + border, matching Popover.
   Adding a public pair to style one component is the wrong order of decision under a publishing
   model where tier 2 is permanent.
5. **`e2e/` was not staged by `prove-guards-fail.mjs`.** Tooltip's verification record is the first
   to cite an e2e spec, which made every `check-verification` entry fail on an UNMUTATED stage. The
   file already carried a comment describing this exact failure for `sdlc-studio/reviews` and
   `scripts`; `e2e` joins them.
6. **Tier 3 tokens reach the public JS surface.** Adding Tooltip added eight more `@public`
   constants to `clara-tokens`, which contradicts PRD F01 and the token lock (65 entries, zero tier
   3). Pre-existing and filed as BG-01M0XZMJ rather than fixed here - widening a known-inconsistent
   public surface silently is how a one-way door gets walked through.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
