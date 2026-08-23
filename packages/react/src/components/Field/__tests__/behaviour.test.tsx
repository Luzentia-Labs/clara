import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, vi } from 'vitest'
import { cloneElement, useState } from 'react'
import { createEvent, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { runAxe } from '../../../../../../test/axe'
import { ClaraProvider } from '../../../theme/ClaraProvider'
import { claraAttributes } from '../../../theme/resolve'
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

/**
 * A Field wrapping a GROUP. Separate helper because the composition is different: `htmlFor` cannot
 * target a fieldset, so a group needs `labelFor="group"` and the Field names it by
 * `aria-labelledby`. Every group fixture previously used `inField`, which meant the whole suite
 * exercised the broken shape - and the fix for it was covered by no test at all.
 */
const inGroupField = (control: React.ReactNode, props = {}) =>
  render(<Field label="Value" labelFor="group" {...props}>{control}</Field>)

describe('Input affordances', () => {
  it('is a real textbox that carries the Clara input contract', () => {
    inField(<Input />)
    const el = screen.getByRole('textbox')
    expect(el.tagName).toBe('INPUT')
    expect(el.className).toContain('clara-input')
  })

  it('takes the size it is given, and md when it is given none', () => {
    // Density does NOT change this class - it rescales the tokens the class resolves through
    // (D0056). An earlier version of this test rendered at compact density and asserted
    // `clara-input--md`, which is the DEFAULT PROP echoed back: it passed identically at
    // comfortable density, and with the provider removed altogether. The target-size floor it
    // claimed to prove is measured against real token values by `check:geometry`
    // (packages/tokens/src/__tests__/density.test.ts, "target size floor in compact"), which is
    // the only place in this repo that can measure it - jsdom computes no layout.
    const { rerender } = inField(<Input />)
    expect(screen.getByRole('textbox').className).toContain('clara-input--md')
    rerender(<Field label="Value"><Input size="sm" /></Field>)
    expect(screen.getByRole('textbox').className).toContain('clara-input--sm')
    expect(screen.getByRole('textbox').className).not.toContain('clara-input--md')
  })
})

describe('Input readonly is distinct from disabled and full contrast', () => {
  // Two different states that look alike if you are careless. Readonly text must be READ - Clara
  // does not take WCAG's contrast exemption for it (F09) - and it stays in the tab order.
  it('keeps readonly focusable and copyable', async () => {
    inField(<Input readOnly defaultValue="PO-4417" />)
    const el = screen.getByRole('textbox')
    expect(el).toHaveAttribute('readonly')
    expect(el).not.toBeDisabled()
    await userEvent.tab()
    expect(el).toHaveFocus()
  })

  it('is not the same state as disabled, and disabled stays REACHABLE', () => {
    // D0058/D0028: a natively disabled control leaves the tab order, so a keyboard user can never
    // reach it - and an ERP form is frequently mostly disabled, with the REASON attached to the
    // control they cannot reach. The first version of this framework used the native attribute and
    // this test asserted that as correct.
    const { rerender } = inField(<Input readOnly defaultValue="x" />)
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-disabled')
    rerender(<Field label="Value" description="approved records cannot be edited" disabled><Input defaultValue="x" /></Field>)
    const el = screen.getByRole('textbox')
    expect(el).toHaveAttribute('aria-disabled', 'true')
    expect(el).not.toHaveAttribute('disabled')
    expect(el).toHaveAttribute('readonly')
    el.focus()
    expect(el).toHaveFocus()
  })
})

describe('Input uses native change convention', () => {
  it('reports through onChange with the event, not a bare value', async () => {
    const onChange = vi.fn()
    inField(<Input onChange={onChange} />)
    await userEvent.type(screen.getByRole('textbox'), 'x')
    expect(onChange.mock.calls[0]?.[0]).toHaveProperty('currentTarget')
  })
})

describe('Textarea auto-resize respects maxRows', () => {
  // jsdom computes no layout, so `scrollHeight` is 0 for every element and every assertion about
  // the resulting height is a constant - the first version of these tests asserted `height` was
  // truthy ("0px") and called it growth, and asserted overflow was 'hidden' under a name that said
  // it scrolled. Both passed against a control collapsed to nothing. Standing in a content height
  // is what makes the branch reachable: the component reads `scrollHeight` and `lineHeight`, so
  // supplying both exercises the real arithmetic rather than a fixed 0.
  const withContentHeight = (px: number) => {
    const proto = Object.getPrototypeOf(document.createElement('textarea'))
    const original = Object.getOwnPropertyDescriptor(proto, 'scrollHeight')
    Object.defineProperty(proto, 'scrollHeight', { configurable: true, get: () => px })
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ lineHeight: '20px' } as CSSStyleDeclaration)
    return () => {
      vi.mocked(window.getComputedStyle).mockRestore()
      if (original) Object.defineProperty(proto, 'scrollHeight', original)
      else delete (proto as Record<string, unknown>).scrollHeight
    }
  }

  it('grows to the content height while it is under the cap', () => {
    const restore = withContentHeight(60)          // 3 lines at 20px
    inField(<Textarea maxRows={4} />)              // cap is 80px
    const el = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(el.style.height).toBe('60px')
    expect(el.style.overflowY).toBe('hidden')
    restore()
  })

  it('stops at the cap and scrolls once the content exceeds it', () => {
    // The cap is the whole point of the feature: an unbounded textarea grows until the submit
    // button is off screen, and the user cannot see the action they are about to take.
    const restore = withContentHeight(200)         // 10 lines of content
    inField(<Textarea maxRows={2} />)              // cap is 40px
    const el = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(el.style.height).toBe('40px')
    expect(el.style.overflowY).toBe('auto')
    restore()
  })

  it('stays a fixed height when maxRows is omitted', () => {
    const restore = withContentHeight(200)
    inField(<Textarea rows={3} />)
    const el = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(el.style.height).toBe('')
    restore()
  })

})

describe('Textarea keyboard keys behave', () => {
  it('inserts a newline on Enter rather than submitting', async () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
    render(<form onSubmit={onSubmit}><Field label="Notes"><Textarea /></Field></form>)
    const el = screen.getByRole('textbox') as HTMLTextAreaElement
    await userEvent.type(el, 'one{enter}two')
    expect(el.value).toBe('one\ntwo')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('leaves the control on Tab rather than indenting', async () => {
    inField(<Textarea />)
    const el = screen.getByRole('textbox') as HTMLTextAreaElement
    el.focus()
    await userEvent.tab()
    expect(el).not.toHaveFocus()
    expect(el.value).not.toContain('\t')
  })
})

describe('NumberInput ignores wheel', () => {
  // A scroll aimed at the PAGE must never edit a figure the user is not looking at. Clara's
  // control is `type="text"` with `inputmode="decimal"`, so it would not step on wheel in any
  // case - which means asserting "the value did not change" proves nothing and passes with the
  // handler deleted. The behaviour that exists is that the control BLURS, so a wheel event
  // reaching a focused numeric field cannot be captured by it at all; that is what is asserted.
  it('is never type="number", which is what makes the wheel harmless', () => {
    // The guarantee is structural, not a handler: the control is never `type="number"`, so the
    // wheel cannot reach the value at all (D0062). An earlier implementation blurred on wheel,
    // which protected against nothing and stole focus from anyone scrolling a long form - it was
    // removed, and the assertion below is that focus STAYS.
    inField(<NumberInput defaultValue="100" />)
    const el = screen.getByRole('textbox') as HTMLInputElement
    expect(el.type).toBe('text')
    expect(el.inputMode).toBe('decimal')
    el.focus()
    el.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true }))
    expect(el.value).toBe('100')
    // and the scroll gesture does NOT cost the user their place in the form
    expect(el).toHaveFocus()
  })
})

describe('NumberInput constraints and formatting', () => {
  it('announces its bounds through the only role that supports them', () => {
    // aria-valuemin/max on the implicit `textbox` role is invalid ARIA: nothing announces it, and
    // axe reports it as a critical `aria-allowed-attr` violation. The bounds are only real when the
    // role is `spinbutton`, so supplying a bound is what turns the control into one.
    inField(<NumberInput min={0} max={100} defaultValue="40" />)
    const el = screen.getByRole('spinbutton')
    expect(el).toHaveAttribute('aria-valuemin', '0')
    expect(el).toHaveAttribute('aria-valuemax', '100')
    expect(el).toHaveAttribute('aria-valuenow', '40')
  })

  it('is a plain textbox with no aria-value* when it has no bounds', () => {
    // An account code is not a value in a range, so it must not claim to be one.
    inField(<NumberInput defaultValue="00417" />)
    const el = screen.getByRole('textbox')
    expect(el).not.toHaveAttribute('aria-valuemin')
    expect(el).not.toHaveAttribute('aria-valuenow')
    expect(screen.queryByRole('spinbutton')).toBeNull()
  })

  it('keeps figures tabular so a column of amounts lines up', () => {
    inField(<NumberInput />)
    expect(screen.getByRole('textbox').className).toContain('clara-input--numeric')
  })

  it('preserves a leading zero, because an account code is not a quantity', async () => {
    inField(<NumberInput />)
    await userEvent.type(screen.getByRole('textbox'), '00417')
    expect(screen.getByRole('textbox')).toHaveValue('00417')
  })
})

describe('NumberInput arrow keys step and clamp', () => {
  it('steps up and down, and reports through onChange', async () => {
    function Controlled () {
      const [v, setV] = useState('10')
      return <Field label="Qty"><NumberInput value={v} step={5} onChange={(e) => setV(e.currentTarget.value)} /></Field>
    }
    render(<Controlled />)
    // A spinbutton, not a textbox: naming a `step` opts into numeric semantics, which is what
    // brings the role and the key handling with it.
    const el = screen.getByRole('spinbutton')
    el.focus()
    await userEvent.keyboard('{ArrowUp}')
    expect(el).toHaveValue('15')
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    expect(el).toHaveValue('5')
  })

  it('clamps to the declared bounds', async () => {
    function Controlled () {
      const [v, setV] = useState('9')
      return <Field label="Qty"><NumberInput value={v} min={0} max={10} onChange={(e) => setV(e.currentTarget.value)} /></Field>
    }
    render(<Controlled />)
    const el = screen.getByRole('spinbutton')
    el.focus()
    await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}')
    expect(el).toHaveValue('10')
  })


  it('does not write float noise for a fractional step', () => {
    // 0.1 + 0.1 + 0.1 is 0.30000000000000004 in binary floating point, and seventeen significant
    // digits in a currency field is a defect the user has to clean up by hand.
    inField(<NumberInput step={0.1} defaultValue="0" />)
    const el = screen.getByRole('spinbutton') as HTMLInputElement
    el.focus()
    fireEvent.keyDown(el, { key: 'ArrowUp' })
    fireEvent.keyDown(el, { key: 'ArrowUp' })
    fireEvent.keyDown(el, { key: 'ArrowUp' })
    expect(el.value).toBe('0.3')
  })
})

describe('PasswordInput reveal toggle state label', () => {
  it('names the action it will perform, not the state it is in', async () => {
    inField(<PasswordInput />)
    expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument()
  })
})

describe('SearchInput clear returns focus', () => {
  // A clear button that keeps focus strands a keyboard user on a control that has just gone.
  it('clears the value and puts focus back in the input', async () => {
    function Controlled () {
      const [v, setV] = useState('acme')
      return <Field label="Search"><SearchInput value={v} onChange={(e) => setV(e.currentTarget.value)} /></Field>
    }
    render(<Controlled />)
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    const input = screen.getByRole('searchbox')
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
  })
})

describe('Checkbox state is not colour alone', () => {
  // WCAG 1.4.1. The mechanism is that the NATIVE control draws a tick and `accent-color` only
  // tints it, so the mark carries the meaning and colour reinforces it. The single edit that
  // breaks that is `appearance: none`, which erases the tick and leaves the box a coloured
  // rectangle - so that is what this asserts. Asserting `type === "checkbox"` and `checked` (the
  // earlier version) passes against exactly that broken implementation.
  const stylesheet = readFileSync(resolve(__dirname, '../../../styles.css'), 'utf8')

  const declarationsFor = (selector: string) => {
    const rules = [...stylesheet.matchAll(/([^{}]+)\{([^}]*)\}/g)]
    return rules.filter(([, sel]) => (sel ?? '').includes(selector)).map(([, , body]) => body ?? '').join(';')
  }

  it('does not neutralise the native control, which is what draws the mark', () => {
    const declared = declarationsFor('.clara-checkbox')
    expect(declared).not.toMatch(/appearance:\s*none/)
    expect(declared).toMatch(/appearance:\s*auto/)
  })

  it('the checked state is reflected on the control, not only in a colour', () => {
    const { container } = inField(<Checkbox defaultChecked />)
    const box = container.querySelector('input') as HTMLInputElement
    expect(box.checked).toBe(true)
    expect(box.matches(':checked')).toBe(true)
  })
})

describe('Checkbox label is a click target and Space toggles from the keyboard', () => {
  it('toggles with Space, the key the record documents', async () => {
    // The keyboard table names Space and only a click was ever tested - a documented key row
    // exercised by pointer is not evidence about the keyboard.
    render(<Checkbox label="Include cancelled" />)
    const box = screen.getByRole('checkbox')
    box.focus()
    await userEvent.keyboard(' ')
    expect(box).toBeChecked()
  })

  it('toggles when the label text is clicked, not only the 16px box', async () => {
    render(<Checkbox label="Include cancelled" />)
    await userEvent.click(screen.getByText('Include cancelled'))
    expect(screen.getByRole('checkbox')).toBeChecked()
  })
})

describe('Switch uses role switch', () => {
  it('is announced as a switch rather than a checkbox', () => {
    render(<Switch label="Email alerts" />)
    expect(screen.getByRole('switch', { name: 'Email alerts' })).toBeInTheDocument()
  })

  it('has a clickable label too', async () => {
    render(<Switch label="Email alerts" />)
    await userEvent.click(screen.getByText('Email alerts'))
    expect(screen.getByRole('switch')).toBeChecked()
  })
})

describe('RadioGroup error associates with group', () => {
  // The error belongs to the QUESTION, not to one answer - it is described on the fieldset.
  it('describes the fieldset, not an individual radio', () => {
    inGroupField(<RadioGroup name="t" legend="Terms" options={[{ value: '30', label: 'Net 30' }]} />, { label: 'Terms', error: 'Choose one' })
    // `radiogroup`, not `group` - see RadioGroup.tsx: it is the role that supports aria-required.
    const group = screen.getByRole('radiogroup', { name: 'Terms' })
    expect(group).toHaveAttribute('aria-invalid', 'true')
    const errId = group.getAttribute('aria-errormessage')
    expect(document.getElementById(errId!)?.textContent).toBe('Choose one')
    expect(screen.getByRole('radio')).not.toHaveAttribute('aria-invalid')
  })
})

describe('RadioGroup roving focus', () => {
  it('arrow keys do not change a disabled selection', async () => {
    // Documented in the keyboard table, and only ever tested with a click.
    const options = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]
    const onChange = vi.fn()
    render(
      <Field label="Q" labelFor="group" disabled>
        <RadioGroup name="t" legend="Q" options={options} defaultValue="a" onChange={onChange} />
      </Field>,
    )
    const first = screen.getByRole('radio', { name: 'A' })
    first.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('radio', { name: 'B' })).not.toBeChecked()
  })

  it('is one tab stop with arrow keys choosing - the browser\'s own behaviour', async () => {
    const options = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]
    inGroupField(<RadioGroup name="t" legend="Q" options={options} defaultValue="a" />, { label: 'Q' })
    await userEvent.tab()
    expect(screen.getByRole('radio', { name: 'A' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: 'B' })).toBeChecked()
  })
})

describe('CheckboxGroup group semantics', () => {
  it('is a fieldset whose legend names the question', () => {
    inGroupField(<CheckboxGroup name="c" legend="Notify by" options={[{ value: 'e', label: 'Email' }]} />, { label: 'Notify by' })
    expect(screen.getByRole('group', { name: 'Notify by' })).toBeInTheDocument()
  })
})

// Every control, in all four theme x density combinations.
//
// The earlier version of this block asserted that the scope element carried the theme and density
// it had just been given, which is ClaraProvider echoing its own props back - tautological with
// respect to the control under test, and it passed with the MATRIX rows all set to one combination.
// What can actually break is the SEAM: `resolve.ts` stamps the attributes, and the emitted theme
// stylesheets select on them. Rename either side and every dark or compact page silently renders
// in the base theme, with no test failing. That is what these assertions are for.
//
// Contrast is NOT measured here - jsdom computes no layout, so `check:contrast` measures it against
// real token values instead. Neither is appearance: visual regression (gate 7, US-01M0GMZW) is not
// wired, so nothing in this file proves how any of this LOOKS.
const themeCss = readFileSync(resolve(__dirname, '../../../../../tokens/dist/themes/dark.css'), 'utf8')
const densityCss = readFileSync(resolve(__dirname, '../../../../../tokens/dist/themes/compact.css'), 'utf8')

describe('the theme and density scope is the one the stylesheets select on', () => {
  it('stamps the attribute the dark theme selects on', () => {
    const attrs = claraAttributes({ theme: 'dark', density: 'comfortable' })
    const [name, value] = Object.entries(attrs).find(([k]) => k.includes('theme'))!
    expect(themeCss).toContain(`[${name}="${value}"]`)
  })

  it('stamps the attribute the compact density selects on', () => {
    const attrs = claraAttributes({ theme: 'light', density: 'compact' })
    const [name, value] = Object.entries(attrs).find(([k]) => k.includes('density'))!
    expect(densityCss).toContain(`[${name}="${value}"]`)
  })

  it('the two themes actually declare different values, so the override is not empty', () => {
    // A theme file that redeclares nothing is a theme that does not exist. This is the vacuity
    // floor: without it the seam assertions above would pass against an empty override block.
    expect(themeCss.match(/--clara-[\w-]+:/g)?.length ?? 0).toBeGreaterThan(10)
    expect(densityCss.match(/--clara-[\w-]+:/g)?.length ?? 0).toBeGreaterThan(3)
  })
})

const MATRIX = [
  ['light', 'comfortable'], ['light', 'compact'], ['dark', 'comfortable'], ['dark', 'compact'],
] as const
/** Which fixtures are a fieldset, declared once beside them rather than inferred from a name. */
const GROUP_FIXTURES = new Set(['RadioGroup', 'CheckboxGroup'])
/**
 * `isGroup` travels WITH the fixture rather than being inferred from the display name. A name test
 * silently reverts the composition fix for any control that is renamed or added - the same
 * category-from-a-name failure the repo keeps finding (D0051, D0067).
 */
const CONTROLS = [
  ['Field framework', <Input />],
  ['Input', <Input />],
  ['Input (decorated)', <Input prefix="£" suffix="/unit" clearable maxCount={20} defaultValue="10" />],
  ['Textarea', <Textarea />],
  // Bounded, so the spinbutton role and its aria-value* surface are actually in the matrix. The
  // fixture was unbounded, which meant axe never saw the ARIA this component exists to argue about.
  ['NumberInput', <NumberInput min={0} max={100} step={1} unit="GBP" defaultValue="10" />],
  ['PasswordInput', <PasswordInput />],
  ['SearchInput', <SearchInput />],
  ['Checkbox', <Checkbox label="One" />],
  ['Switch', <Switch label="One" />],
  ['RadioGroup', <RadioGroup name="r" legend="Q" options={[{ value: 'a', label: 'A' }]} />],
  ['CheckboxGroup', <CheckboxGroup name="c" legend="Q" options={[{ value: 'a', label: 'A' }]} />],
] as const

describe.each(CONTROLS)('%s theme and density matrix', (name, control) => {
  it.each(MATRIX)('renders inside the themed scope and passes axe in %s / %s', async (theme, density) => {
    // A group is labelled differently from a single control, and the fixture has to render the
    // composition that ships - otherwise the matrix passes over markup no consumer is told to write.
    const isGroup = GROUP_FIXTURES.has(name)
    const { container } = render(
      <ClaraProvider theme={theme} density={density}>
        <Field label="Account code" description="hint" {...(isGroup ? { labelFor: 'group' as const } : {})}>
          {control}
        </Field>
      </ClaraProvider>,
    )
    const scope = container.querySelector('[data-clara-theme]')!
    // The control must be a DESCENDANT of the scope, or the theme's custom properties never cascade
    // to it. A control that portals out of the scope renders unthemed, and the previous assertion -
    // reading the attribute off the scope itself - could not see that.
    const control_ = container.querySelector('input, textarea, fieldset')!
    expect(scope.contains(control_)).toBe(true)
    expect(scope.getAttribute('data-clara-theme')).toBe(theme)
    expect(scope.getAttribute('data-clara-density')).toBe(density)
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
  })
})

describe('PasswordInput reveal keeps keyboard focus where the user was', () => {
  it('does not reveal a disabled password', async () => {
    // Lives HERE, under PasswordInput's own criterion. It sat under a Field describe, so deleting
    // the guard - which does not merely allow a click, it reveals the value - left PasswordInput's
    // acceptance criterion green and killed a different story's instead.
    const { container } = inField(<PasswordInput defaultValue="hunter2" />, { disabled: true })
    const field = container.querySelector('input') as HTMLInputElement
    expect(field.type).toBe('password')
    await userEvent.click(screen.getByRole('button'))
    expect(field.type).toBe('password')
    expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument()
  })

  it('is operable with Enter and Space, not only clickable', async () => {
    inField(<PasswordInput />)
    const toggle = screen.getByRole('button')
    toggle.focus()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument()
    await userEvent.keyboard(' ')
    expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument()
  })

  it('leaves focus on the toggle, and does not disturb the field', async () => {
    // Asserting `activeElement === field || activeElement === button` was a disjunction that
    // included the failing state - it could not tell the two apart, which is the whole question.
    // Focus staying on the TOGGLE is correct: a keyboard user is then one keypress from masking the
    // value again. The docs said focus stays in the field; the docs were wrong, not the code.
    const { container } = inField(<PasswordInput defaultValue="hunter2" />)
    const field = container.querySelector('input') as HTMLInputElement
    const toggle = screen.getByRole('button')
    toggle.focus()
    await userEvent.keyboard('{Enter}')
    expect(document.activeElement).toBe(toggle)
    expect(field.value).toBe('hunter2')
    expect(field.type).toBe('text')
  })
})

describe('SearchInput clear appears only when there is something to clear', () => {
  it('renders no clear button for an empty field', () => {
    // A permanent clear button on an empty field is a tab stop that does nothing - and every search
    // field in an ERP starts empty.
    inField(<SearchInput />)
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull()
  })

  it('appears once there is a value, and works uncontrolled', async () => {
    inField(<SearchInput />)
    await userEvent.type(screen.getByRole('searchbox'), 'acme')
    const clear = screen.getByRole('button', { name: 'Clear search' })
    await userEvent.click(clear)
    expect(screen.getByRole('searchbox')).toHaveValue('')
    expect(screen.getByRole('searchbox')).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull()
  })

  it('calls onClear after the value is gone', async () => {
    const onClear = vi.fn()
    inField(<SearchInput defaultValue="acme" onClear={onClear} />)
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})

describe('CheckboxGroup accumulates every choice', () => {
  it('reports the full set when uncontrolled, not just the last box touched', async () => {
    // With the selected set derived from defaultValue alone, every onChange was computed from the
    // FROZEN initial set: ticking A then B reported ["b"], while both boxes showed ticked. A form
    // reading onChange submitted a set the user could not see.
    const onChange = vi.fn()
    render(
      <CheckboxGroup name="c" legend="Notify by" onChange={onChange}
        options={[{ value: 'a', label: 'Email' }, { value: 'b', label: 'SMS' }]} />,
    )
    await userEvent.click(screen.getByRole('checkbox', { name: 'Email' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'SMS' }))
    expect(onChange).toHaveBeenLastCalledWith(['a', 'b'])
  })

  it('removes from the accumulated set, not from the initial one', async () => {
    const onChange = vi.fn()
    render(
      <CheckboxGroup name="c" legend="Notify by" defaultValue={['a']} onChange={onChange}
        options={[{ value: 'a', label: 'Email' }, { value: 'b', label: 'SMS' }]} />,
    )
    await userEvent.click(screen.getByRole('checkbox', { name: 'SMS' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Email' }))
    expect(onChange).toHaveBeenLastCalledWith(['b'])
  })

})

describe('CheckboxGroup error associates with the group', () => {
  it('associates its error with the fieldset, as RadioGroup does', () => {
    // The two stories share this edge case and only one guarded it.
    inGroupField(<CheckboxGroup name="c" legend="Notify by" options={[{ value: 'a', label: 'Email' }]} />, { label: 'Notify by', error: 'Pick one' })
    const group = screen.getByRole('group', { name: 'Notify by' })
    expect(group).toHaveAttribute('aria-invalid', 'true')
    const errId = group.getAttribute('aria-errormessage')
    expect(document.getElementById(errId!)?.textContent).toBe('Pick one')
    expect(screen.getByRole('checkbox')).not.toHaveAttribute('aria-invalid')
  })
})

describe('Checkbox indeterminate survives interaction', () => {
  it('re-applies on a render the prop did not cause', () => {
    // The effect has no dependency array so that ANY render re-asserts the property. Keyed on
    // [indeterminate] it would not run again after something else cleared the DOM property - and
    // that half survived deletion, because only the click path was covered.
    const { container, rerender } = inField(<Checkbox indeterminate />)
    const box = container.querySelector('input') as HTMLInputElement
    box.indeterminate = false                      // something else clears it - a form reset, say
    rerender(<Field label="Value"><Checkbox indeterminate /></Field>)
    expect(box.indeterminate).toBe(true)
  })

  it('stays mixed-consistent after a click, rather than showing a tick while announcing mixed', async () => {
    const { container } = inField(<Checkbox indeterminate />)
    const box = container.querySelector('input') as HTMLInputElement
    expect(box.indeterminate).toBe(true)
    await userEvent.click(box)
    // The prop has not changed, so the control must still be indeterminate: the DOM property is
    // cleared natively by the click, and re-asserted on render.
    expect(box.indeterminate).toBe(true)
    expect(box).toHaveAttribute('aria-checked', 'mixed')
  })
})

describe('Switch has no third state', () => {
  it('does not expose an indeterminate prop, because a third state means Checkbox', () => {
    // RadioGroup guards its equivalent ("no bare Radio in the public API"); this is the same
    // guard for the same class of misuse.
    // The BUILT declarations, not the committed report. Reading `etc/clara-react.api.md` meant a
    // source change could not fail this until someone ran `api:update` - so adding a third state to
    // SwitchProps left the criterion green through a full build.
    const api = readFileSync(resolve(__dirname, '../../../../dist/index.d.ts'), 'utf8')
    const at = api.indexOf('interface SwitchProps')
    // Assert the block was FOUND first. `slice(-1)` collapses to '' and matches nothing, so
    // renaming or removing SwitchProps would have made this pass while proving the opposite.
    expect(at).toBeGreaterThan(-1)
    const block = api.slice(at, api.indexOf('}', at))
    expect(block).toMatch(/checked\?|onChange\?|label\?/)
    expect(block).not.toMatch(/indeterminate/)
  })
})


describe('Field labelFor group names the group instead of orphaning a label', () => {
  // The whole `labelFor` mechanism had no test. Deleting both halves of it left 751 tests and 23
  // gates green, while every group fixture in the suite rendered the broken composition - a
  // `<label htmlFor>` bound to a fieldset, which resolves to nothing, moves focus nowhere and names
  // nothing. axe has no rule for an orphan `for`, so no gate could see it either.
  it('renders no label element bound to an id that does not exist', () => {
    const { container } = render(
      <Field label="Payment terms" labelFor="group">
        <RadioGroup name="t" legend="Payment terms" options={[{ value: '30', label: 'Net 30' }]} />
      </Field>,
    )
    for (const label of container.querySelectorAll('label[for]')) {
      expect(container.querySelector(`#${CSS.escape(label.getAttribute('for')!)}`)).not.toBeNull()
    }
  })

  // Each mechanism is asserted on BOTH groups. Coverage was previously split - aria-labelledby was
  // proven on CheckboxGroup only, the hidden legend on RadioGroup only - so each component had a
  // mechanism that survived deletion, which is the same as not having it tested at all.
  it.each([
    ['RadioGroup', <RadioGroup name="t" legend="Terms" options={[{ value: '30', label: 'Net 30' }]} />, 'radiogroup'],
    ['CheckboxGroup', <CheckboxGroup name="c" legend="Terms" options={[{ value: '30', label: 'Net 30' }]} />, 'group'],
  ])('%s takes its name from the Field label', (_n, control, role) => {
    render(<Field label="Payment terms" labelFor="group">{control}</Field>)
    expect(screen.getByRole(role)).toHaveAccessibleName('Payment terms')
  })

  it.each([
    ['RadioGroup', <RadioGroup name="t" legend="Payment terms" options={[{ value: '30', label: 'Net 30' }]} />],
    ['CheckboxGroup', <CheckboxGroup name="c" legend="Payment terms" options={[{ value: '30', label: 'Net 30' }]} />],
  ])('%s hides its own legend when the Field already names it', (_n, control) => {
    const { container } = render(<Field label="Payment terms" labelFor="group">{control}</Field>)
    expect(container.querySelector('legend')?.className).toContain('clara-visually-hidden')
  })

  it.each([
    ['RadioGroup', <RadioGroup name="t" legend="Terms" options={[{ value: '30', label: 'Net 30' }]} />],
    ['CheckboxGroup', <CheckboxGroup name="c" legend="Terms" options={[{ value: '30', label: 'Net 30' }]} />],
  ])('%s shows its own legend when there is no Field to name it', (_n, control) => {
    const { container } = render(<>{control}</>)
    expect(container.querySelector('legend')?.className ?? '').not.toContain('clara-visually-hidden')
  })

  it('names the group with the Field label, through aria-labelledby', () => {
    const { container } = render(
      <Field label="Payment terms" labelFor="group">
        <RadioGroup name="t" legend="Terms" options={[{ value: '30', label: 'Net 30' }]} />
      </Field>,
    )
    const group = screen.getByRole('radiogroup')
    const named = group.getAttribute('aria-labelledby')
    expect(named).toBeTruthy()
    expect(container.querySelector(`#${CSS.escape(named!)}`)?.textContent).toContain('Payment terms')
    expect(group).toHaveAccessibleName(expect.stringContaining('Payment terms') as unknown as string)
  })

  it('does not paint the group legend twice when the Field already names it', () => {
    const { container } = render(
      <Field label="Payment terms" labelFor="group">
        <CheckboxGroup name="c" legend="Payment terms" options={[{ value: 'a', label: 'Net 30' }]} />
      </Field>,
    )
    const legend = container.querySelector('legend')!
    expect(legend.className).toContain('clara-visually-hidden')
    expect(legend).toBeInTheDocument()
  })

  it('does not put aria-required on a role=group, which cannot carry it', () => {
    render(
      <Field label="Notify by" labelFor="group" required>
        <CheckboxGroup name="c" legend="Notify by" options={[{ value: 'a', label: 'Email' }]} />
      </Field>,
    )
    expect(screen.getByRole('group')).not.toHaveAttribute('aria-required')
  })
})

describe('a disabled Field suppresses the interaction by pointer and keyboard alike', () => {
  // aria-disabled keeps the control reachable, which is the point (D0058) - so every control has to
  // suppress its own change. Guarding the CLICK alone is not enough: React derives a checkbox's
  // change from the same native click and queues both before either runs, so the DOM toggle reverts
  // while the consumer's onChange still fires with checked === true.
  it('does not report a change from a disabled Checkbox', async () => {
    const onChange = vi.fn()
    inField(<Checkbox onChange={onChange} />, { disabled: true })
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('does not report a change from a disabled Switch, by keyboard either', async () => {
    const onChange = vi.fn()
    inField(<Switch onChange={onChange} />, { disabled: true })
    const el = screen.getByRole('switch')
    el.focus()
    await userEvent.keyboard(' ')
    expect(onChange).not.toHaveBeenCalled()
    expect(el).not.toBeChecked()
  })

  it('does not step a disabled NumberInput', () => {
    // readOnly stops TYPING; it does not stop the component writing through the native setter.
    inField(<NumberInput defaultValue="3" min={0} max={9} />, { disabled: true })
    const el = screen.getByRole('spinbutton') as HTMLInputElement
    el.focus()
    fireEvent.keyDown(el, { key: 'ArrowUp' })
    fireEvent.keyDown(el, { key: 'End' })
    expect(el.value).toBe('3')
  })

  it('does not clear a disabled SearchInput', async () => {
    const onClear = vi.fn()
    inField(<SearchInput defaultValue="acme" onClear={onClear} />, { disabled: true })
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(screen.getByRole('searchbox')).toHaveValue('acme')
    expect(onClear).not.toHaveBeenCalled()
  })

  it('does not change a disabled RadioGroup or CheckboxGroup', async () => {
    const onRadio = vi.fn()
    const { unmount } = render(
      <Field label="Terms" labelFor="group" disabled>
        <RadioGroup name="t" legend="Terms" onChange={onRadio}
          options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]} />
      </Field>,
    )
    await userEvent.click(screen.getByRole('radio', { name: 'B' }))
    expect(onRadio).not.toHaveBeenCalled()
    unmount()

    const onBoxes = vi.fn()
    render(
      <Field label="Notify" labelFor="group" disabled>
        <CheckboxGroup name="c" legend="Notify" onChange={onBoxes}
          options={[{ value: 'a', label: 'Email' }]} />
      </Field>,
    )
    await userEvent.click(screen.getByRole('checkbox', { name: 'Email' }))
    expect(onBoxes).not.toHaveBeenCalled()
  })

  it('keeps a disabled Input REACHABLE, which is the whole reason for aria-disabled', async () => {
    render(
      <>
        <button>before</button>
        <Field label="Supplier" description="approved records cannot be edited" disabled>
          <Input />
        </Field>
        <button>after</button>
      </>,
    )
    await userEvent.tab()
    await userEvent.tab()
    expect(screen.getByRole('textbox')).toHaveFocus()
  })
})

describe('Input affixes, clear and counter', () => {
  // The story's User Story asked for all four; none existed, and AC1 was stamped Verified: yes
  // over a test that asserted a class name. Built rather than de-scoped, because silently narrowing
  // the ask is what produced the false verification in the first place.
  it('renders a prefix and suffix as decoration, not as announced content', () => {
    inField(<Input prefix="£" suffix="per unit" defaultValue="10" />)
    const affixes = document.querySelectorAll('.clara-input-group__affix')
    expect(affixes).toHaveLength(2)
    for (const affix of affixes) expect(affix).toHaveAttribute('aria-hidden', 'true')
    // The accessible name is still the Field's label alone - a prefix must not become part of it.
    expect(screen.getByRole('textbox')).toHaveAccessibleName('Value')
  })

  it('clears and returns focus to the input', async () => {
    inField(<Input clearable defaultValue="PO-4417" />)
    await userEvent.click(screen.getByRole('button', { name: 'Clear Value' }))
    expect(screen.getByRole('textbox')).toHaveValue('')
    expect(screen.getByRole('textbox')).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'Clear Value' })).toBeNull()
  })

  it('renders no clear button when there is nothing to clear', () => {
    inField(<Input clearable />)
    expect(screen.queryByRole('button', { name: 'Clear Value' })).toBeNull()
  })

  it('counts characters and describes the field with the count', async () => {
    inField(<Input maxCount={10} />)
    const el = screen.getByRole('textbox')
    await userEvent.type(el, 'abc')
    const described = el.getAttribute('aria-describedby')!.split(' ')
      .map((id) => document.getElementById(id)?.textContent).join(' ')
    expect(described).toContain('3 of 10')
  })

  it('does not impose a maxLength, because a hard cut-off silently discards a paste', async () => {
    inField(<Input maxCount={3} />)
    const el = screen.getByRole('textbox') as HTMLInputElement
    await userEvent.type(el, 'abcdef')
    expect(el).not.toHaveAttribute('maxlength')
    expect(el.value).toBe('abcdef')
    expect(document.querySelector('.clara-input-group__count--over')).not.toBeNull()
  })

  it('says nothing until there is something worth saying, and the count itself is not live', async () => {
    // A live region that rewrites on every keystroke is unusable, and one that APPEARS in the same
    // commit as its first text is commonly not announced at all - so the announcer is always
    // present and empty, and the visible count is reached through aria-describedby instead.
    inField(<Input maxCount={4} />)
    const announcer = document.querySelector('[aria-live="polite"]')!
    const count = document.querySelector('.clara-input-group__count')!
    expect(count).not.toHaveAttribute('aria-live')
    expect(announcer.textContent).toBe('')
    await userEvent.type(screen.getByRole('textbox'), 'ab')
    expect(announcer.textContent).toBe('')
    await userEvent.type(screen.getByRole('textbox'), 'cd')
    expect(announcer.textContent).toBe('limit reached')
    await userEvent.type(screen.getByRole('textbox'), 'ef')
    expect(announcer.textContent).toBe('2 over the limit')
  })

  it('does not clear a disabled decorated Input', async () => {
    inField(<Input clearable defaultValue="PO-4417" />, { disabled: true })
    await userEvent.click(screen.getByRole('button', { name: 'Clear Value' }))
    expect(screen.getByRole('textbox')).toHaveValue('PO-4417')
  })
})

describe('NumberInput keyboard reaches the bounds and holds precision', () => {
  it('reaches the bounds with Home and End, as a spinbutton must', () => {
    // A spinbutton that announces bounds but offers no way to reach them is half a contract.
    inField(<NumberInput min={0} max={99} defaultValue="5" />)
    const el = screen.getByRole('spinbutton') as HTMLInputElement
    el.focus()
    fireEvent.keyDown(el, { key: 'End' })
    expect(el.value).toBe('99')
    fireEvent.keyDown(el, { key: 'Home' })
    expect(el.value).toBe('0')
  })

  it('steps by ten with PageUp and PageDown', () => {
    // Documented in the keyboard table and claimed by an AC; no test mentioned either key.
    inField(<NumberInput defaultValue="10" step={2} min={0} max={100} />)
    const el = screen.getByRole('spinbutton') as HTMLInputElement
    el.focus()
    fireEvent.keyDown(el, { key: 'PageUp' })
    expect(el.value).toBe('30')
    fireEvent.keyDown(el, { key: 'PageDown' })
    expect(el.value).toBe('10')
  })

  it('rounds an exponential step that also has a mantissa', () => {
    // `String(1.5e-7)` is "1.5e-7": the exponent is 7 and the mantissa adds one more decimal, so
    // the precision is 8. Testing only `1e-7` left the mantissa term unexercised - it survived
    // deletion, and a step like this would have rounded one digit short.
    inField(<NumberInput defaultValue="0" step={1.5e-7} />)
    const el = screen.getByRole('spinbutton') as HTMLInputElement
    el.focus()
    fireEvent.keyDown(el, { key: 'ArrowUp' })
    expect(el.value).toBe('0.00000015')
  })

  it('rounds a step smaller than 1e-6, where String(step) turns exponential', () => {
    // String(1e-7) is "1e-7", so splitting on "." found no decimals and rounding silently stopped -
    // for exactly the small steps that need it. An FX rate at seven decimals is an ordinary case.
    inField(<NumberInput defaultValue="0.1" step={1e-7} />)
    const el = screen.getByRole('spinbutton') as HTMLInputElement
    el.focus()
    fireEvent.keyDown(el, { key: 'ArrowUp' })
    expect(el.value).toBe('0.1000001')
  })
})

describe('SearchInput imposes no delay of its own', () => {
  it('reports every keystroke synchronously, so a local filter does not lag the typing', async () => {
    // AC2's behavioural half - "Clara does not impose a delay" - had only a docs verifier, so
    // wrapping onChange in a 400ms timeout would have left it green.
    // Values are captured INSIDE the handler: React nulls `currentTarget` once it returns, so
    // reading it from the recorded call would be reading a released event.
    const seen: string[] = []
    const onChange = vi.fn((e: React.ChangeEvent<HTMLInputElement>) => { seen.push(e.currentTarget.value) })
    inField(<SearchInput onChange={onChange} />)
    await userEvent.type(screen.getByRole('searchbox'), 'abc')
    expect(onChange).toHaveBeenCalledTimes(3)
    expect(seen).toEqual(['a', 'ab', 'abc'])
  })
})

describe('a disabled control runs no consumer handler by any route', () => {
  // The click guard survived deletion with every gate green: the change guard alone keeps the DOM
  // correct, so `not.toBeChecked()` could not see the difference. What the click guard uniquely
  // does is suppress the consumer's own onClick, and nothing asserted it.
  it('does not call a Checkbox consumer onClick', async () => {
    const onClick = vi.fn()
    inField(<Checkbox onClick={onClick} />, { disabled: true })
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('does not call a Switch consumer onClick', async () => {
    const onClick = vi.fn()
    inField(<Switch onClick={onClick} />, { disabled: true })
    await userEvent.click(screen.getByRole('switch'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('does not select a disabled RadioGroup option by click', async () => {
    const onChange = vi.fn()
    render(
      <Field label="Terms" labelFor="group" disabled>
        <RadioGroup name="t" legend="Terms" onChange={onChange}
          options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]} />
      </Field>,
    )
    await userEvent.click(screen.getByRole('radio', { name: 'B' }))
    expect(screen.getByRole('radio', { name: 'B' })).not.toBeChecked()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not toggle a disabled CheckboxGroup option by click', async () => {
    const onChange = vi.fn()
    render(
      <Field label="Notify" labelFor="group" disabled>
        <CheckboxGroup name="c" legend="Notify" onChange={onChange}
          options={[{ value: 'a', label: 'Email' }]} />
      </Field>,
    )
    await userEvent.click(screen.getByRole('checkbox', { name: 'Email' }))
    expect(screen.getByRole('checkbox', { name: 'Email' })).not.toBeChecked()
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('a required group announces the requirement exactly once', () => {
  // Asserting `textContent` was a proxy: it includes visually-hidden text and text that
  // `aria-labelledby` has overridden, so it reported success while the accessible name said nothing
  // about the requirement. Asserting BOTH groups carry it in the NAME was the opposite error -
  // RadioGroup carries `aria-required`, so putting it in the name too announces it twice.
  it('CheckboxGroup composes it into the name, because role=group cannot carry the property', () => {
    render(
      <Field label="Regions" labelFor="group" required>
        <CheckboxGroup name="c" legend="Regions" options={[{ value: 'a', label: 'A' }]} />
      </Field>,
    )
    const group = screen.getByRole('group')
    expect(group).toHaveAccessibleName(/Regions.\(required\)/)
    expect(group).not.toHaveAttribute('aria-required')
  })

  it('RadioGroup uses the property and keeps its name clean', () => {
    render(
      <Field label="Delivery" labelFor="group" required>
        <RadioGroup name="t" legend="Delivery" options={[{ value: 'a', label: 'A' }]} />
      </Field>,
    )
    const group = screen.getByRole('radiogroup')
    expect(group).toHaveAttribute('aria-required', 'true')
    expect(group).toHaveAccessibleName('Delivery')
  })

  it('does not double-announce on a single control, which has aria-required', () => {
    inField(<Input />, { required: true })
    const el = screen.getByRole('textbox')
    expect(el).toHaveAttribute('aria-required', 'true')
    expect(el).toHaveAccessibleName('Value')
  })
})

describe('every labelFor and child combination produces a named control', () => {
  // Two of the four were broken and nothing warned. `labelFor="group"` around a single control gave
  // it NO accessible name at all (axe: critical `label`); `labelFor="control"` around a group left
  // an `htmlFor` resolving to nothing - which axe has no rule for - and painted the label twice.
  // The association no longer depends on the consumer picking the right word: `aria-labelledby`
  // names the control in every combination, and `labelFor` only decides whether a clickable
  // `<label htmlFor>` is rendered. Getting it wrong now costs a click target, never a name.
  it.each([
    ['control', 'single', <Input />, 'textbox'],
    ['group', 'single', <Input />, 'textbox'],
    ['group', 'group', <RadioGroup name="t" legend="Terms" options={[{ value: 'a', label: 'A' }]} />, 'radiogroup'],
    ['control', 'group', <RadioGroup name="t" legend="Terms" options={[{ value: 'a', label: 'A' }]} />, 'radiogroup'],
  ] as const)('labelFor=%s around a %s child still names it', async (labelFor, _kind, control, role) => {
    const { container } = render(
      <Field label="Supplier" labelFor={labelFor}>{control}</Field>,
    )
    expect(screen.getByRole(role)).toHaveAccessibleName('Supplier')
    // and no label points at an id that does not exist
    for (const label of container.querySelectorAll('label[for]')) {
      expect(container.querySelector(`#${CSS.escape(label.getAttribute('for')!)}`)).not.toBeNull()
    }
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
  })

  it('never paints the label text twice, in any combination', () => {
    for (const labelFor of ['control', 'group'] as const) {
      const { container, unmount } = render(
        <Field label="Delivery" labelFor={labelFor}>
          <RadioGroup name="t" legend="Delivery" options={[{ value: 'a', label: 'A' }]} />
        </Field>,
      )
      // Count only what is PAINTED. `clara-visually-hidden` keeps its text in the DOM on purpose,
      // so `textContent` counts the hidden legend too - it is a proxy for what the user sees, and
      // proxies are what this epic keeps getting caught by.
      const painted = [...container.querySelectorAll('*')]
        .filter((el) => !el.closest('.clara-visually-hidden'))
        .filter((el) => el.children.length === 0 && el.textContent === 'Delivery')
      expect(painted).toHaveLength(1)
      unmount()
    }
  })

  it('announces required exactly once, whichever route the control has', () => {
    // RadioGroup carries aria-required itself (role=radiogroup supports it) and must NOT also get
    // the label marker; CheckboxGroup cannot carry it and must. Gating on the labelling mode gave
    // RadioGroup both - the very double-announcement the gate existed to prevent.
    const radio = render(
      <Field label="Delivery" labelFor="group" required>
        <RadioGroup name="t" legend="Delivery" options={[{ value: 'a', label: 'A' }]} />
      </Field>,
    )
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-required', 'true')
    expect(screen.getByRole('radiogroup')).toHaveAccessibleName('Delivery')
    radio.unmount()

    render(
      <Field label="Regions" labelFor="group" required>
        <CheckboxGroup name="c" legend="Regions" options={[{ value: 'a', label: 'A' }]} />
      </Field>,
    )
    const group = screen.getByRole('group')
    expect(group).not.toHaveAttribute('aria-required')
    expect(group).toHaveAccessibleName(/Regions.\(required\)/)
  })
})

describe('labelFor decides the label ELEMENT, and the requirement survives either choice', () => {
  it('renders a span, not a label, in group mode', () => {
    // Deleting the whole `labelFor === 'group'` branch - so a `<label htmlFor>` is always rendered,
    // pointing at a fieldset - left 802 tests and 26 guards green. `htmlFor` on a fieldset does
    // nothing: it is not a labelable element, so clicking the label moves focus nowhere.
    const { container } = render(
      <Field label="Terms" labelFor="group">
        <RadioGroup name="t" legend="Terms" options={[{ value: 'a', label: 'A' }]} />
      </Field>,
    )
    expect(container.querySelector('.clara-field__label')?.tagName).toBe('SPAN')
    expect(container.querySelector('label.clara-field__label')).toBeNull()
  })

  it('renders a real label in control mode, so the text is a click target', async () => {
    const { container } = render(<Field label="Supplier"><Input /></Field>)
    const label = container.querySelector('label.clara-field__label')
    expect(label).not.toBeNull()
    await userEvent.click(label!)
    expect(screen.getByRole('textbox')).toHaveFocus()
  })

  it('announces required on a CheckboxGroup even at the DEFAULT labelFor', () => {
    // The realistic consumer mistake. D0073 promises a wrong `labelFor` costs a click target rather
    // than a name - so the requirement must survive it too. Re-gating the marker on the labelling
    // MODE (rather than on what the control announces) passes every other test in the suite, and
    // loses the announcement here, which is the case no fixture covered.
    render(
      <Field label="Regions" required>
        <CheckboxGroup name="c" legend="Regions" options={[{ value: 'a', label: 'A' }]} />
      </Field>,
    )
    expect(screen.getByRole('group')).toHaveAccessibleName(/Regions.*\(required\)/)
  })

  it('a toggle never receives readOnly, which is not valid on a checkbox', () => {
    // `fieldAriaProps(wiring, 'toggle')` exists for this, and nothing asserted it: dropping the
    // `kind` distinction so every control gets readOnly was green across the whole suite.
    inField(<Checkbox />, { disabled: true })
    const box = screen.getByRole('checkbox')
    expect(box).toHaveAttribute('aria-disabled', 'true')
    expect(box).not.toHaveAttribute('readonly')
    expect(screen.queryByRole('textbox')).toBeNull()
  })
})

describe('NumberInput leaves a plain code field alone', () => {
  it('does not step, and does not swallow arrow keys, when no numeric semantics were asked for', () => {
    // The documented account-code case. With no min, max or step the control is a plain textbox -
    // and it was still rewriting 4417 to 4418 on Arrow Up, and calling preventDefault, which
    // destroys caret navigation in a text field. The APG key set is supposed to travel with the
    // ROLE; it was travelling with the component.
    inField(<NumberInput defaultValue="4417" />)
    const el = screen.getByRole('textbox') as HTMLInputElement
    expect(screen.queryByRole('spinbutton')).toBeNull()
    el.focus()
    for (const key of ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End']) {
      const event = createEvent.keyDown(el, { key })
      fireEvent(el, event)
      expect(event.defaultPrevented).toBe(false)
    }
    expect(el.value).toBe('4417')
  })

  it('steps when a step is named, even with no bounds', () => {
    // A quantity with no maximum is an ordinary case: `bounded` alone would have been the wrong
    // line, and would have silently stopped this working.
    inField(<NumberInput defaultValue="10" step={5} />)
    const el = screen.getByRole('spinbutton') as HTMLInputElement
    el.focus()
    fireEvent.keyDown(el, { key: 'ArrowUp' })
    expect(el.value).toBe('15')
    expect(el).not.toHaveAttribute('aria-valuemax')
  })
})

describe('RadioGroup is a single tab stop', () => {
  // The OUTCOME - one Tab in, one Tab out, however many options - is not observable here:
  // `userEvent.tab()` implements radio-group semantics itself, so it walks the group correctly even
  // when the markup would not. A test written against it passes with `tabIndex={0}` on every radio,
  // which is the one edit that destroys the grouping. That is a proxy, and this file has been
  // caught by proxies before.
  //
  // So this asserts the MECHANISM, which is checkable and which the outcome follows from in a real
  // browser: same `name`, so the browser treats them as one group; and no explicit `tabIndex`, so
  // it applies its own roving rule rather than ours. The outcome itself belongs in the Playwright
  // suite, and is named as a gap on the RadioGroup record.
  it('shares one name across the options and overrides no tabIndex', () => {
    const { container } = render(
      <Field label="Terms" labelFor="group">
        <RadioGroup name="terms" legend="Terms" defaultValue="b" options={[
          { value: 'a', label: 'A' }, { value: 'b', label: 'B' }, { value: 'c', label: 'C' },
        ]} />
      </Field>,
    )
    const radios = [...container.querySelectorAll('input[type="radio"]')]
    expect(radios).toHaveLength(3)
    expect(new Set(radios.map((r) => r.getAttribute('name')))).toEqual(new Set(['terms']))
    for (const radio of radios) expect(radio).not.toHaveAttribute('tabindex')
    // And the checked one is where the browser will land.
    expect(radios.filter((r) => (r as HTMLInputElement).checked)).toHaveLength(1)
  })

  it('unlike CheckboxGroup, where every box is its own stop', async () => {
    render(
      <Field label="Notify" labelFor="group">
        <CheckboxGroup name="c" legend="Notify" options={[
          { value: 'a', label: 'Email' }, { value: 'b', label: 'SMS' },
        ]} />
      </Field>,
    )
    await userEvent.tab()
    expect(screen.getByRole('checkbox', { name: 'Email' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('checkbox', { name: 'SMS' })).toHaveFocus()
  })
})

describe('every text control forwards its ref to the real element', () => {
  // The decorated Input is the case that can break: it renders a wrapper span, and a ref that
  // stops there breaks focus management and every form library that measures or focuses the field.
  it.each([
    ['Input', <Input />, 'INPUT'],
    ['Input (decorated)', <Input prefix="£" clearable maxCount={10} />, 'INPUT'],
    ['Textarea', <Textarea />, 'TEXTAREA'],
    ['NumberInput', <NumberInput min={0} max={9} />, 'INPUT'],
    ['PasswordInput', <PasswordInput />, 'INPUT'],
    ['SearchInput', <SearchInput />, 'INPUT'],
  ] as const)('%s', (_name, control, tag) => {
    const ref = { current: null as HTMLElement | null }
    render(<Field label="Value">{cloneElement(control as React.ReactElement, { ref })}</Field>)
    expect(ref.current?.tagName).toBe(tag)
    // and it is the element the user actually types into, not a wrapper that happens to be one
    ref.current?.focus()
    expect(document.activeElement).toBe(ref.current)
  })
})

describe('NumberInput does not announce a value its own bounds contradict', () => {
  // `min`/`max`/`step` never reach the DOM, so the browser enforces nothing and clamping applies
  // only to stepping - deliberately, because clamping as the user types fights them mid-entry and
  // rejecting the keystroke loses a paste. But the control was then announcing `aria-valuenow=500`
  // beside `aria-valuemax=10`, a contradiction a screen reader reads out in one breath.
  it('marks an out-of-range value invalid, keeping the announced value truthful', async () => {
    inField(<NumberInput min={0} max={10} />)
    const el = screen.getByRole('spinbutton')
    await userEvent.type(el, '500')
    expect(el).toHaveAttribute('aria-valuenow', '500')
    expect(el).toHaveAttribute('aria-valuemax', '10')
    expect(el).toHaveAttribute('aria-invalid', 'true')
  })

  it('says nothing about validity while the value is within bounds', async () => {
    inField(<NumberInput min={0} max={10} />)
    const el = screen.getByRole('spinbutton')
    await userEvent.type(el, '7')
    expect(el).not.toHaveAttribute('aria-invalid')
  })

  it('defers to the Field, which owns the error message', async () => {
    // Two sources of invalidity on one control is one too many, and the Field's carries text.
    inField(<NumberInput min={0} max={10} />, { error: 'Enter a quantity between 0 and 10' })
    const el = screen.getByRole('spinbutton')
    await userEvent.type(el, '500')
    expect(el).toHaveAttribute('aria-errormessage')
    expect(el.getAttribute('aria-invalid')).toBe('true')
  })
})

describe('a consumer disabling a control directly gets Clara disabled, not native disabled', () => {
  // `disabled` is the first prop a React developer reaches for, and it was reaching the DOM through
  // `{...rest}` - so `<Input disabled />` emitted the native attribute and left the tab order, which
  // is precisely the failure D0058 and D0064 exist to prevent. It is public surface on a one-way
  // door, so it was worth settling before the first publish rather than after.
  it.each([
    ['Input', <Input disabled />, 'textbox'],
    ['Textarea', <Textarea disabled />, 'textbox'],
    ['NumberInput', <NumberInput min={0} max={9} disabled />, 'spinbutton'],
    ['SearchInput', <SearchInput disabled />, 'searchbox'],
    ['Checkbox', <Checkbox disabled />, 'checkbox'],
    ['Switch', <Switch disabled />, 'switch'],
  ] as const)('%s keeps its tab stop', (_name, control, role) => {
    render(<Field label="Value">{control}</Field>)
    const el = screen.getByRole(role)
    expect(el).toHaveAttribute('aria-disabled', 'true')
    expect(el).not.toBeDisabled()
    el.focus()
    expect(el).toHaveFocus()
  })

  it('PasswordInput keeps its tab stop too - it has no textbox role to query by', () => {
    // `type="password"` has no implicit role at all, which is why it is not in the table above.
    const { container } = render(<Field label="Value"><PasswordInput disabled /></Field>)
    const el = container.querySelector('input') as HTMLInputElement
    expect(el).toHaveAttribute('aria-disabled', 'true')
    expect(el).not.toBeDisabled()
    el.focus()
    expect(el).toHaveFocus()
  })

  it('suppresses the interaction too, not only the appearance', async () => {
    const onChange = vi.fn()
    render(<Field label="Value"><Checkbox disabled onChange={onChange} /></Field>)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('works standalone, with no Field at all', () => {
    render(<Input disabled aria-label="Loose" />)
    const el = screen.getByRole('textbox')
    expect(el).toHaveAttribute('aria-disabled', 'true')
    expect(el).not.toBeDisabled()
    expect(el).toHaveAttribute('readonly')
  })
})

describe('a control disabled by its OWN prop suppresses its own writes', () => {
  // D0085's rationale names this blind spot and its own fix walked into it: every covering test
  // disabled the FIELD, so dropping the `disabled` argument from `fieldDisabled` inside NumberInput
  // left all 846 tests green. The composition a React developer writes first is the one that was
  // never fixtured.
  it('does not step a NumberInput disabled by its own prop', () => {
    render(<Field label="Qty"><NumberInput min={0} max={99} step={5} defaultValue="10" disabled /></Field>)
    const el = screen.getByRole('spinbutton') as HTMLInputElement
    el.focus()
    for (const key of ['ArrowUp', 'PageUp', 'End', 'Home']) fireEvent.keyDown(el, { key })
    expect(el.value).toBe('10')
  })

  it('does not clear a SearchInput disabled by its own prop', async () => {
    const onClear = vi.fn()
    render(<Field label="Search"><SearchInput defaultValue="acme" onClear={onClear} disabled /></Field>)
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(screen.getByRole('searchbox')).toHaveValue('acme')
    expect(onClear).not.toHaveBeenCalled()
  })

  it('does not reveal a PasswordInput disabled by its own prop', async () => {
    const { container } = render(<Field label="Key"><PasswordInput defaultValue="hunter2" disabled /></Field>)
    const field = container.querySelector('input') as HTMLInputElement
    await userEvent.click(screen.getByRole('button'))
    expect(field.type).toBe('password')
  })

  it('does not clear a decorated Input disabled by its own prop', async () => {
    render(<Field label="Ref"><Input clearable defaultValue="PO-4417" disabled /></Field>)
    await userEvent.click(screen.getByRole('button', { name: 'Clear Ref' }))
    expect(screen.getByRole('textbox')).toHaveValue('PO-4417')
  })
})
