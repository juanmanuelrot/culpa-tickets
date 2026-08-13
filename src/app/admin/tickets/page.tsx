"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDateTime } from "@/lib/date";

interface Ticket {
  id: string;
  status: string;
  purchaserName: string;
  purchaserEmail: string | null;
  purchaserGovId: string | null;
  whitelistedPersonId: string | null;
  createdAt: string;
  event: { name: string };
  ticketType: { name: string };
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

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

  async function handlePromote(ticketId: string) {
    setPromotingId(ticketId);
    setNotice("");
    try {
      const res = await fetch("/api/admin/whitelist/from-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });
      const data = await res.json();
      setNotice(res.ok ? "Agregado a la lista" : data.error || "No se pudo agregar");
      await loadTickets();
    } catch {
      setNotice("Algo salió mal");
    } finally {
      setPromotingId(null);
    }
  }

  const statusColors: Record<string, string> = {
    PENDING_PAYMENT: "text-yellow-400",
    PAID: "text-green-400",
    USED: "text-blue-400",
    CANCELLED: "text-red-400",
  };

  return (
    <div>
      <h1 className="culpa-heading text-xl text-culpa-cream mb-8">
        Tickets
      </h1>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, correo o documento..."
          className="flex-1 bg-culpa-cream/5 border border-culpa-cream/10 text-culpa-cream px-4 py-3 focus:outline-none focus:border-culpa-lime"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-culpa-cream/5 border border-culpa-cream/10 text-culpa-cream px-4 py-3 focus:outline-none focus:border-culpa-lime"
        >
          <option value="">Todos los Estados</option>
          <option value="PENDING_PAYMENT">Pendiente</option>
          <option value="PAID">Pagado</option>
          <option value="USED">Usado</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
      </div>

      {notice && (
        <div className="bg-culpa-cream/10 border border-culpa-cream/20 px-4 py-2 mb-4 text-culpa-cream text-sm">
          {notice}
        </div>
      )}

      <div className="space-y-2">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="bg-culpa-cream/5 border border-culpa-cream/10 p-4 flex items-center justify-between">
            <div>
              <p className="text-culpa-cream font-bold">{ticket.purchaserName}</p>
              <p className="text-culpa-cream/40 text-sm">
                {ticket.event.name} — {ticket.ticketType.name}
              </p>
              <p className="text-culpa-cream/30 text-xs mt-1">
                {ticket.purchaserEmail}
                {ticket.purchaserGovId && ` | ${ticket.purchaserGovId}`}
              </p>
            </div>
            <div className="text-right flex flex-col items-end gap-2">
              <span className={`text-xs uppercase tracking-wider font-bold ${statusColors[ticket.status] || "text-culpa-cream/40"}`}>
                {ticket.status}
              </span>
              <p className="text-culpa-cream/30 text-xs">
                {formatDateTime(ticket.createdAt)}
              </p>
              {ticket.whitelistedPersonId ? (
                <span className="text-blue-300/70 text-xs uppercase tracking-wider">En la lista</span>
              ) : ticket.purchaserGovId ? (
                <button
                  onClick={() => handlePromote(ticket.id)}
                  disabled={promotingId === ticket.id}
                  className="bg-blue-700 text-culpa-cream text-xs uppercase tracking-wider font-bold px-3 py-1 hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {promotingId === ticket.id ? "..." : "Agregar a la lista"}
                </button>
              ) : null}
            </div>
          </div>
        ))}
        {tickets.length === 0 && (
          <p className="text-culpa-cream/30 text-center py-8">No se encontraron tickets</p>
        )}
      </div>
    </div>
  );
}
