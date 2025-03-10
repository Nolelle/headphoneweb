// __tests__/api/cart.test.ts
import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { GET, POST } from "@/app/api/cart/route";
import { PUT } from "@/app/api/cart/update/route";
import { DELETE } from "@/app/api/cart/remove/route";

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
jest.mock("@/db/helpers/db", () => ({
  default: {
    query: jest.fn(),
    connect: jest.fn(() => ({
      query: jest.fn(),
      release: jest.fn(),
      on: jest.fn()
    }))
  }
}));

// Mock URL class for search params
global.URL = jest.fn((url) => ({
  searchParams: new URLSearchParams(url.split("?")[1]),
  toString: () => url
})) as any;

describe("Cart API Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/cart", () => {
    it("fetches cart items", async () => {
      // Mock DB responses
      const mockDb = require("@/db/helpers/db").default;
      mockDb.query.mockImplementation((query, params) => {
        if (query.includes("cart_session")) {
          return Promise.resolve({ rows: [{ session_id: 1 }] });
        } else {
          return Promise.resolve({
            rows: [
              {
                cart_item_id: 1,
                product_id: 1,
                name: "Bone+ Headphone",
                price: 199.99,
                quantity: 1,
                stock_quantity: 10,
                image_url: "/h_1.png"
              }
            ]
          });
        }
      });

      // Create test request
      const req = new Request(
        "http://localhost:3000/api/cart?sessionId=test-session"
      );
      const response = await GET(req);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].name).toBe("Bone+ Headphone");
    });

    it("returns error for missing session ID", async () => {
      const req = new Request("http://localhost:3000/api/cart");
      const response = await GET(req);

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "Session ID is required"
      });
    });
  });

  describe("POST /api/cart", () => {
    it("adds item to cart", async () => {
      // Mock DB responses
      const mockDb = require("@/db/helpers/db").default;
      mockDb.query.mockImplementation((query, params) => {
        if (query.includes("cart_session")) {
          return Promise.resolve({ rows: [{ session_id: 1 }] });
        } else if (query.includes("stock_quantity")) {
          return Promise.resolve({ rows: [{ stock_quantity: 10 }] });
        } else {
          return Promise.resolve({
            rows: [
              {
                cart_item_id: 1,
                product_id: 1,
                name: "Bone+ Headphone",
                price: 199.99,
                quantity: 1,
                stock_quantity: 10,
                image_url: "/h_1.png"
              }
            ]
          });
        }
      });

      // Mock client for transaction
      const mockClient = {
        query: jest.fn().mockImplementation((query, params) => {
          if (query.includes("BEGIN") || query.includes("COMMIT")) {
            return Promise.resolve();
          } else if (query.includes("stock_quantity")) {
            return Promise.resolve({ rows: [{ stock_quantity: 10 }] });
          } else {
            return Promise.resolve({
              rows: [
                {
                  cart_item_id: 1,
                  product_id: 1,
                  name: "Bone+ Headphone",
                  price: 199.99,
                  quantity: 1,
                  stock_quantity: 10,
                  image_url: "/h_1.png"
                }
              ]
            });
          }
        }),
        release: jest.fn()
      };
      mockDb.connect.mockResolvedValue(mockClient);

      // Create test request
      const req = new Request("http://localhost:3000/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionId: "test-session",
          productId: 1,
          quantity: 1
        })
      });

      const response = await POST(req);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].product_id).toBe(1);
    });

    it("returns error for missing required fields", async () => {
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

      const response = await POST(req);

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "Missing required fields"
      });
    });
  });

  // Additional tests for PUT /api/cart/update and DELETE /api/cart/remove would follow a similar pattern
});
