// __tests__/api/cart/clear.test.ts
import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { DELETE } from "@/app/api/cart/clear/route";

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      body: data,
      options,
      json: async () => data,
      status: options?.status || 200
    }))
  }
}));

// Mock DB helper
jest.mock("@/db/helpers/db", () => {
  return {
    __esModule: true,
    default: {
      connect: jest.fn().mockImplementation(() => {
        return Promise.resolve({
          query: jest.fn().mockImplementation((query) => {
            if (
              query === "BEGIN" ||
              query === "COMMIT" ||
              query === "ROLLBACK"
            ) {
              return Promise.resolve();
            }
            return Promise.resolve({ rows: [] });
          }),
          release: jest.fn()
        });
      })
    }
  };
});

// Suppress console logs during test
jest.spyOn(console, "error").mockImplementation(() => {});

describe("DELETE /api/cart/clear", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should clear all items from the cart", async () => {
    // Mock the client.query specifically for this test
    const mockQuery = jest.fn().mockImplementation((query) => {
      if (query === "BEGIN" || query === "COMMIT") {
        return Promise.resolve();
      } else if (query.includes("DELETE FROM cart_items")) {
        return Promise.resolve({ rowCount: 3 }); // Simulating deletion of 3 items
      }
      return Promise.resolve({ rows: [] });
    });

    const mockRelease = jest.fn();

    // Override the connect mock for this specific test
    require("@/db/helpers/db").default.connect.mockResolvedValueOnce({
      query: mockQuery,
      release: mockRelease
    });

    // Create test request with session ID
    const req = new Request("http://localhost:3000/api/cart/clear", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sessionId: "test-session-id"
      })
    });

    const response = await DELETE(req);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });

    // Verify database queries were executed correctly
    expect(mockQuery).toHaveBeenCalledWith("BEGIN");
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM cart_items"),
      ["test-session-id"]
    );
    expect(mockQuery).toHaveBeenCalledWith("COMMIT");
    expect(mockRelease).toHaveBeenCalled();
  });

  it("should return 400 error when sessionId is missing", async () => {
    // Create test request without session ID
    const req = new Request("http://localhost:3000/api/cart/clear", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });

    const response = await DELETE(req);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(400);
    expect(data).toEqual({ error: "Session ID is required" });
  });

  it("should handle database errors and roll back transaction", async () => {
    // Mock the client.query specifically for this test
    const mockQuery = jest.fn().mockImplementation((query) => {
      if (query === "BEGIN") {
        return Promise.resolve();
      } else if (query.includes("DELETE FROM cart_items")) {
        throw new Error("Database error");
      } else if (query === "ROLLBACK") {
        return Promise.resolve();
      }
      return Promise.resolve({ rows: [] });
    });

    const mockRelease = jest.fn();

    // Override the connect mock for this specific test
    require("@/db/helpers/db").default.connect.mockResolvedValueOnce({
      query: mockQuery,
      release: mockRelease
    });

    // Create test request
    const req = new Request("http://localhost:3000/api/cart/clear", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sessionId: "test-session-id"
      })
    });

    const response = await DELETE(req);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Database error" });

    // Verify transaction was rolled back
    expect(mockQuery).toHaveBeenCalledWith("BEGIN");
    expect(mockQuery).toHaveBeenCalledWith("ROLLBACK");
    expect(mockRelease).toHaveBeenCalled();
  });
});
