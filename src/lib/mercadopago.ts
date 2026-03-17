import { MercadoPagoConfig, Preference } from "mercadopago";

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

const preferenceClient = new Preference(mpClient);

export async function createCheckoutPreference(params: {
  ticketId: string;
  title: string;
  description: string;
  priceInCents: number;
  currency: string;
  payerEmail: string;
  payerName: string;
  eventSlug: string;
}) {
  const preference = await preferenceClient.create({
    body: {
      items: [
        {
          id: params.ticketId,
          title: params.title,
          description: params.description,
          quantity: 1,
          unit_price: params.priceInCents / 100,
          currency_id: params.currency,
        },
      ],
      payer: {
        email: params.payerEmail,
        name: params.payerName,
      },
      external_reference: params.ticketId,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/event/${params.eventSlug}/checkout/success`,
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
