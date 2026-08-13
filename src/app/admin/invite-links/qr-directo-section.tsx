"use client";

import { useState } from "react";
import { formatEventDateTime, formatDateTime, localInputToUtc } from "@/lib/date";
import { slugify } from "@/lib/utils";
import type { EventWithTypes } from "./types";

interface DirectInvite {
  ticketId: string;
  qrDataUrl: string;
  guestName: string;
  guestEmail: string | null;
  eventName: string;
  eventDate: string;
  ticketTypeName: string;
  validUntil: string | null;
}

const EMPTY_FORM = {
  eventId: "",
  ticketTypeId: "",
  name: "",
  email: "",
  ticketValidUntil: "",
};

export function QrDirectoSection({ events }: { events: EventWithTypes[] }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [invite, setInvite] = useState<DirectInvite | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  const selectedEvent = events.find((e) => e.id === form.eventId);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/direct-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: form.eventId,
          ticketTypeId: form.ticketTypeId,
          name: form.name,
          email: form.email || null,
          ticketValidUntil: form.ticketValidUntil
            ? localInputToUtc(form.ticketValidUntil).toISOString()
            : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo generar el QR");
        return;
      }

      setEmailStatus("idle");
      setInvite(data);
    } catch {
      setError("Algo salió mal");
    } finally {
      setLoading(false);
    }
  }

  // Keep event, ticket type and expiry so a run of guests goes quickly.
  function handleGenerateAnother() {
    setInvite(null);
    setError("");
    setForm({ ...form, name: "", email: "" });
  }

  async function handleSendEmail() {
    if (!invite) return;
    setEmailStatus("sending");
    try {
      const res = await fetch(
        `/api/admin/direct-invites/${invite.ticketId}/email`,
        { method: "POST" }
      );
      setEmailStatus(res.ok ? "sent" : "error");
    } catch {
      setEmailStatus("error");
    }
  }

  return (
    <section>
      <h2 className="culpa-heading text-base text-culpa-cream mb-1">
        QR Directo
      </h2>
      <p className="text-culpa-cream/40 text-sm mb-6">
        Emite el ticket al instante y te muestra el QR para sacarle captura. No
        genera link ni manda correo.
      </p>

      {invite ? (
        <div className="space-y-4">
          {/* Deliberately white and self-contained: a rectangular screenshot
              of this card is already a usable ticket. */}
          <div className="bg-culpa-cream p-8 max-w-sm mx-auto text-center">
            <p className="text-culpa-lime text-3xl font-black tracking-wider">
              F&amp;F
            </p>
            <p className="text-black/50 text-[0.6rem] uppercase tracking-[0.3em] mt-1">
              Invitación
            </p>

            {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the API, not a static asset */}
            <img
              src={invite.qrDataUrl}
              alt={`Código QR de ${invite.guestName}`}
              className="w-[320px] max-w-full mx-auto my-6"
            />

            <p className="text-black font-black uppercase tracking-wider">
              {invite.guestName}
            </p>
            <p className="text-black/70 text-sm mt-3 font-bold uppercase tracking-wider">
              {invite.eventName}
            </p>
            <p className="text-black/60 text-sm mt-0.5">
              {formatEventDateTime(invite.eventDate)}
            </p>
            <p className="text-black/50 text-xs mt-2 uppercase tracking-wider">
              {invite.ticketTypeName}
            </p>

            {invite.validUntil && (
              <p className="text-black/50 text-xs mt-3">
                Válido hasta {formatDateTime(invite.validUntil)}
              </p>
            )}

            <p className="text-black/40 text-[0.65rem] mt-6">
              Presentá este código QR en la entrada
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={invite.qrDataUrl}
              download={`qr-${slugify(invite.guestName) || "invitacion"}.png`}
              className="bg-culpa-cream/10 border border-culpa-cream/20 text-culpa-cream font-bold uppercase tracking-wider text-xs px-4 py-2 hover:bg-culpa-cream/20 transition-colors"
            >
              Descargar PNG
            </a>
            <button
              onClick={handleGenerateAnother}
              className="bg-culpa-blue text-culpa-cream font-bold uppercase tracking-wider text-xs px-4 py-2 hover:bg-culpa-blue-dark transition-colors"
            >
              Generar otro
            </button>
            {invite.guestEmail && (
              <button
                onClick={handleSendEmail}
                disabled={emailStatus === "sending" || emailStatus === "sent"}
                className="bg-culpa-cream/10 border border-culpa-cream/20 text-culpa-cream font-bold uppercase tracking-wider text-xs px-4 py-2 hover:bg-culpa-cream/20 transition-colors disabled:opacity-50"
              >
                {emailStatus === "sending"
                  ? "Enviando..."
                  : emailStatus === "sent"
                  ? `Enviado a ${invite.guestEmail}`
                  : emailStatus === "error"
                  ? "Reintentar envío"
                  : "Enviar por correo"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleGenerate}
          className="bg-culpa-cream/5 border border-culpa-cream/10 p-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-culpa-cream/60 text-xs uppercase tracking-widest mb-1">
                Evento <span className="text-culpa-lime">*</span>
              </label>
              <select
                value={form.eventId}
                onChange={(e) =>
                  setForm({ ...form, eventId: e.target.value, ticketTypeId: "" })
                }
                className="w-full bg-culpa-cream/10 border border-culpa-cream/20 text-culpa-cream px-3 py-2 focus:outline-none focus:border-culpa-lime"
                required
              >
                <option value="">Seleccionar evento</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-culpa-cream/60 text-xs uppercase tracking-widest mb-1">
                Tipo de Ticket <span className="text-culpa-lime">*</span>
              </label>
              <select
                value={form.ticketTypeId}
                onChange={(e) =>
                  setForm({ ...form, ticketTypeId: e.target.value })
                }
                className="w-full bg-culpa-cream/10 border border-culpa-cream/20 text-culpa-cream px-3 py-2 focus:outline-none focus:border-culpa-lime"
                required
                disabled={!form.eventId}
              >
                <option value="">Seleccionar tipo</option>
                {selectedEvent?.ticketTypes.map((tt) => (
                  <option key={tt.id} value={tt.id}>
                    {tt.name}
                    {tt.isOffered === false ? " (retirado)" : ""}
                  </option>
                ))}
              </select>
              <p className="text-culpa-cream/30 text-xs mt-1">
                Podés emitir para tipos retirados de la venta
              </p>
            </div>
            <div>
              <label className="block text-culpa-cream/60 text-xs uppercase tracking-widest mb-1">
                Nombre del invitado <span className="text-culpa-lime">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Sofi - prensa"
                className="w-full bg-culpa-cream/10 border border-culpa-cream/20 text-culpa-cream px-3 py-2 focus:outline-none focus:border-culpa-lime"
                required
              />
              <p className="text-culpa-cream/30 text-xs mt-1">
                Es lo que ve quien escanea en la puerta
              </p>
            </div>
            <div>
              <label className="block text-culpa-cream/60 text-xs uppercase tracking-widest mb-1">
                Correo (opcional)
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-culpa-cream/10 border border-culpa-cream/20 text-culpa-cream px-3 py-2 focus:outline-none focus:border-culpa-lime"
              />
              <p className="text-culpa-cream/30 text-xs mt-1">
                No se envía nada solo, pero te habilita el botón de enviar
              </p>
            </div>
            <div>
              <label className="block text-culpa-cream/60 text-xs uppercase tracking-widest mb-1">
                Ticket válido hasta (opcional)
              </label>
              <input
                type="datetime-local"
                value={form.ticketValidUntil}
                onChange={(e) =>
                  setForm({ ...form, ticketValidUntil: e.target.value })
                }
                className="w-full bg-culpa-cream/10 border border-culpa-cream/20 text-culpa-cream px-3 py-2 focus:outline-none focus:border-culpa-lime"
              />
              <p className="text-culpa-cream/30 text-xs mt-1">
                Hora de Montevideo — si lo dejás vacío usa el del tipo de ticket
              </p>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-culpa-blue text-culpa-cream font-bold uppercase tracking-wider text-sm px-6 py-3 hover:bg-culpa-blue-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Generando..." : "Generar QR"}
          </button>
        </form>
      )}
    </section>
  );
}
