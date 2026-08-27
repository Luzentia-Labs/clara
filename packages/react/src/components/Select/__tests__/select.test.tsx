import type * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { runAxe } from '../../../../../../test/axe'
import { ClaraProvider } from '../../../theme/ClaraProvider'
import { Field } from '../../Field/Field'
import { Modal } from '../../Modal/Modal'
import { Select } from '../Select'

const OPTIONS = [
  { value: 'gbp', label: 'Pound sterling' },
  { value: 'eur', label: 'Euro' },
  { value: 'usd', label: 'US dollar', disabled: true },
  { value: 'sek', label: 'Swedish krona' },
] as const

/** Opening by keyboard, which is the route the whole activedescendant model exists for. */
const openByKeyboard = async () => {
  const trigger = screen.getByRole('combobox')
  trigger.focus()
  await userEvent.keyboard('{ArrowDown}')
  await screen.findByRole('listbox')
  return trigger
}

/** Render the default set, then open it. Most cases here need both, and neither alone. */
const renderOpen = async (props: Partial<React.ComponentProps<typeof Select>> = {}) => {
  render(<Select options={OPTIONS} {...props} />)
  return openByKeyboard()
}

describe('Select listbox pattern', () => {
  it('is a combobox that owns a listbox, and says so only while open', async () => {
    render(<Select options={OPTIONS} />)
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    // `aria-controls` naming a listbox that is not rendered points at nothing.
    expect(trigger).not.toHaveAttribute('aria-controls')

    await openByKeyboard()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const listbox = screen.getByRole('listbox')
    expect(trigger).toHaveAttribute('aria-controls', listbox.id)
    expect(listbox.id).toBeTruthy()
  })

  it('tracks the highlight with aria-activedescendant, and the id RESOLVES', async () => {
    // The id must name an element that exists. An activedescendant pointing at a removed id is the
    // failure mode a presence check cannot see, so this reads the element back out of the document.
    const trigger = await renderOpen()
    const first = trigger.getAttribute('aria-activedescendant')
    expect(first).toBeTruthy()
    expect(document.getElementById(first!)).toHaveAttribute('role', 'option')

    await userEvent.keyboard('{ArrowDown}')
    const second = trigger.getAttribute('aria-activedescendant')
    expect(second, 'the highlight did not move').not.toBe(first)
    expect(document.getElementById(second!)).toHaveAttribute('role', 'option')
  })

  it('keeps FOCUS on the trigger while the highlight moves', async () => {
    // This is what activedescendant means. If Radix moves focus into the panel, the announced
    // highlight and the real focus disagree, which is worse than no highlight at all.
    const trigger = await renderOpen()
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    expect(document.activeElement).toBe(trigger)
  })

  it('marks the CHOICE with aria-selected and the cursor with the highlight, separately', async () => {
    render(<Select options={OPTIONS} defaultValue="eur" />)
    await openByKeyboard()
    const options = screen.getAllByRole('option')
    const euro = options.find((o) => o.textContent === 'Euro')!
    expect(euro).toHaveAttribute('aria-selected', 'true')
    expect(options.filter((o) => o.getAttribute('aria-selected') === 'true')).toHaveLength(1)
  })

  it('opens with the highlight on the SELECTED option, not on the first', async () => {
    render(<Select options={OPTIONS} defaultValue="sek" />)
    const trigger = await openByKeyboard()
    const active = document.getElementById(trigger.getAttribute('aria-activedescendant')!)
    expect(active).toHaveTextContent('Swedish krona')
  })

  it('marks a disabled option aria-disabled rather than removing it', async () => {
    await renderOpen()
    const usd = screen.getAllByRole('option').find((o) => o.textContent === 'US dollar')!
    expect(usd).toHaveAttribute('aria-disabled', 'true')
  })

  it('passes axe closed and open, INSIDE a Field', async () => {
    // In a Field, because the Field owns the label - the same convention Input follows, which has
    // no standalone tests at all. It is load-bearing here in a way it is not for a text input:
    // `role="combobox"` does not take its name from its contents, so a Select with no Field has no
    // accessible name at all. Measured: this assertion first ran standalone and axe reported
    // `[critical] button-name`. The docblock and the verification record both say so.
    const { container } = render(
      <Field label="Currency"><Select options={OPTIONS} defaultValue="gbp" /></Field>,
    )
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
    await openByKeyboard()
    await expect(runAxe(document.body)).resolves.toHaveNoBlockingViolations()
  })

  it('takes its accessible NAME from the Field, and announces the value with it', async () => {
    render(<Field label="Currency"><Select options={OPTIONS} defaultValue="gbp" /></Field>)
    // By accessible name, not by `textContent`: the name is what a screen reader says, and for a
    // combobox it comes from the labelling relationship rather than from the contents (D0065).
    expect(screen.getByRole('combobox')).toHaveAccessibleName('Currency')
  })
})

describe('Select keyboard operation', () => {
  it('opens on ArrowDown, ArrowUp, Enter and Space', async () => {
    for (const key of ['{ArrowDown}', '{ArrowUp}', '{Enter}', ' ']) {
      const { unmount } = render(<Select options={OPTIONS} />)
      screen.getByRole('combobox').focus()
      await userEvent.keyboard(key)
      expect(await screen.findByRole('listbox'), `${key} did not open the list`).toBeInTheDocument()
      unmount()
    }
  })

  it('SKIPS a disabled option when arrowing', async () => {
    // Euro -> Swedish krona, stepping over the disabled US dollar between them.
    const trigger = await renderOpen()
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    const active = document.getElementById(trigger.getAttribute('aria-activedescendant')!)
    expect(active).toHaveTextContent('Swedish krona')
  })

  it('does not WRAP past either end', async () => {
    // The APG's listbox does not wrap, and wrapping in a long list moves the highlight somewhere
    // the user did not expect and cannot see. Both ends, because one is a different branch.
    const trigger = await renderOpen()
    await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}')
    expect(document.getElementById(trigger.getAttribute('aria-activedescendant')!))
      .toHaveTextContent('Pound sterling')
    await userEvent.keyboard('{End}{ArrowDown}{ArrowDown}')
    expect(document.getElementById(trigger.getAttribute('aria-activedescendant')!))
      .toHaveTextContent('Swedish krona')
  })

  it('Home and End jump to the first and last ENABLED options', async () => {
    const trigger = await renderOpen()
    await userEvent.keyboard('{End}')
    expect(document.getElementById(trigger.getAttribute('aria-activedescendant')!))
      .toHaveTextContent('Swedish krona')
    await userEvent.keyboard('{Home}')
    expect(document.getElementById(trigger.getAttribute('aria-activedescendant')!))
      .toHaveTextContent('Pound sterling')
  })

  it('Enter selects the highlighted option and closes', async () => {
    const spy = vi.fn()
    render(<Select options={OPTIONS} onValueChange={spy} />)
    await openByKeyboard()
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(spy).toHaveBeenCalledWith('eur')
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
  })

  it('Escape closes WITHOUT selecting, and leaves focus on the trigger', async () => {
    // A highlight is not a choice. Treating it as one makes Escape destructive on the one key
    // users press to back out.
    const spy = vi.fn()
    render(<Select options={OPTIONS} onValueChange={spy} />)
    const trigger = await openByKeyboard()
    await userEvent.keyboard('{ArrowDown}{Escape}')
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
    expect(spy).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(trigger)
  })

  it('Tab COMMITS the highlight and lets focus move on', async () => {
    // Deliberately not prevented: swallowing Tab strands a keyboard user inside a control they are
    // trying to leave. Both halves - the value commits AND focus leaves.
    const spy = vi.fn()
    render(<><Select options={OPTIONS} onValueChange={spy} /><button>After</button></>)
    const trigger = await openByKeyboard()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.tab()
    expect(spy).toHaveBeenCalledWith('eur')
    expect(document.activeElement, 'Tab was swallowed').not.toBe(trigger)
  })

  it('typeahead jumps to a matching option, and never to a disabled one', async () => {
    const trigger = await renderOpen()
    await userEvent.keyboard('sw')
    expect(document.getElementById(trigger.getAttribute('aria-activedescendant')!))
      .toHaveTextContent('Swedish krona')
    // "u" matches only the disabled "US dollar", so the highlight must not move to it.
    await userEvent.keyboard('u')
    expect(document.getElementById(trigger.getAttribute('aria-activedescendant')!))
      .toHaveTextContent('Swedish krona')
  })
})

describe('Select uses onValueChange', () => {
  it('reports the VALUE, not an event', async () => {
    const spy = vi.fn()
    render(<Select options={OPTIONS} onValueChange={spy} />)
    await openByKeyboard()
    await userEvent.click(screen.getAllByRole('option')[1]!)
    expect(spy).toHaveBeenCalledWith('eur')
    // A string, not a synthetic event with a `target`. The assertion is the type of the argument.
    expect(typeof spy.mock.calls[0]![0]).toBe('string')
  })

  it('drives uncontrolled from defaultValue, and controlled from value', async () => {
    const { unmount } = render(<Select options={OPTIONS} defaultValue="eur" />)
    expect(screen.getByRole('combobox')).toHaveTextContent('Euro')
    unmount()

    // Controlled: the component must NOT move on its own, or a caller that rejects the change
    // still sees it applied for a frame.
    render(<Select options={OPTIONS} value="gbp" onValueChange={() => {}} />)
    await openByKeyboard()
    await userEvent.click(screen.getAllByRole('option')[1]!)
    expect(screen.getByRole('combobox')).toHaveTextContent('Pound sterling')
  })

  it('shows the placeholder when nothing is selected, and the label when something is', async () => {
    const { unmount } = render(<Select options={OPTIONS} placeholder="Choose a currency" />)
    expect(screen.getByRole('combobox')).toHaveTextContent('Choose a currency')
    unmount()
    render(<Select options={OPTIONS} defaultValue="gbp" />)
    expect(screen.getByRole('combobox')).toHaveTextContent('Pound sterling')
  })
})

describe('Select inside Modal', () => {
  it('renders its listbox and stays operable inside a Modal', async () => {
    // AC4. The listbox portals through ClaraPortal and takes the shared overlay layer token, so it
    // paints above the modal by OPEN order rather than by a per-role z-index (D0088).
    const spy = vi.fn()
    render(
      <Modal open onClose={() => {}} title="Filters">
        <Select options={OPTIONS} onValueChange={spy} />
      </Modal>,
    )
    const trigger = await screen.findByRole('combobox')
    trigger.focus()
    await userEvent.keyboard('{ArrowDown}')
    const listbox = await screen.findByRole('listbox')
    expect(within(listbox).getAllByRole('option')).toHaveLength(OPTIONS.length)
    await userEvent.keyboard('{Enter}')
    expect(spy).toHaveBeenCalledWith('gbp')
  })

  it('portals the listbox OUT of the modal, into a Clara-scoped host', async () => {
    // The assertion above is a PROXY and measured as one: removing `ClaraPortal` entirely and
    // rendering the panel inline left it green, because a listbox nested inside the modal still
    // renders and still selects. Presence was standing in for stacking (D0065).
    //
    // What jsdom CAN see is the mechanism: the panel is not in the dialog's subtree, and it lands on
    // a host carrying Clara's scope attributes. That is what makes the layer token apply and what
    // makes the panel themed by where it was written rather than by where it landed.
    render(
      <Modal open onClose={() => {}} title="Filters">
        <Select options={OPTIONS} />
      </Modal>,
    )
    const trigger = await screen.findByRole('combobox')
    trigger.focus()
    await userEvent.keyboard('{ArrowDown}')
    const listbox = await screen.findByRole('listbox')
    const dialog = screen.getByRole('dialog')
    expect(dialog.contains(listbox), 'the listbox is nested inside the modal, so it cannot outrank it')
      .toBe(false)
    expect(listbox.closest('[data-clara-theme]'), 'the listbox did not land on a Clara-scoped host')
      .toBeTruthy()
  })
})

describe('Select is disabled the Clara way', () => {
  it('keeps its tab stop and does not open', async () => {
    // aria-disabled plus a suppressed handler, never the native attribute (D0058, D0064): the
    // control stays reachable so a keyboard user can learn it is unavailable.
    render(<Select options={OPTIONS} disabled />)
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveAttribute('aria-disabled', 'true')
    expect(trigger).not.toHaveAttribute('disabled')
    trigger.focus()
    expect(document.activeElement).toBe(trigger)
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})

describe('Select theme and density matrix', () => {
  it.each([
    ['light', 'comfortable'], ['light', 'compact'],
    ['dark', 'comfortable'], ['dark', 'compact'],
  ] as const)('renders and passes axe in %s / %s', async (theme, density) => {
    render(
      <ClaraProvider theme={theme} density={density}>
        <Field label="Currency"><Select options={OPTIONS} defaultValue="gbp" /></Field>
      </ClaraProvider>,
    )
    const trigger = screen.getByRole('combobox')
    trigger.focus()
    await userEvent.keyboard('{ArrowDown}')
    await screen.findByRole('listbox')
    // Walked UP from an element inside the PANEL: the panel is portalled out of the React root, so
    // querying the render container finds the provider's own wrapper, which carries the same
    // attributes and was never the portal's scope (D0065).
    const scope = screen.getByRole('listbox').closest('[data-clara-theme]')
    expect(scope).toHaveAttribute('data-clara-theme', theme)
    expect(scope).toHaveAttribute('data-clara-density', density)
    await expect(runAxe(document.body)).resolves.toHaveNoBlockingViolations()
  })
})
