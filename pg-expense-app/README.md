# PG Expense Splitter — Mobile App

Expo + React Native mobile app for PG Expense Splitter. This is the roommate-facing client for creating groups, tracking expenses, viewing balances, settling dues, and managing recurring shared costs.

## Tech Stack

| Concern | Library |
|---------|---------|
| Framework | Expo SDK 52 |
| Navigation | expo-router |
| UI | React Native 0.76 |
| State | Zustand |
| Server state | TanStack Query 5 |
| HTTP client | Axios + native `fetch` for multipart uploads |
| Forms | react-hook-form + zod |
| Secure auth storage | expo-secure-store |
| Media | expo-image-picker |
| Visual polish | expo-linear-gradient, expo-haptics |

## What This App Does

- User registration and login
- Group creation and join by invite code
- Group detail view with expenses, balances, settlements, members, and recurring tabs
- Expense creation, editing, deletion, and bill image upload
- Balance summary and settlement flow
- Monthly and category reports
- Profile editing and password change
- Recurring expense templates for monthly/weekly/daily costs

## Setup

```bash
# 1. Install dependencies
cd pg-expense-app
npm install

# 2. Configure env
Create `.env` manually

# 3. Start Expo
npm run start

# 4. Launch on a target
npm run android
npm run ios
npm run web
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Full backend API base URL, for example `http://localhost:5000/api/v1` |

### Local Development Examples

```env
# Android emulator
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api/v1

# iOS simulator
EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1

# Physical device on same Wi-Fi
EXPO_PUBLIC_API_URL=http://<your-lan-ip>:5000/api/v1
```

## Authentication

- Access and refresh tokens are stored in `expo-secure-store`
- Axios automatically attaches the access token to JSON requests
- On `401`, the client attempts a refresh using `/auth/refresh`
- If refresh fails, stored auth is cleared and the user is logged out

## File Uploads

Expense and profile image uploads use native `fetch` instead of Axios for multipart requests. This avoids React Native `FormData` serialization issues and lets the backend receive proper multipart boundaries.

## Main Screens

| Route | Purpose |
|-------|---------|
| `/` | Entry redirect / boot flow |
| `/(auth)/login` | User login |
| `/(auth)/register` | User registration |
| `/(tabs)` | Main tab shell |
| `/(tabs)/index` | Home and group list |
| `/(tabs)/activity` | Recent expense activity |
| `/(tabs)/profile` | Profile and account actions |
| `/group/create` | Create group |
| `/group/join` | Join with invite code |
| `/group/[id]` | Group detail with expenses, balances, settlements, members, recurring |
| `/group/reports` | Group reporting screens |
| `/group/edit` | Group settings |
| `/expense/create` | Create expense |
| `/expense/edit` | Edit expense |
| `/settlement/create` | Create settlement |
| `/recurring/create` | Create recurring template |
| `/recurring/edit` | Edit recurring template |

## Backend Endpoints Used

| Area | Endpoints |
|------|-----------|
| Auth | `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/refresh` |
| Users | `/users/me`, `/users/me/password` |
| Groups | `/groups`, `/groups/join`, `/groups/:id`, `/groups/:id/leave`, `/groups/:id/members/:userId`, `/groups/:id/balances`, `/groups/:id/balances/me` |
| Expenses | `/expenses`, `/expenses/:id` |
| Settlements | `/settlements`, `/settlements/:id/confirm`, `/settlements/:id/reject` |
| Reports | `/reports/monthly`, `/reports/category` |
| Recurring | `/recurring`, `/recurring/:id` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start` | Start Expo dev server |
| `npm run android` | Open Android target |
| `npm run ios` | Open iOS target |
| `npm run web` | Run Expo web build |

## Notes

- This app depends on `pg-expense-backend` running and reachable from the device or simulator.
- All money values returned by the backend are in paise; the app formats them into rupees for display.
- For physical-device testing, your phone and development machine must be on the same local network.
