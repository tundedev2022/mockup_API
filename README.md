# Haulr API server

This Dart HTTP API persists users, shipments, payments, and login sessions in MongoDB. Data is retained when the server restarts. The API listens on `0.0.0.0` and uses the `PORT` environment variable when provided (default: `8080`).

## Database collections

MongoDB stores documents rather than SQL rows, but these collections map to the API's data tables. MongoDB creates the collections and indexes at startup.

| Collection | Fields |
|---|---|
| `users` | `id`, `name`, `email` (unique), `phone`, `tier`, `password_hash` |
| `shipments` | `id`, `user_id`, `origin`, `destination`, `status`, `size`, `speed`, `weight_kg`, `price`, `created_at`, `eta`, `courier`, `events` |
| `payments` | `id`, `user_id`, `status`, `amount`, `method_id`, `shipment_id`, `created_at` |
| `sessions` | `token_hash`, `user_id`, `expires_at` |

Passwords are stored as bcrypt hashes. Bearer tokens are generated with secure randomness and stored as SHA-256 hashes; sessions expire after 30 days. Shipment and payment records are scoped to the signed-in user.

## Run locally

Create a MongoDB database (MongoDB Atlas works) and set `MONGODB_URI` to its connection string, including the database name. Keep the URI private.

PowerShell:

```powershell
$env:MONGODB_URI = 'mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority'
dart pub get
dart run mock_server.dart
```

For compatibility testing only, opt in to the seeded demo account and shipments:

```powershell
$env:SEED_DEMO_DATA = 'true'
dart run mock_server.dart
```

Demo login: `demo@haulr.com` / `password123`. Do not enable `SEED_DEMO_DATA` on a public deployment.

## Deploy to Render

1. Create a MongoDB database and database user. Configure its network access to allow connections from your Render service.
2. Push this project to a Git repository and create a Render **Blueprint** from it. The included `render.yaml` creates a Docker web service and uses `/v1/health` for health checks.
3. In the Render service's environment settings, add `MONGODB_URI` as a secret using the full MongoDB connection string. Do not commit credentials.
4. Deploy. The service URL is the base URL for the API, for example `https://<service>.onrender.com/v1`.

Render supplies `PORT`; the server binds to it. `SEED_DEMO_DATA` is disabled unless explicitly set to `true`.

## API

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/v1/health` | no | Health check |
| POST | `/v1/auth/sign-in` | no | `{email, password}` -> `{token, user}` |
| POST | `/v1/auth/sign-up` | no | `{name, email, phone, password}` -> 201; 409 if the email exists |
| POST | `/v1/auth/forgot-password` | no | Always returns a generic response |
| GET | `/v1/me` | yes | Current user |
| GET | `/v1/shipments` | yes | Optional `?status=inTransit&q=abuja` |
| GET | `/v1/shipments/{id}` | yes | One of the current user's shipments |
| POST | `/v1/shipments/quote` | yes | `{size, weight_kg, promo_code?}` |
| POST | `/v1/shipments` | yes | Creates a persisted shipment |
| GET | `/v1/payments/methods` | yes | Available method placeholders |
| POST | `/v1/payments` | yes | Creates a persisted payment record |

Send the token in `Authorization: Bearer <token>`.

Payment processing and password-reset email delivery are not connected to external providers yet; those endpoints retain their test behavior. Configure real payment and email providers before treating those flows as production-ready.

## Test

The existing integration suite expects the demo records. Start the server with `SEED_DEMO_DATA=true` and a test MongoDB database, then run:

```powershell
node dco.js
```

Set `BASE_URL` to test a deployed or non-default server.
