# BG-01M159MP: Radix leaks data-radix-popper-side and data-radix-popper-align onto Clara's public trigger, and the no-leak rule enumerates only three attributes

> **Status:** inbox
> **Severity:** Medium
> **Points:** 5
> **Affects:** AGENTS.md, packages/react/src/components/Popover/Popover.tsx, scripts/check-api.mjs, packages/react/src/components/Popover/__tests__/Popover.test.tsx
> **Created:** 2026-08-29
> **Created-by:** sdlc-studio file
> **Raised-by:** sdlc-studio; agent; v1
> **Raised-in-batch:** none open - raised outside a delivery batch

## Summary

Measured on the shipped open Select: the public trigger button carries `data-radix-popper-side` and `data-radix-popper-align`. They are stamped by `PopperAnchor` (react-popper dist/index.mjs:81-82), which `PopoverTrigger` also renders through (react-popover dist/index.mjs:99), so Popover, Tooltip and DropdownMenu already ship them too. This is not new to Select.

AGENTS.md states the rule as: `asChild`, `onOpenChange` and `data-state` are never Clara API. That is an ENUMERATION, and it silently exempts what it forgot - the same class as `check:keyboard`'s hand-typed file list (BG-01M10BWX) and `check:axe`'s file list. No guard covers `data-radix-*` at all, so the leak has never been visible to CI.

Why it matters beyond tidiness: these attributes are on the PUBLIC surface of a shipped component. A consumer can style or select on them today, and Clara is then unable to change its Radix version without breaking them - which is exactly the one-way door the no-leak rule exists to keep shut. Nothing is published yet, so this is free to fix now and permanent the moment it is not.

## Steps to Reproduce

1. Render an open Select (or Popover, Tooltip, DropdownMenu).
2. Inspect the trigger element in the DOM.
3. Observe `data-radix-popper-side` and `data-radix-popper-align`.
4. `grep -r 'data-radix' scripts/` returns no guard.

## Proposed Fix

Derive the rule rather than enumerate it. A guard should assert that no element Clara renders carries any `data-radix-*` attribute on a public surface, rather than checking three named attributes - `data-state` is already covered, and a derived check subsumes it. Where an attribute is genuinely needed for positioning, it belongs on an internal wrapper Clara owns rather than on the element the consumer receives. Update the AGENTS.md rule to state the derived form, so the doctrine and the guard say the same thing. Prove the guard both ways: it must go red when a `data-radix-*` attribute is reintroduced on a trigger, and green on a tree that has none.

## Acceptance Criteria

- [ ] **AC1** The behaviour described is corrected: Measured on the shipped open Select: the public trigger button carries `data-radix-popper-side` and `data-radix-popper-align`.
- [ ] **AC2** The proposed fix lands, pinned by a test: Derive the rule rather than enumerate it.

## Impact

Every overlay component Clara ships (Select, Popover, Tooltip, DropdownMenu, and Combobox through the shared engine) exposes vendor attributes as public surface, with no gate able to see it. After first publish, a consumer selecting on one of these makes Clara's Radix version a breaking-change axis.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-29 | sdlc-studio | Filed |
