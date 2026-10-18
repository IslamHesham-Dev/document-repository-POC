import { prisma } from "../../config/prisma.js";

export class UserRepository {
  public findCurrentUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
      },
    });
  }
}
