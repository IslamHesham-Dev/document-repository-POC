import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

import dotenv from "dotenv";

const environmentFiles = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "..", ".env"),
];

const environmentFile = environmentFiles.find(existsSync);
const environmentDirectory = environmentFile
  ? dirname(environmentFile)
  : process.cwd();

if (environmentFile) {
  dotenv.config({ path: environmentFile });
}

function readPositiveInteger(name: string, fallback: number): number {
  const rawValue = process.env[name];

  if (rawValue === undefined) {
    return fallback;
  }

  const value = Number(rawValue);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return value;
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? "development",
  backendPort: readPositiveInteger("BACKEND_PORT", 3000),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://document_user:document_password@localhost:5432/document_repository",
  frontendApiUrl:
    process.env.FRONTEND_API_URL ?? "http://localhost:3000/api",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  uploadDir: resolve(environmentDirectory, process.env.UPLOAD_DIR ?? "uploads"),
  maxFileSize: readPositiveInteger("MAX_FILE_SIZE", 10 * 1024 * 1024),
});
