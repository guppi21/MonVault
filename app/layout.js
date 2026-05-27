
import './globals.css'

export const metadata = {
  title: 'MonVault',
  description: 'Monad NFT Time Capsule',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
