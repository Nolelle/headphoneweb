import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminDashboard from '@/app/components/Admin/AdminDashboard';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Create a type-safe mock response
function createMockResponse(data: unknown): Response {
  return {
    ok: true,
    json: () => Promise.resolve(data),
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    redirected: false,
    type: 'basic',
    url: '',
    clone: () => ({}) as Response,
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve('')
  } as Response;
}

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
    // Ensure fetch is cleared and ready to be mocked
    (global.fetch as jest.Mock).mockClear();
  });

  it('fetches and displays messages', async () => {
    const mockMessages = [
      {
        message_id: 1,
        name: 'John Smith',
        email: 'john@example.com',
        message: 'Test message',
        message_date: '2023-01-01T12:00:00Z',
        status: 'UNREAD'
      }
    ];

    // Mock the fetch response
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(createMockResponse(mockMessages));

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    // Verify fetch was called with the correct URL (single argument)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api')
    );
  });

  it('toggles message read status', async () => {
    const mockMessages = [
      {
        message_id: 1,
        email: 'john@example.com',
        message: 'Test message',
        status: 'UNREAD'
      }
    ];

    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(createMockResponse(mockMessages)) // Initial fetch
      .mockResolvedValueOnce(createMockResponse({ status: 'READ' })); // Status update

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('UNREAD')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Mark as Read'));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/messages/1/status'),
      expect.any(Object)
    );
  });

  it('sends response to message', async () => {
    const mockMessages = [
      {
        message_id: 1,
        email: 'john@example.com',
        message: 'Test message',
        status: 'READ'
      }
    ];

    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(createMockResponse(mockMessages)) // Initial fetch
      .mockResolvedValueOnce(
        createMockResponse({
          admin_response: 'Test response',
          status: 'RESPONDED'
        })
      ); // Response submission

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('response-textarea')).toBeInTheDocument();
    });

    await userEvent.type(screen.getByTestId('response-textarea'), 'Test response');
    await userEvent.click(screen.getByText('Send Response'));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/messages/1/respond'),
      expect.any(Object)
    );
  });
});