"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { PhoneShell } from "@/components/nokia/phone-shell";
import {
  LcdBox,
  LcdLoading,
  PixelLabel,
  ScreenPad,
  Wordmark,
} from "@/components/nokia/ui";
import { formatClock, formatDayDot, formatEventDateTime } from "@/lib/date";

/* El sobre de «mensaje enviado», que es exactamente lo que acaba de pasar:
   el QR salió para el mail del comprador. */
function SentEnvelope() {
  return (
    <svg
      viewBox="0 0 48 34"
      className="w-20 h-auto mx-auto text-culpa-ink"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden="true"
    >
      <rect x="1.25" y="1.25" width="45.5" height="31.5" />
      <path d="M1.25 1.25 L24 18 L46.75 1.25" />
    </svg>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const isFree = searchParams.get("free") === "true";
  const eventName = searchParams.get("eventName");
  const eventDate = searchParams.get("eventDate");

  return (
    <PhoneShell leftKey={{ label: "Menu", href: "/" }} rightKey={null}>
      <ScreenPad className="pt-6 pb-4 text-center">
        <Wordmark className="w-[52%] max-w-[200px] mx-auto" />
      </ScreenPad>

      <ScreenPad className="pt-2 text-center">
        <div className="success-pulse inline-block p-4 border-2 border-culpa-ink">
          <SentEnvelope />
        </div>

        <h1 className="font-pixel text-sm uppercase tracking-[0.1em] mt-6 leading-relaxed">
          {isFree ? "Entrada reclamada" : "Pago recibido"}
        </h1>

        <p className="font-ui text-sm text-culpa-ink/80 mt-3 leading-relaxed">
          Te mandamos el QR por mail. Mostralo en la puerta y entrás.
        </p>

        <p className="font-pixel text-[0.65rem] uppercase tracking-[0.1em] mt-4 text-culpa-ink">
          No compartas tu QR con nadie
        </p>
      </ScreenPad>

      {(eventName || eventDate) && (
        <ScreenPad className="pt-4">
          <LcdBox className="bg-culpa-ink text-culpa-lime border-culpa-ink text-left">
            {eventDate && (
              <p className="font-pixel text-2xl leading-none">
                {formatDayDot(eventDate)}
              </p>
            )}
            {eventName && (
              <p className="font-pixel text-xs mt-2 leading-relaxed">
                {eventName}
              </p>
            )}
            {eventDate && (
              <>
                <p className="font-pixel text-[0.65rem] mt-2 opacity-80">
                  OPEN DOORS {formatClock(eventDate)}
                </p>
                <p className="font-ui text-[0.7rem] mt-2 opacity-70">
                  {formatEventDateTime(eventDate)}
                </p>
              </>
            )}
          </LcdBox>
        </ScreenPad>
      )}

      <ScreenPad className="pt-6 pb-8 text-center">
        <PixelLabel className="mb-3">Fin</PixelLabel>
        <Link
          href="/"
          className="font-pixel text-[0.65rem] uppercase tracking-[0.1em] underline hover:opacity-60"
        >
          Volver al inicio
        </Link>
      </ScreenPad>
    </PhoneShell>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <PhoneShell leftKey={{ label: "Menu", href: "/" }} rightKey={null}>
          <ScreenPad>
            <LcdLoading />
          </ScreenPad>
        </PhoneShell>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
