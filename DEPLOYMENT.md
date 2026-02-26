# Sugularity — Deployment Guide

## Local Development (Current)

```bash
npm install
npx prisma db push
npm run dev
```

App runs at `http://localhost:3000`. Data stored in `prisma/sugularity.db` (SQLite).

---

## Cloud Deployment Checklist

### 1. Database — Migrate from SQLite → PostgreSQL (or Turso)

**Option A: PostgreSQL (Vercel Postgres / Neon / Supabase)**
```bash
# Update prisma/schema.prisma:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

# Run migrations (not db push) for production:
npx prisma migrate deploy
```

**Option B: Turso (libSQL — SQLite-compatible, edge-friendly)**
```bash
npm install @libsql/client @prisma/adapter-libsql
# Update schema provider to "sqlite" with libsql adapter
# See: https://www.prisma.io/docs/orm/overview/databases/turso
```

### 2. Authentication — Add NextAuth.js

```bash
npm install next-auth@beta
```

See `lib/auth.ts` for full migration checklist. Key steps:
- Add `userId` to all Prisma models
- Wrap Server Actions with `requireAuth()`
- Create `app/api/auth/[...nextauth]/route.ts`
- Add `middleware.ts` to protect routes

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in:
- `DATABASE_URL` — your production DB connection string
- `NEXTAUTH_SECRET` — `openssl rand -base64 32`
- `NEXTAUTH_URL` — your production domain
- `GEMINI_API_KEY` — for Taliye AI

On Vercel: add all variables in Project Settings → Environment Variables.

### 4. File Storage (for uploads/covers)

Currently files are stored locally in `public/uploads/`.
For cloud: replace with Vercel Blob, AWS S3, or Cloudflare R2.

```bash
npm install @vercel/blob
# Update any file upload actions to use put() from @vercel/blob
```

### 5. Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deploys on push.

### 6. Post-Deploy Checklist

- [ ] Run `npx prisma migrate deploy` against production DB
- [ ] Verify all env vars are set in Vercel dashboard
- [ ] Test authentication flow end-to-end
- [ ] Verify AI chat (Gemini API key works)
- [ ] Run a full data export to confirm backup works
- [ ] Set up monitoring (Vercel Analytics, Sentry, or LogRocket)

---

## Architecture Notes

| Layer | Local | Cloud |
|-------|-------|-------|
| DB | SQLite (`prisma.db`) | PostgreSQL / Turso |
| Auth | None (single-user) | NextAuth.js |
| Files | `public/uploads/` | Vercel Blob / S3 |
| AI | Gemini API | Gemini API (same) |
| Cache | Next.js cache | Same + CDN edge |
| Deploy | `npm run dev` | Vercel / Railway |

---

## Data Backup

Before any migration, export your data:

```
/dashboard → Settings → Export Data
```

This creates a full JSON export of all your records.
