# Backend module boundaries

The backend is organized feature-first, with technical classifications inside
each feature. A feature can contain `controllers`, `services`, `repositories`,
`types`, `validation`, or `utils` when those responsibilities are needed.

- `controllers/`: HTTP-only work such as reading requests, calling a service,
  and choosing the response status.
- `services/`: business rules and workflow coordination. Services do not depend
  on Express request or response objects.
- `repositories/`: database queries and persistence only. Repositories do not
  make HTTP decisions.
- `types/`: request, response, and internal service contracts kept separate from
  generated Prisma database models.
- `validation/`: reusable normalization and validation functions.
- `utils/`: small pure helpers that do not belong to another layer.

For example:

```text
documents/
├── controllers/
├── repositories/
├── services/
├── types/
├── validation/
└── document.router.ts
```

The initial modules have these responsibilities:

- `config`: environment and application configuration.
- `middleware`: reusable Express middleware.
- `users`: user accounts and uploader identity.
- `documents`: document metadata and document workflows.
- `versions`: document version history.
- `tags`: tags and document-tag relationships.
- `permissions`: document access rules.
- `storage`: file storage operations.
- `search`: document search and filtering.
- `errors`: application errors and centralized error handling.

The `health` module is the first implemented example: its controller owns the HTTP response, while its response type is defined separately.
