import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { FileValidationService } from "../services/documents/file-validation.service.js";
import { AppError } from "../errors/app-error.js";
import type { Prisma } from "../generated/prisma/client.js";
import { PermissionService } from "../services/permissions/permission.service.js";
import { DocumentSearchService } from "../services/search/document-search.service.js";
import { LocalFileStorage } from "../services/storage/local-file-storage.service.js";
import { normalizeTagName } from "../validation/tags/tag.normalizer.js";
import type { CurrentUser } from "../types/users/user-context.types.js";
import { calculateNextVersionNumber } from "../utils/versions/version-number.js";

const employee: CurrentUser = {
  id: "10000000-0000-4000-8000-000000000001",
  name: "Employee",
  email: "employee.test@example.com",
  role: "EMPLOYEE",
  departmentId: "20000000-0000-4000-8000-000000000001",
};
const admin: CurrentUser = {
  ...employee,
  id: "10000000-0000-4000-8000-000000000002",
  email: "admin.test@example.com",
  role: "ADMIN",
};

test("permission decisions build the expected admin and employee rules", () => {
  const service = new PermissionService();
  assert.deepEqual(service.getAccessibleDocumentWhere(admin), {});
  assert.deepEqual(service.getModifiableDocumentWhere(admin), {});
  assert.deepEqual(service.getModifiableDocumentWhere(employee), {
    uploaderId: employee.id,
  });

  const access = service.getAccessibleDocumentWhere(employee);
  assert.ok(Array.isArray(access.OR));
  assert.equal(access.OR.length, 3);
  assert.deepEqual(access.OR[0], { uploaderId: employee.id });
  assert.deepEqual(access.OR[1], { accessScope: "ALL_DEPARTMENTS" });
  assert.deepEqual(access.OR[2], {
    departmentPermissions: {
      some: { departmentId: employee.departmentId },
    },
  });
});

test("unauthorized access and modification return predictable errors", async () => {
  const rejectingRepository = {
    canAccessDocument: async () => false,
    grantToDepartment: async () => undefined,
  };
  const service = new PermissionService(rejectingRepository as never);

  await assert.rejects(
    service.requireDocumentAccess(employee, "30000000-0000-4000-8000-000000000001"),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 403 &&
      error.code === "DOCUMENT_ACCESS_DENIED",
  );
  await assert.rejects(
    service.requireDocumentModification(
      employee,
      "30000000-0000-4000-8000-000000000001",
    ),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 403 &&
      error.code === "DOCUMENT_MODIFICATION_DENIED",
  );
});

test("tag normalization trims, folds case, and collapses whitespace", () => {
  assert.equal(normalizeTagName("  Finance   POLICY  "), "finance policy");
  assert.equal(normalizeTagName("Ｆｉｎａｎｃｅ"), "finance");
  assert.throws(
    () => normalizeTagName("   "),
    (error: unknown) =>
      error instanceof AppError && error.code === "INVALID_TAG_NAME",
  );
});

test("new version numbering starts at one and increments the maximum", () => {
  assert.equal(calculateNextVersionNumber(null), 1);
  assert.equal(calculateNextVersionNumber(1), 2);
  assert.equal(calculateNextVersionNumber(41), 42);
});

test("invalid uploads reject empty, unsupported, and missing-title files", async () => {
  const service = new FileValidationService();

  await assert.rejects(
    service.validate(Buffer.alloc(0), {
      title: "Empty",
      originalFilename: "empty.txt",
    }),
    (error: unknown) => error instanceof AppError && error.code === "EMPTY_FILE",
  );
  await assert.rejects(
    service.validate(Buffer.from([0, 255, 0, 255]), {
      title: "Binary",
      originalFilename: "binary.exe",
    }),
    (error: unknown) =>
      error instanceof AppError && error.code === "UNSUPPORTED_FILE_TYPE",
  );
  await assert.rejects(
    service.validate(Buffer.from("valid text"), {
      title: undefined,
      originalFilename: "valid.txt",
    }),
    (error: unknown) =>
      error instanceof AppError && error.code === "INVALID_DOCUMENT_TITLE",
  );
});

test("local storage rejects path traversal inputs", async () => {
  const storage = new LocalFileStorage(join(tmpdir(), "document-storage-test"));

  await assert.rejects(
    storage.exists("../outside-file"),
    (error: unknown) =>
      error instanceof AppError && error.code === "INVALID_STORAGE_KEY",
  );
  await assert.rejects(
    storage.save({
      content: Buffer.from("safe content"),
      originalFilename: "../escape.txt",
    }),
    (error: unknown) =>
      error instanceof AppError && error.code === "INVALID_FILENAME",
  );
});

test("search service constructs permission-aware combined filters", async () => {
  let capturedWhere: Prisma.DocumentWhereInput | undefined;
  const searchRepository = {
    search: async (input: { where: Prisma.DocumentWhereInput }) => {
      capturedWhere = input.where;
      return { documents: [], totalItems: 0 };
    },
  };
  const permissionService = {
    getAccessibleDocumentWhere: () => ({
      OR: [{ uploaderId: employee.id }, { accessScope: "ALL_DEPARTMENTS" }],
    }),
  };
  const service = new DocumentSearchService(
    searchRepository as never,
    permissionService as never,
  );

  const response = await service.search({
    currentUser: employee,
    title: "policy",
    tags: ["finance", "confidential"],
    uploaderId: admin.id,
    page: 2,
    pageSize: 10,
    sortBy: "title",
    sortOrder: "asc",
  });

  assert.deepEqual(capturedWhere, {
    AND: [
      { deletedAt: null },
      {
        OR: [{ uploaderId: employee.id }, { accessScope: "ALL_DEPARTMENTS" }],
      },
      { title: { contains: "policy", mode: "insensitive" } },
      { uploaderId: admin.id },
      { tags: { some: { tag: { name: "finance" } } } },
      { tags: { some: { tag: { name: "confidential" } } } },
    ],
  });
  assert.deepEqual(response.pagination, {
    page: 2,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: true,
  });
});

