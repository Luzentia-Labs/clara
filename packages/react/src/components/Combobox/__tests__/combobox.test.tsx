import { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { runAxe } from '../../../../../../test/axe'
import { resetDevWarnings } from '../../../lib/dev-warning'
import { ClaraProvider } from '../../../theme/ClaraProvider'
import { Field } from '../../Field/Field'
import { Combobox, COMBOBOX_LOCAL_OPTION_CEILING, type ComboboxOption } from '../Combobox'

const OPTIONS: ComboboxOption[] = [
  { value: 'gbp', label: 'Pound sterling' },
  { value: 'eur', label: 'Euro' },
  { value: 'usd', label: 'US dollar', disabled: true },
  { value: 'sek', label: 'Swedish krona' },
]

const inField = (node: React.ReactNode) => render(<Field label="Currency">{node}</Field>)

const openIt = async () => {
  const input = screen.getByRole('combobox')
  input.focus()
  await userEvent.keyboard('{ArrowDown}')
  await screen.findByRole('listbox')
  return input
}

beforeEach(() => { resetDevWarnings() })

describe('Combobox WAI-ARIA pattern', () => {
  it('is a combobox input owning a listbox, with a resolving activedescendant', async () => {
    inField(<Combobox options={OPTIONS} />)
    const input = screen.getByRole('combobox')
    expect(input.tagName).toBe('INPUT')
    expect(input).toHaveAttribute('aria-autocomplete', 'list')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).not.toHaveAttribute('aria-controls')

    await openIt()
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(input).toHaveAttribute('aria-controls', screen.getByRole('listbox').id)
    const active = input.getAttribute('aria-activedescendant')
    expect(document.getElementById(active!), 'the activedescendant names no rendered element')
      .toHaveAttribute('role', 'option')
  })

  it('keeps focus and the CARET in the input while the highlight moves', async () => {
    // The whole reason a combobox uses activedescendant: the user is still typing.
    inField(<Combobox options={OPTIONS} />)
    const input = await openIt()
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    expect(document.activeElement).toBe(input)
  })

  it('filters as you type, and the highlight never points past the filtered list', async () => {
    // The defect this guards: the highlight keeps an index into the PREVIOUS list, so
    // aria-activedescendant names an id that is no longer in the DOM.
    inField(<Combobox options={OPTIONS} />)
    const input = await openIt()
    await userEvent.keyboard('{End}')
    await userEvent.type(input, 'kro')
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1))
    const active = input.getAttribute('aria-activedescendant')
    expect(document.getElementById(active!), 'the highlight survived into a shorter list').toBeTruthy()
  })

  it('takes its accessible name from the Field', async () => {
    inField(<Combobox options={OPTIONS} />)
    expect(screen.getByRole('combobox')).toHaveAccessibleName('Currency')
  })

  it('passes axe closed and open', async () => {
    const { container } = inField(<Combobox options={OPTIONS} />)
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
    await openIt()
    await expect(runAxe(document.body)).resolves.toHaveNoBlockingViolations()
  })
})

describe('Combobox async loading empty error states', () => {
  it('renders and ANNOUNCES loading, empty and error distinctly', async () => {
    // Announced, not merely rendered: the status region is what a screen-reader user has, and AC2
    // asks for both halves.
    const { rerender } = inField(<Combobox options={[]} status="loading" onQueryChange={() => {}} />)
    await openIt()
    expect(screen.getByRole('status')).toHaveTextContent('Loading options')
    expect(screen.getByText('Loading options', { selector: '.clara-combobox__message' })).toBeInTheDocument()

    rerender(<Field label="Currency"><Combobox options={[]} status="error" onQueryChange={() => {}} /></Field>)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Could not load options'))

    rerender(<Field label="Currency"><Combobox options={[]} status="idle" onQueryChange={() => {}} /></Field>)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('No matches'))
  })

  it('has a status region present and EMPTY when there is nothing to say', async () => {
    // Always present, so assistive technology has registered it before any text arrives. A region
    // created in the same commit as its text is commonly not announced at all.
    inField(<Combobox options={OPTIONS} />)
    const region = screen.getByRole('status')
    expect(region).toBeInTheDocument()
    expect(region).toHaveTextContent('')
  })

  it('hands the query to the caller and does NOT filter locally on the async path', async () => {
    // Filtering here as well would hide options the caller deliberately returned.
    const spy = vi.fn()
    inField(<Combobox options={OPTIONS} onQueryChange={spy} />)
    const input = await openIt()
    await userEvent.type(input, 'zzz')
    expect(spy).toHaveBeenLastCalledWith('zzz')
    expect(screen.getAllByRole('option')).toHaveLength(OPTIONS.length)
  })
})

describe('Combobox warns above local option ceiling', () => {
  const many = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ value: `v${i}`, label: `Option ${i}` }))

  it('warns past the ceiling on the LOCAL path, naming the async route', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    inField(<Combobox options={many(COMBOBOX_LOCAL_OPTION_CEILING + 1)} />)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]![0]).toContain('onQueryChange')
    warn.mockRestore()
  })

  it('does NOT warn at the ceiling, nor on the async path however many options there are', () => {
    // Both halves. A warning that fires at the documented limit teaches people to ignore it, and
    // one that fires on the path it is telling them to take is worse than none.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { unmount } = inField(<Combobox options={many(COMBOBOX_LOCAL_OPTION_CEILING)} />)
    expect(warn).not.toHaveBeenCalled()
    unmount()
    resetDevWarnings()
    inField(<Combobox options={many(COMBOBOX_LOCAL_OPTION_CEILING + 50)} onQueryChange={() => {}} />)
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('renders every option past the ceiling rather than truncating', async () => {
    // A list that silently drops entries is worse than a slow one.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const count = COMBOBOX_LOCAL_OPTION_CEILING + 3
    inField(<Combobox options={many(count)} />)
    await openIt()
    expect(screen.getAllByRole('option')).toHaveLength(count)
    warn.mockRestore()
  })
})

describe('Combobox option groups', () => {
  const GROUPED: ComboboxOption[] = [
    { value: 'gbp', label: 'Pound sterling', group: 'Europe' },
    { value: 'eur', label: 'Euro', group: 'Europe' },
    { value: 'usd', label: 'US dollar', group: 'Americas' },
  ]

  it('wraps each group in role=group with an accessible name', async () => {
    inField(<Combobox options={GROUPED} />)
    await openIt()
    const groups = screen.getAllByRole('group')
    expect(groups).toHaveLength(2)
    // By ACCESSIBLE NAME, not by textContent: the group's name is what a screen reader announces,
    // and a group containing the word "Europe" is not the same as one named it (D0065).
    expect(groups.map((g) => g.getAttribute('aria-labelledby')).every(Boolean)).toBe(true)
    expect(groups[0]).toHaveAccessibleName('Europe')
    expect(groups[1]).toHaveAccessibleName('Americas')
  })

  it('keeps ONE flat index across groups, so the highlight crosses a boundary', async () => {
    // Two index spaces would be two sources of truth about which option is highlighted, and
    // aria-activedescendant can name only one.
    inField(<Combobox options={GROUPED} />)
    const input = await openIt()
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    expect(document.getElementById(input.getAttribute('aria-activedescendant')!))
      .toHaveTextContent('US dollar')
  })
})

describe('Combobox inside scrollable container', () => {
  it('portals its listbox OUT of the scroll container', async () => {
    // A listbox nested inside an `overflow: auto` ancestor is clipped by it, and no z-index can
    // rescue it. Portalling is the mechanism; jsdom can see that and cannot see the clipping.
    inField(
      <div data-testid="scroller" style={{ overflow: 'auto', height: 100 }}>
        <Combobox options={OPTIONS} />
      </div>,
    )
    await openIt()
    const scroller = screen.getByTestId('scroller')
    const listbox = screen.getByRole('listbox')
    expect(scroller.contains(listbox), 'the listbox is inside the scroll container, so it is clipped')
      .toBe(false)
    expect(listbox.closest('[data-clara-theme]')).toBeTruthy()
  })
})

describe('Combobox theme and density matrix', () => {
  it.each([
    ['light', 'comfortable'], ['light', 'compact'],
    ['dark', 'comfortable'], ['dark', 'compact'],
  ] as const)('renders and passes axe in %s / %s', async (theme, density) => {
    render(
      <ClaraProvider theme={theme} density={density}>
        <Field label="Currency"><Combobox options={OPTIONS} /></Field>
      </ClaraProvider>,
    )
    await openIt()
    const scope = screen.getByRole('listbox').closest('[data-clara-theme]')
    expect(scope).toHaveAttribute('data-clara-theme', theme)
    expect(scope).toHaveAttribute('data-clara-density', density)
    await expect(runAxe(document.body)).resolves.toHaveNoBlockingViolations()
  })
})
