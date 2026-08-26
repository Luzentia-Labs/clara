import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DropdownMenu } from '../DropdownMenu'

/**
 * The positioning props actually REACH Radix.
 *
 * A review stripped ALL FIVE - `side`, `avoidCollisions`, `collisionPadding` and `sideOffset` on the
 * root content, and `sideOffset`/`alignOffset` on the submenu - and measured the entire repository
 * still green: 1165 tests, typecheck, `pnpm check`, `check:overlay-contract`, `check:geometry`. So
 * `placement` was an inert public API prop, and the verification record claimed the configuration
 * was asserted while nothing observed it.
 *
 * Own file, because `vi.mock` is file-scoped and the main suite's whole point is Radix's real
 * keyboard behaviour. Same shape as Popover's `collision.test.tsx`, and for the same reason: the
 * claim's subject is what Clara PASSES, so recording the props that arrive observes it directly
 * rather than through a proxy.
 *
 * What the browser then DOES with them is a separate claim, and it is unasserted for this component
 * - `e2e/stacking.spec.ts` covers Popover's flip and the overlay stacking, and contains no
 * DropdownMenu case at all. An earlier version of this paragraph said the rendered half was
 * "deferred to" that file, which read as coverage that does not exist. The gap is recorded in
 * `verification.md` under BG-01M0XVXS.
 */
const contentProps: Array<Record<string, unknown>> = []
const subContentProps: Array<Record<string, unknown>> = []

vi.mock('@radix-ui/react-dropdown-menu', async () => {
  const actual = await vi.importActual<typeof import('@radix-ui/react-dropdown-menu')>(
    '@radix-ui/react-dropdown-menu',
  )
  return {
    ...actual,
    Content: (props: Record<string, unknown>) => {
      contentProps.push(props)
      return <actual.Content {...props} />
    },
    SubContent: (props: Record<string, unknown>) => {
      subContentProps.push(props)
      return <actual.SubContent {...props} />
    },
  }
})


function open (placement?: 'top' | 'right' | 'bottom' | 'left') {
  contentProps.length = 0
  subContentProps.length = 0
  render(
    <DropdownMenu
      open onOpen={() => {}} onClose={() => {}}
      {...(placement ? { placement } : {})}
      trigger={<button>Actions</button>}
      items={[
        { label: 'Post', onSelect: () => {} },
        // A SUBMENU, or `SubContent` never renders and `subContentProps` stays empty. It was
        // declared, pushed to and cleared - and asserted by nothing, because this fixture had no
        // submenu at all. A review measured `contentProps=1, subContentProps=0` and stripping the
        // submenu's two offsets reddened zero tests, while the record claimed all five props were
        // covered. An unreachable arm that makes a file look authoritative is worse than an absent
        // one.
        { label: 'Export', items: [{ label: 'CSV', onSelect: () => {} }] },
      ]}
    />,
  )
}

describe('DropdownMenu positioning is configured', () => {
  it('forwards the requested placement to the panel', async () => {
    open('left')
    await screen.findByRole('menuitem', { name: 'Post' })
    expect(contentProps.length, 'the menu never rendered, so nothing was observed')
      .toBeGreaterThan(0)
    expect(contentProps.at(-1)!.side, 'placement is an inert prop - it reaches nothing').toBe('left')
  })

  it('defaults to bottom rather than leaving it unset', async () => {
    open()
    await screen.findByRole('menuitem', { name: 'Post' })
    expect(contentProps.at(-1)!.side).toBe('bottom')
  })

  it('forwards the SUBMENU\'s own offsets, which no assertion reached before', async () => {
    open()
    await screen.findByRole('menuitem', { name: 'Post' })
    // Radix renders SubContent lazily, so the submenu trigger has to be opened for it to exist.
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}')
    await waitFor(() => expect(subContentProps.length,
      'the submenu never rendered, so nothing was observed').toBeGreaterThan(0))
    const props = subContentProps.at(-1)!
    expect(props.sideOffset, 'the submenu renders flush against its parent item').toBe(2)
    expect(props.alignOffset, 'the submenu no longer aligns to its parent item').toBe(-4)
  })

  it('asks for collision avoidance with a non-zero padding', async () => {
    open()
    await screen.findByRole('menuitem', { name: 'Post' })
    const props = contentProps.at(-1)!
    // `avoidCollisions` defaults to true in Radix, so its absence would behave correctly today.
    // Asserted anyway: leaving it implicit makes Clara's behaviour hostage to a third party's
    // default, and this is the test that notices that default changing.
    expect(props.avoidCollisions, 'the menu no longer asks for collision avoidance').toBe(true)
    // The one that is NOT safe to lose - Radix defaults this to 0.
    expect(props.collisionPadding, 'the collision gap is gone').toBe(8)
    // And it sits off the trigger rather than on top of it.
    expect(props.sideOffset, 'the menu renders flush against its trigger').toBeGreaterThan(0)
  })
})
