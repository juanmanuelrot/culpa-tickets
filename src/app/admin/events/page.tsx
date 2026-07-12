"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatEventDateTime, localInputToUtc } from "@/lib/date";

interface Event {
  id: string;
  name: string;
  slug: string;
  date: string;
  isActive: boolean;
  isPublic: boolean;
  _count: { tickets: number };
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", date: "", description: "", location: "", isPublic: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    const res = await fetch("/api/admin/events");
    const data = await res.json();
    setEvents(Array.isArray(data) ? data : []);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        date: localInputToUtc(formData.date).toISOString(),
      }),
    });
    setFormData({ name: "", date: "", description: "", location: "", isPublic: false });
    setShowForm(false);
    setLoading(false);
    loadEvents();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black uppercase tracking-wider text-white">
          Eventos
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-fyf-red text-white font-bold uppercase tracking-wider text-sm px-6 py-3 hover:bg-fyf-red-dark transition-colors"
        >
          {showForm ? "Cancelar" : "+ Nuevo Evento"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white/5 border border-white/10 p-6 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-widest mb-1">Nombre <span className="text-fyf-red">*</span></label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white/10 border border-white/20 text-white px-3 py-2 focus:outline-none focus:border-fyf-red"
                required
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-widest mb-1">Fecha del evento <span className="text-fyf-red">*</span></label>
              <input
                type="datetime-local"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-white/10 border border-white/20 text-white px-3 py-2 focus:outline-none focus:border-fyf-red"
                required
              />
              <p className="text-white/30 text-xs mt-1">Hora de Montevideo</p>
            </div>
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-widest mb-1">Ubicación (opcional)</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-white/10 border border-white/20 text-white px-3 py-2 focus:outline-none focus:border-fyf-red"
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-widest mb-1">Descripción (opcional)</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-white/10 border border-white/20 text-white px-3 py-2 focus:outline-none focus:border-fyf-red"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-white/70 text-sm cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="accent-fyf-red w-4 h-4"
            />
            Evento público (cualquiera puede comprar, sin lista de invitados)
          </label>
          <button
            type="submit"
            disabled={loading}
            className="bg-fyf-red text-white font-bold uppercase tracking-wider text-sm px-6 py-3 hover:bg-fyf-red-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear Evento"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/admin/events/${event.id}`}
            className="block bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg uppercase tracking-wider">
                  {event.name}
                </h3>
                <p className="text-white/50 text-sm mt-1">
                  {formatEventDateTime(event.date)}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-xs uppercase tracking-wider font-bold ${event.isActive ? "text-green-400" : "text-white/30"}`}>
                  {event.isActive ? "Activo" : "Inactivo"}
                </span>
                <span className={`block text-xs uppercase tracking-wider font-bold mt-0.5 ${event.isPublic ? "text-blue-300" : "text-white/30"}`}>
                  {event.isPublic ? "Público" : "Privado"}
                </span>
                <p className="text-white/50 text-sm mt-1">
                  {event._count.tickets} tickets
                </p>
              </div>
            </div>
            <p className="text-white/40 text-xs mt-2 font-mono">
              /event/{event.slug}
            </p>
          </Link>
        ))}
        {events.length === 0 && (
          <p className="text-white/30 text-center py-8">No hay eventos todavía</p>
        )}
      </div>
    </div>
  );
}
