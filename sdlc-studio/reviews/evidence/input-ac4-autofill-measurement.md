# Input AC4 - autofill, measured

Chrome 1xx on macOS, light theme, `http://127.0.0.1:4173/autofill-light.html` (the manual-check
fixture, rendering the BUILT package). An address was saved in Chrome and the form autofilled by
picking the suggestion. Colours below were sampled from the resulting screenshot with PIL, not
assumed - an earlier pass guessed Chrome's fill as `#faffbd` and was wrong.

## Sampled

| Thing | Colour |
| --- | --- |
| Chrome's autofill fill | `#feffcc` |
| Page canvas / non-autofilled input | `#ffffff` |
| Input top border, autofilled field, as painted | `#a29f9c` |
| Input top border, autofilled + invalid, as painted | `#686663` |
| Input top border, plain field, as painted | `#b0adaa` |

The painted border is lighter than its token because a 1px line is anti-aliased. Both figures are
given below; the TOKEN figure is the exact one and should drive any decision.

## Measured

| Pair | Ratio | Floor | |
| --- | --- | --- | --- |
| `fg-default` `#1f1e1d` on the fill | **16.16:1** | 4.5 | pass |
| `border-focus` `#48518b` on the fill | **7.22:1** | 3 | pass |
| `border-strong` (invalid) `#585654` on the fill | **6.99:1** | 3 | pass |
| `border-default` TOKEN `#95928e` on the fill | **3.01:1** | 3 | clears by 0.01 |
| `border-default` as PAINTED `#a29f9c` on the fill | **2.56:1** | 3 | below |
| The fill vs the page canvas | **1.03:1** | - | the fill alone does not delimit the control |

## Why the border matters here

The autofill fill is 1.03:1 against the page, so the fill itself marks nothing. While a field is
autofilled, the 1px border is the ONLY cue delimiting the control - and it is the one cue sitting on
the floor.

## What is NOT measured

- **Dark theme.** Not yet run. If Chrome paints the same near-white fill on a dark Clara surface,
  the numbers change completely and this becomes a much larger question than 0.01.
- **Safari.** Paints a different colour; every row above would change.
- **The focus ring on a filled field, seen.** 7.22:1 is computed from tokens; nobody has tabbed into
  an autofilled field and looked.

## Standing position

D0033: Clara does NOT style autofill. No `:-webkit-autofill` rule exists anywhere in the repo, and
the criterion's own text says "the browser colour wins".
