import { DocumentRepository } from "../../documents/repositories/document.repository.js";
import { FileValidationService } from "../../documents/services/file-validation.service.js";
import { AppError } from "../../errors/app-error.js";
import { PermissionService } from "../../permissions/services/permission.service.js";
import { storageService, type StorageService } from "../../storage/index.js";
import type {
  CreatedVersionResponse,
  CreateVersionInput,
} from "../types/create-version.types.js";

export class VersionService {
  public constructor(
    private readonly documentRepository: DocumentRepository =
      new DocumentRepository(),
    private readonly fileValidationService: FileValidationService =
      new FileValidationService(),
    private readonly permissionService: PermissionService =
      new PermissionService(),
    private readonly storage: StorageService = storageService,
  ) {}

  public async create(input: CreateVersionInput): Promise<CreatedVersionResponse> {
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

    await this.permissionService.requireDocumentModification(
      input.uploader,
      input.documentId,
    );

    const validatedFile = await this.fileValidationService.validateFile(
      input.content,
      input.originalFilename,
    );
    const storedFile = await this.storage.save({
      content: validatedFile.content,
      originalFilename: validatedFile.originalFilename,
    });

    try {
      const version =
        await this.documentRepository.createVersionAndSetCurrent({
          documentId: input.documentId,
          uploaderId: input.uploader.id,
          storageKey: storedFile.storageKey,
          originalFilename: storedFile.originalFilename,
          mimeType: validatedFile.mimeType,
          fileSize: BigInt(validatedFile.fileSize),
        });

      return {
        version: {
          id: version.id,
          documentId: version.documentId,
          versionNumber: version.versionNumber,
          originalFilename: version.originalFilename,
          mimeType: version.mimeType,
          fileSize: Number(version.fileSize),
          uploaderId: version.uploaderId,
          uploadedAt: version.uploadedAt.toISOString(),
        },
      };
    } catch (error: unknown) {
      try {
        await this.storage.delete(storedFile.storageKey);
      } catch (cleanupError: unknown) {
        console.error("Failed to remove an orphaned version file", cleanupError);
      }

      if (error instanceof AppError) {
        throw error;
      }

      console.error("Failed to create document version metadata", error);
      throw new AppError(
        500,
        "VERSION_UPLOAD_FAILED",
        "The new document version could not be saved",
      );
    }
  }
}
