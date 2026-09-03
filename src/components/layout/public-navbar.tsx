"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export function PublicNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "Services", href: "/services" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 sm:h-20 items-center justify-between relative">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2.5 sm:space-x-3 shrink-0 z-10">
          <Image 
            src="/logo.jpg" 
            alt="Compli Logo" 
            width={38} 
            height={38} 
            className="rounded-md object-contain shrink-0"
          />
          <span className="font-bold text-xl sm:text-2xl" style={{ color: "var(--brand-red, #dc2626)" }}>
            Compli
          </span>
        </Link>

        {/* Desktop Navigation Links - Perfectly Centered */}
        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-base font-medium transition-colors hover:text-[var(--brand-red)] ${
                pathname === link.href ? "text-foreground font-semibold" : "text-muted-foreground"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-4 z-10">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" className="text-base font-medium">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="text-base font-medium px-5 h-10 text-white" style={{ backgroundColor: "var(--brand-red, #dc2626)" }}>
              Get Started Free
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Header (Theme Toggle + Hamburger Drawer Trigger) */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border text-foreground hover:bg-[var(--surface-hover)]">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px] p-6 flex flex-col justify-between">
              <div className="flex flex-col gap-6">
                <div className="flex items-center space-x-2.5 pb-4 border-b border-border">
                  <Image 
                    src="/logo.jpg" 
                    alt="Compli Logo" 
                    width={36} 
                    height={36} 
                    className="rounded-md object-contain"
                  />
                  <span className="font-bold text-xl" style={{ color: "var(--brand-red, #dc2626)" }}>
                    Compli
                  </span>
                </div>

                {/* Mobile Navigation Links */}
                <nav className="flex flex-col gap-3">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={`text-lg font-semibold py-2 px-3 rounded-lg transition-colors ${
                        pathname === link.href
                          ? "bg-[var(--surface-hover)] text-[var(--brand-red)]"
                          : "text-foreground hover:bg-[var(--surface-hover)]"
                      }`}
                    >
                      {link.name}
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Mobile CTA Buttons */}
              <div className="flex flex-col gap-3 pt-6 border-t border-border mt-auto">
                <Link href="/login" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full h-11 text-base font-semibold">
                    Login
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)}>
                  <Button className="w-full h-11 text-base font-semibold text-white" style={{ backgroundColor: "var(--brand-red, #dc2626)" }}>
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
