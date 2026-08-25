# EmptyState

```tsx
<EmptyState reason="empty" title="No invoices yet">
  Invoices appear here once a supplier submits one.
</EmptyState>

<EmptyState
  reason="filtered"
  title="No invoices match these filters"
  action={<Button onClick={clearFilters}>Clear filters</Button>}
/>
```

`reason` is required and there are exactly two values, because there are exactly two situations and
they call for opposite actions.

**`empty`** - there are no records. The way forward is to create one, or to wait for one to arrive
from wherever they come from.

**`filtered`** - records exist and none matched. The way forward is to change the filter.

Showing the wrong one is worse than showing nothing: a user told "No invoices yet" while a filter is
hiding forty of them will go and create a duplicate.

`action` is **required** on `filtered` and optional on `empty`. A filtered empty state with no way
out is a dead end - the data is there, and the only route back is remembering which filter you set.
An empty list with no create button is merely uneventful.

## Write the title for the case

The type forces you to pick a reason and to offer an escape route. It cannot force the words, and
the words are what the user actually reads:

| Reason | Write | Not |
| --- | --- | --- |
| `empty` | "No invoices yet" | "Nothing found" |
| `filtered` | "No invoices match these filters" | "Nothing found" |

"Nothing found" is accurate for both and useful for neither, because it describes the screen rather
than the situation.
