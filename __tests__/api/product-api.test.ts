// __tests__/api/product-api.test.ts
import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { POST } from "@/app/api/products/check-stock/route";

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options = {}) => ({
      body: data,
      options,
      json: async () => data,
      status: options.status || 200
    }))
  }
}));

// Mock DB pool
jest.mock("@/db/helpers/db", () => ({
  __esModule: true,
  default: {
    query: jest.fn()
  }
}));

// Define interfaces for better type safety
interface MockPool {
  query: jest.Mock;
}

interface MockNextResponse {
  json: jest.Mock;
}

describe("ProductAPI Data Retrieval", () => {
  // Use type assertions for mocked objects
  const mockPool = jest.requireMock("@/db/helpers/db").default as MockPool;
  const mockNextResponse = jest.requireMock("next/server")
    .NextResponse as MockNextResponse;

  // Spy on console.log and console.error
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterAll(() => {
    // Restore console functions
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  describe("POST /api/products/check-stock", () => {
    it("should return available stock for valid product", async () => {
      // Mock data
      const productId = 1;
      const requestedQuantity = 2;
      const availableQuantity = 10;
      const productName = "Bone+ Headphone";

      // Mock database result
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            name: productName,
            stock_quantity: availableQuantity
          }
        ],
        rowCount: 1
      });

      // Create request
      const req = new Request(
        "http://localhost:3000/api/products/check-stock",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: productId,
            quantity: requestedQuantity
          })
        }
      );

      // Call the handler
      await POST(req);

      // Verify DB query
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT name, stock_quantity"),
        [productId]
      );

      // Verify response
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {
          success: true,
          available: availableQuantity
        },
        expect.objectContaining({
          headers: {
            "Content-Type": "application/json"
          }
        })
      );
    });

    it("should return error for product not found", async () => {
      // Mock database result with no rows
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      // Create request
      const req = new Request(
        "http://localhost:3000/api/products/check-stock",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: 999,
            quantity: 1
          })
        }
      );

      // Call the handler
      await POST(req);

      // Verify response
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: "Product not found" },
        { status: 404 }
      );
    });

    it("should return error for insufficient stock", async () => {
      // Mock data
      const productId = 1;
      const requestedQuantity = 20;
      const availableQuantity = 10;
      const productName = "Bone+ Headphone";

      // Mock database result
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            name: productName,
            stock_quantity: availableQuantity
          }
        ],
        rowCount: 1
      });

      // Create request
      const req = new Request(
        "http://localhost:3000/api/products/check-stock",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: productId,
            quantity: requestedQuantity
          })
        }
      );

      // Call the handler
      await POST(req);

      // Verify response
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {
          error: "Insufficient stock",
          available: availableQuantity,
          requested: requestedQuantity,
          name: productName
        },
        { status: 400 }
      );
    });

    it("should return error for missing product ID", async () => {
      // Create request with missing ID
      const req = new Request(
        "http://localhost:3000/api/products/check-stock",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            quantity: 1
          })
        }
      );

      // Call the handler
      await POST(req);

      // Verify warning was logged
      expect(console.warn).toHaveBeenCalledWith(
        "Missing product ID",
        expect.objectContaining({ body: expect.any(Object) })
      );

      // Verify response
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: "Product ID is required" },
        { status: 400 }
      );
    });

    it("should return error for invalid quantity", async () => {
      // Create request with invalid quantity
      const req = new Request(
        "http://localhost:3000/api/products/check-stock",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: 1,
            quantity: 0
          })
        }
      );

      // Call the handler
      await POST(req);

      // Verify warning was logged
      expect(console.warn).toHaveBeenCalledWith(
        "Invalid quantity",
        expect.objectContaining({ quantity: 0 })
      );

      // Verify response
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: "Invalid quantity" },
        { status: 400 }
      );
    });

    it("should handle JSON parsing errors", async () => {
      // Create request with invalid JSON
      const req = new Request(
        "http://localhost:3000/api/products/check-stock",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: "invalid-json{"
        }
      );

      // Mock request.json to throw error
      jest.spyOn(req, "json").mockRejectedValueOnce(new Error("Invalid JSON"));
      jest.spyOn(req, "text").mockResolvedValueOnce("invalid-json{");

      // Call the handler
      await POST(req);

      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        "JSON Parsing Error:",
        expect.objectContaining({
          rawBody: "invalid-json{",
          parseError: expect.any(Error)
        })
      );

      // Verify response
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {
          error: "Invalid JSON",
          rawBody: "invalid-json{"
        },
        { status: 400 }
      );
    });

    it("should handle database errors", async () => {
      // Mock database query to throw error
      const dbError = new Error("Database connection error");
      mockPool.query.mockRejectedValueOnce(dbError);

      // Create request
      const req = new Request(
        "http://localhost:3000/api/products/check-stock",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: 1,
            quantity: 1
          })
        }
      );

      // Call the handler
      await POST(req);

      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        "Detailed stock check error:",
        expect.objectContaining({
          message: "Database connection error",
          stack: expect.any(String)
        })
      );

      // Verify response
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {
          error: "Failed to check stock",
          details: "Database connection error"
        },
        { status: 500 }
      );
    });
  });
});
