/// <reference types="@testing-library/jest-dom" />

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProductInfo from "@/app/components/Product/ProductInfo";

// Mock the toast library
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Import the mocked module
import { toast } from "sonner";

// Mock the useCart hook implementation before importing
const mockAddItem = jest.fn().mockResolvedValue(undefined);
jest.mock("@/app/components/Cart/CartContext", () => ({
  useCart: () => ({
    addItem: mockAddItem
  })
}));

// Mock fetch for stock checking
global.fetch = jest.fn() as jest.Mock;

// Type for carousel API
interface CarouselApi {
  selectedScrollSnap: () => number;
  scrollTo: (index: number) => void;
  on: (event: string, callback: () => void) => void;
}

// Mock carousel components
jest.mock("@/app/components/ui/carousel", () => ({
  Carousel: function Carousel({
    children,
    setApi
  }: {
    children: React.ReactNode;
    setApi?: (api: CarouselApi) => void;
  }) {
    if (setApi) {
      // Call setApi directly, without useEffect
      setTimeout(() => {
        setApi({
          selectedScrollSnap: jest.fn().mockReturnValue(0),
          scrollTo: jest.fn(),
          on: jest.fn((event: string, callback: () => void) => {
            if (event === "select") callback();
          })
        });
      }, 0);
    }
    return <div data-testid="carousel">{children}</div>;
  },
  CarouselContent: function CarouselContent({
    children
  }: {
    children: React.ReactNode;
  }) {
    return <div data-testid="carousel-content">{children}</div>;
  },
  CarouselItem: function CarouselItem({
    children
  }: {
    children: React.ReactNode;
  }) {
    return <div data-testid="carousel-item">{children}</div>;
  },
  CarouselNext: function CarouselNext() {
    return <button data-testid="carousel-next">Next</button>;
  },
  CarouselPrevious: function CarouselPrevious() {
    return <button data-testid="carousel-previous">Previous</button>;
  }
}));

// Mock Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: function MockImage({
    src,
    alt,
    className
  }: {
    src: string;
    alt: string;
    className?: string;
  }) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        data-testid="product-image"
      />
    );
  }
}));

describe("ProductInfo Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful stock check by default
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify({ available: true }))
    });
  });

  it("renders the product details correctly", () => {
    render(<ProductInfo />);

    // Check product name and price are displayed
    expect(screen.getByText("Bone+ Headphone")).toBeInTheDocument();
    expect(screen.getByText("$199.99")).toBeInTheDocument();

    // Check carousel is rendered
    expect(screen.getByTestId("carousel")).toBeInTheDocument();
    expect(screen.getByTestId("carousel-next")).toBeInTheDocument();
    expect(screen.getByTestId("carousel-previous")).toBeInTheDocument();
  });

  it('calls addItem when "Add to Cart" button is clicked', async () => {
    render(<ProductInfo />);

    // Find the add to cart button and click it
    const addToCartButton = screen.getByRole("button", {
      name: /add to cart/i
    });
    fireEvent.click(addToCartButton);

    // Wait for the async operations to complete
    await waitFor(() => {
      // Verify fetch was called with the correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/products/check-stock",
        expect.objectContaining({}) // Use objectContaining instead of any
      );

      // Verify addItem was called with the correct parameters
      expect(mockAddItem).toHaveBeenCalledWith(1, 1);

      // Verify success toast was shown
      expect(toast.success).toHaveBeenCalledWith("Added to cart");
    });
  });

  it("shows error toast when stock check fails", async () => {
    // Mock a failed stock check
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      text: jest
        .fn()
        .mockResolvedValue(JSON.stringify({ error: "Out of stock" }))
    });

    render(<ProductInfo />);

    // Find the add to cart button and click it
    const addToCartButton = screen.getByRole("button", {
      name: /add to cart/i
    });
    fireEvent.click(addToCartButton);

    // Wait for the async operations to complete
    await waitFor(() => {
      // Verify error toast was shown
      expect(toast.error).toHaveBeenCalledWith("Out of stock");

      // Verify addItem was not called
      expect(mockAddItem).not.toHaveBeenCalled();
    });
  });

  it("handles network errors during stock check", async () => {
    // Mock a network failure
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    render(<ProductInfo />);

    // Find the add to cart button and click it
    const addToCartButton = screen.getByRole("button", {
      name: /add to cart/i
    });
    fireEvent.click(addToCartButton);

    // Wait for the async operations to complete
    await waitFor(() => {
      // Verify error toast was shown
      expect(toast.error).toHaveBeenCalledWith("Network error");

      // Verify addItem was not called
      expect(mockAddItem).not.toHaveBeenCalled();
    });
  });

  it("handles invalid JSON response from stock check", async () => {
    // Mock an invalid JSON response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue("Not valid JSON")
    });

    render(<ProductInfo />);

    // Find the add to cart button and click it
    const addToCartButton = screen.getByRole("button", {
      name: /add to cart/i
    });
    fireEvent.click(addToCartButton);

    // Wait for the async operations to complete
    await waitFor(() => {
      // Verify error toast was shown with the expected message
      expect(toast.error).toHaveBeenCalledWith("Invalid server response");

      // Verify addItem was not called
      expect(mockAddItem).not.toHaveBeenCalled();
    });
  });
});
