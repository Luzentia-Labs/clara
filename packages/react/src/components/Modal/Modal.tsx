import { forwardRef, useEffect, useId, useRef, type ReactNode, type RefObject } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { cx } from '../../lib/cx'
import { ClaraPortal } from '../../theme/ClaraPortal'
import { CloseIcon } from '@luzentialabs/clara-icons'
import { IconButton } from '../IconButton/IconButton'

export interface ModalProps {
  /** Whether the dialog is on screen. Controlled - Clara never owns this. */
  open: boolean
  /**
   * Called for EVERY dismissal route: Escape, a scrim click, the close button, and whatever the
   * footer does. One callback rather than four, because a consumer that has to remember to wire a
   * fourth route will forget, and the symptom is focus stranded on the body.
   */
  onClose: () => void
  /** The dialog's accessible name. Required: an unnamed dialog is announced as "dialog", nothing more. */
  title: string
  /** Announced after the title. Use it for the consequence of the action, not for instructions. */
  description?: string
  /** The scrolling body. Header and footer stay put around it. */
  children?: ReactNode
  /** Actions. Rendered outside the scroll container, so they are always reachable. */
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  /**
   * The element to focus when the dialog opens. Without it focus goes to the close button, which
   * is safe but rarely what you want - name the field somebody is here to fill in.
   */
  initialFocus?: RefObject<HTMLElement | null>
  /**
   * Where focus returns on close. Defaults to whatever was focused when the dialog opened, which
   * is right almost always; name one when the opener is about to be removed from the DOM.
   */
  returnFocus?: RefObject<HTMLElement | null>
  /**
   * Whether Escape and a scrim click dismiss. `false` for a dialog that must be answered - it does
   * NOT remove the close button, because a dialog with no way out is a trap.
   */
  dismissible?: boolean
  className?: string
}

/**
 * A modal dialog: focus goes in, stays in, and comes back to where it started.
 *
 * ## What this wraps, and what it refuses to expose
 *
 * Built on Radix Dialog (ADR-004, D0003) for the focus trap, the hidden background, the scroll lock
 * and the dismissal routes - months of WAI-ARIA work that is not worth re-deriving. None of Radix's
 * surface reaches Clara's: no `asChild`, no `onOpenChange`, no `data-state`. `onClose` is a Clara
 * name taking a Clara shape, and `check-api` fails the build on any of the three leaking.
 *
 * ## Stacking
 *
 * The scrim and the panel are SIBLINGS inside one `ClaraPortal` host, panel after scrim. Neither
 * carries a z-index of its own beyond the shared `--clara-layer-overlay`: equal z-index paints in
 * tree order, so the panel is over the scrim for free, and the whole host sits above or below
 * another overlay purely by which was opened last (D0088). A per-role constant cannot express that.
 *
 * ## Focus timing
 *
 * `ClaraPortal` creates its host in an effect, so the content lands on its second commit and an
 * effect in THIS component's body would find a null ref (D0090). The initial focus is therefore
 * applied from inside the portal, in Radix's own open handler, which runs when the content mounts.
 *
 * ## Motion
 *
 * None, deliberately (D0094). A centred dialog has no spatial origin, and its state change is
 * already the least ambiguous signal in the system. There is consequently no `prefers-reduced-motion`
 * branch - there is nothing to reduce.
 */
export const Modal = forwardRef<HTMLDivElement, ModalProps>(function Modal ({
  open, onClose, title, description, children, footer, size = 'md',
  initialFocus, returnFocus, dismissible = true, className,
}, ref) {
  const id = useId()
  const titleId = `${id}-title`
  const descriptionId = `${id}-description`

  // Focus restoration is Clara's, not Radix's, and that is a correction rather than a preference.
  //
  // Radix restores focus when its Content unmounts. Clara's portal removes its host the moment
  // `open` goes false (D0088/D0090 - the host IS the stacking position, so it cannot outlive the
  // open state), and the two teardowns race: focus landed on `document.body` on ALL FOUR dismissal
  // routes, which is precisely the strand this component exists to prevent. Proved by test before
  // it was fixed.
  //
  // So the opener is captured when the dialog opens and focused again when it closes, from an
  // effect in THIS component - which runs after the portal is gone and while the opener is still
  // in the document. `returnFocus` overrides it for the case where the opener is about to be
  // removed. Not a workaround: for a criterion asserted by element identity on four separate
  // routes, owning the mechanism is the only way to assert it.
  // The opener is captured in `onOpenAutoFocus` below, NOT in an effect here. React runs child
  // effects before parent ones, so by the time an effect in this component runs, Radix has already
  // moved focus into the dialog and `document.activeElement` is the dialog's own first control -
  // the capture records the wrong element and the restore then does nothing. Radix's open event
  // fires before it moves focus, which is the one moment the opener is still current.
  const openerRef = useRef<HTMLElement | null>(null)
  // Restoration runs on the open -> closed TRANSITION, never on mount.
  //
  // Without this a Modal rendered `open={false}` - the ordinary state of every dialog on the page -
  // ran the restore on its first commit with both targets null, fell into the fallback loop, and
  // took focus from whatever the user was on. Measured in Chromium: focus jumped to the page's
  // skip link and `scrollY` went 4000 to 0. Round 1's version usually no-op'd; round 2's
  // try-until-it-takes loop made the theft reliable, which is a fix making a bug worse.
  const wasOpen = useRef(false)

  // Restoring on UNMOUNT as well as on close.
  //
  // `{open && <Modal open .../>}` is the first thing a React developer writes, and it is what a
  // router does on a redirect. There is no open -> closed transition in that case: the component
  // simply goes away. Clara suppresses Radix's own restore (`onCloseAutoFocus` preventDefault) and
  // owns restoration in the effect below, which never runs on unmount - so focus was stranded on
  // `document.body` on ALL FOUR routes, in the one behaviour this component is named for, while the
  // docs page promised "you do not have to do anything for that to work".
  //
  // A ref-reading cleanup rather than a second effect, because it must see the LATEST opener and
  // `returnFocus` without re-subscribing on every render.
  const restore = useRef<() => void>(() => {})
  useEffect(() => () => { if (wasOpen.current) restore.current() }, [])

  useEffect(() => {
    if (open) { wasOpen.current = true; return }
    if (!wasOpen.current) return
    wasOpen.current = false
    restore.current()
  }, [open, returnFocus])

  restore.current = () => {
    const target = returnFocus?.current ?? openerRef.current
    openerRef.current = null
    wasOpen.current = false
    // A disconnected target is the ordinary case, not an edge one: a menu item that opens a dialog
    // is unmounted with the menu, and a Modal that starts `open` on mount never had an opener at
    // all. Falling through here left focus on `document.body` - the exact strand the component
    // exists to prevent - and `onCloseAutoFocus` is preventDefault'ed, so Radix's own fallback
    // could not run either.
    if (target?.isConnected) { target.focus({ preventScroll: true }); return }
    // Nothing named survives, so put focus somewhere a keyboard user can continue from rather than
    // at the top of the document. `body` is not a position; the first focusable element is.
    //
    // "First match of a CSS selector" is NOT the first focusable element, and the difference is the
    // whole bug: a review proved in Chromium that the selector picks a `[hidden]` button, `.focus()`
    // on it is a silent no-op, and focus lands on `document.body` - the exact strand this fallback
    // exists to remove. jsdom cannot see it, because it computes no layout and honours no `hidden`.
    // So candidates are TRIED, in order, until one actually takes focus.
    const candidates = document.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    for (const candidate of candidates) {
      if (candidate.closest('[hidden], [inert], [aria-hidden="true"]')) continue
      // `preventScroll`, because focusing scrolls the element into view by default and a dialog
      // closing must not move the page the user was reading.
      candidate.focus({ preventScroll: true })
      if (document.activeElement === candidate) return
    }
  }

  // Radix reports every dismissal as a transition to closed. Clara's contract is one callback for
  // all of them, so this is the single place the two vocabularies meet - and it is internal.
  const handleOpenChange = (next: boolean) => { if (!next) onClose() }

  // `dismissible: false` blocks the two routes that can happen by accident. It deliberately does
  // NOT block the close button: a dialog with no way out is a trap, not a safeguard.
  const blockIfNotDismissible = (event: Event) => { if (!dismissible) event.preventDefault() }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <ClaraPortal open={open}>
        <Dialog.Overlay className="clara-modal__scrim" />
        <Dialog.Content
          ref={ref}
          className={cx('clara-modal', `clara-modal--${size}`, className)}
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          onEscapeKeyDown={blockIfNotDismissible}
          onPointerDownOutside={blockIfNotDismissible}
          onInteractOutside={blockIfNotDismissible}
          onOpenAutoFocus={(event) => {
            // Runs inside the portal, in the commit that mounts the content - which is the only
            // place a named ref is populated (D0090) AND the last moment `document.activeElement`
            // is still the element that opened the dialog.
            // `document.activeElement` is `<body>` when nothing was focused - a dialog rendered
            // `open` on mount, or one whose opener was removed in the same commit. Body is
            // CONNECTED, so storing it produced a "valid" restoration target that focuses nothing
            // and reads as `activeElement === document.body`, which is the strand itself.
            const active = document.activeElement
            openerRef.current = active && active !== document.body ? (active as HTMLElement) : null
            if (!initialFocus?.current) return
            // Radix would otherwise focus the first tabbable element, which is the close button.
            event.preventDefault()
            initialFocus.current.focus({ preventScroll: true })
          }}
          // Clara restores focus itself, in the effect above. Radix's restore runs against a portal
          // host Clara has already removed, so letting it also try means two mechanisms racing for
          // one outcome - and the one that wins is whichever unmounts last.
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <div className="clara-modal__header">
            <Dialog.Title id={titleId} className="clara-modal__title">{title}</Dialog.Title>
            {/* No `onClick={onClose}` here. `Dialog.Close` already routes through `onOpenChange`,
                so adding one called `onClose` TWICE on this route and once on every other - which a
                consumer notices as a double-submitted form, not as a focus bug. */}
            <Dialog.Close asChild>
              <IconButton icon={<CloseIcon />} label="Close" variant="secondary" />
            </Dialog.Close>
          </div>
          {description
            ? <Dialog.Description id={descriptionId} className="clara-modal__description">{description}</Dialog.Description>
            : null}
          <div className="clara-modal__body">{children}</div>
          {footer ? <div className="clara-modal__footer">{footer}</div> : null}
        </Dialog.Content>
      </ClaraPortal>
    </Dialog.Root>
  )
})
