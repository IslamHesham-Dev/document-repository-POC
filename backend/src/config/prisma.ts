import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "./env.js";

const prismaGlobal = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: env.databaseUrl,
  });

  return new PrismaClient({ adapter });
}

export const prisma = prismaGlobal.prisma ?? createPrismaClient();

if (env.nodeEnv !== "production") {
  prismaGlobal.prisma = prisma;
}
