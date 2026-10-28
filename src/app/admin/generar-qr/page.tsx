"use client";

import { useEffect, useState } from "react";
import { QrDirectoSection } from "./qr-directo-section";
import type { EventWithTypes } from "./types";

export default function AdminGenerarQrPage() {
  const [events, setEvents] = useState<EventWithTypes[]>([]);

  useEffect(() => {
    fetch("/api/admin/events")
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []));
  }, []);

  return (
    <div>
      <h1 className="culpa-heading text-xl text-culpa-cream mb-10">
        Generar QR
      </h1>

      <QrDirectoSection events={events} />
    </div>
  );
}
