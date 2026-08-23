# Input

A single-line text control.

```tsx
<Field label="Supplier reference">
  <Input value={ref} onChange={(e) => setRef(e.currentTarget.value)} />
</Field>
```

`onChange` receives the native event, not a bare value: Clara does not invent a change convention
where the platform already has one.

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
