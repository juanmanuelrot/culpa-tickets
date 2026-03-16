"use client";

import { useEffect, useState } from "react";

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
      <h1 className="text-2xl font-black uppercase tracking-wider text-white mb-6">
        Recent Scans
      </h1>

      <div className="space-y-2">
        {scans.map((scan) => (
          <div
            key={scan.id}
            className={`border p-4 ${
              scan.wasValid
                ? "bg-green-900/20 border-green-800"
                : "bg-red-900/20 border-red-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold">
                  {scan.ticket.purchaserName}
                </p>
                <p className="text-white/50 text-sm">
                  {scan.ticket.event.name} — {scan.ticket.ticketType.name}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`text-xs uppercase tracking-wider font-bold ${
                    scan.wasValid ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {scan.wasValid ? "Valid" : "Invalid"}
                </span>
                <p className="text-white/30 text-xs mt-1">
                  {new Date(scan.scannedAt).toLocaleString("es-AR")}
                </p>
              </div>
            </div>
          </div>
        ))}
        {scans.length === 0 && (
          <p className="text-white/30 text-center py-8">No scans yet</p>
        )}
      </div>
    </div>
  );
}
