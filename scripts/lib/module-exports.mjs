/**
 * What a module exports, read with TypeScript's own parser.
 *
 * This replaces a regex that was the NINTH hand-rolled parser in this repo, and it was defeated
 * the way all the others were - by ordinary input it did not anticipate:
 *
 *   const Switch = (props) => { ... }
 *   export default Switch
 *
 * That is the most common React idiom there is. The regex saw no definition, so the chunk planner
 * dropped the component into the undirectived shared chunk and every guard reported PASS. A
 * `"use client"` component shipped unmarked, which is the exact server-render crash the whole
 * boundary mechanism exists to prevent.
 *
 * TypeScript is already a dependency of every package here. There was never a reason to guess.
 */
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const parse = (source, fileName = 'module.tsx') =>
  ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

const isExported = (node) =>
  node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false

const isDefault = (node) =>
  node.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword) ?? false

/**
 * Value exports this module DEFINES, with whether each is function-like.
 *
 * Types and interfaces are excluded: they carry no runtime code, so they can never be the thing
 * that needs a directive. A re-export (`export { X } from './y'`) is excluded too - it forwards
 * rather than defines, and counting it would place every component in the barrel's chunk.
 */
export function moduleExports (source, fileName) {
  const file = parse(source, fileName)
  const locals = new Map()
  const out = []
  const add = (name, functionLike) => {
    if (name && !out.some((e) => e.name === name)) out.push({ name, functionLike })
  }

  // First pass: remember local declarations so `export default Switch` can be resolved.
  for (const node of file.statements) {
    if (ts.isFunctionDeclaration(node) && node.name) locals.set(node.name.text, true)
    else if (ts.isClassDeclaration(node) && node.name) locals.set(node.name.text, true)
    else if (ts.isVariableStatement(node)) {
      for (const d of node.declarationList.declarations) {
        if (ts.isIdentifier(d.name)) locals.set(d.name.text, isFunctionLikeInitializer(d.initializer))
      }
    }
  }

  for (const node of file.statements) {
    if (ts.isFunctionDeclaration(node) && isExported(node)) {
      add(node.name?.text ?? (isDefault(node) ? 'default' : null), true)
    } else if (ts.isClassDeclaration(node) && isExported(node)) {
      add(node.name?.text ?? null, true)
    } else if (ts.isVariableStatement(node) && isExported(node)) {
      for (const d of node.declarationList.declarations) {
        if (ts.isIdentifier(d.name)) add(d.name.text, isFunctionLikeInitializer(d.initializer))
      }
    } else if (ts.isExportAssignment(node) && !node.isExportEquals) {
      // `export default X` - the shape the regex could not see. Resolved back to its declaration
      // so the component is named rather than reported as an anonymous "default".
      if (ts.isIdentifier(node.expression)) {
        add(node.expression.text, locals.get(node.expression.text) ?? false)
      } else {
        add('default', isFunctionLikeInitializer(node.expression))
      }
    } else if (ts.isExportDeclaration(node) && !node.moduleSpecifier && node.exportClause &&
               ts.isNamedExports(node.exportClause)) {
      // `export { A, B as C }` with no `from` - local bindings, so definitions.
      for (const el of node.exportClause.elements) {
        if (el.isTypeOnly) continue
        const local = (el.propertyName ?? el.name).text
        add(el.name.text, locals.get(local) ?? false)
      }
    }
  }
  return out
}

function isFunctionLikeInitializer (node) {
  if (!node) return false
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isClassExpression(node)) return true
  // forwardRef(...), memo(...), styled(...)(...) - a call whose result is rendered.
  if (ts.isCallExpression(node)) return true
  if (ts.isAsExpression(node) || ts.isParenthesizedExpression(node)) return isFunctionLikeInitializer(node.expression)
  return false
}

/**
 * The component names a module defines.
 *
 * A component is a function-like value export with a capitalised name. That is a property of the
 * declaration, not a guess from its spelling - which is what lets `ThemeProvider` be recognised as
 * a component while `BUTTON_VARIANTS` is not. The previous suffix heuristic
 * (`/Props$|Context$|Provider$|.../`) silently excluded every `*Provider`, and a React context
 * Provider is client-only by definition.
 */
export function componentsIn (source, fileName) {
  return new Set(moduleExports(source, fileName)
    // `default` is kept deliberately even though it is lowercase. An ANONYMOUS default export
    // (`export default () => ...`) has no name, so it can never appear in the classification - and
    // silently skipping it is how a client component reaches the undirectived shared chunk. It is
    // surfaced here so the build can refuse it and ask for a name.
    .filter((e) => e.functionLike && (/^[A-Z]/.test(e.name) || e.name === 'default'))
    .map((e) => e.name))
}

export const componentsInFile = (path) => componentsIn(readFileSync(path, 'utf8'), path)
