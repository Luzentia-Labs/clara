# BG-01M103BV: Tab does not close a DropdownMenu, against the WAI-ARIA APG menu-button pattern

> **Status:** inbox
> **Created:** 2026-08-27
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** packages/react/src/components/DropdownMenu/DropdownMenu.tsx, apps/docs/src/content/components/dropdown-menu.md
> **Severity:** Medium
> **Points:** 3

## Summary

Tab while a DropdownMenu is open neither dismisses it nor moves focus - the menu stays open and focus rests on the menu content. Measured across rounds 2, 4 and 5.

The WAI-ARIA APG menu-button pattern specifies that Tab closes the menu and moves focus to the next element in the page tab sequence. AC1 claims the menu pattern, so this is a deviation from a spec the criterion names, even though it falls outside AC1's enumerated list (arrows, typeahead, submenus, disabled-skipping).

It is Radix's behaviour and is not configurable from the Content surface, so changing it means Clara taking over focus handling - which is the machinery ADR-004 adopted Radix specifically to avoid owning.

This is filed as the destination for the question rather than as a defect ruling: the operator's call is whether APG conformance here is worth owning focus for, or whether the deviation is accepted and documented in the keyboard table. Escape-inside-a-submenu is an already-recorded deviation of the same family.

## Steps to Reproduce

1. `pnpm build && pnpm storybook`, open **DropdownMenu / Default**.
2. Open the menu with the keyboard and press **Tab**.
3. **Result:** the menu stays open and focus stays on the menu content. Neither half of the
   APG behaviour happens - no dismissal, no move to the next element in the page tab sequence.

Measured in rounds 2, 4 and 5 against the same build.

**Where the deviation is from.** The WAI-ARIA APG menu-button pattern specifies Tab closes the
menu and moves focus onward. `packages/react/src/components/DropdownMenu/DropdownMenu.tsx` AC1
claims the menu pattern, so a criterion in this repo names the spec being deviated from - even
though the deviation falls outside AC1's own enumerated list (arrows, typeahead, submenus,
disabled-skipping).

It is Radix's behaviour and is not configurable from the Content surface: no prop on
`DropdownMenu.Content` changes it.

## Proposed Fix

**No code change until the operator rules**, because the two outcomes have very different costs
and only one of them is a bug fix.

**If the ruling is accept and document** (the cheaper option): add the row to the DropdownMenu
keyboard table in `apps/docs/src/content/components/dropdown-menu.md` and to the component's
`verification.md`, alongside the already-recorded Escape-inside-a-submenu deviation, which is the
same family. Narrow AC1's wording so it claims the behaviours it enumerates rather than the whole
pattern - the criterion overclaiming is the part that is actually wrong today. No runtime change.

**If the ruling is conform:** Clara has to intercept `keydown` on the Content and, on Tab, close
the menu and move focus to the next tabbable element after the trigger. That means Clara owning
focus order - the machinery ADR-004 adopted Radix specifically to avoid owning - and it needs its
own story with an e2e assertion, since jsdom does not model the page tab sequence.

**Recommendation: accept and document, and fix AC1's overclaim regardless of the ruling.** The
overclaim is a defect either way: a criterion that names a spec it does not fully implement will
mislead the next reader whichever direction the behaviour goes.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-27 | sdlc-studio | Created via `new` (deterministic) |
