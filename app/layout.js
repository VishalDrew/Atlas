import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'Atlas — AI workspace for Customer Success',
  description: 'One AI-powered workspace that understands customer context and executes repetitive work.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0b] text-zinc-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
