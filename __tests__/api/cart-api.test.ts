// __tests__/api/cart-api.test.ts
import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { GET, POST } from "@/app/api/cart/route";

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
jest.mock("@/db/helpers/db", () => {
  const mockRelease = jest.fn();
  const mockQuery = jest.fn();
  const mockConnect = jest.fn().mockReturnValue({
    query: mockQuery,
    release: mockRelease
  });

  return {
    __esModule: true,
    default: {
      query: jest.fn(),
      connect: mockConnect
    }
  };
});

// Define interfaces for better type safety
interface MockPool {
  query: jest.Mock;
  connect: jest.Mock<{ query: jest.Mock; release: jest.Mock }, []>;
}

interface MockNextResponse {
  json: jest.Mock;
}

describe("CartAPI Integration", () => {
  // Use type assertions for mocked objects
  const mockPool = jest.requireMock("@/db/helpers/db").default as MockPool;
  const mockNextResponse = jest.requireMock("next/server")
    .NextResponse as MockNextResponse;

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  describe("GET /api/cart", () => {
    it("fetches cart items for a given session ID", async () => {
      // Mock data
      const sessionId = "test-session-123";
      const mockCartItems = [
        {
          cart_item_id: 1,
          product_id: 1,
          name: "Bone+ Headphone",
          price: 199.99,
          quantity: 2,
          stock_quantity: 10,
          image_url: "/images/product1.jpg"
        }
      ];

      // Set up mocks
      // First query to get/create session
      mockPool.query.mockResolvedValueOnce({
        rows: [{ session_id: 123 }],
        rowCount: 1
      });

      // Second query to get cart items
      mockPool.query.mockResolvedValueOnce({
        rows: mockCartItems,
        rowCount: 1
      });

      // Create request with session ID
      const url = `http://localhost:3000/api/cart?sessionId=${sessionId}`;
      const req = new Request(url);

      // Call the handler
      await GET(req);

      // Verify session query
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO cart_session"),
        [sessionId]
      );

      // Verify items query
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        [123]
      );

      // Verify response
      expect(mockNextResponse.json).toHaveBeenCalledWith({
        items: mockCartItems
      });
    });

    it("returns error for missing session ID", async () => {
      // Create request without session ID
      const req = new Request("http://localhost:3000/api/cart");

      // Call the handler
      await GET(req);

      // Verify error response
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: "Session ID is required" },
        { status: 400 }
      );
    });

    it("handles database errors", async () => {
      // Mock query to throw error
      mockPool.query.mockRejectedValueOnce(new Error("Database error"));

      // Create request with session ID
      const req = new Request(
        "http://localhost:3000/api/cart?sessionId=test-session"
      );

      // Call the handler
      await GET(req);

      // Verify error response
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: "Failed to fetch cart" },
        { status: 500 }
      );
    });
  });

  describe("POST /api/cart", () => {
    it("adds item to cart and returns updated cart", async () => {
      // Mock data
      const sessionId = "test-session-123";
      const productId = 1;
      const quantity = 2;
      const mockCartItems = [
        {
          cart_item_id: 1,
          product_id: 1,
          name: "Bone+ Headphone",
          price: 199.99,
          quantity: 2,
          stock_quantity: 10,
          image_url: "/images/product1.jpg"
        }
      ];

      // Set up client mocks
      const clientMock = mockPool.connect();

      // Mock BEGIN transaction
      clientMock.query.mockResolvedValueOnce({});

      // Mock session query
      clientMock.query.mockResolvedValueOnce({
        rows: [{ session_id: 123 }],
        rowCount: 1
      });

      // Mock stock check query
      clientMock.query.mockResolvedValueOnce({
        rows: [{ stock_quantity: 10 }],
        rowCount: 1
      });

      // Mock insert/update cart item query
      clientMock.query.mockResolvedValueOnce({});

      // Mock query to get updated cart
      clientMock.query.mockResolvedValueOnce({
        rows: mockCartItems,
        rowCount: 1
      });

      // Mock COMMIT transaction
      clientMock.query.mockResolvedValueOnce({});

      // Create request with cart data
      const req = new Request("http://localhost:3000/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionId,
          productId,
          quantity
        })
      });

      // Call the handler
      await POST(req);

      // Verify transaction started
      expect(clientMock.query).toHaveBeenCalledWith("BEGIN");

      // Verify session query
      expect(clientMock.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO cart_session"),
        [sessionId]
      );

      // Verify stock check
      expect(clientMock.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT stock_quantity"),
        [productId]
      );

      // Verify item insert/update
      expect(clientMock.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO cart_items"),
        [123, productId, quantity]
      );

      // Verify updated cart query
      expect(clientMock.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        [123]
      );

      // Verify transaction committed
      expect(clientMock.query).toHaveBeenCalledWith("COMMIT");

      // Verify client released
      expect(clientMock.release).toHaveBeenCalled();

      // Verify response
      expect(mockNextResponse.json).toHaveBeenCalledWith({
        items: mockCartItems
      });
    });

    it("returns error for missing required fields", async () => {
      // Create request with missing data
      const req = new Request("http://localhost:3000/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionId: "test-session"
          // Missing productId and quantity
        })
      });

      // Call the handler
      await POST(req);

      // Verify error response
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: "Missing required fields" },
        { status: 400 }
      );
    });

    it("handles insufficient stock", async () => {
      // Mock data
      const sessionId = "test-session-123";
      const productId = 1;
      const quantity = 20; // More than available stock

      // Set up client mocks
      const clientMock = mockPool.connect();

      // Mock BEGIN transaction
      clientMock.query.mockResolvedValueOnce({});

      // Mock session query
      clientMock.query.mockResolvedValueOnce({
        rows: [{ session_id: 123 }],
        rowCount: 1
      });

      // Mock stock check query with low stock
      clientMock.query.mockResolvedValueOnce({
        rows: [{ stock_quantity: 10 }], // Only 10 in stock
        rowCount: 1
      });

      // Mock ROLLBACK transaction
      clientMock.query.mockResolvedValueOnce({});

      // Create request with cart data
      const req = new Request("http://localhost:3000/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionId,
          productId,
          quantity
        })
      });

      // Call the handler
      await POST(req);

      // Verify transaction rolled back
      expect(clientMock.query).toHaveBeenCalledWith("ROLLBACK");

      // Verify client released
      expect(clientMock.release).toHaveBeenCalled();

      // Verify error response
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: "Insufficient stock" },
        { status: 500 }
      );
    });

    it("handles product not found", async () => {
      // Mock data
      const sessionId = "test-session-123";
      const productId = 999; // Non-existent product
      const quantity = 1;

      // Set up client mocks
      const clientMock = mockPool.connect();

      // Mock BEGIN transaction
      clientMock.query.mockResolvedValueOnce({});

      // Mock session query
      clientMock.query.mockResolvedValueOnce({
        rows: [{ session_id: 123 }],
        rowCount: 1
      });

      // Mock stock check query with no results
      clientMock.query.mockResolvedValueOnce({
        rows: [], // No product found
        rowCount: 0
      });

      // Mock ROLLBACK transaction
      clientMock.query.mockResolvedValueOnce({});

      // Create request with cart data
      const req = new Request("http://localhost:3000/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionId,
          productId,
          quantity
        })
      });

      // Call the handler
      await POST(req);

      // Verify transaction rolled back
      expect(clientMock.query).toHaveBeenCalledWith("ROLLBACK");

      // Verify client released
      expect(clientMock.release).toHaveBeenCalled();

      // Verify error response
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: "Product not found" },
        { status: 500 }
      );
    });

    // Additional test for cart update functionality
    it("correctly updates quantity for existing cart items", async () => {
      // Mock data
      const sessionId = "test-session-123";
      const productId = 1;
      const quantity = 3; // Updated quantity
      const mockCartItems = [
        {
          cart_item_id: 1,
          product_id: 1,
          name: "Bone+ Headphone",
          price: 199.99,
          quantity: 3, // Quantity updated to 3
          stock_quantity: 10,
          image_url: "/images/product1.jpg"
        }
      ];

      // Set up client mocks
      const clientMock = mockPool.connect();

      // Mock BEGIN transaction
      clientMock.query.mockResolvedValueOnce({});

      // Mock session query
      clientMock.query.mockResolvedValueOnce({
        rows: [{ session_id: 123 }],
        rowCount: 1
      });

      // Mock stock check query
      clientMock.query.mockResolvedValueOnce({
        rows: [{ stock_quantity: 10 }],
        rowCount: 1
      });

      // Mock insert/update cart item query - should be called with upsert
      clientMock.query.mockResolvedValueOnce({});

      // Mock query to get updated cart
      clientMock.query.mockResolvedValueOnce({
        rows: mockCartItems,
        rowCount: 1
      });

      // Mock COMMIT transaction
      clientMock.query.mockResolvedValueOnce({});

      // Create request with cart data
      const req = new Request("http://localhost:3000/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionId,
          productId,
          quantity
        })
      });

      // Call the handler
      await POST(req);

      // Verify transaction started
      expect(clientMock.query).toHaveBeenCalledWith("BEGIN");

      // Verify item insert/update with ON CONFLICT clause
      expect(clientMock.query).toHaveBeenCalledWith(
        expect.stringContaining("ON CONFLICT"),
        [123, productId, quantity]
      );

      // Verify response shows updated quantity
      expect(mockNextResponse.json).toHaveBeenCalledWith({
        items: expect.arrayContaining([
          expect.objectContaining({
            quantity: 3
          })
        ])
      });
    });
  });
});
