# DropdownMenu

```tsx
const [open, setOpen] = useState(false)

<DropdownMenu
  open={open}
  onOpen={() => setOpen(true)}
  onClose={() => setOpen(false)}
  trigger={<Button variant="secondary">Actions</Button>}
  items={[
    { label: 'Post', onSelect: post },
    { label: 'Void', onSelect: voidEntry, disabled: !canVoid },
    { separator: true },
    { label: 'Export', items: [
      { label: 'CSV', onSelect: exportCsv },
      { label: 'PDF', onSelect: exportPdf },
    ] },
  ]}
/>
```

A menu of **actions**, implementing the WAI-ARIA menu pattern.

## Actions only — navigation is a different component

Every entry here *does* something. `role="menu"` tells a screen-reader user to expect commands, so a
list of destinations announced as commands misdescribes what pressing Enter will do. A navigation
menu is a separate pattern and is planned for v1.1 (D0020). For links today, use ordinary anchors.

## The menu is data, not composed children

There is no `DropdownMenuItem` or `DropdownMenuSeparator` to import. You describe the menu as a list
and Clara renders it. That is not a stylistic preference: a composed API makes illegal arrangements
expressible — an item outside a submenu, a separator inside a trigger — and those fail at runtime
with an error naming an internal library. As a list, they cannot be written. The types go further:
an entry with both `onSelect` and `items`, or a separator with a label, will not compile.

Submenus nest by giving an entry its own `items`, to any depth.

## It is named by its trigger

There is no `label` prop. The menu takes its accessible name from the button that opened it, which
is what the WAI-ARIA pattern specifies and what your trigger already provides. Give the trigger a
clear name — with an icon-only trigger, that is `IconButton`'s `label`.

## Keyboard

| Key | Result |
| --- | --- |
| Enter / Space on the trigger | Opens the menu, highlighting the first entry. |
| ArrowDown / ArrowUp | Moves between entries, skipping disabled ones and wrapping at the ends. |
| ArrowRight | Opens a submenu and moves into it. |
| ArrowLeft | Closes the submenu and returns to its entry. |
| A printable character | Jumps to the next entry whose label starts with it. |
| Enter / Space | Runs the highlighted entry and closes the menu. |
| Escape | Closes the menu and returns focus to the trigger. |

Focus returns to the trigger on **every** dismissal route, including after you select an entry —
not only on Escape.

## Disabled entries

A disabled entry stays visible and is still announced, but it cannot be focused or selected. Keeping
it visible is deliberate: an action that disappears when unavailable teaches people the feature does
not exist.
