# BG-01M0Y2H2: Two simultaneous toasts render two overlapping viewports

> **Status:** Fixed
> **Triaged-by:** mira-calderon; persona; review-seat
> **Created:** 2026-08-26
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** packages/react/src/components/Toast/Toast.tsx, packages/react/src/components/Toast/verification.md
> **Severity:** Medium
> **Points:** 5

## Summary

Two simultaneous toasts render TWO viewports, both `position: fixed` at the same corner, so the second notification paints exactly on top of the first. Measured with two `<Toast open>` siblings: `viewports: 2, toasts: 2`.

This is a defect, not a gap. A notification surface where the second notification hides the first is wrong in the ordinary case - two things finishing at once is what notifications are FOR.

**Cause.** Radix's architecture is `ToastProvider > ToastViewport + Toast.Root`, and Roots reach the viewport through provider CONTEXT. Clara's `<Toast>` is self-contained: it renders its own Provider and its own Viewport, for the same reason Tooltip does (requiring `ClaraProvider` would leak a Radix error message to consumers and charge every consumer of the library's root for machinery they may never use). Self-containment is right for Tooltip, where each tooltip is independent. It is wrong for Toast, where the whole point is a shared STACK.

**Why it was not caught by the acceptance criteria.** Every one of AC1-AC7 concerns a single toast: politeness, persistence, timer pausing, theming, and the layering against a Tooltip. None of them renders two. The criteria are not wrong about anything they assert - they simply do not reach the case.

**The fix need not be breaking, which is why this is filed rather than blocking.** The obvious repair - export a `<ToastProvider>` a consumer mounts once - IS public API and would be a breaking change if added after publish. But an alternative keeps `<Toast>`'s surface byte-identical: route every Toast into a single module-level shared React tree (one Provider, one Viewport, mounted lazily on the first Toast and reference-counted), with `<Toast>` becoming a registration into that tree. Consumers write exactly what they write today. So shipping the current component does not close off the good fix.

**Interim honesty.** `packages/react/src/components/Toast/verification.md` records this under stated gaps as a known DEFECT with this bug's id, not as an untested area. A reader must not come away thinking multi-toast works and merely lacks a test.

\*\*Suggested verification when fixed:\*\* render three toasts, assert exactly ONE `.clara-toast__viewport` exists and three `.clara-toast` children inside it, in arrival order; plus an e2e assertion that the three are visually stacked rather than overlapping, since jsdom computes no layout and cannot tell those apart.

## Steps to Reproduce

1. Render two siblings: `<Toast open title="First" /><Toast open title="Second" />`.
2. Count viewports: `document.querySelectorAll('.clara-toast__viewport').length` -> **2**.
3. In a browser, both occupy the identical rect (measured **x872 y649 384x47**), and
   `document.elementFromPoint` at the centre of the FIRST toast's close button returns the
   **second** toast's close button.

So the covered toast's controls are unreachable, not merely invisible. With `duration: Infinity` on
`danger`, a covered error toast persists forever - invisible, unactionable, and never dismissed.
That last point is why the review judged the recorded Severity understated.

## Acceptance Criteria

### AC1: One viewport, however many toasts

- **Given** three simultaneous toasts
- **When** they render
- **Then** exactly one `.clara-toast__viewport` exists and holds all three
- **Verify:** vitest "Toast stacks in one shared viewport"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC2: They stack rather than cover, and every control is hittable

- **Given** three simultaneous toasts in a browser
- **When** their entrance animations have finished
- **Then** all three occupy distinct rows, and each close button is the topmost element at its own
  centre - which is what "reachable" means to a pointer, and exactly what the covered toasts failed
- **Verify:** shell pnpm test:e2e -g "three toasts stack instead of covering each other"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC3: The stack survives its owner leaving

- **Given** the first toast owns the shared host
- **When** it unmounts
- **Then** ownership passes to a toast still mounted, so closing one does not take the rest off
  screen with it
- **Verify:** vitest "survives the owning toast unmounting"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC4: No new public surface, and nothing a consumer writes changes

- **Given** the repair
- **When** the API report runs
- **Then** `ToastProps` is byte-identical, and no provider component or prop is added
- **And** the ONE signature change is `Toast`'s return type widening from `JSX.Element` to
  `JSX.Element | null`, because a non-owning toast renders nothing of its own. That is recorded
  rather than hidden: it is not breaking (a consumer renders a component, it does not consume the
  return), and returning an empty fragment purely to keep the old signature would be contorting the
  code to make a report look unchanged
- **Verify:** shell node scripts/api-report.mjs
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

> **Verification depth:** functional

## Proposed Fix

Route every `<Toast>` into ONE module-level stack (`toast-store.ts`), with the first-mounted toast
rendering the shared Radix Provider and Viewport and ownership passing on unmount.

Explicitly NOT a public `<ToastProvider>`: that is public API, which under this project's publishing
rules is a one-way door, and it moves work onto every consumer for a problem they did not create.

## Fixed (2026-08-26)

Implemented as proposed. `ToastProps` is unchanged and a consumer writes exactly what they wrote
before - confirmed by `api-report`. The single signature movement is the return type widening to
`JSX.Element | null`, recorded in AC4.

**One regression caught by the API gate during this repair, worth recording.** Inserting `ToastHost`
above `Toast` left the component's entire doc comment attached to the new internal function, so the
published surface reported `Toast` as `(undocumented)` - the whole "politeness and persistence are
one decision" rationale silently detached from the thing consumers read. The gate caught it in the
same diff that introduced it.

Proved both directions by reverting ownership so every toast renders a host again:

| | Shared stack | Per-toast host (the defect) |
| --- | --- | --- |
| `vitest` Toast suite | 23 passed | **4 failed** |
| `e2e` three-toast case | passes | **fails** at `toHaveCount` - "each toast brought its own fixed viewport again" |

The e2e case needed one thing the first attempt got wrong, and it is worth recording: measurement
has to wait for the entrance animation to FINISH. Mid-flight the toast is still translated off the
viewport edge, so every hit test at its resting position returns something else - which reads as
"unreachable" when it is simply not there yet. Without the wait, all three close buttons reported
false on a correct implementation.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-26 | sdlc-studio | Created via `new` (deterministic) |
