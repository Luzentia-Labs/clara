# Toast - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from the
tests that actually run, so it can be checked rather than believed.

A transient notification that is announced, and that never disappears before it is read.

**Boundary:** client-only (see `../../../client-boundary.json`). It holds open state and dismissal
timers, which TRD Section 7 makes the boundary test.

## Keyboard

| Key | Result |
| --- | --- |
| F8 | Moves focus into the toast viewport. Radix's hotkey, and the reason a toast is reachable at all without a pointer. |
| Tab | Moves through the toast's action and its close button once the viewport has focus. |
| Enter / Space | Activates the focused action or close button. |
| Escape | Returns focus out of the viewport. |

While anything inside the viewport holds focus, the dismiss timer is PAUSED. A toast that expired
while the user was tabbing toward its "Undo" button would take the action away at the moment it was
reached.

## Recorded manual keyboard pass

**Not performed. This is outstanding, and it is the one artefact here that automation cannot
supply.**

What a real pass adds that the tests cannot: whether F8 is discoverable at all in practice, whether
a screen reader announces the error toast at a useful moment rather than mid-sentence, and whether
the 5 s default is long enough to read a two-line description before it goes.

## Accessibility

**Politeness and persistence are ONE decision.** `danger` is announced assertively AND does not
auto-dismiss; everything else is polite and dismisses after Radix's default 5 s. Those are not two
independent choices: both follow from an error being the one toast whose content the user has to act
on. A polite error waits behind whatever is already speaking, by which time the toast may be gone; an
auto-dismissing error destroys information on a timer the reader did not set. Splitting them into
two props would let a consumer select the incoherent half, so `intent` decides both (D0102).

**The intent word reaches the accessible name.** The stripe down the side is colour, and colour is
never the only carrier - the same rule Badge and Alert follow. "Error: Could not post journal 4471"
is what a screen reader reads, not "Could not post journal 4471" in a colour nobody hears.

## The layer token goes on the VIEWPORT, not the toast

Unlike Popover and Tooltip, Radix does not copy a computed z-index here: the viewport is an ordinary
fixed element it renders, and it is what forms the stacking context. A token on `.clara-toast` alone
would be inert inside it.

`--clara-layer-toast` and `--clara-layer-tooltip` resolve to the SAME layer deliberately (D0102).
Open order decides, because the relationship is bidirectional - see the two e2e assertions below.

## Motion is Class B, so it is REPLACED under reduced motion, not removed

D0100 permits motion where its absence removes information. A toast slides in from the viewport
edge, and that travel is the only thing distinguishing a notification that JUST ARRIVED from one that
was already there - the "liveness" meaning. Removing it outright would remove that signal, so the
reduced-motion rule substitutes a fade, which carries "this is new" without traversing the screen.

## Known residual, accepted (D0102)

A toast arriving into a viewport whose host is already on the page is a later toast in an EARLIER
sibling, so a tooltip opened in between can cover it. The obvious fix - re-appending the viewport
host so it is last - is worse than the defect: moving a live DOM node re-parents its subtree, which
resets focus and remounts anything stateful inside it.

Since BG-01M0Y2H2 the host is shared, so this applies to the STACK rather than to each toast: the
host is appended when the first toast opens, and a tooltip opened after that can cover toasts that
arrive later into the same host. The trade-off is unchanged, and so is the reason for accepting it.

## What is verified automatically

- An error is announced ASSERTIVELY, and info, success and warning POLITELY - both directions, so
  "announces assertively" cannot pass on a component that interrupts on every saved field -
  `__tests__/toast.test.tsx`
- The intent word is joined to the accessible name in all four intents - `__tests__/toast.test.tsx`
- An error toast is still present after 60 s of fake time, AND a success toast is gone - without the
  second, the first passes on a toast that never dismisses at all - `__tests__/toast.test.tsx`
- The timer pauses on pointer and on focus, and RESUMES when the pointer leaves - without the
  resume, a pause that never ends would pass - `__tests__/toast.test.tsx`
- It closes from the close button, addressed by accessible name - `__tests__/toast.test.tsx`
- A tooltip opened on a toast's own action paints ABOVE the toast, probed with
  `document.elementFromPoint` inside a verified overlap - `e2e/stacking.spec.ts`
- A toast arriving over an already-open tooltip paints ABOVE it, the other direction of the same
  mechanism - `e2e/stacking.spec.ts`
- Three toasts render ONE viewport holding all three, in arrival order, and the stack survives its
  owning toast unmounting - `__tests__/toast.test.tsx`
- In a browser, three toasts occupy distinct rows and every close button is the topmost element at
  its own centre, which is what reachable means to a pointer - `e2e/stacking.spec.ts`
- Reduced motion REPLACES the entrance slide with a fade rather than removing it, so a toast still
  reads as new - the Class B half of D0100, which nothing exercised before - `e2e/stacking.spec.ts`
- It renders through `ClaraPortal` and takes its stacking from a layer token -
  `check:overlay-contract`
- Token-only styling, and a layer token that is not inert - `check:component-css`
- axe while open, in all four theme x density combinations - `check:axe`

## Stated gaps

- **An ownership handover restarts every survivor's dismiss countdown - BG-01M0YTT4.** The shared
  host is rendered BY the owning toast, so when that toast unmounts the host is re-created in a
  different tree position and every Radix Root inside it remounts with a fresh timer. Measured:
  a survivor fires at t=9.0s instead of its original t=5.0s. Dismissing one toast silently
  extends every other one. The handover test here asserts presence and viewport count, both of
  which are true while the timer is wrong.
- **Swipe-to-dismiss is not verified.** Radix's swipe handling needs real pointer geometry; jsdom has
  none. It is not asserted anywhere, and it is not claimed anywhere either.
- **Multiple toasts share ONE viewport** - this was broken and is fixed (BG-01M0Y2H2). Each
  `<Toast>` used to render its own Radix Provider and Viewport, so two siblings produced two fixed
  viewports at the identical rect; a review measured `elementFromPoint` on the first toast's close
  button returning the SECOND toast's, so covered controls were unreachable rather than merely
  hidden, and a covered `danger` toast persisted forever because its timer is `Infinity`. Every
  toast now registers into one module-level stack. `ToastProps` did not change.
- **The F8 hotkey is Radix's and is not asserted.** It is documented in the keyboard table because it
  is how a keyboard user reaches a toast at all, but no test presses it.
- **Screen reader testing is not automated.** PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7, US-01M0WSME).
