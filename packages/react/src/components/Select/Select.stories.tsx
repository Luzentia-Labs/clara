import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field } from '../Field/Field'
import { Select } from './Select'

const OPTIONS = [
  { value: 'gbp', label: 'Pound sterling' },
  { value: 'eur', label: 'Euro' },
  { value: 'usd', label: 'US dollar', disabled: true },
  { value: 'sek', label: 'Swedish krona' },
  { value: 'jpy', label: 'Japanese yen' },
]

const meta = {
  title: 'Forms/Select',
  component: Select,
  tags: ['autodocs'],
  // `options` is required and has no sensible default - a select over nothing is not a control - so
  // meta supplies one even though every story below drives its own.
  args: { options: OPTIONS },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

/** In a Field, always: `role="combobox"` takes no name from its contents, so a bare Select has none. */
function Demo ({ initial, disabled }: { initial?: string, disabled?: boolean }) {
  const [value, setValue] = useState<string | undefined>(initial)
  return (
    <div style={{ padding: 24, maxWidth: 320 }}>
      <Field label="Currency" description="Used for every amount on this order.">
        <Select
          options={OPTIONS}
          {...(value === undefined ? {} : { value })}
          onValueChange={setValue}
          {...(disabled === undefined ? {} : { disabled })}
        />
      </Field>
    </div>
  )
}

export const Default: Story = { render: () => <Demo /> }

export const WithSelection: Story = { render: () => <Demo initial="eur" /> }

/** Disabled the Clara way: the tab stop stays, so a keyboard user can reach it and learn why. */
export const Disabled: Story = { render: () => <Demo disabled /> }

/**
 * Against the viewport's bottom edge, where the listbox has to flip. jsdom cannot see this and the
 * unit tests do not claim it - the panel's positioning is a rendered fact, so this is where a
 * person looks at it.
 */
export const AgainstTheEdge: Story = {
  render: () => (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'flex-end', padding: 8 }}>
      <div style={{ maxWidth: 320, width: '100%' }}>
        <Field label="Currency"><Select options={OPTIONS} /></Field>
      </div>
    </div>
  ),
}
