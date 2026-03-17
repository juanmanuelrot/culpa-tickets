"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { HaringBorder } from "@/components/decorative/haring-border";

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

interface LookupResult {
  person: { name: string; email: string; govIdNumber: string };
  event: { id: string; name: string; slug: string; date: string; location: string | null };
  availableTicketTypes: TicketTypeInfo[];
}

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [govId, setGovId] = useState("");
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

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
        setError(data.error || "Lookup failed");
        return;
      }

      setLookupResult(data);
    } catch {
      setError("Something went wrong");
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
        setError(data.error || "Checkout failed");
        return;
      }

      if (data.free) {
        const successUrl = `/event/${slug}/checkout/success?ticketId=${data.ticketId}&free=true${data.ticketValidUntil ? `&validUntil=${encodeURIComponent(data.ticketValidUntil)}` : ""}`;
        router.push(successUrl);
      } else if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setCheckoutLoading(null);
    }
  }

  function formatPrice(cents: number, currency: string) {
    if (cents === 0) return "FREE";
    return new Intl.NumberFormat("es-UY", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(cents / 100);
  }

  return (
    <div className="min-h-screen bg-fyf-red relative overflow-hidden">
      <HaringBorder />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-wider mb-2 text-center">
          F&F
        </h1>
        <p className="text-lg text-white/80 italic mb-10">Solo para nosotros</p>

        {!lookupResult ? (
          <form onSubmit={handleLookup} className="w-full max-w-sm space-y-6">
            <div>
              <label className="block text-white/80 text-xs uppercase tracking-widest mb-2">
                Enter your ID number
              </label>
              <input
                type="text"
                value={govId}
                onChange={(e) => setGovId(e.target.value)}
                placeholder="Your government ID"
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
              {loading ? "..." : "Find My Tickets"}
            </button>
          </form>
        ) : (
          <div className="w-full max-w-md space-y-6">
            {/* Person Info */}
            <div className="bg-white/10 p-6 border border-white/20">
              <p className="text-white/60 text-xs uppercase tracking-widest mb-1">
                Welcome
              </p>
              <p className="text-white text-2xl font-bold">
                {lookupResult.person.name}
              </p>
              <p className="text-white/60 text-sm mt-1">
                {lookupResult.person.email}
              </p>
            </div>

            {/* Event Info */}
            <div className="bg-white/10 p-6 border border-white/20">
              <p className="text-white text-xl font-bold uppercase tracking-wider">
                {lookupResult.event.name}
              </p>
              <p className="text-white/70 text-sm mt-2">
                {new Date(lookupResult.event.date).toLocaleDateString("es-AR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {lookupResult.event.location && (
                <p className="text-white/70 text-sm mt-1">
                  {lookupResult.event.location}
                </p>
              )}
            </div>

            {/* Ticket Types */}
            <div className="space-y-3">
              <p className="text-white/60 text-xs uppercase tracking-widest">
                Available Tickets
              </p>
              {lookupResult.availableTicketTypes.length === 0 ? (
                <p className="text-white/50 text-center py-4">
                  No tickets available for you at this time
                </p>
              ) : (
                lookupResult.availableTicketTypes.map((tt) => (
                  <div
                    key={tt.id}
                    className="bg-white/10 border border-white/20 p-5 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white font-bold uppercase tracking-wider">
                        {tt.name}
                      </p>
                      <p className="text-white/70 text-lg font-bold mt-1">
                        {formatPrice(tt.price, tt.currency)}
                      </p>
                      {tt.validUntil && (
                        <p className="text-yellow-300/80 text-xs mt-1">
                          Valid until {new Date(tt.validUntil).toLocaleString("es-AR", {
                            weekday: "long",
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleCheckout(tt.id)}
                      disabled={
                        tt.alreadyPurchased ||
                        tt.soldOut ||
                        checkoutLoading === tt.id
                      }
                      className="bg-white text-fyf-red font-bold uppercase tracking-wider px-6 py-3 text-sm hover:bg-fyf-cream transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {tt.alreadyPurchased
                        ? "Purchased"
                        : tt.soldOut
                        ? "Sold Out"
                        : checkoutLoading === tt.id
                        ? "..."
                        : tt.pendingPayment
                        ? "Retry Payment"
                        : tt.price === 0
                        ? "Claim"
                        : "Buy"}
                    </button>
                  </div>
                ))
              )}
            </div>

            {error && (
              <p className="text-white bg-black/30 px-4 py-2 text-sm text-center">
                {error}
              </p>
            )}

            <button
              onClick={() => {
                setLookupResult(null);
                setGovId("");
              }}
              className="text-white/50 text-sm underline block mx-auto"
            >
              Use a different ID
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
