# Input

A single-line text control.

```tsx
<Field label="Supplier reference">
  <Input value={ref} onChange={(e) => setRef(e.currentTarget.value)} />
</Field>
```

`onChange` receives the native event, not a bare value: Clara does not invent a change convention
where the platform already has one.

## Affixes, clearing and a character count

```tsx
<Field label="Amount">
  <Input prefix="£" suffix="per unit" />
</Field>

<Field label="Search reference">
  <Input clearable onClear={rerun} />
</Field>

<Field label="Short description">
  <Input maxCount={120} />
</Field>
```

- **`prefix` / `suffix`** are decoration. They are `aria-hidden`, because a screen reader reading
  "pound, Amount, edit text" ahead of every amount is noise. If the affix carries meaning the field
  does not otherwise convey, put it in the Field's `description`, where it is announced once.
- **`clearable`** renders a clear button *only when there is a value*, and returns focus to the
  input when pressed - the button is about to be removed from the page, and a keyboard user left
  standing on it has nothing to arrow to. Its accessible name composes "Clear" with the Field's own
  label, so a form with several clearable inputs is not a row of identical "Clear" buttons.
  `onClear` fires after the value is gone and focus has returned.
- **`maxCount`** shows a live count and adds it to the field's description. It deliberately does
  **not** set `maxLength`: a hard cut-off silently discards the end of a paste, which is how a user
  loses half a reference without noticing. The count is announced politely, and only once the user
  is near the limit - a live region firing on every keystroke is unusable. Over the limit it turns
  danger-coloured; enforcing the limit is the form's decision, not the control's.

## Readonly is not disabled

They look similar and they are not the same state.

| State | Tab stop | Selectable | Contrast |
| --- | --- | --- | --- |
| **Readonly** | Yes | Yes | Full. WCAG exempts *disabled* text from the contrast minimum; Clara does not extend that to readonly, because readonly text exists to be read. |
| **Disabled** | Yes (`aria-disabled`, see Field) | Yes | Full - Clara does not take the exemption here either. |

Reach for readonly when the value is meaningful and fixed, and disabled when the field is not
applicable yet.

## Autofill

The browser applies its own background through a UA stylesheet. Clara overrides it so the field
still reads as a Clara control. This is checked by hand in Chrome and Safari, because jsdom does not
implement the pseudo-class and it is not drivable in a headless browser.
