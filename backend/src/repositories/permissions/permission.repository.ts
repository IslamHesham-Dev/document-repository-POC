import { prisma } from "../../config/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";

export class PermissionRepository {
  public async canAccessDocument(
    documentId: string,
    accessWhere: Prisma.DocumentWhereInput,
  ): Promise<boolean> {
    // The service supplies either the read or modification predicate; this
    // repository turns that policy into a minimal existence query.
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        deletedAt: null,
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
