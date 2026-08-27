# Skeleton - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from the
tests that actually run, so it can be checked rather than believed.

Loading placeholders, and the container that announces for them.

**Boundary:** server-capable (see `../../../client-boundary.json`). No function props, no state, no
refs.

## Keyboard

Neither `Skeleton` nor `SkeletonGroup` is focusable. A loading list may hold forty placeholders, and
forty tab stops leading nowhere would be worse than the wait.

| Key | Result |
| --- | --- |
| Tab | No stop, in either mode. |
| Any key | No handler. |

## Recorded manual keyboard pass

**Not performed, and there is nothing for one to walk.** Neither component takes focus or handles a
key.

What a real pass would add is the announcement, not the keyboard: whether a screen reader reads the
group's label once when the placeholders appear, and - more importantly - whether it says anything
at all when they are REPLACED by the real content, which is the moment the user is waiting for and
which nothing here covers.

## Accessibility

**Every placeholder is `aria-hidden`, with no way to override it.** That is the component's whole
reason for existing: the user story is "a loading list announces once rather than forty times", and
an API that offered a `label` on `Skeleton` would offer the shape that causes the defect. There is
no such prop.

`SkeletonGroup` carries `role="status"` and a required label, so the loading state is announced once
at the container level. `status` rather than `alert`: content arriving is not an interruption.

## No motion, by ruling

D0100 decided a skeleton has no motion in **either** preference - no shimmer, no pulse, no sweep. A
skeleton's information is its SHAPE (content is coming, about this big), and a shimmer adds nothing
the shape has not already said, which makes it decoration justified after the fact. Forty shimmering
blocks in a loading list is a crowded screen in the time dimension.

This is a D0094-shaped ruling rather than an exception to one: there is nothing here to reduce, so
there is no `prefers-reduced-motion` branch either. `.clara-skeleton` and `.clara-skeleton-group` are
in `check-component-css.mjs`'s NO_MOTION contract, so it cannot be "improved" back in silently - and
the diagnostic names D0100 rather than Modal's D0094, because sending the reader to the wrong record
is its own defect.

## What is verified automatically

- Forty placeholders produce exactly ONE live region, carrying the group's label -
  `__tests__/skeleton.test.tsx`
- Every placeholder is `aria-hidden`, and a bare `Skeleton` carries no role at all -
  `__tests__/skeleton.test.tsx`
- Width maps to a token class, never an inline style - `__tests__/skeleton.test.tsx`
- It renders on the server - `__tests__/skeleton.test.tsx`
- axe (serious and critical) with forty placeholders, and in all four theme x density combinations -
  `check:axe`
- Token-only styling, and NO motion - `check:component-css`, mutation-checked: adding an
  `animation` to `.clara-skeleton--full` fails naming D0100.

## Stated gaps

- **The announcement may not actually be made, and nothing here can tell.** The `role="status"`
  region and its text are created in the SAME commit, and this repo has already recorded, in
  the Input component, that "a region that appears in the same commit as its text is
  commonly not announced at all - so the boundary crossing, the one announcement that matters, was
  the likeliest to be silent". Input answers it with an announcer that is always present and empty
  until there is something to say; that shape needs an effect, and an effect makes a component
  client-only.

  What IS proved here: the region exists, carries `role="status"`, is not silenced with
  `aria-live="off"` or `aria-hidden`, and appears exactly once. What is NOT proved is that a screen
  reader speaks it, and no gate in this repository can decide that - jsdom has no announcement
  model and axe reads the accessibility tree rather than what is spoken.

  Filed as **BG-01M11JWY**, with the boundary trade-off stated: the fix is known, and paying for it
  costs this component its server classification.

- **Nothing announces when the placeholders are REPLACED.** The group says what is loading; neither
  component says when it has arrived, and that is the moment the user is actually waiting for. It
  belongs to whoever swaps the skeletons for content, and Clara cannot do it for them - but it is
  the most likely thing to be forgotten, so it is named here and in the docs page.
- **The block height is one type step and does not follow its content.** A skeleton standing in for
  a two-line cell is the same height as one standing in for a chip, so the shape promise is
  approximate. Widths are a closed set for the same reason.
- **Screen reader testing is not automated.** PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7, US-01M0WSME).
