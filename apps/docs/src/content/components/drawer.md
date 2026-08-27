# Drawer

```tsx
<Drawer open={open} onClose={() => setOpen(false)} title="Filters" placement="right">
  <FilterForm />
</Drawer>
```

A panel attached to an edge. `placement` is `left`, `right` or `bottom`, defaulting to `right`.

**Focus behaves exactly as Modal's does**, because it is the same implementation, not a similar
one. Focus goes in, stays in, and comes back to whatever opened the drawer, including on the route
where the drawer unmounts rather than closes (`{open && <Drawer open .../>}`, or a router redirect).

`onClose` is called for every dismissal route: Escape, a scrim click, the close button, and whatever
your footer does. One callback rather than four, because a consumer who has to remember a fourth
route will forget, and the symptom is focus stranded on the page body.

`dismissible={false}` blocks Escape and the scrim click for a drawer that must be answered. It does
**not** remove the close button: a drawer with no way out is a trap, not a safeguard.

`initialFocus` takes a ref and wins over the first tabbable control, which is otherwise the close
button. Reach for it when the panel has one obvious starting point - a filter's first field, say -
and leave it alone otherwise.

`returnFocus` takes a ref and wins over the element that opened the drawer. It exists for the case
where the opener is gone by the time the drawer closes: a row action on a record the drawer just
deleted has nothing to return to, and without a named target focus falls back to the first element
that will take it.

## It slides, and Modal does not

A drawer has a spatial origin: it is attached to an edge, and where it came from is where it goes
back to. A centred dialog has no such origin, which is why Modal does not animate and this does.

It exits instantly, and under `prefers-reduced-motion: reduce` the slide is removed entirely - here
the motion is a nicety, not the information. You still know it opened: the viewport dims, focus
moves into the panel, and the page behind it goes inert.
