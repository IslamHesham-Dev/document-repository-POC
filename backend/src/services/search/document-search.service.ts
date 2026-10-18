import type { Prisma } from "../../generated/prisma/client.js";
import { PermissionService } from "../permissions/permission.service.js";
import type {
  DocumentSearchInput,
  DocumentSearchResponse,
} from "../../types/search/document-search.types.js";
import { DocumentSearchRepository } from "../../repositories/search/document-search.repository.js";

export class DocumentSearchService {
  public constructor(
    private readonly searchRepository: DocumentSearchRepository =
      new DocumentSearchRepository(),
    private readonly permissionService: PermissionService =
      new PermissionService(),
  ) {}

  public async search(
    input: DocumentSearchInput,
  ): Promise<DocumentSearchResponse> {
    const filters: Prisma.DocumentWhereInput[] = [
      { deletedAt: null },
      this.permissionService.getAccessibleDocumentWhere(input.currentUser),
    ];

    if (input.title) {
      filters.push({
        title: { contains: input.title, mode: "insensitive" },
      });
    }

    if (input.uploaderId) {
      filters.push({ uploaderId: input.uploaderId });
    }

    for (const tag of input.tags) {
      filters.push({
        tags: {
          some: {
            tag: { name: tag },
          },
        },
      });
    }

    const { documents, totalItems } = await this.searchRepository.search({
      where: { AND: filters },
      page: input.page,
      pageSize: input.pageSize,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
    });
    const totalPages = Math.ceil(totalItems / input.pageSize);

    return {
      documents: documents.map((document) => ({
        id: document.id,
        title: document.title,
        accessScope: document.accessScope,
        uploader: document.uploader,
        tags: document.tags.map(({ tag }) => tag.name),
        currentVersion: document.currentVersion
          ? {
              id: document.currentVersion.id,
              versionNumber: document.currentVersion.versionNumber,
              originalFilename: document.currentVersion.originalFilename,
              mimeType: document.currentVersion.mimeType,
              fileSize: Number(document.currentVersion.fileSize),
              uploadedAt: document.currentVersion.uploadedAt.toISOString(),
            }
          : null,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
      })),
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        totalItems,
        totalPages,
        hasNextPage: input.page < totalPages,
        hasPreviousPage: input.page > 1,
      },
      sorting: {
        sortBy: input.sortBy,
        sortOrder: input.sortOrder,
      },
    };
  }
}
