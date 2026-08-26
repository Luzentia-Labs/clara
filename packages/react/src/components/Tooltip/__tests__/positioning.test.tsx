import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tooltip } from '../Tooltip'

/**
 * The positioning props actually REACH Radix.
 *
 * Written in a self-sweep, not from a review finding, and it closes the same gap twice found
 * elsewhere: Popover's `collision.test.tsx` and DropdownMenu's `positioning.test.tsx` both exist
 * because a seat measured their positioning props being deletable with every gate green. Tooltip
 * had the identical hole and nobody had looked - deleting `avoidCollisions`, or replacing
 * `side={placement}` with a constant, left all 21 tests passing.
 *
 * That matters here for the same reason it did there: `placement` is public API, so a prop that
 * reaches nothing is a prop consumers configure and Clara ignores.
 *
 * Own file, because `vi.mock` is file-scoped and the main suite's whole point is Radix's real
 * hover, focus and dismissal behaviour.
 */
const contentProps: Array<Record<string, unknown>> = []

vi.mock('@radix-ui/react-tooltip', async () => {
  const actual = await vi.importActual<typeof import('@radix-ui/react-tooltip')>(
    '@radix-ui/react-tooltip',
  )
  return {
    ...actual,
    Content: (props: Record<string, unknown>) => {
      contentProps.push(props)
      return <actual.Content {...props} />
    },
  }
})

async function open (placement?: 'top' | 'right' | 'bottom' | 'left') {
  contentProps.length = 0
  render(
    <Tooltip content="Recalculates every open line" {...(placement ? { placement } : {})}>
      <button>Recalculate</button>
    </Tooltip>,
  )
  // Focus, not hover: it opens with no delay, so nothing here waits out 700ms.
  await userEvent.tab()
  await waitFor(() => expect(contentProps.length,
    'the tooltip never opened, so nothing was observed').toBeGreaterThan(0))
}

describe('Tooltip positioning is configured', () => {
  it('forwards the requested placement to the content', async () => {
    await open('left')
    expect(contentProps.at(-1)!.side, 'placement is an inert prop - it reaches nothing').toBe('left')
  })

  it('defaults to top rather than leaving it unset', async () => {
    await open()
    expect(contentProps.at(-1)!.side).toBe('top')
  })

  it('asks for collision avoidance, a non-zero padding, and an offset from the trigger', async () => {
    await open()
    const props = contentProps.at(-1)!
    // `avoidCollisions` defaults to true in Radix, so its absence behaves correctly TODAY. Asserted
    // anyway: leaving it implicit makes Clara's behaviour hostage to a third party's default, and
    // this is the test that notices that default changing.
    expect(props.avoidCollisions, 'the tooltip no longer asks for collision avoidance').toBe(true)
    // The one that is NOT safe to lose - Radix defaults it to 0.
    expect(props.collisionPadding, 'the collision gap is gone').toBe(8)
    // And it sits off the trigger rather than on top of the control it describes.
    expect(props.sideOffset, 'the tooltip renders flush against its trigger').toBeGreaterThan(0)
  })
})
