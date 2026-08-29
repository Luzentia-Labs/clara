import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { runAxe } from '../../../../../../test/axe'
import { ClaraProvider } from '../../../theme/ClaraProvider'
import { Field } from '../../Field/Field'
import { MultiSelect, type MultiSelectOption } from '../MultiSelect'

const OPTIONS: MultiSelectOption[] = [
  { value: 'gbp', label: 'Pound sterling' },
  { value: 'eur', label: 'Euro' },
  { value: 'usd', label: 'US dollar', disabled: true },
  { value: 'sek', label: 'Swedish krona' },
]

const inField = (node: React.ReactNode) => render(<Field label="Currencies">{node}</Field>)

const openIt = async () => {
  const trigger = screen.getByRole('combobox')
  trigger.focus()
  await userEvent.keyboard('{ArrowDown}')
  await screen.findByRole('listbox')
  return trigger
}

describe('MultiSelect remove control names its value', () => {
  it('gives each tag a remove control labelled with the value it removes', async () => {
    // Not "Remove" on every tag: a keyboard user tabbing through several otherwise hears the same
    // string each time and cannot tell which one they are about to drop.
    inField(<MultiSelect options={OPTIONS} defaultValues={['eur', 'sek']} />)
    expect(screen.getByRole('button', { name: 'Remove Euro' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Remove Swedish krona' })).toBeTruthy()
  })

  it('removes exactly that value, and reports the rest', async () => {
    const onValuesChange = vi.fn()
    inField(<MultiSelect options={OPTIONS} defaultValues={['eur', 'sek']} onValuesChange={onValuesChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Remove Euro' }))
    expect(onValuesChange).toHaveBeenCalledWith(['sek'])
  })
})

describe('MultiSelect announces selected count', () => {
  it('keeps a live region present and EMPTY until there is something to say', () => {
    // A region created in the same commit as its text is commonly not announced at all.
    inField(<MultiSelect options={OPTIONS} />)
    const status = screen.getByRole('status')
    expect(status).toBeTruthy()
    expect(status.textContent).toBe('')
  })

  it('states the new count when the selection changes', async () => {
    inField(<MultiSelect options={OPTIONS} />)
    await openIt()
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('1 selected'))
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('2 selected'))
  })
})

describe('MultiSelect keeps the list open', () => {
  it('stays open across several toggles, and each toggle moves exactly one value', async () => {
    const onValuesChange = vi.fn()
    inField(<MultiSelect options={OPTIONS} onValuesChange={onValuesChange} />)
    await openIt()
    await userEvent.keyboard('{Enter}')
    expect(screen.queryByRole('listbox'), 'still open after the first choice').not.toBeNull()
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(screen.queryByRole('listbox'), 'still open after the second').not.toBeNull()
    expect(onValuesChange).toHaveBeenLastCalledWith(['gbp', 'eur'])
    // and toggling the same option again REMOVES it
    await userEvent.keyboard('{Enter}')
    expect(onValuesChange).toHaveBeenLastCalledWith(['gbp'])
  })

  it('still closes on Escape, which is the dismiss key in every mode', async () => {
    inField(<MultiSelect options={OPTIONS} />)
    await openIt()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
  })

  it('marks the listbox multiselectable', async () => {
    inField(<MultiSelect options={OPTIONS} />)
    await openIt()
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true')
  })
})

describe('MultiSelect Tab commits nothing', () => {
  it('closes on Tab WITHOUT toggling the highlighted option (D0128)', async () => {
    // Single-select commits on Tab deliberately. Here the highlight is a cursor rather than an
    // intent, and a value silently added to an accumulating list may never be noticed.
    const onValuesChange = vi.fn()
    inField(<MultiSelect options={OPTIONS} onValuesChange={onValuesChange} />)
    await openIt()
    await userEvent.keyboard('{Tab}')
    expect(onValuesChange, 'Tab added nothing').not.toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
  })
})

describe('MultiSelect theme and density matrix', () => {
  it.each([
    ['light', 'comfortable'], ['light', 'compact'],
    ['dark', 'comfortable'], ['dark', 'compact'],
  ] as const)('renders inside the %s / %s scope and passes axe', async (theme, density) => {
    const { container } = render(
      <ClaraProvider theme={theme} density={density}>
        <Field label="Currencies"><MultiSelect options={OPTIONS} defaultValues={['eur']} /></Field>
      </ClaraProvider>,
    )
    await openIt()
    const listbox = screen.getByRole('listbox')
    const scope = listbox.closest('[data-clara-theme]')
    expect(scope?.getAttribute('data-clara-theme')).toBe(theme)
    expect(scope?.getAttribute('data-clara-density')).toBe(density)
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
    // the PANEL is portalled out of `container`, so it must be axed where it lands
    await expect(runAxe(document.body)).resolves.toHaveNoBlockingViolations()
  })
})

describe('MultiSelect stylesheets select on the option state model', () => {
  const css = readFileSync(resolve(__dirname, '../../../styles.css'), 'utf8')
  const block = (selector: string) => {
    const at = css.indexOf(selector + ' {')
    expect(at, `${selector} has no rule`).toBeGreaterThan(-1)
    return css.slice(at, css.indexOf('}', at))
  }

  it('gives the CURSOR a non-colour carrier beside its tint', () => {
    const rule = block('.clara-multi-select__option--active')
    expect(rule).toContain('background:')
    expect(rule, 'the inset bar is what clears 3:1').toContain('box-shadow: inset')
  })

  it('gives the CHOICE glyph its own colour and the forced palette', () => {
    const rule = block('.clara-multi-select__check')
    expect(rule).toContain('color:')
    expect(rule).toContain('forced-color-adjust')
  })
})

// AC7's Touches names the token source, so the verifier has to READ it - a vitest case cannot see
// a change to an asset it never loads. Both source AND build, because reading only the build lets a
// stale dist certify a source that moved, and reading only the source proves nothing about what
// ships. Select and Combobox each learned this the same way.
describe('MultiSelect option state tokens are pinned at both ends', () => {
  const src = JSON.parse(readFileSync(
    resolve(__dirname, '../../../../../tokens/src/component/multi-select.json'), 'utf8'))
  const built = readFileSync(
    resolve(__dirname, '../../../../../tokens/dist/tokens.css'), 'utf8')

  it('declares the cursor and the check against accent roles in the SOURCE', () => {
    expect(src['multi-select']['option-cursor'].value).toBe('{color.bg.accent-emphasis}')
    expect(src['multi-select']['option-check-fg'].value).toBe('{color.fg.accent}')
  })

  it('and emits them in the BUILD, so a stale dist cannot certify the source', () => {
    for (const [token, expected] of [
      ['multi-select-option-cursor', 'var(--clara-color-bg-accent-emphasis)'],
      ['multi-select-option-check-fg', 'var(--clara-color-fg-accent)'],
    ] as const) {
      const decl = built.match(new RegExp(`--clara-${token}:\\s*([^;]+);`))?.[1]?.trim()
      expect(decl, `${token} is emitted`).toBeTruthy()
      expect(decl).toBe(expected)
    }
  })
})
