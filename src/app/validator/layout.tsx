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
    <div className="min-h-screen bg-fyf-black">
      <nav className="bg-fyf-red border-b border-white/10">
        <div className="max-w-md mx-auto px-4 flex items-center justify-between h-14">
          <span className="text-xl font-black text-white tracking-wider">
            F&F SCAN
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/validator"
              className={`text-sm uppercase tracking-widest font-bold ${
                pathname === "/validator" ? "text-white" : "text-white/60"
              }`}
            >
              Escáner
            </Link>
            <Link
              href="/validator/scans"
              className={`text-sm uppercase tracking-widest font-bold ${
                pathname === "/validator/scans" ? "text-white" : "text-white/60"
              }`}
            >
              Historial
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm uppercase tracking-widest font-bold text-white/60 hover:text-white"
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
