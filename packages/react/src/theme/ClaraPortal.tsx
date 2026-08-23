import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useClaraSettings } from './context'
import { claraAttributes } from './resolve'

export interface ClaraPortalProps { children?: ReactNode }

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
 */
export function ClaraPortal ({ children }: ClaraPortalProps) {
  const settings = useClaraSettings()
  const [host, setHost] = useState<HTMLElement | null>(null)

  // The host is created in an effect: `document` does not exist during a server render, and a
  // component that reads it while rendering breaks SSR (PRD F23). Server-rendering an overlay's
  // content is not meaningful anyway - it has nowhere to go until there is a document.
  useEffect(() => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    setHost(el)
    return () => { el.remove() }
  }, [])

  if (!host) return null
  return createPortal(<div {...claraAttributes(settings)}>{children}</div>, host)
}
