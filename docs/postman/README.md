# Postman manual verification

Import both JSON files in this folder and select the **Document Repository
Local** environment. Start the backend, then run the collection in order.

The collection uses the three seeded users and stores the uploaded document,
original version, and newest version IDs as collection variables. The included
text files are used for multipart upload requests.

For the two download requests, use **Save Response to file** in Postman if you
want to open the downloaded files manually. The collection also checks their
status, content type, original filename header, and exact response body. The
old-version request runs after version 2 is created, proving that version 1 is
still downloadable.

If the database has been reset after this environment was exported, update the
three user UUIDs and HR department UUID from the latest seed data.
