# Backend module boundaries

Each feature lives in its own top-level folder and uses these file roles as it grows:

- `*.controller.ts`: HTTP-only work such as reading requests, calling a service, and choosing the response status.
- `*.service.ts`: business rules and coordination. Services do not depend on Express request or response objects.
- `*.repository.ts`: database queries and persistence only. Repositories do not make HTTP decisions.
- `*.request.ts` and `*.response.ts`: public API contracts used at the HTTP boundary.
- `*.model.ts`: internal database records. Database models are never used as API request or response contracts.

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
