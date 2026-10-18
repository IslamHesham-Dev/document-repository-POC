import { normalizeTagName } from "../validation/tag.normalizer.js";
import { TagRepository } from "../repositories/tag.repository.js";

export class TagService {
  public constructor(
    private readonly tagRepository: TagRepository = new TagRepository(),
  ) {}

  public async addToDocument(documentId: string, names: string[]) {
    const normalizedNames = [
      ...new Set(names.map((name) => normalizeTagName(name))),
    ];

    if (normalizedNames.length === 0) {
      return [];
    }

    return this.tagRepository.attachToDocument(documentId, normalizedNames);
  }
}
