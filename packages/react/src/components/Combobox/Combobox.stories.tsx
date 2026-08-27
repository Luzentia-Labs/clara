import { useMemo, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field } from '../Field/Field'
import { Combobox, type ComboboxOption, type ComboboxStatus } from './Combobox'

const SUPPLIERS: ComboboxOption[] = [
  { value: 'acme', label: 'Acme Industrial', group: 'Europe' },
  { value: 'brant', label: 'Brant & Sons', group: 'Europe' },
  { value: 'cedar', label: 'Cedar Logistics', group: 'Europe' },
  { value: 'delta', label: 'Delta Freight', group: 'Americas' },
  { value: 'orbit', label: 'Orbit Supplies', group: 'Americas' },
  { value: 'zenith', label: 'Zenith Metals', group: 'Americas', disabled: true },
]

const meta = {
  title: 'Forms/Combobox',
  component: Combobox,
  tags: ['autodocs'],
  // `options` is required and has no sensible default - a combobox over nothing is not a control.
  args: { options: SUPPLIERS },
} satisfies Meta<typeof Combobox>

export default meta
type Story = StoryObj<typeof meta>

/** In a Field, always: `role="combobox"` takes no name from its contents. */
function Demo ({ status, options = SUPPLIERS, async: isAsync }: {
  status?: ComboboxStatus, options?: ComboboxOption[], async?: boolean
}) {
  const [value, setValue] = useState<string | undefined>()
  const [query, setQuery] = useState('')
  const shown = useMemo(
    () => (isAsync ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())) : options),
    [isAsync, options, query],
  )
  return (
    <div style={{ padding: 24, maxWidth: 360 }}>
      <Field label="Supplier" description="Type to narrow the list.">
        <Combobox
          options={shown}
          {...(value === undefined ? {} : { value })}
          onValueChange={setValue}
          {...(status === undefined ? {} : { status })}
          {...(isAsync ? { onQueryChange: setQuery } : {})}
        />
      </Field>
    </div>
  )
}

export const Default: Story = { render: () => <Demo /> }

/** Groups carry a real accessible name, and arrowing crosses the boundary in one run. */
export const Grouped: Story = { render: () => <Demo /> }

/** The async path: the caller owns the query and the results, and Clara does not filter again. */
export const AsyncLoading: Story = { render: () => <Demo async status="loading" options={[]} /> }

export const AsyncError: Story = { render: () => <Demo async status="error" options={[]} /> }

/** Empty is a state, not an absence - it says so rather than showing a blank panel. */
export const NoMatches: Story = { render: () => <Demo options={[]} /> }

/**
 * Inside a scrollable container, which is the case AC5 names. jsdom can see the listbox is portalled
 * out; whether it stays anchored while this scrolls is a rendered fact, and this is where a person
 * looks at it.
 */
export const InsideAScrollableTable: Story = {
  render: () => (
    <div style={{ padding: 24 }}>
      <div style={{ height: 160, overflow: 'auto', border: '1px solid #8884', padding: 12 }}>
        <div style={{ maxWidth: 320 }}>
          <Field label="Supplier"><Combobox options={SUPPLIERS} /></Field>
        </div>
        <div style={{ height: 400 }} />
      </div>
    </div>
  ),
}
