# Input - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from
the tests that actually run, so it can be checked rather than believed.

A single-line text control that fills its Field, with readonly and disabled as visibly distinct states.

**Boundary:** client-only (see `client-boundary.json`). A Field renders a context Provider, so
neither it nor any control that reads its wiring can be a Server Component (D0060).

## Keyboard

Readonly stays in the tab order and is selectable and copyable. **So does disabled** - it is
`aria-disabled` plus `readOnly`, never the native attribute (D0058), because a natively disabled
control is unreachable and the reason it is disabled is usually attached to it. The two are still
different states and do not look alike: disabled takes the disabled background and foreground,
readonly keeps the surface and changes only the text colour.


| Key | Result |
| --- | --- |
| Tab | Enters and leaves the field. |
| Any printing key | Types, unless readonly or disabled. |
| Tab, when readonly | Still reaches it; the value stays selectable and copyable. |
| Tab, with `clearable` and a value | Reaches the clear button after the field. It is absent when the field is empty, so there is no dead stop. |
| Enter / Space on clear | Clears and returns focus to the input. No-op when the Field is disabled. |

## Recorded manual keyboard pass

**Not performed. This is outstanding, and it is the one artefact here that automation cannot
supply.**

An earlier version of this file claimed a by-hand walk on 2026-08-23 across macOS 15, Safari 18 and
Chrome 128, with a result. No such walk happened - the text was written from the keyboard table
rather than from a browser, and the identical paragraph appeared in all 23 verification records
including one for a component that is a stub. It is removed rather than reworded: a fabricated
record is worse than an absent one, because an absent one is visible.

What IS verified is above, by tests that run. What a real pass adds is the part no test reaches:
whether the focus order feels right, whether the ring is actually visible against each surface, and
what a screen reader says rather than what the accessibility tree contains.

## Autofill: performed (2026-08-25)

**Environment.** Chrome on macOS, light theme, comfortable density, run by Richard Dale Umayan
against `scripts/make-manual-fixture.mjs`, which renders the BUILT package. An address was saved in
Chrome and the form filled by picking the suggestion.

**Colours were SAMPLED from the resulting screenshot, not assumed.** An earlier pass of this record
guessed Chrome's fill and computed a figure from it - a number about a colour nobody had looked at,
which is the class of evidence D0065 exists to reject. Full method and raw samples:
`sdlc-studio/reviews/evidence/input-ac4-autofill-measurement.md`.

| Pair | Ratio | Floor | |
| --- | --- | --- | --- |
| `fg-default` on the fill `#feffcc` | 16.16:1 | 4.5 | pass |
| `border-focus` on the fill | 7.22:1 | 3 | pass |
| `border-strong` (invalid) on the fill | 6.99:1 | 3 | pass |
| `border-default` on the fill, at the TOKEN | 3.007:1 | 3 | pass, by 0.007 |
| `border-default` on the fill, as PAINTED | 2.56:1 | 3 | see below |
| The fill vs the page canvas | 1.03:1 | - | the fill alone does not delimit the control |

**The token figure is the criterion, and the painted one is not.** SC 1.4.11 evaluates the specified
colour of a boundary. Point-sampling one subpixel of an anti-aliased 1px line always reads low - the
same method scores Clara's ORDINARY, non-autofilled border at 2.233:1, worse than the autofilled
2.557:1. A metric that condemns every input Clara ships harder than the case under review is
measuring rasterisation, not colour.

**Ruling: pass, by the two-part delimitation test (D0097).** While a field is autofilled, at least
one of (1) the fill against the surface behind it, or (2) Clara's border against the fill, must reach
3:1 at the specified value. Chrome light gives 1.03 and 3.007; part 2 carries.

Clara contests nothing here, and that is deliberate rather than an oversight: the browser's tint is
the user's own signal that a field was filled for them, and removing it to look tidier would take
information away from the person who most needs it. **Note the position has never been a numbered
decision until now - earlier versions of this record cited `D0033`, which is the test-toolchain pin
and has nothing to do with autofill. It is D0097.**

### Stated gaps on this check

- **The focus ring on a filled field: OBSERVED and closed** (2026-08-25, Chrome light, Richard Dale
  Umayan). Tab into an autofilled field and the two-part indicator renders over the fill: a 4px ring
  at `#4f598d` (token `border-focus` `#48518b`), a 4px white offset, then the 1px border, then the
  fill at `#fffed1`.

  | Pair | Ratio | |
  | --- | --- | --- |
  | ring vs the autofill fill | **6.47:1** | the D0097 blocking cue - passes |
  | ring vs the page behind the control | 6.68:1 | |
  | offset vs the autofill fill | **1.03:1** | carries nothing |
  | border vs the autofill fill, as painted | 2.86:1 | |

  **The offset measuring 1.03:1 is the finding, not a footnote.** It is exactly what the ux seat
  predicted, and it is the two-part focus indicator (deliverable 7) earning its design on the first
  background outside the token set Clara has ever met: the white offset disappears into a near-white
  fill and the ring carries the whole indicator alone. A one-part indicator built from the offset
  would have vanished here. This is now the recorded evidence for that theorem, and the reason
  delimitation - which is still one-part - pre-commits to a second part under deliverable 6.
- **Safari is unmeasured.** Its historical fill puts `border-default` at ~2.965:1, which lands in
  D0097's middle tier: Input still passes, and `border-default`'s revisit under foundations
  deliverable 6 becomes mandatory before first publish rather than merely scheduled.
- **Dark theme is unmeasured, and is predicted to pass more comfortably** - Chrome paints the same
  near-white fill on a dark page, so part 1 of the test carries at 16.16:1.
- **PasswordInput is the most-autofilled control in the set and has no measurement of its own.**
  Chrome fills username and password as a pair and paints both. It inherits this record by reference.
- **The DECORATED path is untested against autofill.** `.clara-input-group` carries the border while
  the inner input has `border: none`, and `:autofill` matches the `<input>` - so any future rule
  would have to reach the wrapper through `:has(.clara-input:autofill)` or it would fix only the
  plain path. Recorded now as a pre-committed shape so a revisit does not rediscover it.

**Why it could not be automated.** Three routes were tried and all are closed:

1. `Autofill.enable` + `Autofill.trigger` over CDP - enables, then returns `Field not found`. The
   domain drives Chrome's credit-card autofill component, which is not present in the Chromium build
   Playwright ships. Tried against both an address form and a `cc-*` form.
2. Saving a profile and picking the suggestion - the autofill dropdown is native browser UI, not
   DOM, so no automation driver can select from it.
3. Forcing the pseudo-class - `:-webkit-autofill` is set by the browser's autofill engine and cannot
   be applied from script or from a stylesheet.

## Recorded manual keyboard pass (continued)

**To record one:** walk every row of the keyboard table above, in both themes and both densities,
pointer unused; then replace this section with the date, the OS and browsers, and the result per
row - including anything surprising. `check-verification.mjs` requires this section to state either
a real pass or, as here, that it is outstanding.

## Accessibility

Readonly text keeps full contrast. WCAG exempts disabled text from the contrast minimum; Clara does
not take that exemption for readonly, because readonly text exists to be read.

Disabled is `aria-disabled` plus `readOnly`, never the native `disabled` attribute (D0058, D0028).
A natively disabled control leaves the tab order, so a keyboard user can never reach it - and an ERP
form is frequently mostly disabled, with the REASON attached to the control they cannot reach. The
first version of this framework used the native attribute, contradicting a decision accepted one
epic earlier and already shipped in Button, and two tests asserted the violation as correct.

## What is verified automatically

- axe (serious and critical) in all four theme x density combinations - `check:axe`
- The behaviour above, in `../Field/__tests__/behaviour.test.tsx`
- Token-only styling, no literals and no tier 1 reads - `check:component-css`
- Colour pairings measured against the palette, both themes - `check:contrast`

## Stated gaps

- **Screen reader testing is not automated.** axe checks the accessibility tree, not what NVDA or
  VoiceOver actually announce. PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7), so the rendered appearance is unverified - only
  the markup, the tokens and the measured contrast are.
- **Autofill styling is not implemented.** The docs claimed Clara overrides the browser's autofill
  background; no `:-webkit-autofill` rule exists anywhere in the repo. An autofilled field takes the
  browser's own colour. AC4 remains manual, and what it will verify does not exist yet.
