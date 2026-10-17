# Automated tests

Run all tests from `backend/`:

```text
npm test
```

Run one group when working on a focused change:

```text
npm run test:service
npm run test:integration
```

The service suite isolates business rules with test doubles. It covers
permission decisions, denied access, tag normalization, version-number
calculation, upload validation, and permission-aware combined search filters.

The API integration suite starts the Express app on an available local port and
uses the configured PostgreSQL database and local file storage. It creates
uniquely named departments, users, documents, tags, and versions, then removes
all database records and stored files in cleanup even if an assertion fails.

PostgreSQL must be running and the backend environment variables must be valid
before running integration tests.
