# Token sources

Read this before changing anything here.

## Tiers

| File | Tier | Public? |
| --- | --- | --- |
| `primitive/base.json` | 1 - primitives | **No.** Private, never public API (PRD F01). |
| `semantic/base.json` | 2 - semantic | **Yes.** A rename here is a breaking change for every consumer. |
| `themes/dark.json` | 2 override | Same names, different tier 1 references. That is the whole theming contract (PRD F02). |
| `pairings.json` | - | Build-time input to the contrast gate. Written to `build/`, never `dist/` (D0029). |

## These values AND these tier 2 names are placeholders

The real visual language is decided by **US-01M0GMN0 (F00)**, which replaces the *values*
wholesale. US-01M0GM9N shipped them only so the pipeline had something to compile.

**The tier 2 family names here do NOT match TRD Section 6.** The TRD enumerates `neutral`,
`accent`, `selected`, four status intents across `fg`/`bg`/`border`, `fg-readonly`, and two focus
tokens. What is here - `surface`, `text`, `border`, `action`, `spacing` - is a different scheme
that arrived as a side effect of a build-pipeline story rather than as a design decision.
Tracked as **CR-01M0J0Z6**; the semantic layer belongs to US-01M0GMAE.

This matters more than the values do: tier 2 names are public API (PRD F01) and become permanent
at first publish. Nothing is published yet, so nothing is permanent until US-01M0GMWF cuts the
first release - which is exactly the window in which to fix it.

## Do not put comments in the JSON

Style Dictionary parses every key as a token. A `_comment` key becomes a token, collides across
files, and lands in the output. Comments belong in this file.
