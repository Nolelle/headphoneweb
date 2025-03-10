import { renderHook, act, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from '@/app/components/Cart/CartContext';
import '@testing-library/jest-dom';
import { expect } from '@jest/globals';
import { ReactNode } from 'react';

// Define cart item type
interface MockCartItem {
  cart_item_id: string; // Changed to string to match CartProvider
  product_id: number;
  quantity: number;
  price: number;
  name: string;
}

// Mock cart data
let mockCart = {
  items: [] as MockCartItem[],
  total: 0,
};

// Setup fetch mock that directly manipulates our mock cart state
global.fetch = jest.fn().mockImplementation((url: string | URL | Request, options?: RequestInit) => {
  const urlString = url.toString();
  const method = options?.method || 'GET';

  // Mock response creator
  const createResponse = (data: { items: MockCartItem[]; total: number }) => {
    const jsonData = JSON.stringify(data);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(jsonData),
    });
  };

  if (method === 'GET') {
    // Return current cart state for any GET
    return createResponse(mockCart);
  } else if (urlString === '/api/cart' && method === 'POST') {
    // Add item to cart
    const body = JSON.parse(options?.body as string);
    const newItem = {
      cart_item_id: Date.now().toString(), // Use string ID to match CartProvider
      product_id: body.productId,
      quantity: body.quantity,
      price: 100, // Mock price
      name: `Product ${body.productId}`,
    };

    mockCart.items.push(newItem);
    mockCart.total = calculateTotal(mockCart.items);

    return createResponse(mockCart);
  } else if (urlString === '/api/cart/update' && method === 'PUT') {
    // Update item quantity
    const body = JSON.parse(options?.body as string);
    const item = mockCart.items.find((item) => item.cart_item_id === body.cartItemId);
    if (item) {
      item.quantity = body.quantity;
      mockCart.total = calculateTotal(mockCart.items);
    }
    return createResponse(mockCart);
  } else if (urlString.includes('/api/cart/remove') && method === 'DELETE') {
    // Remove item
    const urlParams = new URLSearchParams(urlString.split('?')[1]);
    const cartItemId = urlParams.get('cartItemId');
    mockCart.items = mockCart.items.filter((item) => item.cart_item_id !== cartItemId); // String comparison
    mockCart.total = calculateTotal(mockCart.items);

    return createResponse(mockCart);
  } else if (urlString === '/api/cart/clear' && method === 'DELETE') {
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
const wrapper = ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider>;

describe('CartContext Provider', () => {
  it('should initialize with empty cart', async () => {
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

  it('should add item to cart', async () => {
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

  it('should update item quantity', async () => {
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
      await result.current.updateQuantity(itemId, 2); // No toString() needed since mock uses strings
    });

    await waitFor(
      () => {
        expect(result.current.items[0].quantity).toBe(2);
      },
      { timeout: 3000 }
    );
  });

  it('should remove item from cart', async () => {
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
      await result.current.removeItem(itemId); // No toString() needed since mock uses strings
    });

    await waitFor(
      () => {
        expect(result.current.items.length).toBe(0);
      },
      { timeout: 3000 }
    );
  });

  it('should clear cart', async () => {
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
  
    // Add two different items with different quantities
    await act(async () => {
      await result.current.addItem(1, 2); // 2 units of product 1
    });
  
    await act(async () => {
      await result.current.addItem(2, 1); // 1 unit of product 2
    });
  
    await waitFor(() => {
      // The mock cart items have price 100 each, so we should have 2*100 + 1*100 = 300
      expect(result.current.total).toBe(300);
    });
  });
  
  it("persists cart data in localStorage", async () => {
    // Spy on localStorage methods
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
    
    const { result } = renderHook(() => useCart(), { wrapper });
  
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  
    // Verify localStorage was checked for existing session
    expect(getItemSpy).toHaveBeenCalledWith('cart_session_id');
    
    // Add an item to trigger storage update
    await act(async () => {
      await result.current.addItem(1, 1);
    });
    
    // Verify session ID was stored
    expect(setItemSpy).toHaveBeenCalledWith('cart_session_id', expect.any(String));
    
    // Cleanup
    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });
  
  it("generates new session ID when none exists", async () => {
    // Clear localStorage
    localStorage.clear();
    
    // Spy on localStorage methods
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
    
    const { result } = renderHook(() => useCart(), { wrapper });
  
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Verify new session ID was created and stored
    expect(setItemSpy).toHaveBeenCalledWith('cart_session_id', expect.any(String));
    
    // Cleanup
    setItemSpy.mockRestore();
  });
  it("handles adding same product multiple times", async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
  
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  
    // First add
    await act(async () => {
      await result.current.addItem(1, 1);
    });
  
    // Second add of same product
    await act(async () => {
      await result.current.addItem(1, 2);
    });
  
    // The API should be called to update the quantity rather than adding a new item
    await waitFor(() => {
      // Check if we still have just one item (not two)
      expect(result.current.items.length).toBe(1);
      // But with updated quantity
      expect(result.current.items[0].quantity).toBe(2);
    });
  });
  
  it("handles cart totals with fractional quantities and prices", async () => {
    // Update our mock to use fractional values
    mockCart = {
      items: [],
      total: 0,
    };
    
    const { result } = renderHook(() => useCart(), { wrapper });
  
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  
    // Add item with non-integer price
    await act(async () => {
      global.fetch = jest.fn().mockImplementationOnce(() => {
        const newItem = {
          cart_item_id: "1",
          product_id: 1,
          quantity: 1,
          price: 19.99, // Fractional price
          name: "Product 1"
        };
        
        mockCart.items = [newItem];
        mockCart.total = 19.99;
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: mockCart.items }),
        });
      });
      
      await result.current.addItem(1, 1);
    });
  
    // Add another item with fractional quantity
    await act(async () => {
      global.fetch = jest.fn().mockImplementationOnce(() => {
        const newItem = {
          cart_item_id: "2",
          product_id: 2,
          quantity: 1.5, // Fractional quantity
          price: 10,
          name: "Product 2"
        };
        
        mockCart.items.push(newItem);
        mockCart.total = 19.99 + (10 * 1.5);
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: mockCart.items }),
        });
      });
      
      await result.current.addItem(2, 1.5);
    });
  
    // Verify total calculation is accurate with decimal numbers
    await waitFor(() => {
      // 19.99 + (10 * 1.5) = 19.99 + 15 = 34.99
      expect(result.current.total).toBeCloseTo(34.99, 2);
    });
  });
  
  it("handles error during cart operations", async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
  
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  
    // Simulate a network error
    await act(async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network failure"));
      
      try {
        await result.current.addItem(1, 1);
      } catch (err) {
        // Error should be thrown
        expect(err.message).toBe("Network failure");
      }
    });
  
    // Error state should be set
    expect(result.current.error).toBeTruthy();
    
    // Cart should remain empty
    expect(result.current.items.length).toBe(0);
  });
  
  it("performs optimistic updates on item removal", async () => {
    // Set up initial cart with an item
    mockCart = {
      items: [
        {
          cart_item_id: "1",
          product_id: 1,
          quantity: 1,
          price: 100,
          name: "Product 1"
        }
      ],
      total: 100,
    };
    
    const { result } = renderHook(() => useCart(), { wrapper });
  
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      // Wait for the initial cart data to load
      expect(result.current.items.length).toBe(1);
    });
  
    // Simulate a slow network for removal
    let resolveRemoval: (value: any) => void;
    const removalPromise = new Promise(resolve => {
      resolveRemoval = resolve;
    });
    
    global.fetch = jest.fn().mockImplementationOnce(() => {
      // Remove item from mockCart
      mockCart.items = [];
      mockCart.total = 0;
      
      return removalPromise.then(() => ({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      }));
    });
  
    // Start removal
    let removalPromiseResult: Promise<void>;
    await act(async () => {
      removalPromiseResult = result.current.removeItem("1");
    });
  
    // Check that item is optimistically removed before API resolves
    expect(result.current.items.length).toBe(0);
    
    // Now resolve the API call
    await act(async () => {
      resolveRemoval({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      });
      await removalPromiseResult;
    });
    
    // Cart should still be empty after API confirms
    expect(result.current.items.length).toBe(0);
  });
  
  it("correctly calculates cart subtotal and quantity", async () => {
    // Set up initial cart with multiple items of different quantities
    mockCart = {
      items: [
        {
          cart_item_id: "1",
          product_id: 1,
          quantity: 2,
          price: 10.50,
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
      ],
      total: 0, // We'll calculate this
    };
    
    // Calculate expected total manually
    const expectedTotal = (2 * 10.50) + (1 * 25.99) + (3 * 5.25);
    mockCart.total = expectedTotal;
    
    const { result } = renderHook(() => useCart(), { wrapper });
  
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      // Wait for the cart data to load
      expect(result.current.items.length).toBe(3);
    });
  
    // Verify total calculation
    expect(result.current.total).toBeCloseTo(expectedTotal, 2);
    
    // Calculate total quantity
    const totalQuantity = result.current.items.reduce((sum, item) => sum + item.quantity, 0);
    expect(totalQuantity).toBe(6); // 2 + 1 + 3
  });
});