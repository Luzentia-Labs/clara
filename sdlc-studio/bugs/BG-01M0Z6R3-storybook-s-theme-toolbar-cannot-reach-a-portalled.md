# BG-01M0Z6R3: Storybook's theme toolbar cannot reach a portalled overlay - two ClaraSettingsContext instances

> **Status:** inbox
> **Created:** 2026-08-26
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** apps/storybook/.storybook/preview.tsx, apps/storybook/.storybook/main.ts
> **Severity:** Medium
> **Points:** 3

## Summary

Storybook's theme toolbar cannot reach any PORTALLED surface. With `?globals=theme:dark`, the `ClaraScope` div reads `dark` while the `ClaraPortal` root reads `light`.

Cause, measured by a review seat: `apps/storybook/.storybook/preview.tsx` imports `ClaraProvider` and `ClaraScope` from the BUILT package `@luzentialabs/clara-react`, while the stories import their components from SOURCE. That is two copies of the module, so two `ClaraSettingsContext` instances - the provider writes to one and `ClaraPortal` reads the other, falling back to its default.

**Why it matters beyond Storybook.** The definition of done requires a visual baseline in both themes and both densities (gate 7, US-01M0WSME, still unwired). When it IS wired, every overlay's dark-theme shot would be taken in light theme and nobody would know, because the surrounding page WOULD be dark - the screenshot looks plausible and is wrong.

It also cost a real assertion in this run. An e2e contrast test written against `?globals=theme:dark` PASSED with `.clara-popover`'s `color` deleted - vacuous, because the panel was never dark. The assertion was rewritten to drive a static fixture built from the shipped stylesheets instead, which is sensitive (it reproduces 1.26:1). So the workaround exists, but any future browser assertion about a portalled surface's THEME has the same trap waiting.

Candidate fixes: have `preview.tsx` import from source like the stories do; or alias `@luzentialabs/clara-react` to `packages/react/src` in the Storybook vite config so there is one module instance either way. The second is the more robust, because it fixes every such import rather than the two that are known.

Suggested verification: a Playwright assertion that with `globals=theme:dark`, the `data-clara-theme` on the PORTAL root equals `dark` - it currently reads `light`.

## Steps to Reproduce

{{steps}}

## Proposed Fix

{{fix}}

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-26 | sdlc-studio | Created via `new` (deterministic) |
