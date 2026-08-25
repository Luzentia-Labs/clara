# CR-01M0WSFZ: Low-severity bugs (consolidated)

> **Status:** inbox
> **Priority:** Low
> **Type:** Improvement
> **Date:** 2026-08-25
> **Consolidation:** low-severity-bugs
> **Created-by:** sdlc-studio file
> **Raised-by:** sdlc-studio; agent; v1

## Summary

A themed consolidation of Low-severity findings that individually do not warrant a standalone artefact (triage noise control, schema v3). Triage the batch, then action or reject as one.

## Impact

Each finding here is Low-severity on its own; the batch is triaged, then actioned or rejected as one. Left unconsolidated, the same findings would each mint an artefact and drown the real signal.

**Points:** 3

## Consolidated Findings

- **Textarea calls useLayoutEffect unguarded, so it warns on every server render**: `packages/react/src/components/Textarea/Textarea.tsx:41` calls `useLayoutEffect(resize, [resize, rest.value])` directly. React emits a warning for every server render:

  > Warning: useLayoutEffect does nothing on the server, because its effect cannot be encoded into the server renderer's output format. This will lead to a mismatch between the initial, non-hydrated UI and the intended UI.

  The repo already has the fix and does not use it here. `packages/react/src/theme/ClaraPortal.tsx:26` picks the hook at module scope for exactly this reason, with the rationale written above it:

  ```ts
  const useHostEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect
  ```

  So the pattern is established, documented, and applied in one of the two places that needs it.
- **Interactive control labels and field help text render at the 12px caption size**: PRD:333 states the rule: *"Body text minimum is 14px; no Clara component renders text below 12px, and 12px is reserved for non-essential metadata only."* `design/foundations.md:219` puts it the same way - "12px only for genuinely non-essential metadata".

  Three pieces of text take `--clara-font-caption` (12px) today, and none of them is obviously non-essential metadata:

  | Element | What it says | Why it is questionable |
  | --- | --- | --- |
  | `.clara-password__toggle` | "Show password" / "Hide password" | The visible, underlined, link-coloured label of an INTERACTIVE control. A user has to read it to operate the control. |
  | `.clara-search__clear` | "Clear search" | Same - a visible interactive control label. |
  | `.clara-field__description` | e.g. "As it appears on the invoice" | Instructional help text. A user reads it to fill the field correctly. |

  All three are painted, not screen-reader-only - measured at 12px in Chromium in both densities.
- **A Tooltip on a Toast action button renders underneath the toast**: The tier 2 layer scale places `layer.tooltip` at `{layer.3}` = 1400 and `layer.toast` at `{layer.4}` = 1500. Each token's own comment states a rule, and the two rules contradict each other in one composition:

  - `tooltip`: *"Above every overlay regardless of open order, because a tooltip describes whatever is currently on top."*
  - `toast`: *"Above everything, because a toast may be the only report that something failed."*

  A Toast may carry an action - "Retry", "Undo", "View" - and that action may have a tooltip. The tooltip then describes the thing currently on top and renders under it, which is the one case where a tooltip is useless: it is covered by exactly the element it explains.

  Neither component exists yet, so nothing is broken today. The tokens that decide it are tier 2, public and permanent at publish.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-25 | sdlc-studio | Consolidation opened |
