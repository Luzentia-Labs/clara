/**
 * The class names of every element Clara renders that is focusable by virtue of what it IS.
 *
 * Read from the components' own JSX with TypeScript's parser, never from a hand-written list. A
 * hand-maintained list cannot notice an element nobody remembered to add, and that is not
 * hypothetical: `.clara-link` renders an `<a href>`, shipped for a whole epic with no focus ring,
 * and the list plus an accepted decision both claimed the indicator covered every focusable thing.
 * This is the same rule as D0051 and D0067 - a category comes from what a thing is, not its name.
 *
 * Focusable here means the element the browser will put in the tab order without help: an anchor
 * with an href, a button, an input, a select, a textarea, or anything given an explicit tabIndex.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const NATURALLY_FOCUSABLE = new Set(['a', 'button', 'input', 'select', 'textarea'])

/** Every `.tsx` under a directory, tests and type-tests excluded. */
function sources (dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry !== '__tests__') sources(full, out)
      continue
    }
    if (entry.endsWith('.tsx') && !entry.includes('.test.') && !entry.includes('.type-test.')) out.push(full)
  }
  return out
}

/**
 * The literal class names on focusable JSX elements. Only literals: a class built at runtime cannot
 * be resolved statically, and guessing at one would put a name in the list that no rule can match.
 * `cx('clara-input', ...)` is read, because that is how every component in this repo spells it.
 */
export function focusableClassGroups (root = 'packages/react/src') {
  const groups = []
  const unresolved = []

  const literalsIn = (node) => {
    const out = []
    if (ts.isStringLiteral(node)) out.push(node.text)
    else if (ts.isCallExpression(node)) for (const arg of node.arguments) out.push(...literalsIn(arg))
    else if (ts.isJsxExpression(node) && node.expression) out.push(...literalsIn(node.expression))
    else if (ts.isBinaryExpression(node)) { out.push(...literalsIn(node.left)); out.push(...literalsIn(node.right)) }
    else if (ts.isTemplateExpression(node)) { /* runtime-built: not resolvable, deliberately skipped */ }
    return out
  }

  for (const file of sources(root)) {
    const text = readFileSync(file, 'utf8')
    const parsed = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

    /**
     * Polymorphic components render `<Component>` where `Component = (as ?? 'button')`, so the tag
     * in the JSX is a local identifier and the element's real nature is one line above. Without
     * this, Button - the most-used control in the library - is invisible to this reader, and its
     * focus ring could be deleted with nothing noticing.
     */
    const polymorphic = new Map()
    const collectPolymorphic = (node) => {
      if (ts.isVariableDeclaration(node) && node.initializer && node.name.getText()) {
        const init = node.initializer.getText()
        const m = /\bas\s*\?\?\s*'([a-z]+)'/.exec(init)
        if (m && NATURALLY_FOCUSABLE.has(m[1])) polymorphic.set(node.name.getText(), m[1])
      }
      ts.forEachChild(node, collectPolymorphic)
    }
    collectPolymorphic(parsed)

    const visit = (node) => {
      const opening = ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node) ? node : null
      if (opening) {
        const tag = opening.tagName.getText()
        const attrs = opening.attributes.properties.filter(ts.isJsxAttribute)
        const spreads = opening.attributes.properties.filter(ts.isJsxSpreadAttribute)
        /**
         * A prop can arrive through a SPREAD, and that is not an edge case - `Text` delivers its
         * `tabIndex` as `{...recoverable}`, so a reader matching only named attributes declared it
         * non-focusable and `.clara-text--truncate` shipped with no focus ring. The spread's
         * identifier is resolved back to its declaration in the same file, which is how every
         * component here spells it.
         */
        const spreadCarries = (prop) => spreads.some((sp) => {
          const name = sp.expression.getText()
          const decl = new RegExp(`\\b${name}\\s*=([\\s\\S]{0,400})`).exec(text)
          return decl ? new RegExp(`\\b${prop}\\b`).test(decl[1]) : false
        })
        const named = attrs.some((a) => a.name.getText() === 'tabIndex') || spreadCarries('tabIndex')
        const isAnchor = tag === 'a' && (attrs.some((a) => a.name.getText() === 'href') || spreadCarries('href'))
        const viaAs = polymorphic.get(tag)
        if (named || isAnchor || viaAs || (NATURALLY_FOCUSABLE.has(tag) && tag !== 'a')) {
          const cls = attrs.find((a) => a.name.getText() === 'className')
          if (cls?.initializer) {
            // One GROUP per element, not one name per class. A textarea renders
            // `cx('clara-input', 'clara-textarea')` and is covered by the ring on `.clara-input`;
            // demanding one for every class name on it would be a false failure.
            const group = []
            for (const name of literalsIn(cls.initializer)) {
              for (const part of name.split(/\s+/)) {
                // Modifiers share their base rule's ring, so they are not separate obligations.
                if (part.startsWith('clara-') && !part.includes('--')) group.push(`.${part}`)
              }
            }
            if (group.length) groups.push(group)
            // A focusable element with no resolvable class name is a BLIND SPOT, not a pass: it
            // cannot be checked, and silently skipping it is how one goes unnoticed. Reported so it
            // is loud - `TableSortButton` renders a class-less <button> and was dropped in silence.
            else unresolved.push({ where: `${file.split('/').slice(-2).join('/')}:<${tag}>`, file })
          } else {
            unresolved.push({ where: `${file.split('/').slice(-2).join('/')}:<${tag}>`, file })
          }
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(parsed)
  }
  // De-duplicate identical groups, keeping the reading stable.
  const seen = new Set()
  const result = groups.filter((g) => {
    const key = [...g].sort().join(' ')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  // Attached to the RETURNED array. Setting it on `groups` first lost it, because `filter` returns
  // a fresh array - a blind spot reported onto an object nobody reads is not reported at all.
  // Carries the FILE, so a caller can attribute it with the same reader that decides ownership.
  // Deriving the component from the filename put `Field/index.tsx` outside `--component Field`.
  const seenUnresolved = new Set()
  result.unresolved = unresolved.filter((u) => {
    if (seenUnresolved.has(u.where)) return false
    seenUnresolved.add(u.where)
    return true
  })
  return result
}

/**
 * Every Clara class name a component's own source mentions, keyed by component.
 *
 * `--component NumberInput` derived its scope from the NAME - `.clara-number-input` - which matches
 * nothing: the real selectors are `.clara-number` and `.clara-input`. PasswordInput and SearchInput
 * were the same, so three acceptance criteria named a verifier that could not fail on their own
 * component, which is precisely what scoping was added to prevent. It is the category-from-a-name
 * failure (D0051, D0067, D0074) inside the fix for a different instance of it.
 *
 * Read from the JSX instead: what a component owns is what it renders.
 */
export function claraClassesByComponent (root = 'packages/react/src') {
  const owned = new Map()
  for (const file of sources(root)) {
    const parsed = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const component = file.split('/').pop().replace(/\.tsx$/, '')
    const names = owned.get(component) ?? new Set()
    const visit = (node) => {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        for (const part of node.text.split(/\s+/)) {
          if (part.startsWith('clara-')) names.add(`.${part.split('--')[0]}`)
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(parsed)
    if (names.size) owned.set(component, names)
  }
  return owned
}
