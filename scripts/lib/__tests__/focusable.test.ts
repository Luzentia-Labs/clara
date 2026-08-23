import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
// @ts-expect-error - .mjs guard library, deliberately untyped (it runs under plain node too)
import { focusableClassGroups, claraClassesByComponent } from '../focusable.mjs'

/**
 * The reader that decides which Clara classes must carry a focus ring.
 *
 * It exists because the hand-written list it replaced could not notice an element nobody
 * remembered to type into it - `.clara-link` shipped a whole epic with no ring while both a code
 * comment and an accepted decision claimed the indicator covered everything. So the cases that
 * matter here are the ones a naive reader gets wrong: a polymorphic component, an element that is
 * focusable only because of an explicit tabIndex, and a class list built at runtime.
 */
let dir: string

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'clara-focusable-'))
  const write = (name: string, source: string) => {
    mkdirSync(join(dir, 'components'), { recursive: true })
    writeFileSync(join(dir, 'components', name), source)
  }

  write('Plain.tsx', `
    export function Plain () {
      return <div className="clara-plain"><span className="clara-plain__text">x</span></div>
    }
  `)
  write('Native.tsx', `
    export function Native () {
      return <><input className="clara-native" /><textarea className={cx('clara-native', 'clara-native-area')} /></>
    }
  `)
  write('Anchor.tsx', `
    export function Anchor ({ href }) {
      return <><a href={href} className="clara-anchor">go</a><a className="clara-no-href">x</a></>
    }
  `)
  write('Poly.tsx', `
    export function Poly ({ as }) {
      const Component = (as ?? 'button')
      return <Component className={cx('clara-poly', \`clara-poly--\${size}\`)}>x</Component>
    }
  `)
  write('Tabbable.tsx', `
    export function Tabbable () {
      return <div tabIndex={0} className="clara-tabbable">x</div>
    }
  `)
  write('Spread.tsx', `
    export function Spread () {
      const recoverable = { tabIndex: 0, title: 'x' }
      return <span {...recoverable} className="clara-spread">x</span>
    }
  `)
  write('SpreadHref.tsx', `
    export function SpreadHref ({ to }) {
      const link = { href: to }
      return <a {...link} className="clara-spread-href">go</a>
    }
  `)
  write('Runtime.tsx', `
    export function Runtime ({ variant }) {
      return <button className={\`clara-runtime--\${variant}\`}>x</button>
    }
  `)
})

afterAll(() => rmSync(dir, { recursive: true, force: true }))

const groups = () => focusableClassGroups(dir).map((g: string[]) => g.join(' + '))

describe('focusableClassGroups', () => {
  it('ignores an element that is not focusable', () => {
    expect(groups()).not.toContain('.clara-plain')
    expect(groups().join(' ')).not.toContain('clara-plain__text')
  })

  it('finds natively focusable elements', () => {
    expect(groups()).toContain('.clara-native')
  })

  it('groups an element by ALL its class names, so one ring can cover it', () => {
    // A textarea renders `cx('clara-input', 'clara-textarea')` and takes its indicator from the
    // first. Demanding a ring for every class name on it would be a false failure.
    expect(groups()).toContain('.clara-native + .clara-native-area')
  })

  it('requires an href before treating an anchor as focusable', () => {
    // An `<a>` with no href is not in the tab order, and demanding a ring for it would be noise.
    expect(groups()).toContain('.clara-anchor')
    expect(groups()).not.toContain('.clara-no-href')
  })

  it('sees a polymorphic component through the `as ?? tag` idiom', () => {
    // Button renders `<Component>` where Component is `as ?? 'button'`. A reader that only looks at
    // the JSX tag misses the most-used control in the library.
    expect(groups()).toContain('.clara-poly')
  })

  it('excludes modifiers, which share their base rule', () => {
    expect(groups().join(' ')).not.toContain('--')
  })

  it('sees an element focusable only by an explicit tabIndex', () => {
    expect(groups()).toContain('.clara-tabbable')
  })

  it('skips a class list built at runtime rather than guessing at it', () => {
    // A template literal cannot be resolved statically. Guessing would put a name in the list that
    // no CSS rule can ever match, turning the guard into a permanent false failure.
    expect(groups().join(' ')).not.toContain('clara-runtime')
  })

  it('sees a tabIndex delivered through a SPREAD', () => {
    // `Text` spreads its tabIndex, so a reader matching only named attributes declared it
    // non-focusable - and it shipped with no focus ring, which is the `.clara-link` defect of one
    // round earlier arriving by a different idiom.
    expect(groups()).toContain('.clara-spread')
  })

  it('sees an href delivered through a spread', () => {
    expect(groups()).toContain('.clara-spread-href')
  })

  it('reports a focusable element with no resolvable class as a BLIND SPOT', () => {
    // Silently skipping one is how it goes unnoticed - `TableSortButton` rendered a class-less
    // <button> and was dropped without a word.
    const result = focusableClassGroups(dir)
    // Each entry carries its FILE as well as a label, so a caller can attribute it with the same
    // reader that decides ownership - deriving the component from the filename put a class-less
    // element in `Field/index.tsx` outside `--component Field`.
    const blind = result.unresolved.map((u: { where: string, file: string }) => u.where).join(' ')
    expect(blind).toContain('Runtime.tsx:<button>')
    expect(result.unresolved.every((u: { file: string }) => u.file.endsWith('.tsx'))).toBe(true)
  })

  it('returns a stable, de-duplicated list', () => {
    // Two elements with the same class list are one obligation, not two.
    expect(groups()).toEqual([...new Set(groups())])
  })

  // Deliberately NOT asserted here: that the REAL component tree yields `.clara-link` and
  // `.clara-button`. That is an integration fact about this repo, and `check-component-css.mjs`
  // already proves it against the real tree - a mutation in `prove-guards-fail.mjs` removes Link's
  // ring and watches the guard fail. Asserting it in a unit test also broke the mutation runner,
  // whose sandbox contains only a subset of the sources, which is a legitimate difference rather
  // than a defect: a unit test for a reader should depend on its fixtures, not on the repo.
})

describe('claraClassesByComponent', () => {
  // The mechanism that scopes `--component`. Deriving the selector from the NAME was a Critical -
  // kebab(NumberInput) is `.clara-number-input`, which matches nothing - and the fix for it had no
  // witness of its own, so reverting to the broken version was invisible to every gate.
  it('returns what a component RENDERS, not what its name suggests', () => {
    const owned = claraClassesByComponent(dir)
    expect([...owned.get('Native')]).toContain('.clara-native')
    expect([...owned.get('Native')]).toContain('.clara-native-area')
  })

  it('strips modifiers down to the base rule that owns them', () => {
    const owned = claraClassesByComponent(dir)
    expect([...owned.get('Poly')]).toContain('.clara-poly')
    expect([...owned.get('Poly')].join(' ')).not.toContain('--')
  })

  it('knows nothing about a component that does not exist', () => {
    // An empty scope passes on everything, which is how a typo turns an AC into nothing at all.
    expect(claraClassesByComponent(dir).has('Bogus')).toBe(false)
  })

  it('does not attribute a class to a component that never renders it', () => {
    const owned = claraClassesByComponent(dir)
    expect([...(owned.get('Plain') ?? [])]).not.toContain('.clara-native')
  })
})
