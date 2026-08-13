"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { PhoneShell } from "@/components/nokia/phone-shell";
import { NokiaMenu, type MenuItem } from "@/components/nokia/menu-list";
import {
  LcdBox,
  LcdButton,
  LcdError,
  LcdInput,
  LcdLoading,
  PixelLabel,
  ScreenPad,
  Wordmark,
} from "@/components/nokia/ui";
import { formatClock, formatDayDot, formatEventDateTime } from "@/lib/date";

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
    <LcdBox className="bg-culpa-ink text-culpa-lime border-culpa-ink">
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
    : { label: "Back" };

  const publicTicketItems: MenuItem[] = (publicData?.ticketTypes ?? []).map(
    (tt) => ({
      label: tt.name,
      meta: formatPrice(tt.price, tt.currency),
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
    meta: formatPrice(tt.price, tt.currency),
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

      {initializing ? (
        <ScreenPad>
          <LcdLoading />
        </ScreenPad>
      ) : isPublic && publicData ? (
        /* ── PUBLIC EVENT FLOW ────────────────────────────── */
        <div className="animate-in">
          <ScreenPad className="pt-0">
            <EventHeader event={publicData.event} />
          </ScreenPad>

          {!buyingTicket ? (
            <>
              <ScreenPad className="py-2">
                <PixelLabel>Entradas</PixelLabel>
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
                      {formatPrice(buyingTicket.price, buyingTicket.currency)}
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
                    : buyingTicket.price === 0
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

          <ScreenPad className="py-2">
            <PixelLabel>Entradas</PixelLabel>
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
