import { prisma } from "../../config/prisma.js";

export class VersionRepository {
  // Including documentId in the predicate prevents downloading a valid version
  // through the URL of a different document.
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
    // Storage keys stay private; history returns display metadata and whether
    // the reverse current-version relation points at each record.
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
