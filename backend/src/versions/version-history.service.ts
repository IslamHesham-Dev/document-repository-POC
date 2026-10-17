import { DocumentRepository } from "../documents/document.repository.js";
import { AppError } from "../errors/app-error.js";
import { PermissionService } from "../permissions/permission.service.js";
import type {
  GetVersionHistoryInput,
  VersionHistoryResponse,
} from "./version-history.types.js";
import { VersionRepository } from "./version.repository.js";

export class VersionHistoryService {
  public constructor(
    private readonly documentRepository: DocumentRepository =
      new DocumentRepository(),
    private readonly versionRepository: VersionRepository =
      new VersionRepository(),
    private readonly permissionService: PermissionService =
      new PermissionService(),
  ) {}

  public async getHistory(
    input: GetVersionHistoryInput,
  ): Promise<VersionHistoryResponse> {
    const document = await this.documentRepository.findActiveById(
      input.documentId,
    );

    if (!document) {
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

    const versions = await this.versionRepository.findHistoryByDocumentId(
      input.documentId,
    );

    return {
      documentId: input.documentId,
      versions: versions.map((version) => ({
        id: version.id,
        versionNumber: version.versionNumber,
        uploader: version.uploader,
        originalFilename: version.originalFilename,
        mimeType: version.mimeType,
        fileSize: Number(version.fileSize),
        uploadedAt: version.uploadedAt.toISOString(),
        isCurrent: version.currentFor !== null,
      })),
    };
  }
}
