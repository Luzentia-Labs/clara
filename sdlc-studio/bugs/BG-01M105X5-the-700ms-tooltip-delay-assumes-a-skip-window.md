# BG-01M105X5: The 700ms tooltip delay assumes a skip window the per-Tooltip provider deletes

> **Status:** inbox
> **Created:** 2026-08-27
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** packages/react/src/components/Tooltip/Tooltip.tsx
> **Severity:** Medium
> **Points:** 3

## Summary

Radix's 700 ms open delay is calibrated against a 300 ms `skipDelayDuration` window - move between triggers inside that window and the next tooltip opens instantly. Clara's per-Tooltip provider shape DELETES that window: `skipDelayDuration` is held per provider, and there is one provider per tooltip, so every button on a toolbar pays the full 700 ms.

Measured across rounds: hover to visible 888 ms; re-hovering the SAME trigger 28 ms (the window works within one provider); `delayDuration={5000}` left jsdom 16/16 green and the e2e suite passing at 37.7 s against a ~7 s baseline - so a 7x pointer-latency regression is invisible to every gate.

Three review rounds ruled it MINOR for the same reason, and that reasoning still holds: FOCUS opens immediately regardless of the delay, so the keyboard and assistive-technology paths - the ones AC1 exists for - are unaffected. It is a comfort regression for pointer users, not a barrier.

What was wrong was the stated rationale, not the outcome. The docblock justified keeping 700 with "public API is a one-way door", which covers a public `<TooltipProvider>` and does NOT cover `delayDuration` on an internal provider - that is not public API and could be changed freely.

Two candidate directions:

1. **Lower the constant.** 300-400 ms is typical where no skip window exists. Cheap, reversible, and it does not touch the public surface.
2. **Add grouping.** A shared provider restores `skipDelayDuration` and keeps 700 honest, but a public `<ToastProvider>`-style component IS a one-way door, so it needs the same treatment the toast stack got: a module-level shared tree that leaves `TooltipProps` unchanged.

Option 1 needs a decision, not a design. Option 2 needs both.

## Steps to Reproduce

1. `pnpm build` and `pnpm storybook`, then open **Tooltip / Default**.
2. Hover the trigger and time to visible: **888 ms** measured, against a 700 ms
   `delayDuration` plus paint.
3. Move the pointer off, then back onto the SAME trigger inside 300 ms: **28 ms**. The skip
   window works, but only within one provider.
4. Render two Tooltips side by side and move from the first trigger to the second. Each is its
   own provider (`packages/react/src/components/Tooltip/Tooltip.tsx:105` records the shape and
   its cost), so the skip window never applies across them and the second pays the full 700 ms.

**The gate blindness, measured separately.** Set `delayDuration={5000}` in `Tooltip.tsx` and run
`pnpm test` and `pnpm test:e2e`: jsdom is 16/16 green and e2e passes at 37.7 s against a ~7 s
baseline. A 7x pointer-latency regression is invisible to every gate in the repo, because no
assertion reads the delay and Playwright's auto-waiting absorbs it as a slower run.

## Proposed Fix

**Take option 1 - lower the constant - unless the operator wants grouping.**

`delayDuration` sits on an INTERNAL provider, so it is not public API and carries no one-way-door
cost. Set it to 300-400 ms in `Tooltip.tsx`, which is the range used where no skip window exists,
and correct the docblock at `Tooltip.tsx:99-105`: its current justification names the one-way-door
rule, which applies to a public `<TooltipProvider>` and not to this constant.

The fix is not complete without a gate, because the measurement above proves the current suite
cannot see the value at all. Add an assertion that reads the delay Clara passes - a unit test on
the prop rather than on observed timing, since jsdom returns no real clock - so a future change to
the number is a decision somebody records rather than a silent edit.

Option 2 (grouping via a shared provider) stays available and is strictly larger: it needs the
module-level shared-tree treatment the toast stack got in `toast-store.ts`, so that
`skipDelayDuration` becomes real without `TooltipProps` gaining a public provider.

## Acceptance Criteria

### AC1: The delay is in the range a deleted skip window calls for

- **Given** D0109's ruling
- **When** Tooltip's internal provider is configured
- **Then** `delayDuration` is between 300 and 400 ms inclusive
- **Verify:** vitest "Tooltip opens on a delay a toolbar can live with"
- **Verification target:** functional

### AC2: The value is readable by a test at all

- **Given** the measurement that `delayDuration={5000}` left jsdom 16/16 green and the e2e suite
  passing at 37.7s against a ~7s baseline
- **When** the delay is changed
- **Then** an assertion fails, because a 7x pointer-latency regression being invisible to every gate
  is the reason this bug could sit for three rounds
- **And** the assertion reads the value Clara passes rather than an observed duration - jsdom returns
  no real clock, so a timing assertion here would be a false green by construction
- **Verify:** vitest "Tooltip opens on a delay a toolbar can live with"
- **Verification target:** functional

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-27 | sdlc-studio | Created via `new` (deterministic) |
