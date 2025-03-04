import { NextRequest } from 'next/server';
import { POST } from '@/app/api/products/check-stock/route';

// Mock database queries
jest.mock('@/db/helpers/db', () => ({
  query: jest.fn(),
}));

import { query } from '@/db/helpers/db';

describe('Product Stock Verification API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 when product id or quantity is missing', async () => {
    // Missing quantity
    const requestWithMissingQuantity = new NextRequest('http://localhost:3000/api/products/check-stock', {
      method: 'POST',
      body: JSON.stringify({ productId: 1 }),
    });

    let response = await POST(requestWithMissingQuantity);
    expect(response.status).toBe(400);
    let data = await response.json();
    expect(data.error).toBe('Product ID and quantity are required');

    // Missing product ID
    const requestWithMissingProductId = new NextRequest('http://localhost:3000/api/products/check-stock', {
      method: 'POST',
      body: JSON.stringify({ quantity: 2 }),
    });

    response = await POST(requestWithMissingProductId);
    expect(response.status).toBe(400);
    data = await response.json();
    expect(data.error).toBe('Product ID and quantity are required');
  });

  it('should return 404 when product is not found', async () => {
    // Mock the database query to return no results
    (query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    const request = new NextRequest('http://localhost:3000/api/products/check-stock', {
      method: 'POST',
      body: JSON.stringify({ productId: 999, quantity: 1 }),
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Product not found');
  });

  it('should return insufficient stock when requested quantity exceeds available stock', async () => {
    // Mock the database query to return a product with limited stock
    (query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 1, name: 'Test Headphones', stock: 5 }],
    });

    const request = new NextRequest('http://localhost:3000/api/products/check-stock', {
      method: 'POST',
      body: JSON.stringify({ productId: 1, quantity: 10 }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.available).toBe(false);
    expect(data.message).toBe('Insufficient stock');
    expect(data.availableStock).toBe(5);
  });

  it('should return success when requested quantity is available', async () => {
    // Mock the database query to return a product with sufficient stock
    (query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 1, name: 'Test Headphones', stock: 20 }],
    });

    const request = new NextRequest('http://localhost:3000/api/products/check-stock', {
      method: 'POST',
      body: JSON.stringify({ productId: 1, quantity: 5 }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.available).toBe(true);
    expect(data.message).toBe('Stock available');
    expect(data.availableStock).toBe(20);
  });

  it('should handle zero stock products', async () => {
    // Mock the database query to return a product with zero stock
    (query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 1, name: 'Test Headphones', stock: 0 }],
    });

    const request = new NextRequest('http://localhost:3000/api/products/check-stock', {
      method: 'POST',
      body: JSON.stringify({ productId: 1, quantity: 1 }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.available).toBe(false);
    expect(data.message).toBe('Out of stock');
    expect(data.availableStock).toBe(0);
  });

  it('should handle database errors gracefully', async () => {
    // Mock the database query to throw an error
    (query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/products/check-stock', {
      method: 'POST',
      body: JSON.stringify({ productId: 1, quantity: 1 }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Server error checking stock');
  });
});