import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminLogin from '@/app/admin/login/page';

// Mocking the global fetch function
global.fetch = jest.fn();

describe('AdminLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the login form', () => {
    render(<AdminLogin />);

    // Check if the username and password fields are rendered
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
  });

  it('displays error message when credentials are invalid', async () => {
    render(<AdminLogin />);

    // Set up the mock for a failed login
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'invalidUser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongPassword' },
    });

    fireEvent.click(screen.getByText(/Sign in/i));

    await waitFor(() => {
      // Check if the error message is displayed
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('redirects to dashboard on successful login', async () => {
    render(<AdminLogin />);
    delete window.location;
    window.location = { href: '' } as Location;

    // Set up the mock for a successful login

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'validUser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'correctPassword' },
    });

    fireEvent.click(screen.getByText(/Sign in/i));

    await waitFor(() => {
      // In this case, we expect the window.location.href to change
      expect(window.location.href).toBe('/admin/dashboard');
    });
  });

  it('disables the submit button while loading', async () => {
    render(<AdminLogin />);

    // Mock the fetch call to simulate loading
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'validUser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'correctPassword' },
    });

    fireEvent.click(screen.getByText(/Sign in/i));

    // Check if the button is disabled during the loading state
    expect(screen.getByText(/Signing in.../i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows a general error message if the login request fails', async () => {
    render(<AdminLogin />);

    // Mock the fetch call to simulate an error
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Login failed'));

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'user' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'pass' },
    });

    fireEvent.click(screen.getByText(/Sign in/i));

    await waitFor(() => {
      // Check if the general error message is displayed
      expect(screen.getByText(/Login failed/i)).toBeInTheDocument();
    });
  });
});
