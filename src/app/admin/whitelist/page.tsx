"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

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

  const loadPeople = useCallback(async () => {
    const res = await fetch(`/api/admin/whitelist?search=${encodeURIComponent(search)}`);
    const data = await res.json();
    setPeople(data.people || []);
    setTotal(data.total || 0);
  }, [search]);

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
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to add");
      setLoading(false);
      return;
    }

    setFormData({ govIdNumber: "", name: "", email: "", instagramHandle: "" });
    setShowForm(false);
    setLoading(false);
    loadPeople();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-wider text-white">
            Whitelist
          </h1>
          <p className="text-white/40 text-sm mt-1">{total} people</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-fyf-red text-white font-bold uppercase tracking-wider text-sm px-6 py-3 hover:bg-fyf-red-dark transition-colors"
        >
          {showForm ? "Cancel" : "+ Add Person"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white/5 border border-white/10 p-6 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-widest mb-1">ID Number</label>
              <input
                type="text"
                value={formData.govIdNumber}
                onChange={(e) => setFormData({ ...formData, govIdNumber: e.target.value })}
                className="w-full bg-white/10 border border-white/20 text-white px-3 py-2 focus:outline-none focus:border-fyf-red"
                required
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-widest mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white/10 border border-white/20 text-white px-3 py-2 focus:outline-none focus:border-fyf-red"
                required
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-widest mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white/10 border border-white/20 text-white px-3 py-2 focus:outline-none focus:border-fyf-red"
                required
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-widest mb-1">Instagram (optional)</label>
              <input
                type="text"
                value={formData.instagramHandle}
                onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                className="w-full bg-white/10 border border-white/20 text-white px-3 py-2 focus:outline-none focus:border-fyf-red"
              />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-fyf-red text-white font-bold uppercase tracking-wider text-sm px-6 py-3 hover:bg-fyf-red-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add to Whitelist"}
          </button>
        </form>
      )}

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, ID, email, or Instagram..."
        className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 mb-6 focus:outline-none focus:border-fyf-red"
      />

      {/* List */}
      <div className="space-y-2">
        {people.map((person) => (
          <Link
            key={person.id}
            href={`/admin/whitelist/${person.id}`}
            className="block bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-white font-bold">{person.name}</span>
                <span className="text-white/40 ml-3 text-sm font-mono">
                  {person.govIdNumber}
                </span>
              </div>
              <div className="text-right">
                <span className="text-white/40 text-sm">
                  {person._count.tickets} tickets
                </span>
              </div>
            </div>
            <div className="text-white/30 text-sm mt-1">
              {person.email}
              {person.instagramHandle && (
                <span className="ml-3">@{person.instagramHandle}</span>
              )}
            </div>
          </Link>
        ))}
        {people.length === 0 && (
          <p className="text-white/30 text-center py-8">No one on the whitelist yet</p>
        )}
      </div>
    </div>
  );
}
