/**
 * lib/auth.ts — Authentication scaffold for cloud deployment
 *
 * Currently Sugularity is local-first / single-user.
 * This file is a scaffold for when you add multi-user auth.
 *
 * Recommended stack: NextAuth.js v5 (Auth.js)
 *   npm install next-auth@beta
 *
 * Activate by:
 *   1. Setting NEXTAUTH_SECRET and NEXTAUTH_URL in .env
 *   2. Adding OAuth credentials for your chosen provider
 *   3. Wrapping API routes and Server Actions with getServerSession()
 *   4. Scoping all DB queries to session.user.id
 */

// ── Type scaffold ────────────────────────────────────────────

export type AuthUser = {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
};

export type AuthSession = {
    user: AuthUser;
    expires: string;
};

// ── Current implementation: no-op (local-first) ──────────────

/**
 * Returns the current session.
 * In local-first mode this always returns a synthetic local user.
 * Replace with NextAuth's `getServerSession(authOptions)` when deploying to cloud.
 */
export async function getSession(): Promise<AuthSession> {
    return {
        user: {
            id: 'local',
            email: 'local@sugularity.app',
            name: 'Local User',
        },
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
    };
}

/**
 * Returns the current user ID.
 * Use this in Server Actions to scope DB queries per user.
 * Currently returns 'local' — every record belongs to a single local user.
 */
export async function getCurrentUserId(): Promise<string> {
    const session = await getSession();
    return session.user.id;
}

/**
 * Guard helper — throws if not authenticated.
 * In local mode, always passes.
 */
export async function requireAuth(): Promise<AuthSession> {
    const session = await getSession();
    if (!session?.user) {
        throw new Error('Unauthorized');
    }
    return session;
}

// ── Cloud migration checklist ─────────────────────────────────
/*
When moving to cloud:

1. Add `userId String` field to every major model in schema.prisma
   (Task, Project, Goal, Ritual, DailyPlan, InboxItem, UserSettings, etc.)

2. Run `prisma migrate dev --name add-user-id`

3. Replace all `prisma.task.findMany({ where: { ... } })` calls with
   `prisma.task.findMany({ where: { userId, ... } })`

4. Install and configure NextAuth.js:
   - Create app/api/auth/[...nextauth]/route.ts
   - Add authOptions with your chosen provider (Google, GitHub, etc.)
   - Wrap Server Actions with: const session = await requireAuth()

5. Add middleware.ts to protect routes:
   export { default } from 'next-auth/middleware'
   export const config = { matcher: ['/((?!api/auth|_next|favicon).*)'] }
*/
