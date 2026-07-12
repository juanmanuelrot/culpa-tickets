"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { SnakeBorderFrame } from "@/components/decorative/snake-border";
import { DjCreature } from "@/components/decorative/dj-creature";
import { HaringFigure } from "@/components/decorative/haring-border";
import { formatEventDateTime, formatDateShort } from "@/lib/date";

interface TicketTypeInfo {
  id: string;
  name: string;
  price: number;
  currency: string;
  validUntil: string | null;
  alreadyPurchased: boolean;
  pendingPayment: boolean;
  soldOut: boolean;
}

interface EventInfo {
  id: string;
  name: string;
  slug: string;
  date: string;
  location: string | null;
  isPublic?: boolean;
}

interface LookupResult {
  person: { name: string; email: string; govIdNumber: string };
  event: EventInfo;
  availableTicketTypes: TicketTypeInfo[];
}

interface PublicTicketType {
  id: string;
  name: string;
  price: number;
  currency: string;
  validUntil: string | null;
  soldOut: boolean;
}

interface PublicEventData {
  event: EventInfo;
  ticketTypes: PublicTicketType[];
}

function formatPrice(cents: number, currency: string) {
  if (cents === 0) return "GRATIS";
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // Shared
  const [initializing, setInitializing] = useState(true);
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState("");

  // Private (whitelist) flow
  const [govId, setGovId] = useState("");
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  // Public flow
  const [publicData, setPublicData] = useState<PublicEventData | null>(null);
  const [buyingTicket, setBuyingTicket] = useState<PublicTicketType | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", govId: "", email: "" });
  const [submitting, setSubmitting] = useState(false);

  // Determine on mount whether the event is public; if so, load its tickets.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/public/events/${slug}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "Evento no encontrado");
          return;
        }
        if (data.event?.isPublic) {
          setIsPublic(true);
          setPublicData(data);
        }
      } catch {
        if (!cancelled) setError("Algo salió mal");
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setLookupResult(null);

    try {
      const res = await fetch("/api/public/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ govIdNumber: govId, eventSlug: slug }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error en la búsqueda");
        return;
      }

      setLookupResult(data);
    } catch {
      setError("Algo salió mal");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout(ticketTypeId: string) {
    if (!lookupResult) return;
    setCheckoutLoading(ticketTypeId);
    setError("");

    try {
      const res = await fetch("/api/public/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          govIdNumber: govId,
          eventId: lookupResult.event.id,
          ticketTypeId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error en el checkout");
        return;
      }

      redirectAfterCheckout(data, lookupResult.event);
    } catch {
      setError("Algo salió mal");
    } finally {
      setCheckoutLoading(null);
    }
  }

  const redirectAfterCheckout = useCallback(
    (data: { free?: boolean; ticketId?: string; ticketValidUntil?: string; checkoutUrl?: string }, event: EventInfo) => {
      if (data.free) {
        const eventParams = `&eventName=${encodeURIComponent(event.name)}&eventDate=${encodeURIComponent(event.date)}`;
        const successUrl = `/event/${slug}/checkout/success?ticketId=${data.ticketId}&free=true${data.ticketValidUntil ? `&validUntil=${encodeURIComponent(data.ticketValidUntil)}` : ""}${eventParams}`;
        router.push(successUrl);
      } else if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    [slug, router]
  );

  async function handlePublicPurchase(e: React.FormEvent) {
    e.preventDefault();
    if (!publicData || !buyingTicket) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/public/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: publicData.event.id,
          ticketTypeId: buyingTicket.id,
          firstName: form.firstName,
          lastName: form.lastName,
          govIdNumber: form.govId,
          email: form.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error en el checkout");
        return;
      }

      redirectAfterCheckout(data, publicData.event);
    } catch {
      setError("Algo salió mal");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-fyf-red relative overflow-hidden">
      <SnakeBorderFrame />

      {/* Subtle texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%2210%22%20cy%3D%2210%22%20r%3D%221%22%20fill%3D%22white%22%2F%3E%3C%2Fsvg%3E')] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Header */}
        <h1 className="text-6xl md:text-8xl font-black text-white tracking-wider mb-1 text-center fyf-title-shadow select-none">
          F<span className="text-white/90">&</span>F
        </h1>

        {/* Divider */}
        <div className="flex items-center gap-2 mb-2 opacity-40">
          <div className="w-8 h-px bg-white/60" />
          <HaringFigure variant={2} className="w-5 h-5 text-white" />
          <div className="w-8 h-px bg-white/60" />
        </div>

        <p className="text-base text-white/80 italic mb-8">Solo para nosotros</p>

        {initializing ? (
          <span className="inline-block w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : isPublic && publicData ? (
          /* ── PUBLIC EVENT FLOW ────────────────────────────── */
          <div className="w-full max-w-md space-y-5 animate-in">
            {/* Event Info */}
            <div className="bg-white/10 backdrop-blur-sm p-6 border border-white/20">
              <p className="text-white text-xl font-black uppercase tracking-wider">
                {publicData.event.name}
              </p>
              <p className="text-white/50 text-[0.65rem] uppercase tracking-[0.2em] mt-2">
                Fecha del evento
              </p>
              <p className="text-white/80 text-sm mt-0.5">
                {formatEventDateTime(publicData.event.date)}
              </p>
              {publicData.event.location && (
                <p className="text-white/60 text-sm mt-1">{publicData.event.location}</p>
              )}
            </div>

            {!buyingTicket ? (
              <>
                {/* Ticket Types */}
                <div className="space-y-3">
                  <p className="text-white/60 text-xs uppercase tracking-[0.2em]">
                    Tickets Disponibles
                  </p>
                  {publicData.ticketTypes.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 p-6 text-center">
                      <p className="text-white/50">
                        No hay tickets disponibles en este momento
                      </p>
                    </div>
                  ) : (
                    publicData.ticketTypes.map((tt) => (
                      <div
                        key={tt.id}
                        className="bg-white/10 backdrop-blur-sm border border-white/20 p-5 flex items-center justify-between gap-4 hover:bg-white/[0.15] transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-white font-bold uppercase tracking-wider">
                            {tt.name}
                          </p>
                          <p className="text-white/80 text-lg font-black mt-1">
                            {formatPrice(tt.price, tt.currency)}
                          </p>
                          {tt.validUntil && (
                            <p className="text-yellow-300/80 text-xs mt-1">
                              Ticket válido hasta {formatDateShort(tt.validUntil)}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setError("");
                            setBuyingTicket(tt);
                          }}
                          disabled={tt.soldOut}
                          className="bg-white text-fyf-red font-bold uppercase tracking-wider px-6 py-3 text-sm hover:bg-fyf-cream transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                        >
                          {tt.soldOut ? "Agotado" : tt.price === 0 ? "Reclamar" : "Comprar"}
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {error && (
                  <div className="bg-black/20 border border-white/20 px-4 py-3">
                    <p className="text-white text-sm text-center">{error}</p>
                  </div>
                )}
              </>
            ) : (
              /* Identity form for the selected ticket */
              <form onSubmit={handlePublicPurchase} className="space-y-4">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white font-bold uppercase tracking-wider">
                      {buyingTicket.name}
                    </p>
                    <p className="text-white/80 font-black">
                      {formatPrice(buyingTicket.price, buyingTicket.currency)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBuyingTicket(null);
                      setError("");
                    }}
                    className="text-white/60 text-xs uppercase tracking-widest underline shrink-0 hover:text-white/80"
                  >
                    Cambiar
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="Nombre"
                    className="bg-white/10 border-2 border-white/30 text-white px-4 py-3 focus:outline-none focus:border-white transition-colors placeholder:text-white/40"
                    required
                  />
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Apellido"
                    className="bg-white/10 border-2 border-white/30 text-white px-4 py-3 focus:outline-none focus:border-white transition-colors placeholder:text-white/40"
                    required
                  />
                </div>
                <input
                  type="text"
                  value={form.govId}
                  onChange={(e) => setForm({ ...form, govId: e.target.value })}
                  placeholder="Cédula de identidad"
                  className="w-full bg-white/10 border-2 border-white/30 text-white px-4 py-3 focus:outline-none focus:border-white transition-colors placeholder:text-white/40"
                  required
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Email"
                  className="w-full bg-white/10 border-2 border-white/30 text-white px-4 py-3 focus:outline-none focus:border-white transition-colors placeholder:text-white/40"
                  required
                />

                {error && (
                  <div className="bg-black/20 border border-white/20 px-4 py-3">
                    <p className="text-white text-sm text-center">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-white text-fyf-red font-bold text-base uppercase tracking-[0.2em] py-4 hover:bg-fyf-cream transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="inline-block w-5 h-5 border-2 border-fyf-red/30 border-t-fyf-red rounded-full animate-spin" />
                  ) : buyingTicket.price === 0 ? (
                    "Reclamar Ticket"
                  ) : (
                    "Continuar al Pago"
                  )}
                </button>
              </form>
            )}
          </div>
        ) : !lookupResult ? (
          /* ── PRIVATE (WHITELIST) FLOW: gov-ID lookup ──────── */
          <form onSubmit={handleLookup} className="w-full max-w-sm space-y-6">
            <div>
              <label className="block text-white/80 text-xs uppercase tracking-[0.2em] mb-3 text-center">
                Ingresá tu número de documento
              </label>
              <input
                type="text"
                value={govId}
                onChange={(e) => setGovId(e.target.value)}
                placeholder="Tu cédula de identidad"
                className="w-full bg-white/10 border-2 border-white/30 text-white px-4 py-4 text-lg text-center focus:outline-none focus:border-white transition-colors placeholder:text-white/40"
                required
              />
            </div>

            {error && (
              <div className="bg-black/20 border border-white/20 px-4 py-3">
                <p className="text-white text-sm text-center">{error}</p>
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
                "Buscar Mis Tickets"
              )}
            </button>

            {/* Decorative creature */}
            <div className="flex justify-center pt-4 opacity-20">
              <DjCreature className="w-32 text-white" />
            </div>
          </form>
        ) : (
          <div className="w-full max-w-md space-y-5 animate-in">
            {/* Person Info */}
            <div className="bg-white/10 backdrop-blur-sm p-6 border border-white/20">
              <p className="text-white/60 text-xs uppercase tracking-[0.2em] mb-1">
                Bienvenido/a
              </p>
              <p className="text-white text-2xl font-black uppercase tracking-wider">
                {lookupResult.person.name}
              </p>
              <p className="text-white/50 text-sm mt-1">{lookupResult.person.email}</p>
            </div>

            {/* Event Info */}
            <div className="bg-white/10 backdrop-blur-sm p-6 border border-white/20">
              <p className="text-white text-xl font-black uppercase tracking-wider">
                {lookupResult.event.name}
              </p>
              <p className="text-white/50 text-[0.65rem] uppercase tracking-[0.2em] mt-2">
                Fecha del evento
              </p>
              <p className="text-white/80 text-sm mt-0.5">
                {formatEventDateTime(lookupResult.event.date)}
              </p>
              {lookupResult.event.location && (
                <p className="text-white/60 text-sm mt-1">{lookupResult.event.location}</p>
              )}
            </div>

            {/* Ticket Types */}
            <div className="space-y-3">
              <p className="text-white/60 text-xs uppercase tracking-[0.2em]">
                Tickets Disponibles
              </p>
              {lookupResult.availableTicketTypes.length === 0 ? (
                <div className="bg-white/5 border border-white/10 p-6 text-center">
                  <p className="text-white/50">
                    No hay tickets disponibles para vos en este momento
                  </p>
                </div>
              ) : (
                lookupResult.availableTicketTypes.map((tt) => (
                  <div
                    key={tt.id}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 p-5 flex items-center justify-between gap-4 hover:bg-white/[0.15] transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-white font-bold uppercase tracking-wider">{tt.name}</p>
                      <p className="text-white/80 text-lg font-black mt-1">
                        {formatPrice(tt.price, tt.currency)}
                      </p>
                      {tt.validUntil && (
                        <p className="text-yellow-300/80 text-xs mt-1">
                          Ticket válido hasta {formatDateShort(tt.validUntil)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleCheckout(tt.id)}
                      disabled={tt.alreadyPurchased || tt.soldOut || checkoutLoading === tt.id}
                      className="bg-white text-fyf-red font-bold uppercase tracking-wider px-6 py-3 text-sm hover:bg-fyf-cream transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    >
                      {tt.alreadyPurchased
                        ? "Comprado"
                        : tt.soldOut
                        ? "Agotado"
                        : checkoutLoading === tt.id
                        ? "..."
                        : tt.pendingPayment
                        ? "Reintentar Pago"
                        : tt.price === 0
                        ? "Reclamar"
                        : "Comprar"}
                    </button>
                  </div>
                ))
              )}
            </div>

            {error && (
              <div className="bg-black/20 border border-white/20 px-4 py-3">
                <p className="text-white text-sm text-center">{error}</p>
              </div>
            )}

            <button
              onClick={() => {
                setLookupResult(null);
                setGovId("");
              }}
              className="text-white/50 text-sm underline block mx-auto hover:text-white/70 transition-colors"
            >
              Usar otro documento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
