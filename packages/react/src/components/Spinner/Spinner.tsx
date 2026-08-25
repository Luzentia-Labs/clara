import { cx } from '../../lib/cx'

export interface SpinnerProps {
  /**
   * What is loading. Required, and not defaulted to "Loading".
   *
   * A screen-reader user hearing "Loading" on a dense ERP screen learns that something is loading
   * and not which of the four regions in front of them it is. The word Clara could supply is
   * exactly the word that carries no information.
   */
  label: string
  className?: string
}

/**
 * A busy indicator.
 *
 * The ring is `.clara-spinner__ring`, the same class `<Button loading>` renders - one
 * implementation, so the two cannot drift into spinners that turn at different rates (D0100).
 *
 * **The motion is not the only carrier, by rule.** D0100: no state in Clara is carried by motion
 * alone, which is the temporal form of the seat's standing rule that no state is carried by colour
 * alone. The ring says "right now"; the label says what. Neither substitutes for the other, and the
 * label is required in BOTH motion preferences - it is never the thing that gets removed.
 *
 * `role="status"` rather than `alert`: a spinner is not an interruption, and a screen reader should
 * reach it in its own time.
 */
export function Spinner ({ label, className }: SpinnerProps) {
  return (
    <span className={cx('clara-spinner', className)} role="status">
      {/* aria-hidden: the ring is the visual half. The label below is what is announced. */}
      <span className="clara-spinner__ring" aria-hidden="true" />
      <span className="clara-visually-hidden">{label}</span>
    </span>
  )
}
