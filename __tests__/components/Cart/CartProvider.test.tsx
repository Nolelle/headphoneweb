// __tests__/components/Cart/CartProvider.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from '@/app/components/Cart/CartContext';
import '@testing-library/jest-dom';
import { expect } from '@jest/globals';
import React from 'react';

// Mock fetch for all cart API calls
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ items: [] }),
  })
);

// A test component that uses the cart context
const TestComponent = () => {
  const { items, total, isLoading } = useCart();
  
  if (isLoading) {
    return <div>Loading cart...</div>;
  }
  
  return (
    <div>
      <p data-testid="item-count">Items: {items.length}</p>
      <p data-testid="cart-total">Total: ${total.toFixed(2)}</p>
    </div>
  );
};

describe('CartProvider Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });
  
  it('provides cart context to child components', async () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );
    
    // Initially should show loading
    expect(screen.getByText('Loading cart...')).toBeInTheDocument();
    
    // After loading, should show cart data
    await waitFor(() => {
      expect(screen.getByTestId('item-count')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('item-count')).toHaveTextContent('Items: 0');
    expect(screen.getByTestId('cart-total')).toHaveTextContent('Total: $0.00');
  });
  
  it('generates a session ID on first load', async () => {
    const localStorageSpy = jest.spyOn(Storage.prototype, 'setItem');
    
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('item-count')).toBeInTheDocument();
    });
    
    // Check if localStorage.setItem was called with session ID
    expect(localStorageSpy).toHaveBeenCalledWith('cart_session_id', expect.any(String));
    
    localStorageSpy.mockRestore();
  });
  
  it('reuses existing session ID if available', async () => {
    // Setup existing session ID
    const existingSessionId = 'existing-session-123';
    localStorage.setItem('cart_session_id', existingSessionId);
    
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
    
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('item-count')).toBeInTheDocument();
    });
    
    // Should get the existing session ID
    expect(getItemSpy).toHaveBeenCalledWith('cart_session_id');
    
    // Should NOT set a new session ID
    expect(setItemSpy).not.toHaveBeenCalledWith('cart_session_id', expect.any(String));
    
    // Fetch should be called with the existing session ID
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`sessionId=${existingSessionId}`),
      expect.any(Object)
    );
    
    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });
  
  it('provides error state to child components', async () => {
    // Mock a fetch error
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('API Error'));
    
    const TestErrorComponent = () => {
      const { error, isLoading } = useCart();
      
      if (isLoading) {
        return <div>Loading...</div>;
      }
      
      return <div data-testid="error-message">{error || 'No error'}</div>;
    };
    
    render(
      <CartProvider>
        <TestErrorComponent />
      </CartProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
    
    // Error message should be propagated through context
    expect(screen.getByTestId('error-message').textContent).toMatch(/API Error/);
  });
  
  it('cleans up session on unmount', async () => {
    const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');
    
    // Spy on window event listeners
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    const { unmount } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('item-count')).toBeInTheDocument();
    });
    
    // Check that beforeunload listener was added
    expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    
    // Unmount the component
    unmount();
    
    // Check that beforeunload listener was removed
    expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    
    // Clean up spies
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
    removeItemSpy.mockRestore();
  });
});