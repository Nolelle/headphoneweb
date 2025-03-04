import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/logout/route';
import { cookies } from 'next/headers';

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: () => ({
    delete: jest.fn(),
  }),
}));

describe('Admin Logout API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete the admin session cookie', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/logout', {
      method: 'POST',
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    // Check that the cookie was deleted
    expect(cookies().delete).toHaveBeenCalledWith('admin_session');
  });

  it('should return success even if no session existed', async () => {
    // Simulate a case where cookie deletion might fail or not be needed
    (cookies().delete as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Cookie does not exist');
    });

    const request = new NextRequest('http://localhost:3000/api/admin/logout', {
      method: 'POST',
    });

    // Should not throw an error even if cookie deletion fails
    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});