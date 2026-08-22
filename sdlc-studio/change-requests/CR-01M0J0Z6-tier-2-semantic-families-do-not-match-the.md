# CR-01M0J0Z6: Tier 2 semantic families do not match the set TRD Section 6 enumerates

> **Status:** Approved
> **Triaged-by:** Richard Dale Umayan; human; v1
> **Priority:** Medium
> **Type:** Improvement
> **Size:** S
> **Affects:** packages/tokens/src/semantic/base.json, packages/tokens/src/themes/dark.json, packages/tokens/src/README.md
> **Date:** 2026-08-21
> **Created-by:** sdlc-studio file
> **Raised-by:** sdlc-studio; agent; v1
> **Raised-in-batch:** none open - raised outside a delivery batch

## Summary

TRD Section 6 enumerates the tier 2 semantic families as neutral, accent, and selected, plus the four status intents across fg/bg/border, plus fg-readonly and two focus tokens. None of those names exist in the delivered token source. What shipped as placeholders in US-01M0GM9N is a different scheme: semantic.surface.*, semantic.text.*, semantic.border.*, semantic.action.*, semantic.spacing.*. Raised by the anton-reis seat reviewing US-01M0GM9N (finding F6), where it was classed a DISCLOSURE failure rather than a scope violation: the semantic layer is US-01M0GMAE's design decision, but the delivery shipped a contradicting scheme, recorded nine other deviations, and did not record this one. The packages/tokens/src/README.md compounded it by saying F00 replaces the VALUES while asserting the NAMES are the part that matters - which is exactly the part that diverges. Two related divergences from the same finding are already fixed and are NOT part of this CR: the missing --clara- prefix (PRD:244, TRD:298, D0001) and the src/tokens/ layout, both corrected during the review-repair pass.

## Impact

No consumer impact today: nothing is published and the values are placeholders. The risk is that US-01M0GMAE inherits a naming scheme nobody chose, and that the tier 2 NAMES are the one part of the token layer that becomes permanent at first publish. A semantic family set decided by accident, in a story about build pipelines, is the kind of thing that is discovered after it cannot be changed.

## Acceptance Criteria

- [ ] The tier 2 family set in packages/tokens/src/semantic/ either matches TRD Section 6's enumeration, or the TRD is amended with a recorded decision explaining the replacement scheme.
- [ ] packages/tokens/src/README.md states which parts of the token source are placeholder and which are a real commitment, without asserting that the names are settled while they diverge from the TRD.
- [ ] A guard or a story AC asserts the tier 2 family set matches whichever enumeration is authoritative, so the two cannot drift again silently.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Raised |
