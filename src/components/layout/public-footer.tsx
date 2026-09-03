import Link from "next/link";
import Image from "next/image";

export function PublicFooter() {
  return (
    <footer className="border-t bg-background py-10 md:py-14">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {/* Brand info */}
        <div className="flex flex-col gap-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl" style={{ color: "var(--brand-red, #dc2626)" }}>
            <Image 
              src="/logo.jpg" 
              alt="Compli Logo" 
              width={28} 
              height={28} 
              className="rounded-md object-contain"
            />
            <span>Compli</span>
          </Link>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            Review contracts against your policies in minutes, not days. AI-powered legal intelligence and compliance governance.
          </p>
        </div>
        
        {/* Navigation */}
        <div>
          <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground mb-4">Product</h3>
          <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
            </li>
            <li>
              <Link href="/about" className="transition-colors hover:text-foreground">About Us</Link>
            </li>
            <li>
              <Link href="/services" className="transition-colors hover:text-foreground">Services</Link>
            </li>
          </ul>
        </div>
        
        {/* Platform Access */}
        <div>
          <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground mb-4">Platform</h3>
          <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
            <li>
              <Link href="/login" className="transition-colors hover:text-foreground">Sign In</Link>
            </li>
            <li>
              <Link href="/signup" className="transition-colors hover:text-foreground">Get Started Free</Link>
            </li>
            <li>
              <Link href="/dashboard" className="transition-colors hover:text-foreground">Dashboard</Link>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="container mx-auto px-4 mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
        <p>© {new Date().getFullYear()} Compli. All rights reserved.</p>
        <p className="text-muted-foreground/80">AI Legal Intelligence & Compliance Platform</p>
      </div>
    </footer>
  );
}
