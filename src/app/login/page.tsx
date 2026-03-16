"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      if (data.user.role === "ADMIN") {
        router.push("/admin");
      } else if (data.user.role === "VALIDATOR") {
        router.push("/validator");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-fyf-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-5xl font-black text-center text-white tracking-wider mb-2">
          F&F
        </h1>
        <p className="text-center text-white/60 uppercase tracking-widest text-sm mb-10">
          Staff Login
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white/70 text-xs uppercase tracking-widest mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/10 border border-white/20 text-white px-4 py-3 focus:outline-none focus:border-fyf-red transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-white/70 text-xs uppercase tracking-widest mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/10 border border-white/20 text-white px-4 py-3 focus:outline-none focus:border-fyf-red transition-colors"
              required
            />
          </div>

          {error && (
            <p className="text-fyf-red text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-fyf-red text-white font-bold uppercase tracking-widest py-4 hover:bg-fyf-red-dark transition-colors disabled:opacity-50"
          >
            {loading ? "..." : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
