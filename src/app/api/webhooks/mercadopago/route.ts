import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { createQRSignedToken, generateQRCodeDataURL } from "@/lib/qr";
import { sendTicketEmail } from "@/lib/email";
import { formatDate } from "@/lib/utils";
import { Payment, MercadoPagoConfig } from "mercadopago";
import crypto from "crypto";

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

function verifyWebhookSignature(
  request: NextRequest,
  body: string
): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // Skip verification if no secret configured (dev mode)

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");

  if (!xSignature || !xRequestId) return false;

  // Parse x-signature header
  const parts: Record<string, string> = {};
  xSignature.split(",").forEach((part) => {
    const [key, value] = part.trim().split("=");
    if (key && value) parts[key] = value;
  });

  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  // Get data_id from query params
  const dataId = new URL(request.url).searchParams.get("data.id") || "";

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  return hmac === v1;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Verify webhook signature
    if (!verifyWebhookSignature(request, body)) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data = JSON.parse(body);

    // MercadoPago sends different notification types
    if (data.type !== "payment" && data.action !== "payment.updated") {
      return NextResponse.json({ received: true });
    }

    const paymentId = data.data?.id;
    if (!paymentId) {
      return NextResponse.json({ received: true });
    }

    // Fetch payment details from MercadoPago
    const paymentClient = new Payment(mpClient);
    const payment = await paymentClient.get({ id: paymentId });

    if (!payment || !payment.external_reference) {
      return NextResponse.json({ received: true });
    }

    const ticketId = payment.external_reference;
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { event: true, ticketType: true },
    });

    if (!ticket) {
      console.error(`Ticket not found: ${ticketId}`);
      return NextResponse.json({ received: true });
    }

    // Idempotency: if already PAID, don't process again
    if (ticket.status === "PAID" || ticket.status === "USED") {
      return NextResponse.json({ received: true });
    }

    if (payment.status === "approved") {
      // Generate QR code (ONLY after payment confirmation)
      const qrCodeToken = uuidv4();
      const qrSignedJwt = await createQRSignedToken({
        ticketId: ticket.id,
        qrCodeToken,
        eventId: ticket.eventId,
      });

      // Update ticket to PAID with QR token
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          status: "PAID",
          qrCodeToken,
          qrSignedJwt,
          mpOrderId: paymentId.toString(),
          mpPaymentStatus: payment.status,
        },
      });

      // Send email with QR code
      const qrDataUrl = await generateQRCodeDataURL(qrSignedJwt);
      await sendTicketEmail({
        to: ticket.purchaserEmail,
        eventName: ticket.event.name,
        ticketType: ticket.ticketType.name,
        date: formatDate(ticket.event.date),
        purchaserName: ticket.purchaserName,
        qrDataUrl,
      });
    } else if (payment.status === "rejected" || payment.status === "cancelled") {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          status: "CANCELLED",
          mpOrderId: paymentId.toString(),
          mpPaymentStatus: payment.status,
        },
      });
    } else {
      // pending or other status - just update the payment status
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          mpOrderId: paymentId.toString(),
          mpPaymentStatus: payment.status || "unknown",
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ received: true }); // Always return 200 to MP
  }
}
