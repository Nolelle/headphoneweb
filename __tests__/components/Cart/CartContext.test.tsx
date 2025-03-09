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
});