import { prisma } from "../config/prisma.js";

export class PermissionRepository {
  public findUserAccessIdentity(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        departmentId: true,
      },
    });
  }

  public findDocumentAccessPolicy(documentId: string) {
    return prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        uploaderId: true,
        accessScope: true,
      },
    });
  }

  public async hasDepartmentPermission(
    documentId: string,
    departmentId: string,
  ): Promise<boolean> {
    const permission = await prisma.documentDepartmentPermission.findUnique({
      where: {
        documentId_departmentId: {
          documentId,
          departmentId,
        },
      },
      select: { documentId: true },
    });

    return permission !== null;
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
