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
          {isFree ? "Ticket Claimed!" : "Payment Received!"}
        </h1>
        <p className="text-white/70 text-lg mb-8">
          Check your email for your ticket with the QR code.
          <br />
          <span className="text-fyf-red font-bold">
            Do not share your QR code with anyone.
          </span>
        </p>
        {validUntil && (
          <div className="bg-yellow-900/30 border border-yellow-600/50 px-6 py-4 mb-6 rounded">
            <p className="text-yellow-400 font-bold uppercase tracking-wider text-sm">
              Valid until {new Date(validUntil).toLocaleString("es-AR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-yellow-400/60 text-xs mt-1">
              This ticket cannot be used after this time
            </p>
          </div>
        )}
        <p className="text-white/40 text-sm">
          Present the QR code at the entrance to gain access.
        </p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-fyf-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
