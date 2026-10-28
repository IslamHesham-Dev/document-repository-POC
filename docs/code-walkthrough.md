# Code walkthrough

Use this file as a map while reading or explaining the project. The normal
direction is:

```text
Next.js page/component
  -> frontend app/lib/api.ts
  -> Express app.ts and routes/document.router.ts
  -> controller
  -> service
  -> repository and/or storage service
  -> PostgreSQL and/or the uploads directory
```

Controllers translate HTTP input and output. Services own decisions and
workflows. Repositories contain Prisma database access. Types describe the data
moving between layers. Validation modules contain reusable input rules.

## Application startup and identity

1. `backend/src/server.ts` starts the HTTP server using the validated port.
2. `backend/src/app.ts` configures CORS, JSON parsing, public routes, protected
   routes, and final error handlers.
3. `backend/src/middleware/user-context.middleware.ts` reads `X-User-Id`, loads
   the seeded user through `repositories/users/user.repository.ts`, and attaches
   that user to the Express request.
4. `frontend/app/context/current-user-context.tsx` loads the selectable users
   from `/api/poc-context` and remembers the selected development identity.
5. `frontend/app/lib/api.ts` sends that user ID with protected requests.

This is intentionally a POC identity mechanism, not authentication. A production
system would verify a session or access token and derive the user on the server.

## New document upload

1. `frontend/app/upload/page.tsx` renders
   `components/document-upload-form.tsx`.
2. The form performs quick user-friendly checks, then `app/lib/api.ts` builds a
   multipart request and sends `POST /api/documents`.
3. `backend/src/routes/document.router.ts` uses Multer to parse one file and
   selects `controllers/documents/create-document.controller.ts`.
4. The controller parses HTTP fields and calls
   `services/documents/document.service.ts`.
5. The service uses `file-validation.service.ts` to verify the title, size,
   original filename, and actual file bytes. It also normalizes tags.
6. The storage interface selects `local-file-storage.service.ts`, which creates
   a safe random storage key and saves the bytes outside the source folders.
7. `repositories/documents/document.repository.ts` runs one Prisma transaction
   that creates the document, permissions, tags, version 1, and current-version
   pointer.
8. If the database transaction fails, the service deletes the stored file so an
   orphan file is not left behind.

## Search

1. `frontend/app/documents/page.tsx` renders
   `components/document-search-workspace.tsx`.
2. The component converts filters and pagination into query parameters, and
   `app/lib/api.ts` sends `GET /api/documents`.
3. `controllers/search/document-search.controller.ts` validates the query.
4. `services/search/document-search.service.ts` combines title, tags, uploader,
   sorting, pagination, soft-deletion, and the current user's access rule.
5. `repositories/search/document-search.repository.ts` counts and loads only
   accessible documents. Unauthorized rows never reach the frontend.

## Details and version history

1. `frontend/app/documents/[id]/page.tsx` passes the URL ID to
   `components/document-details-workspace.tsx`.
2. The workspace loads details and history concurrently through `app/lib/api.ts`.
3. The respective controllers validate IDs and call
   `document-details.service.ts` and `version-history.service.ts`.
4. Both services reuse `permission.service.ts` before repositories load data.
5. Details come from `repositories/documents/document.repository.ts`; history
   comes from `repositories/versions/version.repository.ts` newest first.
6. Responses expose metadata and download identifiers, never physical paths.

## New version upload

1. `components/new-version-form.tsx` sends the replacement file through
   `app/lib/api.ts` to `POST /api/documents/:documentId/versions`.
2. `controllers/versions/create-version.controller.ts` validates HTTP input.
3. `services/versions/version.service.ts` confirms the document exists and that
   the user is its uploader or an administrator.
4. It validates and saves a new immutable file; previous files are untouched.
5. `repositories/documents/document.repository.ts` calculates the next number,
   creates the version, and advances the current-version pointer transactionally.
6. If database work fails, the service removes the newly stored file.

## Download

1. A download button calls `downloadDocumentVersion` in `frontend/app/lib/api.ts`.
2. `controllers/versions/version-download.controller.ts` validates both IDs.
3. `services/versions/version-download.service.ts` verifies document access,
   confirms the version belongs to that document, and checks file existence.
4. `local-file-storage.service.ts` safely resolves the generated key and opens a
   read stream.
5. The controller sends content headers and streams the file without loading the
   entire download into server memory.

## Metadata update

1. `controllers/documents/update-document-metadata.controller.ts` accepts only
   supported fields and rejects malformed JSON shapes.
2. `services/documents/update-document-metadata.service.ts` checks modification
   rights, validates the title, normalizes tags, and enforces access-scope rules.
3. `repositories/documents/document.repository.ts` replaces the relevant
   relationships in a transaction.
4. No version is created because the actual file has not changed.

## Authorization rules

`services/permissions/permission.service.ts` is the single policy source:

- Administrators can read and modify every active document.
- Uploaders can read and modify their own documents.
- Employees can read documents shared with their department.
- Every employee can read `ALL_DEPARTMENTS` documents.
- Department access is read-only; modification remains uploader/admin only.

Search embeds the read predicate directly in its query. Details, history, and
downloads call the same permission service before returning data.

## Failure handling

Controllers forward errors with `next(error)`. `errors/error.middleware.ts`
converts application errors, invalid JSON, multipart failures, and unexpected
errors into the same public shape. Stack traces and storage paths are never
returned. The frontend turns that shape into `ApiClientError` and displays a
useful state to the user.

## Database model map

`backend/prisma/schema.prisma` is the source of truth:

- `Department` groups employees and document permissions.
- `User` belongs to one department and can upload documents and versions.
- `Document` owns metadata and points to its current version.
- `DocumentVersion` is an immutable stored-file record.
- `Tag` and `DocumentTag` implement reusable many-to-many tagging.
- `DocumentDepartmentPermission` implements many-to-many department access.

The files in `backend/src/generated/prisma` are generated from this schema and
should be regenerated, not manually edited.

## Tests

`backend/src/tests/service.test.ts` isolates business rules with test doubles.
`backend/src/tests/api.integration.test.ts` exercises real HTTP workflows,
PostgreSQL records, permissions, downloads, and cleanup. The frontend is checked
with ESLint, TypeScript, and the Next.js production build.
