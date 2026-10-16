import { prisma } from "../config/prisma.js";
import { AppError } from "../errors/app-error.js";

export type CreateDocumentRecordInput = {
  accessScope: "RESTRICTED" | "ALL_DEPARTMENTS";
  fileSize: bigint;
  mimeType: string;
  originalFilename: string;
  permittedDepartmentIds: string[];
  storageKey: string;
  tags: string[];
  title: string;
  uploaderId: string;
};

export class DocumentRepository {
  public createWithInitialVersion(input: CreateDocumentRecordInput) {
    return prisma.$transaction(async (transaction) => {
      if (input.permittedDepartmentIds.length > 0) {
        const departments = await transaction.department.findMany({
          where: { id: { in: input.permittedDepartmentIds } },
          select: { id: true },
        });

        if (departments.length !== input.permittedDepartmentIds.length) {
          throw new AppError(
            400,
            "UNKNOWN_DEPARTMENT",
            "One or more permitted departments do not exist",
          );
        }
      }

      const document = await transaction.document.create({
        data: {
          title: input.title,
          uploaderId: input.uploaderId,
          accessScope: input.accessScope,
        },
      });

      if (input.permittedDepartmentIds.length > 0) {
        await transaction.documentDepartmentPermission.createMany({
          data: input.permittedDepartmentIds.map((departmentId) => ({
            documentId: document.id,
            departmentId,
          })),
        });
      }

      const tags: Array<{ id: string; name: string }> = [];

      for (const name of input.tags) {
        tags.push(
          await transaction.tag.upsert({
            where: { name },
            update: {},
            create: { name },
          }),
        );
      }

      if (tags.length > 0) {
        await transaction.documentTag.createMany({
          data: tags.map((tag) => ({
            documentId: document.id,
            tagId: tag.id,
          })),
        });
      }

      const version = await transaction.documentVersion.create({
        data: {
          documentId: document.id,
          versionNumber: 1,
          originalFilename: input.originalFilename,
          storageKey: input.storageKey,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          uploaderId: input.uploaderId,
        },
      });

      await transaction.document.update({
        where: { id: document.id },
        data: { currentVersionId: version.id },
      });

      return transaction.document.findUniqueOrThrow({
        where: { id: document.id },
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          currentVersion: true,
          tags: {
            include: { tag: true },
            orderBy: { tag: { name: "asc" } },
          },
          departmentPermissions: {
            include: { department: true },
            orderBy: { department: { name: "asc" } },
          },
        },
      });
    });
  }
}
