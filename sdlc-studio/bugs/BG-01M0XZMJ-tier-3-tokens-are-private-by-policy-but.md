# BG-01M0XZMJ: Tier 3 tokens are private by policy but exported as public API by clara-tokens

> **Status:** Fixed
> **Triaged-by:** claude-implementer; agent; opus-5
> **Created:** 2026-08-26
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** packages/tokens/etc/clara-tokens.api.md, packages/tokens/src/generated/index.ts, packages/tokens/tokens.public.lock.json
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

1. `grep -c '@public' packages/tokens/etc/clara-tokens.api.md` and compare against the 65 entries
   in `packages/tokens/tokens.public.lock.json`, which holds ZERO tier-3 tokens.
2. Before the fix the api report carried 31+ tier-3 component constants marked `@public` -
   `PopoverBg`, `PopoverBorder`, `PopoverMaxInlineSize`, and the Modal, Drawer and ProgressBar
   families - and the Tooltip story added eight more (`TooltipBg`, `TooltipBorder`,
   `TooltipBorderWidth`, `TooltipFg`, `TooltipMaxInlineSize`, `TooltipPaddingBlock`,
   `TooltipPaddingInline`, `TooltipRadius`).
3. So `import { PopoverBg } from '@luzentialabs/clara-tokens'` resolved against a published
   package, while PRD F01 and AGENTS.md both say tier 3 is private and may be re-tuned at will.

**The two guards gave opposite answers.** Rename a tier-3 token: `tokens.public.lock.json` passes
(it is not in the lock) and `api-report` FAILS (a public signature moved). Whoever hit that had to
choose which gate was lying, and the cheap way out - regenerate the api report - is exactly the
motion that would break a real consumer if the tier policy were ever enforced.

**And there was no guard for the rule itself:** `grep -rn 'tier 3' scripts/check-token*.mjs`
returned nothing. The rule lived in three prose documents and in no executable form, which is the
condition every other defect in this repo has been found in.

## Proposed Fix

**Shipped: option (a), stop exporting tier 3 from the tokens entry - not (b), the `@internal`
marking.** `@internal` would have silenced api-extractor while leaving the values importable at
runtime, so the shipped surface and the stated policy would still have disagreed; it fixed the
guard contradiction by hiding one side of it.

What landed:

1. The tokens entry emits tier 2 only. `packages/tokens/etc/clara-tokens.api.md` now carries **65**
   `@public` symbols, matching the lock exactly, and `PopoverBg` / `TooltipBg` and the rest of the
   tier-3 families are gone. `LayerTooltip` remains, correctly - the layer scale is tier 2.
2. **The rule is executable, in both directions.** `scripts/check-token-output.mjs` reads
   `packages/tokens/build/tier-manifest.json` (`:97-103`) and fails if a tier-1 or tier-3 name
   reaches the entry OR if a tier-2 name goes missing. The second half matters as much as the
   first: a filter that quietly dropped tier 2 as well would satisfy "no tier 3 leaked" while
   shrinking the surface the policy promises - the same defect with the opposite sign. That is
   AC2, and it is why the fix is a guard rather than an edit.
3. The manifest is derived from the build rather than from a name prefix, because a reviewer had
   already put a `semantic` group inside `src/primitive/`: it was tier 2 to the build and tier 1 to
   any prefix rule (`check-token-output.mjs:93`).

**Breaking-change note.** This removes exported names from a published package, so it is a MAJOR
for anyone who had imported one. Taken now, before wider adoption, on the standing rule that
publishing is a one-way door - the surface only gets more expensive to correct.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-26 | sdlc-studio | Created via `new` (deterministic) |

## Acceptance Criteria

### AC1: The JS entry exports tier 2 and nothing else

- **Given** the built tokens package
- **When** the output guard runs
- **Then** the package entry exports exactly the tier 2 set and no tier 1 or tier 3 token
- **Verify:** shell node scripts/check-token-output.mjs
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC2: The rule is executable in BOTH directions

- **Given** the guard
- **When** a tier 3 token leaks back in, or a tier 2 token goes missing
- **Then** it fails either way - a filter that quietly drops tier 2 as well would satisfy "no tier 3
  leaked" while shrinking the surface the policy promises, which is the same defect with the
  opposite sign
- **Verify:** shell node scripts/prove-guards-fail.mjs --only "tier 3 token exported|tier 2 token missing"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC3: The two guards now agree

- **Given** the public lock and the API report
- **When** both are read
- **Then** they describe the same 65 names, so a tier 3 rename can no longer pass one and fail the
  other
- **Verify:** shell node scripts/api-report.mjs && node scripts/check-public-tokens.mjs
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

> **Verification depth:** functional

## Fixed (2026-08-26)

The bug understated the scope. It reported "31+ tier-3 constants"; the entry was in fact emitting
**all 322 tokens** - every tier 1 primitive and every tier 3 component value alongside the 65
semantics - so **257 names were public API** in flat contradiction of PRD F01, AGENTS.md and the
lock.

The fix is one line: the `ts` platform now uses the same `clara/tier2` filter `tokens.public.json`
already used. 322 exports -> **65**, exactly matching the lock's 65 entries, with zero tier 1 or
tier 3 names surviving in the API report.

**Fixed now rather than later because nothing is published.** `NPM_TOKEN` is unset, so removing 257
names costs nobody anything today and would be a breaking change the moment it is not - which is the
whole force of "publishing is a one-way door".

Option (b) from the original analysis - marking them `@internal` so api-extractor stops reporting
them - was rejected. It silences the report while leaving the names importable at runtime, so the
shipped surface would still contradict the policy; it only stops anyone noticing.

The rule is now executable, which it was not before (`grep -rn 'tier 3' scripts/check-token*.mjs`
returned nothing). Checked against the BUILD's own tier manifest rather than by re-deriving tier
from a name or a path, because a guard that re-implements the rule it checks cannot catch the two
definitions diverging.

Proved both directions, and both are pinned as prover mutations (138 now):

- appending `TooltipBg` to the entry -> `1 tier 1 or tier 3 token(s) are exported...`
- deleting `ColorBgSurface` from it -> `1 tier 2 token(s) are NOT exported...`
