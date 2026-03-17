"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HaringBorder } from "@/components/decorative/haring-border";

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
      {/* Hero Section */}
      <section className="relative bg-fyf-red min-h-[80vh] flex flex-col items-center justify-center overflow-hidden">
        <HaringBorder />
        <div className="relative z-10 text-center px-6">
          <h1 className="text-8xl md:text-[10rem] font-black text-white tracking-wider leading-none">
            F&F
          </h1>
          <p className="text-2xl md:text-3xl text-white/90 italic mt-4 mb-2">
            Solo para nosotros
          </p>
          <p className="text-sm md:text-base text-white/60 uppercase tracking-[0.3em] mt-2">
            Friends & Family Tickets
          </p>
          {upcomingEvents.length > 0 && (
            <div className="mt-10 flex gap-4 justify-center flex-wrap">
              <a
                href="#events"
                className="bg-white text-fyf-red font-bold text-lg uppercase tracking-widest px-10 py-4 hover:bg-fyf-cream transition-colors"
              >
                Ver Eventos
              </a>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 bg-fyf-black">
        <div className="max-w-4xl mx-auto">
          <h2 className="fyf-heading text-3xl md:text-4xl text-center mb-16">
            Cómo Funciona
          </h2>
          <div className="grid md:grid-cols-3 gap-10 text-center">
            <div>
              <div className="text-5xl font-black text-fyf-red mb-4">01</div>
              <h3 className="fyf-subheading text-lg mb-3">Lista Exclusiva</h3>
              <p className="text-white/60 leading-relaxed">
                Solo personas en la lista de invitados pueden acceder a los
                tickets. Verificamos tu identidad para mantener la exclusividad.
              </p>
            </div>
            <div>
              <div className="text-5xl font-black text-fyf-red mb-4">02</div>
              <h3 className="fyf-subheading text-lg mb-3">Comprá tu Ticket</h3>
              <p className="text-white/60 leading-relaxed">
                Elegí tu tipo de entrada y completá la compra de forma segura.
                Tickets gratuitos y pagos disponibles.
              </p>
            </div>
            <div>
              <div className="text-5xl font-black text-fyf-red mb-4">03</div>
              <h3 className="fyf-subheading text-lg mb-3">QR de Entrada</h3>
              <p className="text-white/60 leading-relaxed">
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
          <h2 className="fyf-heading text-3xl md:text-4xl text-center mb-16">
            Eventos
          </h2>

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
                      <div className="border border-white/10 p-6 md:p-8 hover:border-fyf-red/50 hover:bg-white/[0.02] transition-all">
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
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
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
