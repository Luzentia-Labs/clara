import { createContext, useContext } from 'react'

/**
 * What a control needs to wire itself to its label, description and error.
 *
 * Passed by context rather than by cloning children: a control is frequently wrapped - in a
 * Tooltip, a layout primitive, a fragment - and `React.Children.map` sees only the immediate
 * child, so cloning would silently skip exactly the compositions a form is built from.
 */
export interface FieldWiring {
  /** The control's own id, referenced by the label. */
  id: string
  /** The label element's own id, for a group to reference with `aria-labelledby`. */
  labelId: string
  /** Whether the Field's label names a single control or a group. See `FieldProps.labelFor`. */
  labelFor: 'control' | 'group'
  /**
   * The id of a visually-hidden "(required)" marker, present only when the Field is required.
   *
   * A control that CANNOT carry `aria-required` - a `<fieldset>`, which is role=group - composes it
   * into its own `aria-labelledby` so the requirement is announced. A control that can carry the
   * property ignores this and uses the property, or it is announced twice.
   *
   * The decision belongs to the control because only the control knows its role, and it cannot be
   * made by the Field at render time: React renders the parent's label before any child reports in,
   * so a callback from the child is always one render too late.
   */
  requiredMarkerId: string | undefined
  /** Space-separated ids for `aria-describedby`, or undefined when there is nothing to describe. */
  describedBy: string | undefined
  /** The error message's id, for `aria-errormessage`. */
  errorId: string | undefined
  invalid: boolean
  required: boolean
  disabled: boolean
}

export const FieldContext = createContext<FieldWiring | null>(null)

/**
 * The wiring for the control inside a Field.
 *
 * Returns null outside one, deliberately: a control used standalone is legitimate, and should not
 * throw - it simply wires nothing and relies on the consumer's own label.
 */
export function useFieldWiring (): FieldWiring | null {
  return useContext(FieldContext)
}

/**
 * The props every Clara control spreads onto its underlying element.
 *
 * Disabled is `aria-disabled`, never the `disabled` attribute (D0058, D0028). A natively disabled
 * control leaves the tab order, so a keyboard user can never reach it - and an ERP form is
 * frequently mostly disabled, with the REASON attached to the very control they cannot reach. The
 * first implementation of this framework used the native attribute, contradicting a decision
 * accepted one epic earlier and shipped in Button; two tests asserted the violation as correct.
 *
 * `aria-disabled` alone does not stop editing, so a text control also takes `readOnly` - which
 * keeps the caret and copying, both of which the user needs to READ a field whose reason they must
 * act on. A control with no readonly state (a checkbox, a radio, a switch) suppresses the change
 * itself; `fieldChangeGuard` is that suppression.
 */
export function fieldAriaProps (
  wiring: FieldWiring | null,
  kind: 'text' | 'toggle' = 'text',
  /**
   * A `disabled` the CONSUMER passed to the control directly.
   *
   * `disabled` is the first prop a React developer reaches for, and it was reaching the DOM through
   * `{...rest}` - so `<Input disabled />` emitted the native attribute and left the tab order, which
   * is precisely the failure D0058 and D0064 exist to prevent. Omitting the prop would make that a
   * compile error, but it would also leave a standalone control with no way to be disabled at all.
   * So the prop is kept and MEANS the Clara thing: same aria-disabled, same readOnly, same guard.
   */
  ownDisabled = false,
) {
  const disabled = Boolean(wiring?.disabled) || ownDisabled
  if (!wiring) {
    return disabled
      ? { 'aria-disabled': true, ...(kind === 'text' ? { readOnly: true } : {}) }
      : {}
  }
  return {
    id: wiring.id,
    // Always, for every control. `htmlFor` alone made the name depend on the consumer choosing the
    // right `labelFor`, and a wrong choice produced a control with no accessible name at all.
    'aria-labelledby': wiring.labelId,
    'aria-describedby': wiring.describedBy,
    'aria-invalid': wiring.invalid || undefined,
    'aria-errormessage': wiring.invalid ? wiring.errorId : undefined,
    'aria-required': wiring.required || undefined,
    'aria-disabled': disabled || undefined,
    ...(kind === 'text' && disabled ? { readOnly: true } : {}),
  }
}

/**
 * Suppress an interaction on a control that is `aria-disabled`. The native attribute would do this
 * for free; the cost of keeping the control reachable is doing it explicitly, as Button does.
 *
 * It is installed on BOTH `onClick` and `onChange`, and they do different jobs.
 *
 * The CHANGE guard is what stops the toggle. React binds a checkbox's change to the same native
 * click, so cancelling there cancels the DOM toggle as well as suppressing the consumer's handler.
 * Guarding the click ALONE was the original defect: `preventDefault()` reverted the DOM while the
 * queued change still fired reporting `checked === true`, which in the idiomatic controlled form
 * flips the consumer's state, looks right for one frame, and paints the tick on the next unrelated
 * render.
 *
 * The CLICK guard's remaining job is narrower and still real: suppressing the consumer's own
 * `onClick`. A disabled control must not run the handler attached to it by either route. An earlier
 * version of this comment justified the click guard with the change guard's reason, which was
 * simply wrong - and no test covered the click path, so nothing contradicted it.
 */
export function fieldChangeGuard<E extends { preventDefault (): void }> (
  wiring: FieldWiring | null,
  handler: ((event: E) => void) | undefined,
  /** A `disabled` the consumer passed to the control itself - it must suppress too. */
  ownDisabled = false,
) {
  return (event: E) => {
    if (wiring?.disabled || ownDisabled) { event.preventDefault(); return }
    handler?.(event)
  }
}

/**
 * True when the control is disabled - by its Field, or by its own prop.
 *
 * The second argument matters: a control disabled directly must suppress its own interactions too,
 * or `<SearchInput disabled />` still clears and `<NumberInput disabled />` still steps.
 */
export const fieldDisabled = (wiring: FieldWiring | null, ownDisabled = false) =>
  Boolean(wiring?.disabled) || ownDisabled
