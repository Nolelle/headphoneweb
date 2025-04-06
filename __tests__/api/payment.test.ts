// __tests__/api/payment.test.ts
import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { POST } from "@/app/api/stripe/payment-intent/route";
import { GET } from "@/app/api/payment-verify/route";

// Suppress console logs during test
jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

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

// Mock URL class for search params
global.URL = jest.fn((url) => ({
  searchParams: new URLSearchParams(url.split("?")[1] || ""),
  toString: () => url
})) as any;

// Mock Stripe
jest.mock("stripe", () => {
  const paymentIntentsCreate = jest.fn().mockResolvedValue({
    client_secret: "pi_test_secret",
    id: "pi_test"
  });

  const paymentIntentsRetrieve = jest.fn().mockResolvedValue({
    id: "pi_test",
    status: "succeeded",
    amount: 19999
  });

  const StripeConstructor = jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: paymentIntentsCreate,
      retrieve: paymentIntentsRetrieve
    }
  }));

  // Make the mock functions accessible on the constructor
  StripeConstructor.paymentIntentsCreate = paymentIntentsCreate;
  StripeConstructor.paymentIntentsRetrieve = paymentIntentsRetrieve;

  return StripeConstructor;
});

// Create a mock client function to use in tests
const createMockClient = () => ({
  query: jest.fn().mockImplementation((query, params) => {
    if (
      query.includes("BEGIN") ||
      query.includes("COMMIT") ||
      query.includes("ROLLBACK")
    ) {
      return Promise.resolve();
    } else if (query.includes("SELECT o.*, p.payment_status")) {
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
});

// Mock DB helper
jest.mock("@/db/helpers/db", () => {
  const mockClient = createMockClient();

  return {
    __esModule: true,
    default: {
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
      connect: jest
        .fn()
        .mockImplementation(() => Promise.resolve(createMockClient()))
    }
  };
});

describe("Payment API Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/stripe/payment-intent", () => {
    it("creates a payment intent", async () => {
      // Setup Stripe mock directly
      const Stripe = require("stripe");
      const mockStripeInstance = Stripe();

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
      expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith(
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
      // Setup direct access to the mocked Stripe instance
      const Stripe = require("stripe");
      Stripe().paymentIntents.retrieve.mockResolvedValueOnce({
        id: "pi_test",
        status: "succeeded",
        amount: 19999
      });

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
