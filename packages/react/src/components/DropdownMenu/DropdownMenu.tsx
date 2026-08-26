'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import * as RadixMenu from '@radix-ui/react-dropdown-menu'
import { cx } from '../../lib/cx'
import { ClaraPortal } from '../../theme/ClaraPortal'
import { devWarning } from '../../lib/dev-warning'

/** Which side of the trigger it prefers. It flips when there is no room. */
export type DropdownMenuPlacement = 'top' | 'right' | 'bottom' | 'left'

/** One action. Selecting it runs `onSelect` and closes the menu. */
export interface DropdownMenuAction {
  /** The visible text, and the accessible name. Typeahead matches against it. */
  label: string
  onSelect: () => void
  disabled?: boolean
  items?: never
  separator?: never
}

/** A submenu. It has no `onSelect` of its own - opening it IS the action. */
export interface DropdownMenuSubmenu {
  label: string
  items: DropdownMenuEntry[]
  disabled?: boolean
  onSelect?: never
  separator?: never
}

/** A divider between groups. Every keyboard route skips it. */
export interface DropdownMenuSeparator {
  separator: true
  label?: never
  items?: never
  onSelect?: never
  disabled?: never
}

export type DropdownMenuEntry = DropdownMenuAction | DropdownMenuSubmenu | DropdownMenuSeparator

export interface DropdownMenuProps {
  /** Whether it is on screen. Controlled - Clara never owns this, matching Popover. */
  open: boolean
  /** Called when the menu asks to open: the trigger was activated. */
  onOpen: () => void
  /** Called for every dismissal route: Escape, an outside click, and selecting an item. */
  onClose: () => void
  /**
   * The control it hangs from. Rendered as the anchor AND as where focus returns.
   *
   * A node rather than a ref, for the reason Popover records: the trigger has to sit inside the
   * positioning root for the panel to stay anchored to it, which is also what gives Radix a real
   * element to restore focus to.
   */
  trigger: ReactNode
  /**
   * The menu, as DATA rather than as composed children.
   *
   * Clara does not export `DropdownMenuItem`, `DropdownMenuSeparator` and the rest, and that is the
   * point. A composed API is a set of Radix primitives wearing Clara names, and the first consumer
   * to nest one wrongly - an Item outside a Sub, a Separator inside a Trigger - gets a runtime error
   * naming a Radix component, which Section 4 rule 7 forbids reaching a consumer at all.
   *
   * Describing the menu as a list makes the illegal arrangements unrepresentable, and the union
   * below makes "an action that also has a submenu" or "a separator with a label" a type error
   * rather than a support question.
   */
  items: DropdownMenuEntry[]
  placement?: DropdownMenuPlacement
  className?: string
}

const isSeparator = (entry: DropdownMenuEntry): entry is DropdownMenuSeparator =>
  entry.separator === true

const isSubmenu = (entry: DropdownMenuEntry): entry is DropdownMenuSubmenu =>
  Array.isArray((entry as DropdownMenuSubmenu).items)

/**
 * Entries, rendered recursively so a submenu is the same shape as the menu containing it.
 *
 * Keyed by index deliberately: a menu is a positional list with no identity of its own, `label` is
 * not unique (two "Export..." entries under different groups are legal), and the list does not
 * reorder while it is open.
 */
function Entries ({ items }: { items: DropdownMenuEntry[] }) {
  return (
    <>
      {items.map((entry, index) => {
        if (isSeparator(entry)) {
          return <RadixMenu.Separator key={index} className="clara-dropdown-menu__separator" />
        }
        if (isSubmenu(entry)) {
          return (
            <RadixMenu.Sub key={index}>
              {/* Spread, not `disabled={undefined}`: under `exactOptionalPropertyTypes` an
                  explicit undefined is not an absent prop. */}
              <RadixMenu.SubTrigger className="clara-dropdown-menu__item" {...(entry.disabled ? { disabled: true } : {})}>
                {entry.label}
              </RadixMenu.SubTrigger>
              {/*
                * NOT wrapped in a ClaraPortal, unlike the root content - because it does not need
                * one: `SubContent` renders into the portal its parent menu already established, so
                * it inherits the Clara scope without asking.
                *
                * An earlier version of this comment gave two REASONS, and a review measured both
                * FALSE: wrapping `SubContent` in a Radix portal leaves all 22 tests green, roving
                * focus and typeahead included, and Escape's level does not depend on portalling at
                * all - `@radix-ui/react-menu` calls the ROOT context's close unconditionally
                * (`dist/index.mjs:753`), so a submenu Escape closes the whole menu either way.
                *
                * The decision stands; the justification did not survive contact with the code, and
                * this comment now says only what is true. The Escape behaviour is a real APG
                * deviation and is recorded as a gap rather than as a feature.
                */}
              {/* `loop` here too - a submenu that behaves differently from its parent is a
                  worse surprise than one that does not wrap at all. */}
              <RadixMenu.SubContent className="clara-dropdown-menu" sideOffset={2} alignOffset={-4} loop>
                <Entries items={entry.items} />
              </RadixMenu.SubContent>
            </RadixMenu.Sub>
          )
        }
        return (
          <RadixMenu.Item
            key={index}
            className="clara-dropdown-menu__item"
            {...(entry.disabled ? { disabled: true } : {})}
            onSelect={entry.onSelect}
          >
            {entry.label}
          </RadixMenu.Item>
        )
      })}
    </>
  )
}

/**
 * An ACTIONS menu, implementing the WAI-ARIA menu pattern.
 *
 * ## Actions, not navigation (D0020)
 *
 * Every entry here DOES something. A menu of links that navigate is a different pattern with
 * different semantics: `role="menu"` tells a screen-reader user to expect commands, so announcing a
 * set of destinations as commands misdescribes what pressing Enter will do. Navigation menus are
 * v1.1; the docs page says so and AC3 checks that it still does.
 *
 * ## The menu is named by its TRIGGER, and there is deliberately no `label` prop
 *
 * Popover requires a `label`; this does not, and the difference is not an inconsistency. Radix
 * wires `aria-labelledby` on the menu to the trigger's id, and `aria-labelledby` WINS over
 * `aria-label` in every accessible-name computation - so a `label` prop here would be a prop that
 * silently does nothing, which is worse than no prop. Measured: with both present the menu's name
 * was the trigger's text, not the value passed in.
 *
 * Naming a menu by the button that opened it is also the WAI-ARIA pattern's own answer, and it
 * cannot be forgotten: the trigger already needs an accessible name to be usable at all, so the
 * menu inherits a correct one for free. A Popover differs because its panel is a `role="group"`
 * region that Radix does not name from the trigger.
 *
 * ## Focus restoration is Radix's here, and correct by construction
 *
 * The same argument as Popover's. Clara owns the trigger, so Radix holds a real ref to it and
 * restores focus itself. Modal and Drawer need `useOverlayFocusRestore` precisely because their
 * opener lives outside the component, which is not the case here - and adding Clara's machinery
 * would be two mechanisms racing for one outcome.
 */
export function DropdownMenu ({
  open, onOpen, onClose, trigger, items, placement = 'bottom', className,
}: DropdownMenuProps) {
  const handleOpenChange = (next: boolean) => { if (next) onOpen(); else onClose() }

  /*
   * Changing `items` while the menu is OPEN can fire an action the user did not aim at.
   *
   * Measured: with the highlight on an entry, inserting a new entry above it leaves roving focus on
   * the same COLLECTION INDEX, which is now a different row - so Enter runs the inserted entry's
   * handler and not the one the user was looking at. If the inserted entry is destructive, that is
   * a destructive action nobody chose.
   *
   * It is NOT the index keys, which is what an earlier comment here implied: keying by
   * `${index}:${label}` changes nothing, and a plain click still runs the right handler. The
   * mechanism is Radix's roving-focus collection index, and Clara cannot fix it without owning focus
   * itself - which is the machinery ADR-004 adopted Radix to avoid.
   *
   * So it is DISCLOSED rather than silently shipped: a review's plain ruling was that an unaimed
   * action is not acceptable to ship in silence, and is acceptable to ship disclosed. An async load
   * or a poll landing while a menu is open is ordinary in the domain this library is for.
   */
  const itemsRef = useRef(items)
  useEffect(() => {
    // Guarded at the CALL SITE, for the reason `check-dev-warnings.mjs` exists: `devWarning` returns
    // early in production, but its arguments are still evaluated and the message literal is still
    // reachable, so a minifier cannot drop it. That guard caught this very warning shipping
    // unguarded on the same day it was written to catch the identical defect in NumberInput.
    if (process.env.NODE_ENV === 'production') return
    devWarning(
      open && itemsRef.current !== items && itemsRef.current.length !== items.length,
      'A DropdownMenu\'s `items` changed while the menu was OPEN. Keyboard focus tracks a position ' +
      'in the list, not an entry, so the highlight can end up on a different entry than the one the ' +
      'user was looking at - and Enter then runs THAT entry\'s action. If a list can change while ' +
      'open (an async load, a poll), close the menu first or keep the list stable while it is open.',
    )
    itemsRef.current = items
  }, [items, open])

  return (
    <RadixMenu.Root open={open} onOpenChange={handleOpenChange}>
      <RadixMenu.Trigger asChild>{trigger}</RadixMenu.Trigger>
      <ClaraPortal open={open}>
        <RadixMenu.Content
          className={cx('clara-dropdown-menu', className)}
          side={placement}
          avoidCollisions
          collisionPadding={8}
          sideOffset={4}
          /*
           * ArrowDown past the last entry returns to the first, and ArrowUp past the first goes to
           * the last. Radix's `loop` defaults to FALSE, so this has to be asked for.
           *
           * It was documented in three places - the docs keyboard table, the verification record
           * and the commit message - before it was implemented, and a review measured the menu
           * simply stopping at the ends. Worse, the suite was blind in BOTH directions: turning
           * looping on changed no test result either, because the test named "wraps from the last
           * entry back to the first" actually asserted where ArrowUp lands on a freshly OPENED
           * menu, which is a different property.
           *
           * On a thirty-entry menu the difference is real: without it, arrowing to an entry near
           * the top from the bottom means traversing the whole list.
           */
          loop
        >
          <Entries items={items} />
        </RadixMenu.Content>
      </ClaraPortal>
    </RadixMenu.Root>
  )
}
