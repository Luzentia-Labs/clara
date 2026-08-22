import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Table } from '../Table/Table'
import { TableSortButton } from '../Table/TableSortButton'

/**
 * These two exist to prove co-location works: a client component living inside a server
 * component's directory. Keyed on the directory, TableSortButton chunked as Table and shipped
 * with no directive - so they are real fixtures, and get real tests.
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
