# BG-01M0W799: Dark theme does not declare color-scheme, so UA-painted controls render in light livery

> **Status:** Fixed
> **Triaged-by:** idris-vale; persona; v1
> **Created:** 2026-08-25
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** packages/react/src/styles.css, packages/react/src/theme/resolve.ts, packages/tokens/src/themes/dark.json
> **Severity:** Medium
> **Points:** 3
> **Verification depth:** functional

## Summary

Clara's dark theme never declares `color-scheme: dark`. `grep` finds `color-scheme` only as a MEDIA QUERY in `useSystemTheme.ts`; it is declared as a CSS property nowhere in the packages.

The consequence is not limited to autofill. `styles.css` sets `appearance: auto` on `.clara-checkbox`, `.clara-radio` and `.clara-switch`, so every user-agent-painted control in a dark Clara application renders in LIGHT-mode livery: checkbox and radio glyphs, scrollbars, the NumberInput spinners, date pickers, the password reveal, select popups.

Found by the ux seat while ruling on Input AC4 (D0097). It is a genuine inclusive-design defect, it is visible without a contrast meter, and the seat judged it worth more than the 1.5:1 border question that surfaced it.

## Steps to Reproduce

Render any Clara application with `data-clara-theme="dark"` and a Checkbox, Radio or Switch. The control's glyph and chrome are painted by the user agent in light livery against Clara's dark surface. Same for the page scrollbar and any native picker.

## Proposed Fix

Declare `color-scheme` alongside the theme attribute so the user agent paints its own controls to match - light under the light theme, dark under the dark one. Check the interaction with `useSystemTheme.ts` and confirm what it does to the autofill measurement in D0097 (the seat predicts a consumer-set `color-scheme: dark` moves `border-default` to 3.915:1, which is better, not worse).

## Observed before and after (2026-08-25, Chromium)

The first attempt to look at this used the autofill fixture, which shows nothing: it carries only
text inputs and a button, every one of them styled by Clara. **A page that cannot show the defect
cannot show the fix either**, so `/native-dark.html` was added - checkbox, switch, radios, a date
picker, a number spinner and a tall block that forces a scrollbar.

A/B by removing `color-scheme: dark` from the built stylesheet and reloading:

| Surface | Without the declaration | With it |
| --- | --- | --- |
| Unchecked checkbox | **white** box on the dark page | dark grey, matching the surface |
| Radio buttons | **white** circles | dark grey |
| Date picker's calendar icon | **dark on dark** - effectively invisible | light, and legible |

The date picker is the sharpest case: the user agent painted a dark glyph for a light theme it
believed it was in, onto Clara's dark surface, so the control's only affordance disappeared. No
contrast gate in this repo can see that, because Clara does not paint it.

## Verification depth: functional, and why not higher

The declaration is asserted in the BUILT stylesheets by
`packages/tokens/src/__tests__/color-scheme.test.ts` (5 tests), each proved to fail on its own
mutant: dropping the dark half, dropping the light half, and parking the dark scheme on `:root`
instead of the theme selector. The build itself refuses to emit a theme stylesheet it could not
place the declaration in.

Confirmed behaviourally in Chromium as well: on the dark fixture the input's used `color-scheme`
resolves to `dark` while `:root` stays `light`, which is the scoped case PRD F02 describes and the
one a `ClaraScope` depends on.

**Not `conversational`:** nothing here can see a user agent PAINT a control. jsdom renders no native
chrome and computes no layout, so what is asserted is the declaration and its scope, not the glyphs.
The appearance belongs to gate 7 (US-01M0GMZW), which now carries this alongside its other
browser-only claims.

## Specification delta

> The engagement floor (AGENTS.md): this touches more than one source file, so every existing
> requirement it interacts with is named here, with how each interaction is resolved, before code.

| # | Existing requirement | How this touches it | Resolution |
| --- | --- | --- | --- |
| 1 | **PRD:244 / D0001** - every custom property is `--clara-` prefixed, "no exceptions" | `color-scheme` is a standard property, not a custom one | Verified: both `check-token-output` and `check-stylesheets` match `--*` only, so neither is affected |
| 2 | **D0005** - all CSS emits inside `@layer clara.*` | The declaration lands in the theme stylesheets | It goes inside the existing `@layer clara.tokens` block, with the tokens it accompanies |
| 3 | **PRD F02** - a theme activates via `data-clara-theme` on ANY ancestor, not just `:root` | `color-scheme` must follow the scope, or a dark `ClaraScope` in a light page keeps light controls | Emitted on the same selector as the theme's tokens, so it scopes identically |
| 4 | **The light theme is the `:root` base** | Without a symmetric declaration, a UA in dark OS mode paints dark controls on Clara's LIGHT theme | Light declares `color-scheme: light` too. The bug is symmetric and fixing one half would be worse than fixing neither |
| 5 | **`useSystemTheme.ts`** reads `prefers-color-scheme` | Declaring the property does not change the media query - that reflects the OS, not the element | Asserted by test rather than assumed |
| 6 | **D0097 / Input AC4** - the autofill measurement | Chrome picks its autofill paint from the used colour scheme, so Clara declaring `dark` CHANGES what it paints in the dark theme | Re-measure and re-record. The ux seat predicted `border-default` reaches 3.915:1, i.e. better; that prediction is now Clara's own behaviour rather than a consumer's, so it must be measured rather than inherited |
| 7 | **`tokens.public.lock.json`** - tier 2 names are permanent public API | `color-scheme` is not a token | No lock change; asserted by the public-token gate staying at its current count |
| 8 | **jsdom computes no layout and paints no UA controls** | Nothing here can assert appearance | The declaration is the observable, as with SHAPE_CONTRACT. Stated plainly rather than dressed up |

## Acceptance Criteria

### AC1: Both themes declare a colour scheme

- **Given** the built token stylesheets
- **When** they are inspected
- **Then** the light base declares `color-scheme: light` and the dark theme declares
  `color-scheme: dark`, each inside its own theme selector and inside `@layer clara.tokens`
- **And** the dark declaration sits on `[data-clara-theme="dark"]`, so it follows a `ClaraScope`
  rather than only the document root (PRD F02)
- **Verify:** vitest "the theme declares a colour scheme"

### AC2: The media query still reports the OS, not the element

- **Given** `useSystemTheme`
- **When** Clara declares `color-scheme` on its own elements
- **Then** `prefers-color-scheme` continues to resolve from the operating system, so an explicit
  Clara theme does not feed back into system-theme detection
- **Verify:** vitest "prefers-color-scheme dark"

### AC3: The autofill measurement is re-recorded, not inherited

- **Given** D0097's measurement of Chrome's autofill paint
- **When** Clara declares `color-scheme: dark`
- **Then** the dark-theme autofill figures in the Input verification record are updated to say that
  the fill is now Clara-influenced, and that the previously recorded prediction was a prediction
- **Verify:** manual confirm the Input verification record states the dark autofill paint is affected by Clara's own colour-scheme declaration

## Impact

Every UA-painted control in every dark Clara application. Affects Checkbox, Radio and Switch directly, and scrollbars and native pickers across the board.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-25 | sdlc-studio | Created via `new` (deterministic) |
