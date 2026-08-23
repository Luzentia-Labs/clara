# SearchInput

A single-line text control for filtering a list. `type="search"`, so assistive technology announces
it as a search field rather than a generic textbox, and the clear button is Clara's own - not the
browser's, which is unstyled, absent in Firefox, and not keyboard reachable in Safari.

```tsx
<Field label="Find a supplier">
  <SearchInput value={query} onChange={(e) => setQuery(e.currentTarget.value)} />
</Field>
```

## Clearing

The clear button appears when there is a value, and it **returns focus to the input**. That is not a
detail: a clear button that keeps focus leaves a keyboard user standing on a control that has just
disappeared, with nothing to arrow to. Its accessible name is "Clear search" regardless of the field
label, because the label already names the field.

## Debouncing is your decision, not Clara's

**Clara does not debounce.** `onChange` fires on every keystroke, exactly as the native control
does. This is guidance, not policy, and the distinction matters:

- A **local filter** over data already in memory should not be debounced at all. Debouncing it adds
  latency to an operation that had none, and the list visibly lags the typing.
- A **server query** should be debounced, typically 250-400ms, and the request that comes back must
  be discarded if a newer one has been issued since. Debounce alone does not prevent an older
  response overwriting a newer one.

Clara cannot know which of those you are doing, and a component that debounces by default makes the
first case worse while only half-solving the second. Own the timing in your own code:

```tsx
const [query, setQuery] = useState('')
const deferred = useDeferredValue(query)   // local filtering
useEffect(() => {                          // or: a server query
  const id = setTimeout(() => void search(query), 300)
  return () => clearTimeout(id)
}, [query])
```

If you debounce, keep the **input** controlled and immediate - debounce the *effect*, never the
displayed value. A debounced value makes the field feel broken, because the characters appear late.

## Accessibility

- Announced as a search field (`role="searchbox"`).
- The clear button is in the tab order and reachable with Enter or Space.
- No `role="search"` landmark is applied. That names a region of the page, which is the page
  author's decision, not the control's.
