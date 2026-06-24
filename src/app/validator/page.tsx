"use client";

import { useEffect, useRef, useState } from "react";
import { formatDateTime } from "@/lib/date";

interface ScanResult {
  valid: boolean;
  error?: string;
  usedAt?: string;
  expiredAt?: string;
  ticket?: {
    purchaserName: string;
    ticketType: string;
    event: string;
  };
}

export default function ValidatorScannerPage() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrScannerRef = useRef<unknown>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    if (!scanning) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scanner: any = null;
    let unmounted = false;

    async function initScanner() {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (unmounted) return;
      const qrScanner = new Html5Qrcode("qr-reader");
      scanner = qrScanner;
      html5QrScannerRef.current = qrScanner;

      try {
        await qrScanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText: string) => {
            if (processingRef.current) return;
            processingRef.current = true;
            setProcessing(true);
            try {
              await qrScanner.stop();
            } catch {
              // Scanner may already be stopped
            }
            setScanning(false);
            await handleScan(decodedText);
          },
          () => {} // Ignore scan failures (no QR detected in frame)
        );
      } catch (err) {
        console.error("Camera error:", err);
      }
    }

    initScanner();

    return () => {
      unmounted = true;
      if (scanner) {
        try {
          const state = scanner.getState?.();
          // Only stop if scanner is scanning (2) or paused (3)
          if (state === 2 || state === 3) {
            scanner.stop().catch(() => {});
          }
        } catch {
          // Ignore cleanup errors
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  async function handleScan(qrData: string) {
    try {
      const res = await fetch("/api/validator/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrData }),
      });

      const data = await res.json();
      setScanResult(data);
    } catch {
      setScanResult({ valid: false, error: "Error de red" });
    } finally {
      setProcessing(false);
    }
  }

  function handleScanAgain() {
    processingRef.current = false;
    setScanResult(null);
    setScanning(true);
  }

  return (
    <div className="text-center">
      <h1 className="text-2xl font-black uppercase tracking-wider text-white mb-6">
        Escanear Ticket
      </h1>

      {scanning && !scanResult && (
        <div>
          <div
            id="qr-reader"
            ref={scannerRef}
            className="mx-auto rounded-lg overflow-hidden"
            style={{ width: "100%", maxWidth: "400px" }}
          />
          <p className="text-white/50 text-sm mt-4 uppercase tracking-wider">
            Apuntá la cámara al código QR
          </p>
        </div>
      )}

      {processing && (
        <div className="py-20">
          <p className="text-white/50 text-lg uppercase tracking-wider">Verificando...</p>
        </div>
      )}

      {scanResult && !processing && (
        <div className="space-y-6">
          <div
            className={`p-8 rounded-lg ${
              scanResult.valid
                ? "bg-green-900/50 border-2 border-green-500 scan-valid"
                : "bg-red-900/50 border-2 border-red-500 scan-invalid"
            }`}
          >
            <p className="text-5xl mb-4">
              {scanResult.valid ? "\u2713" : "\u2717"}
            </p>
            <p
              className={`text-2xl font-black uppercase tracking-wider ${
                scanResult.valid ? "text-green-400" : "text-red-400"
              }`}
            >
              {scanResult.valid ? "VÁLIDO" : "INVÁLIDO"}
            </p>

            {scanResult.error && (
              <p className="text-white/70 text-sm mt-2">{scanResult.error}</p>
            )}

            {scanResult.ticket && (
              <div className="mt-4 space-y-1">
                <p className="text-white text-xl font-bold">
                  {scanResult.ticket.purchaserName}
                </p>
                <p className="text-white/60 text-sm">
                  {scanResult.ticket.event} — {scanResult.ticket.ticketType}
                </p>
              </div>
            )}

            {scanResult.usedAt && (
              <p className="text-white/40 text-xs mt-2">
                Primer escaneo: {formatDateTime(scanResult.usedAt)}
              </p>
            )}

            {scanResult.expiredAt && (
              <p className="text-yellow-400 text-xs mt-2">
                Expiró el: {formatDateTime(scanResult.expiredAt)}
              </p>
            )}
          </div>

          <button
            onClick={handleScanAgain}
            className="bg-fyf-red text-white font-bold uppercase tracking-wider text-lg px-8 py-4 hover:bg-fyf-red-dark transition-colors w-full"
          >
            Escanear Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
