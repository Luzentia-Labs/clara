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
/*
 * WHAT THIS GUARD DOES NOT CLOSE, stated so the next reader learns it from the code (BG-01M0XJBW).
 *
 * 1. **A `<ClaraPortal>` in an unreachable branch.** `if (false) { return <ClaraPortal .../> }`
 *    satisfies the render check, against a docblock below claiming "only a JSX element counts,
 *    which is the thing the runtime does" - a JSX element behind a dead branch is not what the
 *    runtime does. The probe as written happens to be refused today, but by the `constant open`
 *    rule rather than by any reachability analysis, so a dead-branch `<ClaraPortal open={state}>`
 *    would pass. Detecting unreachable code in general is undecidable, and recognising only the
 *    literal `if (false)` would be theatre.
 *
 * 2. **Imports out of the component's own directory.** Re-exports and aliases are followed WITHIN
 *    the directory that gets scanned, which is where every measured bypass lived. A component
 *    importing a portal from a shared helper elsewhere in the package would not be seen.
 *
 * Both are denylist limits, not oversights. The list below is the set of escapes that were actually
 * found and measured, which is not the same as proving the contract cannot be escaped.
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

  /*
   * Names bound to a Radix portal, however the author spelled it:
   *   `import { Portal } from '@radix-ui/react-dialog'`       -> "Portal"
   *   `import { Portal as P } from '@radix-ui/react-popover'`  -> "P"
   *   `import * as Dialog from '@radix-ui/react-dialog'`       -> "Dialog" (namespace)
   *   `export { Portal } from '@radix-ui/react-dialog'`        -> re-exported, see below
   *   `const P = Portal`                                       -> aliased
   *
   * SHARED ACROSS THE COMPONENT'S FILES, not per file (BG-01M0XJBW). A re-export in a sibling
   * (`export { Portal } from '@radix-ui/react-dialog'` in `./portal.ts`) put the name in scope for
   * the component while the per-file sets kept it invisible: `portal.ts` learned the binding, and
   * `Modal.tsx` - which imports it relatively, so `isRadix` is false - had its own empty set.
   * Reproduced at PASS rc=0. The component directory is the unit that gets scanned, so it is the
   * unit the bindings belong to.
   */
  const radixLocal = new Set()
  const radixNamespace = new Set()
  /** Names this component's own files re-export from Radix, so a relative import of them binds. */
  const reExported = new Set()

  const sources = files.map((file) => ({
    file,
    source: ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX),
  }))


    /*
     * TWO PASSES: bindings first, then JSX (BG-01M0XJBW).
     *
     * A single walk populated `radixLocal` as it REACHED each import, so anything rendered above
     * its own import was checked against an empty set. Imports are hoisted, so that source is
     * perfectly legal and ran fine - a review measured `PASS rc=0` on a component rendering a Radix
     * portal above its import, with every problem-push intact and the state feeding them empty.
     *
     * The binding pass also traces two indirections the single walk could not:
     *
     *   `export { Portal } from '@radix-ui/react-dialog'`  - a re-export, in the component's own
     *      directory, which IS scanned; `ExportDeclaration` simply was not handled.
     *   `const P = Portal`                                 - an alias bound outside the import.
     *
     * Both were reproduced at `PASS rc=0`. Neither is exotic: the first is what a developer writes
     * to "keep the imports tidy", and the second is what they write to shorten a long name.
     */
    const bindings = (node) => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const from = node.moduleSpecifier.text
        const isRadix = from.startsWith('@radix-ui/')
        const clause = node.importClause
        // `import type { ... }` renders nothing.
        // A RELATIVE import of a name this component re-exports from Radix binds it too. That is
        // the re-export bypass: the Radix specifier is in one file and the render is in another,
        // and neither file alone looks wrong.
        const isLocalReExport = from.startsWith('.')
        if (clause && !clause.isTypeOnly && clause.namedBindings) {
          if (ts.isNamedImports(clause.namedBindings)) {
            for (const el of clause.namedBindings.elements) {
              if (el.isTypeOnly) continue
              const imported = (el.propertyName ?? el.name).text
              if (isLocalReExport && reExported.has(imported)) radixLocal.add(el.name.text)
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

      // A re-export binds the name for anything importing THIS file, and the component's own
      // directory is what gets scanned - so `export { Portal } from '@radix-ui/react-dialog'` in a
      // sibling file put the name in scope with nothing tracing it.
      if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)
        && node.moduleSpecifier.text.startsWith('@radix-ui/') && !node.isTypeOnly
        && node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const el of node.exportClause.elements) {
          if (el.isTypeOnly) continue
          const exported = (el.propertyName ?? el.name).text
          if (/Portal$/.test(exported)) {
            radixLocal.add(el.name.text)
            // Remember it under its EXPORTED name too, so a sibling importing it relatively binds.
            reExported.add(el.name.text)
          }
        }
      }

      // `const P = Portal`, and `const P = Dialog.Portal`.
      if (ts.isVariableDeclaration(node) && node.initializer && ts.isIdentifier(node.name)) {
        const init = node.initializer
        if (ts.isIdentifier(init) && radixLocal.has(init.text)) radixLocal.add(node.name.text)
        if (ts.isPropertyAccessExpression(init) && ts.isIdentifier(init.expression)
          && radixNamespace.has(init.expression.text) && /Portal$/.test(init.name.text)) {
          radixLocal.add(node.name.text)
        }
      }

      ts.forEachChild(node, bindings)
    }
    // Run to FIXPOINT, so a chain (`const A = Portal; const B = A`) is followed however it is
    // ordered. Two passes would catch one link; a chain of three is no harder to write.
  /*
   * To FIXPOINT over EVERY file, not once per file.
   *
   * The re-export bypass spans two files - the Radix specifier in one, the render in another - so a
   * per-file fixpoint still loses whenever the importer happens to be scanned first, which is just
   * filesystem order. Chained aliases (`const A = Portal; const B = A`) need the repetition for the
   * same reason, and are no harder to write than a single one.
   */
  let before = -1
  while (before !== radixLocal.size + radixNamespace.size + reExported.size) {
    before = radixLocal.size + radixNamespace.size + reExported.size
    for (const { source: each } of sources) bindings(each)
  }

  for (const { file, source } of sources) {
    const visit = (node) => {
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
