"use client";

import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/nokia/phone-shell";
import { NokiaMenu, type MenuItem } from "@/components/nokia/menu-list";
import {
  LcdBox,
  LcdLoading,
  PixelLabel,
  ScreenPad,
} from "@/components/nokia/ui";
import { formatDayDot } from "@/lib/date";
import { buildMessages, previewOf, type PhoneMessage } from "@/lib/messages";

/*
 * La bandeja de entrada del Nokia: tus amigos, tu vieja y el chico que te
 * gusta preguntándote si de verdad te vas a perder la fecha. Contestar un
 * mensaje te lleva a comprar la entrada; ese es todo el chiste.
 */

interface EventInfo {
  id: string;
  slug: string;
  date: string;
}

export default function MessagesPage() {
  const [nextEvent, setNextEvent] = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<PhoneMessage | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/events")
      .then((res) => res.json())
      .then((data: EventInfo[]) => {
        if (cancelled) return;
        const now = new Date();
        setNextEvent(data.find((e) => new Date(e.date) >= now) ?? null);
      })
      .catch(() => {
        if (!cancelled) setNextEvent(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const messages = buildMessages(
    nextEvent ? formatDayDot(nextEvent.date) : null
  );

  // Contestar es ir a comprar. Sin fecha abierta, al menos vuelve al inicio.
  const replyHref = nextEvent ? `/event/${nextEvent.slug}` : "/";

  const items: MenuItem[] = messages.map((message) => ({
    label: message.from,
    meta: message.time,
    sub: previewOf(message.body),
    onSelect: () => setOpen(message),
  }));

  return (
    <PhoneShell
      leftKey={
        open
          ? { label: "Bandeja", onClick: () => setOpen(null) }
          : { label: "Menu", href: "/" }
      }
      rightKey={
        open ? { label: "Responder", href: replyHref } : { label: "Back" }
      }
    >
      <ScreenPad className="pt-5 pb-2">
        <PixelLabel>{open ? "Leer mensaje" : "Bandeja de entrada"}</PixelLabel>
      </ScreenPad>

      {open ? (
        <div className="animate-in">
          <ScreenPad className="pt-1 space-y-3">
            <LcdBox className="bg-culpa-ink text-culpa-lime border-culpa-ink">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-pixel text-sm">De: {open.from}</p>
                <p className="font-pixel text-xs opacity-80">{open.time}</p>
              </div>
              <p className="font-ui text-sm mt-3 leading-relaxed">
                {open.body}
              </p>
            </LcdBox>

            <p className="font-ui text-xs text-culpa-ink/60 text-center">
              {nextEvent
                ? "Contestale con una entrada."
                : "No hay fecha abierta para contestarle todavía."}
            </p>
          </ScreenPad>
        </div>
      ) : (
        <div className="animate-in">
          {loading ? (
            <ScreenPad className="py-3">
              <LcdLoading />
            </ScreenPad>
          ) : (
            <>
              <NokiaMenu items={items} />
              <ScreenPad className="pt-4">
                <p className="font-ui text-xs text-culpa-ink/60 text-center">
                  {messages.length} mensajes sin leer. Todos preguntan lo mismo.
                </p>
              </ScreenPad>
            </>
          )}
        </div>
      )}
    </PhoneShell>
  );
}
