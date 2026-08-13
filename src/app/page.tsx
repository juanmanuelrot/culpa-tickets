"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PhoneShell } from "@/components/nokia/phone-shell";
import { NokiaMenu, type MenuItem } from "@/components/nokia/menu-list";
import {
  LcdBox,
  LcdLoading,
  PixelLabel,
  ScreenPad,
  Wordmark,
} from "@/components/nokia/ui";
import { formatClock, formatDayDot, formatEventDateTime } from "@/lib/date";

interface EventInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  date: string;
  location: string | null;
  coverImageUrl: string | null;
}

const STEPS = [
  {
    n: "01",
    title: "Elegi tu entrada",
    body: "Mirá las fechas, elegí el tipo de entrada y listo. No hay lista ni invitación: entra cualquiera.",
  },
  {
    n: "02",
    title: "Paga y confirma",
    body: "Checkout seguro con MercadoPago. Si la entrada es gratis, la reclamás y ya.",
  },
  {
    n: "03",
    title: "Te llega el QR",
    body: "Recibís tu código por mail. Mostralo en la puerta y entrás.",
  },
];

export default function HomePage() {
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/events")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const upcomingEvents = events.filter((e) => new Date(e.date) >= now);
  const pastEvents = events.filter((e) => new Date(e.date) < now);
  const nextEvent = upcomingEvents[0];

  const menuItems: MenuItem[] = upcomingEvents.map((event) => ({
    label: event.name,
    href: `/event/${event.slug}`,
    meta: formatDayDot(event.date),
    sub: event.location ?? undefined,
  }));

  return (
    <PhoneShell
      leftKey={{
        label: "Menu",
        onClick: () =>
          document
            .getElementById("fechas")
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      }}
      rightKey={{ label: "Staff", href: "/login" }}
    >
      {/* ── Pantalla de inicio ─────────────────────────────────── */}
      <ScreenPad className="text-center pt-8 pb-6">
        <Wordmark className="w-[78%] max-w-[290px] mx-auto" />
        <p className="font-pixel text-[0.7rem] tracking-[0.1em] text-culpa-ink mt-3">
          reggaeton nostalgico
        </p>

        {nextEvent && (
          <div className="mt-6 text-left">
            <LcdBox className="bg-culpa-ink text-culpa-lime border-culpa-ink">
              <p className="font-pixel text-2xl leading-none">
                {formatDayDot(nextEvent.date)}
              </p>
              <p className="font-pixel text-xs mt-2 leading-relaxed">
                {nextEvent.name}
              </p>
              <p className="font-pixel text-[0.65rem] mt-2 opacity-80 leading-relaxed">
                OPEN DOORS {formatClock(nextEvent.date)}
                {nextEvent.location ? ` · ${nextEvent.location}` : ""}
              </p>
            </LcdBox>
          </div>
        )}
      </ScreenPad>

      {/* ── Próximas fechas ────────────────────────────────────── */}
      <section id="fechas" className="pb-2">
        <ScreenPad className="py-2">
          <PixelLabel>Proximas fechas</PixelLabel>
        </ScreenPad>

        {loading ? (
          <ScreenPad className="py-3">
            <LcdLoading />
          </ScreenPad>
        ) : menuItems.length === 0 ? (
          <ScreenPad className="py-3">
            <p className="font-ui text-sm text-culpa-ink/60">
              No hay fechas abiertas ahora. Volvé pronto.
            </p>
          </ScreenPad>
        ) : (
          <NokiaMenu items={menuItems} />
        )}
      </section>

      {/* ── Cómo funciona ──────────────────────────────────────── */}
      <section className="pt-4">
        <ScreenPad className="py-2">
          <PixelLabel>Como funciona</PixelLabel>
        </ScreenPad>
        <ScreenPad className="pt-2 space-y-4">
          {STEPS.map((step) => (
            <div key={step.n} className="flex gap-3">
              <span className="font-pixel text-lg text-culpa-blue shrink-0">
                {step.n}
              </span>
              <div className="min-w-0">
                <p className="font-pixel text-[0.7rem] uppercase tracking-[0.1em] text-culpa-ink">
                  {step.title}
                </p>
                <p className="font-ui text-sm text-culpa-ink/70 mt-1 leading-relaxed">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </ScreenPad>
      </section>

      {/* ── Archivo ────────────────────────────────────────────── */}
      {pastEvents.length > 0 && (
        <section className="pt-4">
          <ScreenPad className="py-2">
            <PixelLabel>Archivo</PixelLabel>
          </ScreenPad>
          <ScreenPad className="pt-1 space-y-2">
            {pastEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-baseline gap-3 opacity-50"
              >
                <span className="font-pixel text-xs shrink-0">
                  {formatDayDot(event.date)}
                </span>
                <span className="font-ui text-sm truncate">{event.name}</span>
              </div>
            ))}
          </ScreenPad>
        </section>
      )}

      {/* ── Pie ────────────────────────────────────────────────── */}
      <ScreenPad className="pt-8 pb-6">
        <div className="border-t-2 border-culpa-ink/20 pt-4 flex items-center justify-between gap-3">
          <span className="font-pixel text-[0.6rem] tracking-[0.15em] text-culpa-ink/60">
            CULPA · MVD
          </span>
          <div className="flex gap-3 font-pixel text-[0.6rem] tracking-[0.1em] text-culpa-ink/60">
            <Link href="/login" className="hover:text-culpa-ink">
              ADMIN
            </Link>
            <Link href="/validator" className="hover:text-culpa-ink">
              PUERTA
            </Link>
          </div>
        </div>
        {nextEvent && (
          <p className="sr-only">
            Próxima fecha: {formatEventDateTime(nextEvent.date)}
          </p>
        )}
      </ScreenPad>
    </PhoneShell>
  );
}
