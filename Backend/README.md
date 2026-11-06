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
4. Start development mode from the Backend directory:

   Run npm run dev. This starts both the API and the media worker.
   The API requires MongoDB. Media processing requires Redis and Cloudinary credentials. In production, run the API with
   npm start and the worker with npm run worker as separate long-running
   processes.

   If the API and worker run on separate machines, they must share the same
   `MEDIA_TEMP_DIR` path and contents because queued jobs refer to staged files.
5. From Frontend, copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to the
   API URL ending in `/api` (the example uses `http://localhost:5000/api`),
   then run the frontend development server.

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

## Permanent content deletion

Admin permanent deletion is queued in MongoDB and processed by the existing
media worker. The worker first cleans MongoDB references, then removes unshared
Cloudinary assets and their `MediaAsset` records. Failed steps are retried with
backoff from the saved deletion record; keep `npm run worker` running for
cleanup to complete. The delete endpoint returns `202` while cleanup is pending.

The API and worker create the `contentdeletions` and `contentdeletionlocks`
collections and their indexes on startup. No backfill of existing documents is
required. Content/asset locks serialize deletion against media linking and
content interactions, and remain held across retries to prevent assets from
being reused after a partial external deletion.

Feed, admin, watch-history, and wishlist controllers share pagination and
content-thumbnail serialization helpers while retaining endpoint-specific
limits and response shapes.

## Creating an admin account

Admin accounts are stored separately from regular accounts in the `admins`
collection. Their name, username, email, and phone number are encrypted with
AES-256-GCM; identifier lookup uses keyed HMAC digests. Configure
`ADMIN_DATA_ENCRYPTION_KEY` as a private 32-byte key encoded as 64 hexadecimal
characters or 43 base64url characters, and
`ADMIN_LOOKUP_HMAC_KEY` as a separate private secret of at least 32 characters
in `Backend/.env`. Keep both stable and backed up securely; changing either key
will make existing admin data inaccessible.

Before deploying this version, configure both keys and migrate existing admin
accounts once from `Backend`:

```powershell
npm run admin:migrate
```

The API will refuse to start while legacy admin records remain in `users`.
Migration keeps existing account IDs for references, moves the credentials and
identifiers to `admins`, and anonymizes the corresponding `users` record.

First create a normal account through the frontend using the email you intend
to administer with. To grant admin access, open a terminal in `Backend` and
run the following with that exact email:

```powershell
npm run admin:promote -- admin@example.com --confirm
```

This is a local maintenance command, not a public API. It requires the
MongoDB connection and admin encryption keys in `Backend/.env` and the explicit
`--confirm` flag. Keep database credentials and encryption keys private and
only grant admin access to trusted accounts. After it succeeds, sign out and
sign in again, then open
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

The upload API only queues files. If an upload remains queued or checking, make
sure the Backend worker process is running and can connect to the same MongoDB,
Redis, and staging directory as the API. Supported video files are MP4, M4V,
MOV, WebM, and MKV. The default size limit is 100 MB and the default duration
limit is one hour; both can be changed in the .env file.
