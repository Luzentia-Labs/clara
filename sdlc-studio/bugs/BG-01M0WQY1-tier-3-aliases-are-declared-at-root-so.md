# BG-01M0WQY1: Tier-3 aliases are declared at :root, so scoped theming and density never reach components

> **Status:** Fixed
> **Triaged-by:** Claude Opus 5; agent; claude-opus-5
> **Created:** 2026-08-25
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** packages/tokens/style-dictionary.config.js, packages/tokens/dist/tokens.css, packages/react/src/styles.css, e2e/geometry.spec.ts, scripts/check-component-css.mjs
> **Severity:** critical
> **Points:** 8

## Summary

`packages/tokens/dist/tokens.css` declares **34 tier-3 component aliases under `:root`, 29 of which are `var()` references to tier 2** - `--clara-button-padding-y: var(--clara-space-control-padding-y)`, `--clara-button-secondary-bg: var(--clara-color-bg-surface)`, and so on. Neither `themes/dark.css` nor `themes/compact.css` redeclares any of them (0 and 0).

A custom property that references another is substituted at **computed-value time on the element where it is declared**. Declared on `:root`, `--clara-button-secondary-bg` computes once against the root's light-theme tier 2, becomes the literal `#ffffff`, and *that literal* inherits. A descendant `<ClaraScope theme="dark">` redefines `--clara-color-bg-surface` on itself, which is far too late: the alias was resolved at the root.

So per-subtree theming - PRD F02, TRD ADR-006 - silently does not work for any component styled through a tier-3 alias. Component CSS references **26 distinct tier-3 variables**.

## Steps to Reproduce

Render a secondary Button at root and the same Button inside `<ClaraScope theme="dark">`, in a real browser, and read the computed values on each button:

```text
light: renderedBg rgb(255,255,255)  tier2 bg-surface #ffffff  tier2 fg-default #1f1e1d  tier3 button-secondary-bg #ffffff
dark:  renderedBg rgb(255,255,255)  tier2 bg-surface #1f1e1d  tier2 fg-default #ffffff  tier3 button-secondary-bg #ffffff
```

The scope itself works: tier 2 flips correctly in both directions. The tier-3 alias does not move, so the rendered background stays white. **A secondary Button inside a dark scope is white on a dark surface.**

The same mechanism in the density dimension is measurable on the geometry gate: in a compact scope a Button's computed `padding-top` is 8px (the comfortable value) while an Input's, which references tier 2 directly, is correctly 4px.

## Proposed Fix

Tier-3 aliases must be re-resolved wherever tier 2 is re-declared. The generated block currently reads `:root { ... }`; it needs to be emitted under a selector list that also matches every scope root, so the aliases recompute inside a scope:

```text
:root,
[data-clara-theme],
[data-clara-density] { /* tier-3 aliases */ }
```

Options considered and why not: making components reference tier 2 directly would work but discards the tier-3 layer PRD F01 requires and is a change to 26 references rather than one emit rule; duplicating the aliases into each theme file would drift.

Whichever lands, the guard has to come with it - a browser assertion that a tier-3-styled component actually changes inside a nested scope, in both the theme and the density dimension. Without that, the next alias added at `:root` reintroduces this silently.

## Impact

Critical, and it is the feature rather than an edge of it. Per-subtree theming is a headline PRD capability with its own ADR, and a dark scope on a light page is the canonical example in both. It renders unreadable for every component that reaches tier 3.

Why nothing caught it: jsdom does not resolve `var()` at all, so `getComputedStyle` in the existing theming tests can only observe that the right data attributes are on the right elements - which they are. The bug lives entirely in value resolution, which only a real browser performs. This is BG-01M0WQ0X's thesis holding in the colour dimension as well as the geometry one, and it was found within minutes of the first browser gate existing.

It is also cheap now and expensive later: tier 2 is public API and the package is not yet published.

## Acceptance Criteria

- **AC1** - A component styled through a tier 3 alias changes with a nested `<ClaraScope>` in BOTH
  dimensions: its computed background follows a `theme` scope, and its computed padding follows a
  `density` scope. Asserted as a relationship (tier 3 equals its own scope's tier 2) rather than as
  literal colours, so re-tuning the palette cannot make it red for the wrong reason.
- **Verify:** shell pnpm check:scoping
- **Verified:** yes (2026-08-25)

- **AC2** - EVERY `var()`-referencing tier 3 alias is re-declared for scopes, not just the two the
  browser assertions sample. An alias added at `:root` alone - the way this bug arrived - fails even
  though no test renders the component that uses it.
- **Verify:** shell pnpm check:scoping
- **Verified:** yes (2026-08-25)

## Verification

**Verified by:** Claude Opus 5 (agent)

**Verification date:** 2026-08-25

**Verification depth:** functional

Observed in Chromium before and after. Before: a secondary Button inside `<ClaraScope theme="dark">` computed `rgb(255,255,255)` on a dark surface, with tier 2 at `#1f1e1d` and tier 3 stuck at `#ffffff`. After: `rgb(31,30,29)` with white text, tier 3 tracking tier 2. Mutation-checked: stripping the emitted scope block from `dist/tokens.css` turns all three `check:scoping` assertions red, and a rebuild turns them green. The density half was confirmed independently - `compact/button-md` dropped out of the geometry gate's failure list once the fix landed, correcting 36px to 32px.

**Not yet adversarially reviewed.** This records that the fix was observed working, not that a second seat has signed it off - the author never records their own review. It stays at Fixed until that lands.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-25 | sdlc-studio | Created via `new` (deterministic) |
