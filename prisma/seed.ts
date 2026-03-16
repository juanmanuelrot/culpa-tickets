import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcryptjs from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
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
