# BG-01M0W799: Dark theme does not declare color-scheme, so UA-painted controls render in light livery

> **Status:** inbox
> **Created:** 2026-08-25
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** packages/react/src/styles.css, packages/react/src/theme/resolve.ts, packages/tokens/src/themes/dark.json
> **Severity:** Medium
> **Points:** 3

## Summary

Clara's dark theme never declares `color-scheme: dark`. `grep` finds `color-scheme` only as a MEDIA QUERY in `useSystemTheme.ts`; it is declared as a CSS property nowhere in the packages.

The consequence is not limited to autofill. `styles.css` sets `appearance: auto` on `.clara-checkbox`, `.clara-radio` and `.clara-switch`, so every user-agent-painted control in a dark Clara application renders in LIGHT-mode livery: checkbox and radio glyphs, scrollbars, the NumberInput spinners, date pickers, the password reveal, select popups.

Found by the ux seat while ruling on Input AC4 (D0097). It is a genuine inclusive-design defect, it is visible without a contrast meter, and the seat judged it worth more than the 1.5:1 border question that surfaced it.

## Steps to Reproduce

Render any Clara application with `data-clara-theme="dark"` and a Checkbox, Radio or Switch. The control's glyph and chrome are painted by the user agent in light livery against Clara's dark surface. Same for the page scrollbar and any native picker.

## Proposed Fix

Declare `color-scheme` alongside the theme attribute so the user agent paints its own controls to match - light under the light theme, dark under the dark one. Check the interaction with `useSystemTheme.ts` and confirm what it does to the autofill measurement in D0097 (the seat predicts a consumer-set `color-scheme: dark` moves `border-default` to 3.915:1, which is better, not worse).

## Impact

Every UA-painted control in every dark Clara application. Affects Checkbox, Radio and Switch directly, and scrollbars and native pickers across the board.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-25 | sdlc-studio | Created via `new` (deterministic) |
