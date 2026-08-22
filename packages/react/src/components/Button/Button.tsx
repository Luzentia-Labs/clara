import { useState, type ReactNode } from 'react'

/**
 * Client-only by the TRD Section 7 rule: its public props include a function, and it uses state.
 * The `"use client"` directive is NOT written here - it is prepended to the client chunk at build
 * time from `client-boundary.json`, so the classification and the shipped output cannot disagree.
 */
export interface ButtonProps {
  children?: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}

export function Button ({ children, onClick, variant = 'primary' }: ButtonProps) {
  const [pressed, setPressed] = useState(false)
  return (
    <button
      className={`clara-button clara-button--${variant}`}
      data-pressed={pressed || undefined}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
