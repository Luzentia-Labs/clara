# BG-01M0Y2H2: Two simultaneous toasts render two overlapping viewports

> **Status:** inbox
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

{{steps}}

## Proposed Fix

{{fix}}

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-26 | sdlc-studio | Created via `new` (deterministic) |
