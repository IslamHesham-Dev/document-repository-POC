import { FileValidationService } from "./file-validation.service.js";
import { DocumentRepository } from "../repositories/document.repository.js";
import type {
  CreateDocumentInput,
  CreatedDocumentResponse,
} from "../types/create-document.types.js";
import { normalizeTagName } from "../../tags/validation/tag.normalizer.js";
import { storageService, type StorageService } from "../../storage/index.js";
import { AppError } from "../../errors/app-error.js";

export class DocumentService {
  public constructor(
    private readonly documentRepository: DocumentRepository =
      new DocumentRepository(),
    private readonly fileValidationService: FileValidationService =
      new FileValidationService(),
    private readonly storage: StorageService = storageService,
  ) {}

  public async create(
    input: CreateDocumentInput,
  ): Promise<CreatedDocumentResponse> {
    const validatedFile = await this.fileValidationService.validate(
      input.content,
      {
        title: input.fields.title,
        originalFilename: input.originalFilename,
      },
    );

    const tags = [
      ...new Set(input.fields.tags.map((tag) => normalizeTagName(tag))),
    ];
    const permittedDepartmentIds = [
      ...new Set(input.fields.permittedDepartmentIds),
    ];

    const storedFile = await this.storage.save({
      content: validatedFile.content,
      originalFilename: validatedFile.originalFilename,
    });

    try {
      const document =
        await this.documentRepository.createWithInitialVersion({
          title: validatedFile.title,
          uploaderId: input.uploader.id,
          accessScope: input.fields.accessScope,
          tags,
          permittedDepartmentIds,
          storageKey: storedFile.storageKey,
          originalFilename: storedFile.originalFilename,
          mimeType: validatedFile.mimeType,
          fileSize: BigInt(validatedFile.fileSize),
        });

      if (!document.currentVersion) {
        throw new Error("Created document is missing its current version.");
      }

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
          currentVersion: {
            id: document.currentVersion.id,
            versionNumber: document.currentVersion.versionNumber,
            originalFilename: document.currentVersion.originalFilename,
            mimeType: document.currentVersion.mimeType,
            fileSize: Number(document.currentVersion.fileSize),
            uploadedAt: document.currentVersion.uploadedAt.toISOString(),
          },
          createdAt: document.createdAt.toISOString(),
          updatedAt: document.updatedAt.toISOString(),
        },
      };
    } catch (error: unknown) {
      try {
        await this.storage.delete(storedFile.storageKey);
      } catch (cleanupError: unknown) {
        console.error("Failed to remove an orphaned uploaded file", cleanupError);
      }

      if (error instanceof AppError) {
        throw error;
      }

      console.error("Failed to create document metadata", error);
      throw new AppError(
        500,
        "DOCUMENT_UPLOAD_FAILED",
        "The document could not be created",
      );
    }
  }
}
