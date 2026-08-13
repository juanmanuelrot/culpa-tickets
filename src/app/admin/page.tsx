"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  events: number;
  whitelisted: number;
  tickets: number;
  paidTickets: number;
  usedTickets: number;
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

  // Las métricas de plata y de puerta van en lima (tinta sobre lima, el
  // contraste más alto de la paleta); el resto en la familia azul.
  const cards = [
    { label: "Eventos", value: stats?.events ?? "...", href: "/admin/events", color: "bg-culpa-blue", ink: false },
    { label: "En Lista", value: stats?.whitelisted ?? "...", href: "/admin/whitelist", color: "bg-culpa-blue-dark", ink: false },
    { label: "Tickets Confirmados", value: stats?.tickets ?? "...", href: "/admin/tickets", color: "bg-culpa-blue", ink: false },
    { label: "Tickets Pagados", value: stats?.paidTickets ?? "...", href: "/admin/tickets?status=PAID", color: "bg-culpa-lime", ink: true },
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
    </div>
  );
}
