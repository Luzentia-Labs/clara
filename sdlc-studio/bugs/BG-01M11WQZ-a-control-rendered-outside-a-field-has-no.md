# BG-01M11WQZ: A control rendered outside a Field has no accessible name, and nothing warns - for role=combobox it is none at all

> **Status:** inbox
> **Created:** 2026-08-27
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** packages/react/src/lib/field-context.ts, packages/react/src/lib/dev-warning.ts, scripts/check-dev-warnings.mjs
> **Severity:** Medium
> **Points:** 3

## Summary

Every Clara form control expects a `Field` to own its label - `Input`'s docblock states it plainly and Input has no standalone tests at all, only `inField(...)` ones. Outside a Field, `fieldAriaProps` returns `{}` and the control gets no `aria-labelledby`.

For a text input that is a poor accessible name. For `Select` it is NONE. The trigger carries `role="combobox"`, and combobox is not a name-from-content role - so the visible value text inside the button does not become the name the way it would for a plain button. Measured while writing Select's axe assertion: rendered standalone, axe reports `[critical] button-name: Buttons must have discernible text`. A screen reader announces "combobox" and stops.

Nothing in the library warns about it. The type does not require a Field, no runtime check notices the missing wiring, and the component renders and behaves perfectly - it simply has no name. `<Select options={...} />` is the first thing a developer writes, it looks right, and it is a WCAG 4.1.2 failure.

The same hazard exists for every control, which is why this is filed against the shared mechanism rather than against Select: `Input`, `Textarea`, `NumberInput`, `PasswordInput`, `SearchInput`, `Checkbox`, `Switch` all take their name from a Field they are not required to have. Select is simply where the consequence is sharpest and where it was measured.

Combobox and MultiSelect will inherit it: both are `role="combobox"` too.

## Steps to Reproduce

1. Render a control with no Field:

```tsx
render(<Select options={[{ value: 'a', label: 'A' }]} />)
await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
```

-> `Error: 1 blocking accessibility violation(s): [critical] button-name: Buttons must have discernible text`, on `<button type="button" role="combobox" class="clara-select" aria-expanded="false" aria-haspopup="listbox">`.

2. Wrap it in `<Field label="Currency">` and the same assertion passes, with `toHaveAccessibleName('Currency')`.

3. `grep -n "if (!wiring)" packages/react/src/lib/field-context.ts` shows the branch: with no wiring and not disabled, `fieldAriaProps` returns `{}`. Nothing is wrong with that function - it cannot invent a label - but nothing downstream notices the absence either.

4. `grep -rn "devWarning" packages/react/src/components/*/[A-Z]*.tsx` returns DropdownMenu, NumberInput and Tooltip. No control warns about a missing Field.

## Proposed Fix

**A development warning at the control, on the shape that produces an unnamed control.**

`lib/dev-warning.ts` and its `check-dev-warnings.mjs` guard already exist for exactly this class - Tooltip warns on a non-focusable trigger, which is the same category of defect: the component works, and it is unreachable or unnamed for the people the API was shaped around.

The condition is narrow and cheap: no Field wiring AND no `aria-label` or `aria-labelledby` supplied directly. Put it at the CALL SITE behind `if (process.env.NODE_ENV === 'production') return`, because `devWarning`'s arguments are evaluated before the callee returns and a minifier cannot drop the message otherwise - `check-dev-warnings.mjs` proves that by bundling each caller and requiring the message to be gone.

**Do it in the shared helper, not per component.** `fieldAriaProps` is the one place that already knows both facts, and putting it there covers the eight controls at once rather than adding a warning to Select and leaving Input without one - which is how a fix for a class becomes a fix for an instance.

**Accept an escape hatch, and require it to be explicit.** A control genuinely used outside a Field can pass `aria-label`. The warning must not fire then, or it teaches people to ignore it - which `dev-warning.ts`'s own docblock names as the failure that makes a warning worthless.

**Do NOT make the Field mandatory at the type level.** It would be a breaking change to every shipped control, and it would refuse the legitimate standalone case that an explicit `aria-label` covers. The warning is the proportionate mechanism: it reaches a developer at the moment they write the shape, and it costs nothing at runtime.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-27 | sdlc-studio | Created via `new` (deterministic) |
