import { AppError } from "../../errors/app-error.js";
import { PermissionService } from "../../permissions/services/permission.service.js";
import { DocumentRepository } from "../repositories/document.repository.js";
import type {
  DocumentDetailsResponse,
  GetDocumentDetailsInput,
} from "../types/document-details.types.js";

export class DocumentDetailsService {
  public constructor(
    private readonly documentRepository: DocumentRepository =
      new DocumentRepository(),
    private readonly permissionService: PermissionService =
      new PermissionService(),
  ) {}

  public async getDetails(
    input: GetDocumentDetailsInput,
  ): Promise<DocumentDetailsResponse> {
    const activeDocument = await this.documentRepository.findActiveById(
      input.documentId,
    );

    if (!activeDocument) {
      throw new AppError(
        404,
        "DOCUMENT_NOT_FOUND",
        "The requested document was not found",
      );
    }

    await this.permissionService.requireDocumentAccess(
      input.currentUser,
      input.documentId,
    );

    const document = await this.documentRepository.findDetailsById(
      input.documentId,
    );

    if (!document) {
      throw new AppError(
        404,
        "DOCUMENT_NOT_FOUND",
        "The requested document was not found",
      );
    }

    if (!document.currentVersion) {
      throw new AppError(
        500,
        "DOCUMENT_VERSION_MISSING",
        "The document does not have a current version",
      );
    }

    const currentVersion = {
      id: document.currentVersion.id,
      versionNumber: document.currentVersion.versionNumber,
      originalFilename: document.currentVersion.originalFilename,
      mimeType: document.currentVersion.mimeType,
      fileSize: Number(document.currentVersion.fileSize),
      uploaderId: document.currentVersion.uploaderId,
      uploadedAt: document.currentVersion.uploadedAt.toISOString(),
    };

    return {
      document: {
        id: document.id,
        title: document.title,
        accessScope: document.accessScope,
        uploader: document.uploader,
        tags: document.tags.map(({ tag }) => tag.name),
        permittedDepartments: document.departmentPermissions.map(
          ({ department }) => ({
            id: department.id,
            name: department.name,
          }),
        ),
        currentVersion,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
        download: {
          href: `/api/documents/${document.id}/versions/${currentVersion.id}/download`,
          filename: currentVersion.originalFilename,
          mimeType: currentVersion.mimeType,
          fileSize: currentVersion.fileSize,
          versionId: currentVersion.id,
        },
      },
    };
  }
}
