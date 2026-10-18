# Document Repository POC

## Project summary

A full-stack document repository for uploading, searching, viewing, downloading, and versioning files. The system stores metadata in PostgreSQL, keeps physical files in local storage, and applies uploader, department, and administrator permissions through the backend.

## Demo

[Watch the application demo](https://drive.google.com/file/d/1GgE9LuGs8I0i6Zwh0LB3V79TW9GIGoz8/view?usp=sharing)

## Architecture

![Document repository architecture](docs/document-repository-architecture.png)

The Next.js frontend sends requests to the Express API. The API validates files and permissions, stores metadata through Prisma in PostgreSQL, and stores file contents through a replaceable local storage service.

## Design choices and assumptions

Documents and file versions are separate so old versions remain unchanged and downloadable. PostgreSQL stores searchable metadata while the filesystem stores file contents. Employees can access their own documents or documents permitted for their department, while administrators can access everything. The `X-User-Id` mechanism is only for this POC and would be replaced with real authentication in production.

## Technology stack

- Next.js 16, React 19, TypeScript, and Tailwind CSS 4
- Node.js and Express 5
- Prisma 7 and PostgreSQL 16
- Docker Desktop and Docker Compose
- Multer for multipart uploads
- Node.js test runner for service and API tests

## Prerequisites

- Node.js 22 LTS recommended; verified with Node.js `22.18.0`
- npm
- Docker Desktop
- Free ports `5432`, `3000`, and `5173`

## Environment configuration

From the project root, create the local environment file:

```powershell
Copy-Item .env.example .env
```

The important values are `DATABASE_URL`, `POSTGRES_PASSWORD`, `BACKEND_PORT`, `CORS_ORIGIN`, `UPLOAD_DIR`, `MAX_FILE_SIZE`, and `NEXT_PUBLIC_API_URL`. The PostgreSQL password in `DATABASE_URL` must match `POSTGRES_PASSWORD`.

## Run the application

Start PostgreSQL from the project root:

```powershell
docker compose up -d postgres
docker compose ps
```

Prepare and start the backend:

```powershell
Set-Location backend
npm install
npm run prisma:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open another terminal and start the frontend:

```powershell
Set-Location frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The backend runs at `http://localhost:3000`, and its health endpoint is `http://localhost:3000/health`.

## Seed data and POC users

Run `npm run db:seed` from `backend/` whenever the sample users are needed. The seed creates Alex Admin, Erin Engineer from Engineering, and Harper People from Human Resources.

The user selector sends the selected seeded user UUID in the `X-User-Id` header. This demonstrates authorization without building a login system. It is not production authentication.

## Supported files

The application accepts PDF, DOCX, and UTF-8 TXT files. The default maximum size is 10 MB. The backend rejects empty files, unsafe filenames, oversized files, and unsupported file contents.

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Check whether the backend is running |
| GET | `/api/poc-context` | List seeded users and departments |
| GET | `/api/me` | Return the selected POC user |
| GET | `/api/documents` | Search documents with filters and pagination |
| POST | `/api/documents` | Upload a document and create version 1 |
| GET | `/api/documents/:documentId` | Get document details |
| PATCH | `/api/documents/:documentId` | Update document metadata |
| GET | `/api/documents/:documentId/versions` | Get version history |
| POST | `/api/documents/:documentId/versions` | Upload a new version |
| GET | `/api/documents/:documentId/versions/:versionId/download` | Download a specific version |

All document endpoints require the `X-User-Id` header. Search supports title, tag, uploader, pagination, and sorting filters.

## Project organization

The backend is organized by technical layer. Top-level `controllers`, `services`, `repositories`, `types`, `validation`, `routes`, and `utils` directories contain smaller feature folders such as `documents`, `versions`, and `search`. Controllers handle HTTP, services contain business rules, and repositories contain Prisma database access. The frontend keeps pages small and places shared behavior in components, context, API helpers, and response types.

## Testing

Run backend checks from `backend/`:

```powershell
npm run typecheck
npm run build
npm test
```

Run frontend checks from `frontend/`:

```powershell
npm run lint
npm run build
```

The Postman collection is available in `docs/postman/`.

## Improvements with more time

The next improvements would be real authentication, cloud object storage, malware scanning, audit logs, metadata editing in the frontend, soft-delete and restore actions, file-content search, better readiness checks, background processing, and automated CI deployment checks.
