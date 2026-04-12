import './globals.css'
import Providers from './providers'
import ClientLayoutWrapper from '@/components/ClientLayoutWrapper'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased text-gray-900 selection:bg-blue-500/30">
        <Providers>
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
        </Providers>
      </body>
    </html>
  )
}
