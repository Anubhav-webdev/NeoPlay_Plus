# NeoPlay+ backend

## Media verification setup

The media upload API uses MongoDB for upload state and fingerprints, Redis/BullMQ
for background processing, and Cloudinary for permanent media storage. The
separate worker must be running for uploads to move beyond the queued state.

1. Install a supported Node.js version and have MongoDB, Redis, and a Cloudinary
   account available.
2. From `Backend`, install dependencies and create a local environment file:

   ```powershell
   npm install
   Copy-Item .env.example .env
   ```

3. Set `DB_URL`, `DB_NAME`, token secrets, `REDIS_URL`, and the Cloudinary
   credentials in `.env`. Keep this file private. `MEDIA_TEMP_DIR` must be a
   writable directory with enough space for the upload and converted file.
4. Start the API and worker in separate terminals:

   ```powershell
   npm run dev
   npm run worker
   ```

   If the API and worker run on separate machines, they must share the same
   `MEDIA_TEMP_DIR` path and contents because queued jobs refer to staged files.
5. Set `VITE_API_BASE_URL` in the frontend environment to the API URL ending in
   `/api` (for example, `http://localhost:5000/api`), then run the frontend
   development server.

   If an earlier deployment created the `expiresAt_1` TTL index on the
   `mediaassets` collection, remove it with `db.mediaassets.dropIndex("expiresAt_1")`.
   The worker must remove each staged file before its review document expires;
   review expiry is now handled by the worker rather than MongoDB's TTL monitor.

The creator dashboard upload form only creates image/video posts after the
worker reports the associated media asset as `ready`. Tweet attachments, when
provided, use the same verification workflow. Uploads awaiting review are not
published. The dashboard's personal content list is loaded from
`GET /api/content/mine`. Published videos, images, and tweets appear on their
respective frontend feeds; admins can review possible matches at
`/admin/media-reviews`.

## Creating an admin account

First create a normal account through the frontend using the email you intend
to administer with. To grant admin access, open a terminal in `Backend` and
run the following with that exact email:

```powershell
npm run admin:promote -- admin@example.com --confirm
```

This is a local maintenance command, not a public API. It requires the
MongoDB connection in `Backend/.env` and the explicit `--confirm` flag. Keep
database credentials private and only grant this role to trusted accounts.
After it succeeds, sign out and sign in again, then open
`/admin/media-reviews`.

## Implemented detection and limitations

- Exact duplicates are checked with SHA-256 before queueing; MongoDB's unique
  hash reservation protects concurrent uploads.
- Images use crop/rotation variants of perceptual hashes. Videos use sampled
  frame perceptual hashes and ordered sequence matching to tolerate some edge
  trims and inserted frames.
- Thresholds are configurable in `.env.example`, but the included synthetic
  tests are not a representative calibration corpus. No false-positive or
  false-negative rate is claimed.
- Visual embeddings and audio fingerprinting are not implemented. Perceptual
  matches are evidence for a possible duplicate, not proof that two media items
  have the same source or rights.

Run the media unit tests with `npm test` from `Backend`. Tests that require a
working bundled FFmpeg encoder are skipped when that binary is unavailable.
