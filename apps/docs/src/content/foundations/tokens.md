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

## Stacking

Clara's overlays share one layer, and the browser decides which of two is on top.

| Token | Value | Use |
| --- | --- | --- |
| `--clara-layer-base` | 0 | Page content. The scale is measured from here rather than floating above it |
| `--clara-layer-raised` | 10 | In-document chrome that lifts off the page - a sticky table header |
| `--clara-layer-overlay` | 1000 | Every portalled surface: modal, drawer, popover, menu, listbox, and a modal's scrim |
| `--clara-layer-tooltip` | 1400 | Above every overlay, because a tooltip describes whatever is on top |
| `--clara-layer-toast` | 1500 | Above everything, because a toast may be the only report that something failed |

There is deliberately no per-role layer - no `modal` name, no `popover` name. Which of two overlays
paints on top depends on which was opened last, and a constant cannot express that: a menu must sit
UNDER a modal opened over it, and OVER a modal opened from inside it. The same number cannot be
right in both directions.

So Clara gives every portalled surface the one `overlay` layer and lets the browser resolve it.
Among positioned elements with equal `z-index`, later in tree order paints later - and `ClaraPortal`
appends its host to `document.body` **at the moment the overlay opens**, so the last thing opened is
the last sibling. It removes the host when the overlay closes, which is what keeps open order and
DOM order the same thing.

### What this asks of your application

**Keep your own chrome below 1000.** A sticky header or a third-party widget at `z-index: 9999`
covers every Clara overlay. `--clara-layer-raised` (10) is there for in-document chrome; the range
between 10 and 1000 is yours.

**If you portal your own overlays, append them to `document.body` when they open** - not at mount.
A host created once and held for the page's lifetime pins its position to mount order, so it paints
under an overlay opened long after it. This is the one thing the model depends on.
