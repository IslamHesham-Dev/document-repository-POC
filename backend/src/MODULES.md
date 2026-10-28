# Backend module boundaries

The backend uses a layer-first structure. Each top-level technical layer contains
feature folders such as `documents`, `versions`, `search`, and `users`.

```text
src/
├── controllers/
│   ├── documents/
│   ├── health/
│   ├── search/
│   ├── users/
│   └── versions/
├── services/
│   ├── documents/
│   ├── permissions/
│   ├── search/
│   ├── storage/
│   ├── tags/
│   ├── users/
│   └── versions/
├── repositories/
├── types/
├── validation/
├── routes/
├── utils/
├── middleware/
├── config/
├── errors/
└── tests/
```

- `controllers/`: reads HTTP input, calls services, and sends responses.
- `services/`: owns business rules and coordinates workflows.
- `repositories/`: contains Prisma database queries and transactions.
- `types/`: holds API and service contracts separately from database models.
- `validation/`: contains reusable validation and normalization functions.
- `routes/`: connects Express paths and middleware to controllers.
- `utils/`: contains small pure helpers.
- `middleware/`: contains reusable Express request middleware.
- `config/`: loads environment and database configuration.
- `errors/`: contains shared application errors and error handling.

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

For complete feature-by-feature request paths, continue with
[`docs/code-walkthrough.md`](../../docs/code-walkthrough.md).
