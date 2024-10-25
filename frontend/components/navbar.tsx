import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <nav className="flex items-stretch space-x-6 text-sm font-medium text-center w-full justify-items-center">
          <Link href="/">
            <Button variant="ghost">Dashboard</Button>
          </Link>
          <Link href="/transactions">
            <Button variant="ghost">Transactions</Button>
          </Link>
          <Link href="/bills">
            <Button variant="ghost">Bills</Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}