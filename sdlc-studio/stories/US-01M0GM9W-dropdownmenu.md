# US-01M0GM9W: DropdownMenu

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** apps/docs/src/content/components/dropdown-menu.md, packages/react/src/components/DropdownMenu/**, packages/react/src/components/DropdownMenu/verification.md, scripts/check-component-css.mjs
> **Points:** 8

## User Story

**As a** Grace Adeyemi
**I want** an actions menu implementing the WAI-ARIA menu pattern
**So that** keyboard users can drive every action without a pointer

## Acceptance Criteria

### AC1: Menu pattern

- **Given** an open DropdownMenu
- **When** I use the keyboard
- **Then** arrow navigation, typeahead, submenus and disabled-item skipping all behave per the WAI-ARIA authoring practices
- **Verify:** vitest "DropdownMenu keyboard pattern"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC2: Focus restoration

- **Given** an open menu
- **When** it closes by any route
- **Then** focus returns to the trigger, asserted by element identity
- **Verify:** vitest "DropdownMenu focus restoration"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC3: Distinct from navigation

- **Given** the docs
- **When** a consumer chooses between menus
- **Then** DropdownMenu is documented as actions-only; navigation Menu is v1.1 (D0020)
- **And** the verifier checks the LOAD-BEARING strings, not the word "actions". A review
  rewrote the page to present DropdownMenu as a navigation menu - retitled the section,
  deleted the D0020 sentence - and the old `grep "actions"` still exited 0, because the word
  survived in one parenthetical. A criterion whose verifier survives its own Test Plan mutant
  is the defect class this epic exists to remove
- **And** the verifier is a `forbid` list, not a `grep` chain. Three rounds widened the grep - one
  token, then three, then a whole sentence - and each version killed the previous mutant and left
  the next: a page can keep every grepped sentence byte-identical and APPEND "this restriction is
  lifted; entries may be commands OR destinations", which is verbatim the wording this criterion
  forbids. Measured at exit 0 twice. Checking for present strings cannot catch an inversion, because
  inverting a page adds text rather than removing it
- **And** the mechanism already existed for exactly this class: `DOC_CLAIMS` in
  `check-verification.mjs` carries `require` AND `forbid` pairs, and `prove-guards` already proves an
  inverted SearchInput page dies. `dropdown-menu.md` simply was not enrolled
- **Verify:** shell node scripts/check-verification.mjs --component DropdownMenu --docs
- **Verification target:** functional

### AC4: Token-only styling

- **Given** the DropdownMenu stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC5: Both themes and densities

- **Given** a DropdownMenu
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "DropdownMenu theme and density matrix"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC6: Definition of done

- **Given** the DropdownMenu story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** shell node scripts/check-verification.mjs --component DropdownMenu
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- DropdownMenu

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**TDD.** This component has a documented keyboard interaction table, so the table is the specification and its tests are written first (D0024).

**Points:** 8 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold, a documented keyboard interaction table, and a recorded manual keyboard pass.

## Test Plan

| Criterion | Touches | Mutant - the production change this test must fail on | Title |
| --- | --- | --- | --- |
| AC1 | packages/react/src/components/DropdownMenu/DropdownMenu.tsx | Drop the `disabled` pass-through (measured: 3 tests fail), or render a submenu as a flat item so ArrowRight opens nothing (measured: 1 fails), or wire every item to `items[0].onSelect` (measured: 1 fails - see the spec delta, this one initially SURVIVED). | Menu pattern |
| AC2 | packages/react/src/components/DropdownMenu/DropdownMenu.tsx | Suppress Radix's focus restoration, or restore only on Escape and not after a selection. | Focus restoration |
| AC3 | apps/docs/src/content/components/dropdown-menu.md | Delete the actions-only section, or reword the page to present it as a navigation menu. | Distinct from navigation |
| AC4 | packages/react/src/styles.css | Add a raw literal or a tier 1 token reference to the `.clara-dropdown-menu` rules. | Token-only styling |
| AC5 | packages/react/src/components/DropdownMenu/DropdownMenu.tsx | Rename the theme or density attribute. | Both themes and densities |
| AC6 | packages/react/src/components/DropdownMenu/verification.md | Delete the DropdownMenu verification record, its docs page, or its keyboard table. | Definition of done |

## Spec delta

Derived before implementation, per the engagement floor.

**Interactions resolved during implementation:**

1. **The menu is DATA, not composed children.** Clara exports no `DropdownMenuItem` or
   `DropdownMenuSeparator`. A composed API is Radix primitives wearing Clara names, and every illegal
   arrangement - an Item outside a Sub, a Separator inside a Trigger - surfaces as a runtime error
   naming a Radix component in a consumer's console, which Section 4 rule 7 forbids. The entry union
   additionally makes "an action that also has a submenu" and "a separator with a label" type errors.
2. **There is deliberately no `label` prop, and removing it was a FIX, not a simplification.** It was
   written with one, matching Popover. Radix wires `aria-labelledby` on the menu to the trigger's id,
   and `aria-labelledby` beats `aria-label` in the accessible-name computation - so the prop silently
   did nothing. Measured: the menu's name was the trigger's text, not the value passed in, and seven
   tests querying `role="menu"` by the passed name could not find it. A prop that has no effect is
   worse than no prop. Naming a menu by its button is the WAI-ARIA pattern's own answer and cannot be
   forgotten, since the trigger needs a name to be usable at all.
3. **A submenu is NOT separately portalled.** It renders inside the parent menu's own portal subtree,
   because Radix's roving focus and typeahead walk the DOM from the root menu - a separately
   portalled submenu is invisible to both, and Escape then closes the wrong level.
4. **It takes `--clara-layer-overlay`, the same layer as Modal, Drawer and Popover.** Not a layer of
   its own: a menu must sit under a modal opened over it and over a modal opened from inside it, and
   those are opposite directions, so open order decides (D0088, D0102).
5. **`[data-highlighted]` is used as an internal styling hook.** A menu has one roving highlight
   driven by keyboard and pointer together: `:hover` alone paints two highlighted rows when the
   pointer rests on one while the keyboard is on another, and `:focus` alone paints none, because
   roving focus keeps DOM focus on the container. It appears in Clara's stylesheet and in no prop,
   type or documented attribute, which is where Section 4 rule 7 draws the line.
6. **`@radix-ui/react-dropdown-menu` measured 31.11 kB, budget 34 kB** - the largest of the five
   overlays, 7 kB over Popover. It is the popper and `@floating-ui` chain, plus a dismissable layer
   and focus scope, plus roving focus, typeahead and nested-submenu machinery. That is the WAI-ARIA
   menu pattern, not bloat.

**A test that passed vacuously, found by mutation and fixed.** "Runs the entry's own onSelect, and
not another entry's" clicked 'Post' - the FIRST entry. A mutation wiring every item to
`items[0].onSelect` passed all thirteen tests, because the single entry it checked is the one that
mutation happens to get right. It now selects a non-first entry, and the mutation dies. This is the
same shape as the defects that cost US-01M0GM61 ten rounds, caught here by probing rather than by a
reviewer.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
