import { AppError } from "../../errors/app-error.js";

export function normalizeTagName(name: string): string {
  // Unicode normalization, whitespace folding, and lowercasing produce one
  // canonical form before the repository applies the unique database key.
  const normalizedName = name
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");

  if (normalizedName.length === 0) {
    throw new AppError(400, "INVALID_TAG_NAME", "Tag names cannot be empty");
  }

  return normalizedName;
}
