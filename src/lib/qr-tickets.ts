import type { TicketOrigin } from "@/generated/prisma/enums";
import { generateQRCodeBuffer } from "@/lib/qr";
import { sendTicketEmail } from "@/lib/email";
import { formatDate } from "@/lib/utils";

// Entradas que salen de "Generar QR": cortesías o cobradas por fuera
// (transferencia o efectivo). Las dos guardan el precio de lista del momento,
// así lo regalado no cambia si después se toca el precio del tipo de entrada.

export type QrOrigin = Extract<TicketOrigin, "OFFLINE_PAID" | "COURTESY">;

export const QR_ORIGINS: QrOrigin[] = ["OFFLINE_PAID", "COURTESY"];

export function isQrOrigin(value: unknown): value is QrOrigin {
  return QR_ORIGINS.includes(value as QrOrigin);
}

export interface QrAmounts {
  chargedInCents: number;
  faceValueInCents: number;
}

// Una cortesía no cobra nada. Un pago por fuera cobra lo que se cargó, y si no
// se cargó nada, el precio de la entrada. Devuelve null si el monto no sirve.
export function resolveQrAmounts(
  origin: QrOrigin,
  chargedInCents: unknown,
  priceInCents: number
): QrAmounts | null {
  const faceValueInCents = priceInCents;

  if (origin === "COURTESY") return { chargedInCents: 0, faceValueInCents };

  if (chargedInCents === null || chargedInCents === undefined) {
    return { chargedInCents: priceInCents, faceValueInCents };
  }

  if (
    typeof chargedInCents !== "number" ||
    !Number.isInteger(chargedInCents) ||
    chargedInCents < 0
  ) {
    return null;
  }

  return { chargedInCents, faceValueInCents };
}

interface EmailableTicket {
  purchaserEmail: string | null;
  purchaserName: string;
  qrSignedJwt: string | null;
  event: { name: string; date: Date };
  ticketType: { name: string };
}

export async function emailQrTicket(ticket: EmailableTicket): Promise<void> {
  if (!ticket.purchaserEmail || !ticket.qrSignedJwt) {
    throw new Error("Ticket has no email or QR to send");
  }

  const { error } = await sendTicketEmail({
    to: ticket.purchaserEmail,
    eventName: ticket.event.name,
    ticketType: ticket.ticketType.name,
    date: formatDate(ticket.event.date),
    purchaserName: ticket.purchaserName,
    qrCodeBuffer: await generateQRCodeBuffer(ticket.qrSignedJwt),
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}
