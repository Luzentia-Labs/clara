import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useClaraSettings } from './context'
import { claraAttributes } from './resolve'

export interface ClaraPortalProps {
  /**
   * Whether the overlay is open. REQUIRED, and load-bearing - see the stacking contract below.
   *
   * This is not inferable from `children`. An earlier version decided it by asking whether the
   * children would render anything, which a review defeated in one line: wrap the same conditional
   * in a fragment, or hand the portal a component that returns `null` while closed - which is what
   * every exit animation does - and the portal read as OPEN with nothing in it.
   */
  open: boolean
  children?: ReactNode
}

/**
 * Layout effects run before paint, so the portalled content is in the DOM by the time the browser
 * draws the frame in which the overlay opened.
 *
 * Chosen at module scope, not in render: `useLayoutEffect` warns when it runs on the server, and a
 * component that reads `document` DURING RENDER breaks SSR outright (PRD F23, AC4).
 */
const useHostEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect

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
 * ## The stacking contract (D0088, D0090) - load-bearing, not an implementation detail
 *
 * Every portalled surface shares one layer (`--clara-layer-overlay`), so which of two overlays
 * paints on top is decided by DOM order: equal z-index paints in tree order. That is only correct
 * if the host for an overlay is appended to `document.body` AT THE MOMENT IT OPENS - so this
 * component creates the host when `open` becomes true and removes it when `open` becomes false,
 * rather than holding one host for its whole lifetime.
 *
 * The distinction is the whole model. A host created once at mount pins sibling order to MOUNT
 * order, so a surface mounted early paints under one opened later - the exact inversion the
 * per-role scale was deleted to avoid.
 *
 * The example has to be two surfaces on the SAME layer, because tree order only decides between
 * siblings a z-index has not already separated: a Drawer that is mounted but closed, and a Popover
 * opened afterwards, both on `layer.overlay`. An earlier version of this comment used a Toast
 * viewport against an overlay, which cannot happen - `layer.toast` is 1500 against `layer.overlay`
 * at 1000, and the higher z-index wins whatever the tree says. The rule was right and the example
 * was impossible, which is worse than no example: twelve overlays inherit this mechanism and the
 * next reader would have learned a false model of it (US-01M0GM61 round 6).
 *
 * `open` is a REQUIRED prop rather than something inferred from `children` because the inference
 * cannot be made safe. A child that renders `null` is indistinguishable from a child that renders
 * something, from outside; and rendering `null` while closed is precisely what a Radix `Presence`
 * wrapper, a `forceMount` exit animation, and any ordinary extracted `<Overlay/>` component all do.
 *
 * ## What an overlay may assume about timing - READ THIS BEFORE WRITING FOCUS MANAGEMENT
 *
 * The portalled content does not exist until this component's SECOND commit. The host is created in
 * an effect (it has to be - see the note in the body), so the first commit after `open` turns true
 * renders nothing, and the content arrives in the commit that the host's state update causes.
 *
 * The consequence, and it is the one that bites: **an effect in the component that OPENS the
 * overlay runs too early.** `useEffect(() => ref.current?.focus(), [open])` in a Modal's own body
 * finds `ref.current === null`. That is the epic's headline criterion - "every overlay names its
 * initial focus target on open" - failing silently, in a way axe cannot see.
 *
 * **Focus from INSIDE the portal**, in an effect belonging to the portalled content, or from a
 * callback ref on the element itself. Both run in the commit that puts the content in the DOM. This
 * is also how Radix does it, and ADR-004 adopts Radix to inherit exactly this kind of answer.
 *
 * Layout, not passive, so nothing is painted before the content lands - there is no visible flash,
 * only an ordering constraint on effects.
 *
 * Asserted by `the overlay stacking order in the DOM` in `theming.test.tsx`, which AC3 runs.
 */
export function ClaraPortal ({ open, children }: ClaraPortalProps) {
  const settings = useClaraSettings()
  const [host, setHost] = useState<HTMLElement | null>(null)

  // The host is created in an effect, and the effect is the LAST possible moment: `document` does
  // not exist during a server render, and a component that reads it while rendering breaks SSR
  // (PRD F23). A lazy `useState(() => document.createElement('div'))` guarded by `typeof document`
  // looks like it would work and does not - `renderToStaticMarkup` runs under jsdom in this repo's
  // own test environment, where `document` IS defined, so the guard passes and React then throws
  // "Portals are not currently supported by the server renderer". The guard has to be "am I on the
  // client", which no render-time expression can answer, so it is an effect.
  //
  // It is a LAYOUT effect where there is a document, so the content commits before paint. A passive
  // effect would let the browser paint the opened overlay's frame with nothing in it.
  useHostEffect(() => {
    if (!open) { setHost(null); return }
    const el = document.createElement('div')
    document.body.appendChild(el)
    setHost(el)
    return () => { el.remove() }
  }, [open])

  if (!open || !host) return null
  return createPortal(<div {...claraAttributes(settings)}>{children}</div>, host)
}
