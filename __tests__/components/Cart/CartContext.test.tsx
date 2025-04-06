import { renderHook, act, waitFor } from "@testing-library/react";
import { CartProvider, useCart } from "@/app/components/Cart/CartContext";
import "@testing-library/jest-dom";
import { expect } from "@jest/globals";
import { ReactNode } from "react";

// Define cart item type
interface MockCartItem {
  cart_item_id: string;
  product_id: number;
  quantity: number;
  price: number;
  name: string;
}

// Mock cart data
let mockCart = {
  items: [] as MockCartItem[],
  total: 0
};

// Setup fetch mock that directly manipulates our mock cart state
global.fetch = jest
  .fn()
  .mockImplementation((url: string | URL | Request, options?: RequestInit) => {
    const urlString = url.toString();
    const method = options?.method || "GET";

    // Mock response creator with full Response-like object
    const createResponse = (data: { items: MockCartItem[]; total: number }) => {
      return Promise.resolve({
        ok: true,
        status: 200, // Added to match real fetch response
        statusText: "OK",
        headers: new Headers(),
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data))
      });
    };

    if (method === "GET") {
      // Return current cart state for any GET
      return createResponse(mockCart);
    } else if (urlString === "/api/cart" && method === "POST") {
      // Add or update item in cart
      const body = JSON.parse(options?.body as string);
      const existingItem = mockCart.items.find(
        (item) => item.product_id === body.productId
      );
      if (existingItem) {
        // Update quantity if product already exists
        existingItem.quantity += body.quantity;
      } else {
        // Add new item
        const newItem = {
          cart_item_id: Date.now().toString(),
          product_id: body.productId,
          quantity: body.quantity,
          price: 100, // Mock price
          name: `Product ${body.productId}`
        };
        mockCart.items.push(newItem);
      }
      mockCart.total = calculateTotal(mockCart.items);
      return createResponse(mockCart);
    } else if (urlString === "/api/cart/update" && method === "PUT") {
      // Update item quantity
      const body = JSON.parse(options?.body as string);
      const item = mockCart.items.find(
        (item) => item.cart_item_id === body.cartItemId
      );
      if (item) {
        item.quantity = body.quantity;
        mockCart.total = calculateTotal(mockCart.items);
      }
      return createResponse(mockCart);
    } else if (urlString.includes("/api/cart/remove") && method === "DELETE") {
      // Remove item
      const urlParams = new URLSearchParams(urlString.split("?")[1]);
      const cartItemId = urlParams.get("cartItemId");
      mockCart.items = mockCart.items.filter(
        (item) => item.cart_item_id !== cartItemId
      );
      mockCart.total = calculateTotal(mockCart.items);
      return createResponse(mockCart);
    } else if (urlString === "/api/cart/clear" && method === "DELETE") {
      // Clear cart
      mockCart.items = [];
      mockCart.total = 0;
      return createResponse(mockCart);
    }

    // Default response
    return createResponse(mockCart);
  }) as jest.Mock;

// Helper to calculate mock cart total
function calculateTotal(items: MockCartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Reset mock cart before each test
beforeEach(() => {
  jest.clearAllMocks();
  mockCart = { items: [], total: 0 };
  localStorage.clear(); // Ensure session ID is reset
});

// Wrapper component for tests
const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe("CartContext Provider", () => {
  it("should initialize with empty cart", async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  it("should add item to cart", async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 3000 }
    );

    await act(async () => {
      await result.current.addItem(1, 1);
    });

    await waitFor(
      () => {
        expect(result.current.items.length).toBe(1);
      },
      { timeout: 3000 }
    );

    expect(result.current.items[0].product_id).toBe(1);
  });

  it("should update item quantity", async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 3000 }
    );

    await act(async () => {
      await result.current.addItem(1, 1);
    });

    await waitFor(
      () => {
        expect(result.current.items.length).toBe(1);
      },
      { timeout: 3000 }
    );

    const itemId = result.current.items[0].cart_item_id;

    await act(async () => {
      await result.current.updateQuantity(itemId, 2);
    });

    await waitFor(
      () => {
        expect(result.current.items[0].quantity).toBe(2);
      },
      { timeout: 3000 }
    );
  });

  it("should remove item from cart", async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 3000 }
    );

    await act(async () => {
      await result.current.addItem(1, 1);
    });

    await waitFor(
      () => {
        expect(result.current.items.length).toBe(1);
      },
      { timeout: 3000 }
    );

    const itemId = result.current.items[0].cart_item_id;

    await act(async () => {
      await result.current.removeItem(itemId);
    });

    await waitFor(
      () => {
        expect(result.current.items.length).toBe(0);
      },
      { timeout: 3000 }
    );
  });

  it("should clear cart", async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 3000 }
    );

    await act(async () => {
      await result.current.addItem(1, 1);
    });

    await waitFor(
      () => {
        expect(result.current.items.length).toBe(1);
      },
      { timeout: 3000 }
    );

    await act(async () => {
      await result.current.clearCart();
    });

    await waitFor(
      () => {
        expect(result.current.items.length).toBe(0);
      },
      { timeout: 3000 }
    );
  });

  it("calculates cart total correctly", async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.addItem(1, 2); // 2 units of product 1
    });

    await act(async () => {
      await result.current.addItem(2, 1); // 1 unit of product 2
    });

    await waitFor(() => {
      expect(result.current.total).toBe(300); // 2*100 + 1*100 = 300
    });
  });

  it("persists cart data in localStorage", async () => {
    const getItemSpy = jest.spyOn(Storage.prototype, "getItem");
    const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getItemSpy).toHaveBeenCalledWith("cart_session_id");

    await act(async () => {
      await result.current.addItem(1, 1);
    });

    expect(setItemSpy).toHaveBeenCalledWith(
      "cart_session_id",
      expect.any(String)
    );

    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });

  it("generates new session ID when none exists", async () => {
    localStorage.clear();
    const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(setItemSpy).toHaveBeenCalledWith(
      "cart_session_id",
      expect.any(String)
    );

    setItemSpy.mockRestore();
  });

  it("handles adding same product multiple times", async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.addItem(1, 1);
    });

    await act(async () => {
      await result.current.addItem(1, 2);
    });

    await waitFor(() => {
      expect(result.current.items.length).toBe(1); // Single item
      expect(result.current.items[0].quantity).toBe(3); // Updated quantity: 1 + 2
    });
  });

  it("handles cart totals with fractional quantities and prices", async () => {
    // Pre-define the cart state for this test with fractional values
    const mockItems = [
      {
        cart_item_id: "1",
        product_id: 1,
        quantity: 1,
        price: 19.99,
        name: "Product 1"
      },
      {
        cart_item_id: "2",
        product_id: 2,
        quantity: 1.5,
        price: 10,
        name: "Product 2"
      }
    ];

    // Update the mock implementation for this specific test
    (global.fetch as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        json: () => Promise.resolve({ items: mockItems }),
        text: () => Promise.resolve(JSON.stringify({ items: mockItems }))
      });
    });

    const { result } = renderHook(() => useCart(), { wrapper });

    // Wait for the initial cart load to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // The mock cart is now loaded with our pre-defined items
    await waitFor(() => {
      // The expected total is 19.99 + (10 * 1.5) = 34.99
      expect(result.current.total).toBeCloseTo(34.99, 2);
    });
  });

  it("performs optimistic updates on item removal", async () => {
    // Create a cart with one item initially
    const initialItems = [
      {
        cart_item_id: "1",
        product_id: 1,
        quantity: 1,
        price: 100,
        name: "Product 1"
      }
    ];

    // Setup initial fetch to return the cart with one item
    (global.fetch as jest.Mock).mockImplementationOnce(() => {
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        json: () => Promise.resolve({ items: initialItems }),
        text: () => Promise.resolve(JSON.stringify({ items: initialItems }))
      });
    });

    const { result } = renderHook(() => useCart(), { wrapper });

    // Wait for the initial cart to load with our item
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.items.length).toBe(1);
    });

    // Mock the removal API call to resolve after a delay
    let removeResolve: (value: any) => void;
    const removePromise = new Promise((resolve) => {
      removeResolve = resolve;
    });

    (global.fetch as jest.Mock).mockImplementationOnce(() => {
      // This will simulate a delayed response from the server
      return removePromise.then(() => ({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        json: () => Promise.resolve({ items: [] }), // Empty cart after removal
        text: () => Promise.resolve(JSON.stringify({ items: [] }))
      }));
    });

    // Call removeItem - this should trigger an optimistic update
    await act(async () => {
      result.current.removeItem("1");

      // Wait a short time for the optimistic update to occur
      await new Promise((r) => setTimeout(r, 50));
    });

    // Check for optimistic update - the item should already be removed
    expect(result.current.items.length).toBe(0);

    // Now resolve the server response
    await act(async () => {
      removeResolve({});
      await new Promise((r) => setTimeout(r, 50)); // Allow time for the response to be processed
    });

    // Final state should still have no items
    expect(result.current.items.length).toBe(0);
  });

  it("correctly calculates cart subtotal and quantity", async () => {
    // Pre-define the cart state for this test
    const mockItems = [
      {
        cart_item_id: "1",
        product_id: 1,
        quantity: 2,
        price: 10.5,
        name: "Product 1"
      },
      {
        cart_item_id: "2",
        product_id: 2,
        quantity: 1,
        price: 25.99,
        name: "Product 2"
      },
      {
        cart_item_id: "3",
        product_id: 3,
        quantity: 3,
        price: 5.25,
        name: "Product 3"
      }
    ];

    const expectedTotal = 2 * 10.5 + 1 * 25.99 + 3 * 5.25;

    // Setup fetch to return our pre-defined cart
    (global.fetch as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        json: () => Promise.resolve({ items: mockItems }),
        text: () => Promise.resolve(JSON.stringify({ items: mockItems }))
      });
    });

    const { result } = renderHook(() => useCart(), { wrapper });

    // Wait for the cart to load with our items
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check that we have all the items
    expect(result.current.items.length).toBe(3);

    // Check total calculations
    expect(result.current.total).toBeCloseTo(expectedTotal, 2);

    // Check quantity total
    const totalQuantity = result.current.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    expect(totalQuantity).toBe(6); // 2 + 1 + 3
  });
});
