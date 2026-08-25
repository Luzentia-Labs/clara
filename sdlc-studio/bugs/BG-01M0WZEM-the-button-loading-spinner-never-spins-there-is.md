# BG-01M0WZEM: The Button loading spinner never spins - there is no animation anywhere in Clara

> **Status:** inbox
> **Created:** 2026-08-26
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** packages/react/src/styles.css, packages/tokens/src/primitive/base.json, packages/tokens/src/semantic/geometry.json, e2e/geometry.spec.ts, scripts/check-component-css.mjs
> **Severity:** major
> **Points:** 5

## Summary

`.clara-button__spinner` (`packages/react/src/styles.css:149`) draws a ring with a transparent top border - unmistakably the shape of a spinner - and nothing rotates it. There is **no `@keyframes` and no `animation` declaration anywhere in the shipped CSS**: `grep -c '@keyframes\|animation:' packages/react/dist/styles.css` returns `0`.

So `<Button loading>` renders a static, three-quarters-drawn circle. To a user it does not read as "working"; it reads as a rendering artefact, or as a control that has broken. The one visual cue that says the system is still doing something is the cue that is missing.

The accessible half is correct and is not in question: `loading` sets `aria-busy` and the label stays in the DOM so the button keeps its width. A screen-reader user is told. A sighted user is shown a frozen ring.

## Steps to Reproduce

1. `grep -c '@keyframes\|animation:' packages/react/dist/styles.css` -> `0`.
2. Read `packages/react/src/styles.css:149-156`: width, height, border, `border-top-color: transparent`, `border-radius` - no `animation`.
3. Render `<Button loading>Save</Button>` and watch it.

No test covers it. The only mention of the spinner in the suite is a comment in `matrix.test.tsx:129` about the LABEL keeping its width. `apps/docs/src/content/components/button.md:17` documents `aria-busy` and the width, and says nothing about motion, so the docs do not claim it either.

## Proposed Fix

Do not fix this one in isolation - it is the first instance of a foundation that four later components need, and fixing it alone would set the convention by accident.

Order: rule on the motion foundation first (tier 2 token family, and the reduced-motion policy for a component whose motion carries the meaning), then apply it here and to Spinner, Skeleton, ProgressBar and Toast together. The ruling belongs to the Idris (ux) seat - reduced-motion is inclusive design, which `AGENTS.md` puts in that seat explicitly - with the token shape going through Anton, exactly as D0098 split.

The assertion belongs in gate 9, since only a real browser resolves an animation. A useful shape: the spinner's computed `animation-name` is not `none` and its `animation-duration` is not `0s`, plus the reduced-motion counterpart asserted under an emulated `prefers-reduced-motion: reduce`, which Playwright can set directly.

## Impact

Bounded - a wrong-looking loading state, not a broken one - but it blocks more than itself, which is the reason to file rather than fold it into the component work.

Four components still to build need motion as their PRIMARY affordance: Spinner (US-01M0GMBC), Skeleton (US-01M0GMSQ), ProgressBar (US-01M0GMY3, indeterminate mode) and Toast (US-01M0GMK1, enter/exit). Every one of them will need the same thing, and none of it exists:

- **No tier 2 motion tokens.** Tier 1 has `duration.instant/fast/base` (0/120/200ms) and nothing else - no easing, no spin duration. Tier 2 has no motion family at all. Tier 2 is public API and permanent at publish (PRD F01), so the shape of that family is a one-way door.
- **No reduced-motion convention.** D0094 records that MODAL does not animate and therefore has no `prefers-reduced-motion` branch - "there is nothing to reduce". That is a decision about one component, not a project policy, and a spinner is the opposite case: the motion IS the information, so it cannot simply be removed under reduced-motion. What replaces it has to be decided.
- **No gate.** `check-component-css.mjs` has a `NO_MOTION` contract used to assert Modal declares none. Nothing asserts that a component which SHOULD animate does, and jsdom cannot see it - `getComputedStyle` in jsdom returns no animation, so this is gate 9's territory (a real browser), not the unit suite's.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-26 | sdlc-studio | Created via `new` (deterministic) |
