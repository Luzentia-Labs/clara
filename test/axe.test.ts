import { describe, it, expect } from 'vitest'
import { runAxe } from './axe'

/**
 * The axe harness tests itself.
 *
 * `ALWAYS_BLOCKING` exists because the a11y gap register found that 29 of axe-core's 105 rules can
 * never fail a serious-or-critical matcher, two of them reachable from Clara's surface and WCAG
 * conformance-tagged. It was added, it was correct, and it was exercised by nothing: emptying the
 * set left 771 tests and every gate green. A guard nobody has watched fire is indistinguishable
 * from one that cannot.
 *
 * Both fixtures are built by hand rather than from Clara components, deliberately. Clara's own API
 * can no longer produce a doubled label - Checkbox and Switch suppress their own label inside a
 * Field - so a component-built fixture would prove nothing about the matcher, and the rule would
 * lose its last coverage the moment it was most needed.
 */
const render = (html: string) => {
  const host = document.createElement('div')
  host.innerHTML = html
  document.body.appendChild(host)
  return host
}

describe('axe harness: rules that block regardless of impact', () => {
  it('blocks form-field-multiple-labels, which axe reports as moderate and INCOMPLETE', async () => {
    // Two labels pointing at one control: the accessible name becomes both concatenated. axe returns
    // this as `incomplete`, not a violation, and at moderate impact - below every default threshold.
    const host = render(`
      <label for="probe">Account code</label>
      <label for="probe">One</label>
      <input id="probe" type="checkbox">
    `)
    const result = await runAxe(host)
    const ids = [...result.violations, ...result.incomplete].map((r) => r.id)
    expect(ids).toContain('form-field-multiple-labels')
    await expect(runAxe(host)).resolves.not.toHaveNoBlockingViolations()
    document.body.removeChild(host)
  })

  it('blocks aria-deprecated-role, which axe reports as minor', async () => {
    const host = render('<div role="directory"><div role="listitem">x</div></div>')
    const result = await runAxe(host)
    expect([...result.violations, ...result.incomplete].map((r) => r.id)).toContain('aria-deprecated-role')
    await expect(runAxe(host)).resolves.not.toHaveNoBlockingViolations()
    document.body.removeChild(host)
  })

  it('still passes clean markup, so the matcher is not simply always failing', async () => {
    const host = render('<label for="ok">Supplier</label><input id="ok">')
    await expect(runAxe(host)).resolves.toHaveNoBlockingViolations()
    document.body.removeChild(host)
  })
})
