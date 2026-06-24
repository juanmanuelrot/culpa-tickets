"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { SnakeBorder } from "@/components/decorative/snake-border";
import { SmallCreature } from "@/components/decorative/dj-creature";
import { formatEventDateTime, formatDateTime } from "@/lib/date";

function SuccessContent() {
  const searchParams = useSearchParams();
  const isFree = searchParams.get("free") === "true";
  const validUntil = searchParams.get("validUntil");
  const eventName = searchParams.get("eventName");
  const eventDate = searchParams.get("eventDate");

  return (
    <div className="min-h-screen bg-fyf-red relative overflow-hidden flex items-center justify-center px-4">
      <SnakeBorder />

      {/* Subtle texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%2210%22%20cy%3D%2210%22%20r%3D%221%22%20fill%3D%22white%22%2F%3E%3C%2Fsvg%3E')] pointer-events-none" />

      <div className="relative z-10 text-center max-w-md">
        {/* Success checkmark */}
        <div className="w-20 h-20 mx-auto mb-6 border-3 border-white rounded-full flex items-center justify-center success-pulse">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider mb-4">
          {isFree ? "¡Ticket Reclamado!" : "¡Pago Recibido!"}
        </h1>

        <p className="text-white/80 text-base mb-2">
          Revisá tu correo para obtener tu ticket con el código QR.
        </p>
        <p className="text-white font-bold text-sm uppercase tracking-wider">
          No compartas tu código QR con nadie.
        </p>

        {(eventName || eventDate) && (
          <div className="bg-white/10 border border-white/20 px-6 py-4 mt-6">
            {eventName && (
              <p className="text-white font-bold uppercase tracking-wider text-base">
                {eventName}
              </p>
            )}
            {eventDate && (
              <>
                <p className="text-white/50 text-[0.65rem] uppercase tracking-[0.2em] mt-2">
                  Fecha del evento
                </p>
                <p className="text-white/80 text-sm mt-0.5">
                  {formatEventDateTime(eventDate)}
                </p>
              </>
            )}
          </div>
        )}

        {validUntil && (
          <div className="bg-black/20 border border-white/20 px-6 py-4 mt-4">
            <p className="text-yellow-300 font-bold uppercase tracking-wider text-sm">
              Ticket válido hasta {formatDateTime(validUntil)}
            </p>
            <p className="text-white/50 text-xs mt-1">
              Este ticket no se puede usar después de esta hora (hora de Montevideo)
            </p>
          </div>
        )}

        <p className="text-white/50 text-sm mt-6">
          Presentá el código QR en la entrada para acceder.
        </p>

        <Link
          href="/"
          className="inline-block mt-8 text-white/40 text-sm underline hover:text-white/60 transition-colors"
        >
          Volver al inicio
        </Link>

        {/* Decorative */}
        <div className="flex justify-center mt-8 opacity-20">
          <SmallCreature className="w-10 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-fyf-red flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
