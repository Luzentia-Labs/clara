# Layout primitives

`Box`, `Stack`, `Inline` and `Grid`. Four ways to place things, all drawing their spacing from the
token scale and none of them adding semantics.

```tsx
<Stack gap="md">
  <Inline gap="sm"><Badge /><Text>Draft</Text></Inline>
  <Grid columns={2} gap="md">{fields}</Grid>
</Stack>
```

## They are transparent

None of them takes a tab stop, handles a key, or applies a role. A layout primitive that captured
focus would be a bug: it wraps content and must leave keyboard order to the DOM. Use `as` when the
region needs meaning - the primitive does not guess one for you.

## Spacing is `gap`, never margins

Collapsing and doubling margins are the two ways spacing silently changes when a child is swapped,
and `gap` on a flex or grid container has neither. `Inline` wraps by default rather than overflowing,
so a long row reflows at narrow widths and under a large text-size preference instead of being
clipped.

`Grid` keeps visual column order and DOM order the same. CSS Grid can reorder visually, and doing so
leaves the reading and tab order disagreeing with what is on screen.
