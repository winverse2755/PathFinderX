"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { WalletConnectButton } from "@/components/connect-button"

const navLinks = [
  { name: "Hunts", href: "/" },
  { name: "Create", href: "/create" },
  { name: "Leaderboard", href: "/leaderboard" },
]

export function Navbar() {
  const pathname = usePathname()
  
  return (
    <header className="sticky top-0 z-50 w-full border-b-4 border-celo-purple bg-celo-yellow shadow-lg backdrop-blur-sm">
      <div className="container flex h-20 max-w-screen-2xl items-center justify-between px-6">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden border-2 border-celo-purple bg-transparent hover:bg-celo-purple hover:text-celo-yellow transition-premium">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 bg-celo-tan-light border-r-4 border-celo-purple">
              <div className="flex items-center gap-2 mb-8 animate-fade-in">
                <span className="text-display text-3xl font-display font-light italic text-celo-purple">
                  PathFinderX
                </span>
              </div>
              <nav className="flex flex-col gap-2">
                {navLinks.map((link, index) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block px-4 py-3 border-2 border-celo-purple text-body-bold text-base transition-premium hover-lift animate-slide-in ${
                      pathname === link.href
                        ? "bg-celo-purple text-celo-yellow"
                        : "bg-transparent text-celo-purple hover:bg-celo-purple hover:text-celo-yellow"
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="mt-6 pt-6 border-t-2 border-celo-purple">
                  <WalletConnectButton />
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-90 transition-premium group">
            <span className="text-display text-2xl sm:text-3xl font-display font-light italic text-celo-purple group-hover:scale-105 transition-transform">
              PathFinderX
            </span>
          </Link>
        </div>
        
        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 border-2 border-celo-purple text-body-bold text-sm transition-premium hover-lift ${
                pathname === link.href
                  ? "bg-celo-purple text-celo-yellow shadow-md"
                  : "bg-transparent text-celo-purple hover:bg-celo-purple hover:text-celo-yellow"
              }`}
            >
              {link.name}
            </Link>
          ))}
          
          <div className="ml-4">
            <WalletConnectButton />
          </div>
        </nav>
      </div>
    </header>
  )
}
