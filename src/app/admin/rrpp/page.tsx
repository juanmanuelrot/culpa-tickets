"use client";

import { useEffect, useState } from "react";

interface Promoter {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  ticketCount: number;
}

interface EventOption {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

async function fetchPromoters(eventId: string): Promise<Promoter[]> {
  const query = eventId ? `?eventId=${eventId}` : "";
  const res = await fetch(`/api/admin/promoters${query}`);
  return res.json();
}

export default function PromotersPage() {
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [eventId, setEventId] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", code: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function loadPromoters() {
    setPromoters(await fetchPromoters(eventId));
  }

  // Arranca mostrando el evento activo más reciente, que es el que se está vendiendo.
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/events");
      const data: EventOption[] = await res.json();
      setEvents(data);
      const current = data.find((ev) => ev.isActive);
      if (current) setEventId(current.id);
    })();
  }, []);

  // El cancelled evita que una respuesta vieja pise la del evento recién elegido.
  useEffect(() => {
    let cancelled = false;
    fetchPromoters(eventId).then((data) => {
      if (cancelled) return;
      setPromoters(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/admin/promoters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setForm({ name: "", code: "" });
      setShowForm(false);
      loadPromoters();
    } else {
      const data = await res.json();
      setError(data.error || "Error al crear RRPP");
    }
    setSubmitting(false);
  }

  async function toggleActive(promoter: Promoter) {
    await fetch(`/api/admin/promoters/${promoter.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !promoter.isActive }),
    });
    loadPromoters();
  }

  const selectedEvent = events.find((ev) => ev.id === eventId);
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  function promoterLink(promoter: Promoter) {
    return selectedEvent
      ? `${appUrl}/event/${selectedEvent.slug}?rrpp=${promoter.code}`
      : "";
  }

  async function copyLink(promoter: Promoter) {
    await navigator.clipboard.writeText(promoterLink(promoter));
    setCopiedId(promoter.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  const total = promoters.reduce((sum, p) => sum + p.ticketCount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="culpa-heading text-xl text-culpa-cream">RRPP</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-culpa-body text-culpa-cream px-4 py-2 text-sm uppercase tracking-widest font-bold hover:opacity-80 transition-opacity"
        >
          {showForm ? "Cancelar" : "Nuevo RRPP"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-culpa-cream/5 border border-culpa-cream/10 p-6 mb-8 space-y-4">
          <h2 className="culpa-heading text-sm text-culpa-cream mb-2">Crear RRPP</h2>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-culpa-cream/60 text-xs uppercase tracking-widest mb-1">Nombre</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-culpa-cream/10 border border-culpa-cream/20 text-culpa-cream px-3 py-2 text-sm focus:outline-none focus:border-culpa-lcd"
              />
            </div>
            <div>
              <label className="block text-culpa-cream/60 text-xs uppercase tracking-widest mb-1">Código</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="Si lo dejás vacío, sale del nombre"
                className="w-full bg-culpa-cream/10 border border-culpa-cream/20 text-culpa-cream px-3 py-2 text-sm placeholder:text-culpa-cream/30 focus:outline-none focus:border-culpa-lcd"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-culpa-body text-culpa-cream px-6 py-2 text-sm uppercase tracking-widest font-bold hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Creando..." : "Crear RRPP"}
          </button>
        </form>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <label className="block text-culpa-cream/60 text-xs uppercase tracking-widest mb-1">Evento</label>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="bg-culpa-cream/10 border border-culpa-cream/20 text-culpa-cream px-3 py-2 text-sm focus:outline-none focus:border-culpa-lcd"
          >
            <option value="">Todos los eventos</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
        </div>
        <p className="text-culpa-cream/60 text-sm">
          Total por RRPP: <span className="text-culpa-cream font-bold">{total}</span>
        </p>
      </div>

      {loading ? (
        <p className="text-culpa-cream/40">Cargando...</p>
      ) : promoters.length === 0 ? (
        <p className="text-culpa-cream/40">Todavía no hay RRPP.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-culpa-cream/10">
                <th className="text-culpa-cream/60 text-xs uppercase tracking-widest py-3 pr-4">Nombre</th>
                <th className="text-culpa-cream/60 text-xs uppercase tracking-widest py-3 pr-4">Código</th>
                <th className="text-culpa-cream/60 text-xs uppercase tracking-widest py-3 pr-4">Entradas</th>
                <th className="text-culpa-cream/60 text-xs uppercase tracking-widest py-3 pr-4">Link</th>
                <th className="text-culpa-cream/60 text-xs uppercase tracking-widest py-3"></th>
              </tr>
            </thead>
            <tbody>
              {promoters.map((promoter) => (
                <tr
                  key={promoter.id}
                  className={`border-b border-culpa-cream/5 ${promoter.isActive ? "" : "opacity-40"}`}
                >
                  <td className="text-culpa-cream py-3 pr-4 text-sm">{promoter.name}</td>
                  <td className="text-culpa-cream/70 py-3 pr-4 text-sm font-mono">{promoter.code}</td>
                  <td className="text-culpa-cream py-3 pr-4 text-sm font-bold">{promoter.ticketCount}</td>
                  <td className="py-3 pr-4">
                    {selectedEvent && promoter.isActive ? (
                      <button
                        onClick={() => copyLink(promoter)}
                        title={promoterLink(promoter)}
                        className="text-culpa-lcd hover:opacity-80 text-xs uppercase tracking-widest font-bold transition-opacity"
                      >
                        {copiedId === promoter.id ? "¡Copiado!" : "Copiar link"}
                      </button>
                    ) : (
                      <span className="text-culpa-cream/30 text-xs">
                        {promoter.isActive ? "Elegí un evento" : "—"}
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => toggleActive(promoter)}
                      className="text-culpa-cream/60 hover:text-culpa-cream text-xs uppercase tracking-widest font-bold transition-colors"
                    >
                      {promoter.isActive ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
