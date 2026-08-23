#!/usr/bin/env node
/**
 * PRD F17 gate: every built component carries a verification record that can be CHECKED, not a
 * blanket accessibility claim.
 *
 * The point of this guard is that a record is not evidence just by existing. A file named
 * verification.md is trivially satisfiable and proves nothing, which is exactly the failure mode
 * `verify_ac.py` refuses when an acceptance criterion's only verifier reads a markdown file. So
 * this guard checks the record against the things it claims:
 *
 *   1. every BUILT component has one (built = a .tsx exists, not merely "planned");
 *   2. the boundary it states matches client-boundary.json, which is what the build actually uses -
 *      a record that says "server-capable" for a client component is worse than no record;
 *   3. every relative path it cites resolves on disk, so a cited test file cannot be renamed away;
 *   4. the required sections are present, including Stated gaps - a record with nothing unverified
 *      is not a thorough record, it is an incurious one.
 *
 * Docs pages are held to the same standard: a page exists for each component that has one, and the
 * substantive decision each page was written to record is actually recorded in it.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fail, pass } from './lib/workspace.mjs'
import { componentsInFile } from './lib/module-exports.mjs'

const ROOT = process.cwd()
const COMPONENTS = join(ROOT, 'packages/react/src/components')
const REQUIRED_SECTIONS = ['## Accessibility', '## What is verified automatically', '## Stated gaps']

/**
 * A docs page's REASON for existing, as a claim the page must actually make. Keyed by page, each
 * entry is what the story required the page to settle - not a keyword to sprinkle. `search-input`
 * has to say the debounce decision belongs to the caller (US-01M0GM2X AC2); `switch` has to say
 * the choice between Switch and Checkbox turns on immediacy (US-01M0GM9E AC2).
 */
const DOC_CLAIMS = {
  'search-input.md': {
    require: [
      [/^#+ .*[Dd]ebounc/m, 'a section about debouncing'],
      [/\*\*Clara does not debounce\.?\*\*/, 'that Clara does not debounce, stated as the page\'s position'],
      [/^\s*[-*] .*\*\*local[^*]*\*\*/im, 'the local-filter case as its own point'],
      [/^\s*[-*] .*\*\*server[^*]*\*\*/im, 'the server-query case as its own point'],
    ],
    forbid: [
      [/Clara debounces|we debounce for you|debounces? for you/i, 'a claim that Clara debounces, which is the opposite of the decision'],
    ],
  },
  'switch.md': {
    require: [
      [/^\|.*\*\*Switch\*\*.*\|/m, 'a Switch row in the choice table'],
      [/^\|.*\*\*Checkbox\*\*.*\|/m, 'a Checkbox row in the choice table'],
      [/\*\*immediate(ly)?\*\*/i, 'immediacy as the deciding property, emphasised'],
      [/Save/, 'the save-step distinction that separates the two'],
    ],
    forbid: [
      [/switch.{0,40}(inside|within) a form.{0,40}(is fine|is correct)/i, 'an endorsement of a switch inside a deferred form'],
    ],
  },
}


/**
 * `--component <Name>` scopes the guard to one component AND requires it to be built.
 *
 * Without the scope this guard is a repo-wide sweep, which is the right shape for `pnpm check` and
 * the WRONG shape for an acceptance criterion: a story for an unbuilt component would run the sweep,
 * find nothing wrong with the components that DO exist, and pass green for a component that does not
 * exist at all. An AC naming its own component fails until that component is built and recorded,
 * which is what "definition of done" was supposed to mean.
 */
const scopeIndex = process.argv.indexOf('--component')
const scope = scopeIndex === -1 ? null : process.argv[scopeIndex + 1]
if (scopeIndex !== -1 && !scope) fail('verification', ['--component needs a component name'])
/**
 * `--docs` narrows to the component's DOCS page alone, so a documentation AC has a failure mode of
 * its own. Without it a docs AC and a definition-of-done AC carry a byte-identical verifier, and
 * the docs one has nothing it can independently fail on.
 */
const docsOnly = process.argv.includes('--docs')
if (docsOnly && !scope) fail('verification', ['--docs needs --component'])

const SCRIPTS = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).scripts ?? {}

/**
 * The test files whose assertions a component's record is entitled to cite as evidence, found by
 * reading which files actually import it. A record that cites `check:axe` must cite a script that
 * RUNS one of them; otherwise the gate named is not the gate that covers the component.
 */
const TEST_FILES_FOR = new Map()
const collectTests = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) { collectTests(full); continue }
    if (!entry.name.endsWith('.test.tsx')) continue
    const source = readFileSync(full, 'utf8')
    for (const m of source.matchAll(/import \{([^}]*)\} from '[^']*\/(\w+)'/g)) {
      for (const imported of m[1].split(',').map((x) => x.trim()).filter(Boolean)) {
        const rel = full.slice(ROOT.length + 1)
        const list = TEST_FILES_FOR.get(imported) ?? []
        if (!list.includes(rel)) list.push(rel)
        TEST_FILES_FOR.set(imported, list)
      }
    }
  }
}
collectTests(join(ROOT, 'packages/react/src'))

const manifest = JSON.parse(readFileSync(join(ROOT, 'packages/react/client-boundary.json'), 'utf8'))
const boundaries = new Map(manifest.components.map((c) => [c.name, c]))

const problems = []
let checked = 0
let citations = 0

/**
 * What is BUILT, read with TypeScript's own parser rather than inferred from a filename.
 *
 * The first version of this guard called a directory "built" when it contained `<dirname>.tsx`.
 * That is a name shape, not a fact, and it is the exact failure this repo keeps repeating - tier
 * inferred from a token prefix, "is a component" from a `Props` suffix (D0051). It had a live miss
 * on the day it was written: `Table/TableSortButton.tsx` is a real component with its own tests and
 * its own classification entry, and the guard was silent about it. A component in `index.tsx`, or
 * any second component in a directory, was equally invisible.
 */
const built = []
const componentFiles = new Map()
for (const name of readdirSync(COMPONENTS).sort()) {
  const dir = join(COMPONENTS, name)
  if (!statSync(dir).isDirectory()) continue
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith('.tsx') || file.endsWith('.type-test.tsx')) continue
    for (const component of componentsInFile(join(dir, file))) {
      if (built.includes(component)) continue
      built.push(component)
      componentFiles.set(component, `${name}/${file}`)
    }
  }
}

if (!built.length) fail('verification', ['no built components found - this guard would pass vacuously'])

if (scope && !built.includes(scope)) {
  fail('verification', [
    `${scope} is not built: no component by that name is exported from packages/react/src/components.`,
    'A verification record cannot stand in for a component that has not been written.',
  ])
}

const inScope = docsOnly ? [] : (scope ? [scope] : built)

for (const name of inScope) {
  // The record lives beside the file that DEFINES the component, which is not always a directory
  // of the same name (TableSortButton lives under Table/).
  const home = dirname(join(COMPONENTS, componentFiles.get(name) ?? `${name}/${name}.tsx`))
  // Two components can share a directory (TableSortButton lives under Table/) and they do not have
  // to share a boundary, so a per-component record takes precedence over the directory's.
  const own = join(home, `${name}.verification.md`)
  const record = existsSync(own) ? own : join(home, 'verification.md')
  if (!existsSync(record)) {
    problems.push(`${name}: built (exported from ${componentFiles.get(name)}) but has no verification.md`)
    continue
  }
  checked++
  const text = readFileSync(record, 'utf8')
  const where = record.slice(ROOT.length + 1)
  // A shared record has to actually MENTION the component it is standing in for, or one file
  // silently covers a component nobody documented.
  if (!text.includes(name)) problems.push(`${where}: does not mention ${name}, which it is the record for`)

  for (const section of REQUIRED_SECTIONS) {
    if (!text.includes(section)) problems.push(`${where}: missing section "${section}"`)
  }

  // The stated boundary must agree with the file the BUILD reads. Two sources of truth about which
  // components are client is how a directive ends up on the wrong chunk.
  const declared = boundaries.get(name)
  if (!declared) {
    problems.push(`${where}: ${name} is not classified in client-boundary.json`)
  } else {
    const stated = /\*\*Boundary:\*\*\s*(client|server)/.exec(text)
    if (!stated) problems.push(`${where}: no "**Boundary:**" line`)
    else if (stated[1] !== declared.boundary) {
      problems.push(`${where}: says "${stated[1]}" but client-boundary.json says "${declared.boundary}"`)
    }
  }

  // Every path the record cites has to resolve. A record whose evidence has been renamed away is
  // a claim with no backing, and it reads exactly like one that still holds.
  // Any backticked token that LOOKS like a path is resolved - a directory separator plus a file
  // extension. Listing accepted prefixes meant an unlisted one was silently skipped rather than
  // checked, which is a citation check that fails open on exactly the citations it did not expect.
  for (const m of text.matchAll(/`([^`\s]+)`/g)) {
    const cited = m[1]
    if (!/\//.test(cited) || !/\.[a-z]{1,5}$/i.test(cited)) continue
    // A citation may be written relative to the record or from the repo root; both are natural in
    // a file that sits next to the code. Resolve either, and fail only when neither exists.
    citations++
    if (!existsSync(join(home, cited)) && !existsSync(join(ROOT, cited))) {
      problems.push(`${where}: cites ${cited}, which does not exist`)
    }
  }

  // A record may also cite a package.json SCRIPT as its evidence ("- axe ... - `check:axe`"). That
  // is not a path, so the loop above skips it - and 22 records cited a gate that ran none of the
  // components citing it. The script must exist AND must run the file holding the assertions.
  for (const m of text.matchAll(/`(check:[a-z-]+)`/g)) {
    const script = m[1]
    citations++
    const command = SCRIPTS[script]
    if (!command) { problems.push(`${where}: cites \`${script}\`, which is not a script in package.json`); continue }
    // Only a script that RUNS NAMED TEST FILES can be checked this way. `check:contrast` and
    // `check:component-css` are repo-wide node guards with no per-component file list, so demanding
    // they name a component's test file would be a false failure - the opposite error, and just as
    // bad as the one this catches.
    if (!/vitest/.test(command) || !/\.test\.tsx?/.test(command)) continue
    const covering = TEST_FILES_FOR.get(name) ?? []
    if (covering.length && !covering.some((f) => command.includes(f))) {
      problems.push(`${where}: cites \`${script}\` as covering ${name}, but that script runs none of: ${covering.join(', ')}`)
    }
  }
}

const docsDir = join(ROOT, 'apps/docs/src/content/components')
const DOC_OWNER = { 'search-input.md': 'SearchInput', 'switch.md': 'Switch' }
if (docsOnly && !Object.values(DOC_OWNER).includes(scope)) {
  fail('verification', [`${scope} owns no documentation page, so --docs has nothing to check`])
}
for (const [page, claims] of Object.entries(DOC_CLAIMS)) {
  if (scope && DOC_OWNER[page] !== scope) continue
  const file = join(docsDir, page)
  if (!existsSync(file)) {
    problems.push(`apps/docs/src/content/components/${page}: required docs page is missing`)
    continue
  }
  const text = readFileSync(file, 'utf8')
  // Required patterns are anchored to STRUCTURE - a heading, an emphasised claim, a table row, a
  // bullet - rather than to a bare word. A bare-word check is satisfiable by any mention, so the
  // whole Debouncing section could be replaced with a sentence saying the OPPOSITE and the guard
  // stayed green. The `forbid` list closes the other half: saying the right thing somewhere does
  // not help if the page also says the wrong thing.
  for (const [pattern, what] of claims.require) {
    if (!pattern.test(text)) problems.push(`${page}: does not document ${what}`)
  }
  for (const [pattern, what] of claims.forbid) {
    if (pattern.test(text)) problems.push(`${page}: contains ${what}`)
  }
}

if (problems.length) fail('verification', problems)
const pages = scope ? Object.values(DOC_OWNER).filter((c) => c === scope).length : Object.keys(DOC_CLAIMS).length
pass('verification', `${scope ? `${scope}: ` : ''}${checked} verification record(s), ${citations} citation(s) resolved, ${pages} docs page(s) checked`)
