"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDateTime } from "@/lib/date";

interface Ticket {
  id: string;
  status: string;
  purchaserName: string;
  purchaserEmail: string | null;
  purchaserGovId: string | null;
  qrSignedJwt: string | null;
  createdAt: string;
  event: { name: string };
  ticketType: { name: string };
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [notice, setNotice] = useState("");
  const [resendId, setResendId] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);

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

  function openResend(ticket: Ticket) {
    setResendId(ticket.id);
    setResendEmail(ticket.purchaserEmail || "");
    setNotice("");
  }

  async function handleResend(ticketId: string) {
    setSendingId(ticketId);
    setNotice("");
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotice(`QR reenviado a ${data.email}`);
        setResendId(null);
        await loadTickets();
      } else {
        setNotice(data.error || "No se pudo reenviar");
      }
    } catch {
      setNotice("Algo salió mal");
    } finally {
      setSendingId(null);
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
          className="flex-1 bg-culpa-cream/5 border border-culpa-cream/10 text-culpa-cream px-4 py-3 focus:outline-none focus:border-culpa-lcd"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-culpa-cream/5 border border-culpa-cream/10 text-culpa-cream px-4 py-3 focus:outline-none focus:border-culpa-lcd"
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
              {resendId === ticket.id && (
                <div className="flex gap-2 mt-3">
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="bg-culpa-cream/5 border border-culpa-cream/10 text-culpa-cream text-sm px-3 py-1 focus:outline-none focus:border-culpa-lcd"
                  />
                  <button
                    onClick={() => handleResend(ticket.id)}
                    disabled={sendingId === ticket.id || !resendEmail.trim()}
                    className="bg-culpa-lcd text-culpa-ink text-xs uppercase tracking-wider font-bold px-3 py-1 disabled:opacity-50"
                  >
                    {sendingId === ticket.id ? "..." : "Enviar"}
                  </button>
                  <button
                    onClick={() => setResendId(null)}
                    className="text-culpa-cream/40 text-xs uppercase tracking-wider px-2"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
            <div className="text-right flex flex-col items-end gap-2">
              <span className={`text-xs uppercase tracking-wider font-bold ${statusColors[ticket.status] || "text-culpa-cream/40"}`}>
                {ticket.status}
              </span>
              <p className="text-culpa-cream/30 text-xs">
                {formatDateTime(ticket.createdAt)}
              </p>
              {ticket.qrSignedJwt && resendId !== ticket.id && (
                <button
                  onClick={() => openResend(ticket)}
                  className="border border-culpa-cream/20 text-culpa-cream text-xs uppercase tracking-wider font-bold px-3 py-1 hover:border-culpa-lcd transition-colors"
                >
                  Reenviar QR
                </button>
              )}
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
