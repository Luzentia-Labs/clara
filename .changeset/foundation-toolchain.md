---
"@luzentialabs/clara-tokens": minor
"@luzentialabs/clara-icons": minor
"@luzentialabs/clara-react": minor
---

Establish the build, packaging and token foundations.

All three packages build to ESM and CJS with separate `.d.ts` and `.d.cts`, so a `require` consumer
receives CommonJS-shaped declarations. Exports maps are closed and carry no wildcard; every tarball
ships its licence text.

`clara-tokens` emits its first real palette: six OKLCH ramps capped to the sRGB gamut, a
`--clara-`-prefixed custom property for every token, a dark theme scoped to `[data-clara-theme]`,
and a two-part focus indicator that survives every enumerated surface in both themes.

All Clara CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components`, so a consumer's
unlayered class overrides Clara without `!important`.

No component is exported yet. Every named export is permanent at first publish, so the surface stays
empty until the stories that own it decide it.
