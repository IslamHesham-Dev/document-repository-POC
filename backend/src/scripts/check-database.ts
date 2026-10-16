import { prisma } from "../config/prisma.js";

type ConnectionDetails = {
  database: string;
  user: string;
};

try {
  const [connection] = await prisma.$queryRaw<ConnectionDetails[]>`
    SELECT current_database() AS database, current_user AS user
  `;

  if (!connection) {
    throw new Error("PostgreSQL did not return connection details.");
  }

  console.log(
    `Database connection successful: ${connection.database} as ${connection.user}`,
  );
} finally {
  await prisma.$disconnect();
}
