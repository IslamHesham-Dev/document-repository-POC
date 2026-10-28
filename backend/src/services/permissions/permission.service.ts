import { AppError } from "../../errors/app-error.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { CurrentUser } from "../../types/users/user-context.types.js";
import { PermissionRepository } from "../../repositories/permissions/permission.repository.js";

export class PermissionService {
  public constructor(
    private readonly permissionRepository: PermissionRepository =
      new PermissionRepository(),
  ) {}

  public grantToDepartment(documentId: string, departmentId: string) {
    return this.permissionRepository.grantToDepartment(documentId, departmentId);
  }

  public getAccessibleDocumentWhere(
    user: CurrentUser,
  ): Prisma.DocumentWhereInput {
    // Read access: admins see all; employees see their own, organization-wide,
    // or explicitly department-permitted documents.
    if (user.role === "ADMIN") {
      return {};
    }

    return {
      OR: [
        { uploaderId: user.id },
        { accessScope: "ALL_DEPARTMENTS" },
        {
          departmentPermissions: {
            some: { departmentId: user.departmentId },
          },
        },
      ],
    };
  }

  public canAccessDocument(user: CurrentUser, documentId: string) {
    return this.permissionRepository.canAccessDocument(
      documentId,
      this.getAccessibleDocumentWhere(user),
    );
  }

  public getModifiableDocumentWhere(
    user: CurrentUser,
  ): Prisma.DocumentWhereInput {
    // Write access is deliberately narrower than read access.
    return user.role === "ADMIN" ? {} : { uploaderId: user.id };
  }

  public canModifyDocument(user: CurrentUser, documentId: string) {
    return this.permissionRepository.canAccessDocument(
      documentId,
      this.getModifiableDocumentWhere(user),
    );
  }

  public async requireDocumentAccess(
    user: CurrentUser,
    documentId: string,
  ): Promise<void> {
    const canAccess = await this.canAccessDocument(user, documentId);

    if (!canAccess) {
      throw new AppError(
        403,
        "DOCUMENT_ACCESS_DENIED",
        "You do not have permission to access this document",
      );
    }
  }

  public async requireDocumentModification(
    user: CurrentUser,
    documentId: string,
  ): Promise<void> {
    const canModify = await this.canModifyDocument(user, documentId);

    if (!canModify) {
      throw new AppError(
        403,
        "DOCUMENT_MODIFICATION_DENIED",
        "You do not have permission to modify this document",
      );
    }
  }
}
