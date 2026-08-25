import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

/** A closed set, not a CSS length: a ragged edge is the effect, and four steps produce it. */
export type SkeletonWidth = 'full' | 'three-quarters' | 'half' | 'quarter'

export interface SkeletonProps {
  width?: SkeletonWidth
  className?: string
}

/**
 * One loading placeholder.
 *
 * **Always `aria-hidden`, with no way to override it.** A loading list renders forty of these, and
 * forty announcements is the defect this component exists to prevent - it is the user story
 * verbatim. The loading state is announced ONCE, by `SkeletonGroup`.
 *
 * **No motion, in either preference** (D0100). No shimmer, no pulse, no sweep. A skeleton's
 * information is its SHAPE - content is coming, and it will be about this big - and a shimmer adds
 * nothing the shape has not already said, which makes it decoration justified after the fact.
 * Forty shimmering blocks in a loading list is a crowded screen in the time dimension. This is a
 * D0094-shaped ruling rather than an exception to one: there is nothing here to reduce, so there is
 * no `prefers-reduced-motion` branch either.
 */
export function Skeleton ({ width = 'full', className }: SkeletonProps) {
  return <span className={cx('clara-skeleton', `clara-skeleton--${width}`, className)} aria-hidden="true" />
}

export interface SkeletonGroupProps {
  /** What is loading. Announced once for the whole group. */
  label: string
  children: ReactNode
  className?: string
}

/**
 * The container that announces, so the placeholders do not have to.
 *
 * `role="status"` rather than `alert`: content arriving is not an interruption. The label is the
 * non-visual carrier - a screen-reader user gets one sentence naming what is loading, instead of
 * forty anonymous placeholders or, worse, silence.
 */
export function SkeletonGroup ({ label, children, className }: SkeletonGroupProps) {
  return (
    <div className={cx('clara-skeleton-group', className)} role="status">
      <span className="clara-visually-hidden">{label}</span>
      {children}
    </div>
  )
}
