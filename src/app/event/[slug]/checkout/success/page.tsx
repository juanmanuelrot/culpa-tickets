"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const isFree = searchParams.get("free") === "true";

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
