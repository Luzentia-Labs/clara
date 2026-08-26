# BG-01M0YTT4: A toast ownership handover restarts every survivor's dismiss countdown

> **Status:** inbox
> **Created:** 2026-08-26
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** packages/react/src/components/Toast/Toast.tsx, packages/react/src/components/Toast/toast-store.ts
> **Severity:** Medium
> **Points:** 3

## Summary

When the toast that owns the shared host unmounts, ownership passes to a survivor - and the survivor's dismiss countdown RESTARTS.

Measured by a review seat: a solo success toast fires `onClose` at t=5.0s. With the owner dropped at t=4.0s, the survivor fires at t=9.0s - a fresh five seconds.

Cause: `ToastHost` is rendered BY the owning `<Toast>`, so a handover re-creates the host in a different position in the React tree. Every `RadixToast.Root` inside it remounts, and a remounted Root starts a new timer.

The user-visible consequence: dismissing one toast silently extends every other toast on screen. With three toasts and a person closing them one at a time, the last one outlives its stated duration by a multiple.

No test covers it. `toast.test.tsx`'s handover case asserts only that the survivor is still present and that one viewport exists - both true while the timer is wrong.

Candidate fix: render the shared host from a position that does not move. Ownership exists only because the host has to be rendered by SOMETHING, and every `<Toast>` is a candidate; a stable mount point removes the handover entirely. Options: portal the host from the store itself rather than from a component; or keep ownership but render the host through a stable `createPortal` target so the React subtree position does not change when the owner does.

Suggested verification: assert the survivor's `onClose` fires at its ORIGINAL deadline after a handover, not five seconds later - the shape the review used, with fake timers.

Filed rather than fixed inside the round-2 repair, because the repair being reviewed is the one that introduced ownership at all, and a second structural change to the same mechanism in the same pass is how the previous regression reached main.

## Steps to Reproduce

{{steps}}

## Proposed Fix

{{fix}}

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-26 | sdlc-studio | Created via `new` (deterministic) |

## Also measured, worth recording (round 3)

The handover does not only reset the timer - it **re-announces every survivor to the live region**.
Measured: after the owning toast unmounts, `"Notification Success: Survivor"` reappears in the
announcer, so a screen-reader user hears the entire remaining stack read out again because somebody
dismissed an unrelated toast.

That makes the defect worse than "a wrong duration": it is an unprompted repeat announcement, which
is exactly the noise a live region is supposed to avoid. Same cause - the host is re-created in a
new tree position, so every Radix Root inside it remounts - and the same fix closes both.
