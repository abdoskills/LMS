# LMS Full-Stack (Next.js + API Routes + MVC)

This app now runs as a **single Next.js project** with:

- Frontend UI (App Router)
- Backend API (`app/api/**`)
- MVC-style server structure in `lib/server/**`
- MongoDB via Mongoose

## Project Structure

- `app/api/**`: API route handlers
- `lib/server/controllers/**`: controller logic
- `lib/server/models/**`: Mongoose models
- `lib/server/middleware/**`: auth middleware helpers
- `lib/server/db.js`: MongoDB connection

## Environment Variables

Copy `.env.example` to `.env.local` and set values:

```bash
cp .env.example .env.local
```

Required:

- `MONGODB_URI`
- `JWT_SECRET`

Optional:

- `MONGODB_DB`
- `JWT_EXPIRE`
- `NEXT_PUBLIC_API_URL` (defaults to `/api`)

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Seed Dummy Data (includes Admin)

```bash
npm run seed
```

Creates demo users:

- Admin: `admin@lms.com` / `Admin@123456`
- Instructor: `instructor@lms.com` / `Instructor@123`
- Student: `student@lms.com` / `Student@123`

## Production

```bash
npm run build
npm start
```

## Deploy to Vercel (Easy)

1. Push `lms-frontend` to GitHub.
2. Import the repo in Vercel.
3. Add environment variables from `.env.example` in Vercel Project Settings.
4. Deploy.

No separate backend service is required.
