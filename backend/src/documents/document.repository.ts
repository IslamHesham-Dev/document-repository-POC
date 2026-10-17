import { prisma } from "../config/prisma.js";
import { AppError } from "../errors/app-error.js";
import { calculateNextVersionNumber } from "../versions/version-number.js";

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

export type CreateDocumentVersionRecordInput = {
  documentId: string;
  fileSize: bigint;
  mimeType: string;
  originalFilename: string;
  storageKey: string;
  uploaderId: string;
};

export type UpdateDocumentMetadataRecordInput = {
  accessScope?: "RESTRICTED" | "ALL_DEPARTMENTS";
  documentId: string;
  permittedDepartmentIds?: string[];
  tags?: string[];
  title?: string;
};

export class DocumentRepository {
  public findActiveById(documentId: string) {
    return prisma.document.findFirst({
      where: { id: documentId, deletedAt: null },
      select: { id: true, uploaderId: true },
    });
  }

  public findDetailsById(documentId: string) {
    return prisma.document.findFirst({
      where: { id: documentId, deletedAt: null },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          include: { tag: true },
          orderBy: { tag: { name: "asc" } },
        },
        departmentPermissions: {
          include: { department: true },
          orderBy: { department: { name: "asc" } },
        },
        currentVersion: {
          select: {
            id: true,
            versionNumber: true,
            originalFilename: true,
            mimeType: true,
            fileSize: true,
            uploaderId: true,
            uploadedAt: true,
          },
        },
      },
    });
  }

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

  public createVersionAndSetCurrent(input: CreateDocumentVersionRecordInput) {
    return prisma.$transaction(async (transaction) => {
      const lockedDocuments = await transaction.document.updateMany({
        where: { id: input.documentId, deletedAt: null },
        data: { updatedAt: new Date() },
      });

      if (lockedDocuments.count === 0) {
        throw new AppError(
          404,
          "DOCUMENT_NOT_FOUND",
          "The requested document was not found",
        );
      }

      const latestVersion = await transaction.documentVersion.aggregate({
        where: { documentId: input.documentId },
        _max: { versionNumber: true },
      });
      const nextVersionNumber = calculateNextVersionNumber(
        latestVersion._max.versionNumber,
      );

      const version = await transaction.documentVersion.create({
        data: {
          documentId: input.documentId,
          versionNumber: nextVersionNumber,
          originalFilename: input.originalFilename,
          storageKey: input.storageKey,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          uploaderId: input.uploaderId,
        },
      });

      await transaction.document.update({
        where: { id: input.documentId },
        data: { currentVersionId: version.id },
      });

      return version;
    });
  }

  public updateMetadata(input: UpdateDocumentMetadataRecordInput) {
    return prisma.$transaction(async (transaction) => {
      if (input.permittedDepartmentIds !== undefined) {
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

      if (input.tags !== undefined) {
        const tags: Array<{ id: string }> = [];

        for (const name of input.tags) {
          tags.push(
            await transaction.tag.upsert({
              where: { name },
              update: {},
              create: { name },
              select: { id: true },
            }),
          );
        }

        await transaction.documentTag.deleteMany({
          where: { documentId: input.documentId },
        });

        if (tags.length > 0) {
          await transaction.documentTag.createMany({
            data: tags.map(({ id: tagId }) => ({
              documentId: input.documentId,
              tagId,
            })),
          });
        }
      }

      if (
        input.permittedDepartmentIds !== undefined ||
        input.accessScope === "ALL_DEPARTMENTS"
      ) {
        await transaction.documentDepartmentPermission.deleteMany({
          where: { documentId: input.documentId },
        });

        if (
          input.accessScope !== "ALL_DEPARTMENTS" &&
          input.permittedDepartmentIds &&
          input.permittedDepartmentIds.length > 0
        ) {
          await transaction.documentDepartmentPermission.createMany({
            data: input.permittedDepartmentIds.map((departmentId) => ({
              documentId: input.documentId,
              departmentId,
            })),
          });
        }
      }

      return transaction.document.update({
        where: { id: input.documentId },
        data: {
          ...(input.title === undefined ? {} : { title: input.title }),
          ...(input.accessScope === undefined
            ? {}
            : { accessScope: input.accessScope }),
          updatedAt: new Date(),
        },
        select: { id: true, updatedAt: true },
      });
    });
  }
}
