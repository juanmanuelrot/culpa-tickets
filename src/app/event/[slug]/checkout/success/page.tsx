"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const isFree = searchParams.get("free") === "true";
  const validUntil = searchParams.get("validUntil");

  return (
    <div className="min-h-screen bg-fyf-black flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">&#10003;</div>
        <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-4">
          {isFree ? "¡Ticket Reclamado!" : "¡Pago Recibido!"}
        </h1>
        <p className="text-white/70 text-lg mb-8">
          Revisá tu correo para obtener tu ticket con el código QR.
          <br />
          <span className="text-fyf-red font-bold">
            No compartas tu código QR con nadie.
          </span>
        </p>
        {validUntil && (
          <div className="bg-yellow-900/30 border border-yellow-600/50 px-6 py-4 mb-6 rounded">
            <p className="text-yellow-400 font-bold uppercase tracking-wider text-sm">
              Válido hasta {new Date(validUntil).toLocaleString("es-AR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-yellow-400/60 text-xs mt-1">
              Este ticket no se puede usar después de esta hora
            </p>
          </div>
        )}
        <p className="text-white/40 text-sm">
          Presentá el código QR en la entrada para acceder.
        </p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-fyf-black flex items-center justify-center">
        <p className="text-white">Cargando...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
