# Document Repository POC

## Project summary

Document Repository POC is a full-stack, permission-aware repository for uploading, organizing, searching, viewing, versioning, and downloading controlled documents. The Next.js frontend provides the user workflow, the Express and TypeScript API enforces validation and authorization, PostgreSQL stores metadata and relationships, and a replaceable storage service keeps the physical files. The proof of concept uses seeded users selected through an `X-User-Id` header so that department and administrator access rules can be demonstrated without building an unrelated login system.

## Architecture

![Document repository architecture](docs/document-repository-architecture.png)

```text
Browser
  -> Next.js frontend on http://localhost:5173
  -> Express API on http://localhost:3000
     -> PostgreSQL for users, metadata, permissions, tags, and versions
     -> Local filesystem storage for immutable file contents
```

The frontend never connects directly to PostgreSQL or the upload directory. Every operation goes through the API, where the current user is loaded, permissions are checked, input is validated, and database or storage work is performed.

## Design choices

- **Separate metadata and file contents.** PostgreSQL stores searchable metadata and a generated storage key; the physical PDF, DOCX, or TXT bytes remain in the configured upload directory.
- **Stable documents with immutable versions.** A `Document` is the logical record, while every uploaded file is a separate `DocumentVersion`. `currentVersionId` identifies the active version without removing older versions.
- **Feature-first backend modules with classified layers.** Each business feature groups its `controllers`, `services`, `repositories`, `types`, validation, and utilities. Controllers handle HTTP, services enforce business rules, and repositories own Prisma access.
- **Centralized authorization.** `PermissionService` supplies the same read and modification rules to search, details, history, downloads, version uploads, and metadata updates.
- **Transaction-backed metadata.** Related document, version, tag, and department-permission writes commit together. If persistence fails after a file is saved, the service removes that file.
- **Replaceable storage.** Business logic depends on a `StorageService` interface with `save`, `open`, `exists`, and `delete` operations. The current implementation uses local disk.
- **Content-based file validation.** The backend inspects file bytes instead of trusting only the browser filename or reported MIME type.
- **Predictable API errors.** Errors use a shared `{ "error": { "code", "message" } }` shape and do not expose stack traces.

## Assumptions

- This is an assessment proof of concept, not a production authentication system.
- A user belongs to exactly one department.
- Administrators can read and modify every active document.
- The original uploader can always read and modify their document.
- Department permission grants read access, not modification access.
- A restricted document with no permitted departments is private to its uploader and administrators.
- Old file versions are immutable and remain downloadable.
- Metadata-only edits do not create file versions.
- `deletedAt` represents the soft-deletion strategy, although no delete endpoint is exposed.
- Local filesystem storage is suitable for a single backend instance during the assessment.

## Technology stack

| Area | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Node.js, Express 5, TypeScript |
| Database access | Prisma 7 with the PostgreSQL adapter |
| Database | PostgreSQL 16 |
| File upload | Multer with backend content validation |
| File storage | Local filesystem behind `StorageService` |
| Testing | Node.js test runner, service tests, and API integration tests |
| Local infrastructure | Docker Desktop and Docker Compose |

## Prerequisites

- **Node.js 22 LTS recommended.** The project was verified with Node.js `22.18.0`. Next.js requires Node.js `20.9.0` or later.
- npm, included with Node.js. The verified npm version is `10.9.3`.
- Docker Desktop with Docker Compose enabled.
- Available ports:
  - `5432` for PostgreSQL
  - `3000` for the backend
  - `5173` for the frontend

There is no root `package.json`. Run npm commands from `backend/` or `frontend/` as shown below.

## Project structure

```text
document-repository-POC/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── config/
│       ├── documents/
│       │   ├── controllers/
│       │   ├── repositories/
│       │   ├── services/
│       │   ├── types/
│       │   ├── validation/
│       │   └── document.router.ts
│       ├── permissions/
│       │   ├── repositories/
│       │   └── services/
│       ├── search/
│       │   ├── controllers/
│       │   ├── repositories/
│       │   ├── services/
│       │   └── types/
│       ├── storage/
│       │   ├── services/
│       │   ├── types/
│       │   └── index.ts
│       ├── tags/
│       │   ├── repositories/
│       │   ├── services/
│       │   └── validation/
│       ├── users/
│       │   ├── controllers/
│       │   ├── repositories/
│       │   ├── services/
│       │   └── types/
│       ├── versions/
│       │   ├── controllers/
│       │   ├── repositories/
│       │   ├── services/
│       │   ├── types/
│       │   └── utils/
│       ├── errors/
│       ├── middleware/
│       ├── tests/
│       ├── app.ts
│       └── server.ts
├── frontend/
│   └── app/
│       ├── components/
│       ├── context/
│       ├── documents/
│       ├── lib/
│       ├── types/
│       └── upload/
├── docs/
├── uploads/
├── docker-compose.yml
├── .env.example
└── README.md
```

## Environment configuration

From the project root, create the real local environment file:

```powershell
Copy-Item .env.example .env
```

Review `.env` and set at least the PostgreSQL password. The default development configuration is:

```dotenv
POSTGRES_USER=document_user
POSTGRES_PASSWORD=document_password
POSTGRES_DB=document_repository
POSTGRES_PORT=5432

DATABASE_URL=postgresql://document_user:document_password@localhost:5432/document_repository
BACKEND_PORT=3000
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

`POSTGRES_PASSWORD` and the password inside `DATABASE_URL` must match. Real `.env` files and uploaded files are ignored by `.gitignore`.

## Start PostgreSQL

Open Docker Desktop and wait until it reports that the Docker engine is running. Then, from the project root:

```powershell
docker compose up -d postgres
docker compose ps
```

The `document-repository-postgres-data` named volume preserves PostgreSQL data across normal container restarts.

To view PostgreSQL logs:

```powershell
docker compose logs postgres
```

To stop the service without deleting its data:

```powershell
docker compose stop postgres
```

Do not add `-v` when stopping if the development database must be preserved.

## Install and prepare the backend

Open a PowerShell terminal in the project root:

```powershell
Set-Location backend
npm install
npm run prisma:generate
npm run db:migrate
npm run db:seed
npm run db:check
```

What these commands do:

- `prisma:generate` creates the typed Prisma client in `backend/src/generated/prisma`.
- `db:migrate` applies missing migrations to PostgreSQL.
- `db:seed` creates repeatable development departments, users, and tags.
- `db:check` confirms that Prisma can connect to PostgreSQL.

Start the backend:

```powershell
npm run dev
```

The API is available at `http://localhost:3000`. Verify it with `http://localhost:3000/health`.

## Seed data

The seed command is idempotent and can be run more than once:

```powershell
Set-Location backend
npm run db:seed
```

It creates:

| User | Email | Role | Department |
| --- | --- | --- | --- |
| Alex Admin | `admin@example.com` | ADMIN | Engineering |
| Erin Engineer | `engineer@example.com` | EMPLOYEE | Engineering |
| Harper People | `hr.employee@example.com` | EMPLOYEE | Human Resources |

It also creates the Engineering and Human Resources departments and normalized sample tags.

To deliberately reset the database and recreate seed data:

```powershell
npm run db:reset
```

The reset command removes existing development database records. It does not automatically remove physical files already present in the upload directory.

## Install and start the frontend

Keep the backend running. Open a second PowerShell terminal in the project root:

```powershell
Set-Location frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

The main routes are:

- `/` — project introduction.
- `/upload` — upload a new document and create version 1.
- `/documents` — permission-aware search.
- `/documents/:id` — details, version history, downloads, and new-version upload.

## POC user context

The header contains a **POC identity** selector populated by the public `GET /api/poc-context` endpoint. The selected UUID is saved in browser local storage and sent to protected API requests as:

```http
X-User-Id: <seeded-user-uuid>
```

The backend validates the UUID, loads the corresponding user from PostgreSQL, and attaches the user to the request. This mechanism demonstrates authorization but is not authentication. A production system should use a verified session, OAuth/OIDC token, or organizational identity provider and should never let the browser choose an arbitrary identity.

Read access is granted when the selected user is an administrator, is the original uploader, belongs to a permitted department, or the document is available to all departments. Modification is limited to administrators and the original uploader.

## Supported files

The backend accepts:

- PDF (`application/pdf`)
- DOCX (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`)
- UTF-8 plain text (`text/plain`)

The default maximum size is **10 MB** (`10485760` bytes). Empty files, files over the configured limit, unsafe filenames, and unsupported file contents are rejected. The browser performs an early extension and size check, but the backend remains authoritative and inspects the actual bytes.

## API endpoint summary

All `/api/documents` routes require `X-User-Id`.

| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| GET | `/health` | Confirm the Express process is responding | Public |
| GET | `/api/poc-context` | List seeded users and departments | Public |
| GET | `/api/me` | Return the current POC user | Valid POC user |
| GET | `/api/documents` | Search by title, tag, and uploader with pagination and sorting | Read rules |
| POST | `/api/documents` | Upload a file and create document version 1 | Valid POC user |
| GET | `/api/documents/:documentId` | Return document details and current download information | Read rules |
| PATCH | `/api/documents/:documentId` | Update title, tags, permissions, or access scope | Admin or uploader |
| GET | `/api/documents/:documentId/versions` | Return immutable version history newest first | Read rules |
| POST | `/api/documents/:documentId/versions` | Upload the next immutable version | Admin or uploader |
| GET | `/api/documents/:documentId/versions/:versionId/download` | Stream one exact version | Read rules |

Search example:

```http
GET /api/documents?title=policy&tag=finance&uploaderId=<uuid>&page=1&pageSize=20&sortBy=updatedAt&sortOrder=desc
```

Standard error response:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "The requested document was not found"
  }
}
```

## Testing

PostgreSQL must be running for the integration suite.

```powershell
Set-Location backend
npm run typecheck
npm run build
npm test
```

Focused backend suites:

```powershell
npm run test:service
npm run test:integration
```

Frontend verification:

```powershell
Set-Location frontend
npm run lint
npm run build
```

A Postman collection and environment are available in `docs/postman/`.

## Improvements with more time

- Replace `X-User-Id` with real authentication and verified user sessions.
- Replace local storage with S3, Azure Blob Storage, or another shared object store.
- Stream large uploads or use direct-to-object-storage multipart uploads instead of memory buffering.
- Add antivirus or malware scanning before making uploaded files available.
- Add a frontend metadata editor and an `ALL_DEPARTMENTS` control.
- Implement the soft-delete and restore workflows represented by `deletedAt`.
- Record audit events for upload, metadata changes, access, and downloads.
- Add database and storage readiness checks to `/health`.
- Add rate limiting, security headers, structured logs, metrics, and tracing.
- Add full-text extraction and search inside supported document contents.
- Add background jobs for previews, thumbnails, scanning, and indexing.
- Add object-storage lifecycle rules, retention policies, and backup procedures.
- Add continuous integration for type checking, tests, builds, and migration verification.
