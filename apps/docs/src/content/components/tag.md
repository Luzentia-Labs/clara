# Tag

```tsx
<Tag>Draft</Tag>
<Tag intent="warning">Pending review</Tag>
<Tag intent="danger" onRemove={() => clearFilter('overdue')}>Overdue</Tag>
```

A compact label, optionally removable. A filter chip, a selected value, an applied facet.

Without `onRemove` a Tag is not focusable and adds no tab stop - which matters when there is one
per row of a list screen.

With `onRemove` it renders a remove control named for the value it removes: "Remove Overdue", not
"Remove". That is why `children` must be a `string` on the removable variant - the name has to come
from somewhere, and asking you to write the text twice is how the two drift apart. Eight tags in a
filter bar means eight buttons, and eight identical "Remove" buttons forces a screen-reader user to
leave each control to discover which one they are on.

`removeLabel` overrides that name for a different word or another language.

The remove control is 24x24 in both densities, measured in a browser rather than assumed from a
token. It is the smallest thing Clara asks anyone to hit accurately, and it is usually hit while
scanning a filter bar rather than while looking at it.

`intent` joins the accessible name as a word, so the colour is never the only carrier - the same
behaviour Badge has, and the same limit: Clara cannot make your VISIBLE text distinguishable. Two
tags reading "Open" in different colours are identical to a user who cannot separate the hues.
