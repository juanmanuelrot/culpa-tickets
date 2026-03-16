"use client";

import { useEffect, useState, useCallback } from "react";

interface Ticket {
  id: string;
  status: string;
  purchaserName: string;
  purchaserEmail: string;
  purchaserGovId: string | null;
  createdAt: string;
  event: { name: string };
  ticketType: { name: string };
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadTickets = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/admin/tickets?${params}`);
    const data = await res.json();
    setTickets(Array.isArray(data) ? data : []);
  }, [search, statusFilter]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const statusColors: Record<string, string> = {
    PENDING_PAYMENT: "text-yellow-400",
    PAID: "text-green-400",
    USED: "text-blue-400",
    CANCELLED: "text-red-400",
  };

  return (
    <div>
      <h1 className="text-3xl font-black uppercase tracking-wider text-white mb-8">
        Tickets
      </h1>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or ID..."
          className="flex-1 bg-white/5 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-fyf-red"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-fyf-red"
        >
          <option value="">All Statuses</option>
          <option value="PENDING_PAYMENT">Pending</option>
          <option value="PAID">Paid</option>
          <option value="USED">Used</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="space-y-2">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="bg-white/5 border border-white/10 p-4 flex items-center justify-between">
            <div>
              <p className="text-white font-bold">{ticket.purchaserName}</p>
              <p className="text-white/40 text-sm">
                {ticket.event.name} — {ticket.ticketType.name}
              </p>
              <p className="text-white/30 text-xs mt-1">
                {ticket.purchaserEmail}
                {ticket.purchaserGovId && ` | ${ticket.purchaserGovId}`}
              </p>
            </div>
            <div className="text-right">
              <span className={`text-xs uppercase tracking-wider font-bold ${statusColors[ticket.status] || "text-white/40"}`}>
                {ticket.status}
              </span>
              <p className="text-white/30 text-xs mt-1">
                {new Date(ticket.createdAt).toLocaleString("es-AR")}
              </p>
            </div>
          </div>
        ))}
        {tickets.length === 0 && (
          <p className="text-white/30 text-center py-8">No tickets found</p>
        )}
      </div>
    </div>
  );
}
