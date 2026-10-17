import { DocumentRepository } from "../documents/document.repository.js";
import { AppError } from "../errors/app-error.js";
import { PermissionService } from "../permissions/permission.service.js";
import { storageService, type StorageService } from "../storage/index.js";
import type {
  GetVersionDownloadInput,
  VersionDownload,
} from "./version-download.types.js";
import { VersionRepository } from "./version.repository.js";

export class VersionDownloadService {
  public constructor(
    private readonly documentRepository: DocumentRepository =
      new DocumentRepository(),
    private readonly versionRepository: VersionRepository =
      new VersionRepository(),
    private readonly permissionService: PermissionService =
      new PermissionService(),
    private readonly storage: StorageService = storageService,
  ) {}

  public async getDownload(
    input: GetVersionDownloadInput,
  ): Promise<VersionDownload> {
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

    const version =
      await this.versionRepository.findDownloadByDocumentAndVersion(
        input.documentId,
        input.versionId,
      );

    if (!version) {
      throw new AppError(
        404,
        "DOCUMENT_VERSION_NOT_FOUND",
        "The requested version was not found for this document",
      );
    }

    if (!(await this.storage.exists(version.storageKey))) {
      throw new AppError(
        404,
        "STORED_FILE_NOT_FOUND",
        "The stored file for this version was not found",
      );
    }

    return {
      stream: await this.storage.open(version.storageKey),
      originalFilename: version.originalFilename,
      mimeType: version.mimeType,
      fileSize: version.fileSize,
    };
  }
}
