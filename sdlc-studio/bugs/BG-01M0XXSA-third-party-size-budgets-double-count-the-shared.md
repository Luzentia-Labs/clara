# BG-01M0XXSA: Third-party size budgets double-count the shared @floating-ui chain

> **Status:** inbox
> **Created:** 2026-08-26
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** scripts/sync-size-budgets.mjs, .size-limit.json
> **Severity:** Medium
> **Points:** 2

## Summary

Each `third-party runtime:` size budget measures its own client chunk in isolation, with every OTHER declared runtime dependency in its `ignore` list. Transitive dependencies are in nobody's ignore list, so a chain shared across several Radix packages is counted in full inside each entry that reaches it. `@radix-ui/react-popover` reports 24.09 kB, roughly 14 kB of which is `@radix-ui/react-popper` + `@floating-ui/react-dom` + `/dom` + `/core`. Tooltip, DropdownMenu and Select all carry that same chain, so each will report its own ~24 kB for weight a consumer pays ONCE.

Every individual number stays true - a consumer importing only Popover really does pay 24.09 kB - and no gate is currently wrong. What is false is the implication that the entries sum, which is exactly what a reader does with a list of budgets. `sync-size-budgets.mjs` already makes this argument for React and for declared Radix packages ('shared by every overlay that uses it - so a consumer using six of them pays it once'); the per-dependency split applied it to DECLARED deps and not to the transitive chain underneath them.

This does not bite until a second popper-based overlay ships, which is the next story. Filed now because the comment in sync-size-budgets.mjs points at it.

## Steps to Reproduce

{{steps}}

## Proposed Fix

{{fix}}

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-26 | sdlc-studio | Created via `new` (deterministic) |
