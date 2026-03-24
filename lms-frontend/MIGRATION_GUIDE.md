# React + Express ➜ Next.js (App Router) Migration

## Final Architecture

- Single deployable app on Vercel
- UI routes in `app/**`
- API endpoints in `app/api/**` (Route Handlers)
- MVC backend organization in `lib/server/**`
  - `controllers/`
  - `models/`
  - `middleware/`
  - `db.js`

## Route Mapping (react-router-dom ➜ Next.js)

- `/` ➜ `app/page.tsx`
- `/login` ➜ `app/(auth)/login/page.tsx`
- `/register` ➜ `app/(auth)/register/page.tsx`
- `/dashboard` ➜ `app/(dashboard)/dashboard/page.tsx`
- `/courses` ➜ `app/courses/page.tsx`
- `/courses/:id` ➜ `app/courses/[id]/page.tsx`
- `/courses/:id/learn` ➜ `app/courses/[id]/learn/page.tsx`
- `/courses/:id/preview` ➜ `app/courses/[id]/preview/page.tsx`
- `/purchase/:id` ➜ `app/purchase/[id]/page.tsx`
- `/profile` ➜ `app/profile/page.tsx`
- `/instructor` ➜ `app/instructor/page.tsx`
- `/instructor/courses/:id/edit` ➜ `app/instructor/courses/[id]/edit/page.tsx`

## API Mapping (Express ➜ Next Route Handlers)

- `POST /api/auth/register` ➜ `app/api/auth/register/route.js`
- `POST /api/auth/login` ➜ `app/api/auth/login/route.js`
- `POST /api/auth/logout` ➜ `app/api/auth/logout/route.js`
- `GET /api/auth/me` ➜ `app/api/auth/me/route.js`
- `GET|POST /api/courses` ➜ `app/api/courses/route.js`
- `GET|PUT|DELETE /api/courses/:id` ➜ `app/api/courses/[id]/route.js`
- `POST /api/courses/:id/purchase` ➜ `app/api/courses/[id]/purchase/route.js`
- `GET|PUT /api/progress` ➜ `app/api/progress/route.js`
- `PUT /api/progress/time` ➜ `app/api/progress/time/route.js`
- `GET|PUT /api/users/profile` ➜ `app/api/users/profile/route.js`
- `POST /api/users/avatar` ➜ `app/api/users/avatar/route.js`
- `GET /api/users/certificates` ➜ `app/api/users/certificates/route.js`
- `GET /api/users/stats` ➜ `app/api/users/stats/route.js`
- `PUT /api/users/change-password` ➜ `app/api/users/change-password/route.js`
- `PUT /api/users/change-email` ➜ `app/api/users/change-email/route.js`

## Component Model

- Server Components by default for page-level data fetching
- Client Components only when needed (`useState`, `useEffect`, navigation interactions)
- Existing Tailwind utility styling preserved

## Deployment Notes (Vercel)

1. Deploy only `lms-frontend`
2. Add env vars from `.env.example`
3. No separate backend service needed
