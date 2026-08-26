/**
 * An overlay must USE the mechanisms US-01M0GM61 built for it.
 *
 * That story headlines "one portal mechanism" and "the scoping problem is solved once in the
 * architecture rather than nine times in props", and nothing bound any overlay to it. `Modal` uses
 * `ClaraPortal` because `Modal` was written by somebody who had read the story; the other eleven
 * could each reach for a Radix portal and get no scope attributes, no open-order host and no layer
 * token, with every gate green. That is verbatim D0087's own rationale about the z-index scale -
 * "a scale nothing obliges a component to use is exactly the defect the story exists to prevent."
 *
 * **This file was rewritten after review (US-01M0GM61 round 7).** Its first version matched text:
 * a regex over the stylesheet for `.clara-<name>[^{]*\{[^}]*\}`, and `\bClaraPortal\b` over the
 * source. Every one of those was defeated, and the reviewer defeated them:
 *
 *   - `[^{]*` crosses `}` and comment boundaries, so ANY textual mention of a class bound the NEXT
 *     rule's block to that component. A Drawer with no stylesheet rule at all passed, because a
 *     comment above `.clara-modal__scrim` mentioned `.clara-drawer`.
 *   - `\bClaraPortal\b` was satisfied by `// TODO: move this to ClaraPortal`, and by a type-only
 *     or unused import.
 *   - `\b(\w+)\.Portal\b` missed `import { Portal } from '@radix-ui/react-dialog'` entirely - the
 *     destructured form, which is the idiom an author actually reaches for - and FAILED the build
 *     on the comment "Deliberately NOT Dialog.Portal", which is the comment a careful author
 *     writes. This file's own docblock would have tripped it.
 *
 * So it parses. D0067 records this lesson for this repo already: a hand-rolled parser was the tenth
 * in the codebase and was replaced with the PostCSS imported ten lines away. Both parsers are
 * already dependencies here.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import postcss from 'postcss'
import selectorParser from 'postcss-selector-parser'
import ts from 'typescript'
import { fail, pass } from './lib/workspace.mjs'

const RULE = 'overlay-contract'
const root = process.cwd()
const problems = []

const classification = JSON.parse(readFileSync(join(root, 'packages/react/client-boundary.json'), 'utf8'))
const overlays = classification.components.filter((c) => c.overlay === true)
const built = overlays.filter((c) => c.status === 'built')

// A guard that enumerates nothing passes for the wrong reason, so both halves are checked.
if (!overlays.length) problems.push('client-boundary.json flags no component `overlay: true` - this guard would be vacuous')
if (!built.length) problems.push('no flagged overlay is built yet, so this guard checks nothing - it must not report success')

/** `DropdownMenu` -> `clara-dropdown-menu`. */
const classBase = (name) => `clara-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`

/** Every source file belonging to one component, minus its tests and stories. */
const sourcesFor = (name) => {
  const dir = join(root, 'packages/react/src/components', name)
  if (!existsSync(dir)) return []
  const walk = (p) => statSync(p).isDirectory()
    ? readdirSync(p).flatMap((e) => (e === '__tests__' ? [] : walk(join(p, e))))
    : [p]
  return walk(dir).filter((f) => (f.endsWith('.tsx') || f.endsWith('.ts')) && !f.endsWith('.stories.tsx'))
}

/**
 * What a component's source actually RENDERS, read from the syntax tree.
 *
 * A comment is not a render. An unused import is not a render. A type-only import is not a render.
 * Only a JSX element counts, which is the thing the runtime does.
 */
function portalUsage (files) {
  const usage = { rendersClaraPortal: false, radixPortals: new Set(), constantOpen: [] }

  for (const file of files) {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

    // Local names bound to a Radix portal, however the author spelled the import:
    //   `import { Portal } from '@radix-ui/react-dialog'`      -> "Portal"
    //   `import { Portal as P } from '@radix-ui/react-popover'` -> "P"
    //   `import * as Dialog from '@radix-ui/react-dialog'`      -> "Dialog" (namespace)
    const radixLocal = new Set()
    const radixNamespace = new Set()

    const visit = (node) => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const from = node.moduleSpecifier.text
        const isRadix = from.startsWith('@radix-ui/')
        const clause = node.importClause
        // `import type { ... }` renders nothing.
        if (clause && !clause.isTypeOnly && clause.namedBindings) {
          if (ts.isNamedImports(clause.namedBindings)) {
            for (const el of clause.namedBindings.elements) {
              if (el.isTypeOnly) continue
              const imported = (el.propertyName ?? el.name).text
              // `/Portal$/`, not `=== 'Portal'`. Radix exports every primitive under BOTH names -
              // `Portal` and `DialogPortal` are both first-class exports of
              // @radix-ui/react-dialog, and `DialogPortal` is the one an editor's auto-import
              // offers. Matching only the bare name caught half the idiom the docblock calls "the
              // one an author actually reaches for" (round 8).
              if (isRadix && /Portal$/.test(imported)) radixLocal.add(el.name.text)
            }
          } else if (ts.isNamespaceImport(clause.namedBindings) && isRadix) {
            radixNamespace.add(clause.namedBindings.name.text)
          }
        }
      }

      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = node.tagName
        if (ts.isIdentifier(tag)) {
          if (tag.text === 'ClaraPortal') {
            usage.rendersClaraPortal = true
            /*
             * The `open` prop must carry STATE, not a constant.
             *
             * ClaraPortal appends its host at the moment its surface opens, and that append order
             * IS the open-order stacking mechanism D0102 rests on: tooltip and toast share one
             * layer, so whichever opened last paints on top. `<ClaraPortal open>` - a bare
             * attribute, or `open={true}` - freezes the host at MOUNT order instead, and the
             * relationship the shared layer exists to express stops holding.
             *
             * This is not hypothetical. Tooltip shipped with a literal `open` while every sibling
             * passed state, and a review measured a tooltip opened over a live toast painting
             * UNDERNEATH it in Chromium - the exact outcome D0102 exists to prevent. Both AC7 e2e
             * assertions were green throughout, because in both of them the tooltip's host happens
             * to be created first anyway, so mount order and open order agree.
             *
             * A bare `<ClaraPortal open>` and `open={true}` are the same thing to the parser and
             * both are refused. An omitted `open` is refused too: the default is not this guard's
             * to assume, and an overlay that never says when it opens has the same defect.
             */
            const attrs = node.attributes.properties
            const openAttr = attrs.find((a) => ts.isJsxAttribute(a) && a.name.getText() === 'open')
            const initializer = openAttr && ts.isJsxAttribute(openAttr) ? openAttr.initializer : undefined
            const isConstant =
              !openAttr ||
              initializer === undefined ||
              (initializer && ts.isJsxExpression(initializer) && initializer.expression &&
                (initializer.expression.kind === ts.SyntaxKind.TrueKeyword ||
                 initializer.expression.kind === ts.SyntaxKind.FalseKeyword))
            if (isConstant) usage.constantOpen.push(relative(root, file))
          }
          if (radixLocal.has(tag.text)) usage.radixPortals.add(tag.text)
        } else if (ts.isPropertyAccessExpression(tag)) {
          // `<Dialog.Portal>` - only when `Dialog` really is a Radix namespace import.
          const object = tag.expression
          if (ts.isIdentifier(object) && radixNamespace.has(object.text) && tag.name.text === 'Portal') {
            usage.radixPortals.add(`${object.text}.Portal`)
          }
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
  return usage
}

/**
 * The rules whose selector really targets this component, found by parsing the selector rather
 * than by matching its text. A mention inside a comment is not a rule, and a rule's block ends at
 * its own closing brace.
 */
function rulesFor (stylesheet, base) {
  const found = []
  postcss.parse(stylesheet).walkRules((rule) => {
    let hit = false
    for (const selector of rule.selectors) {
      try {
        selectorParser((nodes) => {
          nodes.walkClasses((cls) => {
            if (cls.value === base || cls.value.startsWith(`${base}__`) || cls.value.startsWith(`${base}--`)) hit = true
          })
        }).processSync(selector)
      } catch {
        // An unparseable selector is not this guard's to diagnose; check-component-css owns that.
      }
    }
    if (hit) found.push(rule)
  })
  return found
}

const stylesheet = readFileSync(join(root, 'packages/react/src/styles.css'), 'utf8')

for (const { name } of built) {
  const files = sourcesFor(name)
  const where = relative(root, join('packages/react/src/components', name))
  if (!files.length) {
    problems.push(`${where}: ${name} is classified as a built overlay but has no source directory`)
    continue
  }

  const { rendersClaraPortal, radixPortals, constantOpen } = portalUsage(files)

  if (!rendersClaraPortal) {
    problems.push(
      `${where}: ${name} is an overlay and renders no <ClaraPortal> - a portal that does not carry ` +
      'the scope drops a dark subtree back to the page theme (TRD ADR-006). An import or a comment ' +
      'is not a render; this is read from the syntax tree',
    )
  }
  for (const tag of radixPortals) {
    problems.push(
      `${where}: ${name} renders <${tag}>, a Radix portal - it drops its content on document.body ` +
      'with no `data-clara-*`, so the scope stops at the trigger. Use ClaraPortal',
    )
  }

  for (const file of constantOpen) {
    problems.push(
      `${where}: ${name} renders ClaraPortal with a CONSTANT \`open\`, in ${file}. The host is ` +
      'appended when the surface OPENS, and that append order is the open-order stacking D0102 ' +
      'rests on - two surfaces sharing one layer are separated by which opened last, and nothing ' +
      'else. A literal freezes the host at MOUNT order, so the relationship stops holding while ' +
      'every stacking test that happens to mount in the same order stays green. Pass the state ' +
      'that drives the surface',
    )
  }

  const rules = rulesFor(stylesheet, classBase(name))
  // The layer token must be declared UNCONDITIONALLY. `walkRules` descends into at-rules, so an
  // overlay whose only layer token sat inside `@media print` satisfied this while stacking on
  // `auto` on screen - the identical media-query evasion `check-component-css` already carries a
  // dedicated prove entry for at a neighbouring joint, walked into again (round 8).
  // The FULL ancestor chain, not the immediate parent. Reading one level meant
  // `@media print { @layer clara.components { .clara-modal { z-index: ... } } }` was classified
  // unconditional and passed, which is literally the shape AC8 enumerates - the fix for the
  // one-level evasion had the same hole one level deeper (round 9).
  //
  // `@layer` and `@supports` are not conditional in the sense that matters: a layer always applies,
  // and refusing `@supports` would break the cascade-layer contract D0005 requires.
  const conditional = (node) => {
    for (let at = node.parent; at; at = at.parent) {
      if (at.type === 'atrule' && !/^(layer|supports)$/i.test(at.name)) return true
    }
    return false
  }
  const unconditional = rules.filter((rule) => !conditional(rule))
  if (!rules.length) {
    problems.push(`${where}: ${name} is an overlay with no stylesheet rule of its own, so it can carry no layer token`)
  } else if (!unconditional.some((rule) => rule.some?.((decl) =>
    decl.type === 'decl' && decl.prop === 'z-index' && /var\(\s*--clara-layer-/.test(decl.value)))) {
    problems.push(
      `${where}: ${name} is an overlay and no rule of its own takes \`z-index\` from a layer token. ` +
      'A surface nobody gave a z-index gets `auto`, and the z-index rule is a denylist against ' +
      'hand-typed numbers, so declaring nothing passes it (D0087). A token inside a conditional ' +
      'at-rule such as `@media print` does not count - it leaves the surface on `auto` on screen',
    )
  }
}

if (problems.length) fail(RULE, problems)
pass(RULE, `${built.length} built overlay(s) of ${overlays.length} flagged: each RENDERS ClaraPortal and takes its stacking from a layer token`)
