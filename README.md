# ExpenseIt-API Documentation

## Overview

ExpenseIt-API is a REST API for managing personal expenses built with Express.js, Prisma ORM, and SQLite (development) / PostgreSQL (production-ready).

## Documentation Structure

- [`architecture.md`](./documentation/architecture.md) — System architecture, folder structure, and design patterns
- [`api-reference.md`](./documentation/api-reference.md) — Complete API endpoint documentation with request/response examples
- [`authentication.md`](./documentation/authentication.md) — JWT authentication flow, token management, and security considerations
- [`database.md`](./documentation/database.md) — Database schema, relationships, and Prisma usage
- [`development.md`](./documentation/development.md) — Local setup, environment configuration, and development workflows
- [`deployment.md`](./documentation/deployment.md) — Production deployment guide and best practices

## Quick Start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables (copy `.env.example` to `.env`):

   ```bash
   DATABASE_URL="file:./data/expense-tracker.db"
   JWT_ACCESS_SECRET="your-access-secret"
   JWT_REFRESH_SECRET="your-refresh-secret"
   ACCESS_TOKEN_EXP="15m"
   REFRESH_TOKEN_EXP="7d"
   COOKIE_SECURE="false"  # true in production with HTTPS
   ```

3. Generate Prisma client and run migrations:

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## Tech Stack

- **Runtime**: Node.js 18+ with ES modules
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **ORM**: Prisma 7.0
- **Authentication**: JWT (access + refresh tokens)
- **Validation**: Manual validation (consider adding Zod)

## Core Features

- User registration and authentication
- JWT-based access control with refresh token rotation
- Transaction CRUD operations
- User account management
- Secure cookie-based refresh token storage

## Project Status

✅ Authentication flow with JWT refresh tokens  
✅ Transaction CRUD endpoints  
✅ TypeScript migration complete  
⚠️ Needs: Input validation library, comprehensive tests, API rate limiting  
⚠️ Needs: Audit logging for auth events

## Contributing

See individual documentation files for detailed information about each system component.
