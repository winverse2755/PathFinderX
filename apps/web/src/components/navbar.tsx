"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
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
    <header className="sticky top-0 z-50 w-full border-b border-game-primary/30 bg-game-surface/95 backdrop-blur-md shadow-card">
      <div className="container flex h-20 max-w-screen-2xl items-center justify-between px-6">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 bg-game-surface border-r border-game-primary/30">
              <div className="flex items-center gap-3 mb-8 animate-fade-in">
                <Image
                  src="/logo.jpg"
                  alt="PathFinderX Logo"
                  width={48}
                  height={48}
                  className="flex-shrink-0 w-12 h-12 rounded-lg"
                  priority
                />
                <span className="font-game text-2xl font-bold tracking-wider gradient-text">
                  PathFinderX
                </span>
              </div>
              <nav className="flex flex-col gap-2">
                {navLinks.map((link, index) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block px-4 py-3 font-game text-sm font-medium tracking-wide rounded-md transition-all duration-300 animate-slide-in ${
                      link.isSearch
                        ? pathname === link.href
                          ? "bg-game-accent text-game-bg shadow-glow-accent"
                          : "bg-game-accent/20 text-game-accent hover:bg-game-accent hover:text-game-bg"
                        : pathname === link.href
                        ? "bg-game-primary text-white shadow-glow-primary"
                        : "bg-transparent text-game-text-muted hover:bg-game-primary/20 hover:text-white"
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="mt-6 pt-6 border-t border-game-primary/30">
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
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <Image
              src="/logo.jpg"
              alt="PathFinderX Logo"
              width={40}
              height={40}
              className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg group-hover:shadow-glow-primary transition-all duration-300"
              priority
            />
            <span className="font-game text-xl sm:text-2xl font-bold tracking-wider gradient-text group-hover:opacity-80 transition-opacity">
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
              className={`px-4 py-2 font-game text-sm font-medium tracking-wide rounded-md transition-all duration-300 ${
                link.isSearch
                  ? pathname === link.href
                    ? "bg-game-accent text-game-bg shadow-glow-accent"
                    : "bg-game-accent/20 text-game-accent hover:bg-game-accent hover:text-game-bg"
                  : pathname === link.href
                  ? "bg-game-primary text-white shadow-glow-primary"
                  : "bg-transparent text-game-text-muted hover:bg-game-primary/20 hover:text-white"
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
