import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Field } from '../Field'
import { Input } from '../../Input/Input'
import { Textarea } from '../../Textarea/Textarea'
import { NumberInput } from '../../NumberInput/NumberInput'
import { PasswordInput } from '../../PasswordInput/PasswordInput'
import { SearchInput } from '../../SearchInput/SearchInput'
import { Checkbox } from '../../Checkbox/Checkbox'
import { Switch } from '../../Switch/Switch'
import { RadioGroup } from '../../RadioGroup/RadioGroup'
import { CheckboxGroup } from '../../CheckboxGroup/CheckboxGroup'

const inField = (control: React.ReactNode, props = {}) =>
  render(<Field label="Value" {...props}>{control}</Field>)

describe('Input', () => {
  it.each(['sm', 'md'] as const)('size=%s maps to a token class', (size) => {
    inField(<Input size={size} />)
    expect(screen.getByRole('textbox').className).toContain(`clara-input--${size}`)
  })

  it('is disabled by the Field, not by its own prop', () => {
    inField(<Input />, { disabled: true })
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('accepts typing and reports its value', async () => {
    inField(<Input />)
    await userEvent.type(screen.getByRole('textbox'), 'Acme Ltd')
    expect(screen.getByRole('textbox')).toHaveValue('Acme Ltd')
  })
})

describe('Textarea', () => {
  it('renders a textarea with a real row count, which a screen reader uses', () => {
    inField(<Textarea rows={5} />)
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '5')
  })
})

describe('NumberInput', () => {
  // type="number" silently discards what it cannot parse, scrolls on a stray wheel gesture, and
  // strips leading zeros from things that are identifiers rather than quantities.
  it('is a text input with a decimal input mode, not type=number', () => {
    inField(<NumberInput />)
    const el = screen.getByRole('textbox')
    expect(el).toHaveAttribute('type', 'text')
    expect(el).toHaveAttribute('inputmode', 'decimal')
  })

  it('preserves a leading zero, because an account code is not a quantity', async () => {
    inField(<NumberInput />)
    await userEvent.type(screen.getByRole('textbox'), '00417')
    expect(screen.getByRole('textbox')).toHaveValue('00417')
  })

  it('renders figures with tabular numerals so a column lines up', () => {
    inField(<NumberInput />)
    expect(screen.getByRole('textbox').className).toContain('clara-input--numeric')
  })

  it('shows a unit when given one', () => {
    inField(<NumberInput unit="GBP" />)
    expect(screen.getByText('GBP')).toBeInTheDocument()
  })
})

describe('PasswordInput', () => {
  it('masks by default', () => {
    const { container } = inField(<PasswordInput />)
    expect(container.querySelector('input')).toHaveAttribute('type', 'password')
  })

  // The toggle is named for what it will DO, not for the current state - a control named for its
  // state leaves the user guessing what pressing it achieves.
  it('reveals and re-masks, naming the next action each time', async () => {
    const { container } = inField(<PasswordInput />)
    await userEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(container.querySelector('input')).toHaveAttribute('type', 'text')
    await userEvent.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(container.querySelector('input')).toHaveAttribute('type', 'password')
  })

  it('puts the toggle in the tab order', async () => {
    inField(<PasswordInput />)
    await userEvent.tab()
    await userEvent.tab()
    expect(screen.getByRole('button')).toHaveFocus()
  })
})

describe('SearchInput', () => {
  it('is a searchbox, and still takes its name from the Field label', () => {
    inField(<SearchInput placeholder="Type to search" />)
    expect(screen.getByRole('searchbox', { name: 'Value' })).toBeInTheDocument()
  })
})

describe('Checkbox', () => {
  it('toggles by click and by Space', async () => {
    inField(<Checkbox />)
    const box = screen.getByRole('checkbox')
    await userEvent.click(box)
    expect(box).toBeChecked()
    box.focus()
    await userEvent.keyboard(' ')
    expect(box).not.toBeChecked()
  })

  // A "select all" that looks unchecked while reporting mixed is how a partially-selected table
  // lies about what a bulk action will affect. `indeterminate` is a DOM property, not an attribute.
  it('reports mixed when indeterminate, on the DOM node as well as in ARIA', () => {
    const { container } = inField(<Checkbox indeterminate />)
    const box = container.querySelector('input') as HTMLInputElement
    expect(box.indeterminate).toBe(true)
    expect(box).toHaveAttribute('aria-checked', 'mixed')
  })

  it('clears indeterminate when it becomes determinate', () => {
    const { container, rerender } = inField(<Checkbox indeterminate />)
    rerender(<Field label="Value"><Checkbox indeterminate={false} /></Field>)
    expect((container.querySelector('input') as HTMLInputElement).indeterminate).toBe(false)
  })

  it('still forwards the consumer ref while managing its own', () => {
    const ref = { current: null as HTMLInputElement | null }
    inField(<Checkbox ref={ref} indeterminate />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
    expect(ref.current?.indeterminate).toBe(true)
  })
})

describe('Switch', () => {
  // role="switch" is what makes a screen reader say on/off rather than checked/unchecked - which
  // matters, because a switch takes effect immediately and a checkbox usually waits for submit.
  it('is announced as a switch, and toggles by keyboard', async () => {
    inField(<Switch label="Email alerts" />)
    const sw = screen.getByRole('switch', { name: /Email alerts|Value/ })
    sw.focus()
    await userEvent.keyboard(' ')
    expect(sw).toBeChecked()
  })
})

describe('RadioGroup', () => {
  const options = [
    { value: '30', label: 'Net 30' },
    { value: '60', label: 'Net 60', description: 'Requires approval' },
    { value: '90', label: 'Net 90', disabled: true },
  ]

  // The legend is what makes a screen reader announce the QUESTION on entry and the ANSWER as the
  // user arrows through. A labelled div gives the answers with no question attached.
  it('is a fieldset whose legend names the question', () => {
    inField(<RadioGroup name="t" legend="Payment terms" options={options} />)
    expect(screen.getByRole('group', { name: 'Payment terms' })).toBeInTheDocument()
  })

  it('is one tab stop, with arrow keys choosing - the browser\'s behaviour, not ours', async () => {
    inField(<RadioGroup name="t" legend="Terms" options={options} defaultValue="30" />)
    await userEvent.tab()
    expect(screen.getByRole('radio', { name: 'Net 30' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: 'Net 60' })).toBeChecked()
  })

  it('reports the chosen value', async () => {
    const onChange = vi.fn()
    inField(<RadioGroup name="t" legend="Terms" options={options} onChange={onChange} />)
    await userEvent.click(screen.getByRole('radio', { name: 'Net 30' }))
    expect(onChange).toHaveBeenCalledWith('30')
  })

  it('describes an individual option without describing the whole group', () => {
    inField(<RadioGroup name="t" legend="Terms" options={options} />)
    const sixty = screen.getByRole('radio', { name: 'Net 60' })
    expect(document.getElementById(sixty.getAttribute('aria-describedby')!)?.textContent)
      .toBe('Requires approval')
  })

  it('disables one option without disabling the set', () => {
    inField(<RadioGroup name="t" legend="Terms" options={options} />)
    expect(screen.getByRole('radio', { name: 'Net 90' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'Net 30' })).not.toBeDisabled()
  })

  it('works controlled', () => {
    inField(<RadioGroup name="t" legend="Terms" options={options} value="60" />)
    expect(screen.getByRole('radio', { name: 'Net 60' })).toBeChecked()
  })
})

describe('CheckboxGroup', () => {
  const options = [
    { value: 'email', label: 'Email' },
    { value: 'post', label: 'Post', description: 'Slower' },
  ]

  it('is a fieldset whose legend names the question', () => {
    inField(<CheckboxGroup name="c" legend="Notify by" options={options} />)
    expect(screen.getByRole('group', { name: 'Notify by' })).toBeInTheDocument()
  })

  // Independent decisions, so every box is its own tab stop - unlike a radio group, where arrowing
  // past an option you cannot choose would be wrong.
  it('gives every box its own tab stop', async () => {
    inField(<CheckboxGroup name="c" legend="Notify by" options={options} />)
    await userEvent.tab()
    expect(screen.getByRole('checkbox', { name: 'Email' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('checkbox', { name: 'Post' })).toHaveFocus()
  })

  it('accumulates and removes values', async () => {
    function Controlled () {
      const [v, setV] = useState<string[]>([])
      return <Field label="Channels"><CheckboxGroup name="c" legend="Notify by" options={options} value={v} onChange={setV} /></Field>
    }
    render(<Controlled />)
    await userEvent.click(screen.getByRole('checkbox', { name: 'Email' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Post' }))
    expect(screen.getByRole('checkbox', { name: 'Email' })).toBeChecked()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Email' }))
    expect(screen.getByRole('checkbox', { name: 'Email' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Post' })).toBeChecked()
  })
})
