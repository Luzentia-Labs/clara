# The v1 icon set

**48 icons.** GENERATED from `icons.json` and `svg/` - do not edit by hand.

PRD:357 requires this to be an enumerated, counted list committed before implementation, rather
than "at minimum the icons we need". A list nobody can count is one CI cannot check, so
`check-icons.mjs` fails when an exported icon is absent here, when a listed icon is unexported,
or when a category's count moves.

Every icon is drawn on a 24x24 grid with a 2px stroke and round caps. They are read at 16-20px in
dense toolbars, where detail becomes noise, so the geometry is deliberately plain.

## Using them

Icons are **decorative by default** and hidden from assistive technology. An icon that carries
meaning on its own takes a `label`, which becomes its accessible name:

```tsx
<TrashIcon />                       // decorative, beside a text label
<DeleteIcon label="Delete row" />   // meaningful on its own
```

They inherit `currentColor` and size from their context, so they take the colour of the text
around them without a prop.

### navigation (12)

- `ArrowDownIcon` (`arrow-down.svg`)
- `ArrowLeftIcon` (`arrow-left.svg`)
- `ArrowRightIcon` (`arrow-right.svg`)
- `ArrowUpIcon` (`arrow-up.svg`)
- `ChevronDownIcon` (`chevron-down.svg`)
- `ChevronLeftIcon` (`chevron-left.svg`)
- `ChevronRightIcon` (`chevron-right.svg`)
- `ChevronUpIcon` (`chevron-up.svg`)
- `CloseIcon` (`close.svg`)
- `ExternalIcon` (`external.svg`)
- `HomeIcon` (`home.svg`)
- `MenuIcon` (`menu.svg`)

### status-and-intent (8)

- `BlockedIcon` (`blocked.svg`)
- `DangerIcon` (`danger.svg`)
- `HelpIcon` (`help.svg`)
- `InfoIcon` (`info.svg`)
- `LockIcon` (`lock.svg`)
- `PendingIcon` (`pending.svg`)
- `SuccessIcon` (`success.svg`)
- `WarningIcon` (`warning.svg`)

### crud-and-actions (10)

- `AddIcon` (`add.svg`)
- `CheckIcon` (`check.svg`)
- `CopyIcon` (`copy.svg`)
- `DeleteIcon` (`delete.svg`)
- `EditIcon` (`edit.svg`)
- `MoreIcon` (`more.svg`)
- `RefreshIcon` (`refresh.svg`)
- `SaveIcon` (`save.svg`)
- `SearchIcon` (`search.svg`)
- `UndoIcon` (`undo.svg`)

### sort-and-filter (6)

- `ColumnsIcon` (`columns.svg`)
- `FilterIcon` (`filter.svg`)
- `GroupIcon` (`group.svg`)
- `SortIcon` (`sort.svg`)
- `SortAscIcon` (`sort-asc.svg`)
- `SortDescIcon` (`sort-desc.svg`)

### file (4)

- `AttachmentIcon` (`attachment.svg`)
- `DownloadIcon` (`download.svg`)
- `FileIcon` (`file.svg`)
- `UploadIcon` (`upload.svg`)

### calendar (3)

- `CalendarIcon` (`calendar.svg`)
- `ClockIcon` (`clock.svg`)
- `DateRangeIcon` (`date-range.svg`)

### user-and-settings (5)

- `LogoutIcon` (`logout.svg`)
- `NotificationIcon` (`notification.svg`)
- `SettingsIcon` (`settings.svg`)
- `UserIcon` (`user.svg`)
- `UsersIcon` (`users.svg`)
