# Heading and Text

## Heading

`level` sets the element (`h1`-`h6`); `size` sets the appearance. They are deliberately separate.

```tsx
<Heading level={2} size="lg">Purchase order</Heading>
```

Tying them together forces the author to break either the document outline or the visual hierarchy,
and in practice the outline is the one that loses - which is what makes heading navigation useless
for a screen reader user.

## Text

```tsx
<Text numeric>1,240.00</Text>
<Text truncate fullValue="A very long supplier reference">A very long…</Text>
```

- `numeric` gives tabular figures, so a column of amounts lines up without a monospace face. In an
  ERP that is most columns.
- `truncate` **requires** `fullValue`, at the type level - the props are a discriminated union, so `<Text truncate>` alone does not compile. `title` appears only on hover, so a
  truncated value that is not focusable cannot be read without a pointer; truncating makes the
  element focusable and gives it the full text as its accessible name (D0028).
