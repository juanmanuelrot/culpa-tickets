"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface TicketType {
  id: string;
  name: string;
  price: number;
  currency: string;
  event: { id: string; name: string };
}

interface AllowedTT {
  id: string;
  ticketTypeId: string;
  ticketType: TicketType;
}

interface Person {
  id: string;
  govIdNumber: string;
  name: string;
  email: string;
  instagramHandle: string | null;
  allowedTicketTypes: AllowedTT[];
  tickets: Array<{
    id: string;
    status: string;
    ticketType: { name: string };
    event: { name: string };
  }>;
}

interface EventWithTypes {
  id: string;
  name: string;
  ticketTypes: Array<{ id: string; name: string; price: number; currency: string }>;
}

export default function AdminWhitelistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [person, setPerson] = useState<Person | null>(null);
  const [events, setEvents] = useState<EventWithTypes[]>([]);
  const [selectedTicketTypes, setSelectedTicketTypes] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const loadPerson = useCallback(async () => {
    const res = await fetch(`/api/admin/whitelist/${id}`);
    if (res.ok) {
      const data = await res.json();
      setPerson(data);
      setSelectedTicketTypes(new Set(data.allowedTicketTypes.map((att: AllowedTT) => att.ticketTypeId)));
    }
  }, [id]);

  useEffect(() => {
    loadPerson();
    fetch("/api/admin/events")
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []));
  }, [loadPerson]);

  async function handleSavePermissions() {
    setSaving(true);
    await fetch(`/api/admin/whitelist/${id}/ticket-types`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketTypeIds: Array.from(selectedTicketTypes) }),
    });
    setSaving(false);
    loadPerson();
  }

  function toggleTicketType(ttId: string) {
    const next = new Set(selectedTicketTypes);
    if (next.has(ttId)) next.delete(ttId);
    else next.add(ttId);
    setSelectedTicketTypes(next);
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar a esta persona de la lista?")) return;
    await fetch(`/api/admin/whitelist/${id}`, { method: "DELETE" });
    router.push("/admin/whitelist");
  }

  if (!person) return <div className="text-culpa-cream/50">Cargando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="culpa-heading text-xl text-culpa-cream">
            {person.name}
          </h1>
          <p className="text-culpa-cream/50 font-mono text-sm mt-1">{person.govIdNumber}</p>
        </div>
        <button
          onClick={handleDelete}
          className="bg-red-900 text-culpa-cream text-sm uppercase tracking-wider font-bold px-4 py-2 hover:bg-red-800"
        >
          Eliminar
        </button>
      </div>

      {/* Info */}
      <div className="bg-culpa-cream/5 border border-culpa-cream/10 p-5 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-culpa-cream/40 text-xs uppercase tracking-widest">Correo</p>
            <p className="text-culpa-cream mt-1">{person.email}</p>
          </div>
          <div>
            <p className="text-culpa-cream/40 text-xs uppercase tracking-widest">Instagram</p>
            <p className="text-culpa-cream mt-1">{person.instagramHandle || "—"}</p>
          </div>
        </div>
      </div>

      {/* Ticket Type Permissions */}
      <div className="mb-8">
        <h2 className="culpa-heading text-base text-culpa-cream mb-4">
          Tipos de Ticket Permitidos
        </h2>
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="bg-culpa-cream/5 border border-culpa-cream/10 p-4">
              <p className="text-culpa-cream font-bold uppercase tracking-wider text-sm mb-3">
                {event.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {event.ticketTypes.map((tt) => (
                  <button
                    key={tt.id}
                    onClick={() => toggleTicketType(tt.id)}
                    className={`px-3 py-1.5 text-xs uppercase tracking-wider font-bold border transition-colors ${
                      selectedTicketTypes.has(tt.id)
                        ? "bg-culpa-blue border-culpa-lime text-culpa-cream"
                        : "bg-transparent border-culpa-cream/20 text-culpa-cream/40 hover:border-culpa-cream/40"
                    }`}
                  >
                    {tt.name}
                    {tt.price > 0 &&
                      ` (${new Intl.NumberFormat("es-UY", { style: "currency", currency: tt.currency, minimumFractionDigits: 0 }).format(tt.price / 100)})`}
                  </button>
                ))}
                {event.ticketTypes.length === 0 && (
                  <p className="text-culpa-cream/20 text-xs">Sin tipos de ticket</p>
                )}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={handleSavePermissions}
          disabled={saving}
          className="mt-4 bg-culpa-blue text-culpa-cream font-bold uppercase tracking-wider text-sm px-6 py-3 hover:bg-culpa-blue-dark transition-colors disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar Permisos"}
        </button>
      </div>

      {/* Tickets */}
      <div>
        <h2 className="culpa-heading text-base text-culpa-cream mb-4">
          Tickets
        </h2>
        <div className="space-y-2">
          {person.tickets.map((ticket) => (
            <div key={ticket.id} className="bg-culpa-cream/5 border border-culpa-cream/10 p-3 flex items-center justify-between">
              <div>
                <span className="text-culpa-cream text-sm">{ticket.event.name}</span>
                <span className="text-culpa-cream/40 text-sm ml-2">— {ticket.ticketType.name}</span>
              </div>
              <span
                className={`text-xs uppercase tracking-wider font-bold ${
                  ticket.status === "PAID"
                    ? "text-green-400"
                    : ticket.status === "USED"
                    ? "text-blue-400"
                    : ticket.status === "CANCELLED"
                    ? "text-red-400"
                    : "text-yellow-400"
                }`}
              >
                {ticket.status}
              </span>
            </div>
          ))}
          {person.tickets.length === 0 && (
            <p className="text-culpa-cream/30 text-center py-4">Sin tickets todavía</p>
          )}
        </div>
      </div>
    </div>
  );
}
