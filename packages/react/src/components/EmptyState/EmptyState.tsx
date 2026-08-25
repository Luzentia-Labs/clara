import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

/**
 * Which kind of nothing this is.
 *
 * `empty` - there are no records yet. The way forward is to create one.
 * `filtered` - records exist and none matched. The way forward is to change the filter.
 *
 * These are not two labels on one state. They call for opposite actions, and a user shown the
 * wrong one either hunts for data that was filtered out or creates a duplicate of a record that
 * was there all along.
 */
export type EmptyStateReason = 'empty' | 'filtered'

interface EmptyStateBaseProps {
  /** One line saying what is not here. "No invoices yet", not "Nothing found". */
  title: string
  /** A sentence of guidance. Optional, because a good title often needs no elaboration. */
  children?: ReactNode
  className?: string
}

export interface EmptyStateEmptyProps extends EmptyStateBaseProps {
  reason: 'empty'
  /** Usually the control that creates the first record. Optional: some lists are populated elsewhere. */
  action?: ReactNode
}

/**
 * `action` is REQUIRED here and optional on `empty`, and that asymmetry is the point.
 *
 * A filtered empty state without a way out is a dead end: the user is looking at nothing, the
 * records they want exist, and the only route back is to remember which filter they set. An empty
 * list with no create button is merely uneventful - the data may legitimately arrive from
 * somewhere else entirely.
 */
export interface EmptyStateFilteredProps extends EmptyStateBaseProps {
  reason: 'filtered'
  action: ReactNode
}

export type EmptyStateProps = EmptyStateEmptyProps | EmptyStateFilteredProps

/** What each reason says when the author supplies no description of their own. */
const GUIDANCE: Record<EmptyStateReason, string> = {
  empty: 'Nothing has been added here yet.',
  filtered: 'No results match the current filters.',
}

/**
 * The state a dense list screen is in more often than anyone designs for.
 *
 * Server-capable: `action` is a node, not a callback, so whatever handler it carries belongs to the
 * consumer's own component and this one stays free of function props (TRD Section 7).
 */
export function EmptyState (input: EmptyStateProps) {
  const { reason, title, children, className } = input

  return (
    <div
      className={cx('clara-empty-state', `clara-empty-state--${reason}`, className)}
      // The two cases are distinguishable in the DOM, not only in the copy an author happened to
      // write. A test can assert the distinction; so can a consumer's own styling.
      data-reason={reason}
      // `status`, not `alert`: an empty list is information, and it is already what the user is
      // looking at. Interrupting to announce it would be shouting about the obvious.
      role="status"
    >
      <p className="clara-empty-state__title">{title}</p>
      <p className="clara-empty-state__guidance">{children ?? GUIDANCE[reason]}</p>
      {input.action !== undefined && (
        <div className="clara-empty-state__action">{input.action}</div>
      )}
    </div>
  )
}
