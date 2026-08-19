"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatEventDateTime, formatDateShort, localInputToUtc } from "@/lib/date";

interface TicketType {
  id: string;
  name: string;
  price: number;
  currency: string;
  capacity: number | null;
  validUntil: string | null;
  isOffered: boolean;
  sortOrder: number;
  _count: { tickets: number };
  invitationCount: number;
}

interface Event {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  date: string;
  location: string | null;
  locationRevealed: boolean;
  isActive: boolean;
  isPublic: boolean;
  ticketTypes: TicketType[];
}

export default function AdminEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [ttForm, setTtForm] = useState({ name: "", price: "", currency: "UYU", capacity: "", validUntil: "", autoApproveWhitelist: true });
  const [showTtForm, setShowTtForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const loadEvent = useCallback(async () => {
    const res = await fetch(`/api/admin/events/${id}`);
    if (res.ok) setEvent(await res.json());
  }, [id]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  async function handleToggleActive() {
    if (!event) return;
    await fetch(`/api/admin/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !event.isActive }),
    });
    loadEvent();
  }

  async function handleToggleLocation() {
    if (!event) return;
    await fetch(`/api/admin/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locationRevealed: !event.locationRevealed }),
    });
    loadEvent();
  }

  async function handleTogglePublic() {
    if (!event) return;
    await fetch(`/api/admin/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !event.isPublic }),
    });
    loadEvent();
  }

  async function handleAddTicketType(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/admin/events/${id}/ticket-types`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: ttForm.name,
        price: Math.round(parseFloat(ttForm.price) * 100),
        currency: ttForm.currency,
        capacity: ttForm.capacity ? parseInt(ttForm.capacity) : null,
        validUntil: ttForm.validUntil ? localInputToUtc(ttForm.validUntil).toISOString() : null,
        autoApproveWhitelist: ttForm.autoApproveWhitelist,
      }),
    });
    setTtForm({ name: "", price: "", currency: "UYU", capacity: "", validUntil: "", autoApproveWhitelist: true });
    setShowTtForm(false);
    setLoading(false);
    loadEvent();
  }

  async function handleToggleOffered(ticketTypeId: string, isOffered: boolean) {
    await fetch(`/api/admin/events/${id}/ticket-types/${ticketTypeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOffered: !isOffered }),
    });
    loadEvent();
  }

  async function handleDeleteTicketType(ticketTypeId: string) {
    if (!confirm("¿Eliminar este tipo de ticket?")) return;
    await fetch(`/api/admin/events/${id}/ticket-types/${ticketTypeId}`, {
      method: "DELETE",
    });
    loadEvent();
  }

  async function handleApproveAll(ticketTypeId: string) {
    if (!confirm("¿Dar acceso a todas las personas de la lista para este tipo de ticket?")) return;
    setApprovingId(ticketTypeId);
    const res = await fetch(`/api/admin/events/${id}/ticket-types/${ticketTypeId}/approve-all`, {
      method: "POST",
    });
    if (res.ok) {
      const { approved } = await res.json();
      alert(`Se otorgó acceso a ${approved} ${approved === 1 ? "persona" : "personas"} de la lista.`);
    }
    setApprovingId(null);
  }

  async function handleDeleteEvent() {
    if (!confirm("¿Eliminar este evento? Esta acción no se puede deshacer.")) return;
    await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
    router.push("/admin/events");
  }

  if (!event) return <div className="text-culpa-cream/50">Cargando...</div>;

  const eventUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/event/${event.slug}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="culpa-heading text-xl text-culpa-cream">
            {event.name}
          </h1>
          <p className="text-culpa-cream/50 text-sm mt-1">
            {formatEventDateTime(event.date)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleToggleActive}
            className={`text-sm uppercase tracking-wider font-bold px-4 py-2 ${
              event.isActive
                ? "bg-green-700 text-culpa-cream"
                : "bg-culpa-cream/10 text-culpa-cream/50"
            }`}
          >
            {event.isActive ? "Activo" : "Inactivo"}
          </button>
          <button
            onClick={handleTogglePublic}
            title={event.isPublic ? "Cualquiera puede comprar" : "Solo lista de invitados"}
            className={`text-sm uppercase tracking-wider font-bold px-4 py-2 ${
              event.isPublic
                ? "bg-blue-700 text-culpa-cream"
                : "bg-culpa-cream/10 text-culpa-cream/50"
            }`}
          >
            {event.isPublic ? "Público" : "Privado"}
          </button>
          <button
            onClick={handleDeleteEvent}
            className="bg-red-900 text-culpa-cream text-sm uppercase tracking-wider font-bold px-4 py-2 hover:bg-red-800"
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Event Link */}
      <div className="bg-culpa-cream/5 border border-culpa-cream/10 p-4 mb-6">
        <p className="text-culpa-cream/60 text-xs uppercase tracking-widest mb-1">Link del Evento</p>
        <p className="text-culpa-lime font-mono text-sm break-all">{eventUrl}</p>
      </div>

      {/* Location */}
      {event.location && (
        <div className="bg-culpa-cream/5 border border-culpa-cream/10 p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-culpa-cream/60 text-xs uppercase tracking-widest mb-1">Ubicación</p>
            <p className="text-culpa-cream">{event.location}</p>
          </div>
          <button
            onClick={handleToggleLocation}
            className={`text-xs uppercase tracking-wider font-bold px-3 py-1 ${
              event.locationRevealed
                ? "bg-green-700 text-culpa-cream"
                : "bg-yellow-700 text-culpa-cream"
            }`}
          >
            {event.locationRevealed ? "Revelada" : "Secreta"}
          </button>
        </div>
      )}

      {/* Ticket Types */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="culpa-heading text-base text-culpa-cream">
            Tipos de Ticket
          </h2>
          <button
            onClick={() => setShowTtForm(!showTtForm)}
            className="bg-culpa-blue text-culpa-cream font-bold uppercase tracking-wider text-xs px-4 py-2 hover:bg-culpa-blue-dark transition-colors"
          >
            {showTtForm ? "Cancelar" : "+ Agregar Tipo"}
          </button>
        </div>

        {showTtForm && (
          <form onSubmit={handleAddTicketType} className="bg-culpa-cream/5 border border-culpa-cream/10 p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-culpa-cream/60 text-xs uppercase tracking-widest mb-1">Nombre <span className="text-culpa-lime">*</span></label>
                <input
                  type="text"
                  value={ttForm.name}
                  onChange={(e) => setTtForm({ ...ttForm, name: e.target.value })}
                  placeholder="e.g., VIP"
                  className="w-full bg-culpa-cream/10 border border-culpa-cream/20 text-culpa-cream px-3 py-2 text-sm focus:outline-none focus:border-culpa-lime"
                  required
                />
              </div>
              <div>
                <label className="block text-culpa-cream/60 text-xs uppercase tracking-widest mb-1">Precio <span className="text-culpa-lime">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={ttForm.price}
                  onChange={(e) => setTtForm({ ...ttForm, price: e.target.value })}
                  placeholder="0 = gratis"
                  className="w-full bg-culpa-cream/10 border border-culpa-cream/20 text-culpa-cream px-3 py-2 text-sm focus:outline-none focus:border-culpa-lime"
                  required
                />
              </div>
              <div>
                <label className="block text-culpa-cream/60 text-xs uppercase tracking-widest mb-1">Moneda</label>
                <select
                  value={ttForm.currency}
                  onChange={(e) => setTtForm({ ...ttForm, currency: e.target.value })}
                  className="w-full bg-culpa-cream/10 border border-culpa-cream/20 text-culpa-cream px-3 py-2 text-sm focus:outline-none focus:border-culpa-lime"
                >
                  <option value="UYU">UYU</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div>
                <label className="block text-culpa-cream/60 text-xs uppercase tracking-widest mb-1">Capacidad (opcional)</label>
                <input
                  type="number"
                  min="1"
                  value={ttForm.capacity}
                  onChange={(e) => setTtForm({ ...ttForm, capacity: e.target.value })}
                  placeholder="Vacío = ilimitado"
                  className="w-full bg-culpa-cream/10 border border-culpa-cream/20 text-culpa-cream px-3 py-2 text-sm focus:outline-none focus:border-culpa-lime"
                />
              </div>
              <div>
                <label className="block text-culpa-cream/60 text-xs uppercase tracking-widest mb-1">Ticket válido hasta (opcional)</label>
                <input
                  type="datetime-local"
                  value={ttForm.validUntil}
                  onChange={(e) => setTtForm({ ...ttForm, validUntil: e.target.value })}
                  className="w-full bg-culpa-cream/10 border border-culpa-cream/20 text-culpa-cream px-3 py-2 text-sm focus:outline-none focus:border-culpa-lime"
                  placeholder="Sin vencimiento"
                />
                <p className="text-culpa-cream/30 text-xs mt-1">Hora de Montevideo — hasta cuándo se puede escanear el ticket</p>
              </div>
            </div>
            <label className="flex items-center gap-2 text-culpa-cream/70 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={ttForm.autoApproveWhitelist}
                onChange={(e) => setTtForm({ ...ttForm, autoApproveWhitelist: e.target.checked })}
                className="accent-culpa-lime w-4 h-4"
              />
              Dar acceso a todas las personas de la lista
            </label>
            <button
              type="submit"
              disabled={loading}
              className="bg-culpa-blue text-culpa-cream font-bold uppercase tracking-wider text-xs px-4 py-2 hover:bg-culpa-blue-dark disabled:opacity-50"
            >
              {loading ? "Agregando..." : "Agregar Tipo de Ticket"}
            </button>
          </form>
        )}

        <div className="space-y-2">
          {event.ticketTypes.map((tt) => (
            <div
              key={tt.id}
              className="bg-culpa-cream/5 border border-culpa-cream/10 p-4 flex items-center justify-between"
            >
              <div>
                <span className="text-culpa-cream font-bold uppercase tracking-wider">
                  {tt.name}
                </span>
                {!tt.isOffered && (
                  <span className="text-yellow-400/80 ml-3 text-xs uppercase tracking-wider border border-yellow-400/40 px-2 py-0.5">
                    Agotado
                  </span>
                )}
                <span className="text-culpa-cream/50 ml-4">
                  {tt.price === 0
                    ? "GRATIS"
                    : new Intl.NumberFormat("es-UY", {
                        style: "currency",
                        currency: tt.currency,
                        minimumFractionDigits: 0,
                      }).format(tt.price / 100)}
                </span>
                {tt.capacity && (
                  <span className="text-culpa-cream/30 ml-4 text-sm">
                    Cap.: {tt.capacity}
                  </span>
                )}
                {tt.validUntil && (
                  <span className="text-yellow-400/70 ml-4 text-sm">
                    Válido hasta: {formatDateShort(tt.validUntil)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-culpa-cream/40 text-sm">
                  {tt._count.tickets} vendidos
                  <span className="text-culpa-cream/25">
                    {" · "}
                    {tt.invitationCount} invitaciones
                  </span>
                </span>
                <button
                  onClick={() => handleToggleOffered(tt.id, tt.isOffered)}
                  title={tt.isOffered ? "Quitar de la venta (se mostrará agotado)" : "Volver a ofrecer"}
                  className={`text-xs uppercase tracking-wider font-bold px-3 py-1 ${
                    tt.isOffered
                      ? "bg-green-700 text-culpa-cream"
                      : "bg-yellow-700 text-culpa-cream"
                  }`}
                >
                  {tt.isOffered ? "En venta" : "Agotado"}
                </button>
                <button
                  onClick={() => handleApproveAll(tt.id)}
                  disabled={approvingId === tt.id}
                  className="text-green-400 text-xs uppercase tracking-wider hover:text-green-300 disabled:opacity-50"
                >
                  {approvingId === tt.id ? "Otorgando..." : "Otorgar a Todos"}
                </button>
                <button
                  onClick={() => handleDeleteTicketType(tt.id)}
                  className="text-red-400 text-xs uppercase tracking-wider hover:text-red-300"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
          {event.ticketTypes.length === 0 && (
            <p className="text-culpa-cream/30 text-center py-4">No hay tipos de ticket todavía</p>
          )}
        </div>
      </div>
    </div>
  );
}
