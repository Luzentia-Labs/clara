# EP-01M0GK91: Advanced form controls: select, combobox, and dates

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning

## Summary

Select, Combobox, MultiSelect, and the date inputs. These carry the most intricate WAI-ARIA patterns in the library and the highest risk of a subtly wrong implementation that passes automated checks.

**PRD features:** F11, F12
**Delivery order:** 6 of 10 - the hardest components in the library. Scope reduced by D0018 (TimePicker) and D0019 (virtualization)
**Depends on:** EP EP-01M0GK4P, EP EP-01M0GKM2

## Scope

### In Scope

- Select, Combobox, MultiSelect on the WAI-ARIA Combobox pattern
- Async option loading with loading, empty, and error states
- A documented client-side option-count ceiling, above which async loading is required
- DatePicker with direct text entry, on `@internationalized/date` (TRD ADR-008)
- DateRangePicker (v1.0)

### Out of Scope

- Filter builder (nice-to-have)
- Locale packs beyond the documented configuration surface

## Acceptance Criteria (Epic Level)

- [ ] Full keyboard operation: type to filter, arrows to move, Enter to select, Escape to close and restore, Home/End, Tab to commit
- [ ] `aria-expanded`, `aria-controls`, `aria-activedescendant`, `role="listbox"`, `role="option"` all correct
- [ ] Large option sets are served by **async loading**; exceeding the documented client-side option-count ceiling emits a development warning. Client-side virtualization is deferred to v1.1 (D0019)
- [ ] Selected count is announced when it changes; `MultiSelect` remove controls are keyboard reachable and labeled with the value they remove
- [ ] Works correctly inside a Modal and inside a scrollable Table without clipping
- [ ] `DatePicker` accepts direct text entry; **text entry is never disabled in favour of the calendar**
- [ ] Expected format appears in the field description, not only the placeholder
- [ ] Calendar keyboard: arrows by day, PageUp/PageDown by month, Home/End to week bounds, Escape to close
- [ ] Public props accept and return **ISO date strings**, not `@internationalized/date` types
- [ ] Timezone behaviour is documented: Clara operates on calendar dates, not instants, unless a time component is present

## Story Breakdown

- [ ] [US-01M0GMRK: Select](../stories/US-01M0GMRK-select.md)
- [ ] [US-01M0GMJ8: Combobox](../stories/US-01M0GMJ8-combobox.md)
- [ ] [US-01M0GMC7: MultiSelect](../stories/US-01M0GMC7-multiselect.md)
- [ ] [US-01M0GMC1: DatePicker](../stories/US-01M0GMC1-datepicker.md)
- [ ] [US-01M0GM0F: DateRangePicker](../stories/US-01M0GM0F-daterangepicker.md)

## Risks

- The WAI-ARIA Combobox pattern is intricate and easy to get subtly wrong in ways every automated check passes. A manual screen reader pass is required, not only an axe assertion
- Async loading states (loading, empty, error) are where most Combobox implementations leak; they are tested first, not last
- `@internationalized/date` types must not reach the public surface - the ISO-string boundary is the mitigation and it needs a test

## Open Questions

_None open. Every PRD open question is closed (D0001-D0016) or promoted to F31._

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Created from PRD v0.3.0 |
