import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from '../../lib/cx'

/**
 * A set of related buttons, navigated as one control.
 *
 * `role="toolbar"` with roving tabindex: the group is ONE tab stop and arrow keys move within it.
 * That is what US-01M0GM3S AC1 specifies, and the two go together - roving tabindex without the
 * toolbar role announces a set of buttons that mysteriously cannot be tabbed to, and the toolbar
 * role without roving tabindex promises arrow navigation that does nothing.
 *
 * `label` is required. A toolbar of unlabelled controls is announced as a run of buttons with no
 * indication of what they belong to.
 *
 * *Recorded reservation:* this makes a form footer (`Save` / `Cancel`) a single tab stop, which is
 * a heavier interaction than two plain buttons. The spec chose it, and consistency across every
 * ButtonGroup is worth more than optimising each site - but if a footer variant is wanted later,
 * that is a CR rather than a silent second behaviour.
 */
export interface ButtonGroupProps {
  children?: ReactNode
  /** What the group is for. Required - an unlabelled toolbar announces nothing. */
  label: string
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function ButtonGroup ({ children, label, orientation = 'horizontal', className }: ButtonGroupProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const buttons = useCallback(
    () => Array.from(ref.current?.querySelectorAll<HTMLElement>('button, [role="button"], a[href]') ?? []),
    [],
  )

  /**
   * The roving tabindex is applied by walking the DOM rather than by cloning children: a consumer
   * may wrap a button in a Tooltip or a fragment, and `React.Children.map` only sees the immediate
   * child - so cloning would silently skip exactly the cases a toolbar is used for.
   */
  useEffect(() => {
    const items = buttons()
    items.forEach((item, i) => { item.tabIndex = i === active ? 0 : -1 })
  }, [active, buttons, children])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = buttons()
    if (!items.length) return
    const forward = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown'
    const back = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp'
    let next: number | null = null
    if (event.key === forward) next = (active + 1) % items.length
    else if (event.key === back) next = (active - 1 + items.length) % items.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = items.length - 1
    if (next === null) return
    // Wraps deliberately: in a dense toolbar, reaching the last action from the first should not
    // require traversing the whole row backwards.
    event.preventDefault()
    setActive(next)
    items[next]?.focus()
  }

  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label={label}
      aria-orientation={orientation}
      className={cx('clara-button-group', `clara-button-group--${orientation}`, className)}
      onKeyDown={onKeyDown}
      onFocus={(event) => {
        const index = buttons().indexOf(event.target as HTMLElement)
        if (index >= 0) setActive(index)
      }}
    >
      {children}
    </div>
  )
}
