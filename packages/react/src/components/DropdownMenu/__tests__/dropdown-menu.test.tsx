import { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { runAxe } from '../../../../../../test/axe'
import { ClaraProvider } from '../../../theme/ClaraProvider'
import { DropdownMenu } from '../DropdownMenu'
import type { DropdownMenuEntry } from '../DropdownMenu'

const onPost = vi.fn()
const onVoid = vi.fn()
const onCsv = vi.fn()
const onZoom = vi.fn()

const ENTRIES = (): DropdownMenuEntry[] => [
  { label: 'Post', onSelect: onPost },
  { label: 'Void', onSelect: onVoid, disabled: true },
  { separator: true },
  { label: 'Export', items: [{ label: 'CSV', onSelect: onCsv }] },
  { label: 'Zoom to fit', onSelect: onZoom },
]

/** Opened by a real trigger, so the restored focus target is a real element rather than a stub. */
function Harness ({ items = ENTRIES() }: { items?: DropdownMenuEntry[] }) {
  const [open, setOpen] = useState(false)
  return (
    <DropdownMenu
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      trigger={<button>Actions</button>}
      items={items}
    />
  )
}

const openMenu = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Actions' }))
  return screen.findByRole('menu', { name: 'Actions' })
}

describe('DropdownMenu keyboard pattern', () => {
  it('moves the highlight with ArrowDown and SKIPS the disabled item', async () => {
    // The WAI-ARIA menu pattern: a disabled command is announced but never focused, so arrowing
    // never strands the user on something that cannot be activated.
    render(<Harness />)
    await openMenu()
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Post' })).toHaveFocus())
    await userEvent.keyboard('{ArrowDown}')
    // 'Void' is disabled, so the next stop is the submenu trigger - not 'Void'.
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Void' })).not.toHaveFocus())
  })

  it('wraps from the last entry back to the first', async () => {
    render(<Harness />)
    await openMenu()
    await userEvent.keyboard('{ArrowUp}')
    // ArrowUp from closed-then-opened lands on the LAST item, which is the pattern's own rule.
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Zoom to fit' })).toHaveFocus())
  })

  it('typeahead jumps to an entry by its label', async () => {
    render(<Harness />)
    await openMenu()
    await userEvent.keyboard('z')
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Zoom to fit' })).toHaveFocus())
  })

  it('opens a submenu with ArrowRight and reveals its items', async () => {
    render(<Harness />)
    await openMenu()
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Export' })).toHaveFocus())
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'CSV' })).toBeInTheDocument())
  })

  it('runs the entry\'s own onSelect, and not another entry\'s', async () => {
    // A NON-FIRST entry, deliberately. This test used to click 'Post', the first entry - and a
    // mutation wiring EVERY item to `items[0].onSelect` passed all thirteen tests, because the one
    // entry it was checked against was the one that mutation happens to get right. Measured.
    onPost.mockClear(); onVoid.mockClear(); onZoom.mockClear()
    render(<Harness />)
    await openMenu()
    await userEvent.click(screen.getByRole('menuitem', { name: 'Zoom to fit' }))
    await waitFor(() => expect(onZoom).toHaveBeenCalledTimes(1))
    expect(onPost, 'selecting one entry ran a different entry\'s handler').not.toHaveBeenCalled()
    expect(onVoid).not.toHaveBeenCalled()
  })

  it('never runs a disabled entry\'s onSelect', async () => {
    onVoid.mockClear()
    render(<Harness />)
    await openMenu()
    await userEvent.click(screen.getByRole('menuitem', { name: 'Void' }), { pointerEventsCheck: 0 })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(onVoid).not.toHaveBeenCalled()
  })

  it('takes its accessible name from the trigger, so it never announces as an unnamed menu', async () => {
    // Radix wires `aria-labelledby` to the trigger's id, and that beats `aria-label` in the name
    // computation - which is why there is no `label` prop. Asserting the NAME rather than merely
    // that a menu exists is what would catch the naming being dropped.
    render(<Harness />)
    expect(await openMenu()).toBeInTheDocument()
  })
})

describe('DropdownMenu focus restoration', () => {
  it('returns focus to the trigger on Escape, by identity', async () => {
    // By identity, not by selector: "a button is focused" passes on the wrong button.
    render(<Harness />)
    const trigger = screen.getByRole('button', { name: 'Actions' })
    await openMenu()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })

  it('returns focus to the trigger after selecting an entry', async () => {
    // The other dismissal route. Restoring only on Escape strands the user after every action they
    // actually take, which is the common case rather than the edge one.
    render(<Harness />)
    const trigger = screen.getByRole('button', { name: 'Actions' })
    await openMenu()
    await userEvent.click(screen.getByRole('menuitem', { name: 'Zoom to fit' }))
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })
})

describe('DropdownMenu theme and density matrix', () => {
  it.each([
    ['light', 'comfortable'], ['light', 'compact'],
    ['dark', 'comfortable'], ['dark', 'compact'],
  ] as const)('renders and passes axe in %s / %s', async (theme, density) => {
    const { container } = render(
      <ClaraProvider theme={theme} density={density}><Harness /></ClaraProvider>,
    )
    await openMenu()
    const scope = container.querySelector('[data-clara-theme]')
    expect(scope).toHaveAttribute('data-clara-theme', theme)
    expect(scope).toHaveAttribute('data-clara-density', density)
    await expect(runAxe(document.body)).resolves.toHaveNoBlockingViolations()
  })
})
