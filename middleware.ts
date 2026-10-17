import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Bypass Next.js static bundles, public assets, and auth endpoints
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico" ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|css|js)$/)
  ) {
    return NextResponse.next();
  }

  const secret =
    process.env.NEXTAUTH_SECRET || "mediscan-production-auth-secret-key-32chars-minimum";

  // 2. Retrieve JWT token, accounting for both standard and secure cookie names
  let token = await getToken({ req, secret });
  if (!token) {
    token = await getToken({ req, secret, secureCookie: false });
  }
  if (!token) {
    token = await getToken({ req, secret, secureCookie: true });
  }

  const isAuthenticated = !!token;
  const isHomeRoute = pathname === "/";
  const isAuthRoute = pathname.startsWith("/auth/");

  // 3. If user is already authenticated and visits signin or signup, redirect to /scan
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/scan", req.url));
  }

  // 4. Public routes accessible without logging in
  if (isHomeRoute || isAuthRoute) {
    return NextResponse.next();
  }

  // 5. Protected routes: If unauthenticated, redirect or return 401 for APIs
  if (!isAuthenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Authentication required. Please sign in to continue." },
        { status: 401 }
      );
    }

    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
