# Tag - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from the
tests that actually run, so it can be checked rather than believed.

A compact, optionally removable label - a filter chip, a selected value, an applied facet.

**Boundary:** client-only (see `../../../client-boundary.json`). **Reclassified during
implementation**, the way Field was: the classification said `server`, and AC2 requires a remove
control, which means `onRemove` - a function prop, and TRD Section 7 makes that the boundary test.
Kept as ONE component rather than a server `Tag` and a client `RemovableTag`, because splitting it
would move the choice into the consumer's import statement, where getting it wrong is a build error
in an application rather than a decision Clara made.

## Keyboard

A non-removable Tag is not focusable and adds no tab stop - which matters, because a list screen
may carry one per row.

| Key | Result |
| --- | --- |
| Tab | Moves to the remove control, when there is one. A static Tag has no stop. |
| Enter | Activates the remove control. |
| Space | Activates the remove control. Native `<button>` behaviour, unchanged. |
| Escape | No handler. A tag is not a dismissible surface. |

## Recorded manual keyboard pass

**Not performed. This is outstanding, and it is the one artefact here that automation cannot
supply.**

What a real pass adds that the tests above cannot: whether the remove control's focus ring is
actually visible against each of the five intent backgrounds in both themes - the ring is drawn
against `--clara-color-border-focus` on a subtle tinted surface, and `check:contrast` measures the
pairing rather than the rendered ring - and what a screen reader says when moving through a filter
bar of eight tags in sequence.

**To record one:** tab through a row of tags in both themes and both densities, pointer unused;
then replace this section with the date, the OS and browsers, and the result per row.

## Accessibility

The remove control is named for the value it removes - "Remove Overdue", never "Remove". `children`
narrows to `string` on the removable variant specifically so that name can exist without the
consumer supplying the text twice. Eight identical "Remove" buttons in a filter bar forces a
screen-reader user to leave the control to discover which one they are on.

`removeLabel` overrides the name for another word or another language.

The glyph is `aria-hidden`: the button already has a name, and a multiplication sign read aloud is
noise.

Intent reaches the accessible name as a word, exactly as Badge does, so the colour is never the only
carrier (WCAG 1.4.1). `neutral` adds nothing.

## What is verified automatically

- The remove control names its value, is reachable by Tab and activates on Enter -
  `__tests__/tag.test.tsx`
- A non-removable Tag renders no control at all, so it adds no tab stop -
  `__tests__/tag.test.tsx`
- The intent word joins the accessible name for all four non-neutral intents -
  `__tests__/tag.test.tsx`
- axe (serious and critical), removable and static, and in all four theme x density combinations -
  `check:axe`, `__tests__/tag.test.tsx`
- **The remove control clears 24x24 in both densities, measured in a real browser** -
  `check:geometry`. This is a rendered assertion, not a token one: the control is the smallest
  thing a user is asked to hit accurately and is usually hit under time pressure.
- Token-only styling, no literals and no tier 1 reads - `check:component-css`
- The focus indicator is two-part, ring plus offset (D0054) - `check:component-css`

## Stated gaps

- **The focus ring is not verified as visible against each intent surface.** `check:contrast`
  measures the token pairing; nothing measures the ring rendered on a tinted tag in both themes.
  Named in the manual pass above as the thing that pass would add.
- **The component cannot enforce that the VISIBLE text distinguishes two tags** - the same limit
  Badge records, for the same reason.
- **Screen reader testing is not automated.** axe checks the accessibility tree, not what NVDA or
  VoiceOver announce. PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7, US-01M0WSME), so the rendered appearance is
  unverified - only the markup, the tokens, the measured contrast and the measured target size are.
