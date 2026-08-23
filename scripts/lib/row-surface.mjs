/**
 * Which background a table row renders, when several states are true at once.
 *
 * An ERP table row is routinely striped AND hovered AND selected AND focused simultaneously, and
 * "whichever CSS rule happens to win" is not a design decision. The order is
 * **focus > selected > hover > striped**, with selected and hover COMPOSING: hovering a selected
 * row must still look selected, or the user loses track of what they picked while reaching for it.
 *
 * Focus is deliberately not a background at all. It is the two-part indicator (D0054), drawn over
 * whatever surface the row already has - so focusing a row never hides its selection.
 */

/** The row-surface states, in the order they win. */
export const ROW_PRECEDENCE = ['focused', 'selected', 'hover', 'striped']

export function resolveRowSurface ({ striped = false, hover = false, selected = false, focused = false } = {}) {
  // Selected + hover compose into a distinct surface rather than one replacing the other.
  const background = selected
    ? (hover ? 'color.bg.selected-hover' : 'color.bg.selected')
    : hover ? 'color.bg.row-hover'
      : striped ? 'color.bg.row-striped'
        : 'color.bg.surface'
  return {
    background,
    // The indicator is drawn ON TOP, so it never replaces the surface underneath.
    focusIndicator: focused ? { ring: 'color.border.focus', offset: 'color.border.focus-offset' } : null,
  }
}
