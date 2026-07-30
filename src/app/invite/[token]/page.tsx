"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { SnakeBorderFrame } from "@/components/decorative/snake-border";
import { HaringFigure } from "@/components/decorative/haring-border";
import { SmallCreature } from "@/components/decorative/dj-creature";
import { formatEventDateTime } from "@/lib/date";

interface InviteInfo {
  eventName: string;
  eventDate: string;
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
        setError(data.error || "Error al reclamar la invitación");
        return;
      }

      const eventParams = inviteInfo
        ? `&eventName=${encodeURIComponent(inviteInfo.eventName)}&eventDate=${encodeURIComponent(inviteInfo.eventDate)}`
        : "";
      const successUrl = `/event/${data.eventSlug}/checkout/success?ticketId=${data.ticketId}&free=true${eventParams}`;
      router.push(successUrl);
    } catch {
      setError("Algo salió mal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-fyf-red relative overflow-hidden">
      <SnakeBorderFrame />

      {/* Subtle texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%2210%22%20cy%3D%2210%22%20r%3D%221%22%20fill%3D%22white%22%2F%3E%3C%2Fsvg%3E')] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <h1 className="text-6xl md:text-8xl font-black text-white tracking-wider mb-1 text-center fyf-title-shadow select-none">
          F<span className="text-white/90">&</span>F
        </h1>

        {/* Divider */}
        <div className="flex items-center gap-2 mb-2 opacity-40">
          <div className="w-8 h-px bg-white/60" />
          <HaringFigure variant={3} className="w-5 h-5 text-white" />
          <div className="w-8 h-px bg-white/60" />
        </div>

        <p className="text-lg text-white/90 font-bold uppercase tracking-[0.2em] mb-1">
          ¡Estás Invitado/a!
        </p>
        <p className="text-sm text-white/60 mb-6">
          Ingresá tus datos para reclamar tu ticket gratis
        </p>

        {inviteInfo && (
          <div className="w-full max-w-sm mb-6 space-y-3">
            {inviteInfo.eventName && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3 text-center">
                <p className="text-white font-bold uppercase tracking-wider text-sm">
                  {inviteInfo.eventName}
                </p>
                <p className="text-white/60 text-xs mt-1">{inviteInfo.ticketType}</p>
                {inviteInfo.eventDate && (
                  <>
                    <p className="text-white/40 text-[0.6rem] uppercase tracking-[0.2em] mt-3">
                      Fecha del evento
                    </p>
                    <p className="text-white/90 text-sm font-bold mt-0.5">
                      {formatEventDateTime(inviteInfo.eventDate)}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleClaim} className="w-full max-w-sm space-y-5">
          <div>
            <label className="block text-white/80 text-xs uppercase tracking-[0.2em] mb-2">
              Nombre Completo
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
            <label className="block text-white/80 text-xs uppercase tracking-[0.2em] mb-2">
              Correo
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
            <div className="bg-black/20 border border-white/20 px-4 py-3">
              <p className="text-white text-sm text-center">
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-fyf-red font-bold text-base uppercase tracking-[0.2em] py-4 hover:bg-fyf-cream transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-fyf-red/30 border-t-fyf-red rounded-full animate-spin" />
            ) : (
              "Reclamar Ticket"
            )}
          </button>

          {/* Decorative */}
          <div className="flex justify-center pt-2 opacity-20">
            <SmallCreature className="w-12 text-white" />
          </div>
        </form>
      </div>
    </div>
  );
}
