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
