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

/** The props every Clara control spreads onto its underlying element. */
export function fieldAriaProps (wiring: FieldWiring | null) {
  if (!wiring) return {}
  return {
    id: wiring.id,
    'aria-describedby': wiring.describedBy,
    'aria-invalid': wiring.invalid || undefined,
    'aria-errormessage': wiring.invalid ? wiring.errorId : undefined,
    'aria-required': wiring.required || undefined,
    disabled: wiring.disabled || undefined,
  }
}
