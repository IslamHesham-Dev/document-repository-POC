# End-to-end verification

## Frontend and API wiring

- Every frontend request is routed through `app/lib/api.ts` and the configured `NEXT_PUBLIC_API_URL` value.
- Authenticated requests send the selected POC identity in `X-User-Id`.
- The POC context request is intentionally public because it supplies the seeded user selector.
- Frontend response types were compared with the backend controller response types for POC context, search, details, version history, document creation, and version creation.
- No mock or fixture data is present in the frontend application.
- The CORS preflight allows the frontend origin, `Content-Type`, and `X-User-Id`. Download filename and length headers are exposed to the browser.

## Required workflow

The browser workflow was verified with Erin Engineer and a document restricted to Engineering:

1. Uploaded version 1 with `objective44` and `engineering` tags.
2. Found the document independently by title, tag, and uploader.
3. Opened details and downloaded version 1.
4. Uploaded version 2 and confirmed both immutable versions appeared.
5. Downloaded version 1 again after version 2 became current.
6. Switched to Harper People in Human Resources.
7. Confirmed the document disappeared from search and its direct details URL returned the friendly forbidden state.

## Failure checks

| Case | Expected result | Verified result |
| --- | --- | --- |
| Missing title | `400 INVALID_DOCUMENT_TITLE` | Passed |
| Unsupported binary type | `400 UNSUPPORTED_FILE_TYPE` | Passed |
| File over 10 MB | `413 FILE_TOO_LARGE` | Passed |
| Unknown document | `404 DOCUMENT_NOT_FOUND` | Passed |
| Unauthorized document | `403 DOCUMENT_ACCESS_DENIED` | Passed |
| Version from another document | `404 DOCUMENT_VERSION_NOT_FOUND` | Passed |
| PostgreSQL unavailable | Sanitized `500 INTERNAL_SERVER_ERROR` | Passed |
| PostgreSQL restored | API returns `200` again | Passed |

The upload page also displayed clear client-side messages for a missing title, blocked extension, and oversized file before attempting an upload.
