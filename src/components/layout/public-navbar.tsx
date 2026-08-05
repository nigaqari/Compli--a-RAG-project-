"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";

export function PublicNavbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "Services", href: "/services" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-20 items-center justify-between">
        <div className="flex items-center gap-8 md:gap-12">
          <Link href="/" className="flex items-center space-x-3 transition-transform hover:scale-105">
            <Image 
              src="/logo.jpg" 
              alt="Compli Logo" 
              width={45} 
              height={45} 
              className="rounded-md object-contain"
            />
            <span className="font-bold text-2xl inline-block" style={{ color: "var(--brand-red, #dc2626)" }}>
              Compli
            </span>
          </Link>
          <nav className="hidden md:flex gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[17px] transition-all hover:scale-105 hover:text-foreground/80 ${
                  pathname === link.href ? "text-foreground font-medium" : "text-foreground/70"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <ThemeToggle />
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-[17px] transition-all hover:-translate-y-1 hover:scale-105">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="text-[17px] px-6 h-11 transition-all hover:-translate-y-1 hover:scale-105 hover:shadow-lg" style={{ backgroundColor: "var(--brand-red, #dc2626)", color: "white" }}>
                Get Started Free
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
