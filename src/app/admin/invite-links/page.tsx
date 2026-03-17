"use client";

import { useEffect, useState, useCallback } from "react";

interface InviteLink {
  id: string;
  token: string;
  eventId: string;
  ticketTypeId: string;
  expiresAt: string;
  ticketValidUntil: string | null;
  maxUses: number;
  usedCount: number;
  createdAt: string;
}

interface EventWithTypes {
  id: string;
  name: string;
  ticketTypes: Array<{ id: string; name: string }>;
}

export default function AdminInviteLinksPage() {
  const [links, setLinks] = useState<InviteLink[]>([]);
  const [events, setEvents] = useState<EventWithTypes[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    eventId: "",
    ticketTypeId: "",
    expiresAt: "",
    ticketValidUntil: "",
    maxUses: "1",
  });
  const [loading, setLoading] = useState(false);

  const loadLinks = useCallback(async () => {
    const res = await fetch("/api/admin/invite-links");
    const data = await res.json();
    setLinks(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    loadLinks();
    fetch("/api/admin/events")
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []));
  }, [loadLinks]);

  const selectedEvent = events.find((e) => e.id === formData.eventId);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/invite-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: formData.eventId,
        ticketTypeId: formData.ticketTypeId,
        expiresAt: formData.expiresAt,
        ticketValidUntil: formData.ticketValidUntil || null,
        maxUses: parseInt(formData.maxUses),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      alert(`Invite link created!\n\n${data.url}`);
    }
    setFormData({ eventId: "", ticketTypeId: "", expiresAt: "", ticketValidUntil: "", maxUses: "1" });
    setShowForm(false);
    setLoading(false);
    loadLinks();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this invite link?")) return;
    await fetch(`/api/admin/invite-links/${id}`, { method: "DELETE" });
    loadLinks();
  }

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black uppercase tracking-wider text-white">
          Invite Links
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-fyf-red text-white font-bold uppercase tracking-wider text-sm px-6 py-3 hover:bg-fyf-red-dark transition-colors"
        >
          {showForm ? "Cancel" : "+ Generate Link"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white/5 border border-white/10 p-6 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-widest mb-1">Event</label>
              <select
                value={formData.eventId}
                onChange={(e) => setFormData({ ...formData, eventId: e.target.value, ticketTypeId: "" })}
                className="w-full bg-white/10 border border-white/20 text-white px-3 py-2 focus:outline-none focus:border-fyf-red"
                required
              >
                <option value="">Select event</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-widest mb-1">Ticket Type</label>
              <select
                value={formData.ticketTypeId}
                onChange={(e) => setFormData({ ...formData, ticketTypeId: e.target.value })}
                className="w-full bg-white/10 border border-white/20 text-white px-3 py-2 focus:outline-none focus:border-fyf-red"
                required
                disabled={!formData.eventId}
              >
                <option value="">Select type</option>
                {selectedEvent?.ticketTypes.map((tt) => (
                  <option key={tt.id} value={tt.id}>{tt.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-widest mb-1">Expires At</label>
              <input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full bg-white/10 border border-white/20 text-white px-3 py-2 focus:outline-none focus:border-fyf-red"
                required
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-widest mb-1">Max Uses</label>
              <input
                type="number"
                min="1"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                className="w-full bg-white/10 border border-white/20 text-white px-3 py-2 focus:outline-none focus:border-fyf-red"
                required
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-widest mb-1">Ticket Valid Until</label>
              <input
                type="datetime-local"
                value={formData.ticketValidUntil}
                onChange={(e) => setFormData({ ...formData, ticketValidUntil: e.target.value })}
                className="w-full bg-white/10 border border-white/20 text-white px-3 py-2 focus:outline-none focus:border-fyf-red"
              />
              <p className="text-white/30 text-xs mt-1">Optional — when tickets expire for scanning</p>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-fyf-red text-white font-bold uppercase tracking-wider text-sm px-6 py-3 hover:bg-fyf-red-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Link"}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {links.map((link) => (
          <div key={link.id} className="bg-white/5 border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-fyf-red font-mono text-sm break-all">
                  {appUrl}/invite/{link.token}
                </p>
                <p className="text-white/40 text-xs mt-1">
                  Uses: {link.usedCount}/{link.maxUses} | Link expires:{" "}
                  {new Date(link.expiresAt).toLocaleString("es-AR")}
                  {link.ticketValidUntil && (
                    <span className="text-yellow-400/70"> | Ticket valid until: {new Date(link.ticketValidUntil).toLocaleString("es-AR")}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigator.clipboard.writeText(`${appUrl}/invite/${link.token}`)}
                  className="text-white/50 text-xs uppercase tracking-wider hover:text-white"
                >
                  Copy
                </button>
                <button
                  onClick={() => handleDelete(link.id)}
                  className="text-red-400 text-xs uppercase tracking-wider hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {links.length === 0 && (
          <p className="text-white/30 text-center py-8">No invite links yet</p>
        )}
      </div>
    </div>
  );
}
