import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/login/route';
import { cookies } from 'next/headers';

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: () => ({
    set: jest.fn(),
  }),
}));

// Mock the database query
jest.mock('@/db/helpers/db', () => ({
  query: jest.fn(),
}));

// Mock bcrypt for password verification
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

import { query } from '@/db/helpers/db';
import bcrypt from 'bcrypt';

describe('Admin Login API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 when username or password is missing', async () => {
    // Missing password
    const requestWithMissingPassword = new NextRequest('http://localhost:3000/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin' }),
    });

    let response = await POST(requestWithMissingPassword);
    expect(response.status).toBe(400);
    let data = await response.json();
    expect(data.error).toBe('Username and password are required');

    // Missing username
    const requestWithMissingUsername = new NextRequest('http://localhost:3000/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'password123' }),
    });

    response = await POST(requestWithMissingUsername);
    expect(response.status).toBe(400);
    data = await response.json();
    expect(data.error).toBe('Username and password are required');
  });

  it('should return 401 when admin not found', async () => {
    // Mock the database query to return no results
    (query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    const request = new NextRequest('http://localhost:3000/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'nonexistent', password: 'password123' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Invalid credentials');
  });

  it('should return 401 when password is incorrect', async () => {
    // Mock the database query to return an admin
    (query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 1, username: 'admin', password_hash: 'hashedpassword' }],
    });

    // Mock bcrypt to return false (password doesn't match)
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

    const request = new NextRequest('http://localhost:3000/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'wrongpassword' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Invalid credentials');
  });

  it('should set session cookie and return success when credentials are valid', async () => {
    // Mock the database query to return an admin
    (query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 1, username: 'admin', password_hash: 'hashedpassword' }],
    });

    // Mock bcrypt to return true (password matches)
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

    const request = new NextRequest('http://localhost:3000/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'correctpassword' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    // Check that the cookie was set
    expect(cookies().set).toHaveBeenCalledWith('admin_session', expect.any(String), {
      httpOnly: true,
      secure: expect.any(Boolean),
      sameSite: 'strict',
      maxAge: expect.any(Number),
      path: '/',
    });
  });

  it('should handle database errors gracefully', async () => {
    // Mock the database query to throw an error
    (query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'password123' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('An error occurred while processing your request');
  });
});