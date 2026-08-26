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

{{steps}}

## Proposed Fix

{{fix}}

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-27 | sdlc-studio | Created via `new` (deterministic) |
