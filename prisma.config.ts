import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: "file:./prisma/dev.db",
  },
  migrations: {
    seed: "npx ts-node prisma/seed.ts",
  },
});
