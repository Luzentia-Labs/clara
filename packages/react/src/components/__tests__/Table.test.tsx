import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Table } from '../Table/Table'
import { TableSortButton } from '../Table/TableSortButton'

/**
 * These two are unit-test fixtures. They are NOT exported, so they are not in the build graph and
 * prove nothing about chunking on their own - the co-location case they were written for is
 * covered end to end by test/build/chunk-placement.test.ts. They keep real tests because code that
 * ships nothing still has to be correct if anyone reads it as an example.
 */
describe('Table', () => {
  it('renders a table element wrapping its children', () => {
    render(<Table><tbody><tr><td>cell</td></tr></tbody></Table>)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('cell')).toBeInTheDocument()
  })

  it('renders without children', () => {
    render(<Table />)
    expect(screen.getByRole('table')).toBeEmptyDOMElement()
  })
})

describe('TableSortButton', () => {
  it('reports the direction it was showing when activated', async () => {
    const onSort = vi.fn()
    render(<TableSortButton onSort={onSort} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onSort).toHaveBeenCalledWith('asc')
  })

  it('alternates direction across activations', async () => {
    const onSort = vi.fn()
    render(<TableSortButton onSort={onSort} />)
    const button = screen.getByRole('button')
    await userEvent.click(button)
    await userEvent.click(button)
    expect(onSort.mock.calls.map(([d]) => d)).toEqual(['asc', 'desc'])
  })

  it('is operable with no handler', async () => {
    render(<TableSortButton />)
    await expect(userEvent.click(screen.getByRole('button'))).resolves.not.toThrow()
  })
})
