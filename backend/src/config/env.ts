import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

import dotenv from "dotenv";

// Configuration is read once at startup so invalid required values fail fast
// instead of causing a less clear error during a request.
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

function readRequiredString(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

export const env = Object.freeze({
  // This immutable object is the only environment-variable interface used by
  // the backend. Other modules import typed, validated values from here.
  nodeEnv: process.env.NODE_ENV ?? "development",
  backendPort: readPositiveInteger("BACKEND_PORT", 3000),
  databaseUrl: readRequiredString("DATABASE_URL"),
  frontendApiUrl:
    process.env.FRONTEND_API_URL ?? "http://localhost:3000/api",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  uploadDir: resolve(environmentDirectory, process.env.UPLOAD_DIR ?? "uploads"),
  maxFileSize: readPositiveInteger("MAX_FILE_SIZE", 10 * 1024 * 1024),
});
