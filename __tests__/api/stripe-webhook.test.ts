// __tests__/api/stripe-webhook.test.ts
import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { POST } from "@/app/api/stripe/webhook/route";

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

// Mock next/headers
jest.mock("next/headers", () => ({
  headers: jest.fn(() => ({
    get: jest.fn((key) =>
      key === "stripe-signature" ? "test-signature" : null
    )
  }))
}));

// Mock Stripe
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest
        .fn()
        .mockImplementation((body, signature, secret) => ({
          type: "payment_intent.succeeded",
          data: {
            object: {
              id: "pi_test",
              amount: 19999,
              amount_received: 19999,
              payment_method: "pm_test",
              metadata: {
                order_items: JSON.stringify([
                  { id: 1, quantity: 1, name: "Bone+ Headphone" }
                ])
              }
            }
          }
        }))
    },
    paymentMethods: {
      retrieve: jest.fn().mockResolvedValue({
        billing_details: { email: "test@example.com" }
      })
    }
  }));
});

// Mock DB helper
jest.mock("@/db/helpers/db", () => ({
  default: {
    connect: jest.fn(() => ({
      query: jest.fn().mockImplementation((query) => {
        if (query.includes("BEGIN") || query.includes("COMMIT")) {
          return Promise.resolve();
        } else if (query.includes('INSERT INTO "ORDER"')) {
          return Promise.resolve({ rows: [{ order_id: 1 }] });
        } else {
          return Promise.resolve({ rows: [] });
        }
      }),
      release: jest.fn()
    }))
  }
}));

describe("Stripe Webhook Handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("processes payment_intent.succeeded events correctly", async () => {
    // Create test request
    const req = new Request("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "test-signature"
      },
      body: JSON.stringify({
        id: "evt_test",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test",
            amount: 19999
          }
        }
      })
    });

    const response = await POST(req);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.received).toBe(true);

    // Verify database operations
    const mockDb = require("@/db/helpers/db").default;
    const mockClient = mockDb.connect();

    // Should start a transaction
    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");

    // Should create an order
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringMatching(/INSERT INTO "ORDER"/),
      expect.arrayContaining(["paid", "pi_test", "test@example.com"])
    );

    // Should create order items
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringMatching(/INSERT INTO order_items/),
      expect.any(Array)
    );

    // Should update stock quantity
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringMatching(/UPDATE headphones/),
      expect.any(Array)
    );

    // Should create payment record
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringMatching(/INSERT INTO payment/),
      expect.any(Array)
    );

    // Should commit the transaction
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
  });

  it("verifies stripe signature", async () => {
    // Mock constructEvent to throw an error
    jest
      .spyOn(require("stripe")().webhooks, "constructEvent")
      .mockImplementationOnce(() => {
        throw new Error("Invalid signature");
      });

    // Create test request
    const req = new Request("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "invalid-signature"
      },
      body: "raw-body-data"
    });

    const response = await POST(req);

    // Should return 400 status
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid signature" });
  });

  it("handles missing stripe signature", async () => {
    // Override the mock to return null for stripe-signature
    jest
      .spyOn(require("next/headers").headers(), "get")
      .mockReturnValueOnce(null);

    // Create test request without signature
    const req = new Request("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });

    const response = await POST(req);

    // Should return 400 status
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "No stripe signature found"
    });
  });
});
