import { expect, test } from '@playwright/test'
import { createServer, type Server } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'

/**
 * The Storybook toolbars actually change what renders (US-01M0GMZW AC1).
 *
 * The story's acceptance criteria were written as `file apps/storybook/.storybook/preview.tsx` and
 * `grep "addon-a11y" main.ts` - existence checks. A `preview.tsx` containing nothing but a comment
 * satisfies both, and a toolbar that renders but changes nothing satisfies them just as well. The
 * capability being claimed is that switching theme or density re-renders the component
 * differently, so that is what is asserted here.
 *
 * Globals are set through the URL rather than by clicking the toolbar. `?globals=theme:dark` is
 * Storybook's own documented entry point, it is what Chromatic will use to shoot the baseline
 * matrix, and it does not couple this test to the toolbar's DOM.
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
    // Loud, not skipped: a suite that quietly passes when the thing it tests was never built is
    // the failure mode this project keeps finding in its own gates.
    //
    // Deliberately NOT built here. `fullyParallel` gives each worker its own `beforeAll`, so
    // building from inside the spec had three workers running `storybook build` into the same
    // output directory at once - one passed and two died on the collision. The build belongs to
    // one step that runs before the suite, which is what `pnpm check:storybook` is.
    throw new Error(
      `no Storybook build at ${STATIC} - run \`pnpm check:storybook\`, which builds it first`,
    )
  }
  // A real origin, not file://: the static build loads ES modules, which file:// refuses.
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

/** Render one story with the given globals and read what the browser computed. */
const measure = async (page: import('@playwright/test').Page, globals: string) => {
  await page.goto(`${origin}/iframe.html?id=actions-button--primary&viewMode=story&globals=${globals}`)
  const button = page.locator('button.clara-button')
  await button.waitFor({ state: 'visible' })
  return button.evaluate((el) => {
    const scope = el.closest('[data-clara-theme]')
    return {
      height: el.getBoundingClientRect().height,
      canvasBackground: getComputedStyle(el.parentElement!).backgroundColor,
      theme: scope?.getAttribute('data-clara-theme') ?? null,
      density: scope?.getAttribute('data-clara-density') ?? null,
    }
  })
}

test('the theme toolbar changes what the browser paints', async ({ page }) => {
  const light = await measure(page, 'theme:light')
  const dark = await measure(page, 'theme:dark')

  expect(light.theme).toBe('light')
  expect(dark.theme).toBe('dark')
  // The attribute moving is not the claim - the paint is. BG-01M0WQY1 was precisely the case
  // where every attribute was correct and nothing downstream followed.
  expect(dark.canvasBackground, 'the canvas did not repaint for the dark theme')
    .not.toEqual(light.canvasBackground)
})

test('the density toolbar changes the geometry, on the same scale gate 9 holds', async ({ page }) => {
  const comfortable = await measure(page, 'density:comfortable')
  const compact = await measure(page, 'density:compact')

  expect(comfortable.density).toBe('comfortable')
  expect(compact.density).toBe('compact')
  // The same two numbers gate 9 asserts against the built package (TSD 7, D0098). If the
  // playground disagreed with the gate, one of them would be lying about the design system.
  expect(comfortable.height).toBeCloseTo(40, 0)
  expect(compact.height).toBeCloseTo(32, 0)
})

test('autodocs generates a props table from the TypeScript types', async ({ page }) => {
  await page.goto(`${origin}/iframe.html?id=actions-button--docs&viewMode=docs`)
  // `variant` is a Clara prop with a literal union. If docgen were off, or `propFilter` were
  // dropping everything, the page would render with no table at all rather than a wrong one.
  await expect(page.getByRole('cell', { name: 'variant', exact: true })).toBeVisible()
  await expect(page.getByText('primary').first()).toBeVisible()
})
