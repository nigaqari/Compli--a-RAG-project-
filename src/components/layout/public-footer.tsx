import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t bg-background py-10 md:py-16">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="flex flex-col gap-4">
          <Link href="/" className="font-bold text-xl" style={{ color: "var(--brand-red, #dc2626)" }}>
            Compli
          </Link>
          <p className="text-sm text-muted-foreground">
            Review contracts against your policies in minutes, not days.
          </p>
        </div>
        
        <div>
          <h3 className="font-medium mb-4">Product</h3>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li><Link href="/" className="hover:text-foreground">Home</Link></li>
            <li><Link href="/services" className="hover:text-foreground">Services</Link></li>
            <li><Link href="/services#pricing" className="hover:text-foreground">Pricing</Link></li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-medium mb-4">Company</h3>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li><Link href="/about" className="hover:text-foreground">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
            <li><Link href="/careers" className="hover:text-foreground">Careers</Link></li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-medium mb-4">Legal</h3>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="container mx-auto px-4 mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Compli. All rights reserved.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
          {/* Social Icons could go here */}
        </div>
      </div>
    </footer>
  );
}
