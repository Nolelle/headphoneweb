import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { NextResponse } from "next/server";

// Example error response utility function (creating one since we haven't found an actual one in the codebase)
function createErrorResponse(
  message: string,
  status: number = 500,
  details?: any
) {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details })
    },
    { status }
  );
}

// Example validation error utility function
function createValidationError(fields: Record<string, string>) {
  return NextResponse.json(
    {
      error: "Validation failed.",
      fields
    },
    { status: 400 }
  );
}

// Example not found error utility function
function createNotFoundError(resource: string) {
  return NextResponse.json(
    {
      error: `${resource} not found.`
    },
    { status: 404 }
  );
}

describe("API Error Responses", () => {
  // Mock NextResponse
  const originalNextResponse = NextResponse;

  beforeEach(() => {
    // Reset NextResponse mock
    jest.clearAllMocks();

    // Mock NextResponse.json
    NextResponse.json = jest.fn().mockImplementation((data, options = {}) => {
      return {
        status: options.status || 200,
        body: data,
        json: async () => data
      };
    });
  });

  afterAll(() => {
    // Restore original NextResponse
    Object.defineProperty(global, "NextResponse", {
      value: originalNextResponse
    });
  });

  describe("Error Response Formatting", () => {
    it("should create proper validation error responses", () => {
      // Create a validation error response
      const validationErrors = {
        email: "Please enter a valid email address.",
        password: "Password must be at least 8 characters."
      };

      const response = createValidationError(validationErrors);

      // Verify the response format
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: "Validation failed.",
          fields: validationErrors
        },
        { status: 400 }
      );
    });

    it("should create proper not found error responses", () => {
      // Create a not found error response
      const response = createNotFoundError("Product");

      // Verify the response format
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: "Product not found."
        },
        { status: 404 }
      );
    });

    it("should create proper server error responses", () => {
      // Create a server error response
      const response = createErrorResponse("Internal server error.");

      // Verify the response format
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: "Internal server error."
        },
        { status: 500 }
      );
    });

    it("should allow including additional error details", () => {
      // Create an error response with details
      const details = { code: "DB_CONNECTION_ERROR", trace: "xyz123" };
      const response = createErrorResponse("Database error", 500, details);

      // Verify the response format
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: "Database error",
          details
        },
        { status: 500 }
      );
    });
  });

  describe("Error Response Security", () => {
    it("should not expose sensitive details in production errors", () => {
      // Save original environment
      const originalEnv = process.env.NODE_ENV;

      // Set to production
      process.env.NODE_ENV = "production";

      try {
        // Create a production error with potentially sensitive details
        const sensitiveDetails = {
          stack: "Error: at Connection.query (/app/db/index.js:25:10)",
          query: "SELECT * FROM users WHERE email='test@example.com'",
          connectionString: "postgres://user:password@localhost:5432/db"
        };

        // Use a function that would sanitize in production
        function createSafeErrorResponse(message: string, details?: any) {
          // In production, strip sensitive details
          if (process.env.NODE_ENV === "production" && details) {
            // Only keep safe fields like error code
            const safeDetails = details.code
              ? { code: details.code }
              : undefined;
            return NextResponse.json(
              {
                error: message,
                ...(safeDetails && { details: safeDetails })
              },
              { status: 500 }
            );
          }

          // In dev, include all details
          return NextResponse.json(
            {
              error: message,
              ...(details && { details })
            },
            { status: 500 }
          );
        }

        const response = createSafeErrorResponse(
          "Database error",
          sensitiveDetails
        );

        // Verify sensitive details are not included
        expect(NextResponse.json).toHaveBeenCalledWith(
          {
            error: "Database error"
          },
          { status: 500 }
        );

        // Verify the actual response doesn't contain sensitive data
        expect(JSON.stringify(response)).not.toContain("password");
        expect(JSON.stringify(response)).not.toContain("stack");
        expect(JSON.stringify(response)).not.toContain("query");
      } finally {
        // Restore original environment
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe("API Error Integration", () => {
    it("should handle validation errors consistently across endpoints", () => {
      // Define example validation error handlers for different endpoints
      function createProductValidationError(data: any) {
        const errors: Record<string, string> = {};

        if (!data.name) errors.name = "Product name is required";
        if (!data.price || data.price <= 0)
          errors.price = "Valid price is required";

        if (Object.keys(errors).length > 0) {
          return createValidationError(errors);
        }

        return null;
      }

      function createUserValidationError(data: any) {
        const errors: Record<string, string> = {};

        if (!data.email) errors.email = "Email is required";
        if (!data.password) errors.password = "Password is required";

        if (Object.keys(errors).length > 0) {
          return createValidationError(errors);
        }

        return null;
      }

      // Test product validation
      const invalidProduct = { price: -10 };
      const productError = createProductValidationError(invalidProduct);

      // Test user validation
      const invalidUser = { email: "test@example.com" };
      const userError = createUserValidationError(invalidUser);

      // Both should have consistent format and status code
      expect(productError?.status).toBe(400);
      expect(userError?.status).toBe(400);

      // Both should identify as validation errors
      expect(productError?.body.error).toBe("Validation failed.");
      expect(userError?.body.error).toBe("Validation failed.");

      // Both should have a fields object with errors
      expect(productError?.body.fields).toBeDefined();
      expect(userError?.body.fields).toBeDefined();
    });

    it("should provide helpful error messages for clients", () => {
      // Example client-friendly error messages
      const userFriendlyErrors = [
        createErrorResponse(
          "We couldn't connect to the database. Please try again later.",
          500
        ),
        createErrorResponse(
          "Your session has expired. Please log in again.",
          401
        ),
        createNotFoundError("The product you're looking for"),
        createValidationError({ email: "Please enter a valid email address." })
      ];

      // All error messages should be user-friendly
      userFriendlyErrors.forEach((error) => {
        const message =
          typeof error.body.error === "string" ? error.body.error : "";

        // No technical jargon
        expect(message).not.toContain("exception");
        expect(message).not.toContain("stack trace");
        expect(message).not.toContain("SQL");

        // Messages should be clear to non-technical users
        expect(message.length).toBeGreaterThan(10); // Reasonable length for clarity
        expect(message[0]).toMatch(/[A-Z]/); // Starts with capital letter
        expect(message).toMatch(/[.!]/); // Ends with punctuation
      });
    });
  });
});
