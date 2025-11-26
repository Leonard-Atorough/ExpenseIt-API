# Authentication & Authorization

## Overview

ExpenseIt-API uses JWT-based authentication with access and refresh tokens. The authentication flow is designed to balance security and user experience with short-lived access tokens and longer-lived refresh tokens.

## Token Strategy

### Access Tokens

- **Purpose**: Authorize API requests
- **Lifetime**: 15 minutes (configurable via `ACCESS_TOKEN_EXP`)
- **Storage**: Client-side (memory or secure storage, NOT localStorage)
- **Transport**: `Authorization: Bearer <token>` header
- **Claims**:
  - `sub`: User ID (string)
  - `iat`: Issued at timestamp
  - `exp`: Expiry timestamp

### Refresh Tokens

- **Purpose**: Obtain new access tokens without re-authentication
- **Lifetime**: 7 days (configurable via `REFRESH_TOKEN_EXP`)
- **Storage**: HttpOnly cookie (not accessible to JavaScript)
- **Transport**: Automatic via cookie on `/auth/refresh` requests
- **Claims**:
  - `sub`: User ID
  - `rid`: Refresh token ID (database record reference)
  - `iat`: Issued at
  - `exp`: Expiry

### Security Properties

| Feature        | Access Token                | Refresh Token            |
| -------------- | --------------------------- | ------------------------ |
| Expiry         | Short (15m)                 | Long (7d)                |
| Revocable      | ❌ No (relies on short TTL) | ✅ Yes (DB-backed)       |
| XSS Protection | ⚠️ Client responsibility    | ✅ HttpOnly cookie       |
| Storage        | Client memory/secure store  | Server + HttpOnly cookie |
| Rotation       | No                          | ✅ Yes (on each refresh) |

## Authentication Flows

### 1. Registration Flow

```
┌────────┐                  ┌─────────┐                ┌──────────┐
│ Client │                  │   API   │                │ Database │
└───┬────┘                  └────┬────┘                └────┬─────┘
    │                            │                          │
    │ POST /auth/register        │                          │
    │ { email, password, ... }   │                          │
    ├───────────────────────────>│                          │
    │                            │                          │
    │                            │ Validate input           │
    │                            │ (email format, etc.)     │
    │                            │                          │
    │                            │ Check email exists       │
    │                            ├─────────────────────────>│
    │                            │<─────────────────────────┤
    │                            │                          │
    │                            │ Hash password (bcrypt)   │
    │                            │                          │
    │                            │ Create User + Account    │
    │                            ├─────────────────────────>│
    │                            │<─────────────────────────┤
    │                            │                          │
    │ 201 Created                │                          │
    │ { id, email, ... }         │                          │
    │<───────────────────────────┤                          │
    │                            │                          │
```

**Request**:

```http
POST /auth/register HTTP/1.1
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response** (201 Created):

```json
{
  "id": "1",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com"
}
```

### 2. Login Flow

```
┌────────┐                  ┌─────────┐                ┌──────────┐
│ Client │                  │   API   │                │ Database │
└───┬────┘                  └────┬────┘                └────┬─────┘
    │                            │                          │
    │ POST /auth/login           │                          │
    │ { email, password }        │                          │
    ├───────────────────────────>│                          │
    │                            │                          │
    │                            │ Find user by email       │
    │                            ├─────────────────────────>│
    │                            │<─────────────────────────┤
    │                            │                          │
    │                            │ Compare password hash    │
    │                            │                          │
    │                            │ Generate access token    │
    │                            │ Generate refresh token   │
    │                            │                          │
    │                            │ Store refresh token      │
    │                            ├─────────────────────────>│
    │                            │<─────────────────────────┤
    │                            │                          │
    │ 200 OK                     │                          │
    │ Set-Cookie: refreshToken   │                          │
    │ { user, accessToken }      │                          │
    │<───────────────────────────┤                          │
    │                            │                          │
```

**Request**:

```http
POST /auth/login HTTP/1.1
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):

```http
HTTP/1.1 200 OK
Set-Cookie: refreshToken=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/auth/refresh; Max-Age=604800
Content-Type: application/json

{
  "user": {
    "id": "1",
    "email": "john@example.com",
    "firstName": "John"
  },
  "token": "<access-token-jwt>"
}
```

### 3. Protected Request Flow

```
┌────────┐                  ┌─────────┐                ┌──────────┐
│ Client │                  │   API   │                │ Database │
└───┬────┘                  └────┬────┘                └────┬─────┘
    │                            │                          │
    │ GET /transactions          │                          │
    │ Authorization: Bearer ...  │                          │
    ├───────────────────────────>│                          │
    │                            │                          │
    │                            │ [Auth Middleware]        │
    │                            │ Verify JWT signature     │
    │                            │ Check expiry             │
    │                            │ Extract user ID          │
    │                            │ Attach to req.user       │
    │                            │                          │
    │                            │ [Controller]             │
    │                            │ Read req.user.sub        │
    │                            │                          │
    │                            │ Fetch user's transactions│
    │                            ├─────────────────────────>│
    │                            │<─────────────────────────┤
    │                            │                          │
    │ 200 OK                     │                          │
    │ [...transactions]          │                          │
    │<───────────────────────────┤                          │
    │                            │                          │
```

**Request**:

```http
GET /transactions HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):

```json
[
  {
    "id": 1,
    "amount": 5000,
    "category": "Groceries",
    "description": "Weekly shopping",
    "dateCreated": "2025-11-20T10:00:00.000Z"
  }
]
```

### 4. Token Refresh Flow

```
┌────────┐                  ┌─────────┐                ┌──────────┐
│ Client │                  │   API   │                │ Database │
└───┬────┘                  └────┬────┘                └────┬─────┘
    │                            │                          │
    │ POST /auth/refresh         │                          │
    │ Cookie: refreshToken=...   │                          │
    ├───────────────────────────>│                          │
    │                            │                          │
    │                            │ Verify refresh token     │
    │                            │ Extract rid              │
    │                            │                          │
    │                            │ Find token in DB         │
    │                            ├─────────────────────────>│
    │                            │<─────────────────────────┤
    │                            │                          │
    │                            │ Check expiry, revocation │
    │                            │                          │
    │                            │ Generate new access token│
    │                            │ Generate new refresh token│
    │                            │                          │
    │                            │ Delete old refresh token │
    │                            │ Store new refresh token  │
    │                            ├─────────────────────────>│
    │                            │<─────────────────────────┤
    │                            │                          │
    │ 200 OK                     │                          │
    │ Set-Cookie: refreshToken   │                          │
    │ { token }                  │                          │
    │<───────────────────────────┤                          │
    │                            │                          │
```

**Request**:

```http
POST /auth/refresh HTTP/1.1
Cookie: refreshToken=<jwt>
```

**Response** (200 OK):

```http
HTTP/1.1 200 OK
Set-Cookie: refreshToken=<new-jwt>; HttpOnly; Secure; SameSite=Lax; Path=/auth/refresh; Max-Age=604800
Content-Type: application/json

{
  "token": "<new-access-token-jwt>"
}
```

### 5. Logout Flow

```
┌────────┐                  ┌─────────┐                ┌──────────┐
│ Client │                  │   API   │                │ Database │
└───┬────┘                  └────┬────┘                └────┬─────┘
    │                            │                          │
    │ POST /auth/logout          │                          │
    │ Authorization: Bearer ...  │                          │
    │ Cookie: refreshToken=...   │                          │
    ├───────────────────────────>│                          │
    │                            │                          │
    │                            │ Verify access token      │
    │                            │ Extract user ID          │
    │                            │                          │
    │                            │ Delete refresh token     │
    │                            ├─────────────────────────>│
    │                            │<─────────────────────────┤
    │                            │                          │
    │ 200 OK                     │                          │
    │ Set-Cookie: (clears cookie)│                          │
    │<───────────────────────────┤                          │
    │                            │                          │
```

**Request**:

```http
POST /auth/logout HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Cookie: refreshToken=<jwt>
```

**Response** (200 OK):

```http
HTTP/1.1 200 OK
Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=Lax; Path=/auth/refresh; Max-Age=0
Content-Type: application/json

{
  "message": "Logged out successfully"
}
```

## Security Considerations & Tradeoffs

### 1. Rotating Refresh Tokens with Static Signing Secrets

**Current Implementation**:

- Refresh tokens rotate on each use (new token issued, old one deleted from DB)
- JWT signing secrets are static (configured via environment variables)

**Benefits**:

- Rotation limits the window of token reuse
- Database records allow tracking active sessions (IP, user agent, creation time)
- Can detect and revoke compromised tokens

**Risks**:

- If the signing secret is leaked, attackers can mint valid JWTs
- Static secrets require manual rotation across all environments

**Mitigation**:

- Store refresh token ID (`rid`) in JWT payload and validate against database
- Even if JWT signature is valid, reject if no matching DB record exists
- Consider key rotation: implement `kid` (key ID) in JWT header and maintain multiple active keys

**Recommendation**:

- Short-term: Ensure strong secrets (32+ random bytes) and secure storage
- Long-term: Implement key rotation with versioned signing keys

### 2. Logout Expires Refresh Token but Not Access Token

**Current Implementation**:

- Logout deletes refresh token from DB and clears cookie
- Access tokens remain valid until natural expiry (15 minutes)

**Tradeoff**:

- **Pro**: Simple, stateless, scalable (no global revocation list needed)
- **Pro**: Short access token TTL limits risk window
- **Con**: Stolen access tokens remain valid post-logout

**Options**:

1. **Keep current approach** (recommended for most apps):
   - Rely on short TTL (5-15 minutes)
   - Accept small window of vulnerability
2. **Token blacklist**:

   - Maintain Redis/DB set of revoked token IDs (by `jti` claim)
   - Check blacklist on each protected request
   - TTL entries to match token expiry
   - **Trade**: Adds latency and infrastructure complexity

3. **Reference tokens**:
   - Use opaque tokens that require DB lookup
   - **Trade**: Higher DB load, loses stateless benefit

**Recommendation**:

- Current approach is appropriate for this application
- For high-security scenarios, add optional blacklist for sensitive operations

### 3. Cookie Configuration

**Current Settings**:

```typescript
{
  httpOnly: true,        // ✅ Prevents JavaScript access
  secure: COOKIE_SECURE, // ⚠️ Must be true in production (HTTPS only)
  sameSite: "Lax",       // ⚠️ Consider "Strict" or "None" based on client location
  path: "/auth/refresh", // ✅ Limits cookie scope
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
}
```

**Considerations**:

- **`secure: true`** required in production (HTTPS). Set `COOKIE_SECURE=true` in production env.
- **`sameSite: "Lax"`** allows cookies on top-level navigation (GET). Safe for same-site SPAs.
- **`sameSite: "None"`** required for cross-site requests (frontend on different domain). Must also set `secure: true`.
- **Path**: `/auth/refresh` ensures cookie only sent to refresh endpoint (reduces exposure).

**Local Development**:

- Set `COOKIE_SECURE=false` for HTTP localhost
- Use `sameSite: "Lax"`

**Production**:

- Set `COOKIE_SECURE=true`
- If frontend is on different domain, use `sameSite: "None"` + HTTPS

### 4. CSRF Protection

**Current State**: Minimal CSRF protection via `sameSite` cookie attribute

**Recommendations**:

- **For same-site apps**: `sameSite: "Strict"` or `"Lax"` is sufficient
- **For cross-site apps**:
  - Use `sameSite: "None"` (requires `secure: true`)
  - Add double-submit cookie pattern or synchronizer token for state-changing operations
  - CORS should be configured with specific origins (not wildcard `*`)

### 5. Missing: Audit Logging

**Current Gap**: No logging of authentication events

**Recommendation**: Add structured logs for:

- Login attempts (success/failure)
- Token refresh attempts
- Logout events
- Token expiry/revocation
- Suspicious activity (rapid token refresh, reuse attempts)

**Implementation**:

```typescript
logger.info("auth.login", {
  userId: user.id,
  email: user.email,
  ip: req.ip,
  userAgent: req.headers["user-agent"],
  timestamp: new Date().toISOString(),
});
```

### 6. Rate Limiting

**Current Gap**: No rate limiting on authentication endpoints

**Risk**: Brute force attacks on `/auth/login` and `/auth/register`

**Recommendation**: Add `express-rate-limit` middleware:

```typescript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: "Too many login attempts, please try again later",
});

router.post("/login", loginLimiter, login);
```

## Token Validation Logic

### Access Token Validation (Middleware)

```typescript
export async function authenticationHandler(req: Request, res: Response, next: NextFunction) {
  // 1. Extract token from Authorization header
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.substring(7);

  // 2. Verify JWT signature and expiry
  try {
    const payload = await verifyJwt(token, process.env.JWT_ACCESS_SECRET);

    // 3. Attach user context to request
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
```

### Refresh Token Validation (Service)

```typescript
async function refresh(params: { rawRefresh: string }) {
  // 1. Verify JWT signature and expiry
  const payload = jwt.verify(rawRefresh, process.env.JWT_REFRESH_SECRET) as RefreshTokenPayload;

  // 2. Extract token ID and user ID
  const { sub: userId, rid: tokenId } = payload;

  // 3. Validate token exists in database
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { id: tokenId },
  });

  if (!tokenRecord) {
    return { ok: false, code: 401, message: "Invalid refresh token" };
  }

  // 4. Check if token is revoked
  if (tokenRecord.revokedAt && tokenRecord.revokedAt < new Date()) {
    return { ok: false, code: 401, message: "Token has been revoked" };
  }

  // 5. Verify token belongs to correct user
  if (tokenRecord.userId !== parseInt(userId)) {
    return { ok: false, code: 401, message: "Token mismatch" };
  }

  // 6. Generate new tokens and rotate
  // ... (issue new access + refresh, delete old refresh)
}
```

## Best Practices Summary

✅ **Do**:

- Use short-lived access tokens (5-15 minutes)
- Store refresh tokens in httpOnly cookies
- Rotate refresh tokens on each use
- Validate refresh tokens against database records
- Use strong, random JWT secrets (32+ bytes)
- Set `secure: true` in production
- Add rate limiting on auth endpoints
- Log authentication events for audit

❌ **Don't**:

- Store sensitive data in JWT payload (it's readable)
- Use localStorage for tokens (XSS vulnerability)
- Use same secret for access and refresh tokens
- Allow unlimited login attempts
- Commit secrets to version control
- Use `sameSite: "None"` without `secure: true`

## Environment Configuration

Required environment variables:

```bash
# JWT Secrets (generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET="your-strong-secret-here"
JWT_REFRESH_SECRET="different-strong-secret-here"

# Token Expiry
ACCESS_TOKEN_EXP="15m"    # Short: 5m-15m recommended
REFRESH_TOKEN_EXP="7d"    # Long: 7d-30d typical

# Cookie Security (set to "true" in production with HTTPS)
COOKIE_SECURE="false"     # Local dev: false, Production: true

# CORS (optional, for cross-origin requests)
CLIENT_ORIGIN="http://localhost:3000"
```

## Testing Authentication

### Manual Testing with cURL

**Register**:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","email":"john@test.com","password":"test123"}'
```

**Login**:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"john@test.com","password":"test123"}'
```

**Access Protected Endpoint**:

```bash
curl http://localhost:3000/transactions \
  -H "Authorization: Bearer <access-token-from-login>"
```

**Refresh Token**:

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

**Logout**:

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer <access-token>" \
  -b cookies.txt
```
