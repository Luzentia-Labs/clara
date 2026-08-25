# EP-01M0GKM2: Form framework and basic inputs

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full

## Summary

The Field framework and the basic inputs. ERP applications are mostly forms, and this is where component libraries leak the most accessibility bugs. Field wires label, description, error, and required state automatically so a broken form field is not possible by construction.

**PRD features:** F08, F09, F10
**Delivery order:** 5 of 10 - the highest-leverage epic in the project
**Depends on:** EP EP-01M0GKGS, EP EP-01M0GKNG

## Inherited Constraints

> See PRD and TRD for full constraint details. Key constraints for this epic:

| Source | Type | Constraint | Impact |
| --- | --- | --- | --- |
| PRD F08/F09 | Accessibility | WCAG 2.2 AA; a real label, never a placeholder; readonly is not contrast-exempt | Every control takes its wiring from the Field; axe runs over all four theme x density combinations |
| PRD F01 | API stability | Tier 2 tokens and every exported name are public API, and publishing is a one-way door | A prop rename after publish is a breaking change, so `disabled`, `labelFor` and the `as` idiom were settled before the first release (D0085) |
| TRD Section 7 | Boundary | A component with function props or state is client-only | The Field renders a context Provider, so it and every control reading it are client (D0060) |
| TRD Section 9 | Gates | 19 CI gates, 18 wired | Gate 7 (visual regression) is the one pending, owned by US-01M0GMZW - so nothing here verifies appearance |
| PRD D0058/D0028 | Keyboard | A disabled control keeps its tab stop | `aria-disabled` + `readOnly`, never the native attribute, and each control suppresses its own interaction (D0064, D0068, D0085) |

## Business Context

### Problem Statement

An ERP form is the densest accessibility surface a design system has: dozens of controls per screen,
each needing a label, a description, an error, and the associations between them. Wiring that per
control guarantees drift - one control forgets `aria-describedby`, another announces its error
twice, a third is disabled in a way a keyboard user cannot reach. Doing it once, in a Field every
control reads from, makes it checkable.

**PRD Reference:** F08 (Field framework) and F09 (the input family).

### Value Proposition

One place to get the wiring right, and one place to get it wrong - which is the point: a defect in
the Field is a defect ten controls inherit, so it is worth the gate weight this epic carries.

### Success Metrics

| Metric | Current | Target | Measurement |
| --- | --- | --- | --- |
| Blocking axe violations | 0 | 0 | `check:axe`, all four theme x density combinations |
| Contrast pairings waived | 0 | 0 | `check:contrast`, both themes, measured against real token values |
| Per-component JS budget | under 5 kB gzipped | under 5 kB | `pnpm size`, budgets generated from the boundary classification |
| Executable ACs failing | 0 of 71 | 0 | `verify_ac.py run` |

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

## Dependencies

### Blocked By

| Dependency | Type | Status | Owner |
| --- | --- | --- | --- |
| EP-01M0GKNG (F00 visual language) | Blocking | Done | semantic tokens, density, themes |
| EP-01M0GKNH (toolchain and release) | Blocking | Done | build, guards, CI |
| US-01M0GMZW (Storybook + visual regression) | Non-blocking | Draft | owns gate 7 and the two definition-of-done artefacts this epic cannot produce |

### Blocking

| Item | Type | Impact |
| --- | --- | --- |
| A VoiceOver session | Manual | Field AC6; the story holds at Review without it |
| An autofill check in Chrome and Safari | Manual | Input AC4; same |

## Risks & Assumptions

### Assumptions

- **Assumed:** consumers compose these controls inside their own form library (react-hook-form was
  the integration tested). Clara provides no form state, validation or submission.
- **Assumed:** a Field wraps exactly one control. Two controls in one Field would share an id; that
  is outside the design's stated shape and is not guarded.
- **Risk taken deliberately:** appearance is unverified. jsdom computes no layout and gate 7 is
  unwired, so what is proven is the markup, the wiring, the tokens and the measured contrast - not
  how any of it looks.

### Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| A guard that passes when it should fail | Observed, repeatedly | An acceptance criterion stamped green having proven nothing | `prove-guards-fail.mjs` runs 82 mutations; every fix is landed by deleting it and watching a test go red |
| Prose outrunning code | Observed, repeatedly | A record or docs page claiming behaviour that does not exist | `check-verification.mjs` checks records against the code they cite; `check:latest` derives the orientation figures |
| A breaking change after publish | Not yet possible | Permanent, for every consumer | Nothing is published; the public surface report is diffed on every build |

## Technical Considerations

### Architecture Impact

The Field passes its wiring by React context rather than by cloning children: a control is
frequently wrapped - in a layout primitive, a fragment, a tooltip - and `React.Children.map` sees
only the immediate child, so cloning would silently skip exactly the compositions a real form is
built from (D0060). That makes the whole family client-only, because a Server Component cannot
render a Provider.

### Integration Points

`react-hook-form`'s `register()` spread (ref, name, onChange, onBlur) is the tested integration
point. Native form submission works without a wrapper. Note one consequence of the disabled model:
`aria-disabled` does not exclude a control from submission the way the native attribute does, so a
consumer must omit the value themselves when it should not be sent (D0068).

## Sizing

**Size:** L

_A T-shirt size (S / M / L / XL) - the epic's own coarse estimate, made before decomposition. An epic is never sized in story points; STORY points belong on stories._

**Estimated Story Count:** 10

**Derived Point Total:** 38

_DERIVED, not estimated: the sum of this epic's stories' points. `reconcile` recomputes it, so it can never drift from the stories beneath it - do not hand-edit it._

**Complexity Factors:**

- The Field is the multiplier: ten controls inherit its wiring, so its defects are ten defects.
- Accessibility is deliberately split across two seats (Idris decides, Mira proves), and neither may
  assume the other covered it.
- Seven adversarial code-review rounds and six plan-review passes ran on this epic. That was not
  waste: rounds 1-5 found component defects, 6-7 found defects in the guards written to catch them.

## Story Breakdown

- [x] [US-01M0GM3D: Field framework](../stories/US-01M0GM3D-field-framework.md)
- [x] [US-01M0GMBM: Input](../stories/US-01M0GMBM-input.md)
- [x] [US-01M0GM2K: Textarea](../stories/US-01M0GM2K-textarea.md)
- [x] [US-01M0GMF3: NumberInput](../stories/US-01M0GMF3-numberinput.md)
- [x] [US-01M0GMMM: PasswordInput](../stories/US-01M0GMMM-passwordinput.md)
- [x] [US-01M0GM2X: SearchInput](../stories/US-01M0GM2X-searchinput.md)
- [x] [US-01M0GMAG: Checkbox](../stories/US-01M0GMAG-checkbox.md)
- [x] [US-01M0GM0D: CheckboxGroup](../stories/US-01M0GM0D-checkboxgroup.md)
- [x] [US-01M0GMQT: RadioGroup](../stories/US-01M0GMQT-radiogroup.md)
- [x] [US-01M0GM9E: Switch](../stories/US-01M0GM9E-switch.md)

## Test Plan

**No separate test spec.** The plan lives per story, in each one's `## Test Plan` table, which names
the production change every criterion's test must fail on - and `check:story-verifiers` fails when a
table is short a row or misaligned. A single epic-level spec would restate ten tables and drift from
all of them.

What gates this epic, in the order it runs:

| Gate | What it proves |
| --- | --- |
| `pnpm preflight` | The whole CI set as one command, checked against `ci.yml` so it cannot go stale (D0075) |
| `verify_ac.py run` | Every executable criterion, and it refuses a run that selected nothing |
| `prove-guards-fail.mjs` | 82 mutations, so the guards themselves are known to be able to fail |
| `check:axe` / `check:keyboard` | Accessibility and keyboard, over the components that cite them (D0066) |
| `check:contrast` | 96 pairings across both themes, against real token values - jsdom can see none of this |

**What this plan cannot reach**, named rather than implied: appearance (gate 7, unwired, US-01M0GMZW)
and what a screen reader actually says (axe reads the tree, not the speech). Two manual criteria
remain open for exactly that reason, and neither has been stamped.

## Open Questions

_None open. Every PRD open question is closed (D0001-D0016) or promoted to F31._

## Risks

- The `aria-errormessage` + `role="alert"` + `aria-describedby` combination becomes a library-wide contract in every field of every app the moment it publishes. It is verified on a real screen reader **before** export, because after publish it is permanent

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Created from PRD v0.3.0 |
