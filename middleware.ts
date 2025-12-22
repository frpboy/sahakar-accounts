import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple rate limiting using in-memory store (for development)
// In production, use Redis or similar
const rateLimit = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(request: NextRequest): string {
    // Use IP + pathname for rate limit key
    const ip = request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown';
    return `${ip}:${request.nextUrl.pathname}`;
}

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const record = rateLimit.get(key);

    if (!record || now > record.resetTime) {
        // First request or window expired
        rateLimit.set(key, { count: 1, resetTime: now + windowMs });
        return true;
    }

    if (record.count < limit) {
        record.count++;
        return true;
    }

    return false; // Rate limit exceeded
}

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    const entries = Array.from(rateLimit.entries());
    for (const [key, record] of entries) {
        if (now > record.resetTime) {
            rateLimit.delete(key);
        }
    }
}, 5 * 60 * 1000);

export function middleware(request: NextRequest) {
    // Skip rate limiting for static files
    if (
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.startsWith('/static') ||
        request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
    ) {
        return NextResponse.next();
    }

    // Apply rate limiting to API routes
    if (request.nextUrl.pathname.startsWith('/api')) {
        const key = getRateLimitKey(request);

        // Different limits for different endpoints
        let limit = 100; // requests
        let windowMs = 60 * 1000; // per minute

        // Stricter limits for write operations
        if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
            limit = 20; // 20 writes per minute
        }

        // Very strict on login
        if (request.nextUrl.pathname === '/api/auth/login') {
            limit = 5;
            windowMs = 60 * 1000; // 5 attempts per minute
        }

        if (!checkRateLimit(key, limit, windowMs)) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                {
                    status: 429,
                    headers: {
                        'Retry-After': '60',
                    }
                }
            );
        }
    }

    // Check DEV_AUTH in production
    const isDev = process.env.NODE_ENV === 'development';
    const devMode = process.env.NEXT_PUBLIC_DEV_AUTH === 'true';

    if (!isDev && devMode) {
        console.error('🚨 CRITICAL: DEV_AUTH enabled in production! Disabling immediately.');
        // In production, redirect to error page
        return NextResponse.json(
            { error: 'Configuration error. Please contact administrator.' },
            { status: 503 }
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
