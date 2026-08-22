import type { ReactNode } from 'react'
export interface TableProps { children?: ReactNode }
export function Table ({ children }: TableProps) { return <table>{children}</table> }
