import type { ReactNode } from 'react'
import '@luzentialabs/clara-react/styles.css'

export const metadata = { title: 'Clara consumer: Next App Router' }

export default function RootLayout ({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
