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

      setStats({
        events: Array.isArray(events) ? events.length : 0,
        whitelisted: whitelist.total || 0,
        tickets: Array.isArray(tickets) ? tickets.length : 0,
        paidTickets: Array.isArray(tickets)
          ? tickets.filter((t: { status: string }) => t.status === "PAID").length
          : 0,
        usedTickets: Array.isArray(tickets)
          ? tickets.filter((t: { status: string }) => t.status === "USED").length
          : 0,
      });
    }
    loadStats();
  }, []);

  const cards = [
    { label: "Eventos", value: stats?.events ?? "...", href: "/admin/events", color: "bg-fyf-red" },
    { label: "En Lista", value: stats?.whitelisted ?? "...", href: "/admin/whitelist", color: "bg-fyf-red-dark" },
    { label: "Total Tickets", value: stats?.tickets ?? "...", href: "/admin/tickets", color: "bg-fyf-red" },
    { label: "Tickets Pagados", value: stats?.paidTickets ?? "...", href: "/admin/tickets?status=PAID", color: "bg-green-700" },
    { label: "Tickets Usados", value: stats?.usedTickets ?? "...", href: "/admin/tickets?status=USED", color: "bg-blue-700" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-black uppercase tracking-wider text-white mb-8">
        Panel
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`${card.color} p-6 hover:opacity-80 transition-opacity`}
          >
            <p className="text-white/70 text-xs uppercase tracking-widest">{card.label}</p>
            <p className="text-white text-3xl font-black mt-2">{card.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
