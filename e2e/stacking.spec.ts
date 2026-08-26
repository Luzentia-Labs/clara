import { expect, test } from '@playwright/test'
import { createServer, type Server } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'

/**
 * The overlay behaviours that only exist in a browser.
 *
 * Two of them so far, and both are here for the same reason: jsdom lays nothing out. It computes no
 * geometry, resolves no `var()`, and has no pointer. Any verdict it reached about a grace-area
 * polygon or about which of two overlapping surfaces the user's click lands on would be a false
 * green by construction - which is the failure this project has now found in its own gates several
 * times, so these assertions are made where the mechanism actually runs.
 *
 * Storybook is the vehicle rather than a server-rendered fixture, because a portalled overlay does
 * not exist in a static render at all (BG-01M0XVXS): it is mounted by an effect, on the client,
 * after hydration. Driving a real Storybook build is the only way to get a live one on screen.
 *
 * ONE TRAP, recorded because it produced a false negative here first. Storybook imports
 * `@luzentialabs/clara-react/styles.css` - the BUILT package, not `packages/react/src/styles.css`.
 * So a mutation probe against this suite must `pnpm build` before `pnpm check:storybook`, or the
 * mutation never reaches the browser and every test passes, which reads as "the assertion is
 * insensitive" when in fact the assertion was never challenged. Proved after rebuilding: dropping
 * the toast viewport to `--clara-layer-overlay` turns the arrival test red.
 */

const STATIC = join(process.cwd(), 'apps/storybook/storybook-static')
const TYPES: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.png': 'image/png',
}

let server: Server
let origin: string

test.beforeAll(async () => {
  if (!existsSync(join(STATIC, 'iframe.html'))) {
    // Loud, not skipped, for the reason storybook.spec.ts records: a suite that quietly passes
    // when the thing it tests was never built is exactly the defect this project keeps finding.
    throw new Error(
      `no Storybook build at ${STATIC} - run \`pnpm check:storybook\`, which builds it first`,
    )
  }
  server = createServer((req, res) => {
    const path = (req.url ?? '/').split('?')[0] ?? '/'
    const file = join(STATIC, path === '/' ? 'index.html' : decodeURIComponent(path))
    if (!file.startsWith(STATIC) || !existsSync(file)) { res.writeHead(404); res.end(); return }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
    res.end(readFileSync(file))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  origin = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`
})

test.afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
})

/**
 * WCAG 1.4.13, "hoverable": content shown on hover must remain visible while the pointer travels to
 * it, so a person can actually read it - or reach a link inside it - without it vanishing underneath
 * them. Radix implements it as a grace-area polygon over the trigger's and the content's real
 * bounding rectangles.
 *
 * The pointer is moved in STEPS through the gap rather than teleported. A single jump from trigger
 * to content lands inside the tooltip in one event and passes even with the bridge disabled, since
 * there is never a moment where the pointer is over neither element. The failure this asserts
 * against is the tooltip closing DURING the journey, so the journey has to happen.
 */
test('a tooltip stays open while the pointer travels from the trigger to it', async ({ page }) => {
  await page.goto(`${origin}/iframe.html?id=overlays-tooltip--hover-bridge&viewMode=story`)

  const trigger = page.getByRole('button', { name: 'Hover me' })
  await trigger.waitFor({ state: 'visible' })
  await trigger.hover()

  const tip = page.locator('.clara-tooltip')
  await tip.waitFor({ state: 'visible' })

  const from = await trigger.boundingBox()
  const to = await tip.boundingBox()
  expect(from, 'the trigger has no geometry').not.toBeNull()
  expect(to, 'the tooltip has no geometry').not.toBeNull()

  // It is placed BELOW the trigger, which is what makes the downward journey the real one.
  expect(to!.y, 'the tooltip is not below its trigger, so this walk tests nothing')
    .toBeGreaterThan(from!.y)

  const startX = from!.x + from!.width / 2
  const startY = from!.y + from!.height
  const endX = to!.x + to!.width / 2
  const endY = to!.y + 4
  const STEPS = 12
  for (let i = 1; i <= STEPS; i++) {
    await page.mouse.move(
      startX + ((endX - startX) * i) / STEPS,
      startY + ((endY - startY) * i) / STEPS,
    )
    // Asserted at EVERY step, not only on arrival. Checking once at the end cannot tell a bridge
    // that held from one that dropped the tooltip halfway and reopened it when the pointer landed
    // on the trigger's own grace area.
    await expect(tip, `the tooltip vanished at step ${i} of ${STEPS} on the way to it`)
      .toBeVisible()
  }
})

/**
 * The same journey with the pointer leaving in the OPPOSITE direction must close it.
 *
 * Without this, the test above passes on a tooltip that never closes at all - which is not a bridge,
 * it is a leak, and it would leave a stale explanation sitting over the page.
 */
test('a tooltip closes when the pointer leaves without reaching it', async ({ page }) => {
  await page.goto(`${origin}/iframe.html?id=overlays-tooltip--hover-bridge&viewMode=story`)

  const trigger = page.getByRole('button', { name: 'Hover me' })
  await trigger.waitFor({ state: 'visible' })
  await trigger.hover()

  const tip = page.locator('.clara-tooltip')
  await tip.waitFor({ state: 'visible' })

  const from = await trigger.boundingBox()
  const viewport = page.viewportSize()!
  // Sideways and away, in steps, staying ON SCREEN the whole time.
  //
  // The first version of this walked UPWARD to `from.y - 240`, which is a negative coordinate on
  // this story - the trigger sits 96px from the top - and a move to a point outside the viewport
  // does not deliver the `pointerleave` the close depends on. It failed while the tooltip was
  // behaving correctly, which is the same false verdict in the opposite direction.
  for (let i = 1; i <= 6; i++) {
    await page.mouse.move(
      from!.x + ((viewport.width - 8 - from!.x) * i) / 6,
      Math.max(4, from!.y - (i * 8)),
    )
  }

  await expect(tip, 'the tooltip never closes, so the bridge above proves nothing')
    .toBeHidden()
})

/**
 * D0102 - Tooltip AC7 and Toast AC7, the two directions of ONE mechanism.
 *
 * `--clara-layer-tooltip` and `--clara-layer-toast` resolve to the SAME layer deliberately, because
 * the relationship is bidirectional: a tooltip opened on a toast's action must paint above the
 * toast, and a toast arriving over an open tooltip must paint above the tooltip. No constant
 * satisfies both, so open order decides - which is what the browser already does with DOM order.
 *
 * Asserted with `document.elementFromPoint` INSIDE the overlap, never by comparing computed
 * `z-index` values. D0065 records what asserting a proxy for the property cost last time, and here
 * the proxy is worse than usual: the two elements have the same z-index BY DESIGN, so a comparison
 * would report "equal" in both directions and prove nothing either way. What a user experiences is
 * which element is hit at a point, so that is what is measured.
 */

/** The topmost element at a point, walked back up to whichever overlay owns it. */
const ownerAt = async (page: import('@playwright/test').Page, x: number, y: number) =>
  page.evaluate(([px, py]) => {
    const hit = document.elementFromPoint(px as number, py as number)
    if (!hit) return null
    const owner = hit.closest('.clara-toast, .clara-tooltip')
    return owner ? (owner.classList.contains('clara-tooltip') ? 'tooltip' : 'toast') : null
  }, [x, y])

test('a tooltip on a toast action paints above it', async ({ page }) => {
  await page.goto(`${origin}/iframe.html?id=overlays-toast--tooltip-on-a-toast-action&viewMode=story`)

  const toast = page.locator('.clara-toast')
  await toast.waitFor({ state: 'visible' })

  // Hover, not a programmatic `.focus()`. Radix gates focus-opening on `:focus-visible`, which a
  // scripted focus call does not set - so `.focus()` leaves the tooltip closed and the probe below
  // reads a null box. Measured: both AC7 tests failed that way before this changed.
  await page.getByRole('button', { name: 'Retry' }).hover()
  const tip = page.locator('.clara-tooltip')
  await tip.waitFor({ state: 'visible' })

  const tipBox = (await tip.boundingBox())!
  const toastBox = (await toast.boundingBox())!

  // The overlap has to be REAL, or the probe below reads a point only one of them occupies and
  // passes no matter which paints on top.
  const overlapX = Math.max(tipBox.x, toastBox.x)
  const overlapY = Math.max(tipBox.y, toastBox.y)
  const overlapRight = Math.min(tipBox.x + tipBox.width, toastBox.x + toastBox.width)
  const overlapBottom = Math.min(tipBox.y + tipBox.height, toastBox.y + toastBox.height)
  expect(overlapRight - overlapX, 'the tooltip and the toast do not overlap horizontally')
    .toBeGreaterThan(2)
  expect(overlapBottom - overlapY, 'the tooltip and the toast do not overlap vertically')
    .toBeGreaterThan(2)

  const owner = await ownerAt(page, (overlapX + overlapRight) / 2, (overlapY + overlapBottom) / 2)
  expect(owner, 'the toast covers the tooltip that explains its own action').toBe('tooltip')
})

test('a toast arriving over an open tooltip paints above it', async ({ page }) => {
  await page.goto(`${origin}/iframe.html?id=overlays-toast--toast-arriving-over-a-tooltip&viewMode=story`)

  // The tooltip goes up FIRST. That ordering is the entire subject of this test.
  await page.getByRole('button', { name: 'Explain' }).hover()
  const tip = page.locator('.clara-tooltip')
  await tip.waitFor({ state: 'visible' })

  // `dispatchEvent`, not `.click()`. A real click MOVES THE POINTER to the Notify button, which
  // takes it off Explain and closes the very tooltip this test needs open - the toast then arrives
  // over nothing and the probe reads a null box. Measured: that is exactly how this failed first.
  // Dispatching the event leaves the pointer where it is, so the tooltip is still up when the toast
  // lands, which is the situation the criterion describes.
  await page.getByRole('button', { name: 'Notify' }).dispatchEvent('click')
  const toast = page.locator('.clara-toast')
  await toast.waitFor({ state: 'visible' })
  // The entrance animation moves it, so measure once it has settled.
  await expect.poll(async () => {
    const a = await toast.boundingBox()
    await page.waitForTimeout(60)
    const b = await toast.boundingBox()
    return a && b && Math.abs(a.x - b.x) < 0.5
  }).toBe(true)

  const tipBox = (await tip.boundingBox())!
  const toastBox = (await toast.boundingBox())!

  const overlapX = Math.max(tipBox.x, toastBox.x)
  const overlapY = Math.max(tipBox.y, toastBox.y)
  const overlapRight = Math.min(tipBox.x + tipBox.width, toastBox.x + toastBox.width)
  const overlapBottom = Math.min(tipBox.y + tipBox.height, toastBox.y + toastBox.height)
  expect(overlapRight - overlapX, 'the toast and the tooltip do not overlap horizontally')
    .toBeGreaterThan(2)
  expect(overlapBottom - overlapY, 'the toast and the tooltip do not overlap vertically')
    .toBeGreaterThan(2)

  const owner = await ownerAt(page, (overlapX + overlapRight) / 2, (overlapY + overlapBottom) / 2)
  expect(owner, 'the newly arrived toast is hidden behind a stale tooltip').toBe('toast')
})

/**
 * The direction that DISTINGUISHES open order from mount order.
 *
 * The two assertions above are each satisfied by mount order as well, because in both the tooltip's
 * host happens to be created before the toast's. A defect that froze stacking at mount order - a
 * literal `open` passed to `ClaraPortal`, so the host was appended when the component MOUNTED
 * rather than when its surface opened - passed both of them, and shipped. A review caught it by
 * hand, in this exact configuration.
 *
 * So: the toast arrives FIRST, and the tooltip opens over it afterwards. Only open order gets this
 * right. Mount order cannot, because the tooltip's trigger is on the page from the start.
 */
test('a tooltip opened over a live toast paints above it', async ({ page }) => {
  await page.goto(`${origin}/iframe.html?id=overlays-toast--tooltip-opened-over-a-live-toast&viewMode=story`)

  // The toast goes up FIRST this time. `dispatchEvent` keeps the pointer where it is.
  await page.getByRole('button', { name: 'Notify' }).dispatchEvent('click')
  const toast = page.locator('.clara-toast')
  await toast.waitFor({ state: 'visible' })
  await expect.poll(async () => {
    const a = await toast.boundingBox()
    await page.waitForTimeout(60)
    const b = await toast.boundingBox()
    return a && b && Math.abs(a.x - b.x) < 0.5
  }).toBe(true)

  // Only now does the tooltip open.
  await page.getByRole('button', { name: 'Explain' }).hover()
  const tip = page.locator('.clara-tooltip')
  await tip.waitFor({ state: 'visible' })

  const tipBox = (await tip.boundingBox())!
  const toastBox = (await toast.boundingBox())!
  const overlapX = Math.max(tipBox.x, toastBox.x)
  const overlapY = Math.max(tipBox.y, toastBox.y)
  const overlapRight = Math.min(tipBox.x + tipBox.width, toastBox.x + toastBox.width)
  const overlapBottom = Math.min(tipBox.y + tipBox.height, toastBox.y + toastBox.height)
  expect(overlapRight - overlapX, 'the tooltip and the toast do not overlap horizontally')
    .toBeGreaterThan(2)
  expect(overlapBottom - overlapY, 'the tooltip and the toast do not overlap vertically')
    .toBeGreaterThan(2)

  const owner = await ownerAt(page, (overlapX + overlapRight) / 2, (overlapY + overlapBottom) / 2)
  expect(owner, 'the tooltip opened last but the toast paints above it - stacking is frozen at mount order')
    .toBe('tooltip')
})

/**
 * Toast's motion is Class B (D0100), so reduced motion must REPLACE it rather than remove it.
 *
 * The ruling was asserted in four places - the stylesheet, the verification record, the story's
 * spec delta and the commit message - and exercised by nothing. A review deleted the ENTIRE
 * `@media (prefers-reduced-motion: reduce)` block and measured every gate still green: 1140 tests,
 * `pnpm check`, `check:geometry`. Deleting the entrance animation itself was equally invisible.
 *
 * That matters more here than the usual "unverified claim", because reduced motion is an
 * accessibility mechanism for vestibular disorders and Class B is the ruling that KEEPS motion.
 * Something has to prove the substitution actually happens.
 *
 * Both directions, on the pattern `e2e/geometry.spec.ts` already uses for ProgressBar's identical
 * Class B claim: the reduced treatment must NOT translate, and it must still say "this is new".
 */
test('a toast replaces its slide with a fade under reduced motion, rather than losing it', async ({ page }) => {
  const read = async () => page.evaluate(() => {
    const el = document.querySelector('.clara-toast')
    if (!el) return null
    const s = getComputedStyle(el)
    return { name: s.animationName, transform: s.transform, duration: s.animationDuration }
  })

  // 1. No preference: it TRAVELS. That is the spatial-origin half - the toast comes from the edge.
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto(`${origin}/iframe.html?id=overlays-toast--success&viewMode=story`)
  await page.locator('.clara-toast').waitFor({ state: 'visible' })
  const moving = await read()
  expect(moving!.name, 'the toast has no entrance animation at all').not.toBe('none')

  // 2. Reduced: a DIFFERENT animation, and no translation.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`${origin}/iframe.html?id=overlays-toast--success&viewMode=story`)
  await page.locator('.clara-toast').waitFor({ state: 'visible' })
  const reduced = await read()

  expect(reduced!.name, 'reduced motion did not change the animation at all').not.toBe(moving!.name)
  // REPLACED, not removed - this is the whole Class B ruling. `none` here would mean a toast
  // arriving behind the reader's gaze is indistinguishable from one that was always there, which
  // is the information D0100 says motion is carrying.
  expect(reduced!.name, 'the motion was REMOVED under reduced motion, not replaced - Class B says replace')
    .not.toBe('none')
  // And it must not travel: a translation is exactly what a vestibular trigger is.
  expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(reduced!.transform)
})

/**
 * A tooltip's text is Clara's size, not the consumer's.
 *
 * A tooltip PORTALS to `document.body`, so it does not inherit from where its trigger lives. With
 * no `font-size` declared it took the consumer's `body` size - measured at 13px on a page whose
 * body was 13px, against `font.body` = 14px, which is under the legibility floor D0104 sets for
 * text that carries meaning. This string is what `aria-describedby` points at, so it is the
 * description of a control and D0104's implementer test stops at the first question.
 *
 * It can only be asserted in a browser: jsdom resolves no `var()` and computes no styles, and the
 * static geometry fixture cannot contain a portalled overlay at all (BG-01M0XVXS).
 */
test('a tooltip renders at Clara\'s font size, not the page\'s', async ({ page }) => {
  await page.goto(`${origin}/iframe.html?id=overlays-tooltip--hover-bridge&viewMode=story`)
  // A hostile page: smaller than Clara's floor, which is what the tooltip used to inherit.
  await page.addStyleTag({ content: 'html, body { font-size: 13px; }' })

  await page.getByRole('button', { name: 'Hover me' }).hover()
  const tip = page.locator('.clara-tooltip')
  await tip.waitFor({ state: 'visible' })

  const px = await tip.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
  expect(px, 'the tooltip inherited the page font size instead of declaring its own')
    .toBeGreaterThanOrEqual(14)
})
