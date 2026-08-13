"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface TicketTypeOption {
  id: string;
  name: string;
  price: number;
  currency: string;
  event: { id: string; name: string };
}

interface WhitelistedPerson {
  id: string;
  govIdNumber: string;
  name: string;
  email: string;
  instagramHandle: string | null;
  _count: { tickets: number };
}

export default function AdminWhitelistPage() {
  const [people, setPeople] = useState<WhitelistedPerson[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    govIdNumber: "",
    name: "",
    email: "",
    instagramHandle: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ticketTypes, setTicketTypes] = useState<TicketTypeOption[]>([]);
  const [selectedTicketTypeIds, setSelectedTicketTypeIds] = useState<string[]>([]);

  const loadPeople = useCallback(async () => {
    const res = await fetch(`/api/admin/whitelist?search=${encodeURIComponent(search)}`);
    const data = await res.json();
    setPeople(data.people || []);
    setTotal(data.total || 0);
  }, [search]);

  const loadTicketTypes = useCallback(async () => {
    const res = await fetch("/api/admin/whitelist/ticket-type-options");
    if (res.ok) {
      const data = await res.json();
      setTicketTypes(data);
      setSelectedTicketTypeIds(data.map((tt: TicketTypeOption) => tt.id));
    }
  }, []);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, ticketTypeIds: selectedTicketTypeIds }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al agregar");
      setLoading(false);
      return;
    }

    setFormData({ govIdNumber: "", name: "", email: "", instagramHandle: "" });
    setSelectedTicketTypeIds([]);
    setShowForm(false);
    setLoading(false);
    loadPeople();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="culpa-heading text-xl text-culpa-cream">
            Lista
          </h1>
          <p className="text-culpa-cream/40 text-sm mt-1">{total} personas</p>
        </div>
        <button
          onClick={() => {
            if (!showForm) loadTicketTypes();
            setShowForm(!showForm);
          }}
          className="bg-culpa-blue text-culpa-cream font-bold uppercase tracking-wider text-sm px-6 py-3 hover:bg-culpa-blue-dark transition-colors"
        >
          {showForm ? "Cancelar" : "+ Agregar Persona"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-culpa-cream/5 border border-culpa-cream/10 p-6 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-culpa-cream/60 text-xs uppercase tracking-widest mb-1">Nro. Documento</label>
              <input
                type="text"
                value={formData.govIdNumber}
                onChange={(e) => setFormData({ ...formData, govIdNumber: e.target.value })}
                className="w-full bg-culpa-cream/10 border border-culpa-cream/20 text-culpa-cream px-3 py-2 focus:outline-none focus:border-culpa-lime"
                required
              />
            </div>
            <div>
              <label className="block text-culpa-cream/60 text-xs uppercase tracking-widest mb-1">Nombre</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-culpa-cream/10 border border-culpa-cream/20 text-culpa-cream px-3 py-2 focus:outline-none focus:border-culpa-lime"
                required
              />
            </div>
            <div>
              <label className="block text-culpa-cream/60 text-xs uppercase tracking-widest mb-1">Correo</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-culpa-cream/10 border border-culpa-cream/20 text-culpa-cream px-3 py-2 focus:outline-none focus:border-culpa-lime"
                required
              />
            </div>
            <div>
              <label className="block text-culpa-cream/60 text-xs uppercase tracking-widest mb-1">Instagram (opcional)</label>
              <input
                type="text"
                value={formData.instagramHandle}
                onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                className="w-full bg-culpa-cream/10 border border-culpa-cream/20 text-culpa-cream px-3 py-2 focus:outline-none focus:border-culpa-lime"
              />
            </div>
          </div>
          {ticketTypes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-culpa-cream/60 text-xs uppercase tracking-widest">Acceso a Tickets</label>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedTicketTypeIds(
                      selectedTicketTypeIds.length === ticketTypes.length
                        ? []
                        : ticketTypes.map((tt) => tt.id)
                    )
                  }
                  className="text-culpa-lime text-xs uppercase tracking-wider hover:text-culpa-blue-dark"
                >
                  {selectedTicketTypeIds.length === ticketTypes.length ? "Deseleccionar Todo" : "Seleccionar Todo"}
                </button>
              </div>
              <div className="space-y-2">
                {ticketTypes.map((tt) => (
                  <label key={tt.id} className="flex items-center gap-2 text-culpa-cream/70 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTicketTypeIds.includes(tt.id)}
                      onChange={(e) =>
                        setSelectedTicketTypeIds(
                          e.target.checked
                            ? [...selectedTicketTypeIds, tt.id]
                            : selectedTicketTypeIds.filter((id) => id !== tt.id)
                        )
                      }
                      className="accent-culpa-lime w-4 h-4"
                    />
                    <span className="text-culpa-cream font-bold">{tt.event.name}</span>
                    <span className="text-culpa-cream/50">—</span>
                    <span>{tt.name}</span>
                    <span className="text-culpa-cream/40">
                      {tt.price === 0
                        ? "(Gratis)"
                        : `(${new Intl.NumberFormat("es-UY", { style: "currency", currency: tt.currency, minimumFractionDigits: 0 }).format(tt.price / 100)})`}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-culpa-blue text-culpa-cream font-bold uppercase tracking-wider text-sm px-6 py-3 hover:bg-culpa-blue-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Agregando..." : "Agregar a la Lista"}
          </button>
        </form>
      )}

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre, documento, correo o Instagram..."
        className="w-full bg-culpa-cream/5 border border-culpa-cream/10 text-culpa-cream px-4 py-3 mb-6 focus:outline-none focus:border-culpa-lime"
      />

      {/* List */}
      <div className="space-y-2">
        {people.map((person) => (
          <Link
            key={person.id}
            href={`/admin/whitelist/${person.id}`}
            className="block bg-culpa-cream/5 border border-culpa-cream/10 p-4 hover:bg-culpa-cream/10 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-culpa-cream font-bold">{person.name}</span>
                <span className="text-culpa-cream/40 ml-3 text-sm font-mono">
                  {person.govIdNumber}
                </span>
              </div>
              <div className="text-right">
                <span className="text-culpa-cream/40 text-sm">
                  {person._count.tickets} tickets
                </span>
              </div>
            </div>
            <div className="text-culpa-cream/30 text-sm mt-1">
              {person.email}
              {person.instagramHandle && (
                <span className="ml-3">@{person.instagramHandle}</span>
              )}
            </div>
          </Link>
        ))}
        {people.length === 0 && (
          <p className="text-culpa-cream/30 text-center py-8">No hay nadie en la lista todavía</p>
        )}
      </div>
    </div>
  );
}
