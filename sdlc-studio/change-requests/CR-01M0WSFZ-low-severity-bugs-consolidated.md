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

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-25 | sdlc-studio | Consolidation opened |
