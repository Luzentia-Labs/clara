import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button/Button'
import { DropdownMenu } from './DropdownMenu'
import type { DropdownMenuEntry } from './DropdownMenu'

const meta = {
  title: 'Overlays/DropdownMenu',
  component: DropdownMenu,
  tags: ['autodocs'],
  args: {
    open: false, onOpen: () => {}, onClose: () => {},
    trigger: null, items: [], placement: 'bottom',
  },
  argTypes: {
    placement: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left'] },
  },
} satisfies Meta<typeof DropdownMenu>

export default meta
type Story = StoryObj<typeof meta>

const ENTRIES: DropdownMenuEntry[] = [
  { label: 'Post', onSelect: () => {} },
  { label: 'Void', onSelect: () => {}, disabled: true },
  { separator: true },
  {
    label: 'Export',
    items: [
      { label: 'CSV', onSelect: () => {} },
      { label: 'PDF', onSelect: () => {} },
    ],
  },
  { label: 'Duplicate', onSelect: () => {} },
]

function Demo ({ items = ENTRIES }: { items?: DropdownMenuEntry[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
      <DropdownMenu
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        trigger={<Button variant="secondary">Actions</Button>}
        items={items}
      />
    </div>
  )
}

export const Default: Story = { render: () => <Demo /> }

/**
 * "Void" is disabled and stays VISIBLE. Arrow past it: the highlight skips it, so the keyboard
 * never strands you on something that cannot be activated. Hiding it instead would teach people the
 * action does not exist.
 */
export const WithADisabledEntry: Story = { render: () => <Demo /> }

/** ArrowRight on "Export" opens the submenu; ArrowLeft closes it and returns to the entry. */
export const WithASubmenu: Story = { render: () => <Demo /> }

/**
 * Thirty entries, which is where typeahead stops being a nicety. Press "d" repeatedly.
 *
 * It is also the case the manual keyboard pass is meant to judge - five entries cannot tell you
 * whether typeahead feels responsive.
 */
export const LongMenu: Story = {
  render: () => (
    <Demo
      items={Array.from({ length: 30 }, (_, i) => ({
        label: `${['Post', 'Draft', 'Duplicate', 'Delete', 'Dispatch'][i % 5]} ${i + 1}`,
        onSelect: () => {},
      }))}
    />
  ),
}
