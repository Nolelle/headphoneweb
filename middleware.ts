// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths that don't require site password
const publicPaths = [
  "/enter-password",
  "/api/verify-password",
  "/_next", // Next.js system routes
  "/favicon.ico", // Favicon
  "/api/admin/login" // Admin login API must be accessible
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Stripe webhook requests to bypass CSRF protection
  if (request.nextUrl.pathname === "/api/stripe/webhook") {
    return NextResponse.next();
  }

  // Function to check if path is public
  const isPublicPath = (path: string) => {
    return publicPaths.some(
      (publicPath) =>
        path.startsWith(publicPath) ||
        path.includes("/static/") ||
        path.includes("/images/")
    );
  };

  // Allow public paths without any checks
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check site-wide password protection first
  const siteSession = request.cookies.get("site_session");
  if (!siteSession) {
    // Store the original URL to redirect back after authentication
    const from = encodeURIComponent(pathname);
    return NextResponse.redirect(
      new URL(`/enter-password?from=${from}`, request.url)
    );
  }

  // If we're trying to access admin routes, check admin authentication
  if (pathname.startsWith("/admin")) {
    // Special case: allow access to admin login page
    if (pathname === "/admin/login") {
      // If already logged in as admin, redirect to dashboard
      const adminSession = request.cookies.get("admin_session");
      if (adminSession) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      return NextResponse.next();
    }

    // Check for admin session on all other admin routes
    const adminSession = request.cookies.get("admin_session");
    if (!adminSession) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Allow the request if all checks pass
  return NextResponse.next();
}

// Update the config to match all routes except static files
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. Matches any request that starts with /_next/static
     * 2. Matches any request that starts with /_next/image
     * 3. Matches any request that contains a file extension (e.g. .png, .jpg, .json)
     */
    "/((?!_next/static|_next/image|.*\\..*).*)",
    // Include /api routes
    "/api/(.*)"
  ]
};
