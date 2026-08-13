"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/events", label: "Eventos" },
  { href: "/admin/whitelist", label: "Lista" },
  { href: "/admin/invite-links", label: "Invitaciones" },
  { href: "/admin/tickets", label: "Tickets" },
  { href: "/admin/users", label: "Usuarios" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-culpa-night">
      {/* Top nav */}
      <nav className="bg-culpa-blue border-b border-culpa-cream/10">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <Link
            href="/admin"
            className="font-pixel text-sm text-culpa-cream tracking-[0.15em]"
          >
            CULPA ADMIN
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-pixel text-[0.7rem] uppercase tracking-[0.12em] transition-colors ${
                  pathname === item.href
                    ? "text-culpa-cream"
                    : "text-culpa-cream/60 hover:text-culpa-cream"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="font-pixel text-[0.7rem] uppercase tracking-[0.12em] text-culpa-cream/60 hover:text-culpa-cream transition-colors ml-4"
            >
              Salir
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-culpa-cream text-2xl"
          >
            {menuOpen ? "\u2715" : "\u2630"}
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-culpa-cream/10 px-4 py-3 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`block font-pixel text-[0.7rem] uppercase tracking-[0.12em] py-2 ${
                  pathname === item.href ? "text-culpa-cream" : "text-culpa-cream/60"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="block font-pixel text-[0.7rem] uppercase tracking-[0.12em] text-culpa-cream/60 py-2"
            >
              Salir
            </button>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
