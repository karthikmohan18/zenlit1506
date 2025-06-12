import './globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Zenlit - Connect Locally',
  description: 'A modern social media application built with Next.js 15',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white overflow-hidden">{children}</body>
    </html>
  )
}
