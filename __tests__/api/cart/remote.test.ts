import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { DELETE } from "@/app/api/cart/remote/route";
import pool from "@/db/helpers/db";

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      status: options?.status || 200,
      json: jest.fn().mockResolvedValue(data),
      data
    }))
  }
}));

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

// Suppress console logs during test
jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

describe("DELETE /api/cart/remote", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should remove an item from the cart and return updated cart", async () => {
    // Mock cart items
    const mockCartItems = [
      {
        cart_item_id: 1,
        product_id: 1,
        name: "Test Headphone",
        price: 199.99,
        quantity: 1,
        stock_quantity: 10,
        image_url: "/test-image.png"
      }
    ];

    // Set up mock implementation for successful deletion
    mockClient.query.mockImplementation((query) => {
      if (query === "BEGIN" || query === "COMMIT") {
        return Promise.resolve();
      } else if (query.includes("DELETE FROM cart_items")) {
        // Return a result indicating the item was deleted
        return Promise.resolve({ rows: [{ cart_item_id: 1 }] });
      } else if (
        query.includes("FROM cart_items ci") &&
        query.includes("JOIN headphones")
      ) {
        // Return updated cart items
        return Promise.resolve({ rows: mockCartItems });
      }
      return Promise.resolve({ rows: [] });
    });

    // Create test request
    const req = {
      json: jest.fn().mockResolvedValue({
        sessionId: "test-session-id",
        cartItemId: 1
      })
    } as unknown as Request;

    const response = await DELETE(req);

    // Assertions
    expect(response.status).toBe(200);
    expect(response.data).toEqual(mockCartItems);

    // Verify transaction and queries
    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM cart_items"),
      ["test-session-id", 1]
    );
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    expect(mockClient.release).toHaveBeenCalled();
  });

  it("should return 400 when required fields are missing", async () => {
    // Create request with missing fields
    const req = {
      json: jest.fn().mockResolvedValue({
        // Missing cartItemId
        sessionId: "test-session-id"
      })
    } as unknown as Request;

    const response = await DELETE(req);

    // Assertions
    expect(response.status).toBe(400);
    expect(response.data.error).toBe("Missing required fields");

    // Verify DB was not accessed
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it("should return error when cart item is not found", async () => {
    // Set up mock for item not found
    mockClient.query.mockImplementation((query) => {
      if (query === "BEGIN" || query === "ROLLBACK") {
        return Promise.resolve();
      } else if (query.includes("DELETE FROM cart_items")) {
        // Return empty result - no items deleted
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [] });
    });

    // Create test request
    const req = {
      json: jest.fn().mockResolvedValue({
        sessionId: "test-session-id",
        cartItemId: 999 // Non-existent item
      })
    } as unknown as Request;

    const response = await DELETE(req);

    // Assertions
    expect(response.status).toBe(500); // Note: The impl returns 500 for this case
    expect(response.data.error).toBe(
      "Cart item not found or doesn't belong to session"
    );

    // Verify transaction was rolled back
    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.release).toHaveBeenCalled();
  });

  it("should handle database errors", async () => {
    // Set up mock to throw error during deletion
    mockClient.query.mockImplementation((query) => {
      if (query === "BEGIN") {
        return Promise.resolve();
      } else if (query.includes("DELETE FROM cart_items")) {
        throw new Error("Database error");
      } else if (query === "ROLLBACK") {
        return Promise.resolve();
      }
      return Promise.resolve({ rows: [] });
    });

    // Create test request
    const req = {
      json: jest.fn().mockResolvedValue({
        sessionId: "test-session-id",
        cartItemId: 1
      })
    } as unknown as Request;

    const response = await DELETE(req);

    // Assertions
    expect(response.status).toBe(500);
    expect(response.data.error).toBe("Database error");

    // Verify transaction was rolled back
    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.release).toHaveBeenCalled();
  });
});
