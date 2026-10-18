# Organization, accessibility, and security review

## Backend organization

- Controllers only translate HTTP inputs and outputs. A static scan found no Prisma imports or database calls in controller files.
- Services own validation, authorization calls, normalization, version rules, failure cleanup, and response mapping.
- Repositories contain all normal Prisma reads, writes, and transactions.
- Local filesystem behavior implements the `StorageService` interface and is injected into document, version, and download services.
- `PermissionService` supplies the same access and modification rules to search, details, version history, version upload, metadata updates, and downloads.
- Files are cohesive by concern; the largest production files are focused repositories, controllers, storage, or UI workspaces rather than all-purpose application files.

## Frontend organization and accessibility

- Route pages contain layout and metadata only. API calls are centralized in `app/lib/api.ts` and page behavior lives in focused workspace and form components.
- Shared shell, user selector, form field, status, upload, search, detail, and new-version components avoid repeated page logic.
- Loading, success, empty, and error feedback use consistent shared patterns and styling.
- Every form control has an accessible label through wrapping labels, fieldsets, legends, or explicit ARIA labels.
- Keyboard checks confirmed a logical focus order through navigation, the user selector, search fields, uploader selector, action buttons, upload fields, department checkboxes, and submit button. The Clear action also activated with Enter.

## Security basics

- `DATABASE_URL` is required from the environment; the backend no longer includes a fallback credential. Docker Compose also requires `POSTGRES_PASSWORD` from `.env`.
- Internal storage keys were removed from document-upload API responses.
- Generated UUID storage keys and strict key validation prevent browser filenames from controlling storage paths.
- Upload size and detected content type are validated by the backend. The browser provides an additional early validation layer.
- Authorization is enforced in backend services with reusable permission rules. The UI is not treated as the security boundary.
- API responses expose download metadata, never physical storage paths or keys.
- Unexpected errors return a sanitized `INTERNAL_SERVER_ERROR` response without stack traces.
- Application database operations use Prisma. No unsafe raw-SQL calls are present; the database diagnostic uses only Prisma's parameterized tagged-template query.

Automated coverage includes permissions, unauthorized access, file validation, path traversal rejection, search filters, uploads, details, history, and downloads. The integration suite also asserts that upload responses do not expose `storageKey`.
