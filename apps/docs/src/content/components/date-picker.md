# DatePicker

```tsx
<Field label="Invoice date" description="Used for the accounting period">
  <DatePicker value={date} onValueChange={setDate} min="2026-01-01" />
</Field>
```

A date field with a calendar, following the APG's date-picker dialog.

## Typing is never taken away

The text input is the primary control and is never disabled in favour of the calendar. Typing is
faster than nine arrow presses for anyone who already knows the date, and it is the only route for
someone who cannot operate a grid. The calendar is an alternative, opened from the button beside it.

## ISO strings, both ways

`value`, `defaultValue` and `onValueChange` are `YYYY-MM-DD` strings. No calendar-library type
reaches your code, so the date library Clara uses internally is not something you depend on.

## Unavailable dates stay visible

`min`, `max` and `isDateUnavailable` mark dates rather than removing them. An unavailable day keeps
its place in the grid, carries `aria-disabled`, and announces itself as unavailable when focused - a
hole where the 14th should be is harder to understand than a 14th that says it cannot be picked.

## The format belongs in the description

Pass `format` and it appears in the accessible description as well as the placeholder. A placeholder
vanishes the moment someone starts typing, which is exactly when they need to know what shape the
value takes.
