import { prisma } from "../config/prisma.js";

export class VersionRepository {
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
