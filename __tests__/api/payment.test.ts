// __tests__/api/payment.test.ts
import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { POST } from "@/app/api/stripe/payment-intent/route";
import { GET } from "@/app/api/payment-verify/route";

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      body: data,
      options,
      json: async () => data,
      status: options?.status || 200
    }))
  },
  headers: jest.fn(() => new Map())
}));

// Mock Stripe
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        client_secret: "pi_test_secret",
        id: "pi_test"
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: "pi_test",
        status: "succeeded",
        amount: 19999
      })
    }
  }));
});

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

describe("Payment API Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/stripe/payment-intent", () => {
    it("creates a payment intent", async () => {
      // Create test request
      const req = new Request(
        "http://localhost:3000/api/stripe/payment-intent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            items: [
              {
                product_id: 1,
                quantity: 1,
                price: 199.99,
                name: "Bone+ Headphone"
              }
            ]
          })
        }
      );

      const response = await POST(req);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.clientSecret).toBe("pi_test_secret");

      // Verify Stripe was called with correct amount (converted to cents)
      const Stripe = require("stripe");
      const stripeInstance = Stripe();
      expect(stripeInstance.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 19999, // 199.99 * 100
          currency: "usd"
        })
      );
    });

    it("returns error for empty cart", async () => {
      const req = new Request(
        "http://localhost:3000/api/stripe/payment-intent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            items: [] // Empty cart
          })
        }
      );

      const response = await POST(req);

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "No items in cart" });
    });
  });

  describe("GET /api/payment-verify", () => {
    it("verifies payment status", async () => {
      // Mock DB responses
      const mockDb = require("@/db/helpers/db").default;

      // Mock client for transaction
      const mockClient = {
        query: jest.fn().mockImplementation((query, params) => {
          if (query.includes("SELECT o.*, p.payment_status")) {
            return Promise.resolve({
              rows: [
                {
                  order_id: 1,
                  status: "pending",
                  payment_intent_id: "pi_test",
                  payment_status: "pending"
                }
              ]
            });
          } else if (query.includes("order_items")) {
            return Promise.resolve({
              rows: [
                {
                  item_id: 1,
                  product_id: 1,
                  name: "Bone+ Headphone",
                  quantity: 1,
                  price_at_time: 199.99
                }
              ]
            });
          } else {
            return Promise.resolve({ rows: [] });
          }
        }),
        release: jest.fn()
      };
      mockDb.connect.mockResolvedValue(mockClient);

      // Create test request
      const req = new Request(
        "http://localhost:3000/api/payment-verify?payment_intent=pi_test"
      );
      const response = await GET(req);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.order.stripe_status).toBe("succeeded");
    });

    it("returns error for missing payment intent", async () => {
      const req = new Request("http://localhost:3000/api/payment-verify");
      const response = await GET(req);

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "Payment intent ID is required"
      });
    });
  });
});
