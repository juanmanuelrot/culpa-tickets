"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SnakeBorderFrame } from "@/components/decorative/snake-border";
import { DjCreature } from "@/components/decorative/dj-creature";
import { HaringFigure } from "@/components/decorative/haring-border";

interface EventInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  date: string;
  location: string | null;
  coverImageUrl: string | null;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HomePage() {
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/events")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const upcomingEvents = events.filter(
    (e) => new Date(e.date) >= new Date()
  );
  const pastEvents = events.filter(
    (e) => new Date(e.date) < new Date()
  );

  return (
    <div className="min-h-screen bg-fyf-black text-fyf-white">
      {/* Hero Section - Red with snake border like the flyer */}
      <section className="relative bg-fyf-red min-h-[100vh] md:min-h-[90vh] flex flex-col items-center justify-center overflow-hidden">
        <SnakeBorderFrame />

        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%2210%22%20cy%3D%2210%22%20r%3D%221%22%20fill%3D%22white%22%2F%3E%3C%2Fsvg%3E')] pointer-events-none" />

        <div className="relative z-10 text-center px-6 flex flex-col items-center">
          {/* Main title */}
          <h1 className="text-[7rem] md:text-[12rem] font-black text-white tracking-wider leading-none select-none fyf-title-shadow">
            F<span className="text-white/90">&</span>F
          </h1>

          {/* Divider with small dancing figures */}
          <div className="flex items-center gap-3 my-4 opacity-40">
            <HaringFigure variant={0} className="w-6 h-6 text-white" />
            <div className="w-16 h-px bg-white/60" />
            <HaringFigure variant={2} className="w-6 h-6 text-white" />
            <div className="w-16 h-px bg-white/60" />
            <HaringFigure variant={1} className="w-6 h-6 text-white" />
          </div>

          <p className="text-xl md:text-2xl text-white/90 uppercase tracking-[0.3em] font-light">
            Accesos
          </p>

          <div className="max-w-xs md:max-w-sm mt-6 text-center">
            <p className="text-white/80 text-sm md:text-base leading-relaxed uppercase tracking-wider">
              En <span className="font-black">F&F</span> cuidamos lo nuestro.
            </p>
            <p className="text-white/60 text-sm md:text-base leading-relaxed mt-2">
              Solo personas en la lista pueden comprar su entrada.
            </p>
          </div>

          {upcomingEvents.length > 0 && (
            <a
              href="#events"
              className="mt-10 bg-white text-fyf-red font-bold text-sm uppercase tracking-[0.2em] px-10 py-4 hover:bg-fyf-cream transition-colors inline-block"
            >
              Ver Eventos
            </a>
          )}

          {/* DJ Creature at the bottom of hero */}
          <div className="mt-8 md:mt-12 opacity-30 hover:opacity-50 transition-opacity">
            <DjCreature className="w-40 md:w-52 text-white" />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 bg-fyf-black relative overflow-hidden">
        {/* Background decorative figures */}
        <div className="absolute top-10 left-4 opacity-[0.04]">
          <HaringFigure variant={3} className="w-32 h-32 text-white" />
        </div>
        <div className="absolute bottom-10 right-4 opacity-[0.04]">
          <HaringFigure variant={1} className="w-32 h-32 text-white" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="fyf-heading text-3xl md:text-4xl text-center mb-4">
            Cómo Funciona
          </h2>
          <div className="w-12 h-0.5 bg-fyf-red mx-auto mb-16" />

          <div className="grid md:grid-cols-3 gap-10 text-center">
            <div className="group">
              <div className="text-5xl font-black text-fyf-red mb-4 group-hover:scale-110 transition-transform">
                01
              </div>
              <h3 className="fyf-subheading text-lg mb-3">Lista Exclusiva</h3>
              <p className="text-white/60 leading-relaxed text-sm">
                Solo personas en la lista de invitados pueden acceder a los
                tickets. Verificamos tu identidad para mantener la exclusividad.
              </p>
            </div>
            <div className="group">
              <div className="text-5xl font-black text-fyf-red mb-4 group-hover:scale-110 transition-transform">
                02
              </div>
              <h3 className="fyf-subheading text-lg mb-3">Comprá tu Ticket</h3>
              <p className="text-white/60 leading-relaxed text-sm">
                Elegí tu tipo de entrada y completá la compra de forma segura.
                Tickets gratuitos y pagos disponibles.
              </p>
            </div>
            <div className="group">
              <div className="text-5xl font-black text-fyf-red mb-4 group-hover:scale-110 transition-transform">
                03
              </div>
              <h3 className="fyf-subheading text-lg mb-3">QR de Entrada</h3>
              <p className="text-white/60 leading-relaxed text-sm">
                Recibí tu código QR único por email. Mostralo en la puerta para
                ingresar al evento.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="py-20 px-6 bg-fyf-black">
        <div className="max-w-5xl mx-auto">
          <h2 className="fyf-heading text-3xl md:text-4xl text-center mb-4">
            Eventos
          </h2>
          <div className="w-12 h-0.5 bg-fyf-red mx-auto mb-16" />

          {loading ? (
            <div className="text-center text-white/40 py-12">
              <div className="inline-block w-8 h-8 border-2 border-white/20 border-t-fyf-red rounded-full animate-spin" />
            </div>
          ) : upcomingEvents.length === 0 && pastEvents.length === 0 ? (
            <p className="text-center text-white/40 text-lg py-12">
              No hay eventos disponibles en este momento. Volvé pronto.
            </p>
          ) : (
            <>
              {/* Upcoming Events */}
              {upcomingEvents.length > 0 && (
                <div className="space-y-6 mb-16">
                  <h3 className="fyf-subheading text-sm text-fyf-red tracking-[0.3em] mb-8">
                    Próximos Eventos
                  </h3>
                  {upcomingEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/event/${event.slug}`}
                      className="block group"
                    >
                      <div className="border border-white/10 p-6 md:p-8 hover:border-fyf-red/50 hover:bg-white/[0.02] transition-all relative overflow-hidden">
                        {/* Decorative accent */}
                        <div className="absolute top-0 left-0 w-1 h-full bg-fyf-red transform scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />

                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="text-2xl md:text-3xl font-black uppercase tracking-wider group-hover:text-fyf-red-light transition-colors">
                              {event.name}
                            </h4>
                            {event.description && (
                              <p className="text-white/50 mt-2 text-sm md:text-base">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <div className="md:text-right shrink-0">
                            <p className="text-fyf-red font-bold uppercase text-sm tracking-wider">
                              {formatDate(event.date)}
                            </p>
                            <p className="text-white/50 text-sm mt-1">
                              {formatTime(event.date)}
                            </p>
                            {event.location && (
                              <p className="text-white/40 text-sm mt-1">
                                {event.location}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-fyf-red text-sm font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Ver Evento</span>
                          <span aria-hidden="true">&rarr;</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Past Events */}
              {pastEvents.length > 0 && (
                <div className="space-y-4">
                  <h3 className="fyf-subheading text-sm text-white/30 tracking-[0.3em] mb-6">
                    Eventos Pasados
                  </h3>
                  {pastEvents.map((event) => (
                    <div
                      key={event.id}
                      className="border border-white/5 p-5 opacity-50"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <h4 className="text-lg font-bold uppercase tracking-wider">
                          {event.name}
                        </h4>
                        <p className="text-white/40 text-sm">
                          {formatDate(event.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10 relative overflow-hidden">
        {/* Small decorative element */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.05]">
          <HaringFigure variant={0} className="w-20 h-20 text-white" />
        </div>

        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black tracking-wider text-fyf-red">
              F&F
            </span>
            <span className="text-white/30 text-sm">
              Friends & Family Tickets
            </span>
          </div>
          <div className="flex gap-6 text-sm text-white/30">
            <Link href="/login" className="hover:text-white/60 transition-colors">
              Admin
            </Link>
            <Link href="/validator" className="hover:text-white/60 transition-colors">
              Validador
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
