# Combobox

```tsx
<Field label="Supplier">
  <Combobox
    options={suppliers}
    value={supplier}
    onValueChange={setSupplier}
  />
</Field>
```

A text input that filters a list. Reach for it when the list is long enough that scanning it is worse
than typing three letters; reach for `Select` when it is not.

## Put it in a Field

Like every Clara control, and for a sharper reason than most: the input is a `role="combobox"`, and
that role does not take its accessible name from anything around it. Outside a Field it has **no
name at all**.

## Above about 500 options, load asynchronously

Pass `onQueryChange` and hand back the options to show:

```tsx
<Combobox
  options={results}
  status={loading ? 'loading' : failed ? 'error' : 'idle'}
  onQueryChange={runSearch}
  onValueChange={setSupplier}
/>
```

Supplying `onQueryChange` turns off local filtering entirely - you own the query and the results, and
Clara will not second-guess them by filtering again.

Past **500** local options with no `onQueryChange`, Clara warns in development and tells you this.
Nothing is truncated: a list that silently drops entries is worse than a slow one. There is no
virtualization, and that is deferred rather than forgotten (D0019).

## The three async states are all announced

`status` is `idle`, `loading` or `error` - a closed set, because "loading and error at once" is not a
state anything can render. Each one reaches a screen-reader user through a live region that is
present from the start and empty until there is something to say. A region that appears at the same
moment as its text is commonly not announced at all, which is exactly the announcement you cannot
afford to lose here.

`emptyMessage` and `errorMessage` are yours to write. The defaults are deliberately bland, because
Clara does not know what failed.

## Groups get real names

```tsx
options={[
  { value: 'gbp', label: 'Pound sterling', group: 'Europe' },
  { value: 'usd', label: 'US dollar', group: 'Americas' },
]}
```

Each group renders `role="group"` labelled by the heading you can see, not a duplicate string that
can drift from it. Arrowing crosses group boundaries in one continuous run, because the highlight is
one position in one list - which is also what lets `aria-activedescendant` name it.

## Typing does not jump the highlight

In a `Select`, letters jump to a matching option. Here they are the query, and only the query. Both
behaviours on the same keys would mean every keystroke filtered the list *and* moved the highlight
somewhere else.
