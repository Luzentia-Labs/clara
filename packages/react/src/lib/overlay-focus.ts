import { useEffect, useRef, type RefObject } from 'react'

/**
 * Focus capture and restoration for a portalled overlay - ONE implementation.
 *
 * Extracted from Modal so Drawer can have focus parity BY IDENTITY rather than by a second copy
 * that drifts (US-01M0GMWW AC2). It is the same argument D0100 made for the spinner ring, and it
 * matters more here: this is roughly a hundred lines of behaviour that took nine adversarial review
 * rounds to get right, and every comment below records a defect that was actually measured. A copy
 * would inherit the code and not the reasons, and the first person to "simplify" one of them would
 * reintroduce a strand in one overlay and not the other.
 *
 * Nothing about the logic changed in the extraction. If a comment says "measured in Chromium", it
 * was measured against Modal, and it is why the line above it is shaped the way it is.
 */
export interface OverlayFocus {
  /**
   * Wire to Radix's `onOpenAutoFocus`.
   *
   * Runs inside the portal, in the commit that mounts the content - which is the only place a named
   * ref is populated (D0090) AND the last moment `document.activeElement` is still the element that
   * opened the overlay.
   */
  handleOpenAutoFocus: (event: Event, initialFocus?: RefObject<HTMLElement | null>) => void
}

export function useOverlayFocusRestore (
  open: boolean,
  returnFocus?: RefObject<HTMLElement | null>,
): OverlayFocus {
  // The opener is captured in `onOpenAutoFocus`, NOT in an effect here. React runs child effects
  // before parent ones, so by the time an effect in the component runs, Radix has already moved
  // focus into the dialog and `document.activeElement` is the dialog's own first control - the
  // capture records the wrong element and the restore then does nothing. Radix's open event fires
  // before it moves focus, which is the one moment the opener is still current.
  const openerRef = useRef<HTMLElement | null>(null)

  // Restoration runs on the open -> closed TRANSITION, never on mount.
  //
  // Without this an overlay rendered `open={false}` - the ordinary state of every dialog on the
  // page - ran the restore on its first commit with both targets null, fell into the fallback loop,
  // and took focus from whatever the user was on. Measured in Chromium: focus jumped to the page's
  // skip link and `scrollY` went 4000 to 0. Round 1's version usually no-op'd; round 2's
  // try-until-it-takes loop made the theft reliable, which is a fix making a bug worse.
  const wasOpen = useRef(false)

  const restoreNamed = useRef<() => boolean>(() => false)
  const restoreFallback = useRef<() => void>(() => {})

  // Restoring on UNMOUNT as well as on close.
  //
  // `{open && <Modal open .../>}` is the first thing a React developer writes, and it is what a
  // router does on a redirect. There is no open -> closed transition in that case: the component
  // simply goes away. Clara suppresses Radix's own restore (`onCloseAutoFocus` preventDefault) and
  // owns restoration in the effect below, which never runs on unmount - so focus was stranded on
  // `document.body` on ALL FOUR routes, in the one behaviour these components are named for.
  //
  // A ref-reading cleanup rather than a second effect, because it must see the LATEST opener and
  // `returnFocus` without re-subscribing on every render.
  useEffect(() => () => {
    if (!wasOpen.current) return
    // DEFERRED, unlike the close path, and the ordering is the whole reason.
    //
    // React runs this component's cleanup BEFORE Radix's Content cleanup. Restoring synchronously
    // here focuses the right element and Radix then immediately moves focus again - its FocusScope
    // restores to the element it stored, which on this route is the removed opener, so focus lands
    // on `document.body`. Measured: the loop reported 3 candidates and 3 focusable, focused one,
    // and the page still ended on BODY.
    //
    // A microtask runs after every synchronous cleanup in the same task, so Clara's restoration is
    // last and wins. The close path stays synchronous because there Radix's restore is suppressed
    // by `onCloseAutoFocus` and the extra tick would be an observable delay for no benefit.
    const named = restoreNamed.current
    const fallback = restoreFallback.current
    queueMicrotask(() => {
      // PHASE 1 - every named restore, before any fallback anywhere. A named target must beat an
      // anonymous one regardless of which overlay React's deletion walk reached first.
      if (named()) return
      // PHASE 2 - a fallback only once every named restore in this commit has had its turn.
      queueMicrotask(fallback)
    })
  }, [])

  useEffect(() => {
    // `wasOpen` is NOT set here. This effect runs before the portal content exists - the host is
    // created in ClaraPortal's own effect and the content lands on its second commit (D0090) - so
    // a window exists where the overlay is "open" with nothing mounted and no opener captured. An
    // unmount in that window ran the cleanup, found no opener, fired the fallback and STOLE focus,
    // and `onOpenAutoFocus` then recorded the stolen element as the opener. StrictMode reproduces
    // it every time (Next.js dev default), and so does Fast Refresh or a route guard redirecting
    // on the mounting flush. `wasOpen` is set in the open-auto-focus handler, which is the moment
    // the content exists AND the opener is still current - the same moment the opener is captured.
    if (open) return
    if (!wasOpen.current) return
    wasOpen.current = false
    if (!restoreNamed.current()) restoreFallback.current()
  }, [open, returnFocus])

  /**
   * Restoration in two phases, because a named target must beat an anonymous one REGARDLESS of
   * which overlay React's deletion walk reaches first.
   *
   * With one phase, a confirm dialog whose opener died with the edit dialog under it ran its
   * fallback, grabbed the document's first focusable element, and the edit Modal's NAMED restore
   * was then suppressed by the already-focused guard - so an ordinary `useConfirm()` provider left
   * the user on the page's skip link after every confirmed action. Which overlay goes first is
   * React's traversal order, not JSX order: invisible and uncontrollable to a consumer.
   *
   * Phase 1 runs every named restore. Phase 2 runs a fallback only if phase 1 left nothing focused.
   * Both phases are microtasks, so both still run before the application's own effects - which is
   * why an app that focuses a record heading on navigation continues to win over either.
   */
  restoreNamed.current = () => {
    const target = returnFocus?.current ?? openerRef.current
    openerRef.current = null
    wasOpen.current = false

    // Somebody already placed focus - leave it. In phase 1 that can only be the APPLICATION or
    // another overlay's NAMED restore, because every fallback now runs in phase 2. That is what
    // makes this check safe here when it was not safe before the split: it used to also mean
    // "another overlay's anonymous fallback", which is how a named target got locked out.
    //
    // It has to be here and not only in phase 2: passive effects flush before this microtask, so an
    // app that focuses a record heading on navigation has already chosen by now, and without this
    // the named restore overrides it.
    const already = document.activeElement
    if (already && already !== document.body && already.isConnected) return true

    if (!target?.isConnected) return false
    target.focus({ preventScroll: true })
    // Whether focus ACTUALLY took, not whether it was attempted. `isConnected` is not focusable:
    // a `disabled` opener - the ordinary pending-state idiom - a `display: none` target, an
    // `[inert]` subtree, a collapsed `<details>`, and a closed native `<dialog>` all make `.focus()`
    // a silent no-op. Returning `true` regardless meant phase 2 never ran and focus stayed on
    // `document.body`, which is the strand this whole path exists to prevent. The fallback loop
    // below already checks exactly this; the named path was not applying its own lesson.
    return document.activeElement === target
  }

  restoreFallback.current = () => {
    // Focus on a real, connected element is somebody's decision by now - another overlay's named
    // restore, or the application's. Only `document.body` is nobody's.
    const active = document.activeElement
    if (active && active !== document.body && active.isConnected) return
    // Nothing named survives anywhere, so put focus somewhere a keyboard user can continue from
    // rather than at the top of the document. `body` is not a position.
    //
    // "First match of a CSS selector" is NOT the first focusable element: a review proved in
    // Chromium that the selector picks a `[hidden]` button, `.focus()` on it is a silent no-op, and
    // focus lands on `document.body`. So candidates are TRIED until one takes focus.
    //
    // TWO passes. PREFER a candidate that is not `aria-hidden`, but ACCEPT one rather than leave
    // focus on the body: `aria-hidden` means hidden from assistive technology, it does not make an
    // element unfocusable, and on the unmount route every background subtree is still marked while
    // Radix unwinds. `[hidden]` and `[inert]` genuinely cannot take focus, so they are always out.
    const candidates = [...document.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )].filter((el) => !el.closest('[hidden], [inert]'))
    for (const pass of [
      candidates.filter((el) => !el.closest('[aria-hidden="true"]')),
      candidates,
    ]) {
      for (const candidate of pass) {
        // `preventScroll`, because focusing scrolls the element into view by default and an overlay
        // closing must not move the page the user was reading.
        candidate.focus({ preventScroll: true })
        if (document.activeElement === candidate) return
      }
    }
  }

  return {
    handleOpenAutoFocus (event, initialFocus) {
      // `document.activeElement` is `<body>` when nothing was focused - an overlay rendered `open`
      // on mount, or one whose opener was removed in the same commit. Body is CONNECTED, so storing
      // it produced a "valid" restoration target that focuses nothing and reads as
      // `activeElement === document.body`, which is the strand itself.
      const active = document.activeElement
      openerRef.current = active && active !== document.body ? (active as HTMLElement) : null
      // Set HERE, not in the effect: this is the first moment the portalled content exists, so
      // "the overlay was really open" and "an opener was captured" become true together.
      wasOpen.current = true
      if (!initialFocus?.current) return
      // Radix would otherwise focus the first tabbable element, which is the close button.
      event.preventDefault()
      initialFocus.current.focus({ preventScroll: true })
    },
  }
}
