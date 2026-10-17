# POC identity selector

`GET /api/poc-context` returns the available development users and departments
without requiring an `X-User-Id` header. The frontend uses it to populate its
current-user selector with the real seeded database IDs.

This route is intentionally labeled as a POC mechanism. It is not
authentication and must be replaced by a real identity provider, authenticated
session, and server-issued user context in production.
