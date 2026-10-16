# POC user context

All routes under `/api` require an `X-User-Id` request header. The value must be the UUID of an existing user in PostgreSQL.

The middleware loads that user from the database and attaches a limited user context to the Express request. Missing, malformed, and unknown user IDs are rejected with `401` responses. The public `/health` endpoint does not require this header.

For a quick check, call `GET /api/me` with a seeded user's ID:

```http
GET /api/me HTTP/1.1
Host: localhost:3000
X-User-Id: <existing-user-uuid>
```

## Production replacement

This is assessment-only identification, not authentication. A client can impersonate another user by changing the header.

A production system must use a real identity provider, signed session or access token, secure transport, token expiry, and server-side verification. The verified identity—not a client-supplied user ID header—must be used to load the current user and apply authorization rules.
