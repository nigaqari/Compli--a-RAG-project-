import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left side - Auth Form */}
      <div className="flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-background relative z-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="flex items-center gap-2 mb-12">
            <Image 
              src="/logo.jpg" 
              alt="Compli Logo" 
              width={48} 
              height={48} 
              className="rounded-md object-contain"
            />
            <span className="font-bold text-3xl" style={{ color: "var(--brand-red, #dc2626)" }}>
              Compli
            </span>
          </Link>
          {children}
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden md:flex relative bg-zinc-950 flex-col justify-between">
        <div className="relative z-20 p-12 text-white h-full flex flex-col justify-between">
          <div>
            <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-6 overflow-hidden border border-white/20 shadow-lg">
              <Image 
                src="/logo.jpg" 
                alt="Compli Logo" 
                width={64} 
                height={64} 
                className="object-cover"
              />
            </div>
            <h2 className="text-3xl font-bold mb-4 max-w-md">
              Secure, accurate, and grounded contract review.
            </h2>
            <p className="text-zinc-400 max-w-md text-lg">
              Join legal teams who have cut their review times in half while eliminating compliance risks.
            </p>
          </div>
          
          <div className="border-l-2 border-red-600 pl-6">
            <p className="italic text-zinc-300 font-medium">
              &quot;Compli catches the clauses we used to miss on a Friday afternoon.&quot;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
