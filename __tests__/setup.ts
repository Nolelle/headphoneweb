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

// Mock database
jest.mock("@/db/helpers/db", () => {
  const mockQuery = jest.fn().mockImplementation(() => {
    return Promise.resolve({ rows: [], rowCount: 0 });
  });

  return {
    __esModule: true,
    default: {
      query: mockQuery,
      connect: jest.fn(),
      end: jest.fn()
    }
  };
});

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
  body: string | null;
  headers: Headers;
  nextUrl: URL;
  cookies: {
    get: (name: string) => { name: string; value: string } | undefined;
    getAll: () => { name: string; value: string }[];
    has: (name: string) => boolean;
    set: (name: string, value: string) => void;
  };

  constructor(
    url: string,
    options: {
      method?: string;
      body?: string;
      headers?: Record<string, string>;
    } = {}
  ) {
    this.url = url;
    this.method = options.method || "GET";
    this.body = options.body || null;
    this.headers = new Headers(options.headers || {});
    this.nextUrl = new URL(url);

    // Initialize cookies
    const cookiesMap = new Map<string, string>();
    this.cookies = {
      get: (name: string) => {
        const value = cookiesMap.get(name);
        return value ? { name, value } : undefined;
      },
      getAll: () => {
        return Array.from(cookiesMap.entries()).map(([name, value]) => ({
          name,
          value
        }));
      },
      has: (name: string) => cookiesMap.has(name),
      set: (name: string, value: string) => cookiesMap.set(name, value)
    };
  }

  json() {
    return this.body
      ? Promise.resolve(JSON.parse(this.body))
      : Promise.resolve({});
  }
}

// Add to global scope with proper typing
(global as any).NextRequest = MockNextRequest;

// Mock cookies functions for Next.js API routes
jest.mock("next/headers", () => ({
  cookies: () => ({
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn()
  })
}));
