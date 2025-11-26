# Architecture

## System Overview

ExpenseIt-API follows a layered architecture pattern:

```
┌─────────────────┐
│   HTTP Client   │
└────────┬────────┘
         │
    ┌────▼─────┐
    │  Routes  │  (Express routers, endpoint definitions)
    └────┬─────┘
         │
  ┌──────▼─────────┐
  │  Controllers   │  (Request/response handling, input extraction)
  └──────┬─────────┘
         │
    ┌────▼─────┐
    │ Services │  (Business logic, transaction management)
    └────┬─────┘
         │
  ┌──────▼──────┐
  │   Prisma    │  (Database ORM, query generation)
  └──────┬──────┘
         │
    ┌────▼─────┐
    │ Database │  (SQLite/PostgreSQL)
    └──────────┘
```

## Folder Structure

```
src/
├── config/          # Database initialization and connection management
├── controllers/     # HTTP request/response handlers
├── middleware/      # Express middleware (auth, error handling)
├── routes/          # Route definitions and endpoint mapping
├── services/        # Business logic layer
├── types/           # TypeScript type definitions and Prisma types
└── utils/           # Helper functions (JWT, time parsing)

prisma/
├── schema.prisma    # Database schema definition
└── migrations/      # Database migration history

.ai/                 # AI-assisted development jobs and templates
documentation/       # API and architecture documentation
tools/               # Development utilities (ai-runner script)
```

## Layer Responsibilities

### Routes (`src/routes/`)

- Define API endpoints and HTTP methods
- Wire up controllers to routes
- Apply route-level middleware (authentication)
- Factory pattern: each router accepts `PrismaClient` dependency

Example:

```typescript
export default function authRouter(prisma: PrismaClient) {
  const router = express.Router();
  const { register, login, refresh, logout } = authController(prisma);

  router.post("/register", register);
  router.post("/login", login);
  router.post("/refresh", refresh);
  router.post("/logout", logout);

  return router;
}
```

### Controllers (`src/controllers/`)

- Extract and validate request data (params, body, headers)
- Call appropriate service methods
- Format responses and set HTTP status codes
- Handle service-level errors and map to HTTP responses
- Attach user context from middleware (`req.user`)

Pattern:

```typescript
async function getTransactionById(req: Request, res: Response, next: NextFunction) {
  const { transactionId } = req.params;
  const userId = req.user?.sub;

  const result = await fetchTransactionForId({ id: parseInt(transactionId), userId });

  if (result.result === "not-found") {
    return res.status(404).json({ error: "Not found" });
  }

  res.status(200).json(result.transaction);
}
```

### Services (`src/services/`)

- Contain business logic and data validation
- Orchestrate Prisma queries
- Return structured results (not HTTP responses)
- Handle transaction boundaries when needed

Pattern:

```typescript
async function fetchTransactionForId(params: { id: number; userId: string }) {
  const transaction = await prisma.transaction.findFirst({
    where: { id: params.id, userId: parseInt(params.userId) },
  });

  return transaction ? { result: "found", transaction } : { result: "not-found" };
}
```

### Middleware (`src/middleware/`)

**Authentication Middleware** (`auth.middleware.ts`)

- Validates JWT access tokens from `Authorization: Bearer <token>` header
- Verifies token signature and expiry
- Attaches decoded user payload to `req.user`
- Returns 401 for invalid/missing tokens

**Error Middleware** (`error.middleware.ts`)

- Catches unhandled errors from routes/controllers
- Logs errors for debugging
- Returns generic 500 responses to clients

### Utilities (`src/utils/`)

- **JWT Utils**: Token signing and verification with typed payloads
- **Time Utils**: Parse expiry strings (e.g., "15m", "7d") to milliseconds

## Design Patterns

### Dependency Injection

Controllers and services accept `PrismaClient` as a constructor parameter, enabling:

- Easier testing (mock Prisma)
- Clear dependency graph
- Flexibility to swap implementations

### Factory Functions

Routes, controllers, and services use factory functions that return objects with methods:

```typescript
export function transactionController(prisma: PrismaClient) {
  return {
    getTransactions,
    getTransactionById,
    createTransaction,
  };
}
```

### Typed Request Extensions

Express `Request` type is extended via module augmentation to include:

```typescript
declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}
```

### Result Objects

Services return discriminated union result types instead of throwing:

```typescript
type ServiceResult<T> =
  | { result: "success"; data: T }
  | { result: "not-found" }
  | { result: "error"; message: string };
```

## Authentication Flow

1. **Registration**: User submits credentials → hash password → create User + Account records
2. **Login**: Validate credentials → issue access token + refresh token → store refresh token in DB and httpOnly cookie
3. **Protected Requests**: Client sends access token in Authorization header → middleware validates → attaches `req.user`
4. **Token Refresh**: Client sends refresh token cookie → validate against DB → issue new access + refresh tokens → rotate refresh token
5. **Logout**: Delete refresh token from DB and clear cookie

See [`authentication.md`](./authentication.md) for detailed flow diagrams and security considerations.

## Database Layer

### Prisma ORM

- **Schema**: Defined in `prisma/schema.prisma` with models, relations, and indexes
- **Client Generation**: `npx prisma generate` creates typed client at `node_modules/.prisma/client`
- **Migrations**: Version-controlled schema changes in `prisma/migrations/`

### Models

- **User**: Core user identity
- **Account**: Authentication credentials (hashed password)
- **Transaction**: Expense/income records
- **RefreshToken**: Active refresh tokens with metadata (IP, user agent, expiry)

### Relationships

- User 1:1 Account
- User 1:n Transactions
- User 1:1 RefreshToken (active token; previous tokens are deleted on rotation)

## Error Handling Strategy

### Controller Level

- Try-catch blocks around service calls
- Map service errors to appropriate HTTP status codes
- Pass errors to error middleware via `next(error)`

### Service Level

- Return result objects (no throws for expected failures)
- Throw only for unexpected errors (DB connection failures, etc.)

### Middleware Level

- Global error handler catches all unhandled errors
- Logs error details for debugging
- Returns sanitized 500 responses to clients

## Security Considerations

- **JWT Secrets**: Stored in environment variables, never committed
- **Password Hashing**: bcrypt with salt rounds (recommend 10+)
- **Refresh Token Rotation**: Each refresh invalidates previous token
- **HttpOnly Cookies**: Refresh tokens not accessible to JavaScript
- **CORS**: Configured to allow specific origins with credentials
- **Rate Limiting**: TODO - add to prevent brute force attacks
- **Input Validation**: TODO - add Zod or similar for request validation

## Performance Considerations

- **Connection Pooling**: Prisma handles connection pooling automatically
- **Singleton Pattern**: Single PrismaClient instance reused across requests
- **Index Strategy**: Primary keys and foreign keys indexed by default; add composite indexes for common queries
- **Query Optimization**: Use Prisma's `select` and `include` to limit data fetching

## Testing Strategy (Planned)

- **Unit Tests**: Services and utilities with mocked Prisma client
- **Integration Tests**: Full request/response cycle with test database
- **E2E Tests**: Critical user flows (registration, login, CRUD operations)

## Deployment Considerations

- **Database**: Migrate from SQLite to PostgreSQL for production
- **Environment**: Set `COOKIE_SECURE=true` and `NODE_ENV=production`
- **Secrets Management**: Use secure secret storage (AWS Secrets Manager, Azure Key Vault)
- **Logging**: Add structured logging (Winston, Pino)
- **Monitoring**: Application performance monitoring (APM) and error tracking
- **CI/CD**: Automated testing, type-checking, and deployment pipeline

## Future Enhancements

- [ ] Add request validation library (Zod)
- [ ] Implement audit logging for security events
- [ ] Add rate limiting middleware
- [ ] Implement pagination for transaction lists
- [ ] Add transaction filtering and search
- [ ] Support multiple currencies
- [ ] Add budget tracking features
- [ ] Implement data export (CSV, PDF)
