import { defineConfig } from "prisma/config";

// Load dotenv only if available (not needed in production where env vars are set by the platform)
try {
  require("dotenv/config");
} catch {}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
