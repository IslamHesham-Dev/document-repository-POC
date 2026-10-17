import { prisma } from "../config/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";
import type {
  DocumentSortField,
  SortOrder,
} from "./document-search.types.js";

export type SearchDocumentsRecordInput = {
  page: number;
  pageSize: number;
  sortBy: DocumentSortField;
  sortOrder: SortOrder;
  where: Prisma.DocumentWhereInput;
};

function createOrderBy(
  sortBy: DocumentSortField,
  sortOrder: SortOrder,
): Prisma.DocumentOrderByWithRelationInput[] {
  if (sortBy === "title") {
    return [{ title: sortOrder }, { id: "asc" }];
  }

  if (sortBy === "updatedAt") {
    return [{ updatedAt: sortOrder }, { id: "asc" }];
  }

  return [{ createdAt: sortOrder }, { id: "asc" }];
}

export class DocumentSearchRepository {
  public async search(input: SearchDocumentsRecordInput) {
    return prisma.$transaction(async (transaction) => {
      const totalItems = await transaction.document.count({
        where: input.where,
      });
      const documents = await transaction.document.findMany({
        where: input.where,
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        orderBy: createOrderBy(input.sortBy, input.sortOrder),
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          currentVersion: {
            select: {
              id: true,
              versionNumber: true,
              originalFilename: true,
              mimeType: true,
              fileSize: true,
              uploadedAt: true,
            },
          },
          tags: {
            include: { tag: true },
            orderBy: { tag: { name: "asc" } },
          },
        },
      });

      return { documents, totalItems };
    });
  }
}
