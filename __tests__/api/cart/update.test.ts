// __tests__/api/cart/update.test.ts
import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { PUT } from "@/app/api/cart/update/route";

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

// Mock Response constructor
global.Response = jest.fn().mockImplementation((data, init) => ({
  status: init?.status || 200,
  json: jest.fn().mockResolvedValue(JSON.parse(data)),
  ok: true
})) as unknown as typeof Response;

// Suppress console logs during test
jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

describe("PUT /api/cart/update", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update cart item quantity and return updated cart", async () => {
    // Mock item data
    const mockCartItem = {
      cart_item_id: 1,
      product_id: 1,
      name: "Test Headphone",
      price: 199.99,
      quantity: 2, // Updated quantity
      stock_quantity: 10,
      image_url: "/test-image.png"
    };

    // Setup mock query implementation for success case
    mockClient.query.mockImplementation((query: string) => {
      if (query === "BEGIN" || query === "COMMIT") {
        return Promise.resolve();
      } else if (query.includes("SELECT ci.cart_item_id")) {
        // Return a result indicating the cart item exists
        return Promise.resolve({ rows: [{ cart_item_id: 1 }] });
      } else if (query.includes("UPDATE cart_items")) {
        // Mock update operation
        return Promise.resolve({ rowCount: 1 });
      } else if (
        query.includes("SELECT") &&
        query.includes("FROM cart_items")
      ) {
        // Mock cart items after update - THIS IS THE KEY FIX
        return Promise.resolve({
          rows: [mockCartItem]
        });
      }
      return Promise.resolve({ rows: [] });
    });

    // Create test request with valid data
    const req = new Request("http://localhost:3000/api/cart/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sessionId: "test-session-id",
        cartItemId: 1,
        quantity: 2
      })
    });

    // Override the Response constructor for this test
    global.Response = jest.fn().mockImplementation((data, init) => ({
      status: init?.status || 200,
      json: jest.fn().mockResolvedValue({ items: [mockCartItem] }),
      ok: true
    })) as unknown as typeof Response;

    const response = await PUT(req);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].quantity).toBe(2);
    expect(data.items[0].name).toBe("Test Headphone");

    // Verify transaction flow
    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE cart_items"),
      [2, "test-session-id", 1] // quantity, sessionId, cartItemId
    );
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    expect(mockClient.release).toHaveBeenCalled();
  });

  it("should return 400 when required fields are missing", async () => {
    // Create test request with missing fields
    const req = new Request("http://localhost:3000/api/cart/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sessionId: "test-session-id"
        // Missing cartItemId and quantity
      })
    });

    // Reset Response mock
    global.Response = jest.fn().mockImplementation((data, init) => ({
      status: init?.status || 200,
      json: jest.fn().mockResolvedValue(JSON.parse(data)),
      ok: true
    })) as unknown as typeof Response;

    const response = await PUT(req);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing required fields");
    expect(data.items).toEqual([]);

    // Verify database was not accessed
    expect(mockClient.query).not.toHaveBeenCalled();
  });

  it("should return 404 when cart item does not exist", async () => {
    // Setup mock to return empty result (cart item not found)
    mockClient.query.mockImplementation((query: string) => {
      if (query === "BEGIN") {
        return Promise.resolve();
      } else if (query.includes("SELECT ci.cart_item_id")) {
        // Return empty result (cart item not found)
        return Promise.resolve({ rows: [] });
      } else if (query === "ROLLBACK") {
        return Promise.resolve();
      }
      return Promise.resolve({ rows: [] });
    });

    // Create test request for non-existent cart item
    const req = new Request("http://localhost:3000/api/cart/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sessionId: "test-session-id",
        cartItemId: 999, // Non-existent ID
        quantity: 2
      })
    });

    const response = await PUT(req);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(404);
    expect(data.error).toBe("Cart item not found or doesn't belong to session");

    // Verify transaction was rolled back
    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.release).toHaveBeenCalled();
  });

  it("should handle database errors and roll back transaction", async () => {
    // Setup mock to throw error during update
    mockClient.query.mockImplementation((query: string) => {
      if (query === "BEGIN") {
        return Promise.resolve();
      } else if (query.includes("SELECT ci.cart_item_id")) {
        // Return a result indicating the cart item exists
        return Promise.resolve({ rows: [{ cart_item_id: 1 }] });
      } else if (query.includes("UPDATE cart_items")) {
        // Simulate database error
        throw new Error("Database error");
      } else if (query === "ROLLBACK") {
        return Promise.resolve();
      }
      return Promise.resolve({ rows: [] });
    });

    // Create test request
    const req = new Request("http://localhost:3000/api/cart/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sessionId: "test-session-id",
        cartItemId: 1,
        quantity: 2
      })
    });

    const response = await PUT(req);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(500);
    expect(data.error).toBe("Database error");
    expect(data.details).toBe("Failed to update cart item");
    expect(data.items).toEqual([]);

    // Verify transaction was rolled back
    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.release).toHaveBeenCalled();
  });
});
