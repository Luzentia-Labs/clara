# DropdownMenu - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from the
tests that actually run, so it can be checked rather than believed.

An ACTIONS menu implementing the WAI-ARIA menu pattern.

**Boundary:** client-only (see `../../../client-boundary.json`). `onOpen`, `onClose` and every
entry's `onSelect` are function props, which TRD Section 7 makes the boundary test.

## Keyboard

| Key | Result |
| --- | --- |
| Enter / Space on the trigger | Opens the menu and moves the highlight to the first entry. |
| ArrowDown | Moves to the next entry, SKIPPING disabled ones, and wraps to the first at the end. |
| ArrowUp | Moves to the previous entry, wrapping to the last. On a freshly opened menu it lands on the LAST entry. |
| ArrowRight | Opens a submenu and moves into it. |
| ArrowLeft | Closes the submenu and returns to its trigger entry. |
| A printable character | Typeahead: jumps to the next entry whose label starts with it. |
| Enter / Space on an entry | Runs that entry's `onSelect` and closes the menu. |
| Escape | Closes the menu. Focus returns to the trigger. |

## Recorded manual keyboard pass

**Not performed. This is outstanding, and it is the one artefact here that automation cannot
supply.**

What a real pass adds that the tests cannot: whether a submenu opens on the side with room rather
than off the viewport, whether the highlight is visible against the surface in both themes, and
whether typeahead feels responsive with a realistic thirty-entry menu rather than the five here.

## Accessibility

**It is named by its TRIGGER, and there is deliberately no `label` prop.** Radix wires
`aria-labelledby` on the menu to the trigger's id, and `aria-labelledby` beats `aria-label` in every
accessible-name computation - so a `label` prop would be a prop that silently does nothing.
Measured: with both present, the menu's name was the trigger's text and not the value passed in.
Naming a menu by the button that opened it is also the WAI-ARIA pattern's own answer, and it cannot
be forgotten, because the trigger already needs a name to be usable at all.

**Disabled entries are announced but never focused.** Arrowing past them means the keyboard never
strands a user on something that cannot be activated, and `onSelect` is unreachable on them.

## Actions, not navigation (D0020)

Every entry DOES something. `role="menu"` tells a screen-reader user to expect commands, so a set of
destinations announced as commands misdescribes what pressing Enter will do. Navigation menus are
v1.1, and the docs page says so.

## Why the menu is data rather than composed children

Clara exports no `DropdownMenuItem` or `DropdownMenuSeparator`. A composed API would be Radix
primitives wearing Clara names, and every illegal arrangement - an Item outside a Sub, a Separator
inside a Trigger - would surface as a runtime error naming a Radix component in a consumer's
console, which Section 4 rule 7 forbids. The entry union also makes "an action that also has a
submenu" and "a separator with a label" type errors rather than support questions.

## The submenu is NOT separately portalled

It does not need to be: `SubContent` renders into the portal its parent menu already established, so
it inherits the Clara scope without asking for one.

**This section previously gave two reasons and a review measured both FALSE.** Wrapping `SubContent`
in a Radix portal leaves all 22 tests green - roving focus and typeahead included - and Escape's
level does not depend on portalling at all: `@radix-ui/react-menu` calls the root context's close
unconditionally, so a submenu Escape closes the whole menu either way. The decision is unchanged;
the justification was not true, in the artefact whose entire value is that it can be checked.

## The z-index is earned, not silenced

`.clara-dropdown-menu` declares `position: relative` alongside its layer token, for the reason
`.clara-popover` records: the popper reads the computed z-index off the content and copies it onto
the wrapper it positions.

It takes `--clara-layer-overlay`, the SAME layer as Modal, Drawer and Popover, and not one of its
own. A menu must sit under a modal opened over it and over a modal opened from inside it - opposite
directions, so open order decides and a per-role constant cannot (D0088, D0102).

## What is verified automatically

- ArrowDown moves the highlight and SKIPS the disabled entry - `__tests__/dropdown-menu.test.tsx`
- ArrowUp on a freshly opened menu lands on the last entry - `__tests__/dropdown-menu.test.tsx`
- Arrowing off EITHER end wraps, in both directions - `__tests__/dropdown-menu.test.tsx`. Radix's
  `loop` defaults to FALSE, so this is asked for explicitly. It was documented in three places
  before it was implemented, and a review measured the menu simply stopping at the ends; worse, the
  suite was blind both ways, because the test named "wraps from the last entry back to the first"
  asserted where ArrowUp lands on a freshly OPENED menu, which is a different property
- Focus returns to the trigger after an OUTSIDE CLICK, the third dismissal route - it was the one
  route left unpinned, and a mutant suppressing restoration on exactly that route survived the whole
  repository green - `__tests__/dropdown-menu.test.tsx`
- Typeahead jumps to an entry by its label - `__tests__/dropdown-menu.test.tsx`
- ArrowRight opens a submenu and reveals its items - `__tests__/dropdown-menu.test.tsx`
- Selecting a NON-FIRST entry runs that entry's own handler and no other's. The non-first part is
  load-bearing: an earlier version clicked the first entry, and a mutation wiring every item to
  `items[0].onSelect` passed all thirteen tests - `__tests__/dropdown-menu.test.tsx`
- A disabled entry's `onSelect` never runs - `__tests__/dropdown-menu.test.tsx`
- The menu takes its accessible name from the trigger - `__tests__/dropdown-menu.test.tsx`
- A SUBMENU wraps too, not just the root menu. The fixture submenu carries three entries for this
  reason: with one entry no arrow key can reach an end, so the submenu's `loop` was unobservable by
  construction and deleting it left all sixteen tests green - `__tests__/dropdown-menu.test.tsx`
- ArrowRight moves FOCUS into the submenu, not merely revealing it. The earlier assertion observed
  presence, which is one word from the property (D0065) - `__tests__/dropdown-menu.test.tsx`
- A separator is exposed as `role="separator"` and is SKIPPED by arrow navigation. Replacing it
  with a plain `<span>` left all 25 tests green - a separator is the only thing telling a
  screen-reader user that two groups of actions are different - `__tests__/dropdown-menu.test.tsx`
- A SUBMENU entry runs its OWN handler and closes the whole menu. `onCsv` was declared, wired and
  asserted by nothing for three rounds: neutering every submenu `onSelect` left the entire
  repository green, so a menu that opened submenus and moved focus into them could run none of
  their actions - `__tests__/dropdown-menu.test.tsx`
- Changing `items` while open warns, and a stable menu does not -
  `__tests__/dropdown-menu.test.tsx`
- The positioning props reach Radix - the root menu's four and the SUBMENU's two - so `placement`
  is not an inert prop - `__tests__/positioning.test.tsx`
- Focus returns to the trigger BY IDENTITY on Escape, and after selecting an entry - the second
  route is the common one, and restoring only on Escape would strand the user after every action
  they actually take - `__tests__/dropdown-menu.test.tsx`
- It renders through `ClaraPortal` and takes its stacking from a layer token -
  `check:overlay-contract`
- Token-only styling, and a layer token that is not inert - `check:component-css`
- axe while open, in all four theme x density combinations - `check:axe`

## Stated gaps

- **Changing `items` while the menu is OPEN can run an action the user did not aim at.** Keyboard
  focus tracks a POSITION, so inserting an entry above the highlight leaves it on the same index -
  now a different entry - and Enter runs that one. Measured. It is not the index keys (keying by
  `${index}:${label}` changes nothing); it is the underlying menu's roving-focus collection, which
  Clara cannot take over without owning focus itself. Warned in development, documented on the docs
  page, and pinned by a test in both directions - disclosed rather than silently shipped.

- **Escape inside a submenu closes the WHOLE menu**, where the WAI-ARIA APG specifies it closes the
  menu containing focus. AC1 claims APG conformance, so this is a deviation and not a detail. It is
  Radix's behaviour and not configurable from here; recorded rather than claimed away.

- **Positioning is CONFIGURED and asserted; the RENDERED result is not.** A review stripped all five
  positioning props - `side`, `avoidCollisions`, `collisionPadding`, `sideOffset`, and the submenu's
  offsets - and measured the whole repository still green, so `placement` was an inert public prop
  and this bullet claimed a coverage that did not exist. `__tests__/positioning.test.tsx` now records
  the props reaching Radix - the root's four AND the submenu's two. An earlier version of this line
  claimed all five were covered while the submenu's arm was unreachable: its fixture had no submenu,
  so `SubContent` never rendered and `subContentProps` was pushed to by nothing and asserted by
  nothing. Stripping the submenu's offsets reddened zero tests. It now reddens one. What the browser then DOES with
  them - where a submenu opens, whether it flips - is still unasserted for this component. Same gap as Popover's and Tooltip's, and it belongs to
  the gate: BG-01M0XVXS.
- **Only ONE level of submenu is exercised.** `items` nests arbitrarily deep and the renderer is
  recursive, but no test opens a submenu of a submenu, so nothing here proves the third level
  behaves.
- **Typeahead is asserted with a single character.** Multi-character typeahead, its reset timeout,
  and collisions between entries sharing a first letter are unasserted.
- **Screen reader testing is not automated.** PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7, US-01M0WSME).
