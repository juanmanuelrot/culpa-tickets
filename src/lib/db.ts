import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as { prisma: InstanceType<typeof PrismaClient> };

function createPrismaClient() {
  const url = process.env.DATABASE_URL!;
  const needsSsl = url.includes("sslmode=") || url.startsWith("postgresql://") && !url.includes("localhost");
  // Strip sslmode from the connection string to prevent pg from overriding
  // our ssl config (newer pg versions treat sslmode=require as verify-full)
  const connectionString = needsSsl ? url.replace(/[?&]sslmode=[^&]*/g, "").replace(/\?$/, "") : url;
  const pool = new pg.Pool({
    connectionString,
    ...(needsSsl && { ssl: { rejectUnauthorized: false } }),
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
