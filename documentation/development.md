# Development Guide

## Getting Started

### Prerequisites

- **Node.js**: v18+ (LTS recommended)
- **npm**: v9+ (comes with Node.js)
- **Git**: For version control
- **SQLite**: No installation needed (file-based)
- **Optional**: PostgreSQL (for production-like testing)

### Initial Setup

**1. Clone Repository**:

```bash
git clone <repository-url>
cd ExpenseIt-API
```

**2. Install Dependencies**:

```bash
npm install
```

**3. Set Up Environment Variables**:

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your values
```

**4. Initialize Database**:

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:dev

# Optional: Seed with test data
npx prisma db seed
```

**5. Start Development Server**:

```bash
npm run dev
```

Server will start at `http://localhost:3000` (or port specified in `.env`).

---

## Environment Variables

Create a `.env` file in the project root:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="file:./dev.db"

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET="your-access-secret-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"

# Token Expiry
ACCESS_TOKEN_EXP="15m"   # 15 minutes
REFRESH_TOKEN_EXP="7d"   # 7 days

# Cookie Security
COOKIE_SECURE="false"    # Set to "true" in production (requires HTTPS)

# CORS (optional)
CLIENT_ORIGIN="http://localhost:5173"  # Your frontend URL
```

### Generating Strong Secrets

```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## npm Scripts

| Script                  | Command                  | Description                       |
| ----------------------- | ------------------------ | --------------------------------- |
| `dev`                   | `tsx watch src/index.ts` | Start dev server with hot reload  |
| `build`                 | `tsc`                    | Compile TypeScript to JavaScript  |
| `start`                 | `node dist/index.js`     | Run production build              |
| `prisma:generate`       | `prisma generate`        | Generate Prisma Client            |
| `prisma:migrate:dev`    | `prisma migrate dev`     | Create and apply migrations (dev) |
| `prisma:migrate:deploy` | `prisma migrate deploy`  | Apply migrations (production)     |
| `prisma:studio`         | `prisma studio`          | Open Prisma Studio (GUI)          |

**Common Workflows**:

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Create a new migration
npm run prisma:migrate:dev -- --name add_tags_to_transaction

# View database in GUI
npm run prisma:studio

# Build for production
npm run build
npm start
```

---

## Project Structure

```
ExpenseIt-API/
├── src/
│   ├── config/
│   │   └── db.ts              # Prisma client initialization
│   ├── controllers/
│   │   ├── authController.ts  # Auth HTTP handlers
│   │   └── transactionController.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts   # JWT validation
│   │   └── error.middleware.ts  # Global error handler
│   ├── routes/
│   │   ├── authRouter.ts      # Auth endpoint routes
│   │   └── transactionRouter.ts
│   ├── services/
│   │   ├── authService.ts     # Auth business logic
│   │   └── transactionService.ts
│   ├── types/
│   │   ├── User.ts            # Type definitions
│   │   ├── Account.ts
│   │   └── RefreshToken.ts
│   ├── utils/
│   │   ├── jwtUtils.ts        # JWT helper functions
│   │   └── timeUtils.ts
│   ├── index.d.ts             # Express type augmentation
│   └── index.ts               # Application entry point
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Migration history
│   └── dev.db                 # SQLite database (dev)
├── .ai/                       # AI-assisted coding workflows
├── documentation/             # Project documentation
├── tools/                     # Utility scripts
├── .env                       # Environment variables (git-ignored)
├── .env.example               # Example env file
├── package.json
├── tsconfig.json
└── README.md
```

---

## Development Workflow

### 1. Feature Development

**Branching Strategy**:

```bash
# Create feature branch
git checkout -b feature/add-transaction-tags

# Make changes
# ...

# Commit
git add .
git commit -m "feat: add tags field to transactions"

# Push
git push origin feature/add-transaction-tags

# Create pull request
```

**Code Organization**:

1. **Routes** (`src/routes/`): Define endpoints
2. **Controllers** (`src/controllers/`): Handle HTTP requests/responses
3. **Services** (`src/services/`): Implement business logic
4. **Middleware** (`src/middleware/`): Cross-cutting concerns (auth, errors)
5. **Utils** (`src/utils/`): Helper functions

### 2. Database Changes

**Adding a New Model**:

**Step 1**: Update `prisma/schema.prisma`:

```prisma
model Category {
  id    Int    @id @default(autoincrement())
  name  String @unique
  icon  String?
}
```

**Step 2**: Generate migration:

```bash
npm run prisma:migrate:dev -- --name add_category_model
```

**Step 3**: Regenerate Prisma Client (automatic with migrate dev):

```bash
npm run prisma:generate
```

**Step 4**: Use in code:

```typescript
const category = await prisma.category.create({
  data: { name: "Groceries", icon: "🛒" },
});
```

### 3. Adding a New Endpoint

**Example: GET /transactions/summary**

**Step 1**: Add service function (`src/services/transactionService.ts`):

```typescript
export function createTransactionService(prisma: PrismaClient) {
  async function getSummary(params: { userId: number }) {
    const transactions = await prisma.transaction.findMany({
      where: { userId: params.userId },
    });

    const income = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      ok: true as const,
      data: { income, expenses, net: income - expenses },
    };
  }

  return { getSummary /* ...other methods */ };
}
```

**Step 2**: Add controller (`src/controllers/transactionController.ts`):

```typescript
export function createTransactionController(service: ReturnType<typeof createTransactionService>) {
  async function getSummary(req: Request, res: Response) {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await service.getSummary({ userId: parseInt(userId) });
    return res.status(200).json(result.data);
  }

  return { getSummary /* ...other handlers */ };
}
```

**Step 3**: Add route (`src/routes/transactionRouter.ts`):

```typescript
router.get("/summary", authenticationHandler, controller.getSummary);
```

**Step 4**: Test:

```bash
curl http://localhost:3000/transactions/summary \
  -H "Authorization: Bearer <token>"
```

---

## Debugging

### VS Code Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    }
  ]
}
```

**Usage**:

1. Set breakpoints in VS Code
2. Press `F5` or Run > Start Debugging
3. Trigger endpoint via curl/Postman
4. Execution pauses at breakpoints

### Logging

**Current Implementation**: Basic `console.log` statements

**Recommended**: Structured logging with Winston or Pino

**Example** (Winston):

```typescript
import winston from "winston";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Usage
logger.info("User logged in", { userId: 1, email: "user@example.com" });
logger.error("Database connection failed", { error: err.message });
```

### Inspecting Database

**Prisma Studio** (GUI):

```bash
npm run prisma:studio
```

Opens browser at `http://localhost:5555` with visual database editor.

**SQLite CLI**:

```bash
# Open database
sqlite3 prisma/dev.db

# List tables
.tables

# Query
SELECT * FROM User;

# Exit
.quit
```

**Prisma Client Logging**:

```typescript
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});
```

Or via environment variable:

```bash
DEBUG="prisma:query" npm run dev
```

---

## Testing

### Manual Testing

**Tools**:

- **cURL**: Command-line HTTP client
- **Postman**: GUI for API testing
- **HTTPie**: User-friendly CLI alternative to cURL

**Example** (HTTPie):

```bash
# Install
npm install -g httpie

# Usage
http POST :3000/auth/register firstName=John email=john@test.com password=test123
http POST :3000/auth/login email=john@test.com password=test123
http :3000/transactions Authorization:"Bearer <token>"
```

### Automated Testing

**⚠️ Not yet implemented**

**Recommended Stack**:

- **Jest**: Test runner
- **Supertest**: HTTP assertions
- **Vitest**: Fast alternative to Jest

**Example Test** (Jest + Supertest):

```typescript
import request from "supertest";
import { app } from "../src/index";

describe("POST /auth/register", () => {
  it("should create a new user", async () => {
    const response = await request(app).post("/auth/register").send({
      firstName: "Test",
      email: "test@example.com",
      password: "test123",
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.email).toBe("test@example.com");
  });

  it("should reject duplicate email", async () => {
    // First registration
    await request(app).post("/auth/register").send({
      firstName: "Test",
      email: "duplicate@example.com",
      password: "test123",
    });

    // Duplicate attempt
    const response = await request(app).post("/auth/register").send({
      firstName: "Test2",
      email: "duplicate@example.com",
      password: "test456",
    });

    expect(response.status).toBe(409);
  });
});
```

**Setup**:

```bash
npm install --save-dev jest @types/jest supertest @types/supertest ts-jest

# Add to package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

---

## Common Issues & Solutions

### Issue: "Prisma Client did not initialize yet"

**Cause**: Prisma Client not generated or incorrect import

**Solution**:

```bash
npm run prisma:generate
```

Ensure imports are from `@prisma/client`, not generated `.ts` files.

### Issue: "Property 'user' does not exist on type 'Request'"

**Cause**: Express Request type not extended

**Solution**: Ensure `src/index.d.ts` exists with global augmentation:

```typescript
import { AccessTokenPayload } from "./utils/jwtUtils";

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export {};
```

### Issue: Cookies not sent to `/auth/refresh`

**Causes**:

1. CORS credentials not enabled
2. Cookie `Secure` flag mismatch (HTTPS vs HTTP)
3. Cookie `Path` doesn't match request path

**Solutions**:

```typescript
// 1. Enable CORS credentials
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
  })
);

// 2. Set COOKIE_SECURE=false for HTTP localhost
res.cookie("refreshToken", token, {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === "true",
  sameSite: "lax",
  path: "/auth/refresh",
});

// 3. Client must send credentials
fetch("http://localhost:3000/auth/refresh", {
  method: "POST",
  credentials: "include", // Important!
});
```

### Issue: "Error: listen EADDRINUSE :::3000"

**Cause**: Port 3000 already in use

**Solutions**:

```bash
# Option 1: Kill existing process
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# Option 2: Use different port
PORT=3001 npm run dev
```

### Issue: TypeScript errors after Prisma schema changes

**Cause**: Prisma Client out of sync

**Solution**:

```bash
npm run prisma:generate
```

Restart TypeScript server in VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### Issue: Migration conflicts

**Cause**: Local schema diverged from migration history

**Solutions**:

```bash
# Option 1: Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Option 2: Resolve conflicts manually
npx prisma migrate resolve --applied <migration-name>

# Option 3: Create new migration from current state
npx prisma migrate dev --name fix_conflicts
```

---

## Hot Reload

**Current Setup**: `tsx watch` provides hot reload

**How it works**:

- `tsx watch` monitors `src/**/*.ts` files
- On file change, server restarts automatically
- Database connections are reused via singleton pattern

**Caveats**:

- Server restarts on every save (2-3 second delay)
- In-memory state is lost (e.g., active sessions)
- Database connections persist via `globalThis.__PRISMA_CLIENT__`

**Improving Hot Reload**:

```bash
# Install nodemon for more control
npm install --save-dev nodemon

# Add to package.json
{
  "scripts": {
    "dev": "nodemon --watch src --ext ts --exec tsx src/index.ts"
  }
}
```

---

## Code Style

### TypeScript Conventions

- **Strict Mode**: Enabled in `tsconfig.json`
- **Naming**:
  - `camelCase`: variables, functions
  - `PascalCase`: classes, interfaces, types
  - `UPPER_SNAKE_CASE`: constants
- **Async/Await**: Prefer over `.then()` chains
- **Error Handling**: Use try/catch or result objects (discriminated unions)

**Example**:

```typescript
// ✅ Good
async function getUser(id: number): Promise<User | null> {
  try {
    return await prisma.user.findUnique({ where: { id } });
  } catch (err) {
    logger.error("Failed to fetch user", { id, error: err });
    return null;
  }
}

// ❌ Avoid
function getUser(id, callback) {
  prisma.user
    .findUnique({ where: { id } })
    .then((user) => callback(null, user))
    .catch((err) => callback(err));
}
```

### Linting & Formatting

**⚠️ Not yet configured**

**Recommended**:

```bash
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier

# Add .eslintrc.json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}

# Add .prettierrc
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5"
}

# Add scripts
{
  "scripts": {
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write 'src/**/*.ts'"
  }
}
```

---

## Git Workflow

### Branch Naming

- `feature/<description>`: New features
- `fix/<description>`: Bug fixes
- `chore/<description>`: Maintenance tasks
- `docs/<description>`: Documentation updates

**Examples**:

```bash
git checkout -b feature/add-transaction-tags
git checkout -b fix/cookie-not-sent
git checkout -b chore/upgrade-dependencies
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples**:

```bash
git commit -m "feat(auth): add token refresh rotation"
git commit -m "fix(transactions): correct amount calculation"
git commit -m "docs: update API reference with examples"
git commit -m "chore: upgrade Prisma to v7.0.0"
```

### Pre-commit Hooks

**⚠️ Not yet configured**

**Recommended** (Husky + lint-staged):

```bash
npm install --save-dev husky lint-staged

# Add to package.json
{
  "lint-staged": {
    "src/**/*.ts": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}

# Initialize husky
npx husky init
echo "npx lint-staged" > .husky/pre-commit
```

---

## Performance Tips

### Database Queries

**Use Indexes**:

```prisma
model Transaction {
  // ...
  @@index([userId, dateCreated(sort: Desc)])
}
```

**Select Only Needed Fields**:

```typescript
// ❌ Fetches all fields
const users = await prisma.user.findMany();

// ✅ Only fetch email and id
const users = await prisma.user.findMany({
  select: { id: true, email: true },
});
```

**Batch Queries**:

```typescript
// ❌ N+1 query problem
for (const userId of userIds) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
}

// ✅ Single query
const users = await prisma.user.findMany({
  where: { id: { in: userIds } },
});
```

### Caching

**Consider Redis for**:

- Session storage
- Rate limiting counters
- Frequently accessed data (user profiles)

**Example**:

```typescript
import Redis from "ioredis";
const redis = new Redis();

// Cache user profile
await redis.setex(`user:${userId}`, 300, JSON.stringify(user)); // 5 min TTL

// Retrieve
const cached = await redis.get(`user:${userId}`);
if (cached) return JSON.parse(cached);
```

---

## Deployment Preparation

See [deployment.md](./deployment.md) for full production deployment guide.

**Quick Checklist**:

- [ ] Set `NODE_ENV=production`
- [ ] Use PostgreSQL (`DATABASE_URL`)
- [ ] Set `COOKIE_SECURE=true`
- [ ] Use strong JWT secrets (32+ bytes)
- [ ] Configure CORS with specific origins
- [ ] Add rate limiting
- [ ] Set up logging (Winston/Pino)
- [ ] Enable HTTPS
- [ ] Run migrations: `npm run prisma:migrate:deploy`
- [ ] Build: `npm run build`
- [ ] Start: `npm start`
