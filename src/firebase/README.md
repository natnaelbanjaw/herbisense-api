# Firebase backend

This folder is a standalone Firebase-backed backend path for Herbisense.

It does not import `src/database/db.js`, migrations, or the PostgreSQL bootstrap flow.

## Install

Add the Firebase Admin SDK to the project:

```bash
npm install firebase-admin
```

## Environment variables

Recommended setup: place `serviceAccountKey.json` in the project root.

You can also use `.env` values instead if you prefer.

For Render, the easiest option is usually one env var containing the whole service-account JSON:

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"..."}
```

Optional `.env` values:

```env
FIREBASE_PORT=5002
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_WEB_API_KEY=your-web-api-key
FIREBASE_BOOTSTRAP_ADMIN_EMAIL=admin@herbisense.com
FIREBASE_BOOTSTRAP_ADMIN_PASSWORD=admin123
FIREBASE_BOOTSTRAP_ADMIN_NAME=System Admin
FIREBASE_BOOTSTRAP_ADMIN_ROLE=super_admin
```

If `serviceAccountKey.json` exists in the repo root, the Firebase backend will load credentials from that file automatically.

`FIREBASE_WEB_API_KEY` is used only for the `/api/auth/login` email/password endpoint.

## Run

Start the Firebase backend directly:

```bash
node src/firebase/server.js
```

Bootstrap the Firebase admin user and Firestore profile:

```bash
npm run firebase:bootstrap
```

This script is idempotent. It creates or updates the Firebase Auth admin user,
assigns custom claims, and writes the matching Firestore `users/{uid}` profile.

If you run this server instead of `src/server.js`, the backend is effectively disconnected from PostgreSQL because the Firebase server path never imports the Postgres connection files.

## Included routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/herbs`
- `GET /api/herbs/:id`
- `POST /api/herbs`
- `PATCH /api/herbs/:id`
- `DELETE /api/herbs/:id`
- `GET /api/conditions`
- `GET /api/conditions/:id`
- `POST /api/conditions`
- `PATCH /api/conditions/:id`
- `DELETE /api/conditions/:id`
- `GET /api/favorites`
- `POST /api/favorites`
- `DELETE /api/favorites/:herbId`
- `POST /api/ratings`
- `GET /api/ratings/:herbId`
- `GET /api/ratings/average/:herbId`

## Notes

- Firestore document IDs are strings, so this Firebase backend accepts string IDs.
- Search is currently implemented as a simple in-memory filter after querying Firestore.
- Rich SQL-style joins from the Postgres backend are modeled through Firestore document references and arrays instead of relational joins.
- You still need to enable Firebase Authentication Email/Password sign-in once in the Firebase Console.
