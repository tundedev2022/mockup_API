# Haulr Node.js API server

This is a Node.js/Express mock API. It listens on `0.0.0.0`, using `PORT` when
provided and `8080` otherwise. Users, shipments, and payments are stored in
MongoDB with Mongoose. Login tokens remain in memory and reset when the server
restarts.

## Project structure

```text
server.js
src/
  app.js
  config.js
  controllers/
  middleware/
  models/
  routes/
  services/
```

Routes define the HTTP endpoints, controllers implement request handling, models
hold the mock data and domain operations, and middleware provides shared request
handling such as authentication and error responses.

## Run locally

Requires Node.js 18 or later.

Set `MONGO_URI` in a local `.env` file to your MongoDB connection string before
starting the server. Keep that file private and do not commit credentials.

```powershell
npm install
npm start
```

On an empty database, the server seeds the demo account (`demo@haulr.com` /
`password123`) and sample shipments.

## API

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/v1/health` | no | Health check |
| POST | `/v1/auth/sign-in` | no | `{email, password}` -> `{token, user}` |
| POST | `/v1/auth/sign-up` | no | `{name, email, phone, password}` -> 201; 409 if the email exists |
| POST | `/v1/auth/forgot-password` | no | Always returns a generic response |
| GET | `/v1/me` | yes | Current user |
| GET | `/v1/shipments` | yes | Optional `?status=inTransit&q=abuja` |
| GET | `/v1/shipments/{id}` | yes | Shipment details |
| POST | `/v1/shipments/quote` | yes | `{size, weight_kg, promo_code?}` |
| POST | `/v1/shipments` | yes | Creates a mock shipment |
| GET | `/v1/payments/methods` | yes | Available method placeholders |
| POST | `/v1/payments` | yes | Creates a mock payment record |

Send the token in the `Authorization: Bearer <token>` header.

Payment processing and password-reset email delivery are not connected to
external providers; these endpoints retain their test behavior.

## Test

Start the server in one terminal, then run the integration suite in another:

```powershell
npm start
npm test
```

Set `BASE_URL` to test a deployed or non-default server.

## Deploy to Render

The included `render.yaml` uses the Dockerfile and checks `/v1/health`.
Set `MONGO_URI` as a secret environment variable in Render. Render supplies
`PORT`. User, shipment, and payment records are persisted in MongoDB; login
tokens reset when the process restarts.
