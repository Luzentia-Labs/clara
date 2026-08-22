# Accessibility gap register

> What the automated accessibility gate does NOT cover. AGENTS.md splits accessibility across two
> seats on purpose - Idris decides inclusive design, Mira proves it - and neither may assume the
> other covered it. This file is what stops an automated pass being read as conformance.

## Gap 1 - the severity filter excludes 29 of 105 axe rules

`test/axe.ts` fails only on `serious` and `critical`, per TSD gate 5 (TSD:102, TSD:334). Censused
against axe-core 4.13.0 during round 4:

| | Count |
| --- | --- |
| Total axe rules | 105 |
| Rules that can never fail this matcher | **29** |
| Of those, WCAG-conformance-tagged | **8** |

Directly reachable from Clara's component surface:

| Rule | Impact | Criterion |
| --- | --- | --- |
| `form-field-multiple-labels` | moderate | WCAG 2.0 **A**, SC 3.3.2 |
| `aria-deprecated-role` | minor | SC 4.1.2 |
| `heading-order` | moderate | best practice (confirmed passing the matcher) |

**Why this matters:** the PRD claims WCAG 2.2 AA. A gate that cannot fail on a Level A criterion
does not deliver that claim on its own. The threshold is the TSD's, so the gap is spec-level - it is
recorded here rather than silently narrowed or silently widened.

**Options for the operator:** (a) lower the matcher to `moderate` and accept more noise;
(b) keep the threshold and add a named allowlist of the moderate/minor rules that must still block;
(c) accept the gap explicitly in the TSD. Not decided here.

## Gap 2 - `incomplete` results are not surfaced

axe returns `incomplete` for checks it cannot decide. The matcher reads `violations` only, so an
undecidable check is indistinguishable from a pass.

## Gap 3 - contrast is proven on tokens, not on rendered components

`color-contrast` is disabled under jsdom, which genuinely cannot compute layout (verified). D0032
says contrast is "covered rather than dropped" by US-01M0GM66 - true for **declared token
pairings**. A component that pairs two tokens nobody declared is caught by neither gate.

## Gap 4 - stated in the TSD already

NVDA and forced-colors are recorded as known gaps in the TSD's own Known Gaps section, not covered
by any automated gate here.

---

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Opened from round-4 review finding B5. Gaps 1-3 measured, not estimated. |
