import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { randomUUID } from "node:crypto";

import { app } from "../app.js";
import { prisma } from "../config/prisma.js";
import { storageService } from "../services/storage/index.js";

test("document repository API integration", async (context) => {
  const marker = randomUUID().slice(0, 8);
  const financeTag = `integration-finance-${marker}`;
  const policyTag = `integration-policy-${marker}`;
  const fixtureUserIds: string[] = [];
  const fixtureDepartmentIds: string[] = [];
  let documentId: string | undefined;
  let currentVersionId: string | undefined;
  const server = app.listen(0);
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const address = server.address() as AddressInfo;
  const apiRoot = `http://127.0.0.1:${address.port}/api`;
  const apiUrl = `${apiRoot}/documents`;

  async function readJson(response: Response): Promise<Record<string, any>> {
    return (await response.json()) as Record<string, any>;
  }

  async function get(
    path: string,
    userId: string,
  ): Promise<{ response: Response; body: Record<string, any> }> {
    const response = await fetch(`${apiUrl}${path}`, {
      headers: { "X-User-Id": userId },
    });
    return { response, body: await readJson(response) };
  }

  try {
    const [sharedDepartment, outsideDepartment] = await Promise.all([
      prisma.department.create({
        data: { name: `Integration Shared ${marker}` },
      }),
      prisma.department.create({
        data: { name: `Integration Outside ${marker}` },
      }),
    ]);
    fixtureDepartmentIds.push(sharedDepartment.id, outsideDepartment.id);
    const [admin, uploader, departmentViewer, outsider] = await Promise.all([
      prisma.user.create({
        data: {
          name: "Integration Admin",
          email: `integration-admin-${marker}@example.com`,
          role: "ADMIN",
          departmentId: outsideDepartment.id,
        },
      }),
      prisma.user.create({
        data: {
          name: "Integration Uploader",
          email: `integration-uploader-${marker}@example.com`,
          role: "EMPLOYEE",
          departmentId: outsideDepartment.id,
        },
      }),
      prisma.user.create({
        data: {
          name: "Integration Department Viewer",
          email: `integration-viewer-${marker}@example.com`,
          role: "EMPLOYEE",
          departmentId: sharedDepartment.id,
        },
      }),
      prisma.user.create({
        data: {
          name: "Integration Outsider",
          email: `integration-outsider-${marker}@example.com`,
          role: "EMPLOYEE",
          departmentId: outsideDepartment.id,
        },
      }),
    ]);
    fixtureUserIds.push(admin.id, uploader.id, departmentViewer.id, outsider.id);

    await context.test("POC context lists development identities", async () => {
      const response = await fetch(`${apiRoot}/poc-context`);
      const body = await readJson(response);
      assert.equal(response.status, 200);
      assert.equal(body.identityMechanism, "POC_X_USER_ID");
      assert.ok(
        body.users.some((user: { id: string }) => user.id === uploader.id),
      );
      assert.ok(
        body.departments.some(
          (department: { id: string }) => department.id === sharedDepartment.id,
        ),
      );
    });

    await context.test("successful upload", async () => {
      const form = new FormData();
      form.append(
        "file",
        new Blob(["integration version one"], { type: "text/plain" }),
        "integration-v1.txt",
      );
      form.append("title", `Integration Policy ${marker}`);
      form.append("tags", JSON.stringify([financeTag, policyTag]));
      form.append(
        "permittedDepartmentIds",
        JSON.stringify([sharedDepartment.id]),
      );
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "X-User-Id": uploader.id },
        body: form,
      });
      const body = await readJson(response);
      assert.equal(response.status, 201);
      assert.equal(body.document.currentVersion.versionNumber, 1);
      assert.equal(
        "storageKey" in body.document.currentVersion,
        false,
        "Upload responses must not expose internal storage keys",
      );
      documentId = body.document.id as string;
      currentVersionId = body.document.currentVersion.id as string;
    });
    assert.ok(documentId && currentVersionId, "Upload fixture was not created");

    await context.test("upload with missing title", async () => {
      const form = new FormData();
      form.append(
        "file",
        new Blob(["missing title"], { type: "text/plain" }),
        "missing-title.txt",
      );
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "X-User-Id": uploader.id },
        body: form,
      });
      const body = await readJson(response);
      assert.equal(response.status, 400);
      assert.equal(body.error.code, "INVALID_DOCUMENT_TITLE");
    });

    await context.test("disallowed file type", async () => {
      const form = new FormData();
      form.append(
        "file",
        new Blob([new Uint8Array([0, 255, 0, 255])], {
          type: "application/octet-stream",
        }),
        "malware.exe",
      );
      form.append("title", "Disallowed file");
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "X-User-Id": uploader.id },
        body: form,
      });
      const body = await readJson(response);
      assert.equal(response.status, 400);
      assert.equal(body.error.code, "UNSUPPORTED_FILE_TYPE");
    });

    await context.test("successful search", async () => {
      const result = await get(
        `?title=${encodeURIComponent(marker)}`,
        departmentViewer.id,
      );
      assert.equal(result.response.status, 200);
      assert.ok(
        result.body.documents.some(
          (document: { id: string }) => document.id === documentId,
        ),
      );
    });

    await context.test("combined search filters", async () => {
      const query = new URLSearchParams({
        title: "policy",
        tag: financeTag,
        uploaderId: uploader.id,
        page: "1",
        pageSize: "10",
        sortBy: "title",
        sortOrder: "asc",
      });
      const result = await get(`?${query.toString()}`, admin.id);
      assert.equal(result.response.status, 200);
      assert.deepEqual(
        result.body.documents.map((document: { id: string }) => document.id),
        [documentId],
      );
    });

    await context.test("department filtering", async () => {
      const query = `?title=${encodeURIComponent(marker)}`;
      const allowed = await get(query, departmentViewer.id);
      const denied = await get(query, outsider.id);
      assert.ok(
        allowed.body.documents.some(
          (document: { id: string }) => document.id === documentId,
        ),
      );
      assert.ok(
        denied.body.documents.every(
          (document: { id: string }) => document.id !== documentId,
        ),
      );
    });

    await context.test("document not found", async () => {
      const result = await get(`/${randomUUID()}`, admin.id);
      assert.equal(result.response.status, 404);
      assert.equal(result.body.error.code, "DOCUMENT_NOT_FOUND");
    });

    await context.test("forbidden details request", async () => {
      const result = await get(`/${documentId}`, outsider.id);
      assert.equal(result.response.status, 403);
      assert.equal(result.body.error.code, "DOCUMENT_ACCESS_DENIED");
    });

    await context.test("successful version history", async () => {
      const form = new FormData();
      form.append(
        "file",
        new Blob(["integration version two"], { type: "text/plain" }),
        "integration-v2.txt",
      );
      const uploadResponse = await fetch(`${apiUrl}/${documentId}/versions`, {
        method: "POST",
        headers: { "X-User-Id": uploader.id },
        body: form,
      });
      const uploadBody = await readJson(uploadResponse);
      assert.equal(uploadResponse.status, 201);
      currentVersionId = uploadBody.version.id as string;

      const history = await get(
        `/${documentId}/versions`,
        departmentViewer.id,
      );
      assert.equal(history.response.status, 200);
      assert.deepEqual(
        history.body.versions.map(
          (version: { versionNumber: number }) => version.versionNumber,
        ),
        [2, 1],
      );
    });

    await context.test("successful download", async () => {
      assert.ok(currentVersionId);
      const response = await fetch(
        `${apiUrl}/${documentId}/versions/${currentVersionId}/download`,
        { headers: { "X-User-Id": departmentViewer.id } },
      );
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("content-type"), "text/plain");
      assert.match(
        response.headers.get("content-disposition") ?? "",
        /filename="integration-v2\.txt"/,
      );
      assert.equal(await response.text(), "integration version two");
    });

    await context.test("download of unknown version", async () => {
      const result = await get(
        `/${documentId}/versions/${randomUUID()}/download`,
        departmentViewer.id,
      );
      assert.equal(result.response.status, 404);
      assert.equal(result.body.error.code, "DOCUMENT_VERSION_NOT_FOUND");
    });
  } finally {
    const documents = await prisma.document.findMany({
      where: { uploaderId: { in: fixtureUserIds } },
      include: { versions: { select: { storageKey: true } } },
    });
    await prisma.document.deleteMany({
      where: { id: { in: documents.map(({ id }) => id) } },
    });
    await Promise.all(
      documents.flatMap(({ versions }) =>
        versions.map(({ storageKey }) => storageService.delete(storageKey)),
      ),
    );
    await prisma.tag.deleteMany({
      where: { name: { in: [financeTag, policyTag] } },
    });
    await prisma.user.deleteMany({ where: { id: { in: fixtureUserIds } } });
    await prisma.department.deleteMany({
      where: { id: { in: fixtureDepartmentIds } },
    });
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await prisma.$disconnect();
  }
});
