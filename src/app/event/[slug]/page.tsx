import { getPublicEvent } from "@/lib/public-event";
import { EventScreen } from "./event-screen";

/*
 * El evento se lee acá, al renderizar, y llega en el HTML: la pantalla no
 * espera al JS para pedirlo a la API, que era una vuelta más al servidor.
 */

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicEvent(slug);

  return <EventScreen slug={slug} initialData={data} />;
}
