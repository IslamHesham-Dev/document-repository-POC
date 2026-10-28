import { randomUUID } from "node:crypto";
import {
  createReadStream,
  createWriteStream,
  type ReadStream,
} from "node:fs";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { pipeline } from "node:stream/promises";

import { env } from "../../config/env.js";
import { AppError } from "../../errors/app-error.js";
import type {
  SaveFileInput,
  StorageService,
  StoredFile,
} from "../../types/storage/storage.service.js";

const storageKeyPattern =
  /^[0-9a-f]{2}\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function isFileSystemError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

function validateOriginalFilename(filename: string): void {
  if (
    filename.length === 0 ||
    filename === "." ||
    filename === ".." ||
    filename.includes("/") ||
    filename.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(filename) ||
    Buffer.byteLength(filename, "utf8") > 255
  ) {
    throw new AppError(
      400,
      "INVALID_FILENAME",
      "The original filename is not valid",
    );
  }
}

export class LocalFileStorage implements StorageService {
  private readonly rootDirectory: string;

  public constructor(rootDirectory: string = env.uploadDir) {
    this.rootDirectory = resolve(rootDirectory);
  }

  public async save(input: SaveFileInput): Promise<StoredFile> {
    validateOriginalFilename(input.originalFilename);

    // A generated key, rather than the browser filename, controls the path.
    const id = randomUUID();
    const storageKey = `${id.slice(0, 2)}/${id}`;
    const filePath = this.resolveStorageKey(storageKey);

    await mkdir(resolve(filePath, ".."), { recursive: true });

    try {
      if (Buffer.isBuffer(input.content)) {
        await writeFile(filePath, input.content, { flag: "wx" });
      } else {
        await pipeline(
          input.content,
          createWriteStream(filePath, { flags: "wx" }),
        );
      }
    } catch (error: unknown) {
      await this.removeFileIfPresent(filePath);
      throw error;
    }

    return {
      storageKey,
      originalFilename: input.originalFilename,
    };
  }

  public async open(storageKey: string): Promise<ReadStream> {
    const filePath = this.resolveStorageKey(storageKey);

    try {
      const fileStats = await stat(filePath);

      if (!fileStats.isFile()) {
        throw new AppError(
          404,
          "STORED_FILE_NOT_FOUND",
          "The stored file was not found",
        );
      }
    } catch (error: unknown) {
      if (isFileSystemError(error) && error.code === "ENOENT") {
        throw new AppError(
          404,
          "STORED_FILE_NOT_FOUND",
          "The stored file was not found",
        );
      }

      throw error;
    }

    return createReadStream(filePath);
  }

  public async exists(storageKey: string): Promise<boolean> {
    const filePath = this.resolveStorageKey(storageKey);

    try {
      return (await stat(filePath)).isFile();
    } catch (error: unknown) {
      if (isFileSystemError(error) && error.code === "ENOENT") {
        return false;
      }

      throw error;
    }
  }

  public async delete(storageKey: string): Promise<void> {
    const filePath = this.resolveStorageKey(storageKey);
    await this.removeFileIfPresent(filePath);
  }

  private resolveStorageKey(storageKey: string): string {
    // Format validation plus the resolved-path containment check prevents path
    // traversal on save, open, exists, and delete.
    if (!storageKeyPattern.test(storageKey)) {
      throw new AppError(
        400,
        "INVALID_STORAGE_KEY",
        "The storage key is not valid",
      );
    }

    const filePath = resolve(this.rootDirectory, ...storageKey.split("/"));
    const relativePath = relative(this.rootDirectory, filePath);

    if (
      relativePath.startsWith(`..${sep}`) ||
      relativePath === ".." ||
      isAbsolute(relativePath)
    ) {
      throw new AppError(
        400,
        "INVALID_STORAGE_KEY",
        "The storage key is not valid",
      );
    }

    return filePath;
  }

  private async removeFileIfPresent(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
    } catch (error: unknown) {
      if (isFileSystemError(error) && error.code === "ENOENT") {
        return;
      }

      throw error;
    }
  }
}
