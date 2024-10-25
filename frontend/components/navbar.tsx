"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex-1" />
        <nav className="flex items-center space-x-4 text-sm font-medium">
          <Link href="/">
            <Button variant="ghost" className={cn(pathname === "/" && "bg-muted")}>Dashboard</Button>
          </Link>
          <Link href="/transactions">
            <Button variant="ghost" className={cn(pathname === "/transactions" && "bg-muted")}>Transactions</Button>
          </Link>
          <Link href="/bills">
            <Button variant="ghost" className={cn(pathname === "/bills" && "bg-muted")}>Bills</Button>
          </Link>
          <Link href="/budget">
            <Button variant="ghost" className={cn(pathname === "/budget" && "bg-muted")}>Budget</Button>
          </Link>
          <Link href="/consulting">
            <Button variant="ghost" className={cn(pathname === "/consulting" && "bg-muted")}>Consulting</Button>
          </Link>
        </nav>
        <div className="flex-1 flex justify-end">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}