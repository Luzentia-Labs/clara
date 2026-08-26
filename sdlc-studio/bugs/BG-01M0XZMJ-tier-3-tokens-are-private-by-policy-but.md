# BG-01M0XZMJ: Tier 3 tokens are private by policy but exported as public API by clara-tokens

> **Status:** inbox
> **Created:** 2026-08-26
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** packages/tokens/etc/clara-tokens.api.md, packages/tokens/src/index.ts, packages/tokens/tokens.public.lock.json
> **Severity:** Medium
> **Points:** 3

## Summary

PRD F01 and AGENTS.md both say tier 2 tokens are public API and tiers 1 and 3 are not. `packages/tokens/tokens.public.lock.json` agrees: 65 entries, ZERO of them tier 3. But the JS export surface of `@luzentialabs/clara-tokens` disagrees - `packages/tokens/etc/clara-tokens.api.md` carries 31+ tier-3 component constants marked `@public`, among them `PopoverBg`, `PopoverBorder`, `PopoverMaxInlineSize`, and the Modal, Drawer and ProgressBar families. Tooltip adds eight more (`TooltipBg`, `TooltipBorder`, `TooltipBorderWidth`, `TooltipFg`, `TooltipMaxInlineSize`, `TooltipPaddingBlock`, `TooltipPaddingInline`, `TooltipRadius`).

This is pre-existing and predates the Tooltip story; it is filed rather than fixed there because widening a known-inconsistent public surface silently is how a one-way door gets walked through.

Why it matters under this project's own rules:

1. **Publishing is a one-way door.** These constants are exported from a published package, so a consumer can `import { PopoverBg } from '@luzentialabs/clara-tokens'` today. Under the tier policy that value is private and may be re-tuned at will - so the policy says it can change and the package's shipped surface says it cannot.

2. **The two guards give opposite answers.** A tier-3 rename passes `tokens.public.lock.json` (not in it) and FAILS `api-report` (a public signature moved). Whoever hits that has to choose which gate is lying, and the cheap way out is to regenerate the api report - which is exactly the motion that would break a real consumer if the tier policy were ever actually enforced.

3. **There is no guard for the rule itself.** Nothing checks that tier 3 stays out of the public JS surface; `grep -rn 'tier 3' scripts/check-token*.mjs` returns nothing. The rule exists in three prose documents and in no executable form, which is the condition every other defect in this repo has been found in.

Candidate fixes: (a) stop exporting tier 3 from the tokens entry, which is the change that makes the shipped surface match the stated policy - and is itself a breaking change to anyone already importing one, so it needs a major; (b) keep exporting them but mark them `@internal` so api-extractor stops reporting them as public, which fixes the guard contradiction without changing runtime behaviour; (c) decide tier 3 IS public and correct PRD F01, the lock, and AGENTS.md to say so.

(b) is the smallest honest step and does not close off (a) or (c). Whichever is chosen, the outcome needs a guard, or the rule stays prose.

## Steps to Reproduce

{{steps}}

## Proposed Fix

{{fix}}

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-26 | sdlc-studio | Created via `new` (deterministic) |
