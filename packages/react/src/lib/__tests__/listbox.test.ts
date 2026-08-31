import { describe, it, expect, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useListbox, type ListboxOption } from '../listbox'

/**
 * The engine's CLOSED branch, tested at the hook rather than through a component.
 *
 * Why this file exists: Select's trigger is a native `<button>`, so jsdom activates it on Enter and
 * Space regardless of what the engine does. Every component-level test of "Enter opens a closed
 * Select" therefore passed with `key === 'Enter'` deleted from the branch below - the key still
 * opened the list, just through native button activation instead. A seat measured that and called
 * the record's "pinned in both directions" claim vacuous in the opening direction, correctly.
 *
 * Calling `triggerProps.onKeyDown` directly removes the native path, so these assertions can only
 * be satisfied by the engine.
 */

const OPTIONS: ListboxOption<string>[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma', disabled: true },
  { value: 'd', label: 'Delta' },
]

interface Harness {
  open?: boolean
  triggerKind?: 'button' | 'textbox'
}

function setup ({ open = false, triggerKind = 'button' }: Harness = {}) {
  const onOpen = vi.fn()
  const onClose = vi.fn()
  const onSelect = vi.fn()
  const { result } = renderHook(() => useListbox<string>({
    options: OPTIONS,
    open,
    onOpen,
    onClose,
    onSelect,
    isSelected: () => false,
    triggerKind,
  }))
  return { result, onOpen, onClose, onSelect }
}

/** A keydown event with only the surface the engine reads. */
const keydown = (key: string) => {
  const preventDefault = vi.fn()
  return {
    event: { key, preventDefault, metaKey: false, ctrlKey: false, altKey: false } as never,
    preventDefault,
  }
}

describe('listbox engine: the keys that OPEN a closed list', () => {
  it.each(['ArrowDown', 'ArrowUp', 'Enter'])(
    '%s opens through the ENGINE, not through native button activation', (key) => {
      const { result, onOpen } = setup()
      const { event, preventDefault } = keydown(key)
      result.current.triggerProps.onKeyDown(event)
      expect(onOpen, `${key} must reach the engine's closed branch`).toHaveBeenCalledTimes(1)
      expect(preventDefault, 'and the key is consumed').toHaveBeenCalled()
    })

  it('Space opens a BUTTON trigger', () => {
    const { result, onOpen } = setup({ triggerKind: 'button' })
    const { event, preventDefault } = keydown(' ')
    result.current.triggerProps.onKeyDown(event)
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(preventDefault).toHaveBeenCalled()
  })

  it('Space does NOT open a TEXTBOX trigger, and is never prevented there', () => {
    // Keydown precedes insertion, so preventing it deletes the user's space. Measured before the
    // fix: typing " Ac" into a closed Combobox produced "Ac".
    const { result, onOpen } = setup({ triggerKind: 'textbox' })
    const { event, preventDefault } = keydown(' ')
    result.current.triggerProps.onKeyDown(event)
    expect(onOpen, 'space is a query character on a textbox').not.toHaveBeenCalled()
    expect(preventDefault, 'and preventing it would eat the character').not.toHaveBeenCalled()
  })

  it.each(['Home', 'End', 'p', 'PageUp', 'PageDown'])(
    'DEVIATION: %s does not open a closed list', (key) => {
      // Recorded in Select's verification.md. These are deviations from the APG's select-only
      // combobox, which opens on all of them. Asserting CURRENT behaviour, so a change to the
      // engine reddens here and forces the record to change with it.
      const { result, onOpen } = setup()
      const { event } = keydown(key)
      result.current.triggerProps.onKeyDown(event)
      expect(onOpen).not.toHaveBeenCalled()
    })
})

/**
 * The closed branch opens on FOUR keys and no others. The `it.each` above pins the four, and the
 * hand-listed deviations pin five that must not - but nothing pinned the word "only", so adding
 * `|| key === 'Tab'` to the branch left both suites green. A closed trigger that swallows Tab
 * strands a keyboard user inside a control they are trying to leave, which is the exact harm the
 * engine's own Tab comment cites, and it would have shipped silently.
 */
describe('listbox engine: the closed branch opens on ONLY those four keys', () => {
  const OPENS = new Set(['ArrowDown', 'ArrowUp', 'Enter', ' '])
  const EVERY_KEY = [
    'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Tab', 'Escape',
    'Home', 'End', 'PageUp', 'PageDown', 'Backspace', 'Delete', 'a', 'p', 'F1',
  ]

  it.each(EVERY_KEY)('%s opens a closed BUTTON trigger only if it is one of the four', (key) => {
    const { result, onOpen } = setup({ triggerKind: 'button' })
    result.current.triggerProps.onKeyDown(keydown(key).event)
    expect(onOpen.mock.calls.length > 0, `${key} should ${OPENS.has(key) ? '' : 'NOT '}open`)
      .toBe(OPENS.has(key))
  })
})

/**
 * The OPEN branch's deviations, at the hook. The component-level pins for these seat the highlight
 * with a `value` prop; here it is set directly, which removes any doubt about where it started.
 */
describe('listbox engine: PageUp and PageDown do nothing while OPEN', () => {
  it.each(['PageUp', 'PageDown'])('%s leaves the highlight where it was', (key) => {
    const { result } = setup({ open: true })
    // Seat on index 1 of four. Seating on an end would let `move`'s no-wrap clamp stand in for
    // "the key does nothing", which is how the component-level PageUp pin was vacuous.
    act(() => { result.current.setActiveIndex(1) })
    expect(result.current.activeIndex).toBe(1)
    act(() => { result.current.triggerProps.onKeyDown(keydown(key).event) })
    expect(result.current.activeIndex, 'a deviation: neither key is handled').toBe(1)
  })
})
