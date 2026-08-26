#!/usr/bin/env node
/**
 * Keep `.size-limit.json` describing what actually ships.
 *
 * D0048 made client chunks per-component so the per-component JS budgets AGENTS.md declares could
 * be real. A budget list that names one aggregate entry would not deliver that: a component could
 * double in size and nothing would say so. This regenerates one budget per built client component
 * from the classification, so a new component arrives WITH a budget rather than outside the
 * budgets.
 *
 * `--check` fails instead of writing, which is what CI runs.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fail, pass } from './lib/workspace.mjs'
import { CLIENT_CHUNK } from './lib/chunk-plan.mjs'

const RULE = 'size-budgets'
const check = process.argv.includes('--check')
const BUDGET_FILE = '.size-limit.json'
// A single component's JS. Deliberately tight: the point of per-component chunks is that this
// number means something, and a budget nobody would ever breach is not a budget.
const PER_COMPONENT_LIMIT = '5 kB'

const classification = JSON.parse(readFileSync('packages/react/client-boundary.json', 'utf8'))
const builtClients = classification.components
  .filter((c) => c.boundary === 'client' && c.status === 'built')
  .map((c) => c.name)
  .sort()

// Every built component, client or server: the entry re-exports all of them.
const builtCount = classification.components.filter((c) => c.status === 'built').length

// Peers are IGNORED when measuring. They are external in the build - the bundled-peers guard
// proves no chunk contains React - but size-limit resolves imports by default, so leaving them in
// measures React's weight and calls it Clara's. A budget that is 90% somebody else's library
// cannot detect Clara growing.
const PEERS = ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client']

/**
 * Runtime dependencies are ignored in the PER-COMPONENT budgets for the same reason peers are, and
 * then measured ONCE in a budget of their own - which peers do not get, and the difference matters.
 *
 * A consumer already has React. It does not already have Radix. So Radix cannot simply be excluded
 * and forgotten: `@radix-ui/react-dialog` is 15.19 kB gzipped, three times the entire per-component
 * limit, and it arrives in the consumer's application the first time they import a Modal.
 *
 * But charging it to Modal is not right either. It is shared by every overlay - Modal, Drawer,
 * Popover, DropdownMenu, Select, Tooltip - so a consumer using six of them pays it once. Leaving it
 * in Modal's budget would report 14.77 kB against a 5 kB limit, hide the 0.95 kB that is actually
 * Clara's code, and make the number meaningless the moment the second overlay ships and reports the
 * same 15 kB again.
 *
 * So: per-component budgets measure Clara, and one explicit entry measures the third-party runtime.
 * The cost stays visible and bounded rather than ignored, and neither number is 90% somebody else's
 * library - which is the failure this file's peer comment already names.
 */
const unmeasured = []
const unbudgeted = []
const thirdPartyChunks = new Set()
const runtimeDeps = Object.keys(
  JSON.parse(readFileSync('packages/react/package.json', 'utf8')).dependencies ?? {},
).filter((name) => !name.startsWith('@luzentialabs/'))
const IGNORED = [...PEERS, ...runtimeDeps]

/**
 * The react entry's budget SCALES with the number of components it re-exports.
 *
 * It was 5 kB - the per-component figure, reused. That is a cap on a barrel that re-exports every
 * component, so it fails the moment one more is added, and the only available response is to raise
 * it: a budget whose routine outcome is "bump the number" measures nothing. Adding four affordances
 * to Input pushed it 248 B over and turned CI red, and nothing about that was a regression.
 *
 * What the entry budget is actually FOR is catching the barrel pulling in something it should not -
 * a heavy dependency, or per-component code that failed to split into its own chunk. That signal
 * survives if the allowance tracks the component count and the ceiling catches the entry growing
 * FASTER than that count. Per-component budgets (D0048/D0053) remain the ones that bind for a
 * consumer importing a single control; this one is a shape check on the barrel.
 *
 * 270 B per built component, floor 5 kB.
 *
 * The first attempt at this was 220 B, derived from the then-current 24 components at 5.25 kB
 * (~215 B each) - which left 32 B of headroom and failed on the very next feature, 69 B later. That
 * is the same "bump the number" dynamic this budget was written to escape, just one level up: an
 * allowance with no headroom measures normal variation rather than the thing it is looking for.
 *
 * 270 B is ~20% above today's measured density. It absorbs a control gaining a prop or a live
 * region, and still fails if the entry picks up a dependency or code that should have split into a
 * per-component chunk - which is the only signal this budget exists to give. The per-component
 * budgets (D0048/D0053) remain the ones that bind for a consumer importing a single control.
 */
// 300 since Modal, the first OVERLAY, and the reason matters more than the number.
//
// 270 was derived from 24 form controls and primitives. An overlay is structurally heavier - more
// props, more composition, a portal - and Modal alone moved the fleet average from ~258 B to
// ~271 B, putting the entry 33 B over. Twelve more overlays follow, so a figure calibrated on
// controls would be re-bumped by each of them, which is the "budget whose routine outcome is bump
// the number" this file already warns about one paragraph up.
//
// What the budget is FOR still binds: the entry is a 502 B re-export barrel with no Radix in it,
// verified, and this allowance still fails if the barrel starts pulling in a dependency or code
// that should have split into a per-component chunk. The per-component budgets (D0048/D0053) are
// the ones that bind for a consumer importing a single control, and Modal's is 1.98 kB of 5 kB.
//
// If this needs raising again for something that is NOT an overlay, that is a signal, not a bump.
const ENTRY_BYTES_PER_COMPONENT = 300
const ENTRY_FLOOR_BYTES = 5000
const entryLimit = `${Math.max(ENTRY_FLOOR_BYTES, builtCount * ENTRY_BYTES_PER_COMPONENT)} B`

/**
 * The third-party budget is AUTHORED PER DEPENDENCY, not a shared constant.
 *
 * It was a flat `'18 kB'` for every runtime dependency - a figure derived from
 * `@radix-ui/react-dialog` measuring 15.19 kB, and then applied to whatever shipped next. That is
 * the exact defect the entry budget above spends three paragraphs escaping, one level over: a
 * number with no relationship to the thing it measures, whose only available response to going red
 * is to raise it. `@radix-ui/react-popover` shipped at 24.09 kB and blew it by 6.08 kB, and
 * nothing about that was a regression - Popover is a POSITIONED overlay, so it carries
 * `@radix-ui/react-popper` and the `@floating-ui` engine that a modal has no need for. The budget
 * was measuring Clara's choice of overlay against Dialog's feature set.
 *
 * So each dependency states its own ceiling and why. Adding a runtime dependency now means
 * deciding what it is allowed to weigh, which is a decision worth making once, out loud, at the
 * moment the dependency is adopted - a one-way door under this project's publishing rules.
 *
 * An unlisted dependency is REPORTED, not defaulted. That is the same rule the `unmeasured` check
 * below already applies, and for the same reason: a budget that covers a dependency by inheriting
 * someone else's number measures nothing, and the name is what a reader trusts.
 */
const THIRD_PARTY_LIMITS = {
  // Measured 15.08 kB. Modal + Drawer machinery: focus scope, dismissable layer, portal, presence.
  // No positioning engine - a modal is centred by CSS, so it never loads @floating-ui.
  '@radix-ui/react-dialog': '18 kB',
  // Measured 24.09 kB, and the ~9 kB over Dialog is positioning, not bloat: @radix-ui/react-popper
  // pulls @floating-ui/react-dom -> /dom -> /core to place a panel against a trigger through
  // scroll, flip and collision. Every positioned overlay that follows - Tooltip, DropdownMenu,
  // Select - carries that same chain, and a consumer using several pays for it ONCE. These
  // per-dependency entries each measure their own chunk in isolation, so their numbers are each
  // true and DO NOT SUM; see BG-01M0XXSA.
  '@radix-ui/react-popover': '27 kB',
  // Measured 19.26 kB - 4.8 kB UNDER popover, not level with it. Both carry the same popper +
  // @floating-ui positioning chain, but a popover is dismissable-layer and focus-scope machinery on
  // top of that and a tooltip is not: it traps no focus, owns no dismissal stack, and restores no
  // focus. So the two entries do not add up in either direction - a consumer using both pays the
  // shared chain once (BG-01M0XXSA), and the difference between them is real code, not noise.
  '@radix-ui/react-tooltip': '22 kB',
  // Measured 12.8 kB - the SMALLEST of the four, and the reason is the useful part: a toast is the
  // one overlay that is not positioned against a trigger, so it carries no @radix-ui/react-popper
  // and none of the @floating-ui chain. It is a fixed corner region plus a live-region announcer.
  '@radix-ui/react-toast': '15 kB',
  // Measured 31.11 kB - the LARGEST of the five, by 7 kB over popover. A menu is the popper +
  // @floating-ui chain (positioning), plus a dismissable layer and focus scope (like popover), plus
  // roving focus, typeahead and the whole nested-submenu machinery that neither of the others has.
  // The number is the WAI-ARIA menu pattern, not bloat.
  '@radix-ui/react-dropdown-menu': '34 kB',
}

/**
 * The ceiling for the WHOLE package with its dependencies bundled - the only number that can be
 * compared against a total.
 *
 * Authored like the entries above, and for the same reason: it is a decision about what Clara is
 * willing to charge a consumer who imports everything, not an observation.
 *
 * Measured 46.65 kB, against a naive sum of the five per-dependency entries of 102.33 kB. So
 * roughly 56 kB of that sum is the same code counted more than once - which is the double-count
 * BG-01M0XXSA is about, now measured rather than argued.
 *
 * 50 kB leaves headroom for the overlays still to come (Select, Combobox, the three date pickers).
 * They are all popper-based, so each should add its own code and almost none of the shared chain -
 * and if one of them moves this number by more than a couple of kB, that is the signal this entry
 * exists to give.
 */
const THIRD_PARTY_UNION_LIMIT = '50 kB'

const fixed = [
  { name: `@luzentialabs/clara-react (ESM entry, ${builtCount} components x ${ENTRY_BYTES_PER_COMPONENT} B, floor ${ENTRY_FLOOR_BYTES} B)`, path: 'packages/react/dist/index.js', limit: entryLimit, gzip: true, ignore: IGNORED },
  { name: '@luzentialabs/clara-icons (ESM entry)', path: 'packages/icons/dist/index.js', limit: '5 kB', gzip: true },
  { name: '@luzentialabs/clara-tokens (ESM entry)', path: 'packages/tokens/dist/index.js', limit: '5 kB', gzip: true },
  {
    name: '@luzentialabs/clara-react styles.css (the fixed sheet ceiling, TRD:480 / PRD:1090)',
    path: 'packages/react/dist/styles.css', limit: '15 kB', gzip: true,
  },
  // One entry PER runtime dependency, measured through a chunk that actually imports it.
  //
  // The first version named every dependency in one entry and measured a single hardcoded chunk.
  // A review added a second Radix package and the entry then CLAIMED to cover both while measuring
  // a chunk that imports only the first - so the second overlay's third-party weight was measured
  // by nothing, and every per-component budget ignores it. A budget that names more than it
  // measures is worse than no budget, because the name is what a reader trusts.
  //
  // The chunk is found by reading the built chunks for a real import, so an entry cannot outlive
  // the code it measures, and a dependency nothing imports is reported rather than skipped.
  ...runtimeDeps.map((dep) => {
    const importer = builtClients
      .map((name) => `packages/react/dist/${CLIENT_CHUNK}-${name}.js`)
      // Matched as a whole IMPORT SPECIFIER, not as a substring. `includes` made
      // `@radix-ui/react-dialo` - a typo, or a real package that is a prefix of another - match
      // Modal's chunk and fabricate an 18 kB budget over code that does not import it.
      .find((file) => existsSync(file)
        && new RegExp(`["'\`]${dep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(/[^"'\`]*)?["'\`]`)
          .test(readFileSync(file, 'utf8')))
    // A declared runtime dependency with no importer is REPORTED, not skipped. The previous
    // version filtered it away, so adding a second Radix package produced no budget entry at all
    // while quietly adding it to every per-component `ignore` list - its weight measured by
    // nothing, exactly the hole the per-dependency split was made to close. The comment said
    // "reported rather than skipped" while the code skipped; now it is true.
    if (!importer) {
      unmeasured.push(dep)
      return null
    }
    return { dep, importer }
  }).filter(Boolean).map(({ dep, importer }) => (thirdPartyChunks.add(importer), {
    name: `third-party runtime: ${dep} (measured alone - these DO NOT SUM, see the union entry)`,
    path: importer,
    limit: THIRD_PARTY_LIMITS[dep] ?? (unbudgeted.push(dep), '0 B'),
    gzip: true,
    ignore: [...PEERS, ...runtimeDeps.filter((d) => d !== dep)],
  })),
]

/**
 * What a consumer using EVERY overlay actually pays for third-party runtime, deduplicated.
 *
 * BG-01M0XXSA. Each per-dependency entry above measures its own chunk with the other DECLARED
 * dependencies ignored - but a TRANSITIVE dependency is in nobody's ignore list, so a chain reached
 * by several Radix packages is counted in full inside every entry that reaches it. Popover and
 * Tooltip and DropdownMenu each carry `@radix-ui/react-popper` -> `@floating-ui/react-dom` -> `/dom`
 * -> `/core`, roughly 14 kB, and each of the three entries reports all of it.
 *
 * Every one of those numbers is TRUE on its own terms - a consumer importing only Popover really
 * does pay 24 kB. What is false is the implication that they add up, which is what a reader does
 * with a list of budgets: the five entries sum to over 100 kB and no consumer has ever paid that.
 *
 * So the real total is measured too, by bundling the package ENTRY with nothing but peers ignored.
 * The entry re-exports every component, so following its imports is what a consumer's bundler
 * actually does, and shared code is counted once. Measured 46.65 kB against a naive sum of
 * 102.33 kB: about 56 kB of that sum is the same code counted more than once.
 *
 * A first attempt handed size-limit an ARRAY of the five chunks, expecting it to bundle them
 * together and dedupe. It does not - it measures each path and adds them up, reporting 102.45 kB,
 * within 120 B of the naive sum. That looked like a working dedup entry and was in fact the
 * double-count with a new name, which is worth recording because it is the exact failure this
 * entry exists to correct.
 *
 * Note what this number includes: Clara's own code as well as the dependencies. That is deliberate
 * - a consumer pays for both - and it is why the entry is named for the package rather than for
 * third-party runtime alone. Clara's share is the ESM-entry budget above, measured with the
 * dependencies ignored.
 */
if (thirdPartyChunks.size) {
  fixed.push({
    name: 'whole package + dependencies, deduplicated (the ceiling - the entries above do NOT sum)',
    path: 'packages/react/dist/index.js',
    limit: THIRD_PARTY_UNION_LIMIT,
    gzip: true,
    // Only peers. Every runtime dependency is IN scope here by design: the point of this entry is
    // the total, so ignoring any of them would measure a total that excludes part of the total.
    ignore: PEERS,
  })
}
const perComponent = builtClients.map((name) => ({
  name: `${name} (client chunk, D0048)`,
  path: `packages/react/dist/${CLIENT_CHUNK}-${name}.js`,
  limit: PER_COMPONENT_LIMIT,
  gzip: true,
  ignore: IGNORED,
}))
const wanted = [...fixed, ...perComponent]
const current = existsSync(BUDGET_FILE) ? JSON.parse(readFileSync(BUDGET_FILE, 'utf8')) : []

if (unbudgeted.length) {
  fail(RULE, unbudgeted.map((d) => (
    `${d} is a runtime dependency with no authored entry in THIRD_PARTY_LIMITS, so nothing has ` +
    'decided what it is allowed to weigh. Measure it (`pnpm size`), then add an entry stating the ' +
    'ceiling and what the number is made of. Do not copy another dependency\'s figure.'
  )))
}

if (unmeasured.length) {
  fail(RULE, unmeasured.map((d) => (
    `${d} is a declared runtime dependency of clara-react but is inlined in no built client chunk, ` +
    'so no budget measures it while every per-component budget ignores it. Either a component must ' +
    'import it, or it is not a runtime dependency.'
  )))
}

if (!check) {
  writeFileSync(BUDGET_FILE, JSON.stringify(wanted, null, 2) + '\n')
  pass(RULE, `${wanted.length} budget(s) written, ${perComponent.length} per-component`)
} else {
  const problems = []
  if (JSON.stringify(current) !== JSON.stringify(wanted)) {
    const have = new Set(current.map((e) => e.path))
    for (const e of wanted) {
      if (!have.has(e.path)) problems.push(`${e.path} has no budget - run \`pnpm size:sync\``)
    }
    const want = new Set(wanted.map((e) => e.path))
    for (const e of current) {
      if (!want.has(e.path)) problems.push(`${e.path} has a budget but is not built - run \`pnpm size:sync\``)
    }
    if (!problems.length) problems.push('.size-limit.json differs from the classification - run `pnpm size:sync`')
  }
  if (!builtClients.length && perComponent.length) problems.push('no built client component, yet per-component budgets exist')
  if (problems.length) fail(RULE, problems)
  pass(RULE, `${wanted.length} budget(s) match the classification, ${perComponent.length} per-component`)
}
