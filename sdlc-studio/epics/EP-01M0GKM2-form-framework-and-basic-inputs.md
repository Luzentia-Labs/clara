# EP-01M0GKM2: Form framework and basic inputs

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning

## Summary

The Field framework and the basic inputs. ERP applications are mostly forms, and this is where component libraries leak the most accessibility bugs. Field wires label, description, error, and required state automatically so a broken form field is not possible by construction.

**PRD features:** F08, F09, F10
**Delivery order:** 5 of 10 - the highest-leverage epic in the project
**Depends on:** EP EP-01M0GKGS, EP EP-01M0GKNG

## Scope

### In Scope

- `Field` with `Field.Label`, `Field.Control`, `Field.Description`, `Field.Error`
- Automatic `id`, `aria-describedby`, `aria-invalid`, `aria-errormessage` wiring with SSR-safe generated ids
- Input, Textarea, NumberInput, PasswordInput, SearchInput
- Checkbox, CheckboxGroup, Radio, RadioGroup, Switch
- The controlled/uncontrolled convention applied by component shape

### Out of Scope

- Select, Combobox, and date inputs (EP EP-01M0GK91)
- Any validation library; Clara imposes none

## Acceptance Criteria (Epic Level)

- [ ] The label is always a real `<label>` associated with the control. **There is no placeholder-as-label pattern anywhere in Clara**
- [ ] Error state sets `aria-invalid`, links via `aria-errormessage`, and announces with `role="alert"` after user interaction
- [ ] Error is never conveyed by color alone; an icon and text always accompany it
- [ ] Description and error coexist and are both announced; **the announcement contract is verified on VoiceOver and recorded before Field is exported**
- [ ] Works uncontrolled with native form submission and controlled, with a documented React Hook Form example requiring no wrapper
- [ ] `Checkbox` indeterminate reflects `aria-checked="mixed"`
- [ ] `RadioGroup` manages roving focus per WAI-ARIA; the full control including its label is a click target
- [ ] Hit area >= 24x24px even in compact density where the visual box is smaller
- [ ] Readonly is visually distinct from disabled and remains at full contrast
- [ ] `NumberInput` uses `inputMode="decimal"` and does not inherit `type="number"` scroll-wheel behaviour

## Story Breakdown

- [ ] [US-01M0GM3D: Field framework](../stories/US-01M0GM3D-field-framework.md)
- [ ] [US-01M0GMBM: Input](../stories/US-01M0GMBM-input.md)
- [ ] [US-01M0GM2K: Textarea](../stories/US-01M0GM2K-textarea.md)
- [ ] [US-01M0GMF3: NumberInput](../stories/US-01M0GMF3-numberinput.md)
- [ ] [US-01M0GMMM: PasswordInput](../stories/US-01M0GMMM-passwordinput.md)
- [ ] [US-01M0GM2X: SearchInput](../stories/US-01M0GM2X-searchinput.md)
- [ ] [US-01M0GMAG: Checkbox](../stories/US-01M0GMAG-checkbox.md)
- [ ] [US-01M0GM0D: CheckboxGroup](../stories/US-01M0GM0D-checkboxgroup.md)
- [ ] [US-01M0GMQT: RadioGroup](../stories/US-01M0GMQT-radiogroup.md)
- [ ] [US-01M0GM9E: Switch](../stories/US-01M0GM9E-switch.md)

## Risks

- The `aria-errormessage` + `role="alert"` + `aria-describedby` combination becomes a library-wide contract in every field of every app the moment it publishes. It is verified on a real screen reader **before** export, because after publish it is permanent

## Open Questions

_None open. Every PRD open question is closed (D0001-D0016) or promoted to F31._

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Created from PRD v0.3.0 |
