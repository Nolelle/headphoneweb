// __tests__/api/stripe-webhook.test.ts
import { jest, expect, describe, it, beforeEach } from "@jest/globals";

// Mock console.log first to keep output clean
jest.spyOn(console, "log").mockImplementation(() => {});

// Set required environment variables
process.env.STRIPE_SECRET_KEY = "test_secret_key";
process.env.STRIPE_WEBHOOK_SECRET = "test_webhook_secret";

// Define mocks inside the jest.mock calls
jest.mock("next/headers", () => {
  const mockGet = jest.fn((name) =>
    name === "stripe-signature" ? "test-signature" : null
  );

  return {
    headers: jest.fn(() => ({
      get: mockGet
    }))
  };
});

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      body: data,
      options: options || {},
      status: options?.status || 200,
      json: async () => data
    }))
  }
}));

jest.mock("@/db/helpers/db", () => {
  const mockClient = {
    query: jest.fn((query, params) => {
      if (
        query.includes("BEGIN") ||
        query.includes("COMMIT") ||
        query.includes("ROLLBACK")
      ) {
        return Promise.resolve({});
      } else if (query.includes('INSERT INTO "ORDER"')) {
        return Promise.resolve({ rows: [{ order_id: 1 }] });
      } else if (query.includes("UPDATE headphones")) {
        return Promise.resolve({ rows: [{ stock_quantity: 5 }] });
      } else {
        return Promise.resolve({ rows: [] });
      }
    }),
    release: jest.fn()
  };

  return {
    __esModule: true,
    default: {
      connect: jest.fn().mockResolvedValue(mockClient)
    }
  };
});

jest.mock("stripe", () => {
  const mockConstructEvent = jest
    .fn()
    .mockImplementation((body, signature, secret) => ({
      type: "payment_intent.succeeded",
      id: "evt_test",
      api_version: "2025-02-24",
      data: {
        object: {
          id: "pi_test",
          amount: 19999,
          amount_received: 19999,
          payment_method: "pm_test",
          currency: "usd",
          metadata: {
            order_items: JSON.stringify([
              { id: 1, quantity: 1, name: "Bone+ Headphone" }
            ])
          }
        }
      }
    }));

  const mockRetrieve = jest.fn().mockResolvedValue({
    id: "pm_test",
    type: "card",
    billing_details: {
      email: "test@example.com"
    }
  });

  // Create a mock Stripe class
  const MockStripe = jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: mockConstructEvent
    },
    paymentMethods: {
      retrieve: mockRetrieve
    }
  }));

  // Mock the Stripe.Stripe property expected by TypeScript
  MockStripe.Stripe = MockStripe;

  return {
    Stripe: MockStripe
  };
});

// Now we can safely import the route handler
import { POST } from "@/app/api/stripe/webhook/route";
import { NextResponse } from "next/server";

describe("Stripe Webhook Handler", () => {
  let headersMock;
  let webhookMock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get references to our mocks after they've been created
    headersMock = require("next/headers").headers().get;
    webhookMock = new (require("stripe").Stripe)().webhooks.constructEvent;
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
    const mockClient = await mockDb.connect();

    // Should start a transaction
    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");

    // Should create an order
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringMatching(/INSERT INTO "ORDER"/),
      expect.arrayContaining(["paid", "pi_test"])
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
    // Mock constructEvent to throw an error for this test only
    webhookMock.mockImplementationOnce(() => {
      throw new Error("Invalid signature");
    });

    // Mock NextResponse.json to ensure it returns the correct status
    const jsonSpy = jest.spyOn(NextResponse, "json");
    jsonSpy.mockImplementationOnce((data, options) => ({
      ...data,
      status: options?.status || 200,
      json: async () => data
    }));

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
    expect(jsonSpy).toHaveBeenCalledWith(
      { error: "Invalid signature" },
      { status: 400 }
    );

    // Check the response has the error message
    const responseData = await response.json();
    expect(responseData.error).toBe("Invalid signature");
  });

  it("handles missing stripe signature", async () => {
    // Mock headers.get to return null for any key in this test only
    headersMock.mockImplementationOnce(() => null);

    // Mock NextResponse.json to ensure it returns the correct status
    const jsonSpy = jest.spyOn(NextResponse, "json");
    jsonSpy.mockImplementationOnce((data, options) => ({
      ...data,
      status: options?.status || 200,
      json: async () => data
    }));

    // Create test request without signature
    const req = new Request("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });

    const response = await POST(req);

    // Should return 400 status with correct error
    expect(jsonSpy).toHaveBeenCalledWith(
      { error: "No stripe signature found" },
      { status: 400 }
    );

    // Check the response has the error message
    const responseData = await response.json();
    expect(responseData.error).toBe("No stripe signature found");
  });
});
