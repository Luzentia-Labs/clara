import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button/Button'
import { Popover } from './Popover'
import type { PopoverPlacement } from './Popover'

const meta = {
  title: 'Overlays/Popover',
  component: Popover,
  tags: ['autodocs'],
  args: {
    open: false, onOpen: () => {}, onClose: () => {},
    label: 'Column options', trigger: null, children: null, placement: 'bottom',
  },
  argTypes: {
    placement: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left'] },
  },
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

function Demo ({ placement, align = 'center' }: { placement: PopoverPlacement, align?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ padding: 48, display: 'flex', justifyContent: align }}>
      <Popover
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        label="Column options"
        placement={placement}
        trigger={<Button variant="secondary">Options</Button>}
      >
        <p style={{ margin: 0 }}>Choose which columns appear in the table.</p>
      </Popover>
    </div>
  )
}

export const Bottom: Story = { render: () => <Demo placement="bottom" /> }
export const Top: Story = { render: () => <Demo placement="top" /> }

/**
 * Pinned against the edge, where AC2's flip and shift happen.
 *
 * This story is now the FIXTURE for `e2e/stacking.spec.ts`'s "a popover pinned against an edge
 * stays on screen", which drives it in a real browser - so it is proof, not only a place to look.
 * The comment here previously said nothing automated proved it, which stopped being true when
 * BG-01M0XVXS was closed and this assertion was written.
 *
 * It is a `tags: ['autodocs']` docstring, so it renders as the story's description in Storybook -
 * a stale sentence here is read by anyone browsing the component.
 */
export const AgainstTheEdge: Story = { render: () => <Demo placement="left" align="flex-start" /> }

/**
 * Sixty rows, so the content overflows at every viewport this is measured at - a fixture that
 * happens to fit is a fixture that tests nothing, which the assertion says out loud.
 *
 * Measured before the cap: 106x656 at EVERY viewport, so the assertion that it "stays on screen"
 * was true at 1280x720 and false at 1280x600 - a property of the fixture, not of the component. And
 * the overflow was unreachable, because the popper wrapper is `position: fixed` and does not extend
 * the document: panel bottom 784 against a viewport of 400, `document.scrollHeight` 432.
 */
export const LongContent: Story = {
  render: () => {
    function Demo () {
      const [open, setOpen] = useState(true)
      return (
        <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
          <Popover
            open={open} onOpen={() => setOpen(true)} onClose={() => setOpen(false)}
            label="Column options" placement="bottom"
            trigger={<Button variant="secondary">Options</Button>}
          >
            <div>
              {Array.from({ length: 60 }, (_, i) => (
                <p key={i} id={`row-${i + 1}`} style={{ margin: 0 }}>Column {i + 1}</p>
              ))}
            </div>
          </Popover>
        </div>
      )
    }
    return <Demo />
  },
}

/** Open it, then Tab: focus leaves the panel and the page behind keeps scrolling. */
export const NotAModal: Story = { render: () => <Demo placement="bottom" /> }
