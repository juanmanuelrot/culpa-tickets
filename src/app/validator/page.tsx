"use client";

import { useEffect, useRef, useState } from "react";

interface ScanResult {
  valid: boolean;
  error?: string;
  usedAt?: string;
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

  useEffect(() => {
    if (!scanning) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scanner: any = null;

    async function initScanner() {
      const { Html5Qrcode } = await import("html5-qrcode");
      const qrScanner = new Html5Qrcode("qr-reader");
      scanner = qrScanner;
      html5QrScannerRef.current = qrScanner;

      try {
        await qrScanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText: string) => {
            if (processing) return;
            setProcessing(true);
            await qrScanner.stop();
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
      if (scanner) {
        scanner.stop?.().catch(() => {});
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
      setScanResult({ valid: false, error: "Network error" });
    } finally {
      setProcessing(false);
    }
  }

  function handleScanAgain() {
    setScanResult(null);
    setScanning(true);
  }

  return (
    <div className="text-center">
      <h1 className="text-2xl font-black uppercase tracking-wider text-white mb-6">
        Scan Ticket
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
            Point camera at QR code
          </p>
        </div>
      )}

      {processing && (
        <div className="py-20">
          <p className="text-white/50 text-lg uppercase tracking-wider">Verifying...</p>
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
              {scanResult.valid ? "VALID" : "INVALID"}
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
                First scanned: {new Date(scanResult.usedAt).toLocaleString("es-AR")}
              </p>
            )}
          </div>

          <button
            onClick={handleScanAgain}
            className="bg-fyf-red text-white font-bold uppercase tracking-wider text-lg px-8 py-4 hover:bg-fyf-red-dark transition-colors w-full"
          >
            Scan Next
          </button>
        </div>
      )}
    </div>
  );
}
