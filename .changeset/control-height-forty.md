---
"@luzentialabs/clara-tokens": minor
"@luzentialabs/clara-react": minor
---

Scoped theming and density now reach component styles, and the comfortable control height is 40px.

**Tier 3 aliases re-resolve inside a scope.** They were declared once at `:root`, so a `var()`
reference resolved against the root's light, comfortable tier 2 and the resulting literal
inherited. A `<ClaraScope theme="dark">` on a light page changed tier 2 correctly but nothing
downstream followed, so a secondary Button inside it rendered white on a dark surface. The
referencing aliases are now re-declared on the scope roots, where they resolve against their own
subtree's tier 2.

**`--clara-size-control-height` is 40px in comfortable, was 48px.** PRD:308 specifies 40px; the
token referenced a 48px step on the spacing scale. It now reads from a size scale of its own.
Compact is unchanged at 32px. Vertical rhythm built on the comfortable control height moves by
8px per control.

`.clara-button--md.clara-button--icon-only` takes the control height instead of the 24px target
minimum, which had made IconButton density-invariant. `sm` controls and Textarea take their floor
from `--clara-size-target-min` rather than from a spacing token that density re-tunes as a gap.
