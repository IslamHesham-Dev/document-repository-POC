import type { Readable } from "node:stream";

// This contract keeps business services independent from local disk. A cloud
// adapter can implement the same operations without changing those services.
export type SaveFileInput = {
  content: Buffer | Readable;
  originalFilename: string;
};

export type StoredFile = {
  storageKey: string;
  originalFilename: string;
};

export interface StorageService {
  save(input: SaveFileInput): Promise<StoredFile>;
  open(storageKey: string): Promise<Readable>;
  exists(storageKey: string): Promise<boolean>;
  delete(storageKey: string): Promise<void>;
}
