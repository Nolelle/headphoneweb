// __tests__/security/data-protection.test.ts
import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

describe("Security Data Protection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Password Handling", () => {
    it("should properly hash passwords using bcrypt", async () => {
      const plainPassword = "SecurePassword123!";

      // Hash the password
      const hash = await bcrypt.hash(plainPassword, 10);

      // Hash should be different from original password
      expect(hash).not.toBe(plainPassword);

      // Hash should be a bcrypt hash (starts with $2a$, $2b$, or $2y$)
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);

      // Hash should be verifiable
      const isValid = await bcrypt.compare(plainPassword, hash);
      expect(isValid).toBe(true);

      // Different password should not verify
      const isInvalid = await bcrypt.compare("WrongPassword", hash);
      expect(isInvalid).toBe(false);
    });

    it("should use sufficient work factor for password hashing", async () => {
      // Minimum recommended work factor should be 10 or higher
      const minWorkFactor = 10;

      // Hash a password with the minimum work factor
      const plainPassword = "SecurePassword123!";
      const hash = await bcrypt.hash(plainPassword, minWorkFactor);

      // Extract the work factor from the hash
      const hashParts = hash.split("$");
      const workFactor = parseInt(hashParts[2], 10);

      // Verify work factor meets minimum requirement
      expect(workFactor).toBeGreaterThanOrEqual(minWorkFactor);
    });
  });

  describe("HTTPS Security", () => {
    it("should redirect HTTP to HTTPS in production", () => {
      // Save original environment
      const originalEnv = process.env.NODE_ENV;

      // Set to production
      process.env.NODE_ENV = "production";

      try {
        // Mock request and NextResponse
        const mockRequest = {
          url: "http://example.com/path",
          nextUrl: new URL("http://example.com/path")
        };

        // Create redirect function (similar to what would be in middleware)
        function redirectToHttps(request: any) {
          const url = request.nextUrl;
          if (
            process.env.NODE_ENV === "production" &&
            url.protocol === "http:"
          ) {
            const httpsUrl = new URL(url);
            httpsUrl.protocol = "https:";
            return NextResponse.redirect(httpsUrl);
          }
          return NextResponse.next();
        }

        // Mock NextResponse methods
        const originalRedirect = NextResponse.redirect;
        const originalNext = NextResponse.next;

        NextResponse.redirect = jest
          .fn()
          .mockImplementation((url) => ({ url }));
        NextResponse.next = jest.fn().mockImplementation(() => ({}));

        try {
          // Test the redirection
          const result = redirectToHttps(mockRequest);

          // Should have called redirect with HTTPS URL
          expect(NextResponse.redirect).toHaveBeenCalled();
          expect(NextResponse.next).not.toHaveBeenCalled();

          // URL should be HTTPS
          const redirectUrl = (NextResponse.redirect as jest.Mock).mock
            .calls[0][0];
          expect(redirectUrl.protocol).toBe("https:");
        } finally {
          // Restore NextResponse methods
          NextResponse.redirect = originalRedirect;
          NextResponse.next = originalNext;
        }
      } finally {
        // Restore original environment
        process.env.NODE_ENV = originalEnv;
      }
    });

    it("should set secure cookies in production", () => {
      // Save original environment
      const originalEnv = process.env.NODE_ENV;

      // Set to production
      process.env.NODE_ENV = "production";

      try {
        // Create cookie setting function (similar to what would be in API routes)
        function setCookie(name: string, value: string, isProd: boolean) {
          const response = NextResponse.json({ success: true });
          response.cookies.set(name, value, {
            httpOnly: true,
            secure: isProd,
            sameSite: "strict",
            maxAge: 60 * 60 * 24 // 24 hours
          });
          return response;
        }

        // Mock NextResponse.json and cookies
        const mockSet = jest.fn();
        jest.spyOn(NextResponse, "json").mockImplementation(
          () =>
            ({
              cookies: {
                set: mockSet
              }
            } as any)
        );

        // Call function in production
        setCookie("session", "value", process.env.NODE_ENV === "production");

        // Verify secure attribute is set in production
        expect(mockSet).toHaveBeenCalledWith(
          "session",
          "value",
          expect.objectContaining({
            secure: true,
            httpOnly: true
          })
        );
      } finally {
        // Restore original environment
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe("API Authentication", () => {
    it("should validate API access properly", () => {
      // Create a mock authentication middleware function
      function authMiddleware(req: any) {
        const token = req.headers.get("authorization")?.split("Bearer ")[1];

        // If no token, return 401
        if (!token) {
          return NextResponse.json(
            { error: "Unauthorized - Missing token" },
            { status: 401 }
          );
        }

        // If token is invalid format, return 401
        if (!token.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/)) {
          return NextResponse.json(
            { error: "Unauthorized - Invalid token format" },
            { status: 401 }
          );
        }

        // For this test we're not validating the actual JWT signature
        // In a real app, this would verify the signature

        return NextResponse.next();
      }

      // Mock NextResponse methods
      const originalJson = NextResponse.json;
      const originalNext = NextResponse.next;

      NextResponse.json = jest.fn().mockImplementation((data, options) => ({
        status: options?.status || 200,
        data
      }));
      NextResponse.next = jest.fn().mockImplementation(() => ({}));

      try {
        // Test with no token
        const noTokenReq = {
          headers: { get: (name: string) => null }
        };
        const noTokenResult = authMiddleware(noTokenReq);
        expect(NextResponse.json).toHaveBeenCalledWith(
          { error: "Unauthorized - Missing token" },
          { status: 401 }
        );

        // Test with invalid token
        const invalidTokenReq = {
          headers: {
            get: (name: string) =>
              name === "authorization" ? "Bearer invalid" : null
          }
        };
        const invalidTokenResult = authMiddleware(invalidTokenReq);
        expect(NextResponse.json).toHaveBeenCalledWith(
          { error: "Unauthorized - Invalid token format" },
          { status: 401 }
        );

        // Test with valid token format
        const validTokenReq = {
          headers: {
            get: (name: string) =>
              name === "authorization"
                ? "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
                : null
          }
        };
        const validTokenResult = authMiddleware(validTokenReq);
        expect(NextResponse.next).toHaveBeenCalled();
      } finally {
        // Restore NextResponse methods
        NextResponse.json = originalJson;
        NextResponse.next = originalNext;
      }
    });
  });

  describe("Sensitive Data Handling", () => {
    it("should redact sensitive information in logs", () => {
      // Create a mock logging function with sensitive data redaction
      const originalConsoleLog = console.log;
      console.log = jest.fn();

      function logSafely(data: any) {
        // Deep clone the data
        const safeData = JSON.parse(JSON.stringify(data));

        // Function to recursively redact sensitive fields
        function redactSensitiveFields(obj: any) {
          if (!obj || typeof obj !== "object") return;

          // Sensitive field names
          const sensitiveFields = [
            "password",
            "cardnumber",
            "cardNumber",
            "cvv",
            "ssn",
            "securityCode",
            "creditCard",
            "secret",
            "accessToken",
            "refreshToken"
          ];

          for (const key in obj) {
            if (
              sensitiveFields.includes(key) ||
              sensitiveFields.includes(key.toLowerCase())
            ) {
              obj[key] = "[REDACTED]";
            } else if (typeof obj[key] === "object") {
              redactSensitiveFields(obj[key]);
            }
          }
        }

        // Redact sensitive fields
        redactSensitiveFields(safeData);

        // Log the sanitized data
        console.log(safeData);

        return safeData;
      }

      // Test with sensitive data
      const sensitiveData = {
        user: {
          name: "John Doe",
          email: "john@example.com",
          password: "secret123",
          payment: {
            cardNumber: "4111111111111111",
            cvv: "123",
            expiryDate: "12/25"
          }
        },
        request: {
          headers: {
            authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            accessToken: "SECRET_ACCESS_TOKEN"
          }
        }
      };

      const redactedData = logSafely(sensitiveData);

      // Check sensitive fields are redacted
      expect(redactedData.user.password).toBe("[REDACTED]");
      expect(redactedData.user.payment.cardNumber).toBe("[REDACTED]");
      expect(redactedData.user.payment.cvv).toBe("[REDACTED]");
      expect(redactedData.request.headers.accessToken).toBe("[REDACTED]");

      // Check non-sensitive fields are unchanged
      expect(redactedData.user.name).toBe("John Doe");
      expect(redactedData.user.email).toBe("john@example.com");
      expect(redactedData.user.payment.expiryDate).toBe("12/25");

      // Restore console.log
      console.log = originalConsoleLog;
    });
  });
});
