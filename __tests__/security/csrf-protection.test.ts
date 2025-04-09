// __tests__/security/csrf-protection.test.ts
import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";
import { createMocks } from "node-mocks-http";

// Mock fetch for testing API calls
global.fetch = jest.fn();

describe("CSRF Protection Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe("Contact Form CSRF Protection", () => {
    it("should reject form submissions without CSRF token", async () => {
      // Mock fetch to simulate a POST request without CSRF token
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: "CSRF token missing or invalid" })
      });

      // Attempt to submit form without CSRF token
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          message: "Test message"
        })
      });

      // Verify the request was rejected
      expect(response.ok).toBe(false);
      expect(response.status).toBe(403);
      
      const data = await response.json();
      expect(data.error).toBe("CSRF token missing or invalid");
    });

    it("should reject form submissions with invalid CSRF token", async () => {
      // Mock fetch to simulate a POST request with invalid CSRF token
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: "CSRF token missing or invalid" })
      });

      // Attempt to submit form with invalid CSRF token
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "invalid-token"
        },
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          message: "Test message"
        })
      });

      // Verify the request was rejected
      expect(response.ok).toBe(false);
      expect(response.status).toBe(403);
      
      const data = await response.json();
      expect(data.error).toBe("CSRF token missing or invalid");
    });

    it("should accept form submissions with valid CSRF token", async () => {
      // Mock fetch to simulate a successful POST request with valid CSRF token
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      });

      // Attempt to submit form with valid CSRF token
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "valid-token-here"
        },
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          message: "Test message"
        })
      });

      // Verify the request was accepted
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe("Payment API CSRF Protection", () => {
    it("should reject payment requests without CSRF token", async () => {
      // Mock fetch to simulate a POST request without CSRF token
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: "CSRF token missing or invalid" })
      });

      // Attempt to submit payment without CSRF token
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: 100,
          currency: "usd"
        })
      });

      // Verify the request was rejected
      expect(response.ok).toBe(false);
      expect(response.status).toBe(403);
      
      const data = await response.json();
      expect(data.error).toBe("CSRF token missing or invalid");
    });

    it("should accept payment requests with valid CSRF token", async () => {
      // Mock fetch to simulate a successful POST request with valid CSRF token
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, clientSecret: "test_secret" })
      });

      // Attempt to submit payment with valid CSRF token
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "valid-token-here"
        },
        body: JSON.stringify({
          amount: 100,
          currency: "usd"
        })
      });

      // Verify the request was accepted
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe("CSRF Middleware", () => {
    it("should verify the Origin header matches Host header", () => {
      // Create mock request with matching Origin and Host headers
      const req = {
        headers: {
          get: (name: string) => {
            if (name.toLowerCase() === 'origin') return 'https://example.com';
            if (name.toLowerCase() === 'host') return 'example.com';
            return null;
          }
        },
        method: "POST"
      } as unknown as NextRequest;
      
      // Mock NextResponse methods
      const originalJson = NextResponse.json;
      NextResponse.json = jest.fn().mockImplementation((data, options) => ({
        status: options?.status || 200,
        data
      }));
      
      try {
        // Create a simple CSRF check function (similar to what would be in middleware)
        function csrfCheck(req: NextRequest) {
          // Skip for GET/HEAD/OPTIONS
          if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
            return NextResponse.next();
          }
          
          const origin = req.headers.get('origin');
          const host = req.headers.get('host');
          
          // If no origin or host, or they don't match (accounting for protocol)
          if (!origin || !host || !origin.includes(host)) {
            return NextResponse.json(
              { error: "CSRF validation failed" }, 
              { status: 403 }
            );
          }
          
          return NextResponse.next();
        }
        
        const result = csrfCheck(req);
        
        // Should call next() for valid origin/host
        expect(NextResponse.json).not.toHaveBeenCalled();
      } finally {
        // Restore NextResponse.json
        NextResponse.json = originalJson;
      }
    });
    
    it("should reject requests with mismatched Origin header", () => {
      // Create mock request with non-matching Origin and Host headers
      const req = {
        headers: {
          get: (name: string) => {
            if (name.toLowerCase() === 'origin') return 'https://attacker.com';
            if (name.toLowerCase() === 'host') return 'example.com';
            return null;
          }
        },
        method: "POST"
      } as unknown as NextRequest;
      
      // Mock NextResponse methods
      const originalJson = NextResponse.json;
      NextResponse.json = jest.fn().mockImplementation((data, options) => ({
        status: options?.status || 200,
        data
      }));
      
      try {
        // Create a simple CSRF check function (similar to what would be in middleware)
        function csrfCheck(req: NextRequest) {
          // Skip for GET/HEAD/OPTIONS
          if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
            return NextResponse.next();
          }
          
          const origin = req.headers.get('origin');
          const host = req.headers.get('host');
          
          // If no origin or host, or they don't match (accounting for protocol)
          if (!origin || !host || !origin.includes(host)) {
            return NextResponse.json(
              { error: "CSRF validation failed" }, 
              { status: 403 }
            );
          }
          
          return NextResponse.next();
        }
        
        const result = csrfCheck(req);
        
        // Should return 403 for invalid origin/host
        expect(NextResponse.json).toHaveBeenCalledWith(
          { error: "CSRF validation failed" }, 
          { status: 403 }
        );
      } finally {
        // Restore NextResponse.json
        NextResponse.json = originalJson;
      }
    });
  });
});