"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/date";

interface Scan {
  id: string;
  scannedAt: string;
  wasValid: boolean;
  ticket: {
    purchaserName: string;
    event: { name: string };
    ticketType: { name: string };
  };
}

export default function ValidatorScansPage() {
  const [scans, setScans] = useState<Scan[]>([]);

  useEffect(() => {
    fetch("/api/validator/scans")
      .then((r) => r.json())
      .then((data) => setScans(Array.isArray(data) ? data : []));
  }, []);

  return (
    <div>
      <h1 className="culpa-heading text-lg text-culpa-cream mb-6">
        Escaneos Recientes
      </h1>

      <div className="space-y-2">
        {scans.map((scan) => (
          <div
            key={scan.id}
            className={`border p-4 ${
              scan.wasValid
                ? "bg-culpa-lime/10 border-culpa-lime/50"
                : "bg-culpa-alert/10 border-culpa-alert/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-culpa-cream font-bold">
                  {scan.ticket.purchaserName}
                </p>
                <p className="text-culpa-cream/50 text-sm">
                  {scan.ticket.event.name} — {scan.ticket.ticketType.name}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`font-pixel text-[0.65rem] uppercase tracking-[0.1em] ${
                    scan.wasValid ? "text-culpa-lime" : "text-culpa-alert"
                  }`}
                >
                  {scan.wasValid ? "Válido" : "Inválido"}
                </span>
                <p className="text-culpa-cream/30 text-xs mt-1">
                  {formatDateTime(scan.scannedAt)}
                </p>
              </div>
            </div>
          </div>
        ))}
        {scans.length === 0 && (
          <p className="text-culpa-cream/30 text-center py-8">No hay escaneos todavía</p>
        )}
      </div>
    </div>
  );
}
