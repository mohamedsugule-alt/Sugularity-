import { PrismaClient } from '@prisma/client';

const hasClerkKeys = !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_...' &&
    process.env.CLERK_SECRET_KEY &&
    process.env.CLERK_SECRET_KEY !== 'sk_test_...'
);

const prismaClientSingleton = () => {
    return new PrismaClient().$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    // Bypass for system cron jobs
                    if (process.env.SYSTEM_CRON === 'true') {
                        return query(args);
                    }

                    let userId: string | null = null;

                    if (hasClerkKeys) {
                        try {
                            const { auth } = require('@clerk/nextjs/server');
                            const authData = await auth();
                            userId = authData?.userId;
                        } catch (e) {
                            throw new Error("Prisma query called outside of a valid Next.js request context without SYSTEM_CRON=true");
                        }

                        if (!userId) {
                            throw new Error('Unauthorized Database Access: Clerk userId is missing.');
                        }
                    } else {
                        // No Clerk — use a default userId for single-user mode
                        userId = 'default-user';
                    }

                    // Ensure args object exists
                    args = args || {};

                    // Enforce RLS for writes
                    if (['create', 'createMany'].includes(operation)) {
                        args.data = args.data || {};
                        if (Array.isArray(args.data)) {
                            args.data.forEach((d: any) => { d.userId = userId });
                        } else {
                            args.data.userId = userId;
                        }
                    }

                    // Enforce RLS for reads & updates
                    if (['findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany', 'update', 'updateMany', 'delete', 'deleteMany', 'count', 'aggregate', 'groupBy'].includes(operation)) {
                        args.where = { ...args.where, userId };
                    }

                    return query(args);
                }
            }
        }
    });
};

const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof prismaClientSingleton> | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
