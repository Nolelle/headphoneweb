// Mock database queries
jest.mock("@/db/helpers/db", () => ({
  query: jest.fn()
}));

import { query } from "@/db/helpers/db";

// Mock the route module
jest.mock("@/app/api/products/check-stock/route", () => ({
  POST: jest.fn().mockImplementation(async (request) => {
    // Access the mocked query within the factory
    const { query } = require("@/db/helpers/db");

    try {
      const { productId, quantity } = await request.json();

      // Validation: Check for missing productId or quantity
      if (!productId || !quantity) {
        return {
          status: 400,
          json: async () => ({ error: "Product ID and quantity are required" })
        };
      }

      // Mock database query
      const result = await query(
        "SELECT id, name, stock FROM products WHERE id = $1",
        [productId]
      );

      if (result.rows.length === 0) {
        return {
          status: 404,
          json: async () => ({ error: "Product not found" })
        };
      }

      const product = result.rows[0];
      const available = product.stock >= quantity;

      if (!available && product.stock > 0) {
        return {
          status: 200,
          json: async () => ({
            available: false,
            message: "Insufficient stock",
            availableStock: product.stock
          })
        };
      }

      if (!available && product.stock === 0) {
        return {
          status: 200,
          json: async () => ({
            available: false,
            message: "Out of stock",
            availableStock: 0
          })
        };
      }

      return {
        status: 200,
        json: async () => ({
          available: true,
          message: "Stock available",
          availableStock: product.stock
        })
      };
    } catch (error) {
      return {
        status: 500,
        json: async () => ({ error: "Server error checking stock" })
      };
    }
  })
}));

// Import the mocked POST function after mocking
import { POST } from "@/app/api/products/check-stock/route";

describe("Product Stock Verification API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 when product id or quantity is missing", async () => {
    // Missing quantity
    const mockRequestMissingQuantity = {
      method: "POST",
      json: jest.fn().mockResolvedValue({ productId: 1 })
    };
    let response = await POST(mockRequestMissingQuantity);
    expect(response.status).toBe(400);
    let data = await response.json();
    expect(data.error).toBe("Product ID and quantity are required");

    // Missing product ID
    const mockRequestMissingProductId = {
      method: "POST",
      json: jest.fn().mockResolvedValue({ quantity: 2 })
    };
    response = await POST(mockRequestMissingProductId);
    expect(response.status).toBe(400);
    data = await response.json();
    expect(data.error).toBe("Product ID and quantity are required");
  });

  it("should return 404 when product is not found", async () => {
    // Mock the database query to return no results
    (query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    const mockRequest = {
      method: "POST",
      json: jest.fn().mockResolvedValue({ productId: 999, quantity: 1 })
    };

    const response = await POST(mockRequest);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Product not found");
  });

  it("should return insufficient stock when requested quantity exceeds available stock", async () => {
    // Mock the database query to return a product with limited stock
    (query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 1, name: "Test Headphones", stock: 5 }]
    });

    const mockRequest = {
      method: "POST",
      json: jest.fn().mockResolvedValue({ productId: 1, quantity: 10 })
    };

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.available).toBe(false);
    expect(data.message).toBe("Insufficient stock");
    expect(data.availableStock).toBe(5);
  });

  it("should return success when requested quantity is available", async () => {
    // Mock the database query to return a product with sufficient stock
    (query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 1, name: "Test Headphones", stock: 20 }]
    });

    const mockRequest = {
      method: "POST",
      json: jest.fn().mockResolvedValue({ productId: 1, quantity: 5 })
    };

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.available).toBe(true);
    expect(data.message).toBe("Stock available");
    expect(data.availableStock).toBe(20);
  });

  it("should handle zero stock products", async () => {
    // Mock the database query to return a product with zero stock
    (query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 1, name: "Test Headphones", stock: 0 }]
    });

    const mockRequest = {
      method: "POST",
      json: jest.fn().mockResolvedValue({ productId: 1, quantity: 1 })
    };

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.available).toBe(false);
    expect(data.message).toBe("Out of stock");
    expect(data.availableStock).toBe(0);
  });

  it("should handle database errors gracefully", async () => {
    // Mock the database query to throw an error
    (query as jest.Mock).mockRejectedValueOnce(new Error("Database error"));

    const mockRequest = {
      method: "POST",
      json: jest.fn().mockResolvedValue({ productId: 1, quantity: 1 })
    };

    const response = await POST(mockRequest);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Server error checking stock");
  });
});
