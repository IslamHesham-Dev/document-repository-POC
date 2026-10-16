import { prisma } from "../config/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

export class PermissionRepository {
  public async canAccessDocument(
    documentId: string,
    accessWhere: Prisma.DocumentWhereInput,
  ): Promise<boolean> {
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        ...accessWhere,
      },
      select: { id: true },
    });

    return document !== null;
  }

  public grantToDepartment(documentId: string, departmentId: string) {
    return prisma.documentDepartmentPermission.upsert({
      where: {
        documentId_departmentId: {
          documentId,
          departmentId,
        },
      },
      update: {},
      create: {
        documentId,
        departmentId,
      },
    });
  }
}
