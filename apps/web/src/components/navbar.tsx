"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, ExternalLink } from "lucide-react"
import Image from "next/image"

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
  { name: "Search", href: "/search", isSearch: true },
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
              <div className="flex items-center gap-3 mb-8 animate-fade-in">
                <Image
                  src="/logo.jpg"
                  alt="PathFinderX Logo"
                  width={48}
                  height={48}
                  className="flex-shrink-0 w-12 h-12"
                  priority
                />
                <span className="text-display text-3xl font-display font-light italic text-celo-purple">
                  PathFinderX
                </span>
              </div>
              <nav className="flex flex-col gap-2">
                {navLinks.map((link, index) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block px-4 py-3 border-2 text-body-bold text-base transition-premium hover-lift animate-slide-in ${
                      link.isSearch
                        ? pathname === link.href
                          ? "bg-celo-pink-accent border-celo-purple text-celo-purple"
                          : "bg-celo-pink-accent/20 border-celo-pink-accent text-celo-purple hover:bg-celo-pink-accent hover:border-celo-purple"
                        : pathname === link.href
                        ? "bg-celo-purple text-celo-yellow border-celo-purple"
                        : "bg-transparent text-celo-purple border-celo-purple hover:bg-celo-purple hover:text-celo-yellow"
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="mt-6 pt-6 border-t-2 border-celo-purple">
                  <div className="md:hidden">
                    <WalletConnectButton mobileView />
                  </div>
                  <div className="hidden md:block">
                    <WalletConnectButton />
                  </div>
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-premium group">
            <Image
              src="/logo.jpg"
              alt="PathFinderX Logo"
              width={40}
              height={40}
              className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 group-hover:scale-105 transition-transform"
              priority
            />
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
              className={`px-4 py-2 border-2 text-body-bold text-sm transition-premium hover-lift ${
                link.isSearch
                  ? pathname === link.href
                    ? "bg-celo-pink-accent border-celo-purple text-celo-purple shadow-md"
                    : "bg-celo-pink-accent/20 border-celo-pink-accent text-celo-purple hover:bg-celo-pink-accent hover:border-celo-purple"
                  : pathname === link.href
                  ? "bg-celo-purple text-celo-yellow border-celo-purple shadow-md"
                  : "bg-transparent text-celo-purple border-celo-purple hover:bg-celo-purple hover:text-celo-yellow"
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
