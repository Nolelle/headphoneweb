// __tests__/components/Checkout/CheckoutForm.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CheckoutForm from "@/app/components/Checkout/CheckoutForm";
import "@testing-library/jest-dom";
import { expect } from "@jest/globals";

// Mock the Stripe hooks
jest.mock("@stripe/react-stripe-js", () => ({
  useStripe: () => ({
    confirmPayment: jest.fn().mockResolvedValue({ error: null }),
  }),
  useElements: () => ({
    submit: jest.fn().mockResolvedValue({ error: null }),
    getElement: jest.fn(),
  }),
  PaymentElement: () => <div data-testid="payment-element">Payment Element</div>,
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the useCart hook
jest.mock("@/app/components/Cart/CartContext", () => ({
  useCart: () => ({
    items: [
      { 
        cart_item_id: "1", 
        product_id: 1, 
        name: "Bone+ Headphone", 
        price: 199.99, 
        quantity: 1,
        stock_quantity: 10,
        image_url: "/h_1.png"
      }
    ],
    total: 199.99,
    clearCart: jest.fn(),
  }),
}));

describe("CheckoutForm Component", () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    // Reset mocks
    mockOnSubmit.mockReset();
  });

  it("renders checkout form correctly", () => {
    render(<CheckoutForm onSubmit={mockOnSubmit} />);
    
    // Check form inputs
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Address/i)).toBeInTheDocument();
    
    // Check payment element
    expect(screen.getByTestId("payment-element")).toBeInTheDocument();
    
    // Check payment button
    expect(screen.getByRole("button", { name: /Pay \$199.99/i })).toBeInTheDocument();
    
    // Check order summary
    expect(screen.getByText("Order Summary")).toBeInTheDocument();
    expect(screen.getByText("Bone+ Headphone")).toBeInTheDocument();
    expect(screen.getByText("$199.99")).toBeInTheDocument();
  });

  it("validates form fields", async () => {
    render(<CheckoutForm onSubmit={mockOnSubmit} />);
    
    // Try to submit without filling fields
    const submitButton = screen.getByRole("button", { name: /Pay \$199.99/i });
    fireEvent.click(submitButton);
    
    // Check validation messages (HTML5 validation)
    expect(screen.getByLabelText(/Full Name/i)).toBeInvalid();
    expect(screen.getByLabelText(/Email/i)).toBeInvalid();
    expect(screen.getByLabelText(/Address/i)).toBeInvalid();
  });

  it("submits form with valid data", async () => {
    render(<CheckoutForm onSubmit={mockOnSubmit} />);
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText(/Full Name/i), "Test User");
    await userEvent.type(screen.getByLabelText(/Email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/Address/i), "123 Test St");
    
    // Submit the form
    const submitButton = screen.getByRole("button", { name: /Pay \$199.99/i });
    fireEvent.click(submitButton);
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith("test@example.com");
    });
  });

  it("handles payment errors", async () => {
    // Override the Stripe mock to simulate an error
    jest.spyOn(require("@stripe/react-stripe-js"), "useStripe").mockImplementation(() => ({
      confirmPayment: jest.fn().mockResolvedValue({ 
        error: { message: "Your card was declined" } 
      }),
    }));
    
    render(<CheckoutForm onSubmit={mockOnSubmit} />);
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText(/Full Name/i), "Test User");
    await userEvent.type(screen.getByLabelText(/Email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/Address/i), "123 Test St");
    
    // Submit the form
    const submitButton = screen.getByRole("button", { name: /Pay \$199.99/i });
    fireEvent.click(submitButton);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText("Your card was declined")).toBeInTheDocument();
    });
  });
});