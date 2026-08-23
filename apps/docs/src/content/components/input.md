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
- **`maxCount`** shows a count and adds it to the field's description, where it is read on demand.
  The count itself is **not** a live region - one that rewrites on every keystroke is unusable. A
  separate, always-present announcer stays empty until the limit is reached, then says "limit
  reached" - and past it, how many characters over. That last part does rewrite as you type, which
  is a deliberate trade: once you are over, the number is the useful part. Pasting straight past the
  limit skips "limit reached" and announces the overage directly. It deliberately does
  **not** set `maxLength`: a hard cut-off silently discards the end of a paste, which is how a user
  loses half a reference without noticing. Over the limit the count turns danger-coloured;
  enforcing the limit is the form's decision, not the control's.

## Readonly is not disabled

They look similar and they are not the same state.

| State | Tab stop | Selectable | Contrast |
| --- | --- | --- | --- |
| **Readonly** | Yes | Yes | Full. WCAG exempts *disabled* text from the contrast minimum; Clara does not extend that to readonly, because readonly text exists to be read. |
| **Disabled** | Yes (`aria-disabled`, see Field) | Yes | Full - Clara does not take the exemption here either. |

Reach for readonly when the value is meaningful and fixed, and disabled when the field is not
applicable yet.

## Autofill

The browser applies its own background through a UA stylesheet, and **Clara does not currently
override it** - a `:-webkit-autofill` rule was documented before it was written, and the honest
statement is that an autofilled field takes the browser's yellow. It is a stated gap on the Input
verification record rather than a claim.
