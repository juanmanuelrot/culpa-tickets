import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcryptjs from "bcryptjs";

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
    where: { email: "admin@fyf.com" },
    update: {},
    create: {
      email: "admin@fyf.com",
      passwordHash: hashedPassword,
      name: "Admin",
      role: "ADMIN",
    },
  });

  console.log("Seed completed: admin user created (admin@fyf.com)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
