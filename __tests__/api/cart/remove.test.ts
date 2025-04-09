import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { DELETE } from "@/app/api/cart/remove/route";
import pool from "@/db/helpers/db";

// Mock database client and pool
const mockClient = {
  query: jest.fn(),
  release: jest.fn()
};

// Mock DB helper
jest.mock("@/db/helpers/db", () => {
  return {
    __esModule: true,
    default: {
      connect: jest.fn().mockImplementation(() => {
        return Promise.resolve(mockClient);
      })
    }
  };
});

// Mock URL for search params
global.URL = jest.fn().mockImplementation((url) => {
  return {
    url,
    searchParams: {
      get: (param) => {
        const params = new URLSearchParams(url.split("?")[1]);
        return params.get(param);
      }
    }
  };
});

// Mock Response constructor
global.Response = jest.fn().mockImplementation((data, init) => ({
  status: init?.status || 200,
  json: jest.fn().mockResolvedValue(JSON.parse(data)),
  ok: true
})) as unknown as typeof Response;

// Suppress console logs during test
jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

describe("DELETE /api/cart/remove", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should remove an item from the cart and return updated cart", async () => {
    // Mock data
    const mockCartItem = {
      cart_item_id: 1,
      product_id: 1,
      name: "Test Headphone",
      price: 199.99,
      quantity: 1,
      stock_quantity: 10,
      image_url: "/test-image.png"
    };

    // Setup mock query implementation for success case
    mockClient.query.mockImplementation((query, params) => {
      if (query === "BEGIN" || query === "COMMIT") {
        return Promise.resolve();
      } else if (query.includes("SELECT 1 FROM cart_items")) {
        // Return a result indicating the cart item exists and belongs to session
        return Promise.resolve({ rowCount: 1 });
      } else if (query.includes("DELETE FROM cart_items")) {
        // Mock delete operation
        return Promise.resolve({ rowCount: 1 });
      } else if (
        query.includes("FROM cart_items ci") &&
        query.includes("JOIN headphones")
      ) {
        // Mock updated cart items after deletion - this would be other items in cart
        return Promise.resolve({
          rows: [mockCartItem],
          rowCount: 1
        });
      }
      return Promise.resolve({ rows: [] });
    });

    // Create test request
    const req = new Request(
      "http://localhost:3000/api/cart/remove?sessionId=test-session-id&cartItemId=1"
    );

    const response = await DELETE(req);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.items).toBeDefined();
    expect(data.items.length).toBe(1);
    expect(data.items[0].name).toBe("Test Headphone");

    // Verify transaction flow
    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT 1 FROM cart_items"),
      ["test-session-id", "1"]
    );
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    expect(mockClient.release).toHaveBeenCalled();
  });

  it("should return 400 when required parameters are missing", async () => {
    // Create test request with missing parameters
    const req = new Request("http://localhost:3000/api/cart/remove");

    const response = await DELETE(req);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing required parameters");
    expect(data.items).toEqual([]);

    // Verify database was not accessed - we need to check pool.connect instead
    // of mockClient.connect which doesn't exist in our mocks
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it("should return 404 when cart item does not exist or doesn't belong to session", async () => {
    // Setup mock to return empty result (cart item not found)
    mockClient.query.mockImplementation((query, params) => {
      if (query === "BEGIN") {
        return Promise.resolve();
      } else if (query.includes("SELECT 1 FROM cart_items")) {
        // Return empty result (cart item not found)
        return Promise.resolve({ rowCount: 0 });
      } else if (query === "ROLLBACK") {
        return Promise.resolve();
      }
      return Promise.resolve({ rows: [] });
    });

    // Create test request for non-existent cart item
    const req = new Request(
      "http://localhost:3000/api/cart/remove?sessionId=test-session-id&cartItemId=999"
    );

    const response = await DELETE(req);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(404);
    expect(data.error).toBe("Item not found or doesn't belong to session");
    expect(data.items).toEqual([]);

    // Verify transaction was rolled back
    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.release).toHaveBeenCalled();
  });

  it("should handle database errors and roll back transaction", async () => {
    // Setup mock to throw error during query
    mockClient.query.mockImplementation((query, params) => {
      if (query === "BEGIN") {
        return Promise.resolve();
      } else if (query.includes("SELECT 1 FROM cart_items")) {
        // Return a result indicating the cart item exists
        return Promise.resolve({ rowCount: 1 });
      } else if (query.includes("DELETE FROM cart_items")) {
        // Simulate database error
        throw new Error("Database error");
      } else if (query === "ROLLBACK") {
        return Promise.resolve();
      }
      return Promise.resolve({ rows: [] });
    });

    // Create test request
    const req = new Request(
      "http://localhost:3000/api/cart/remove?sessionId=test-session-id&cartItemId=1"
    );

    const response = await DELETE(req);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to remove item from cart");
    expect(data.details).toBeDefined();
    expect(data.items).toEqual([]);

    // Verify transaction was rolled back
    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.release).toHaveBeenCalled();
  });
});
