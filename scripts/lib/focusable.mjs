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
        const named = attrs.some((a) => a.name.getText() === 'tabIndex')
        const isAnchor = tag === 'a' && attrs.some((a) => a.name.getText() === 'href')
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
          }
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(parsed)
  }
  // De-duplicate identical groups, keeping the reading stable.
  const seen = new Set()
  return groups.filter((g) => {
    const key = [...g].sort().join(' ')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
