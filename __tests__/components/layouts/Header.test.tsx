// __tests__/components/layouts/Header.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Header from "@/app/components/layouts/Header";
import { CartProvider } from "@/app/components/Cart/CartContext";

// Mock CartContext values
jest.mock("@/app/components/Cart/CartContext", () => ({
  ...jest.requireActual("@/app/components/Cart/CartContext"),
  useCart: () => ({
    items: [],
    total: 0,
    addItem: jest.fn(),
    removeItem: jest.fn(),
    updateQuantity: jest.fn(),
    clearCart: jest.fn(),
    loadingItems: {},
    error: null,
    isLoading: false,
  }),
}));

describe("Header Component", () => {
  it("renders the header with navigation and empty cart", () => {
    render(
      <CartProvider>
        <Header />
      </CartProvider>
    );
    
    // Check logo
    expect(screen.getByAltText("Bone+")).toBeInTheDocument();
    
    // Check navigation links
    expect(screen.getByText("About Us")).toBeInTheDocument();
    expect(screen.getByText("Headphones")).toBeInTheDocument();
    expect(screen.getByText("Contact Us")).toBeInTheDocument();
    
    // Check cart dropdown trigger
    const cartButton = screen.getByRole("button", { name: "" }); // Cart icon button
    expect(cartButton).toBeInTheDocument();
    
    // Click cart button to open dropdown
    fireEvent.click(cartButton);
    
    // Check empty cart message
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  });
  
  it("shows cart with items when cart has products", () => {
    // Override the mock to return cart items
    jest.spyOn(require("@/app/components/Cart/CartContext"), "useCart").mockImplementation(() => ({
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
      total: 399.98,
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
      loadingItems: {},
      error: null,
      isLoading: false,
    }));
    
    render(
      <CartProvider>
        <Header />
      </CartProvider>
    );
    
    // Check cart counter badge
    expect(screen.getByText("2")).toBeInTheDocument();
    
    // Open cart dropdown
    const cartButton = screen.getByRole("button", { name: "" });
    fireEvent.click(cartButton);
    
    // Verify cart content
    expect(screen.getByText("1 Item")).toBeInTheDocument();
    expect(screen.getByText("$399.98")).toBeInTheDocument();
    expect(screen.getByText("View Cart")).toBeInTheDocument();
  });
});