# Design tokens

Clara ships three tiers of token. **Only one of them is public.**

| Tier | Example | Public? |
| --- | --- | --- |
| 1. Primitive | `color-neutral-600` (a raw ramp step) | **No** - private, and **may change in a minor** |
| 2. Semantic | `--clara-color-fg-default` | **Yes** - covered by the breaking-change rule |
| 3. Component | `button-primary-bg` (a component internal) | **No** - private, and **may change in a minor** |

Build against tier 2. A primitive is a colour that happens to be the right colour today; a semantic
token is a promise about what a colour is *for*, and only the promise is stable.

That is not advice, it is enforced: `scripts/check-public-tokens.mjs` fails CI when anything in the
docs or a published example references a token outside `tokens.public.json` (D0007, TRD Section 9
gate 8). If you find yourself reaching for a primitive, the semantic layer is missing a token -
that is a change request, not a workaround.

The two private examples above are deliberately written without their `--clara-` prefix. These docs
should not hand you a copy-pasteable private token, and the gate that enforces that is the same one
described in the paragraph above - it does not exempt itself.

## The public set

### Foreground

| Token | Use |
| --- | --- |
| `--clara-color-fg-accent` | The `accent` role |
| `--clara-color-fg-danger` | The `danger` role |
| `--clara-color-fg-default` | Body text and the default value for its group |
| `--clara-color-fg-disabled` | Disabled text. Clara exceeds WCAG here deliberately |
| `--clara-color-fg-info` | The `info` role |
| `--clara-color-fg-link` | Links, alongside a non-colour affordance |
| `--clara-color-fg-muted` | Secondary text - never the only carrier of meaning |
| `--clara-color-fg-on-emphasis` | Text on any `-emphasis` surface |
| `--clara-color-fg-readonly` | Readonly field text. Full contrast, not exempt (F09) |
| `--clara-color-fg-success` | The `success` role |
| `--clara-color-fg-warning` | The `warning` role |

### Background

| Token | Use |
| --- | --- |
| `--clara-color-bg-accent-emphasis` | The `accent-emphasis` role |
| `--clara-color-bg-accent-subtle` | The `accent-subtle` role |
| `--clara-color-bg-canvas` | The page behind everything |
| `--clara-color-bg-danger-emphasis` | The `danger-emphasis` role |
| `--clara-color-bg-danger-subtle` | The `danger-subtle` role |
| `--clara-color-bg-disabled` | Disabled text. Clara exceeds WCAG here deliberately |
| `--clara-color-bg-info-emphasis` | The `info-emphasis` role |
| `--clara-color-bg-info-subtle` | The `info-subtle` role |
| `--clara-color-bg-row-hover` | A table row under the pointer |
| `--clara-color-bg-row-striped` | Alternating table rows |
| `--clara-color-bg-selected` | A selected row or option |
| `--clara-color-bg-selected-hover` | A selected row under the pointer - selection stays visible |
| `--clara-color-bg-subtle` | Recessed areas within a surface |
| `--clara-color-bg-success-emphasis` | The `success-emphasis` role |
| `--clara-color-bg-success-subtle` | The `success-subtle` role |
| `--clara-color-bg-surface` | Cards, panels, table bodies |
| `--clara-color-bg-warning-emphasis` | The `warning-emphasis` role |
| `--clara-color-bg-warning-subtle` | The `warning-subtle` role |

### Border

| Token | Use |
| --- | --- |
| `--clara-color-border-default` | Body text and the default value for its group |
| `--clara-color-border-focus` | The outer focus ring (two-part indicator) |
| `--clara-color-border-focus-offset` | The inner focus gap (two-part indicator) |
| `--clara-color-border-selected` | A selected row or option |
| `--clara-color-border-strong` | A boundary that must read as deliberate |

## Themes

Every token above resolves per theme. The dark theme overrides tier 2 only, referencing tier 1
through `var()` - so a consumer who overrides a primitive gets a consistent result in both themes
rather than one that silently only works in light.

Set `data-clara-theme="dark"` on any element to theme its subtree.

## Contrast

Every legal foreground/background pairing in Clara is enumerated and measured in both themes, and
CI fails on any that misses its threshold - 4.5:1 for text, 3:1 for non-text, per WCAG 2.2 AA.
Nothing is waived. A pairing that is not listed is documented as unsupported, which is a real
answer and a testable one.
