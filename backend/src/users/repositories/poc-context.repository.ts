import { prisma } from "../../config/prisma.js";

export class PocContextRepository {
  public getUsersAndDepartments() {
    return prisma.$transaction(async (transaction) => {
      const users = await transaction.user.findMany({
        orderBy: [{ role: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      const departments = await transaction.department.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
        },
      });

      return { users, departments };
    });
  }
}
