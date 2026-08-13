"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function ValidatorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-culpa-night">
      <nav className="bg-culpa-blue border-b border-culpa-cream/10">
        <div className="max-w-md mx-auto px-4 flex items-center justify-between h-14">
          <span className="font-pixel text-sm text-culpa-cream tracking-[0.15em]">
            CULPA PUERTA
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/validator"
              className={`font-pixel text-[0.7rem] uppercase tracking-[0.12em] ${
                pathname === "/validator" ? "text-culpa-cream" : "text-culpa-cream/60"
              }`}
            >
              Escáner
            </Link>
            <Link
              href="/validator/scans"
              className={`font-pixel text-[0.7rem] uppercase tracking-[0.12em] ${
                pathname === "/validator/scans" ? "text-culpa-cream" : "text-culpa-cream/60"
              }`}
            >
              Historial
            </Link>
            <button
              onClick={handleLogout}
              className="font-pixel text-[0.7rem] uppercase tracking-[0.12em] text-culpa-cream/60 hover:text-culpa-cream"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-md mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
