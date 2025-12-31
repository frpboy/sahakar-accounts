import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-server';

const rateLimit = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  return `${ip}:${request.nextUrl.pathname}`;
}

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimit.get(key);
  if (!record || now > record.resetTime) {
    rateLimit.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count < limit) {
    record.count++;
    return true;
  }
  return false;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of Array.from(rateLimit.entries())) {
    if (now > record.resetTime) rateLimit.delete(key);
  }
}, 5 * 60 * 1000);

export async function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith('/api')) {
    const key = getRateLimitKey(request);
    let limit = 100;
    let windowMs = 60 * 1000;
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) limit = 20;
    if (request.nextUrl.pathname === '/api/auth/login') {
      limit = 5;
      windowMs = 60 * 1000;
    }
    if (!checkRateLimit(key, limit, windowMs)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  const isDev = process.env.NODE_ENV === 'development';
  const devMode = process.env.NEXT_PUBLIC_DEV_AUTH === 'true';
  if (!isDev && devMode) {
    console.error('[CRITICAL] DEV_AUTH enabled in production! Disabling immediately.');
    return NextResponse.json({ error: 'Configuration error. Please contact administrator.' }, { status: 503 });
  }

  let response = NextResponse.next({ request: { headers: request.headers } });
  const supabase = createMiddlewareClient(request, response);
  const { data: { session } } = await supabase.auth.getSession();

  const isLoginPage = request.nextUrl.pathname === '/login';
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard');

  if (isLoginPage && session) {
    const forceParam = request.nextUrl.searchParams.get('force');
    const allowForce = (process.env.NODE_ENV === 'development') || (process.env.NEXT_PUBLIC_ALLOW_FORCE_LOGIN === 'true');
    if (forceParam === '1' && allowForce) return response;
    const redirectUrl = new URL('/dashboard', request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    supabase.auth.getSession().then(() => {});
    return redirectResponse;
  }

  if (isDashboardPage && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session) {
    const userRole = (session.user as any).user_metadata?.role;
    if (userRole === 'auditor' && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      return NextResponse.json({ error: 'Auditors have read-only access.' }, { status: 403 });
    }
    if (request.method === 'GET' && isDashboardPage) {
      try {
        const admin = createAdminClient();
        await admin
          .from('audit_logs')
          .insert({
            user_id: session.user.id,
            action: 'view_page',
            entity: 'page',
            entity_id: request.nextUrl.pathname,
            severity: 'normal',
            ip_address: request.headers.get('x-forwarded-for') || null,
            user_agent: request.headers.get('user-agent') || null,
          } as any);
      } catch {}
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
