import { prisma } from "../config/prisma.js";

export class TagRepository {
  public async attachToDocument(documentId: string, names: string[]) {
    return prisma.$transaction(async (transaction) => {
      const tags = await Promise.all(
        names.map((name) =>
          transaction.tag.upsert({
            where: { name },
            update: {},
            create: { name },
          }),
        ),
      );

      await transaction.documentTag.createMany({
        data: tags.map((tag) => ({
          documentId,
          tagId: tag.id,
        })),
        skipDuplicates: true,
      });

      return tags;
    });
  }
}
