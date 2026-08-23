import { describe, it, expect, vi } from 'vitest'
import { createRef, useState } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToStaticMarkup, renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { act } from 'react'
import { runAxe } from '../../../../../../test/axe'
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

const CONTROLS = [
  ['Input', <Input />],
  ['Textarea', <Textarea />],
  ['NumberInput', <NumberInput min={0} max={100} step={1} defaultValue="10" />],
  ['PasswordInput', <PasswordInput />],
  ['SearchInput', <SearchInput />],
  ['Checkbox', <Checkbox />],
  ['Switch', <Switch />],
] as const

describe('Field compound composition', () => {
  it('renders label, description, control and error, all associated', () => {
    render(<Field label="Supplier" description="Legal entity name" error="Required"><Input /></Field>)
    const control = screen.getByRole('textbox', { name: 'Supplier' })
    const describedBy = (control.getAttribute('aria-describedby') ?? '').split(' ')
    expect(describedBy).toHaveLength(2)
    const [descId, errId] = describedBy as [string, string]
    expect(document.getElementById(descId)?.textContent).toBe('Legal entity name')
    expect(document.getElementById(errId)?.textContent).toBe('Required')
  })

  it('wires without the consumer passing a single id', () => {
    render(<Field label="Reference"><Input /></Field>)
    // The consumer wrote no id anywhere; the association still exists.
    expect(screen.getByRole('textbox', { name: 'Reference' })).toBeInTheDocument()
  })

  it.each(CONTROLS)('%s picks up its Field wiring', (_name, control) => {
    const { container } = render(<Field label="Value" description="hint">{control}</Field>)
    // Queried by ROLE, not by class name: a class query asserts a styling hook, and the wiring is
    // a semantic contract. `toBeTruthy()` on the attribute was the other half of the same weakness
    // - the string "undefined" is truthy, so a broken wiring passed. The id must RESOLVE to the
    // description element and that element must carry the description text.
    const el = container.querySelector('input, textarea') as HTMLElement
    const describedBy = el.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    const described = describedBy!.split(' ').map((id) => document.getElementById(id))
    expect(described.every(Boolean)).toBe(true)
    expect(described.map((n) => n!.textContent).join(' ')).toContain('hint')
  })

  it('wires a control that is WRAPPED, not a direct child', () => {
    // The composition D0060 chose context for. React.Children.map sees only the immediate child,
    // so a cloning implementation silently skips exactly the shapes a real form is built from -
    // a control inside a layout primitive, a fragment, or a tooltip - and the association is lost
    // with no error anywhere. Nothing tested this until the plan review pointed at the gap.
    const { container } = render(
      <Field label="Supplier" description="hint">
        <div className="wrapper"><><span><Input /></span></></div>
      </Field>,
    )
    const el = container.querySelector('input') as HTMLElement
    const describedBy = el.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy!.split(' ')[0]!)?.textContent).toContain('hint')
    expect(screen.getByRole('textbox', { name: 'Supplier' })).toBe(el)
  })

  it('leaves a standalone control alone rather than throwing', () => {
    // A control outside a Field is legitimate - it wires nothing and relies on the consumer.
    expect(() => render(<Input aria-label="Loose" />)).not.toThrow()
    expect(screen.getByRole('textbox', { name: 'Loose' })).not.toHaveAttribute('aria-describedby')
  })

  it('forwards a ref through to the real control', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Field label="X"><Input ref={ref} /></Field>)
    expect(ref.current?.tagName.toLowerCase()).toBe('input')
  })
})

describe('Field ARIA wiring is SSR-stable', () => {
  // A counter-based id produces different values on the server and client passes, and the
  // mismatch shows up only in a real SSR consumer - as an association pointing at nothing.
  it('keeps the server ids through hydration, so the associations survive', async () => {
    // HYDRATION is the property that matters, and it is not the same comparison as "a server
    // render and a fresh client render agree" - those legitimately differ, because `useId` numbers
    // each root independently. What must never happen is the ids CHANGING as the page hydrates,
    // which silently repoints aria-describedby at an element that no longer exists.
    const tree = <Field label="Supplier" description="hint" error="bad"><Input /></Field>
    const html = renderToString(tree)
    const idsIn = (markup: string) => (markup.match(/\bid="([^"]+)"/g) ?? []).map((m) => m.slice(4, -1))
    const refsIn = (markup: string) => (markup.match(/aria-(describedby|errormessage)="([^"]+)"/g) ?? [])

    const serverIds = idsIn(html)
    expect(serverIds.length).toBeGreaterThan(0)
    expect(refsIn(html).length).toBeGreaterThan(0)

    const host = document.createElement('div')
    host.innerHTML = html
    document.body.appendChild(host)
    // React does NOT rewrite the server's attributes when hydration disagrees - it keeps the
    // server DOM and reports the mismatch. So comparing the resulting markup cannot see an
    // unstable id at all; the mismatch REPORT is the observable signal, and asserting on it is
    // what makes this test fail when `useId` is swapped for anything render-unstable.
    const mismatches: string[] = []
    const spy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      mismatches.push(args.map(String).join(' '))
    })
    await act(async () => { hydrateRoot(host, tree) })
    spy.mockRestore()
    expect(mismatches.filter((m) => /hydrat|did not match|Text content does not match/i.test(m))).toEqual([])

    expect(idsIn(host.innerHTML)).toEqual(serverIds)
    expect(refsIn(host.innerHTML)).toEqual(refsIn(html))
    // And the association resolves after hydration, not merely matches as a string.
    const control = host.querySelector('input') as HTMLElement
    const target = control.getAttribute('aria-describedby')!.split(' ')[0]!
    expect(host.querySelector(`#${CSS.escape(target)}`)?.textContent).toContain('hint')
    document.body.removeChild(host)
  })

  it('gives two Fields on one page distinct ids', () => {
    render(<><Field label="One"><Input /></Field><Field label="Two"><Input /></Field></>)
    const [a, b] = screen.getAllByRole('textbox') as [HTMLElement, HTMLElement]
    expect(a.id).not.toBe(b.id)
    expect(a.id).toBeTruthy()
  })

  it('sets aria-invalid and aria-errormessage only when there is an error', () => {
    const { rerender } = render(<Field label="X"><Input /></Field>)
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid')
    rerender(<Field label="X" error="Too long"><Input /></Field>)
    const control = screen.getByRole('textbox')
    expect(control).toHaveAttribute('aria-invalid', 'true')
    expect(document.getElementById(control.getAttribute('aria-errormessage')!)?.textContent).toBe('Too long')
  })

  it('marks required without relying on the asterisk, which is decorative', () => {
    render(<Field label="Code" required><Input /></Field>)
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true')
    expect(document.querySelector('.clara-field__required')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('Field always renders a real label', () => {
  // Placeholder-as-label disappears the moment the user types. In a dense form that is
  // unrecoverable, and it is the defect this framework exists to make impossible.
  it.each(CONTROLS)('%s is named by a real label element, not a placeholder', (_name, control) => {
    const { container } = render(<Field label="Account code">{control}</Field>)
    const label = container.querySelector('label.clara-field__label') as HTMLLabelElement
    expect(label).toBeInTheDocument()
    expect(label.textContent).toContain('Account code')
    const el = container.querySelector('input, textarea') as HTMLElement
    expect(label.htmlFor).toBe(el.id)
  })

  it('offers no way to label a control by placeholder alone', () => {
    render(<Field label="Search records"><SearchInput placeholder="Type to search" /></Field>)
    // The accessible name comes from the label, never the placeholder.
    expect(screen.getByRole('searchbox', { name: 'Search records' })).toBeInTheDocument()
  })
})

describe('Field error announces once', () => {
  it('renders one live region, referenced by aria-errormessage', () => {
    render(<Field label="Amount" error="Must be positive"><Input /></Field>)
    const alerts = screen.getAllByRole('alert')
    expect(alerts).toHaveLength(1)
    expect(screen.getByRole('textbox').getAttribute('aria-errormessage')).toBe(alerts[0]?.id)
  })

  // An always-present live region announces on every re-render that touches it, which is how an
  // error gets read twice. It is rendered only when there IS an error.
  it('renders no live region while valid', () => {
    render(<Field label="Amount"><Input /></Field>)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('announces once when the error appears after interaction', async () => {
    function Form () {
      const [error, setError] = useState<string | undefined>(undefined)
      return (
        <Field label="Amount" error={error}>
          <Input onBlur={() => setError('Must be positive')} />
        </Field>
      )
    }
    render(<Form />)
    await userEvent.click(screen.getByRole('textbox'))
    await userEvent.tab()
    expect(screen.getAllByRole('alert')).toHaveLength(1)
  })
})

describe('Field description and error coexist', () => {
  // AC5's screen-reader verification is manual. What IS machine-checkable is the wiring and the
  // ORDER, which is what the manual pass then confirms is announced.
  it('references both, description first', () => {
    render(<Field label="IBAN" description="No spaces" error="Checksum failed"><Input /></Field>)
    const [descId, errId] = screen.getByRole('textbox').getAttribute('aria-describedby')!.split(' ') as [string, string]
    expect(document.getElementById(descId)?.className).toContain('description')
    expect(document.getElementById(errId)?.className).toContain('error')
  })

  it('drops neither and doubles neither', () => {
    render(<Field label="IBAN" description="No spaces" error="Checksum failed"><Input /></Field>)
    const ids = screen.getByRole('textbox').getAttribute('aria-describedby')!.split(' ')
    expect(new Set(ids).size).toBe(2)
  })
})

describe('Field works uncontrolled and with RHF', () => {
  it('submits its value with native form submission, no wrapper needed', async () => {
    // The value is CAPTURED in the handler and asserted after. Asserting inside it meant a failure
    // surfaced as an uncaught exception - vitest reported all three tests as PASSED and printed
    // "This might cause false positive tests". The gate held only because verify_ac reads the exit
    // code; the assertion was attributed to no test.
    let submitted: FormDataEntryValue | null = null
    const onSubmit = vi.fn((e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      submitted = new FormData(e.currentTarget).get('supplier')
    })
    render(<form onSubmit={onSubmit}><Field label="Supplier"><Input name="supplier" defaultValue="Acme" /></Field><button>Go</button></form>)
    await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(submitted).toBe('Acme')
  })

  // React Hook Form registers by spreading props including a ref and onChange. The control has to
  // forward both untouched, which is the whole integration contract.
  it('accepts a register()-shaped spread: ref, name, onChange, onBlur', async () => {
    const onChange = vi.fn()
    const ref = createRef<HTMLInputElement>()
    render(<Field label="Supplier"><Input {...{ name: 'supplier', onChange, onBlur: vi.fn(), ref }} /></Field>)
    await userEvent.type(screen.getByRole('textbox'), 'A')
    expect(onChange).toHaveBeenCalled()
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
    expect(ref.current?.name).toBe('supplier')
  })

  it('works controlled', async () => {
    function Controlled () {
      const [v, setV] = useState('')
      return <Field label="Supplier"><Input value={v} onChange={(e) => setV(e.currentTarget.value)} /></Field>
    }
    render(<Controlled />)
    await userEvent.type(screen.getByRole('textbox'), 'Acme')
    expect(screen.getByRole('textbox')).toHaveValue('Acme')
  })
})

describe('accessibility: axe on every control in every state', () => {
  const STATES = [
    ['default', {}],
    ['described', { description: 'A hint' }],
    ['required', { required: true }],
    ['invalid', { error: 'Something is wrong' }],
    ['disabled', { disabled: true }],
    ['described and invalid', { description: 'A hint', error: 'Something is wrong' }],
  ] as const

  for (const [name, control] of CONTROLS) {
    it.each(STATES)(`${name} in the %s state has no blocking violations`, async (_s, props) => {
      const { container } = render(<Field label="Account code" {...props}>{control}</Field>)
      await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
    })
  }

  it.each(STATES)('RadioGroup in the %s state has no blocking violations', async (_s, props) => {
    const { container } = render(
      // `labelFor="group"` is the SHIPPING composition - htmlFor cannot target a fieldset. The
      // fixture previously used the default, so the axe gate cited by both group verification
      // records had never run over the markup Clara actually tells consumers to write.
      <Field label="Payment terms" labelFor="group" {...props}>
        <RadioGroup name="terms" legend="Payment terms" options={[
          { value: '30', label: 'Net 30' }, { value: '60', label: 'Net 60' },
        ]} />
      </Field>,
    )
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
  })

  it.each(STATES)('CheckboxGroup in the %s state has no blocking violations', async (_s, props) => {
    const { container } = render(
      <Field label="Notify by" labelFor="group" {...props}>
        <CheckboxGroup name="ch" legend="Notify by" options={[
          { value: 'email', label: 'Email' }, { value: 'post', label: 'Post' },
        ]} />
      </Field>,
    )
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
  })
})
