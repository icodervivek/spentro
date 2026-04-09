# PG Expense Splitter — Admin

Next.js admin dashboard for the PG Expense Splitter platform. This app is used by admin users to monitor users, groups, audit logs, and platform-wide analytics exposed by the backend.

## Tech Stack

| Concern | Library |
|---------|---------|
| Framework | Next.js 16 (App Router) |
| UI | React 18 |
| Data fetching | TanStack Query 5 |
| HTTP client | Axios |
| Charts | Recharts |
| Icons | lucide-react |
| Styling | Tailwind CSS 3 |

## What This App Does

- Admin-only login flow
- Platform overview dashboard with user, group, expense, and spending analytics
- User management with status updates
- Group listing and group detail pages
- Audit log explorer
- Backend API proxying through Next.js rewrites in development

## Setup

```bash
# 1. Install dependencies
cd pg-expense-admin
npm install

# 2. Create your local env file
Create `.env.local` manually

# 3. Start development server
npm run dev

# 4. Production build
npm run build
npm start
```

The app runs on:

```bash
http://localhost:3001
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Public API base path used by Axios. Default is `/api/v1` |
| `BACKEND_ORIGIN` | Backend origin used by Next.js rewrites. Default is `http://localhost:5000` |

### Recommended Local Setup

```env
NEXT_PUBLIC_API_URL=/api/v1
BACKEND_ORIGIN=http://localhost:5000
```

With this setup, browser requests to `/api/v1/*` are rewritten by Next.js to the backend, so you avoid CORS issues during local development.

## Authentication

- Login uses the backend route `POST /api/v1/auth/login`
- The UI only allows users with `role === 'admin'`
- Access token and admin user are stored in `localStorage`
- On `401`, the app clears local auth state and redirects back to `/login`

## Routes

| Route | Purpose |
|-------|---------|
| `/login` | Admin sign-in page |
| `/dashboard` | Overview metrics and charts |
| `/dashboard/users` | Paginated user list and status control |
| `/dashboard/groups` | Paginated group list |
| `/dashboard/groups/[id]` | Group-level detail view |
| `/dashboard/audit-logs` | Audit log browser |

## Backend Endpoints Used

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/auth/login` | Admin login |
| GET | `/api/v1/admin/analytics` | Platform analytics |
| GET | `/api/v1/admin/users` | User list |
| PATCH | `/api/v1/admin/users/:id/status` | Activate or suspend user |
| GET | `/api/v1/admin/groups` | Group list |
| GET | `/api/v1/admin/groups/:id` | Group detail |
| GET | `/api/v1/admin/audit-logs` | Audit logs |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server on port `3001` |
| `npm run build` | Create production build |
| `npm start` | Start production server on port `3001` |

## Notes

- This app depends on `pg-expense-backend` being available.
- The backend must already contain at least one user with `role: 'admin'`.
- Monetary values returned by the backend are in paise and formatted into rupees in the UI.
