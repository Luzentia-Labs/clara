import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Popover } from '../Popover'
import { Button } from '../../Button/Button'

/**
 * AC2's narrowed half - "the collision behaviour is CONFIGURED" - observed directly.
 *
 * This lives in its own file because it needs a module mock, and `vi.mock` is file-scoped: putting
 * it in `popover.test.tsx` would replace Radix for every test there, including the ones whose whole
 * point is Radix's real focus and dismissal behaviour.
 *
 * ## Why this exists at all
 *
 * AC2 was deliberately narrowed from "it flips and shifts" to "the collision behaviour is
 * configured", because the rendered half is pure layout and jsdom computes none of it. The
 * narrowing was correct. What was missing is that nothing then observed the narrowed claim either:
 * a review deleted BOTH `avoidCollisions` and `collisionPadding={8}` and measured the whole
 * repository still green - 1155 tests, `check:overlay-contract`, `api-report`, all passing. So the
 * criterion asserted a property with no witness, which is the exact class this epic has spent ten
 * review rounds removing.
 *
 * It is not a harmless deletion either: `avoidCollisions` defaults to `true`, but `collisionPadding`
 * defaults to **0**, so the 8px gap Clara documents could be lost silently.
 *
 * ## Why a spy is the right instrument here, and not a proxy
 *
 * The criterion's subject is what Clara PASSES, not what the browser then does. Recording the props
 * that reach `RadixPopover.Content` observes exactly that, in the same terms the criterion is
 * written in. The rendered consequence stays deferred to BG-01M0XVXS and is claimed nowhere.
 */
const contentProps: Array<Record<string, unknown>> = []

vi.mock('@radix-ui/react-popover', async () => {
  const actual = await vi.importActual<typeof import('@radix-ui/react-popover')>(
    '@radix-ui/react-popover',
  )
  return {
    ...actual,
    Content: (props: Record<string, unknown>) => {
      contentProps.push(props)
      return <actual.Content {...props} />
    },
  }
})


describe('Popover collision handling is configured', () => {
  it('passes avoidCollisions and a non-zero collisionPadding to the panel', async () => {
    contentProps.length = 0
    render(
      <Popover open onOpen={() => {}} onClose={() => {}} label="Options"
        trigger={<Button>Options</Button>}>
        <button>Inside</button>
      </Popover>,
    )
    await screen.findByRole('button', { name: 'Inside' })
    expect(contentProps.length, 'the panel never rendered, so nothing was observed')
      .toBeGreaterThan(0)
    const props = contentProps.at(-1)!
    // `avoidCollisions` defaults to true in Radix, so its ABSENCE would also behave correctly today.
    // It is asserted anyway: leaving it implicit makes Clara's behaviour hostage to a third party's
    // default, and this is the test that would notice that default changing under us.
    expect(props.avoidCollisions, 'Popover no longer asks for collision avoidance').toBe(true)
    // The one that is NOT safe to lose: Radix defaults this to 0.
    expect(props.collisionPadding, 'the documented 8px collision gap is gone').toBe(8)
  })

  it('still forwards the requested placement alongside it', async () => {
    // Guards against a fix that satisfies the two assertions above by hardcoding them somewhere
    // that no longer carries `side` - the two travel to the same element or neither claim holds.
    contentProps.length = 0
    render(
      <Popover open onOpen={() => {}} onClose={() => {}} label="Options" placement="left"
        trigger={<Button>Options</Button>}>
        <button>Inside</button>
      </Popover>,
    )
    await screen.findByRole('button', { name: 'Inside' })
    expect(contentProps.at(-1)!.side).toBe('left')
  })
})
