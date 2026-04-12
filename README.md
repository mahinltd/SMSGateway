// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
# SMS Gateway Backend

Backend service for SMS Gateway SaaS built with Express, Socket.IO, and Prisma (MongoDB).

## Features

- JWT-based authentication
- Device and message APIs
- Socket.IO real-time communication
- Prisma MongoDB integration
- Rate limiting for SMS send endpoint
- Production hardening for Render (`trust proxy`, Helmet, CORS)

## Tech Stack

- Node.js
- Express
- Socket.IO
- Prisma
- MongoDB

## Project Structure

```text
prisma/
src/
  config/
  controllers/
  middleware/
  repositories/
  routes/
  services/
  sockets/
  utils/
  validators/
tests/
```

## Requirements

- Node.js 18+
- npm 9+
- MongoDB database

## Installation

```bash
npm install
```

## Environment Variables

Create a local `.env` file and configure these values:

```env
PORT=5000
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/sms-gateway
JWT_SECRET=replace-with-strong-random-secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://sms.mahinai.app
# Optional: add extra allowed origins as comma-separated list
CORS_ORIGIN=http://localhost:5173,https://another-client.example
```

## Running Locally

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

Health check endpoint:

```text
GET /health
```

API base path:

```text
/api
```

## Prisma Commands

Generate Prisma client:

```bash
npm run prisma:generate
```

Run migration (dev):

```bash
npm run prisma:migrate
```

## Render Deployment

1. Connect this GitHub repository to Render.
2. Create a Web Service.
3. Set Build Command:

```bash
npm install
```

4. Set Start Command:

```bash
npm start
```

5. Add environment variables in Render:
- `PORT` (Render also injects this automatically)
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `FRONTEND_URL`
- `CORS_ORIGIN` (optional)

## Notes

- The server listens on `process.env.PORT || 5000`.
- `app.set('trust proxy', 1)` is enabled for Render reverse proxy compatibility.
- Helmet is enabled for secure HTTP headers.
- CORS allows `FRONTEND_URL` and local development origin.
