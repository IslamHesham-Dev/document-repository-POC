import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

const backendDirectory = dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: resolve(backendDirectory, "..", ".env"),
});

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
