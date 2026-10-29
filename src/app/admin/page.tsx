"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { THEMES, THEME_NAMES, type ThemeName } from "@/lib/theme";
import {
  salesByDay,
  summarizeStats,
  type DashboardStats,
  type DaySales,
  type Tally,
} from "@/lib/dashboard-stats";
import { formatCurrency } from "@/lib/utils";
import type { ReminderStats } from "@/lib/cart-reminders";

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

function TallyText({ tally }: { tally: Tally }) {
  return (
    <>
      {tally.count}
      <span className="text-culpa-cream/40"> · {formatCurrency(tally.amountInCents)}</span>
    </>
  );
}

// Entradas separadas por de dónde salieron, para conciliar la plata que entró
// por fuera y ver cuánto se regaló.
function EntradasPorOrigen({ stats }: { stats: DashboardStats | null }) {
  const blocks = [
    { label: "Online", hint: "cobrado en el sitio", tally: stats?.online },
    { label: "Pago por fuera", hint: "transferencia o efectivo", tally: stats?.offlinePaid },
    { label: "Cortesías", hint: "regalado, a precio de entrada", tally: stats?.courtesy },
  ];

  return (
    <section className="mt-10">
      <h2 className="culpa-heading text-sm text-culpa-cream mb-3">Entradas</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {blocks.map((block) => (
          <div key={block.label} className="bg-culpa-body-dark p-6">
            <p className="font-pixel text-[0.6rem] uppercase tracking-[0.12em] text-culpa-cream/70">
              {block.label}
            </p>
            <p className="font-pixel text-2xl mt-3 text-culpa-cream">
              {block.tally?.count ?? "..."}
            </p>
            <p className="font-pixel text-sm mt-2 text-culpa-lcd">
              {block.tally ? formatCurrency(block.tally.amountInCents) : "..."}
            </p>
            <p className="font-ui text-xs text-culpa-cream/50 mt-2">{block.hint}</p>
          </div>
        ))}
      </div>

      {stats && stats.byIssuer.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full font-ui text-sm text-culpa-cream">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-culpa-cream/50">
                <th className="py-2 pr-4 font-normal">Generado por</th>
                <th className="py-2 pr-4 font-normal">Pago por fuera</th>
                <th className="py-2 font-normal">Cortesías</th>
              </tr>
            </thead>
            <tbody>
              {stats.byIssuer.map((issuer) => (
                <tr key={issuer.name ?? ""} className="border-t border-culpa-cream/10">
                  <td className="py-2 pr-4">
                    {issuer.name ?? (
                      <span className="text-culpa-cream/40">Sin asignar</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap">
                    <TallyText tally={issuer.offlinePaid} />
                  </td>
                  <td className="py-2 whitespace-nowrap">
                    <TallyText tally={issuer.courtesy} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// Una gráfica por medida (cantidad y plata), con los días alineados: tienen
// escalas distintas y no comparten eje. Al pasar por un día se marca en las dos
// y arriba se lee el detalle; sin hover, el total de la semana.
function VentasSemana({ days }: { days: DaySales[] | null }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const total = (days ?? []).reduce(
    (sum, day) => ({ count: sum.count + day.count, amountInCents: sum.amountInCents + day.amountInCents }),
    { count: 0, amountInCents: 0 }
  );
  const focus = hovered !== null && days ? days[hovered] : null;

  const series = [
    { label: "Entradas", value: (d: DaySales) => d.count, bar: "bg-culpa-cream" },
    { label: "Plata", value: (d: DaySales) => d.amountInCents, bar: "bg-culpa-lcd" },
  ];

  return (
    <section className="mt-10">
      <h2 className="culpa-heading text-sm text-culpa-cream mb-1">
        Ventas de la semana
      </h2>
      <p className="font-ui text-xs text-culpa-cream/50 mb-4">
        Online y pago por fuera, sin cortesías.
      </p>

      <p className="font-pixel text-xs text-culpa-cream mb-4" aria-live="polite">
        <span className="text-culpa-cream/60">{focus ? focus.label : "Total"} · </span>
        {days ? (
          <>
            {(focus ?? total).count} entradas
            <span className="text-culpa-lcd"> · {formatCurrency((focus ?? total).amountInCents)}</span>
          </>
        ) : (
          "..."
        )}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" onMouseLeave={() => setHovered(null)}>
        {series.map((serie) => {
          const max = Math.max(1, ...(days ?? []).map(serie.value));
          return (
            <div key={serie.label} className="bg-culpa-body-dark p-6">
              <p className="font-pixel text-[0.6rem] uppercase tracking-[0.12em] text-culpa-cream/70 mb-2">
                {serie.label}
              </p>
              <div className="flex items-end gap-2 h-32 border-b border-culpa-cream/20">
                {(days ?? []).map((day, i) => (
                  <div
                    key={day.day}
                    className="flex-1 h-full flex items-end cursor-default"
                    onMouseEnter={() => setHovered(i)}
                    onClick={() => setHovered(i)}
                  >
                    <div
                      className={`w-full rounded-t ${serie.bar} transition-opacity ${
                        hovered === null || hovered === i ? "opacity-100" : "opacity-40"
                      }`}
                      style={{ height: `${(serie.value(day) / max) * 100}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                {(days ?? []).map((day, i) => (
                  <p
                    key={day.day}
                    className={`flex-1 text-center font-ui text-[0.65rem] whitespace-nowrap ${
                      hovered === i ? "text-culpa-cream" : "text-culpa-cream/50"
                    }`}
                  >
                    {day.label}
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reminders, setReminders] = useState<ReminderStats | null>(null);
  const [week, setWeek] = useState<DaySales[] | null>(null);

  useEffect(() => {
    async function loadStats() {
      const [eventsRes, ticketsRes, remindersRes] = await Promise.all([
        fetch("/api/admin/events"),
        fetch("/api/admin/tickets"),
        fetch("/api/admin/cart-reminders"),
      ]);

      const events = await eventsRes.json();
      const tickets = await ticketsRes.json();
      if (remindersRes.ok) setReminders(await remindersRes.json());

      setStats(summarizeStats({ events, tickets }));
      setWeek(salesByDay(tickets));
    }
    loadStats();
  }, []);

  // Las métricas de plata y de puerta van en LCD (tinta sobre el LCD, el
  // contraste más alto de la paleta); el resto en la familia del cuerpo.
  const cards = [
    { label: "Eventos", value: stats?.events ?? "...", href: "/admin/events", color: "bg-culpa-body", ink: false },
    { label: "Tickets Confirmados", value: stats?.tickets ?? "...", href: "/admin/tickets", color: "bg-culpa-body", ink: false },
    { label: "Tickets Pagados", value: stats?.paidTickets ?? "...", href: "/admin/tickets?status=PAID", color: "bg-culpa-lcd", ink: true },
    { label: "Tickets Usados", value: stats?.usedTickets ?? "...", href: "/admin/tickets?status=USED", color: "bg-culpa-cream", ink: true },
    // Carrito abandonado: mails mandados y personas que compraron después.
    { label: "Recordatorios Enviados", value: reminders?.sent ?? "...", href: "/admin/tickets?status=PENDING_PAYMENT", color: "bg-culpa-body-dark", ink: false },
    { label: "Ventas Recuperadas", value: reminders?.recovered ?? "...", href: "/admin/tickets?status=PAID", color: "bg-culpa-lcd", ink: true },
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

      <VentasSemana days={week} />

      <EntradasPorOrigen stats={stats} />

      <ThemeSwitch />
    </div>
  );
}
