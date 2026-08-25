import { cx } from '../../lib/cx'

interface ProgressBarBaseProps {
  /** What is progressing. Required: "62%" of what is the question a label answers. */
  label: string
  className?: string
}

export interface ProgressBarDeterminateProps extends ProgressBarBaseProps {
  /** 0 to `max`. */
  value: number
  /** Defaults to 100, so `value` reads as a percentage unless you say otherwise. */
  max?: number
  indeterminate?: never
}

/**
 * No `value` here, and that is the point rather than an omission: an indeterminate bar must not
 * claim a percentage it does not know (AC2).
 */
export interface ProgressBarIndeterminateProps extends ProgressBarBaseProps {
  indeterminate: true
  value?: never
  max?: never
}

export type ProgressBarProps = ProgressBarDeterminateProps | ProgressBarIndeterminateProps

/**
 * A progress bar, determinate or not.
 *
 * **Determinate does not animate** (D0100). The fill's width is DATA, and a transitioned width
 * lies about the current value for the length of the transition - for 200ms after an update the
 * bar shows a number that is not the number, while `aria-valuenow` already shows the new one. A
 * screen-reader user and a sighted user would be reading different values off the same component.
 *
 * **Indeterminate omits `aria-valuenow` entirely.** That is what the ARIA spec means by
 * indeterminate, and it is the difference between "I do not know how far along this is" and a
 * confident claim of zero.
 */
export function ProgressBar (input: ProgressBarProps) {
  const { label, className } = input
  const indeterminate = input.indeterminate === true
  const max = input.max ?? 100
  // Clamped rather than trusted: a caller computing 105 of 100 should show a full bar, not one
  // that overflows its track.
  const value = indeterminate ? undefined : Math.min(Math.max(input.value, 0), max)

  return (
    <div
      className={cx('clara-progress', indeterminate && 'clara-progress--indeterminate', className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={indeterminate ? undefined : 0}
      aria-valuemax={indeterminate ? undefined : max}
      aria-valuenow={value}
    >
      <div
        className="clara-progress__fill"
        // The one inline style in Clara that is not a design value: it is the DATUM. A class
        // cannot express an arbitrary percentage, and a token would be a hand-typed number.
        style={indeterminate ? undefined : { inlineSize: `${(value! / max) * 100}%` }}
      />
    </div>
  )
}
