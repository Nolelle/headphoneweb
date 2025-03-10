import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Header from "@/app/components/layouts/Header";
import { useCart } from "@/app/components/Cart/CartContext";

// Mock the useCart hook and CartProvider
jest.mock("@/app/components/Cart/CartContext", () => ({
  useCart: jest.fn(),
  CartProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  )
}));

describe("Header Component", () => {
  beforeEach(() => {
    // Clear mocks before each test to ensure isolation
    jest.clearAllMocks();
  });

  it("renders the header with navigation and cart button when cart is empty", () => {
    // Mock an empty cart
    (useCart as jest.Mock).mockReturnValue({ items: [], total: 0 });

    render(<Header />);

    // Check logo
    expect(screen.getByAltText("Bone+")).toBeInTheDocument();

    // Check navigation links
    expect(screen.getByText("About Us")).toBeInTheDocument();
    expect(screen.getByText("Headphones")).toBeInTheDocument();
    expect(screen.getByText("Contact Us")).toBeInTheDocument();

    // Check cart button (requires aria-label="Cart" in Header.tsx for accessibility)
    const cartButton = screen.getByRole("button", { name: /cart/i });
    expect(cartButton).toBeInTheDocument();

    // Check badge is not present when cart is empty
    expect(screen.queryByText("2")).not.toBeInTheDocument();
  });

  it("shows cart badge with correct count when cart has items", () => {
    // Mock a cart with items
    (useCart as jest.Mock).mockReturnValue({
      items: [
        {
          cart_item_id: "1",
          product_id: 1,
          name: "Test Headphones",
          price: 199.99,
          quantity: 2,
          stock_quantity: 10,
          image_url: "/test.jpg"
        }
      ],
      total: 399.98
    });

    render(<Header />);

    // Check badge shows "2" (total quantity)
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
