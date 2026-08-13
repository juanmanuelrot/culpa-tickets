"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/date";

interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "VALIDATOR";
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "VALIDATOR" as "ADMIN" | "VALIDATOR" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadUsers() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setForm({ name: "", email: "", password: "", role: "VALIDATOR" });
      setShowForm(false);
      loadUsers();
    } else {
      const data = await res.json();
      setError(data.error || "Error al crear usuario");
    }
    setSubmitting(false);
  }

  async function handleDelete(user: User) {
    if (!confirm(`¿Eliminar usuario "${user.name}" (${user.email})?`)) return;

    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (res.ok) {
      loadUsers();
    } else {
      const data = await res.json();
      alert(data.error || "Error al eliminar usuario");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="culpa-heading text-xl text-culpa-cream">
          Usuarios
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-culpa-blue text-culpa-cream px-4 py-2 text-sm uppercase tracking-widest font-bold hover:opacity-80 transition-opacity"
        >
          {showForm ? "Cancelar" : "Nuevo Usuario"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-culpa-cream/5 border border-culpa-cream/10 p-6 mb-8 space-y-4">
          <h2 className="culpa-heading text-sm text-culpa-cream mb-2">
            Crear Usuario
          </h2>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-culpa-cream/60 text-xs uppercase tracking-widest mb-1">Nombre</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-culpa-cream/10 border border-culpa-cream/20 text-culpa-cream px-3 py-2 text-sm focus:outline-none focus:border-culpa-lime"
              />
            </div>
            <div>
              <label className="block text-culpa-cream/60 text-xs uppercase tracking-widest mb-1">Correo</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-culpa-cream/10 border border-culpa-cream/20 text-culpa-cream px-3 py-2 text-sm focus:outline-none focus:border-culpa-lime"
              />
            </div>
            <div>
              <label className="block text-culpa-cream/60 text-xs uppercase tracking-widest mb-1">Contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-culpa-cream/10 border border-culpa-cream/20 text-culpa-cream px-3 py-2 text-sm focus:outline-none focus:border-culpa-lime"
              />
            </div>
            <div>
              <label className="block text-culpa-cream/60 text-xs uppercase tracking-widest mb-1">Rol</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as "ADMIN" | "VALIDATOR" })}
                className="w-full bg-culpa-cream/10 border border-culpa-cream/20 text-culpa-cream px-3 py-2 text-sm focus:outline-none focus:border-culpa-lime"
              >
                <option value="VALIDATOR">Validator</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-culpa-blue text-culpa-cream px-6 py-2 text-sm uppercase tracking-widest font-bold hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Creando..." : "Crear Usuario"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-culpa-cream/40">Cargando...</p>
      ) : users.length === 0 ? (
        <p className="text-culpa-cream/40">No se encontraron usuarios.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-culpa-cream/10">
                <th className="text-culpa-cream/60 text-xs uppercase tracking-widest py-3 pr-4">Nombre</th>
                <th className="text-culpa-cream/60 text-xs uppercase tracking-widest py-3 pr-4">Correo</th>
                <th className="text-culpa-cream/60 text-xs uppercase tracking-widest py-3 pr-4">Rol</th>
                <th className="text-culpa-cream/60 text-xs uppercase tracking-widest py-3 pr-4">Creado</th>
                <th className="text-culpa-cream/60 text-xs uppercase tracking-widest py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-culpa-cream/5">
                  <td className="text-culpa-cream py-3 pr-4 text-sm">{user.name}</td>
                  <td className="text-culpa-cream/70 py-3 pr-4 text-sm">{user.email}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`text-xs font-bold uppercase tracking-widest px-2 py-1 ${
                        user.role === "ADMIN"
                          ? "bg-culpa-blue/20 text-culpa-lime"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="text-culpa-cream/40 py-3 pr-4 text-sm">
                    {formatDateTime(user.createdAt)}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleDelete(user)}
                      className="text-red-400/60 hover:text-red-400 text-xs uppercase tracking-widest font-bold transition-colors"
                    >
                      Eliminar
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
