import React, { createContext, useContext, useState } from 'react';
import { CartItem, Product } from '@/app/components/Cart/CartTypes';

// This is a simplified version of CartContext for testing purposes
// Instead of trying to mock the actual component, we're creating a test-friendly version

export const cartContextTests = {
  CartProvider: ({ children }: { children: React.ReactNode }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Mock cart context value
    const cartContext = {
      cart: {
        items,
        total: items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
      },
      loading,
      error,
      addItem: async (product: Product, quantity: number) => {
        setLoading(true);
        try {
          const newCartItem: CartItem = {
            id: 1, // Fixed ID for testing
            product,
            quantity
          };
          setItems(prevItems => [...prevItems, newCartItem]);
          const response = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: product.id, quantity })
          });
          if (!response.ok) {
            throw new Error('Failed to add item');
          }
          return newCartItem.id;
        } catch (err) {
          setItems(prevItems => prevItems.filter(item => item.product.id !== product.id));
          throw err;
        } finally {
          setLoading(false);
        }
      },
      removeItem: async (cartItemId: number) => {
        setLoading(true);
        const itemToRemove = items.find(item => item.id === cartItemId);
        if (!itemToRemove) return;
        
        const originalItems = [...items];
        setItems(prevItems => prevItems.filter(item => item.id !== cartItemId));
        
        try {
          const response = await fetch('/api/cart/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartItemId })
          });
          if (!response.ok) {
            throw new Error('Failed to remove item');
          }
        } catch (err) {
          setItems(originalItems);
          throw err;
        } finally {
          setLoading(false);
        }
      },
      updateQuantity: async (cartItemId: number, quantity: number) => {
        setLoading(true);
        const itemIndex = items.findIndex(item => item.id === cartItemId);
        if (itemIndex === -1) return;
        
        const originalItems = [...items];
        const updatedItems = [...items];
        updatedItems[itemIndex] = { ...updatedItems[itemIndex], quantity };
        setItems(updatedItems);
        
        try {
          const response = await fetch('/api/cart/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartItemId, quantity })
          });
          if (!response.ok) {
            throw new Error('Failed to update quantity');
          }
        } catch (err) {
          setItems(originalItems);
          throw err;
        } finally {
          setLoading(false);
        }
      },
      clearCart: async () => {
        setLoading(true);
        const originalItems = [...items];
        setItems([]);
        
        try {
          const response = await fetch('/api/cart/clear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          if (!response.ok) {
            throw new Error('Failed to clear cart');
          }
        } catch (err) {
          setItems(originalItems);
          throw err;
        } finally {
          setLoading(false);
        }
      }
    };
    
    // Create a mock context
    const CartContext = createContext(cartContext);
    
    return (
      <CartContext.Provider value={cartContext}>
        {children}
      </CartContext.Provider>
    );
  },
  
  // Helper to access the context
  useCart: () => {
    // This function will be mocked in our tests
    return {
      cart: { items: [], total: 0 },
      loading: false,
      error: null,
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn()
    };
  },
  
  // Test component that uses the context
  TestComponent: () => {
    const { cart, addItem, removeItem, updateQuantity, clearCart, loading } = cartContextTests.useCart();
    
    return (
      <div>
        <div data-testid="cart-count">{cart.items.length}</div>
        <div data-testid="loading-state">{loading.toString()}</div>
        <button 
          data-testid="add-item" 
          onClick={() => addItem({
            id: 1,
            name: 'Test Headphones',
            price: 299.99,
            image_url: '/test.webp',
            stock: 10
          }, 2)}
        >
          Add Item
        </button>
        <button 
          data-testid="remove-item" 
          onClick={() => cart.items.length && removeItem(cart.items[0].id)}
        >
          Remove Item
        </button>
        <button 
          data-testid="update-quantity" 
          onClick={() => cart.items.length && updateQuantity(cart.items[0].id, 5)}
        >
          Update Quantity
        </button>
        <button data-testid="clear-cart" onClick={() => clearCart()}>
          Clear Cart
        </button>
        <ul data-testid="cart-items">
          {cart.items.map(item => (
            <li key={item.id} data-testid={`item-${item.id}`}>
              {item.product.name} - Qty: {item.quantity}
            </li>
          ))}
        </ul>
      </div>
    );
  }
};