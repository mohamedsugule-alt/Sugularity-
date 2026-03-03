import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const hasClerkKeys = !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_...' &&
    process.env.CLERK_SECRET_KEY &&
    process.env.CLERK_SECRET_KEY !== 'sk_test_...'
);

// Dynamic import for Clerk middleware only when keys are configured
let clerkMiddlewareHandler: any = null;

if (hasClerkKeys) {
    // Clerk is available — use full auth middleware
    const { clerkMiddleware, createRouteMatcher } = require("@clerk/nextjs/server");
    const isPublicRoute = createRouteMatcher([
        '/sign-in(.*)',
        '/sign-up(.*)',
        '/api/webhooks(.*)'
    ]);
    clerkMiddlewareHandler = clerkMiddleware((auth: any, req: any) => {
        if (!isPublicRoute(req)) {
            auth().protect();
        }
    });
}

export default function middleware(req: NextRequest) {
    if (clerkMiddlewareHandler) {
        return clerkMiddlewareHandler(req);
    }
    // No Clerk — pass through
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?:map)?|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
