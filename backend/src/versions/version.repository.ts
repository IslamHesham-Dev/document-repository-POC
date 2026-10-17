import { prisma } from "../config/prisma.js";

export class VersionRepository {
  public findDownloadByDocumentAndVersion(
    documentId: string,
    versionId: string,
  ) {
    return prisma.documentVersion.findFirst({
      where: {
        id: versionId,
        documentId,
      },
      select: {
        id: true,
        originalFilename: true,
        storageKey: true,
        mimeType: true,
        fileSize: true,
      },
    });
  }

  public findHistoryByDocumentId(documentId: string) {
    return prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { versionNumber: "desc" },
      select: {
        id: true,
        versionNumber: true,
        originalFilename: true,
        mimeType: true,
        fileSize: true,
        uploadedAt: true,
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        currentFor: {
          select: { id: true },
        },
      },
    });
  }
}
