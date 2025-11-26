# API Reference

## Base URL

```
Development: http://localhost:3000
Production: <your-production-url>
```

All endpoints return JSON responses.

## Common Response Codes

| Code | Meaning               | Description                             |
| ---- | --------------------- | --------------------------------------- |
| 200  | OK                    | Request succeeded                       |
| 201  | Created               | Resource created successfully           |
| 400  | Bad Request           | Invalid input or malformed request      |
| 401  | Unauthorized          | Missing or invalid authentication token |
| 404  | Not Found             | Resource not found                      |
| 500  | Internal Server Error | Server error (check logs)               |

## Error Response Format

```json
{
  "error": "Error message description"
}
```

---

## Authentication Endpoints

Base path: `/auth`

### Register User

Create a new user account.

**Endpoint**: `POST /auth/register`

**Authentication**: None

**Request Body**:

```json
{
  "firstName": "string",
  "lastName": "string (optional)",
  "email": "string (valid email)",
  "password": "string"
}
```

**Success Response** (201 Created):

```json
{
  "id": "1",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com"
}
```

**Error Responses**:

- `400`: Invalid input (missing required fields, invalid email format)
- `409`: User with this email already exists
- `500`: Server error

**Example**:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

---

### Login

Authenticate a user and receive access token + refresh token cookie.

**Endpoint**: `POST /auth/login`

**Authentication**: None

**Request Body**:

```json
{
  "email": "string",
  "password": "string"
}
```

**Success Response** (200 OK):

```http
HTTP/1.1 200 OK
Set-Cookie: refreshToken=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/auth/refresh; Max-Age=604800
Content-Type: application/json

{
  "user": {
    "id": "1",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "token": "<access-token-jwt>"
}
```

**Response Fields**:

- `user`: User profile information
- `token`: JWT access token (15 min expiry, use in `Authorization` header)
- `Set-Cookie`: HttpOnly cookie containing refresh token (7 day expiry)

**Error Responses**:

- `400`: Invalid input (missing email or password)
- `401`: Invalid credentials
- `500`: Server error

**Example**:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

---

### Refresh Access Token

Obtain a new access token using the refresh token cookie.

**Endpoint**: `POST /auth/refresh`

**Authentication**: Refresh token (httpOnly cookie, automatically sent by browser)

**Request Headers**:

```http
Cookie: refreshToken=<jwt>
```

**Request Body**: None

**Success Response** (200 OK):

```http
HTTP/1.1 200 OK
Set-Cookie: refreshToken=<new-jwt>; HttpOnly; Secure; SameSite=Lax; Path=/auth/refresh; Max-Age=604800
Content-Type: application/json

{
  "token": "<new-access-token-jwt>"
}
```

**Response Fields**:

- `token`: New JWT access token
- `Set-Cookie`: New refresh token (old one is invalidated)

**Error Responses**:

- `401`: Missing, invalid, expired, or revoked refresh token
- `500`: Server error

**Example**:

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

**Notes**:

- Refresh tokens are rotated on each use (one-time use)
- Old refresh token is deleted from database
- Client should store new access token and use updated cookie

---

### Logout

Invalidate the current refresh token and clear the cookie.

**Endpoint**: `POST /auth/logout`

**Authentication**: Required (Access token + Refresh token cookie)

**Request Headers**:

```http
Authorization: Bearer <access-token>
Cookie: refreshToken=<jwt>
```

**Request Body**: None

**Success Response** (200 OK):

```http
HTTP/1.1 200 OK
Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=Lax; Path=/auth/refresh; Max-Age=0
Content-Type: application/json

{
  "message": "Logged out successfully"
}
```

**Error Responses**:

- `401`: Invalid or missing access token
- `500`: Server error

**Example**:

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer <your-access-token>" \
  -b cookies.txt
```

**Notes**:

- Refresh token is deleted from database
- Access token remains valid until natural expiry (15 minutes)
- Cookie is cleared by setting `Max-Age=0`

---

## Transaction Endpoints

Base path: `/transactions`

**All transaction endpoints require authentication** (include `Authorization: Bearer <token>` header).

### List Transactions

Get all transactions for the authenticated user.

**Endpoint**: `GET /transactions`

**Authentication**: Required

**Request Headers**:

```http
Authorization: Bearer <access-token>
```

**Query Parameters**: None

**Success Response** (200 OK):

```json
[
  {
    "id": 1,
    "amount": 5000,
    "category": "Groceries",
    "description": "Weekly shopping",
    "dateCreated": "2025-11-20T10:00:00.000Z",
    "userId": 1
  },
  {
    "id": 2,
    "amount": -1500,
    "category": "Entertainment",
    "description": "Movie tickets",
    "dateCreated": "2025-11-19T18:30:00.000Z",
    "userId": 1
  }
]
```

**Response Fields**:

- `id`: Transaction ID
- `amount`: Amount in cents (positive = income, negative = expense)
- `category`: Transaction category
- `description`: Optional description
- `dateCreated`: ISO 8601 timestamp
- `userId`: ID of the user who created the transaction

**Error Responses**:

- `401`: Missing or invalid access token
- `500`: Server error

**Example**:

```bash
curl http://localhost:3000/transactions \
  -H "Authorization: Bearer <your-access-token>"
```

---

### Get Transaction by ID

Retrieve a specific transaction by ID (only if it belongs to the authenticated user).

**Endpoint**: `GET /transactions/:id`

**Authentication**: Required

**Request Headers**:

```http
Authorization: Bearer <access-token>
```

**URL Parameters**:

- `id`: Transaction ID (integer)

**Success Response** (200 OK):

```json
{
  "id": 1,
  "amount": 5000,
  "category": "Groceries",
  "description": "Weekly shopping",
  "dateCreated": "2025-11-20T10:00:00.000Z",
  "userId": 1
}
```

**Error Responses**:

- `400`: Invalid ID format
- `401`: Missing or invalid access token
- `404`: Transaction not found or does not belong to user
- `500`: Server error

**Example**:

```bash
curl http://localhost:3000/transactions/1 \
  -H "Authorization: Bearer <your-access-token>"
```

---

### Create Transaction

Create a new transaction for the authenticated user.

**Endpoint**: `POST /transactions`

**Authentication**: Required

**Request Headers**:

```http
Authorization: Bearer <access-token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "amount": "number (cents, can be negative)",
  "category": "string",
  "description": "string (optional)"
}
```

**Success Response** (201 Created):

```json
{
  "id": 3,
  "amount": 8000,
  "category": "Salary",
  "description": "Monthly paycheck",
  "dateCreated": "2025-11-22T12:00:00.000Z",
  "userId": 1
}
```

**Error Responses**:

- `400`: Invalid input (missing required fields, invalid amount)
- `401`: Missing or invalid access token
- `500`: Server error

**Example**:

```bash
curl -X POST http://localhost:3000/transactions \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 8000,
    "category": "Salary",
    "description": "Monthly paycheck"
  }'
```

**Notes**:

- Amount is stored in cents (e.g., `5000` = $50.00)
- Positive amounts represent income, negative amounts represent expenses
- `dateCreated` is automatically set to current timestamp

---

### Update Transaction

Update an existing transaction (only if it belongs to the authenticated user).

**Endpoint**: `PATCH /transactions/:id`

**Authentication**: Required

**Request Headers**:

```http
Authorization: Bearer <access-token>
Content-Type: application/json
```

**URL Parameters**:

- `id`: Transaction ID (integer)

**Request Body** (all fields optional):

```json
{
  "amount": "number (optional)",
  "category": "string (optional)",
  "description": "string (optional)"
}
```

**Success Response** (200 OK):

```json
{
  "id": 1,
  "amount": 6000,
  "category": "Groceries",
  "description": "Weekly shopping + snacks",
  "dateCreated": "2025-11-20T10:00:00.000Z",
  "userId": 1
}
```

**Error Responses**:

- `400`: Invalid ID or input
- `401`: Missing or invalid access token
- `404`: Transaction not found or does not belong to user
- `500`: Server error

**Example**:

```bash
curl -X PATCH http://localhost:3000/transactions/1 \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 6000,
    "description": "Weekly shopping + snacks"
  }'
```

**Notes**:

- Only provided fields are updated
- Cannot change `userId` or `dateCreated`

---

### Delete Transaction

Delete a transaction (only if it belongs to the authenticated user).

**Endpoint**: `DELETE /transactions/:id`

**Authentication**: Required

**Request Headers**:

```http
Authorization: Bearer <access-token>
```

**URL Parameters**:

- `id`: Transaction ID (integer)

**Success Response** (200 OK):

```json
{
  "message": "Transaction deleted successfully"
}
```

**Error Responses**:

- `400`: Invalid ID format
- `401`: Missing or invalid access token
- `404`: Transaction not found or does not belong to user
- `500`: Server error

**Example**:

```bash
curl -X DELETE http://localhost:3000/transactions/1 \
  -H "Authorization: Bearer <your-access-token>"
```

---

## Rate Limiting

⚠️ **Not currently implemented** (planned enhancement)

Recommended limits:

- `/auth/login`: 5 attempts per 15 minutes
- `/auth/register`: 3 attempts per hour
- `/auth/refresh`: 10 attempts per 15 minutes
- `/transactions/*`: 100 requests per minute

---

## CORS Configuration

**Current Settings**:

```javascript
{
  origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  credentials: true
}
```

**Client Requirements**:

- Include `credentials: "include"` in fetch requests to send cookies
- Ensure `CLIENT_ORIGIN` environment variable matches your frontend URL

**Example Fetch**:

```javascript
fetch("http://localhost:3000/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include", // Required for cookies
  body: JSON.stringify({ email: "user@example.com", password: "pass" }),
});
```

---

## Request Examples

### Complete Authentication Flow

**1. Register**:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","email":"john@test.com","password":"test123"}'
```

**2. Login** (save cookies):

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"john@test.com","password":"test123"}'
```

Response:

```json
{
  "user": { "id": "1", "email": "john@test.com", "firstName": "John" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**3. Create Transaction** (use access token):

```bash
TOKEN="<access-token-from-step-2>"
curl -X POST http://localhost:3000/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":5000,"category":"Groceries","description":"Weekly shopping"}'
```

**4. List Transactions**:

```bash
curl http://localhost:3000/transactions \
  -H "Authorization: Bearer $TOKEN"
```

**5. Refresh Token** (when access token expires):

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

**6. Logout**:

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer $TOKEN" \
  -b cookies.txt
```

---

## JavaScript Client Example

```javascript
class ExpenseItClient {
  constructor(baseUrl = "http://localhost:3000") {
    this.baseUrl = baseUrl;
    this.accessToken = null;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // Important: sends cookies
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Request failed");
    }

    return response.json();
  }

  async register(firstName, email, password, lastName) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ firstName, email, password, lastName }),
    });
  }

  async login(email, password) {
    const data = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.accessToken = data.token;
    return data;
  }

  async refreshToken() {
    const data = await this.request("/auth/refresh", { method: "POST" });
    this.accessToken = data.token;
    return data;
  }

  async logout() {
    await this.request("/auth/logout", { method: "POST" });
    this.accessToken = null;
  }

  async getTransactions() {
    return this.request("/transactions");
  }

  async getTransaction(id) {
    return this.request(`/transactions/${id}`);
  }

  async createTransaction(amount, category, description) {
    return this.request("/transactions", {
      method: "POST",
      body: JSON.stringify({ amount, category, description }),
    });
  }

  async updateTransaction(id, updates) {
    return this.request(`/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  async deleteTransaction(id) {
    return this.request(`/transactions/${id}`, { method: "DELETE" });
  }
}

// Usage
const client = new ExpenseItClient();

try {
  await client.login("john@test.com", "test123");
  const transactions = await client.getTransactions();
  console.log(transactions);
} catch (err) {
  console.error("Error:", err.message);
}
```

---

## Testing with Postman

**Environment Variables**:

```
base_url: http://localhost:3000
access_token: <set-after-login>
```

**Collection Setup**:

1. **POST** `/auth/register`

   - Body (JSON): `{ "firstName": "John", "email": "john@test.com", "password": "test123" }`

2. **POST** `/auth/login`

   - Body (JSON): `{ "email": "john@test.com", "password": "test123" }`
   - Tests (JS):
     ```javascript
     const data = pm.response.json();
     pm.environment.set("access_token", data.token);
     ```

3. **GET** `/transactions`

   - Headers: `Authorization: Bearer {{access_token}}`

4. **POST** `/transactions`

   - Headers: `Authorization: Bearer {{access_token}}`
   - Body (JSON): `{ "amount": 5000, "category": "Groceries", "description": "Test" }`

5. **POST** `/auth/refresh`

   - Tests (JS):
     ```javascript
     const data = pm.response.json();
     pm.environment.set("access_token", data.token);
     ```

6. **POST** `/auth/logout`
   - Headers: `Authorization: Bearer {{access_token}}`
