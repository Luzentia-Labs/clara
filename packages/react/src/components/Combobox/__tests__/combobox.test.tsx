import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { runAxe } from '../../../../../../test/axe'
import { resetDevWarnings } from '../../../lib/dev-warning'
import { ClaraProvider } from '../../../theme/ClaraProvider'
import { Field } from '../../Field/Field'
import { Modal } from '../../Modal/Modal'
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
    // `skipClick` is LOAD-BEARING, not tidiness. userEvent.type() clicks the input first, and that
    // click is an outside pointerdown for Radix's DismissableLayer while the input's own onClick
    // reopens - so the list goes open -> closed -> open and the seeding effect re-seats the
    // highlight through its `open` dependency. That masked the mechanism this criterion is about:
    // with the click, removing `options` from the seeding effect's deps left this test green
    // (measured). Without it, the mutant is killed and clean code still passes.
    await userEvent.type(input, 'kro', { skipClick: true })
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

// Added by the D0121-D0124 repair round.
describe('Combobox option state model and the Space key', () => {
  it('lets a leading Space reach the input as a query character', async () => {
    // The engine prevented Space for EVERY trigger, on a comment claiming it was "harmless for an
    // input, where it is a printable character the input handles before this ever sees it". That
    // is false: keydown precedes insertion. Measured before the fix, typing " Ac" produced "Ac".
    inField(<Combobox options={[{ value: 'a', label: ' Actual leading space' }]} />)
    const input = screen.getByRole('combobox') as HTMLInputElement
    input.focus()
    await userEvent.type(input, ' Ac', { skipClick: true })
    expect(input.value, 'the space the user typed is still there').toBe(' Ac')
  })

  it('treats Space as typing rather than as the OPEN key', async () => {
    // The discriminator is the input's VALUE, not whether the list opened. Typing opens a combobox
    // and should; what the old code did was preventDefault the key so nothing was typed at all,
    // and then open - an empty query with an open list, which looks deceptively correct.
    inField(<Combobox options={OPTIONS} />)
    const input = screen.getByRole('combobox') as HTMLInputElement
    input.focus()
    await userEvent.keyboard(' ')
    expect(input.value, 'the keystroke reached the input').toBe(' ')
  })

  it('marks the SELECTED choice with a visible carrier, not only aria-selected', async () => {
    inField(<Combobox options={OPTIONS} defaultValue="eur" />)
    const input = await openIt()
    expect(input).toBeTruthy()
    const chosen = screen.getByRole('option', { name: /Euro/ })
    expect(chosen).toHaveAttribute('aria-selected', 'true')
    expect(chosen.querySelector('.clara-combobox__check')).toBeTruthy()
    const other = screen.getByRole('option', { name: /Pound sterling/ })
    expect(other.querySelector('.clara-combobox__check')).toBeNull()
    // Move the cursor off the choice: at open they coincide, so asserting before moving cannot
    // distinguish a glyph bound to the choice from one bound to the cursor.
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('option', { name: /Euro/ }).querySelector('.clara-combobox__check'),
      'the glyph stays with the CHOICE').toBeTruthy()
    // ArrowDown from Euro skips the disabled US dollar and lands on Swedish krona.
    const cursor = screen.getByRole('option', { name: /Swedish krona/ })
    expect(cursor.className).toContain('clara-combobox__option--active')
    expect(cursor.querySelector('.clara-combobox__check'),
      'and never follows the cursor').toBeNull()
  })

  it('warns when the list GROWS past the ceiling after mount (AC3)', async () => {
    // The latch was set before its own condition was evaluated, so the `options.length` dependency
    // was dead and a list that grew past the ceiling warned zero times - measured at 3 growing to
    // 700, which is the realistic shape of the mistake this criterion exists to catch.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const small: ComboboxOption[] = [{ value: 'a', label: 'A' }]
    const big: ComboboxOption[] = Array.from(
      { length: COMBOBOX_LOCAL_OPTION_CEILING + 1 },
      (_, i) => ({ value: `v${i}`, label: `Option ${i}` }),
    )
    const Grower = () => {
      const [options, setOptions] = useState(small)
      return (
        <>
          <button type="button" onClick={() => setOptions(big)}>grow</button>
          <Combobox options={options} />
        </>
      )
    }
    inField(<Grower />)
    expect(warn, 'a small list is silent').not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'grow' }))
    await waitFor(() => expect(warn, 'growing past the ceiling warns').toHaveBeenCalled())
    warn.mockRestore()
  })
})

// Same reason as Select: jsdom cannot see a stylesheet, so the asset is read directly.
describe('Combobox stylesheets select on the option state model', () => {
  const css = readFileSync(resolve(__dirname, '../../../styles.css'), 'utf8')
  const block = (selector: string) => {
    const at = css.indexOf(selector + ' {')
    expect(at, `${selector} has no rule`).toBeGreaterThan(-1)
    return css.slice(at, css.indexOf('}', at))
  }

  it('gives the CURSOR a non-colour carrier beside its tint', () => {
    const rule = block('.clara-combobox__option--active')
    expect(rule).toContain('background:')
    expect(rule).toContain('box-shadow: inset')
  })

  it('gives the CHOICE glyph its own colour', () => {
    expect(block('.clara-combobox__check')).toContain('color:')
  })
})

// D0121: the group label is the accessible name of the group and the sole carrier of its identity,
// so D0104's Q1 answers yes and it sits at the 14px body floor. It reached 12px through a tier 3
// alias to `font.caption`, which is why the `--clara-font-caption` census D0104 was decided from
// could not see it - a grep for the tier 2 name finds nothing when the reference is an alias.
// Read from the BUILT token stylesheet, because no test imports a token source.
describe('Combobox group label sits at the body floor', () => {
  // BOTH the source and the build, deliberately. Reading only the built stylesheet lets a stale
  // build certify a source that has changed underneath it, which is a sharp edge this repository
  // has already been cut by; reading only the source proves nothing about what ships.
  const src = JSON.parse(readFileSync(
    resolve(__dirname, '../../../../../tokens/src/component/combobox.json'), 'utf8'))
  const built = readFileSync(
    resolve(__dirname, '../../../../../tokens/dist/tokens.css'), 'utf8')

  it('declares group-label-size against the body size in the token SOURCE', () => {
    expect(src.combobox['group-label-size'].value, 'D0121: Q1 answers yes, so 14px')
      .toBe('{font.body}')
    expect(src.combobox['group-label-size'].value).not.toBe('{font.caption}')
  })

  it('and emits it that way in the BUILD, so a stale build cannot certify the source', () => {
    const decl = built.match(/--clara-combobox-group-label-size:\s*([^;]+);/)?.[1]?.trim()
    expect(decl, 'the token is emitted at all').toBeTruthy()
    expect(decl).toBe('var(--clara-font-body)')
    expect(decl).not.toContain('font-caption')
  })
})

// D0125. Render order was documented twice and pinned never - the first docstring was false, and
// so was its replacement, because the claim was carried from a review report rather than derived.
// This is the test that would have caught either.
describe('Combobox render order collects by group', () => {
  it('puts every ungrouped option in one bucket, placed at its first member', async () => {
    inField(<Combobox options={[
      { value: 'a', label: 'Alpha' },
      { value: 'c', label: 'Charlie', group: 'G' },
      { value: 'b', label: 'Bravo' },
    ]} />)
    await openIt()
    const rendered = screen.getAllByRole('option').map((o) => o.textContent)
    // NOT ['Alpha','Charlie','Bravo'] - Bravo joins Alpha's bucket above the group.
    expect(rendered).toEqual(['Alpha', 'Bravo', 'Charlie'])
  })
})

// D0127. The docstring's claims, each derived HERE by execution rather than written from prose -
// which is the mistake that made the previous three attempts at that paragraph wrong.
describe('Combobox render order, every claim pinned', () => {
  const render3 = async (options: ComboboxOption[]) => {
    inField(<Combobox options={options} />)
    await openIt()
    return screen.getAllByRole('option').map((o) => o.textContent)
  }

  it('places an ungrouped option BETWEEN two groups when that is where its bucket falls', async () => {
    // The sentence this kills claimed such interleaving was "not expressible". It is.
    expect(await render3([
      { value: 'a', label: 'A', group: 'G1' },
      { value: 'x', label: 'X' },
      { value: 'b', label: 'B', group: 'G2' },
    ])).toEqual(['A', 'X', 'B'])
  })

  it('cannot put ungrouped options in TWO positions - they share one bucket', async () => {
    // This is what is ACTUALLY inexpressible. Y is pulled up to X's bucket.
    expect(await render3([
      { value: 'x', label: 'X' },
      { value: 'a', label: 'A', group: 'G1' },
      { value: 'y', label: 'Y' },
    ])).toEqual(['X', 'Y', 'A'])
  })

  it('keeps relative order inside a NAMED bucket, not only the ungrouped one', async () => {
    // Unpinned until now: reversing insertion order for non-empty keys survived the whole suite.
    expect(await render3([
      { value: 'a', label: 'A', group: 'G' },
      { value: 'z', label: 'Z', group: 'H' },
      { value: 'b', label: 'B', group: 'G' },
    ])).toEqual(['A', 'B', 'Z'])
  })
})

/**
 * Four behaviours this component's story checked off as covered while nothing tested them.
 *
 * A plan-review found them: "It stays operable inside a Modal" had been copied from Select's story,
 * which has such a test where Combobox had none; Escape, typeahead-off and no-wrap were claimed and
 * unpinned. Written here rather than unchecked in the story, because three of them are behaviours
 * the shared engine only gets right for Combobox by way of a FLAG, and an unpinned flag is one
 * nobody notices flipping.
 */
describe('Combobox behaviours its story claimed but nothing pinned', () => {
  it('Escape closes and restores focus to the input', async () => {
    inField(<Combobox options={OPTIONS} />)
    const input = await openIt()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
    expect(document.activeElement, 'focus must not be dropped to the body').toBe(input)
  })

  it('does NOT typeahead - a printable character is a query character', async () => {
    // `typeahead: false` is the flag that distinguishes an editable trigger from a listbox one.
    // Typing 's' must filter, never jump the highlight to "Swedish krona" the way Select's does.
    inField(<Combobox options={OPTIONS} />)
    const input = await openIt()
    const before = input.getAttribute('aria-activedescendant')
    expect(document.getElementById(before!)?.textContent).toBe('Pound sterling')
    // `skipClick` is load-bearing, not tidiness. `userEvent.type` clicks the target first, and the
    // input sits OUTSIDE the portalled panel - so that click is an outside pointerdown, Radix's
    // DismissableLayer closes the list, and the input's own handler reopens it. The keystroke then
    // lands on the engine's CLOSED branch, where nothing is prevented whatever `typeahead` is set
    // to. The first version of this test typed with the click and could not fail on the flag at
    // all; a seat measured that. It has to reach the OPEN branch to test anything.
    await userEvent.type(input, 's', { skipClick: true })

    // THE pin for `typeahead: false`: with typeahead ON the engine calls preventDefault() on any
    // printable key, so the character never reaches the input at all. It arriving is the proof.
    expect(input, 'a query character must not be swallowed by a typeahead branch').toHaveValue('s')

    // And it FILTERED rather than jumping the highlight inside an unfiltered list, which is what
    // Select does with the same keystroke. The match is `includes`, not `startsWith`.
    const options = screen.getAllByRole('option').map((o) => o.textContent)
    expect(options, 'the character filtered the list').toEqual(
      ['Pound sterling', 'US dollar', 'Swedish krona'])
    expect(options.length, 'a typeahead would have left all four in place').toBeLessThan(OPTIONS.length)

    // The scenario this backs is "a printable character does not JUMP the highlight", so assert
    // the highlight AFTER the keystroke - the previous version read it only before, and never
    // checked the thing its own name promised. A typeahead would have moved it to the first label
    // containing "s" in an UNFILTERED list; re-seating to the first surviving match is not that.
    const after = input.getAttribute('aria-activedescendant')
    expect(document.getElementById(after!)?.textContent,
      'the highlight re-seated to the first MATCH, it was not jumped by typeahead').toBe('Pound sterling')
  })

  it('does not WRAP past either end', async () => {
    inField(<Combobox options={OPTIONS} />)
    const input = await openIt()
    const first = input.getAttribute('aria-activedescendant')
    await userEvent.keyboard('{ArrowUp}')
    expect(input.getAttribute('aria-activedescendant'),
      'ArrowUp at the first option stays put rather than jumping to the last').toBe(first)

    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    const last = input.getAttribute('aria-activedescendant')
    expect(document.getElementById(last!)?.textContent,
      'and the disabled US dollar was skipped on the way').toBe('Swedish krona')
    await userEvent.keyboard('{ArrowDown}')
    expect(input.getAttribute('aria-activedescendant')).toBe(last)
  })

  it('renders its listbox and stays operable inside a Modal', async () => {
    // The panel portals to document.body while the Modal traps focus there. Select has this test;
    // its story and Combobox's both claimed it, and only one of them was true.
    const onValueChange = vi.fn()
    render(
      <Modal open onClose={() => {}} title="Filters">
        <Field label="Currency"><Combobox options={OPTIONS} onValueChange={onValueChange} /></Field>
      </Modal>,
    )
    const input = screen.getByRole('combobox')
    input.focus()
    await userEvent.keyboard('{ArrowDown}')
    await screen.findByRole('listbox')
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(onValueChange).toHaveBeenCalledWith('eur')
  })
})
