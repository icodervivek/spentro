# PG Expense Splitter — Backend

Node.js + Express + MongoDB REST API for the PG Expense Splitter app. Serves both the React Native mobile app and the React admin dashboard.

## Tech Stack

| Concern | Library |
|---------|---------|
| Framework | Express 4 |
| Database | MongoDB via Mongoose 8 |
| Auth | JWT (access + refresh tokens), bcryptjs |
| File uploads | Cloudinary + multer-storage-cloudinary |
| Input validation | Joi |
| Recurring jobs | node-cron |
| Invite codes | nanoid (custom alphabet) |
| Security | helmet, cors, express-rate-limit |
| Logging | morgan |

## Money is stored in Paise

**All monetary amounts are integers in paise.** ₹100.00 = `10000`. The frontend is responsible for converting paise to rupees for display. This eliminates JavaScript floating-point rounding bugs entirely.

When splitting equally among N people, the remainder paise (e.g., ₹100 ÷ 3 → one person gets 3334 paise, the other two get 3333) are distributed so the shares always sum to the exact total.

## Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd pg-expense-backend
npm install

# 2. Create your .env
cp .env.example .env
# Fill in all values (see Environment Variables section below)

# 3. Start in development mode (nodemon)
npm run dev

# 4. Start in production
npm start
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Port to listen on (default: 5000) |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Random string ≥ 32 chars for access tokens |
| `JWT_EXPIRES_IN` | Access token TTL (e.g., `7d`) |
| `JWT_REFRESH_SECRET` | Random string ≥ 32 chars for refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL (e.g., `30d`) |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |
| `CLIENT_URLS` | Comma-separated allowed CORS origins |

## API Base URL

```
http://localhost:5000/api/v1
```

All routes are prefixed with `/api/v1/`.

---

## API Endpoints

### Auth — `/api/v1/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Register a new user |
| POST | `/login` | — | Login, returns tokens |
| POST | `/refresh` | — | Exchange refresh token for new access token |
| POST | `/logout` | — | Revoke refresh token |
| GET | `/me` | Bearer | Get current user |

### Users — `/api/v1/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PATCH | `/me` | Bearer | Update profile (name, phone, avatarUrl, fcmToken) |
| PATCH | `/me/password` | Bearer | Change password |

### Groups — `/api/v1/groups`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Bearer | Create a group |
| GET | `/` | Bearer | List my groups |
| POST | `/join` | Bearer | Join via invite code |
| GET | `/:groupId` | Bearer + Member | Group detail with members |
| PATCH | `/:groupId` | Bearer + Admin | Update group info |
| DELETE | `/:groupId/members/:userId` | Bearer + Admin | Remove member |
| POST | `/:groupId/leave` | Bearer + Member | Leave group |
| GET | `/:groupId/balances` | Bearer + Member | Full balance summary + debt list |
| GET | `/:groupId/balances/me` | Bearer + Member | My net balance and debts |

### Expenses — `/api/v1/expenses`

| Method | Path | Auth | Query/Body | Description |
|--------|------|------|------------|-------------|
| POST | `/` | Bearer + Member | body: groupId, amount, … | Create expense (multipart for bill image) |
| GET | `/` | Bearer + Member | ?groupId=&month=YYYY-MM&category=&page=&limit= | Paginated expense list |
| GET | `/:id` | Bearer + Member | ?groupId= | Single expense |
| PATCH | `/:id` | Bearer + Member | body/query: groupId | Edit expense |
| DELETE | `/:id` | Bearer + Member | body/query: groupId | Soft-delete expense |

Supports `Idempotency-Key` header on POST to prevent duplicate creation on retry.

### Settlements — `/api/v1/settlements`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Bearer + Member | Create pending settlement |
| GET | `/` | Bearer + Member | List settlements for group (?groupId=) |
| PATCH | `/:id/confirm` | Bearer + Member | Receiver confirms settlement |
| PATCH | `/:id/reject` | Bearer + Member | Receiver rejects settlement |

### Balances — `/api/v1/groups/:groupId/balances`

Mounted under group routes (see Groups above).

### Reports — `/api/v1/reports`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/monthly` | Bearer + Member | Monthly totals by category & user (?groupId=&month=YYYY-MM) |
| GET | `/category` | Bearer + Member | Category trends over date range (?groupId=&from=&to=) |

### Recurring — `/api/v1/recurring`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Bearer + Member | Create recurring expense template |
| GET | `/` | Bearer + Member | List templates (?groupId=) |
| PATCH | `/:id` | Bearer + Member | Update template |
| DELETE | `/:id` | Bearer + Member | Deactivate template |

### Admin — `/api/v1/admin` _(requires admin role)_

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | Paginated user list (?status=&search=&page=) |
| PATCH | `/users/:id/status` | Suspend or activate a user |
| GET | `/groups` | Paginated group list |
| GET | `/groups/:id` | Group detail with expense stats |
| GET | `/analytics` | Platform-wide stats |
| GET | `/audit-logs` | Paginated audit log (?groupId=&userId=&action=&page=) |

---

## Key Design Decisions

1. **Paise-only storage** — no floats, no rounding errors.
2. **Equal-split remainder** — distributed one paise at a time so shares always sum exactly.
3. **Soft delete** — `deletedAt` field, never hard-delete an expense.
4. **Audit log** — every mutating action on expenses, settlements, and groups is recorded.
5. **Balance computed on-the-fly** — from expenses + confirmed settlements; no stored running total.
6. **Greedy debt simplification** — minimises the number of "who pays whom" transactions.
7. **Two-step settlement** — payer creates `pending`, receiver `confirm`s or `reject`s.
8. **Idempotency key** — `Idempotency-Key` header on expense creation prevents duplicates from retries.
9. **Group access middleware** — `requireGroupMember` applied to every expense/settlement/balance route.

## Ambiguous Decisions

- **Refresh token storage**: stored as plaintext in the User document. Acceptable for the free-tier single-instance deployment. For production at scale, move to Redis.
- **Bill image URL on update**: PATCH `/expenses/:id` accepts a new `billImage` file upload but does not delete the old Cloudinary asset (would require storing the public_id separately — straightforward extension if needed).
- **Admin account creation**: set `role: 'admin'` directly in MongoDB Atlas for the first admin user; no self-registration flow for admins.
