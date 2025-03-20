// __tests__/api/auth-middleware.test.ts
import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { middleware } from "@/middleware";
import { NextResponse } from "next/server";

// Import NextRequest type to use for casting
import type { NextRequest } from "next/server";

// Define interfaces for type safety
interface NextRequestCookies {
  get: (name: string) => { name: string; value: string } | undefined;
  set: (name: string, value: string) => void;
  has: (name: string) => boolean;
  getAll: () => Array<{ name: string; value: string }>;
}

// MockNextRequest with proper typing
class MockNextRequest {
  private cookiesMap = new Map<string, string>();
  nextUrl: { pathname: string; href: string };
  url: string;
  cookies: NextRequestCookies;

  constructor(pathname: string) {
    this.nextUrl = {
      pathname,
      href: `http://localhost:3000${pathname}`
    };
    this.url = `http://localhost:3000${pathname}`;

    // Define cookies methods
    this.cookies = {
      get: jest.fn((name: string) => {
        if (this.cookiesMap.has(name)) {
          return { name, value: this.cookiesMap.get(name)! };
        }
        return undefined;
      }),
      set: jest.fn((name: string, value: string) => {
        this.cookiesMap.set(name, value);
      }),
      has: jest.fn((name: string) => this.cookiesMap.has(name)),
      getAll: jest.fn(() => {
        return Array.from(this.cookiesMap.entries()).map(([name, value]) => ({
          name,
          value
        }));
      })
    };
  }
}

// Mock NextResponse
jest.mock("next/server", () => {
  return {
    NextResponse: {
      next: jest.fn(() => ({ type: "next" })),
      redirect: jest.fn((url) => ({ type: "redirect", url })),
      json: jest.fn()
    }
  };
});

describe("Auth Middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Site Password Protection", () => {
    it("allows access to public paths without site password", () => {
      // Test public paths
      const publicPaths = [
        "/enter-password",
        "/api/verify-password",
        "/_next/static/chunks/main.js",
        "/favicon.ico",
        "/api/admin/login"
      ];

      publicPaths.forEach((path) => {
        const request = new MockNextRequest(path);
        // Cast to NextRequest type since we're mocking it anyway
        middleware(request as unknown as NextRequest);
        expect(NextResponse.next).toHaveBeenCalled();
        jest.clearAllMocks();
      });
    });

    it("redirects to enter-password for protected paths without site session", () => {
      const request = new MockNextRequest("/products");
      middleware(request as unknown as NextRequest);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining("/enter-password")
        })
      );
    });

    it("allows access to protected paths with valid site session", () => {
      const request = new MockNextRequest("/products");
      request.cookies.set("site_session", "authenticated");

      middleware(request as unknown as NextRequest);

      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe("Admin Authentication", () => {
    it("redirects to admin login for admin routes without admin session", () => {
      const request = new MockNextRequest("/admin/dashboard");
      request.cookies.set("site_session", "authenticated");

      middleware(request as unknown as NextRequest);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining("/admin/login")
        })
      );
    });

    it("allows access to admin login page with site session", () => {
      const request = new MockNextRequest("/admin/login");
      request.cookies.set("site_session", "authenticated");

      middleware(request as unknown as NextRequest);

      expect(NextResponse.next).toHaveBeenCalled();
    });

    it("redirects from admin login to dashboard if already logged in", () => {
      const request = new MockNextRequest("/admin/login");
      request.cookies.set("site_session", "authenticated");
      request.cookies.set("admin_session", "admin-id");

      middleware(request as unknown as NextRequest);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining("/admin/dashboard")
        })
      );
    });

    it("allows access to admin routes with valid admin session", () => {
      const request = new MockNextRequest("/admin/dashboard");
      request.cookies.set("site_session", "authenticated");
      request.cookies.set("admin_session", "admin-id");

      middleware(request as unknown as NextRequest);

      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe("API Protection", () => {
    it("allows Stripe webhook requests to bypass protection", () => {
      const request = new MockNextRequest("/api/stripe/webhook");

      middleware(request as unknown as NextRequest);

      expect(NextResponse.next).toHaveBeenCalled();
    });

    it("protects API routes with site password", () => {
      const request = new MockNextRequest("/api/products");

      middleware(request as unknown as NextRequest);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining("/enter-password")
        })
      );
    });
  });
});
