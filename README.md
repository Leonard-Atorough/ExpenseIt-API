# ExpenseIt API

ExpenseIt API is a TypeScript + Express backend for authentication and personal expense tracking.
It uses PostgreSQL through Prisma, JWT access tokens, and rotating refresh tokens via secure httpOnly cookies.

## Table of Contents

1. Overview
2. Tech Stack
3. Features
4. Project Structure
5. Getting Started
6. Environment Variables
7. Available Scripts
8. API Overview
9. Authentication Flow
10. Testing
11. License

## Overview

This service provides:

- User registration and login
- Access token issuance (short-lived JWT)
- Refresh token rotation (httpOnly cookie)
- Authenticated transaction creation and retrieval
- OpenAPI docs in non-production environments

## Tech Stack

- Node.js + TypeScript
- Express 5
- PostgreSQL
- Prisma ORM
- JWT (access + refresh token strategy)
- Vitest + Supertest
- Swagger UI (OpenAPI 3.0)

## Features

- Layered architecture: API, application, core, infrastructure
- Stateless auth with refresh token revocation/rotation
- Cookie-based refresh tokens (`Path=/api/auth`, `SameSite=Lax`, `HttpOnly`)
- Centralized error middleware
- Unit/integration-friendly design with repository abstractions

## Project Structure

```text
src/
  api/              # Express routes, controllers, middleware, HTTP config
  application/      # Use-cases/services, DTOs, mappers
  core/             # Domain entities and interfaces
  infrastructure/   # Prisma config and repository implementations
documentation/api/  # OpenAPI definition
prisma/             # Prisma schema + migrations
tests/              # Unit and integration tests
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file at the project root.

```bash
cp .env.example .env
```

### 3. Run Database Migrations

```bash
npm run prisma:migrate
npm run prisma:generate
```

### 4. Start the API

```bash
npm run dev
```

Server default: `http://localhost:3001`

Swagger UI (non-production only): `http://localhost:3001/api-docs`

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | Yes | - | HTTP port for the API server |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Yes | - | Secret used to sign access tokens |
| `JWT_REFRESH_SECRET` | Yes | - | Secret used to sign refresh tokens |
| `ACCESS_TOKEN_EXP` | No | `15m` | Access token lifespan |
| `REFRESH_TOKEN_EXP` | No | `7d` | Refresh token lifespan |
| `CLIENT_ORIGIN` | No | `http://localhost:3000` | Allowed CORS origin |
| `COOKIE_SECURE` | No | `false` | Set `true` for HTTPS-only cookies |
| `NODE_ENV` | No | `development` | Runtime environment |
| `EMAIL_USER` | No | empty | SMTP/email account user |
| `EMAIL_PASS` | No | empty | SMTP/email account password |

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start API in development mode |
| `npm run dev:watch` | Start API with watch mode |
| `npm run build` | Compile TypeScript |
| `npm run typecheck` | Run TypeScript type checks only |
| `npm run lint` | Run ESLint |
| `npm run prisma:migrate` | Run Prisma migrations |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:ui` | Run tests with Vitest UI |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:unit` | Run unit tests |
| `npm run test:integration` | Run integration tests |

## API Overview

Base URL: `http://localhost:3001`

### Health

- `GET /ping`

### Authentication

- `GET /api/auth`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Transactions

- `GET /api/transactions`
- `GET /api/transactions/:transactionId`
- `POST /api/transactions`

For full request/response schemas, use Swagger UI or the OpenAPI file at `documentation/api/v1/openapi.yaml`.

## Authentication Flow

1. `POST /api/auth/login` returns an access token and sets a `refreshToken` httpOnly cookie.
2. Send access token in `Authorization: Bearer <token>` for protected routes.
3. When access token expires, call `POST /api/auth/refresh` with refresh cookie.
4. Server rotates refresh token and issues a new access token.
5. `POST /api/auth/logout` revokes the refresh token and clears the cookie.

## Testing

Run all tests:

```bash
npm run test
```

Run coverage:

```bash
npm run test:coverage
```

## License

ISC
