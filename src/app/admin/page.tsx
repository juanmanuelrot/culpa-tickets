"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { THEMES, THEME_NAMES, type ThemeName } from "@/lib/theme";

interface Stats {
  events: number;
  whitelisted: number;
  tickets: number;
  paidTickets: number;
  usedTickets: number;
}

/*
 * El switch de tema. Cambia el sitio público, los mails y el link compartido,
 * y también este admin: tras guardar se refresca el árbol para que el root
 * layout vuelva a leer la DB y la piel cambie al instante.
 */
function ThemeSwitch() {
  const router = useRouter();
  const current = useTheme().name;
  const [saving, setSaving] = useState<ThemeName | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(theme: ThemeName) {
    if (theme === current || saving) return;
    setSaving(theme);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo cambiar el tema");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el tema");
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="culpa-heading text-sm text-culpa-cream mb-3">
        Tema del sitio
      </h2>
      <div className="flex flex-wrap gap-3">
        {THEME_NAMES.map((name) => {
          const active = name === current;
          return (
            <button
              key={name}
              type="button"
              onClick={() => choose(name)}
              disabled={saving !== null}
              aria-pressed={active}
              className={`font-pixel text-[0.7rem] uppercase tracking-[0.12em] px-5 py-3 border-2 border-culpa-ink transition-opacity disabled:opacity-60 ${
                active
                  ? "bg-culpa-lcd text-culpa-ink"
                  : "bg-culpa-body-dark text-culpa-cream hover:opacity-80"
              }`}
            >
              {saving === name ? "Guardando..." : THEMES[name].label}
              {active && saving === null ? " ✓" : ""}
            </button>
          );
        })}
      </div>
      <p className="font-ui text-xs text-culpa-cream/60 mt-3">
        Cambia el sitio público, los mails que salen desde ahora y la imagen
        del link compartido. Los links ya compartidos pueden tardar en
        actualizarse: las redes cachean la imagen.
      </p>
      {error && (
        <p className="font-ui text-xs text-culpa-alert mt-2">{error}</p>
      )}
    </section>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function loadStats() {
      const [eventsRes, whitelistRes, ticketsRes] = await Promise.all([
        fetch("/api/admin/events"),
        fetch("/api/admin/whitelist?limit=1"),
        fetch("/api/admin/tickets"),
      ]);

      const events = await eventsRes.json();
      const whitelist = await whitelistRes.json();
      const tickets = await ticketsRes.json();

      // Only real payments and invitations count; abandoned checkouts
      // (PENDING_PAYMENT) and cancelled tickets are left out.
      const ticketList: { status: string }[] = Array.isArray(tickets) ? tickets : [];
      const paidTickets = ticketList.filter((t) => t.status === "PAID").length;
      const usedTickets = ticketList.filter((t) => t.status === "USED").length;

      setStats({
        events: Array.isArray(events) ? events.length : 0,
        whitelisted: whitelist.total || 0,
        tickets: paidTickets + usedTickets,
        paidTickets,
        usedTickets,
      });
    }
    loadStats();
  }, []);

  // Las métricas de plata y de puerta van en LCD (tinta sobre el LCD, el
  // contraste más alto de la paleta); el resto en la familia del cuerpo.
  const cards = [
    { label: "Eventos", value: stats?.events ?? "...", href: "/admin/events", color: "bg-culpa-body", ink: false },
    { label: "En Lista", value: stats?.whitelisted ?? "...", href: "/admin/whitelist", color: "bg-culpa-body-dark", ink: false },
    { label: "Tickets Confirmados", value: stats?.tickets ?? "...", href: "/admin/tickets", color: "bg-culpa-body", ink: false },
    { label: "Tickets Pagados", value: stats?.paidTickets ?? "...", href: "/admin/tickets?status=PAID", color: "bg-culpa-lcd", ink: true },
    { label: "Tickets Usados", value: stats?.usedTickets ?? "...", href: "/admin/tickets?status=USED", color: "bg-culpa-cream", ink: true },
  ];

  return (
    <div>
      <h1 className="culpa-heading text-xl text-culpa-cream mb-8">
        Panel
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`${card.color} p-6 hover:opacity-80 transition-opacity`}
          >
            <p
              className={`font-pixel text-[0.6rem] uppercase tracking-[0.12em] ${
                card.ink ? "text-culpa-ink/70" : "text-culpa-cream/70"
              }`}
            >
              {card.label}
            </p>
            <p
              className={`font-pixel text-2xl mt-3 ${
                card.ink ? "text-culpa-ink" : "text-culpa-cream"
              }`}
            >
              {card.value}
            </p>
          </Link>
        ))}
      </div>

      <ThemeSwitch />
    </div>
  );
}
