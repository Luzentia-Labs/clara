# US-01M0GM31: Tooltip

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** e2e/stacking.spec.ts, packages/react/src/components/Tooltip/**, packages/react/src/components/Tooltip/verification.md, scripts/check-component-css.mjs
> **Points:** 5

## User Story

**As a** Grace Adeyemi
**I want** a tooltip reachable by keyboard as well as pointer
**So that** the explanation is not invisible to the people most likely to need it

## Context

### Persona Reference

**Grace Adeyemi** - works the keyboard, and is exactly the person a hover-only explanation is
invisible to.
[Full persona details](../personas.md#grace-adeyemi)

### Background

A dense ERP toolbar is icons and abbreviations. The explanation has to live somewhere, and a tooltip
is the smallest surface that can hold it.

The reason this story exists as its own unit is that the default implementation of a tooltip is
wrong for the people who need it most: hover-only, so invisible to anyone not using a mouse. Opening
on FOCUS as well is the whole point, and WCAG 1.4.13 is the rest of it - dismissable, hoverable,
persistent.

The limit worth stating up front: on touch there is no gesture that opens it. Assistive technology
on the same device DOES reach it, because rotor and swipe navigation move DOM focus. That asymmetry
is why AC3 forbids a tooltip being the sole source of anything.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| Epic | Portal + scope | Renders through `ClaraPortal` with a non-constant `open` - a literal froze the stacking at mount order and shipped | AC6 via `check:overlay-contract` |
| PRD | Bundle | 19.26 kB against an authored 22 kB ceiling - 4.8 kB under Popover, because a tooltip has no dismissable layer and no focus scope | AC6 via `pnpm size` |
| PRD | Public surface | No Radix vocabulary reaches Clara's API; the provider is internal, so a consumer never meets `TooltipProvider` | AC6 via `check:api` |

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
- **And** the verifier names the direction that DISTINGUISHES open order from mount order. The
  criterion first pointed at "a tooltip on a toast action paints above it", and a review measured
  that test GREEN under the literal `open` this criterion exists to refuse: both of the original
  directions mount the tooltip's host first anyway, so they agree with mount order. A verifier
  that cannot observe its own mechanism is the defect class itself
- **And** the verifier selects BOTH: the criterion's own scenario (a tooltip on a toast ACTION,
  which is what the Given describes) and the direction that distinguishes open order from mount
  order. Pointing at only the distinguisher left the Given exercised by nothing the criterion
  runs - the story it drives has no `action` on its toast at all
- **Verify:** shell pnpm test:e2e -g "a tooltip (on a toast action|opened over a live toast) paints above it"
- **Verified:** yes (2026-08-26)
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

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| Focused by keyboard | Opens IMMEDIATELY - no delay applies to focus, only to hover |
| Focused programmatically | Opens. This is the route VoiceOver's rotor and TalkBack's swipe take, so the mobile assistive-technology path reaches the content |
| Tapped or long-pressed on touch | Does NOT open. No gesture route exists - the reason AC3 forbids sole-source content |
| The pointer travels from trigger to tooltip | It stays open. WCAG 1.4.13 "hoverable", implemented as a grace-area polygon, asserted in a browser because jsdom has no pointer |
| Escape | Dismisses without moving the pointer. WCAG 1.4.13 "dismissable" |
| A NON-FOCUSABLE trigger | Warns in development, naming the element; the tooltip is genuinely unreachable, which the warning says |
| A natively disabled trigger | Warns with advice that works - `aria-disabled` plus `readOnly` (D0058) keeps the tab stop - rather than "use a button" to someone already using one |
| A trigger made focusable in an EFFECT | Does NOT warn. The check is deferred a tick for exactly this |
| Opened over a live toast | Paints above it. Both share one layer and open order decides (D0102) |
| A page with a small `body` font | Renders at Clara's 14px floor, not the page's - it declares its own size because a portalled surface inherits from nowhere |


## Test Scenarios

- [x] Opens on keyboard focus, and closes when focus leaves
- [x] Opens on PROGRAMMATIC focus - the mobile assistive-technology route
- [x] `aria-describedby` resolves to an element whose text IS the content
- [x] Escape dismisses, and the content is genuinely absent beforehand
- [x] A non-focusable trigger warns; a button and a `tabIndex` span stay silent
- [x] A trigger focusable only from an effect stays silent - the deferral, pinned
- [x] A disabled control gets its own advice; two broken tooltips produce two named warnings
- [x] The positioning props reach the content - placement, collision avoidance, padding, offset
- [x] Works with no `ClaraProvider` above it, rather than throwing a Radix error
- [x] axe in all four theme x density combinations
- [x] In a browser: the hover bridge holds at every step of the pointer's journey, and the tooltip
      closes when the pointer leaves without reaching it
- [x] In a browser: renders at Clara's font size against a hostile 13px page
- [x] In a browser: all three directions of the shared-layer mechanism against Toast
- [x] The dev-only warning is eliminated by a production minify
- [ ] The 700ms open delay is unpinned; the keyboard path is unaffected (recorded gap)
- [ ] Screen-reader announcement; axe reads the tree, not what NVDA says (recorded gap)


## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0GM61](US-01M0GM61-portal-layer-scale-and-scoping-infrastructure.md) | hard | `ClaraPortal` and the layer scale | Done |
| [US-01M0GMK1](US-01M0GMK1-toast.md) | hard | AC7 needs a Toast to sit under; the two are one mechanism | Done |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| `@radix-ui/react-tooltip` | runtime | Installed, 19.26 kB against an authored 22 kB ceiling |

## Estimation

**Points:** 5
**Complexity:** Medium to build, HIGH to get honest. Five review rounds each found their blocking
defect in this component's docblock - a literal `open`, a criterion pointing at the wrong test, a
false deferral rationale, an unpinned deferral, and a false touch measurement. The component was
right earlier than its description of itself was, and the durable fix was to make the claims
executable rather than to rewrite the prose a sixth time.

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

**Affects production runtime:** Yes - a published component, a new runtime dependency, and a development-only warning that must not ship (gated, and proved eliminable by `check:dev-warnings`).

| Component | Reversal | Expected time |
| --- | --- | --- |
| `@luzentialabs/clara-react` | Unpublished (`NPM_TOKEN` unset), so reversal is `git revert`. Once published, immutable: a forward patch removing the export, which is a major. | Pre-publish: minutes. Post-publish: a major release |

If `affects_production_runtime: false`, replace with: *Not applicable – story does not change runtime behaviour.*

## Open Questions

- [ ] Should the 700ms open delay be reduced, or delay grouping added? Radix's 700 is calibrated
      against a 300ms skip window that the per-Tooltip provider shape deletes, so a toolbar waits it
      out on every button. Ruled MINOR three rounds running because the keyboard path is unaffected -
      Owner: Idris (ux)

## Resolved Questions

- **Should `content` be `ReactNode`?** NO - `string`. Tooltip content is not in the tab order, so a
  focusable element inside one is a control that paints and cannot be operated. The type makes that
  unrepresentable. It does NOT settle AC3, and an earlier comment claiming it did was corrected.
- **Should a non-focusable trigger be a type error?** It cannot be - whether a node renders something
  focusable is not knowable until runtime. It warns in development instead. Two rounds deferred that
  warning, the second on a premise that was false: the `console.warn` convention already existed.
- **Is the tooltip reachable on mobile?** Not by gesture; YES by assistive technology, because rotor
  and swipe navigation move DOM focus. Round 5 corrected a claim that said otherwise, and the
  behaviour is now pinned by a test so it cannot drift again.

## Test Plan

| Criterion | Touches | Mutant - the production change this test must fail on | Title |
| --- | --- | --- | --- |
| AC1 | packages/react/src/components/Tooltip/Tooltip.tsx | Stop the content reaching the panel. Measured: 13 tests fail (of 16 in the suite). | Keyboard reachable |
| AC2 | packages/react/src/components/Tooltip/Tooltip.tsx | Pass `disableHoverableContent` to the provider. Measured: `e2e/stacking.spec.ts` goes red at a named step of the pointer walk and the jsdom suite stays green, which is why the criterion is split across the two. | Escape dismissible and hover-safe |
| AC3 | apps/docs/src/content/components/tooltip.md | Delete the "never the only route" section, or widen `content` from `string` to `ReactNode` so a control can be hidden inside a tooltip that nothing can focus. | Never the sole source |
| AC4 | packages/react/src/styles.css | Add a raw literal or a tier 1 token reference to `.clara-tooltip`. | Token-only styling |
| AC5 | packages/react/src/components/Tooltip/Tooltip.tsx | Rename the theme or density attribute. | Both themes and densities |
| AC6 | packages/react/src/components/Tooltip/verification.md | Delete the Tooltip verification record, its docs page, or its keyboard table. | Definition of done |
| AC7 | packages/react/src/components/Tooltip/Tooltip.tsx | Pass a literal `open` to `ClaraPortal`, freezing the host at MOUNT order. Measured: reddens `a tooltip opened over a live toast paints above it` while the other two stay green, and `check-overlay-contract` fails. `Touches` names Tooltip.tsx, not styles.css - the defect lives in the component. | Above a toast, because it describes what is on top |

## Spec delta

Derived before implementation, per the engagement floor.

**AC7 needed Toast, which now exists - and needed a THIRD direction, which did not.** Tooltip's AC7
and Toast's AC7 are two directions of one mechanism: both tokens resolve to the same layer (D0102),
so open order decides. Both were asserted once Toast shipped.

Neither, it turned out, could tell open order from MOUNT order: in both, the tooltip's host is
created first anyway, so the two orderings agree. A defect that froze the stacking at mount order -
a literal `open` on `ClaraPortal` - passed them both, and shipped. `e2e/stacking.spec.ts` now carries
the direction that separates them (toast first, tooltip second), and AC7's `Verify:` points at THAT
one, because a criterion whose verifier is green under its own defect is asserting nothing.

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
