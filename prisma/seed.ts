import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcryptjs from "bcryptjs";
import { localInputToUtc } from "../src/lib/date";

const url = process.env.DATABASE_URL!;
const needsSsl = url.includes("sslmode=") || (url.startsWith("postgresql://") && !url.includes("localhost"));
// Strip sslmode from the connection string to prevent pg from overriding
// our ssl config (newer pg versions treat sslmode=require as verify-full)
const connectionString = needsSsl ? url.replace(/[?&]sslmode=[^&]*/g, "").replace(/\?$/, "") : url;
const pool = new pg.Pool({
  connectionString,
  ...(needsSsl && { ssl: { rejectUnauthorized: false } }),
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const hashedPassword = await bcryptjs.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: "admin@culpa.uy" },
    update: {},
    create: {
      email: "admin@culpa.uy",
      passwordHash: hashedPassword,
      name: "Admin",
      role: "ADMIN",
    },
  });

  // Primera fecha de Culpa, pública (sin lista): la Noche de la Nostalgia.
  // El precio es un placeholder para poder ver la pantalla de compra en local;
  // ajustalo desde /admin antes de abrir la venta de verdad.
  const event = await prisma.event.upsert({
    where: { slug: "noche-de-la-nostalgia" },
    update: {},
    create: {
      name: "Culpa · Noche de la Nostalgia",
      slug: "noche-de-la-nostalgia",
      description: "Reggaeton nostalgico. Open bar.",
      date: localInputToUtc("2026-08-24T00:00"),
      location: "Parada 10 de La Brava",
      isPublic: true,
      isActive: true,
    },
  });

  await prisma.ticketType.upsert({
    where: { eventId_name: { eventId: event.id, name: "Open Bar" } },
    update: {},
    create: {
      eventId: event.id,
      name: "Open Bar",
      price: 100_000, // $1.000 UYU — placeholder, cambialo en /admin
      currency: "UYU",
      sortOrder: 0,
    },
  });

  console.log("Seed completed:");
  console.log("  admin  admin@culpa.uy");
  console.log("  evento /event/noche-de-la-nostalgia (público, precio placeholder)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
