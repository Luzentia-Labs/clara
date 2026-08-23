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
export function fieldAriaProps (wiring: FieldWiring | null, kind: 'text' | 'toggle' = 'text') {
  if (!wiring) return {}
  return {
    id: wiring.id,
    'aria-describedby': wiring.describedBy,
    'aria-invalid': wiring.invalid || undefined,
    'aria-errormessage': wiring.invalid ? wiring.errorId : undefined,
    'aria-required': wiring.required || undefined,
    'aria-disabled': wiring.disabled || undefined,
    ...(kind === 'text' && wiring.disabled ? { readOnly: true } : {}),
  }
}

/**
 * Suppress a change on a control that is `aria-disabled`. The native attribute would do this for
 * free; the cost of keeping the control reachable is doing it explicitly, as Button does for click.
 */
export function fieldChangeGuard<E extends { preventDefault (): void }> (
  wiring: FieldWiring | null,
  handler: ((event: E) => void) | undefined,
) {
  return (event: E) => {
    if (wiring?.disabled) { event.preventDefault(); return }
    handler?.(event)
  }
}
