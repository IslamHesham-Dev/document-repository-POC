import { prisma } from "../src/config/prisma.js";
import { normalizeTagName } from "../src/validation/tags/tag.normalizer.js";

// Idempotent upserts make repeated development seeding safe. These records feed
// the frontend POC selector and provide predictable permission scenarios.

const departmentNames = ["Engineering", "Human Resources"] as const;

const tagNames = [
  "Engineering",
  "Company Policy",
  "Human Resources",
  "Confidential",
] as const;

async function seed(): Promise<void> {
  const departments = new Map<string, string>();

  for (const name of departmentNames) {
    const department = await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });

    departments.set(name, department.id);
  }

  const engineeringId = departments.get("Engineering");
  const humanResourcesId = departments.get("Human Resources");

  if (!engineeringId || !humanResourcesId) {
    throw new Error("Seed departments were not created correctly.");
  }

  const users = [
    {
      name: "Alex Admin",
      email: "admin@example.com",
      role: "ADMIN" as const,
      departmentId: engineeringId,
    },
    {
      name: "Erin Engineer",
      email: "engineer@example.com",
      role: "EMPLOYEE" as const,
      departmentId: engineeringId,
    },
    {
      name: "Harper People",
      email: "hr.employee@example.com",
      role: "EMPLOYEE" as const,
      departmentId: humanResourcesId,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        departmentId: user.departmentId,
      },
      create: user,
    });
  }

  for (const tagName of tagNames) {
    const name = normalizeTagName(tagName);

    await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(
    `Seed complete: ${departmentNames.length} departments, ${users.length} users, ${tagNames.length} tags.`,
  );
}

seed()
  .catch((error: unknown) => {
    console.error("Database seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
