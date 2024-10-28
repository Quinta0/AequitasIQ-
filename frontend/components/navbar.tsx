'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/bills", label: "Bills" },
  { href: "/budget", label: "Budget" },
  { href: "/consulting", label: "Consulting" },
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-4 mt-4">
                {navItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      pathname === item.href ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {item.label}
                    </span>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo/Brand - can be added here */}
        <div className="flex-1 md:flex-none">
          <Link href="/">
            <span className="font-semibold">Aequitas IQ</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4 text-sm font-medium">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button 
                variant="ghost" 
                className={cn(
                  "transition-colors",
                  pathname === item.href && "bg-muted"
                )}
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}