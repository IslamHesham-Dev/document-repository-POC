import { AppError } from "../../errors/app-error.js";
import { PermissionService } from "../permissions/permission.service.js";
import { normalizeTagName } from "../../validation/tags/tag.normalizer.js";
import { DocumentDetailsService } from "./document-details.service.js";
import type { DocumentDetailsResponse } from "../../types/documents/document-details.types.js";
import { validateDocumentTitle } from "../../validation/documents/document-metadata.validation.js";
import { DocumentRepository } from "../../repositories/documents/document.repository.js";
import type { UpdateDocumentMetadataInput } from "../../types/documents/update-document-metadata.types.js";

export class UpdateDocumentMetadataService {
  public constructor(
    private readonly documentRepository: DocumentRepository =
      new DocumentRepository(),
    private readonly permissionService: PermissionService =
      new PermissionService(),
    private readonly documentDetailsService: DocumentDetailsService =
      new DocumentDetailsService(),
  ) {}

  public async update(
    input: UpdateDocumentMetadataInput,
  ): Promise<DocumentDetailsResponse> {
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
      input.currentUser,
      input.documentId,
    );

    const tags =
      input.fields.tags === undefined
        ? undefined
        : [
            ...new Set(
              input.fields.tags.map((tag) => normalizeTagName(tag)),
            ),
          ];
    const permittedDepartmentIds = input.fields.permittedDepartmentIds
      ? [...new Set(input.fields.permittedDepartmentIds)]
      : undefined;
    const accessScope =
      permittedDepartmentIds === undefined
        ? input.fields.accessScope
        : input.fields.accessScope ?? "RESTRICTED";

    if (
      accessScope === "ALL_DEPARTMENTS" &&
      permittedDepartmentIds !== undefined &&
      permittedDepartmentIds.length > 0
    ) {
      throw new AppError(
        400,
        "CONFLICTING_PERMISSIONS",
        "ALL_DEPARTMENTS documents cannot include department permissions",
      );
    }

    await this.documentRepository.updateMetadata({
      documentId: input.documentId,
      title:
        input.fields.title === undefined
          ? undefined
          : validateDocumentTitle(input.fields.title),
      tags,
      permittedDepartmentIds,
      accessScope,
    });

    return this.documentDetailsService.getDetails({
      documentId: input.documentId,
      currentUser: input.currentUser,
    });
  }
}
