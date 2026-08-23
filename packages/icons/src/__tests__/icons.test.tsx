import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { runAxe } from '../../../../test/axe'
import { Icon } from '../Icon'
import * as Icons from '../generated'

const catalogue = JSON.parse(readFileSync(join(__dirname, '../../icons.json'), 'utf8')).categories
const all = Object.entries(Icons).filter(([n]) => n.endsWith('Icon')) as Array<[string, typeof Icon]>

describe('icon inherits currentColor and size', () => {
  it('takes its colour from the text around it rather than a fixed value', () => {
    const { container } = render(<Icon><path d="M0 0" /></Icon>)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('stroke', 'currentColor')
    expect(svg).toHaveAttribute('fill', 'none')
  })

  it('sizes to the surrounding text, so it does not need a prop at every call site', () => {
    const { container } = render(<Icon><path d="M0 0" /></Icon>)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '1em')
    expect(svg).toHaveAttribute('height', '1em')
  })

  it('can be overridden by the consumer', () => {
    const { container } = render(<Icon width={32} height={32}><path d="M0 0" /></Icon>)
    expect(container.querySelector('svg')).toHaveAttribute('width', '32')
  })

  it('is drawn on the 24x24 grid the set is designed for', () => {
    const { container } = render(<Icon><path d="M0 0" /></Icon>)
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 24 24')
  })
})

describe('icon without label is aria-hidden', () => {
  // An icon beside a text label that announces itself makes the control read twice.
  it('is decorative by default', () => {
    const { container } = render(<Icons.AddIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).not.toHaveAttribute('role')
  })

  it('becomes an image with a name when it carries meaning alone', () => {
    render(<Icons.DeleteIcon label="Delete row" />)
    expect(screen.getByRole('img', { name: 'Delete row' })).toBeInTheDocument()
  })

  it('is never focusable, so it does not clutter the tab order', () => {
    const { container } = render(<Icons.SearchIcon label="Search" />)
    expect(container.querySelector('svg')).toHaveAttribute('focusable', 'false')
  })

  it.each(all.slice(0, 48))('%s is decorative by default', (_name, Component) => {
    const { container } = render(<Component />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('the set matches its committed list', () => {
  it('exports exactly the 48 icons icons.json declares', () => {
    const declared = Object.values(catalogue as Record<string, object>)
      .reduce((n: number, c) => n + Object.keys(c).length, 0)
    expect(all).toHaveLength(declared)
    expect(all).toHaveLength(48)
  })

  it('draws something in every icon - an empty one would render and mean nothing', () => {
    for (const [name, Component] of all) {
      const { container } = render(<Component />)
      const paths = container.querySelectorAll('path')
      expect({ name, paths: paths.length > 0, hasGeometry: [...paths].every((p) => (p.getAttribute('d') ?? '').length > 4) })
        .toEqual({ name, paths: true, hasGeometry: true })
    }
  })
})

describe('accessibility', () => {
  it.each([
    ['decorative', <Icons.AddIcon />],
    ['labelled', <Icons.DeleteIcon label="Delete row" />],
    ['inside text', <p>Saved <Icons.SuccessIcon /></p>],
  ])('%s icon has no blocking violations', async (_n, element) => {
    const { container } = render(element)
    await expect(runAxe(container)).resolves.toHaveNoBlockingViolations()
  })
})
