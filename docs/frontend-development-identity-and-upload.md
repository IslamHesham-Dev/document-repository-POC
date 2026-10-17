# Frontend development identity and upload

The header contains a clearly labeled **POC identity** selector. It loads the
current database users and departments from `GET /api/poc-context`, defaults to
the seeded engineer when available, displays the selected role and department,
and saves the choice locally in the browser.

This selector is development-only and is not authentication. API calls made by
the frontend send the selected user's UUID in `X-User-Id`.

The upload page provides title, file, tag, and permitted-department inputs. It
checks required values, file extension, empty files, and the 10 MB limit before
sending. Uploads use browser upload progress events, disable the form while in
progress, display API error codes and messages, and link to the new document
after success.
