# US-01M0GM61: Portal, layer scale, and scoping infrastructure

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GK4P
> **Serves:** Sofia Marchetti
> **Affects:** packages/react/src/theme/ClaraPortal.tsx, packages/react/src/theme/__tests__/theming.test.tsx, packages/react/etc/clara-react.api.md, packages/tokens/src/primitive/base.json, packages/tokens/src/semantic/geometry.json, packages/tokens/src/__tests__/layers.test.ts, packages/tokens/tokens.public.lock.json, apps/docs/src/content/foundations/tokens.md, scripts/check-component-css.mjs, scripts/prove-guards-fail.mjs
> **Points:** 5

## User Story

**As a** Sofia Marchetti
**I want** one portal mechanism that carries theme and density and a defined stacking order
**So that** the scoping problem is solved once in the architecture rather than nine times in props

## Context

### Persona Reference

**Anton Reis** - Engineering amigo; owns the architecture decisions the component authors inherit
[Seat detail](../personas/seats/anton-reis.md)

### Background

Nine overlays are about to be built, and two problems have to be solved once here or nine times
later. The first is scoping: an overlay opened from inside a dark, compact sidebar leaves that
subtree the moment it portals, so a CSS-inheritance model renders it with the page's theme. The
second is stacking: without an agreed order, each overlay picks a z-index and the answer to "does
the Select listbox clear the Modal it was opened from" becomes whichever number was typed last.

Most of the portal already existed from the foundation epic - this story finds it, proves what it
does, and adds the layer scale beside it.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| TRD ADR-006 | Architecture | Theme and density travel by React context, and the portal root re-applies them | AC1 asserts the portal root carries the resolved values, from a scope it has left in the DOM |
| TRD Section 4 rule 2 (D0018) | API | No overlay takes a `theme`, `density` or `portalContainer` prop | Solving scoping with props would mean three props on nine overlays, permanently |
| PRD F23 | SSR | A component must not read `document` during render | AC4 deletes `globalThis.document` to prove the render path never reaches for it |
| PRD F01 / D0007 | API stability | Tier 2 tokens are public API and permanent from first publish | The five layer names are added to `tokens.public.lock.json` deliberately |
| TRD Section 6 | Tokens | Tier 2 references tier 1; it never carries a raw value | The scale is tier 1 steps (`layer.0`-`layer.4`) with tier 2 role names over them |
| D0088 | Tokens | Putting LAYERS in tier 2 EXTENDS the tier rules rather than following them - PRD:245 places z-index layers at tier 1, and D0056 extended tier 2 to geometry without mentioning layers | Five permanent public names, recorded as a decision rather than asserted as an inheritance. An earlier version of this row cited TRD Section 6 as the authority, which constrains what tier 2 may reference, not that a layer family belongs there. It then cited D0087, which proposed EIGHT per-role names; D0088 supersedes it, because a per-role constant cannot be right in both nesting directions |

## Acceptance Criteria

### AC1: Portal re-applies scope

- **Given** a portal opened from inside a ClaraScope
- **When** it mounts
- **Then** the portal root carries the resolved data-clara-theme and data-clara-density
- **Verify:** vitest "portal inherits scoped theme"
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC2: Layer scale is tokenised

- **Given** the z-index scale
- **When** I inspect it
- **Then** every layer is a token and nested overlays stack in a documented, predictable order
- **Verify:** vitest "the overlay layer scale is"
  <!-- Widened from "...is tokenised" so it selects the DOCUMENTED describe too. AC2's
       Then-clause says the scale is documented, and the narrower pattern could not see
       that: retargeting layer.3 from 1400 to 1200 left ac=5 pass=5 fail=0 while
       tokens.md still published 1400. Found independently by both round-4 seats. -->
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC3: Nested overlays stack correctly

- **Given** the layer scale
- **When** two overlays are nested
- **Then** nesting resolves by OPEN ORDER, not by a per-role constant: every portalled surface
  shares one layer, `ClaraPortal` appends each host to the body, and the browser paints equal
  z-index in tree order - so whichever overlay was opened last is on top, which is correct whether
  a menu is opened inside a modal or a modal opens over a menu
- **And** the two relationships that do NOT depend on nesting keep their own layer: a tooltip is
  above every overlay because it describes whatever is on top, and a toast is above everything
  because it may be the only report that something failed
- **And** `open` is an explicit REQUIRED prop on `ClaraPortal`, not inferred from `children`: a
  child that renders `null` is indistinguishable from one that renders something, and rendering
  `null` while closed is what a Radix `Presence` wrapper, a `forceMount` exit animation and any
  ordinary extracted `<Overlay/>` all do. Two review seats defeated the inference independently
- **And** the composition itself - a real Select inside a real Modal - is NOT asserted here, because
  neither component exists yet. It arrives with Select in EP-01M0GK91, and the ordering this story
  fixes is what makes it work. Asserting a composition of two unbuilt components would be a test of
  nothing
- **Verify:** vitest "the overlay stacking order"
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC4: SSR-safe

- **Given** a server render
- **When** a portal component is included
- **Then** it renders nothing on the server and does not read document
- **Verify:** vitest "portal renders nothing on the server"
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC5: The scale is enforced, not advisory

- **Given** the component-CSS guard
- **When** a component hand-types a z-index in any of the shapes below
- **Then** the build fails, and the guard is proved able to fail on each of them rather than assumed to be
- **And** the shapes are: a bare integer in a stylesheet; the same in capitals; a large addend hidden
  in a `calc()` over a layer token; a legal single-digit nudge chained until it clears the layer
  above; an inline `style={{ zIndex }}` in JSX, as a literal, a shorthand over a variable or a
  computed key; an assignment through `element.style`, `style.setProperty`, `setAttribute('style')`
  or `cssText`; a layer token on a statically positioned element, where the browser ignores it; and
  a component REDEFINING a layer token, which overrides it for the component's whole subtree
- **And** a `var()` FALLBACK on a layer token - `var(--clara-layer-overlay, 0)` - is refused
  deliberately, not incidentally. It is legal CSS and reads as defensive, but the build emits every
  layer token, so the fallback is either dead or it substitutes a hand-typed stacking order on the
  one day the token is missing, which is the day the build should be red. The guard says so in its
  own diagnostic rather than reporting the generic "does not resolve"
- **And** the criterion claims coverage of these shapes and no more. It is a denylist of the escapes
  three review rounds actually found, which is not the same as proving the scale cannot be escaped
- **Verify:** shell node scripts/check-component-css.mjs && node scripts/prove-guards-fail.mjs
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Portal, layer scale, and scoping infrastructure

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 5 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| A portal opened inside a scope that changes only density | It keeps the inherited theme and takes the new density. Scoping is an override of the resolved settings, not a replacement of them. |
| A server render that includes a portal | It renders nothing, and reads no browser global. An overlay has nowhere to go before there is a document, so nothing is the correct output rather than a limitation. |
| A Select opened from inside a Modal | The listbox clears the modal surface, because it was opened LAST and its portal host is therefore the later sibling. No per-role token is involved. A naive "modal is highest" constant would have put the list behind the thing it was opened from. |
| A Modal opened while a menu is already open | The modal and its scrim cover the menu, because the modal was opened LAST. This is the direction a per-role constant gets wrong: the same two components in the other order need the opposite answer, and one number cannot give both. |
| A component that needs to sit above its own siblings | It can, without a token change: `calc(var(--clara-layer-overlay) + 1)` is available, and the guard admits a single-digit offset for exactly this. Anything larger is rejected, because a big addend is a hand-typed z-index wearing a token. |
| A portal that is mounted but closed (`{open && <Menu/>}`) | It creates no host at all, and creates one when it opens. The whole model rests on this: a host created once at mount pins sibling order to MOUNT order, so a Toast viewport mounted at app start would paint under an overlay opened long after it. |
| An overlay focusing its first control on open | It must do so from INSIDE the portal - an effect on the portalled content, or a callback ref. The host is created in an effect, so the content lands on `ClaraPortal`'s second commit and an effect in the component that OPENS the overlay runs too early and finds a null ref. Asserted in both directions, and the constraint thirteen overlays inherit. |
| A toast raised while a modal is open | It is visible. Toasts are last in the scale because a toast may be the only report that something failed. |


## Test Scenarios

- [x] A portal inside a dark compact scope renders dark and compact, having left the light subtree
- [x] A scope changing only density keeps the inherited theme
- [x] A server render emits nothing and does not touch `document` (proven by deleting the global)
- [x] The portal mounts into the document once there is one, outside the React root
- [x] Every layer the overlays will need is declared, and resolves through a tier 1 step
- [x] Every portalled surface shares one layer, and no per-role step exists to re-introduce the constant
- [x] Later-opened portals are later DOM siblings, which is what the painting rule reads
- [x] A mounted-but-closed portal creates no host, so mount order cannot decide the stacking
- [x] Opening the later-written portal FIRST still leaves the last-opened one on top
- [x] A hand-typed z-index fails the build - in a stylesheet, in capitals, inside a calc(), chained as
  legal nudges, inline in JSX as a literal, a shorthand or a computed key, and through `element.style`,
  `setProperty`, `setAttribute` and `cssText`
- [x] A component redefining a layer token fails the build, and so does a layer token on a statically
  positioned element
- [x] A `<Presence>`-style child that renders nothing while closed does NOT open the portal
- [x] The documented layer table matches the tokens it documents
- [x] The portalled content has committed by the time an effect INSIDE the portal runs, and has NOT
  by the time the OPENING component's effect runs - the constraint every overlay's focus code inherits
- [x] A closed overlay removes its host, so it leaves nothing behind to stack against
- [x] Tooltip is above every overlay, and toast above everything, regardless of open order
- [ ] A real Select inside a real Modal - **not asserted here**, because neither component exists. It arrives with Select in EP-01M0GK91; this story fixes the order that makes it work


## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| -- | -- | Nothing. This story IS the dependency the other thirteen in the epic have | -- |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| The theme context (ADR-006), delivered in EP-01M0GKNG | Internal | Available |
| Style Dictionary, for emitting the tier 1 and tier 2 layer tokens | Internal | Available |

## Estimation

**Points:** 5
**Complexity:** Medium - most of the portal already existed; the value here is proving it and fixing the order

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

| Component | Reversal | Expected time |
| --- | --- | --- |
| -- | -- | -- |

*Not applicable - this is a library with no deployed runtime. Note one thing that is NOT reversible:
the five tier 2 layer names are public API from the first publish, so renaming one later is a
breaking change. They were added to `tokens.public.lock.json` deliberately for that reason.*

## Open Questions

- None open.

### AC6: A portal resolves its tokens against the scope it was written in

- **Given** a `ClaraPortal` written inside a `<ClaraScope theme="dark" density="compact">` on a
  light, comfortable page
- **When** its content is rendered into `document.body`, outside the element carrying the scope
- **Then** the portalled surface COMPUTES its tier 2 and its tier 3 values against that scope in
  both dimensions - not merely carries the right attributes
- **Verify:** shell pnpm check:scoping
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

> **Why this is separate from AC1.** AC1 stops at "the portal root carries the resolved
> `data-clara-theme` and `data-clara-density`", and BG-01M0WQY1 is the proof that attributes are not
> the claim: every attribute was correct there while nothing rendered followed, because tier 3
> aliases resolved once at `:root` and inherited as literals. The capability this story headlines -
> "the scoping problem is solved once in the architecture" - was asserted by jsdom attribute
> equality and by nothing that resolves a `var()`. Twelve overlays inherit it (round 5, anton-reis).
>
> It runs in a browser against the Storybook bundle because a portal exists only after a client
> render, and jsdom resolves no custom properties at all.

### AC7: The second-commit timing contract is gated by name

- **Given** a component that opens an overlay
- **When** an effect in the OPENER runs on the same commit that opens it
- **Then** the portal's content is not yet in the DOM, and an effect INSIDE the portal is the only
  place that sees it (D0090)
- **Verify:** vitest "commits its content in time for an effect INSIDE the portal"
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

> This is the epic's headline criterion for twelve overlays, and it was gated only incidentally -
> the test sits inside the describe AC3's selector happens to match, so moving it to a describe of
> its own would silently orphan the one assertion that holds it (round 5, anton-reis).

## Test Plan

| Criterion | Touches | Mutant - the production change this test must fail on | Title |
| --- | --- | --- | --- |
| AC1 | packages/react/src/theme/ClaraPortal.tsx | Drop `claraAttributes(settings)` from the portal root, or read the settings from the DOM instead of context - either way the portalled content stops carrying the scope it was written in. | Portal re-applies scope |
| AC2 | packages/tokens/src/semantic/geometry.json, packages/tokens/src/primitive/base.json, apps/docs/src/content/foundations/tokens.md | Point a tier 2 layer name at a raw number instead of a tier 1 step, delete one of the five names, ADD a sixth (`layer.sheet`), collapse the gap above `overlay`, or override `layer` in a theme or density file. The added name matters as much as the deleted one: a denylist of seven role words let `layer.sheet` re-introduce the constant with all eight tests green.. Separately, edit ONLY the documented table (`tokens.md`, tooltip 1400 -> 1450) so the docs and the tokens disagree: the narrow selector `"...is tokenised"` stayed green on this, which is why the verifier was widened to `"the overlay layer scale is"` | Layer scale is tokenised |
| AC3 | packages/react/src/theme/ClaraPortal.tsx | Prepend the portal host instead of appending it (`document.body.prepend`), so a later-opened overlay is an EARLIER sibling and the painting rule inverts. Or create the host at MOUNT rather than at open (drop the `open` gate from the effect), which pins sibling order to mount order. Or go back to inferring open from `children`, which reads a `<Presence>` wrapper that renders nothing as OPEN. All three are proved to fail. | Nested overlays stack correctly |
| AC4 | packages/react/src/theme/ClaraPortal.tsx | Read `document` unguarded during render (`const host = document.body`). The SSR test deletes `globalThis.document`, so the render throws instead of returning nothing. Note a guarded read - `typeof document !== 'undefined' && ...` - does NOT kill it, and should not: that is the correct pattern, not the defect. | SSR-safe |
| AC5 | scripts/check-component-css.mjs | Neuter `zIndexProblems` to `return []`; delete the inline-style walk; compare `decl.prop` case-sensitively; drop the `unconditional()` call from the position rule; stop summing the calc offset; stop rejecting a redefined layer token - each leaves one of the escapes open again. `prove-guards-fail.mjs` carries **fourteen** entries over this rule. The count was written as ten and was wrong twice over: eleven existed, and three of the five inline shapes this criterion ENUMERATES - a computed key, `setAttribute('style')` and `cssText` - had no entry at all, so the clause claiming they are "proved able to fail" was assumed. Deleting those three branches left this criterion green with the escapes reopened (round 5, anton-reis). The three entries now exist and were observed failing. Neutering a fine-grained clause leaves exactly the entry that names it surviving; the two COARSE neuters in this row's own list do not - `zIndexProblems -> return []` leaves five survivors and deleting the inline walk leaves four, because those clauses are shared by several entries. | The scale is enforced, not advisory |
| AC6 | packages/tokens/style-dictionary.config.js, packages/react/src/theme/ClaraPortal.tsx | Remove the `[data-clara-theme], [data-clara-density]` block the token build appends, so tier 3 resolves once at `:root` again (this is BG-01M0WQY1 restored); separately, stop stamping `claraAttributes` on the portal root, so the portalled surface matches no scope selector at all. The first gives `tier 3 froze at the root instead of following the portal's scope`; the second reddens the attribute assertions in the same test. Neither is visible to jsdom, which resolves no custom properties. | A portal resolves its tokens against the scope it was written in |
| AC7 | packages/react/src/theme/ClaraPortal.tsx | Create the host at MOUNT rather than on open (a `[]`-dependency effect), so the content is present on the first commit and an effect in the OPENER finds it. That is the timing D0090 says overlays must not rely on, and it is the mutant AC3 already kills - the point of this row is that AC7 selects the timing test BY NAME, so moving it out of AC3's describe cannot silently orphan it. | The second-commit timing contract is gated by name |

## Revision History

| Date | Author | Change |
| --- | --- | --- |
