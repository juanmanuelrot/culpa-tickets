import { MercadoPagoConfig, Preference } from "mercadopago";

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

const preferenceClient = new Preference(mpClient);

// Service fee added on top of the ticket price. It only shows up as its own
// line inside the MercadoPago checkout, never on the public event page.
const SERVICE_FEE_PERCENT = Number(process.env.SERVICE_FEE_PERCENT ?? 10);

export function serviceFeeInCents(priceInCents: number): number {
  if (!Number.isFinite(SERVICE_FEE_PERCENT) || SERVICE_FEE_PERCENT <= 0) {
    return 0;
  }
  return Math.round((priceInCents * SERVICE_FEE_PERCENT) / 100);
}

export async function createCheckoutPreference(params: {
  ticketId: string;
  title: string;
  description: string;
  priceInCents: number;
  currency: string;
  payerEmail: string;
  payerName: string;
  eventSlug: string;
  eventName: string;
  eventDate: Date | string;
  ticketValidUntil?: Date | string | null;
}) {
  const successParams = new URLSearchParams({
    eventName: params.eventName,
    eventDate: new Date(params.eventDate).toISOString(),
  });
  if (params.ticketValidUntil) {
    successParams.set("validUntil", new Date(params.ticketValidUntil).toISOString());
  }
  const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/event/${params.eventSlug}/checkout/success?${successParams.toString()}`;

  const items = [
    {
      id: params.ticketId,
      title: params.title,
      description: params.description,
      quantity: 1,
      unit_price: params.priceInCents / 100,
      currency_id: params.currency,
    },
  ];

  const feeInCents = serviceFeeInCents(params.priceInCents);
  if (feeInCents > 0) {
    items.push({
      id: `${params.ticketId}-fee`,
      title: "Cargo por servicio",
      description: "Cargo por servicio",
      quantity: 1,
      unit_price: feeInCents / 100,
      currency_id: params.currency,
    });
  }

  const preference = await preferenceClient.create({
    body: {
      items,
      payer: {
        email: params.payerEmail,
        name: params.payerName,
      },
      external_reference: params.ticketId,
      back_urls: {
        success: successUrl,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/event/${params.eventSlug}/checkout/failure`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/event/${params.eventSlug}/checkout/pending`,
      },
      auto_return: "approved",
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
    },
  });

  return preference;
}

export { mpClient };
