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
/**
 * Sections a record must have AND fill.
 *
 * Presence alone is not evidence: a review replaced `## Stated gaps` with "None. Everything about
 * this component is fully verified." and replaced `## What is verified automatically` with
 * "Everything. Exhaustively covered." - deleting all four citations - and the guard passed both
 * times, because it tested `text.includes('## Stated gaps')`. The docblock at the top of this file
 * says a record is not evidence just by existing; that has to be true of its sections too.
 *
 * `minBullets` is the floor. A section with no list items is prose, and prose is what a false record
 * is made of.
 */
const REQUIRED_SECTIONS = [
  { heading: '## Keyboard', minBullets: 0, needsTable: true },
  { heading: '## Accessibility', minBullets: 0, needsTable: false },
  { heading: '## What is verified automatically', minBullets: 3, needsTable: false },
  { heading: '## Stated gaps', minBullets: 1, needsTable: false },
  { heading: '## Recorded manual keyboard pass', minBullets: 0, needsTable: false, manualPass: true },
]

/** The body of one `## Section`, up to the next heading of the same level. */
function sectionBody (text, heading) {
  const start = text.indexOf(heading)
  if (start === -1) return null
  const after = text.slice(start + heading.length)
  const next = after.search(/\n## /)
  return next === -1 ? after : after.slice(0, next)
}

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
  'field.md': {
    require: [
      [/\*\*A disabled field still submits\.\*\*/, 'the submission consequence of aria-disabled (D0068)'],
      [/aria-disabled/, 'that disabled is aria-disabled rather than the native attribute'],
      [/labelFor="group"|labelFor="group"/, 'the group labelling mode'],
      [/^\|.*`required`.*\|/m, 'the required row of the wiring table'],
    ],
    forbid: [
      [/native `?disabled`? attribute is used|uses the native disabled/i, 'a claim that Clara uses the native disabled attribute'],
    ],
  },
  'input.md': {
    require: [
      [/^#+ .*[Aa]ffixes/m, 'a section on the affordances'],
      [/does \*\*not\*\* set `maxLength`|not.{0,20}set `maxLength`/, 'that the counter does not impose a maxLength'],
      [/returns focus to the\s+input/, 'that clearing returns focus to the input'],
      [/aria-hidden/, 'that the affixes are decoration rather than announced content'],
    ],
    forbid: [
      [/Clara overrides it/, 'the autofill override claim, which no rule in the repo implements'],
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
 * The docs page each component owns. Explicit rather than derived from the name, because a name is
 * not a fact (D0051/D0067) - `NumberInput` is `number-input.md` and `TableSortButton` documents
 * itself inside the Table page it belongs to.
 */
const DOCS_PAGE_FOR = {
  Badge: 'badge.md',
  Tag: 'tag.md',
  Modal: 'modal.md',
  Field: 'field.md',
  Input: 'input.md',
  Textarea: 'textarea.md',
  NumberInput: 'number-input.md',
  PasswordInput: 'password-input.md',
  SearchInput: 'search-input.md',
  Checkbox: 'checkbox.md',
  Switch: 'switch.md',
  RadioGroup: 'radio-group.md',
  CheckboxGroup: 'checkbox-group.md',
  Box: 'layout.md',
  Stack: 'layout.md',
  Inline: 'layout.md',
  Grid: 'layout.md',
  Divider: 'layout.md',
  Heading: 'typography.md',
  Text: 'typography.md',
  Button: 'button.md',
  IconButton: 'button.md',
  ButtonGroup: 'button.md',
  Link: 'link.md',
  Table: 'table.md',
  TableSortButton: 'table.md',
}

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
    if (!/\.test\.tsx?$/.test(entry.name)) continue
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
// Every directory that holds tests, not just the react package: the matcher accepts any
// `.test.ts(x)` path, so a record citing `scripts/lib/__tests__/...` or a tokens test was told the
// file "does not import" its component - when the truth was that the collector never looked there.
for (const dir of ['packages/react/src', 'packages/tokens/src', 'packages/icons/src', 'scripts/lib', 'test']) {
  if (existsSync(join(ROOT, dir))) collectTests(join(ROOT, dir))
}

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

  for (const { heading, minBullets, needsTable, manualPass } of REQUIRED_SECTIONS) {
    const body = sectionBody(text, heading)
    if (body === null) { problems.push(`${where}: missing section "${heading}"`); continue }
    const bullets = (body.match(/^\s*[-*] \S/gm) ?? []).length
    if (bullets < minBullets) {
      problems.push(`${where}: "${heading}" has ${bullets} list item(s), needs at least ${minBullets} - a section with none is prose, not evidence`)
    }
    // The TSD's definition of done asks for a documented keyboard table, per component.
    if (needsTable && !/^\|\s*Key\s*\|/m.test(body)) {
      problems.push(`${where}: "${heading}" has no | Key | Result | table - the definition of done requires a documented keyboard table`)
    }

    /**
     * The manual pass must state a REAL pass or say plainly that it is outstanding.
     *
     * This is the one artefact automation cannot supply, and it was the one that got fabricated:
     * an identical paragraph - same date, same OS, same two browsers, same "one observation that is
     * not a defect" - was written into all 23 records including one for a component that is a stub.
     * The section requirement at the time was mere presence, so the guard reported PASS on it, and
     * on "Not done." too. A gate that cannot distinguish a walk from a sentence about a walk is
     * worse than no gate, because the record it blesses reads like evidence.
     *
     * Neither branch can be satisfied by silence, and only the first by a claim: recording a pass
     * requires naming the browsers it was walked in, which is a specific enough claim to be wrong.
     */
    if (manualPass) {
      const outstanding = /\*\*Not performed|is outstanding\b/i.test(body)
      const recorded = /\b(walked|verified)\b/i.test(body) && /\b(Safari|Chrome|Firefox|Edge|NVDA|VoiceOver)\b/.test(body)
      if (!outstanding && !recorded) {
        problems.push(
          `${where}: "${heading}" neither records a pass (name the browsers it was walked in) ` +
          'nor states that it is outstanding - and those are the only two honest states',
        )
      }
    }
  }

  // The definition of done also asks for a docs page per component.
  const page = DOCS_PAGE_FOR[name]
  if (!page) {
    problems.push(`${where}: ${name} has no entry in DOCS_PAGE_FOR, so its docs page is not checked`)
  } else if (!existsSync(join(ROOT, 'apps/docs/src/content/components', page))) {
    problems.push(`${where}: names docs page ${page}, which does not exist`)
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
      continue
    }
    /**
     * A cited TEST file must actually contain the component's evidence.
     *
     * Resolving the path was a proxy for the evidence being there - the same substitution this
     * project keeps catching elsewhere, inside the guard that enforces the rule. Three records
     * cited `primitives.test.tsx` and `matrix.test.tsx`, which import none of the components
     * citing them; the assertions were in `typography.test.tsx` and `Table.test.tsx` all along, and
     * the check passed because the files exist. `TEST_FILES_FOR` was already computed two blocks
     * above, keyed by component, and used only for `check:*` script citations - the data needed to
     * answer this was being discarded.
     */
    if (/\.test\.tsx?$/.test(cited)) {
      const covering = TEST_FILES_FOR.get(name) ?? []
      const resolved = existsSync(join(home, cited))
        ? join(home, cited).slice(ROOT.length + 1)
        : cited
      if (covering.length && !covering.includes(resolved)) {
        problems.push(
          `${where}: cites ${cited} as its evidence, but that file does not import ${name} - ` +
          `the assertions are in ${covering.join(', ')}`,
        )
      }
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
    const runs = covering.filter((f) => command.includes(f))
    if (covering.length && !runs.length) {
      problems.push(`${where}: cites \`${script}\` as covering ${name}, but that script runs none of: ${covering.join(', ')}`)
      continue
    }
    // Naming the file is not enough. `check:axe` named a file holding 54 axe assertions and
    // selected them with `-t "axe"`, which matched no block in it: 86 skipped, 0 run, exit 0. A
    // selector that selects nothing is the repo's signature fail-open, so the pattern is matched
    // against the block names the file actually declares.
    const selector = /-t\s+(?:"([^"]+)"|'([^']+)')/.exec(command)
    if (!selector) continue
    const pattern = new RegExp(selector[1] ?? selector[2])
    const selectsSomething = runs.some((f) => {
      const source = readFileSync(join(ROOT, f), 'utf8')
      return [...source.matchAll(/^\s*(?:describe|it)(?:\.each\([^)]*\))?\(\s*[`'"]([^`'"]+)/gm)]
        .some((m) => pattern.test(m[1]))
    })
    if (!selectsSomething) {
      problems.push(
        `${where}: cites \`${script}\`, whose selector /${pattern.source}/ matches no test name in ` +
        `${runs.join(', ')} - a selector that selects nothing exits 0 and proves nothing`,
      )
    }
  }
}

const docsDir = join(ROOT, 'apps/docs/src/content/components')
// Every page in DOC_CLAIMS needs an owner, or the scoped run silently checks nothing for it.
const DOC_OWNER = { 'search-input.md': 'SearchInput', 'switch.md': 'Switch', 'field.md': 'Field', 'input.md': 'Input' }
for (const page of Object.keys(DOC_CLAIMS)) {
  if (!DOC_OWNER[page]) throw new Error(`DOC_CLAIMS has ${page} with no DOC_OWNER entry - the scoped run would skip it`)
}
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
