import type { ReactNode } from 'react'

/**
 * Server-capable by the TRD Section 7 rule: no function props, no state, no effects, no refs, no
 * browser APIs. It therefore carries NO directive, and a consumer rendering it in an App Router
 * page never crosses a client boundary.
 */
export interface BoxProps {
  children?: ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Box ({ children, padding = 'none' }: BoxProps) {
  return <div className={`clara-box clara-box--${padding}`}>{children}</div>
}
