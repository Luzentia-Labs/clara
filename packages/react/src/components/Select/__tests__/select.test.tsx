import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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

// Added by the D0121-D0124 repair round. Every case here pins a mechanism a review seat proved
// could be deleted with the whole suite still green - which in this project means it was unbuilt,
// however correct it looked.
describe('Select option state model and keyboard gaps', () => {
  it('marks the SELECTED choice with a visible carrier, not only aria-selected', async () => {
    // Deleting the `--selected` class or the check glyph must redden this. Before D0124 there was
    // no rule and no glyph at all, so a sighted user could not tell their own choice from any
    // other option while a screen reader was told plainly.
    await renderOpen({ defaultValue: 'eur' })
    const chosen = screen.getByRole('option', { name: /Euro/ })
    expect(chosen).toHaveAttribute('aria-selected', 'true')
    expect(chosen.querySelector('.clara-select__check'), 'the CHOICE carries a visible glyph')
      .toBeTruthy()
    const other = screen.getByRole('option', { name: /Pound sterling/ })
    expect(other.querySelector('.clara-select__check')).toBeNull()
  })

  it('separates the CURSOR from the CHOICE - they are different facts', async () => {
    // The engine's own comment insists on this and nothing asserted it. Open on the selected
    // option, then arrow away: the choice must stay marked where it is.
    // The cursor MUST be moved off the choice first. At open they coincide, so a test that
    // asserts before moving cannot tell a glyph bound to the CHOICE from one bound to the CURSOR -
    // which is exactly how rebinding it to `activeIndex` passed the whole suite.
    await renderOpen({ defaultValue: 'eur' })
    await userEvent.keyboard('{ArrowDown}')
    const chosen = screen.getByRole('option', { name: /Euro/ })
    const cursor = screen.getByRole('option', { name: /Swedish krona/ })
    expect(chosen.querySelector('.clara-select__check'),
      'the glyph stays with the CHOICE after the cursor moves away').toBeTruthy()
    expect(cursor.querySelector('.clara-select__check'),
      'and never follows the cursor').toBeNull()
    expect(cursor.className).toContain('clara-select__option--active')
    expect(chosen.className).not.toContain('clara-select__option--active')
  })

  it('commits on Space while OPEN and closes, per the APG (D0123)', async () => {
    // Space used to fall through to the typeahead default, which prevented the key and then
    // searched for a label beginning with a space - silently inert on a key Select itself teaches,
    // because Space is one of the keys that OPENS the list.
    const onValueChange = vi.fn()
    await renderOpen({ onValueChange })
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard(' ')
    expect(onValueChange, 'Space selects').toHaveBeenCalledWith('eur')
    await waitFor(() => expect(screen.queryByRole('listbox'), 'and closes').toBeNull())
  })

  it('cycles typeahead on a repeated character rather than searching for the repeat', async () => {
    // `const cycling = ...` in the engine deletes clean against the whole suite (measured), while
    // the behaviour is stated in the keyboard table. Pressing "s" twice must reach the SECOND
    // option starting with s, not search for "ss" and find nothing.
    // Needs two enabled options sharing a first letter, or there is nothing to cycle THROUGH.
    const trigger = await renderOpen({ options: [
      { value: 'eur', label: 'Euro' },
      { value: 'egp', label: 'Egyptian pound' },
      { value: 'gbp', label: 'Pound sterling' },
    ] })
    await userEvent.keyboard('e')
    const first = trigger.getAttribute('aria-activedescendant')
    await userEvent.keyboard('e')
    const second = trigger.getAttribute('aria-activedescendant')
    expect(first).toBeTruthy()
    // Without the cycling branch the buffer grows to "ee", nothing starts with it, and the
    // highlight never moves - so this is the assertion that kills that mutant.
    expect(second, 'a repeated key moves to the NEXT match rather than searching for "ee"')
      .not.toBe(first)
    expect(document.getElementById(first!)?.textContent).toMatch(/Euro|Egyptian pound/)
    expect(document.getElementById(second!)?.textContent).toMatch(/Euro|Egyptian pound/)
  })

  it('leaves a modified printable key to the browser', async () => {
    // Dropping the metaKey/ctrlKey/altKey exclusion deletes clean, and then the preventDefault on
    // the typeahead branch swallows Ctrl+F and Cmd+A - a browser shortcut a user expects to work.
    const trigger = await renderOpen()
    const before = trigger.getAttribute('aria-activedescendant')
    await userEvent.keyboard('{Control>}s{/Control}')
    expect(trigger.getAttribute('aria-activedescendant'),
      'a modified key is not typeahead and must not move the highlight').toBe(before)
  })
})

// jsdom applies no stylesheet, resolves no `var()` and computes no layout, so the only way a test
// can see the cursor's SECOND CHANNEL is to read the asset. Without this the criterion's Touches
// names a file its own verifier never loads, which check-story-verifiers refuses - correctly.
describe('Select stylesheets select on the option state model', () => {
  const css = readFileSync(resolve(__dirname, '../../../styles.css'), 'utf8')
  const block = (selector: string) => {
    const at = css.indexOf(selector + ' {')
    expect(at, `${selector} has no rule`).toBeGreaterThan(-1)
    return css.slice(at, css.indexOf('}', at))
  }

  it('gives the CURSOR a non-colour carrier beside its tint', () => {
    const rule = block('.clara-select__option--active')
    expect(rule, 'the tint alone is 1.14:1 light and 2.28:1 dark').toContain('background:')
    expect(rule, 'and the inset bar is what clears 3:1').toContain('box-shadow: inset')
  })

  it('gives the CHOICE glyph its own colour, so it cannot collapse into the option text', () => {
    expect(block('.clara-select__check')).toContain('color:')
  })
})

// AC8's Touches names the token source, so the verifier has to READ it - a vitest case cannot see
// a change to an asset it never loads, which check-story-verifiers refuses. Both the source and the
// build, for the reason Combobox records: reading only the build lets a stale dist certify a source
// that moved, and reading only the source proves nothing about what ships.
describe('Select option state tokens are pinned at both ends', () => {
  const src = JSON.parse(readFileSync(
    resolve(__dirname, '../../../../../tokens/src/component/select.json'), 'utf8'))
  const built = readFileSync(
    resolve(__dirname, '../../../../../tokens/dist/tokens.css'), 'utf8')

  it('declares the cursor and the check against accent roles in the SOURCE', () => {
    // Both were repointable with every gate green until round 3 enrolled their real adjacencies:
    // the bar sits on the active row's TINT, and the glyph is the choice's only carrier.
    expect(src.select['option-cursor'].value).toBe('{color.bg.accent-emphasis}')
    expect(src.select['option-check-fg'].value).toBe('{color.fg.accent}')
  })

  it('and emits them in the BUILD, so a stale dist cannot certify the source', () => {
    for (const [token, expected] of [
      ['select-option-cursor', 'var(--clara-color-bg-accent-emphasis)'],
      ['select-option-check-fg', 'var(--clara-color-fg-accent)'],
    ] as const) {
      const decl = built.match(new RegExp(`--clara-${token}:\\s*([^;]+);`))?.[1]?.trim()
      expect(decl, `${token} is emitted`).toBeTruthy()
      expect(decl).toBe(expected)
    }
  })
})

// The four APG deviations, pinned. The verification record claimed TWO and four exist, which two
// seats caught independently - a record that asserts a count nothing checks drifts silently, and
// this one told a reader that End works. These cases assert CURRENT behaviour, so they redden if
// the behaviour changes without the record changing with it, in either direction.
describe('Select APG deviations are recorded and pinned', () => {
  const opens = async (key: string) => {
    render(<Select options={OPTIONS} />)
    screen.getByRole('combobox').focus()
    await userEvent.keyboard(key)
    return screen.queryByRole('listbox') !== null
  }

  it.each([
    ['ArrowDown', '{ArrowDown}'],
    ['ArrowUp', '{ArrowUp}'],
    ['Enter', '{Enter}'],
    ['Space', ' '],
  ])('opens a closed Select on %s, as the APG requires', async (_name, key) => {
    expect(await opens(key)).toBe(true)
  })

  it.each([
    ['Home', '{Home}'],
    ['End', '{End}'],
    ['a printable character', 'p'],
  ])('DEVIATION: %s does not open a closed Select', async (_name, key) => {
    // The APG's select-only combobox lists all three as opening keys. The engine's closed branch
    // handles ArrowDown, ArrowUp, Enter and button-Space only.
    expect(await opens(key)).toBe(false)
  })

  it('DEVIATION: Alt+ArrowUp does not commit and close an open Select', async () => {
    // The APG has Alt+Up commit the highlight and close. Here it falls through to the plain
    // ArrowUp case and just moves the highlight.
    const onValueChange = vi.fn()
    await renderOpen({ onValueChange })
    await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}')
    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.queryByRole('listbox')).not.toBeNull()
  })
})
