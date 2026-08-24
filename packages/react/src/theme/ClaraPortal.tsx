import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useClaraSettings } from './context'
import { claraAttributes } from './resolve'

export interface ClaraPortalProps { children?: ReactNode }

/**
 * True when React would paint something for these children.
 *
 * `{open && <Menu/>}` yields `false` and `{open ? <Menu/> : null}` yields `null`; both are the
 * ordinary way a React developer opens and closes an overlay, and both must read as CLOSED here.
 */
const rendersContent = (children: ReactNode): boolean => {
  if (children === null || children === undefined || typeof children === 'boolean') return false
  if (Array.isArray(children)) return children.some(rendersContent)
  return true
}

/**
 * Renders into `document.body` while keeping the theme and density of where it was WRITTEN.
 *
 * This is the case that makes DOM inheritance unworkable and context necessary. An overlay opened
 * from inside a dark, compact sidebar leaves that subtree in the DOM the moment it portals - so a
 * CSS-inheritance model renders it with the page's theme, not the sidebar's. Context follows the
 * component tree, and the portal root re-applies the resolved values as attributes, so the token
 * overrides apply where the content actually lands.
 *
 * No `theme`, `density` or `portalContainer` prop, deliberately (TRD Section 4 rule 2, D0018).
 * Solving this with props would mean the same three props on every overlay, permanently.
 *
 * ## The stacking contract (D0088) - load-bearing, not an implementation detail
 *
 * Every portalled surface shares one layer (`--clara-layer-overlay`), so which of two overlays
 * paints on top is decided by DOM order: equal z-index paints in tree order. That is only correct
 * if the host for an overlay is appended to `document.body` AT THE MOMENT IT OPENS - so this
 * component creates the host when it HAS content and removes it when the content goes away, rather
 * than holding one host for its whole lifetime.
 *
 * The distinction is the whole model. A host created once at mount pins sibling order to MOUNT
 * order, and then `<ClaraPortal>{open && <Menu/>}</ClaraPortal>` mounted before a Modal paints its
 * menu underneath however late it was opened - the exact inversion the per-role scale was deleted
 * to avoid. It is not a corner case: a Toast viewport is conventionally mounted once at app start,
 * and Radix `forceMount` / `Presence` keep a portal mounted through an exit animation.
 *
 * Asserted by `portals stack by open order` in `theming.test.tsx`, which AC3 of US-01M0GM61 runs.
 */
export function ClaraPortal ({ children }: ClaraPortalProps) {
  const settings = useClaraSettings()
  const [host, setHost] = useState<HTMLElement | null>(null)
  const open = rendersContent(children)

  // The host is created in an effect: `document` does not exist during a server render, and a
  // component that reads it while rendering breaks SSR (PRD F23). Server-rendering an overlay's
  // content is not meaningful anyway - it has nowhere to go until there is a document.
  useEffect(() => {
    if (!open) { setHost(null); return }
    const el = document.createElement('div')
    document.body.appendChild(el)
    setHost(el)
    return () => { el.remove() }
  }, [open])

  if (!open || !host) return null
  return createPortal(<div {...claraAttributes(settings)}>{children}</div>, host)
}
