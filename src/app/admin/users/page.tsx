"use client";

import { useEffect, useState } from "react";

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
      setError(data.error || "Failed to create user");
    }
    setSubmitting(false);
  }

  async function handleDelete(user: User) {
    if (!confirm(`Delete user "${user.name}" (${user.email})?`)) return;

    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (res.ok) {
      loadUsers();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete user");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black uppercase tracking-wider text-white">
          Users
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-fyf-red text-white px-4 py-2 text-sm uppercase tracking-widest font-bold hover:opacity-80 transition-opacity"
        >
          {showForm ? "Cancel" : "New User"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white/5 border border-white/10 p-6 mb-8 space-y-4">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-2">
            Create User
          </h2>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-widest mb-1">Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/10 border border-white/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-fyf-red"
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-widest mb-1">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white/10 border border-white/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-fyf-red"
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-widest mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-white/10 border border-white/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-fyf-red"
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-widest mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as "ADMIN" | "VALIDATOR" })}
                className="w-full bg-white/10 border border-white/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-fyf-red"
              >
                <option value="VALIDATOR">Validator</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-fyf-red text-white px-6 py-2 text-sm uppercase tracking-widest font-bold hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create User"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-white/40">Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-white/40">No users found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-white/60 text-xs uppercase tracking-widest py-3 pr-4">Name</th>
                <th className="text-white/60 text-xs uppercase tracking-widest py-3 pr-4">Email</th>
                <th className="text-white/60 text-xs uppercase tracking-widest py-3 pr-4">Role</th>
                <th className="text-white/60 text-xs uppercase tracking-widest py-3 pr-4">Created</th>
                <th className="text-white/60 text-xs uppercase tracking-widest py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-white/5">
                  <td className="text-white py-3 pr-4 text-sm">{user.name}</td>
                  <td className="text-white/70 py-3 pr-4 text-sm">{user.email}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`text-xs font-bold uppercase tracking-widest px-2 py-1 ${
                        user.role === "ADMIN"
                          ? "bg-fyf-red/20 text-fyf-red"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="text-white/40 py-3 pr-4 text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleDelete(user)}
                      className="text-red-400/60 hover:text-red-400 text-xs uppercase tracking-widest font-bold transition-colors"
                    >
                      Delete
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
