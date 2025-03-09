// __tests__/setup.ts
import "@testing-library/jest-dom";

// Mock fetch
global.fetch = jest.fn();

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: "/",
    query: {}
  })
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams()
}));

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// Mock NextRequest for API route testing
class MockNextRequest {
  url: string;
  method: string;
  body: any;
  headers: Headers;
  nextUrl: URL;

  constructor(url: string, options: any = {}) {
    this.url = url;
    this.method = options.method || "GET";
    this.body = options.body;
    this.headers = new Headers(options.headers || {});
    this.nextUrl = new URL(url);
  }

  json() {
    return Promise.resolve(JSON.parse(this.body));
  }
}

global.NextRequest = MockNextRequest;

// Mock cookies functions for Next.js API routes
jest.mock("next/headers", () => ({
  cookies: () => ({
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn()
  })
}));
