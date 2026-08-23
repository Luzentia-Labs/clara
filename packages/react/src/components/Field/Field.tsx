import { useId, type ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { FieldContext, type FieldWiring } from '../../lib/field-context'

/**
 * The wiring every form control sits inside.
 *
 * A form's accessibility is almost entirely about association: which text is this control's name,
 * which is its hint, which is its error, and does the control say it is invalid. Doing that by hand
 * on every input is how it gets missed on the fortieth one - so Field does it once and the control
 * reads the answer from context.
 *
 * Ids come from `useId`, which is stable across a server render and hydration. A counter would
 * produce different ids on the two passes, and the mismatch surfaces only in a real SSR consumer -
 * as an association that silently points at nothing.
 */
export interface FieldProps {
  children?: ReactNode
  /** The control's accessible name. A REAL label, never a placeholder (PRD, WCAG 3.3.2). */
  label: string
  /**
   * Persistent help. Announced alongside the error, not instead of it.
   *
   * `| undefined` is explicit because this project runs `exactOptionalPropertyTypes`, and a form
   * holding its error in state holds `string | undefined`. Without it the commonest real usage -
   * `<Field error={errors.supplier}>` - would not compile.
   */
  description?: string | undefined
  /** Present means invalid. The message is announced once, via a single live region. */
  error?: string | undefined
  required?: boolean
  disabled?: boolean
  /**
   * What the label names. `control` (the default) binds it with `htmlFor` to the single control
   * inside. `group` is for a RadioGroup or CheckboxGroup, which is a `<fieldset>`: `htmlFor` cannot
   * target a fieldset, so binding one produced a label pointing at nothing - it moved focus nowhere
   * and named nothing, while looking correct on screen. In `group` mode the label is a plain element
   * with an id, and the group references it with `aria-labelledby`.
   *
   * Explicit rather than detected: detecting it needs an effect, and an effect that swaps `<label>`
   * for `<span>` after mount changes the markup between the server render and hydration.
   */
  labelFor?: 'control' | 'group'
  className?: string
}

export function Field ({ children, label, description, error, required = false, disabled = false, labelFor = 'control', className }: FieldProps) {
  const base = useId()
  const id = `${base}-control`
  const labelId = `${base}-label`
  const descriptionId = description ? `${base}-description` : undefined
  const errorId = error ? `${base}-error` : undefined

  // Description first, then error: the hint explains what to enter, the error explains what went
  // wrong with what was entered, and that is the order a person needs them in. Documented here
  // because AC5 requires the order to BE documented, not merely to exist.
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined

  const wiring: FieldWiring = { id, labelId, describedBy, errorId, invalid: Boolean(error), required, disabled, labelFor }

  return (
    <FieldContext.Provider value={wiring}>
      <div className={cx('clara-field', disabled && 'clara-field--disabled', error && 'clara-field--invalid', className)}>
        {labelFor === 'group'
          ? (
            <span className="clara-field__label" id={labelId}>
              {label}
              {required ? <span className="clara-field__required" aria-hidden="true">*</span> : null}
            </span>
            )
          : (
            <label className="clara-field__label" id={labelId} htmlFor={id}>
              {label}
              {required ? <span className="clara-field__required" aria-hidden="true">*</span> : null}
            </label>
            )}
        {description ? <p className="clara-field__description" id={descriptionId}>{description}</p> : null}
        {children}
        {/*
          * `role="alert"` announces the message when it appears. The element is rendered ONLY when
          * there is an error, rather than kept empty and filled later, because an always-present
          * live region announces on every re-render that touches it - which is how an error ends up
          * read twice. It is also referenced by aria-errormessage, and a screen reader does not
          * double-announce a node it reaches by both routes.
          */}
        {error ? <p className="clara-field__error" id={errorId} role="alert">{error}</p> : null}
      </div>
    </FieldContext.Provider>
  )
}
