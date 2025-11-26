# Database Schema & Migrations

## Overview

ExpenseIt-API uses **Prisma ORM** with SQLite (development) and PostgreSQL (production). The schema defines four main models: User, Account, Transaction, and RefreshToken.

## Database Configuration

### Development (SQLite)

Located in `prisma.config.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

export const datasources = {
  db: {
    url: process.env.DATABASE_URL || "file:./dev.db",
  },
};
```

**Pros**:

- Zero setup (file-based)
- Fast for development
- Git-ignored database file

**Cons**:

- Not suitable for production
- Limited concurrency
- No full-text search

### Production (PostgreSQL)

Set `DATABASE_URL` environment variable:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/expenseit?schema=public"
```

**Migration**: Schema is PostgreSQL-compatible. Simply change `DATABASE_URL` and run migrations.

---

## Schema Models

### User

Represents an authenticated user account.

```prisma
model User {
  id           Int            @id @default(autoincrement())
  email        String         @unique
  firstName    String
  lastName     String?
  password     String
  account      Account?
  transactions Transaction[]
  refreshToken RefreshToken?
}
```

**Fields**:

- `id`: Primary key (auto-increment integer)
- `email`: Unique email address (used for login)
- `firstName`: Required first name
- `lastName`: Optional last name
- `password`: Bcrypt-hashed password (never store plaintext)
- `account`: One-to-one relation with Account model
- `transactions`: One-to-many relation with Transaction model
- `refreshToken`: One-to-one relation with RefreshToken model

**Indexes**:

- `email`: Unique index (enforced by database)

**Constraints**:

- Email must be unique
- Password must be hashed before storage

---

### Account

Stores account balance and metadata (one per user).

```prisma
model Account {
  id      Int    @id @default(autoincrement())
  balance Int    @default(0)
  userId  Int    @unique
  user    User   @relation(fields: [userId], references: [id])
}
```

**Fields**:

- `id`: Primary key
- `balance`: Account balance in cents (default: 0)
- `userId`: Foreign key to User (unique, one-to-one)
- `user`: Relation to User model

**Indexes**:

- `userId`: Unique index (one account per user)

**Usage**:

```typescript
// Get user with account
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: { account: true },
});

console.log(user.account.balance); // Balance in cents
```

---

### Transaction

Represents income/expense transactions.

```prisma
model Transaction {
  id          Int      @id @default(autoincrement())
  amount      Int
  category    String
  description String?
  dateCreated DateTime @default(now())
  userId      Int
  user        User     @relation(fields: [userId], references: [id])
}
```

**Fields**:

- `id`: Primary key
- `amount`: Transaction amount in cents (positive = income, negative = expense)
- `category`: Transaction category (e.g., "Groceries", "Salary")
- `description`: Optional description
- `dateCreated`: Timestamp (auto-generated)
- `userId`: Foreign key to User
- `user`: Relation to User model

**Indexes**:

- `userId`: Index for fast user-specific queries

**Usage**:

```typescript
// Get all transactions for a user
const transactions = await prisma.transaction.findMany({
  where: { userId: 1 },
  orderBy: { dateCreated: "desc" },
});

// Create a transaction
await prisma.transaction.create({
  data: {
    amount: 5000,
    category: "Groceries",
    description: "Weekly shopping",
    userId: 1,
  },
});
```

**Design Notes**:

- Amount stored in cents to avoid floating-point precision issues
- Consider adding `dateUpdated` field for audit trail
- Future: Add tags/labels for flexible categorization

---

### RefreshToken

Stores JWT refresh tokens for session management.

```prisma
model RefreshToken {
  id              String    @id @default(uuid())
  token           String    @unique
  userId          Int       @unique
  createdAt       DateTime  @default(now())
  expiresAt       DateTime
  revokedAt       DateTime?
  ipAddress       String?
  userAgent       String?
  lastRefreshedAt DateTime?
  user            User      @relation(fields: [userId], references: [id])
}
```

**Fields**:

- `id`: UUID primary key (stored in JWT `rid` claim)
- `token`: Full JWT string (unique)
- `userId`: Foreign key to User (unique, one active refresh token per user)
- `createdAt`: Creation timestamp
- `expiresAt`: Expiry timestamp (7 days from creation)
- `revokedAt`: Revocation timestamp (nullable, set on logout or token reuse detection)
- `ipAddress`: IP address of the client (audit trail)
- `userAgent`: User agent string (audit trail)
- `lastRefreshedAt`: Last time token was used to refresh (nullable)
- `user`: Relation to User model

**Indexes**:

- `token`: Unique index (fast lookup by token string)
- `userId`: Unique index (one refresh token per user)

**Usage**:

```typescript
// Create refresh token
const refreshToken = await prisma.refreshToken.create({
  data: {
    id: uuid(),
    token: jwtString,
    userId: user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  },
});

// Validate and rotate
const storedToken = await prisma.refreshToken.findUnique({
  where: { id: tokenId },
});

if (storedToken && !storedToken.revokedAt) {
  // Valid - issue new token and delete old one
  await prisma.refreshToken.delete({ where: { id: storedToken.id } });
  // ... create new token
}
```

**Security Notes**:

- Token rotation: old token deleted on refresh
- Revocation: set `revokedAt` for manual logout
- One token per user: prevents multiple sessions (by design)
- UUID `id` ensures unpredictable token IDs

---

## Relationships

```
User (1) ──── (1) Account
  │
  ├── (1 to many) Transaction
  │
  └── (1) ──── (1) RefreshToken
```

**Cascading Behavior**:

- Deleting a User will delete related Account, Transactions, and RefreshToken (Prisma default)
- **⚠️ Consider**: Add `onDelete: SetNull` or `onDelete: Restrict` if you want to preserve transaction history

---

## Migrations

### Migration Files

Located in `prisma/migrations/`:

```
20251117140419_init/            # Initial schema
20251117193337_init/            # Schema refinement
20251118223640_add_refesh_token_model/  # Added RefreshToken model
20251122171046_fix_transaction_id_type/ # Changed Transaction ID to Int
20251122181116_allow_token_revoke_time_to_be_null/ # Made revokedAt nullable
```

### Creating Migrations

**Development** (auto-generate migration):

```bash
npm run prisma:migrate:dev
# Or: npx prisma migrate dev --name <description>
```

This will:

1. Compare schema with database
2. Generate SQL migration file
3. Apply migration to dev database
4. Regenerate Prisma Client

**Production** (apply pending migrations):

```bash
npm run prisma:migrate:deploy
# Or: npx prisma migrate deploy
```

**Check Migration Status**:

```bash
npx prisma migrate status
```

### Example Migration: Add "Tags" to Transactions

**1. Update `prisma/schema.prisma`**:

```prisma
model Transaction {
  id          Int      @id @default(autoincrement())
  amount      Int
  category    String
  description String?
  tags        String[] @default([])  // Add this line
  dateCreated DateTime @default(now())
  userId      Int
  user        User     @relation(fields: [userId], references: [id])
}
```

**2. Generate Migration**:

```bash
npx prisma migrate dev --name add_tags_to_transaction
```

**3. Generated SQL** (in `prisma/migrations/<timestamp>_add_tags_to_transaction/migration.sql`):

```sql
-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
```

**4. Apply to Production**:

```bash
npx prisma migrate deploy
```

---

## Seeding

### Seed Script

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Create test user
  const hashedPassword = await bcrypt.hash("test123", 10);
  const user = await prisma.user.create({
    data: {
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      password: hashedPassword,
      account: {
        create: { balance: 100000 }, // $1000.00
      },
    },
  });

  // Create sample transactions
  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        amount: 5000,
        category: "Groceries",
        description: "Weekly shopping",
      },
      {
        userId: user.id,
        amount: -1500,
        category: "Entertainment",
        description: "Movie tickets",
      },
      {
        userId: user.id,
        amount: 200000,
        category: "Salary",
        description: "Monthly paycheck",
      },
    ],
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Add to `package.json`**:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

**Run Seed**:

```bash
npx prisma db seed
```

---

## Query Patterns

### User Queries

**Find user with all relations**:

```typescript
const user = await prisma.user.findUnique({
  where: { email: "user@example.com" },
  include: {
    account: true,
    transactions: true,
    refreshToken: true,
  },
});
```

**Create user with account**:

```typescript
const user = await prisma.user.create({
  data: {
    email: "new@example.com",
    firstName: "New",
    password: hashedPassword,
    account: {
      create: { balance: 0 },
    },
  },
});
```

### Transaction Queries

**Paginated transactions**:

```typescript
const transactions = await prisma.transaction.findMany({
  where: { userId: 1 },
  orderBy: { dateCreated: "desc" },
  take: 20,
  skip: 0,
});
```

**Aggregate queries**:

```typescript
const totals = await prisma.transaction.groupBy({
  by: ["category"],
  where: { userId: 1 },
  _sum: { amount: true },
  _count: true,
});

// Result: [{ category: "Groceries", _sum: { amount: 15000 }, _count: 5 }, ...]
```

**Date range filter**:

```typescript
const startDate = new Date("2025-11-01");
const endDate = new Date("2025-11-30");

const transactions = await prisma.transaction.findMany({
  where: {
    userId: 1,
    dateCreated: {
      gte: startDate,
      lte: endDate,
    },
  },
});
```

### RefreshToken Queries

**Find active token**:

```typescript
const token = await prisma.refreshToken.findUnique({
  where: { id: tokenId },
  include: { user: true },
});

if (token && !token.revokedAt && token.expiresAt > new Date()) {
  // Token is valid
}
```

**Revoke all tokens for user** (logout from all devices):

```typescript
await prisma.refreshToken.updateMany({
  where: { userId: 1 },
  data: { revokedAt: new Date() },
});
```

---

## Performance Considerations

### Indexes

**Current Indexes** (implicit):

- `User.email` (unique)
- `Account.userId` (unique)
- `RefreshToken.userId` (unique)
- `RefreshToken.token` (unique)

**Recommended Additional Indexes**:

```prisma
model Transaction {
  // ... fields ...
  @@index([userId, dateCreated(sort: Desc)])  // Optimize user timeline queries
  @@index([category])                          // Optimize category filters
}

model RefreshToken {
  // ... fields ...
  @@index([expiresAt])  // Optimize cleanup queries
}
```

### Connection Pooling

Prisma automatically manages connection pooling. Configure in `prisma.config.ts`:

```typescript
export const PrismaClient = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Optional: configure connection pool
  // __internal: {
  //   engine: {
  //     connectionLimit: 10
  //   }
  // }
});
```

### Query Optimization

**Use `select` instead of `include` for large relations**:

```typescript
// ❌ Fetches all fields
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: { transactions: true },
});

// ✅ Only fetch needed fields
const user = await prisma.user.findUnique({
  where: { id: 1 },
  select: {
    id: true,
    email: true,
    transactions: {
      select: { id: true, amount: true, category: true },
      take: 10,
    },
  },
});
```

---

## Database Maintenance

### Backup (SQLite)

```bash
# Copy database file
cp prisma/dev.db prisma/dev.db.backup

# Or use SQLite CLI
sqlite3 prisma/dev.db ".backup 'backup.db'"
```

### Backup (PostgreSQL)

```bash
# Dump database
pg_dump -U username -d expenseit -f backup.sql

# Restore
psql -U username -d expenseit -f backup.sql
```

### Clean Up Expired Tokens

Add a scheduled job or manual cleanup:

```typescript
// Delete expired refresh tokens
await prisma.refreshToken.deleteMany({
  where: {
    expiresAt: { lt: new Date() },
  },
});

// Or revoke instead of delete (for audit trail)
await prisma.refreshToken.updateMany({
  where: {
    expiresAt: { lt: new Date() },
    revokedAt: null,
  },
  data: { revokedAt: new Date() },
});
```

---

## Schema Evolution

### Safe Schema Changes

✅ **Safe** (no data loss):

- Adding nullable columns
- Adding new models
- Adding indexes
- Making columns nullable

⚠️ **Risky** (requires data migration):

- Renaming columns (use `@map` for DB column name)
- Changing column types
- Making columns non-nullable
- Removing columns

❌ **Destructive**:

- Dropping tables
- Removing non-nullable columns

### Example: Rename Field Safely

**Option 1: Use `@map`** (recommended):

```prisma
model User {
  id         Int    @id @default(autoincrement())
  fullName   String @map("firstName")  // App uses fullName, DB column is firstName
}
```

**Option 2: Multi-step migration**:

1. Add new column as nullable
2. Migrate data from old column to new column
3. Make new column non-nullable
4. Remove old column

---

## Environment Variables

Required for database operations:

```bash
# Development (SQLite)
DATABASE_URL="file:./dev.db"

# Production (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"

# Optional: Prisma logging
DEBUG="prisma:query"  # Log all SQL queries
```

---

## Troubleshooting

### "Error: P1001: Can't reach database server"

- Check `DATABASE_URL` is correct
- Verify database server is running (PostgreSQL)
- For SQLite: ensure `prisma/` directory exists

### "Error: P2002: Unique constraint failed"

- Trying to insert duplicate email, userId, etc.
- Check if record already exists before creating

### "Error: P2025: Record not found"

- Trying to update/delete non-existent record
- Use `findUnique()` or `findFirst()` to check existence

### Migration conflicts

```bash
# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Or: manually resolve conflicts
npx prisma migrate resolve --applied <migration-name>
```

### Prisma Client out of sync

```bash
# Regenerate client
npm run prisma:generate
# Or: npx prisma generate
```

---

## Future Enhancements

- [ ] Add `Transaction.tags` for flexible categorization
- [ ] Add `Transaction.dateUpdated` for audit trail
- [ ] Add `User.createdAt` and `User.updatedAt` timestamps
- [ ] Implement soft deletes (add `deletedAt` field)
- [ ] Add full-text search indexes (PostgreSQL only)
- [ ] Implement row-level security (PostgreSQL policies)
- [ ] Add database-level enums for `Transaction.category`
- [ ] Add `Account.currency` for multi-currency support
