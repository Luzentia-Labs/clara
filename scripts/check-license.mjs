/**
 * Every published tarball must carry its licence text.
 *
 * All three manifests declare "license": "MIT" while the only LICENSE in the repository lives at
 * the root, so each tarball would CLAIM MIT and GRANT nothing. publint does not catch this - it
 * checks the license FIELD, never the FILE - which is why this guard exists at all.
 *
 * It asserts TARBALL CONTENTS, not a file on disk. A file-on-disk check passes even after a later
 * `.npmignore` or a narrowed `files` array excludes the licence, which is precisely the regression
 * worth guarding against.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fail, pass, readWorkspace } from './lib/workspace.mjs'

const root = process.cwd()
const rootLicense = readFileSync(join(root, 'LICENSE'), 'utf8')
const problems = []

for (const { dir, kind, manifest } of readWorkspace(root)) {
  if (kind !== 'packages' || manifest.private) continue

  let contents
  try {
    contents = JSON.parse(
      execFileSync('npm', ['pack', '--dry-run', '--json'], {
        cwd: join(root, dir),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }),
    )
  } catch (error) {
    problems.push(`${manifest.name}: could not pack - ${error.message}`)
    continue
  }

  const files = (contents[0]?.files ?? []).map((f) => f.path)
  const licenseEntry = files.find((f) => /^LICEN[SC]E(\.\w+)?$/i.test(f))

  if (!licenseEntry) {
    problems.push(
      `${manifest.name}: declares "license": "${manifest.license}" but its tarball carries no ` +
        `licence file (${files.length} file(s) packed)`,
    )
    continue
  }

  const packaged = readFileSync(join(root, dir, licenseEntry), 'utf8')
  if (packaged !== rootLicense) {
    problems.push(`${manifest.name}: ${licenseEntry} has drifted from the repository root LICENSE`)
  }
}

if (problems.length) fail('license', problems)
pass('license', `${readWorkspace(root).filter((p) => p.kind === 'packages').length} package(s), licence text packed and matching root`)
