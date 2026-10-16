import { PermissionRepository } from "./permission.repository.js";

export class PermissionService {
  public constructor(
    private readonly permissionRepository: PermissionRepository =
      new PermissionRepository(),
  ) {}

  public grantToDepartment(documentId: string, departmentId: string) {
    return this.permissionRepository.grantToDepartment(documentId, departmentId);
  }

  public async canAccessDocument(
    userId: string,
    documentId: string,
  ): Promise<boolean> {
    const [user, document] = await Promise.all([
      this.permissionRepository.findUserAccessIdentity(userId),
      this.permissionRepository.findDocumentAccessPolicy(documentId),
    ]);

    if (!user || !document) {
      return false;
    }

    if (user.role === "ADMIN") {
      return true;
    }

    if (document.uploaderId === user.id) {
      return true;
    }

    if (document.accessScope === "ALL_DEPARTMENTS") {
      return true;
    }

    return this.permissionRepository.hasDepartmentPermission(
      document.id,
      user.departmentId,
    );
  }
}
