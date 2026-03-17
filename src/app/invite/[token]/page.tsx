"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { HaringBorder } from "@/components/decorative/haring-border";

interface InviteInfo {
  eventName: string;
  eventDate: string;
  ticketValidUntil: string | null;
  ticketType: string;
  expired: boolean;
  fullyUsed: boolean;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);

  useEffect(() => {
    fetch(`/api/public/free-invite?token=${token}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data) setInviteInfo(data); });
  }, [token]);

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/public/free-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to claim invite");
        return;
      }

      const successUrl = `/event/${data.eventSlug}/checkout/success?ticketId=${data.ticketId}&free=true${data.ticketValidUntil ? `&validUntil=${encodeURIComponent(data.ticketValidUntil)}` : ""}`;
      router.push(successUrl);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-fyf-red relative overflow-hidden">
      <HaringBorder />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-wider mb-2 text-center">
          F&F
        </h1>
        <p className="text-lg text-white/80 italic mb-2">You&apos;re Invited!</p>
        <p className="text-sm text-white/60 mb-4">Enter your details to claim your free ticket</p>

        {inviteInfo && (
          <div className="w-full max-w-sm mb-6 space-y-2">
            {inviteInfo.eventName && (
              <p className="text-white/90 text-sm text-center font-bold uppercase tracking-wider">
                {inviteInfo.eventName} — {inviteInfo.ticketType}
              </p>
            )}
            {inviteInfo.ticketValidUntil && (
              <div className="bg-black/20 border border-white/20 px-4 py-3 text-center">
                <p className="text-yellow-300 text-sm font-bold uppercase tracking-wider">
                  Valid until {new Date(inviteInfo.ticketValidUntil).toLocaleString("es-AR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-white/50 text-xs mt-1">This ticket cannot be used after this time</p>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleClaim} className="w-full max-w-sm space-y-6">
          <div>
            <label className="block text-white/80 text-xs uppercase tracking-widest mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/10 border-2 border-white/30 text-white px-4 py-4 text-lg focus:outline-none focus:border-white transition-colors placeholder:text-white/40"
              required
            />
          </div>

          <div>
            <label className="block text-white/80 text-xs uppercase tracking-widest mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/10 border-2 border-white/30 text-white px-4 py-4 text-lg focus:outline-none focus:border-white transition-colors placeholder:text-white/40"
              required
            />
          </div>

          {error && (
            <p className="text-white bg-black/30 px-4 py-2 text-sm text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-fyf-red font-bold text-lg uppercase tracking-widest py-4 hover:bg-fyf-cream transition-colors disabled:opacity-50"
          >
            {loading ? "..." : "Claim Ticket"}
          </button>
        </form>
      </div>
    </div>
  );
}
