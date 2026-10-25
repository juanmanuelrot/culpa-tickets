"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/nokia/phone-shell";
import { NokiaMenu, type MenuItem } from "@/components/nokia/menu-list";
import {
  LcdBox,
  LcdButton,
  LcdError,
  LcdInput,
  PixelLabel,
  ScreenPad,
  Wordmark,
} from "@/components/nokia/ui";
import { formatClock, formatDayDot, formatEventDateTime } from "@/lib/date";
import type { PublicEventData as InitialEventData } from "@/lib/public-event";
import { applyDiscount } from "@/lib/promoters";

interface TicketTypeInfo {
  id: string;
  name: string;
  price: number;
  currency: string;
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
  soldOut: boolean;
}

interface PublicEventData {
  event: EventInfo;
  ticketTypes: PublicTicketType[];
}

// El código de RRPP llega en el link (?rrpp=<code>). Se guarda para que la
// venta le quede atribuida aunque el comprador recargue o vuelva más tarde.
const PROMOTER_STORAGE_KEY = "culpa-rrpp";

function readPromoterCode(): string | null {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("rrpp");
    if (fromUrl) {
      localStorage.setItem(PROMOTER_STORAGE_KEY, fromUrl);
      return fromUrl;
    }
    return localStorage.getItem(PROMOTER_STORAGE_KEY);
  } catch {
    return null;
  }
}

function formatPrice(cents: number, currency: string) {
  if (cents === 0) return "GRATIS";
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

/** La cabecera de la pantalla: fecha grande, nombre y lugar del evento. */
function EventHeader({ event }: { event: EventInfo }) {
  return (
    <LcdBox className="bg-culpa-ink text-culpa-lcd border-culpa-ink">
      <p className="font-pixel text-2xl leading-none">
        {formatDayDot(event.date)}
      </p>
      <p className="font-pixel text-xs mt-2 leading-relaxed">{event.name}</p>
      <p className="font-pixel text-[0.65rem] mt-2 opacity-80 leading-relaxed">
        OPEN DOORS {formatClock(event.date)}
        {event.location ? ` · ${event.location}` : ""}
      </p>
      <p className="font-ui text-[0.7rem] mt-2 opacity-70">
        {formatEventDateTime(event.date)}
      </p>
    </LcdBox>
  );
}

export function EventScreen({
  slug,
  initialData,
}: {
  slug: string;
  initialData: InitialEventData | null;
}) {
  const router = useRouter();

  // Shared. The page comes in from the CDN and may be up to an hour old, so
  // it shows what it has right away and swaps in fresh data from the API.
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(initialData ? "" : "Evento no encontrado");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/public/events/${slug}`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const fresh: InitialEventData = await res.json();
        if (cancelled) return;
        setData(fresh);
        setError((prev) => (prev === "Evento no encontrado" ? "" : prev));
      } catch {
        // Keep what came with the page; checkout validates anyway.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Store the RRPP code as soon as the link is opened; checkout reads it back.
  // If the link carries a discount, prices on screen show it too.
  const [discountPercent, setDiscountPercent] = useState(0);
  useEffect(() => {
    const code = readPromoterCode();
    if (!code) return;
    fetch(`/api/public/promoters/${encodeURIComponent(code)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setDiscountPercent(data?.discountPercent ?? 0))
      .catch(() => {});
  }, []);

  function ticketPrice(tt: { price: number; currency: string }) {
    const price = formatPrice(applyDiscount(tt.price, discountPercent), tt.currency);
    return discountPercent > 0 && tt.price > 0 ? `${price} (-${discountPercent}%)` : price;
  }

  // Private (whitelist) flow
  const [govId, setGovId] = useState("");
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  // Public flow
  const publicData: PublicEventData | null = data?.event.isPublic
    ? { event: data.event, ticketTypes: data.ticketTypes ?? [] }
    : null;
  const [buyingTicket, setBuyingTicket] = useState<PublicTicketType | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", govId: "", email: "" });
  const [submitting, setSubmitting] = useState(false);

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
          promoterCode: readPromoterCode(),
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
    (data: { free?: boolean; ticketId?: string; checkoutUrl?: string }, event: EventInfo) => {
      if (data.free) {
        const eventParams = `&eventName=${encodeURIComponent(event.name)}&eventDate=${encodeURIComponent(event.date)}`;
        const successUrl = `/event/${slug}/checkout/success?ticketId=${data.ticketId}&free=true${eventParams}`;
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
          promoterCode: readPromoterCode(),
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

  // El softkey derecho sigue el paso en el que está el usuario.
  const rightKey = buyingTicket
    ? {
        label: "Atras",
        onClick: () => {
          setBuyingTicket(null);
          setError("");
        },
      }
    : lookupResult
    ? {
        label: "Salir",
        onClick: () => {
          setLookupResult(null);
          setGovId("");
        },
      }
    : { label: "Mensajes", href: "/mensajes" };

  const publicTicketItems: MenuItem[] = (publicData?.ticketTypes ?? []).map(
    (tt) => ({
      label: tt.name,
      meta: ticketPrice(tt),
      sub: tt.soldOut ? "Agotado" : undefined,
      disabled: tt.soldOut,
      onSelect: () => {
        setError("");
        setBuyingTicket(tt);
      },
    })
  );

  const privateTicketItems: MenuItem[] = (
    lookupResult?.availableTicketTypes ?? []
  ).map((tt) => ({
    label: tt.name,
    meta: ticketPrice(tt),
    sub: tt.alreadyPurchased
      ? "Ya lo tenés"
      : tt.soldOut
      ? "Agotado"
      : checkoutLoading === tt.id
      ? "Procesando..."
      : tt.pendingPayment
      ? "Reintentar pago"
      : undefined,
    disabled: tt.alreadyPurchased || tt.soldOut || checkoutLoading === tt.id,
    onSelect: () => handleCheckout(tt.id),
  }));

  return (
    <PhoneShell leftKey={{ label: "Menu", href: "/" }} rightKey={rightKey}>
      <ScreenPad className="pt-5 pb-4 text-center">
        <Wordmark className="w-[52%] max-w-[200px] mx-auto" />
      </ScreenPad>

      {publicData ? (
        /* ── PUBLIC EVENT FLOW ────────────────────────────── */
        <div>
          <ScreenPad className="pt-0">
            <EventHeader event={publicData.event} />
          </ScreenPad>

          {!buyingTicket ? (
            <>
              <ScreenPad className="py-2 flex items-baseline justify-between gap-3">
                <PixelLabel>Entradas</PixelLabel>
                {publicTicketItems.length > 0 && (
                  <PixelLabel className="opacity-70">
                    Tocá para elegir
                  </PixelLabel>
                )}
              </ScreenPad>

              {publicTicketItems.length === 0 ? (
                <ScreenPad className="pt-1">
                  <p className="font-ui text-sm text-culpa-ink/60">
                    No hay entradas disponibles en este momento.
                  </p>
                </ScreenPad>
              ) : (
                <NokiaMenu items={publicTicketItems} />
              )}

              {error && (
                <ScreenPad className="pt-4">
                  <LcdError>{error}</LcdError>
                </ScreenPad>
              )}
            </>
          ) : (
            /* Identity form for the selected ticket */
            <form onSubmit={handlePublicPurchase}>
              <ScreenPad className="pt-0 space-y-3">
                <LcdBox className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-pixel text-[0.7rem] uppercase tracking-[0.1em]">
                      {buyingTicket.name}
                    </p>
                    <p className="font-pixel text-sm mt-1">
                      {ticketPrice(buyingTicket)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBuyingTicket(null);
                      setError("");
                    }}
                    className="font-pixel text-[0.6rem] uppercase tracking-[0.1em] underline shrink-0 hover:opacity-60"
                  >
                    Cambiar
                  </button>
                </LcdBox>

                <PixelLabel>Tus datos</PixelLabel>

                <div className="grid grid-cols-2 gap-3">
                  <LcdInput
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="Nombre"
                    required
                  />
                  <LcdInput
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Apellido"
                    required
                  />
                </div>
                <LcdInput
                  type="text"
                  value={form.govId}
                  onChange={(e) => setForm({ ...form, govId: e.target.value })}
                  placeholder="Cédula de identidad"
                  required
                />
                <LcdInput
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Email"
                  required
                />

                {error && <LcdError>{error}</LcdError>}

                <LcdButton type="submit" disabled={submitting} className="w-full">
                  {submitting
                    ? "Procesando..."
                    : applyDiscount(buyingTicket.price, discountPercent) === 0
                    ? "Reclamar entrada"
                    : "Ir al pago"}
                </LcdButton>

                <p className="font-ui text-xs text-culpa-ink/60 text-center">
                  Te mandamos el QR a ese mail.
                </p>
              </ScreenPad>
            </form>
          )}
        </div>
      ) : !lookupResult ? (
        /* ── PRIVATE (WHITELIST) FLOW: gov-ID lookup ──────── */
        <form onSubmit={handleLookup}>
          <ScreenPad className="pt-0 space-y-4">
            <PixelLabel className="text-center">
              Ingresa tu documento
            </PixelLabel>

            <LcdInput
              type="text"
              value={govId}
              onChange={(e) => setGovId(e.target.value)}
              placeholder="Cédula de identidad"
              className="text-center"
              required
            />

            {error && <LcdError>{error}</LcdError>}

            <LcdButton type="submit" disabled={loading} className="w-full">
              {loading ? "Buscando..." : "Buscar mis entradas"}
            </LcdButton>

            <p className="font-ui text-xs text-culpa-ink/60 text-center">
              Esta fecha es con lista. Si no estás, escribinos por Instagram.
            </p>
          </ScreenPad>
        </form>
      ) : (
        <div className="animate-in">
          <ScreenPad className="pt-0 space-y-3">
            <LcdBox>
              <PixelLabel>Hola</PixelLabel>
              <p className="font-pixel text-sm mt-1 uppercase">
                {lookupResult.person.name}
              </p>
              <p className="font-ui text-xs text-culpa-ink/60 mt-1">
                {lookupResult.person.email}
              </p>
            </LcdBox>

            <EventHeader event={lookupResult.event} />
          </ScreenPad>

          <ScreenPad className="py-2 flex items-baseline justify-between gap-3">
            <PixelLabel>Entradas</PixelLabel>
            {privateTicketItems.length > 0 && (
              <PixelLabel className="opacity-70">Tocá para elegir</PixelLabel>
            )}
          </ScreenPad>

          {privateTicketItems.length === 0 ? (
            <ScreenPad className="pt-1">
              <p className="font-ui text-sm text-culpa-ink/60">
                No hay entradas disponibles para vos en este momento.
              </p>
            </ScreenPad>
          ) : (
            <NokiaMenu items={privateTicketItems} />
          )}

          <ScreenPad className="space-y-4">
            {error && <LcdError>{error}</LcdError>}

            <button
              onClick={() => {
                setLookupResult(null);
                setGovId("");
              }}
              className="font-pixel text-[0.6rem] uppercase tracking-[0.1em] underline mx-auto block hover:opacity-60"
            >
              Usar otro documento
            </button>
          </ScreenPad>
        </div>
      )}
    </PhoneShell>
  );
}
