import { useState } from 'react'
export interface TableSortButtonProps { onSort?: (dir: string) => void }
export function TableSortButton ({ onSort }: TableSortButtonProps) {
  const [dir, setDir] = useState('asc')
  return <button className="clara-table-sort" onClick={() => { setDir(dir === 'asc' ? 'desc' : 'asc'); onSort?.(dir) }}>sort</button>
}
