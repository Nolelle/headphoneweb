"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { CartItem, CartResponse } from "./CartTypes";

// Define the shape of our cart context
interface CartContextType {
  items: CartItem[];
  addItem: (productId: number, quantity: number) => Promise<void>;
  removeItem: (cartItemId: number) => Promise<void>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  total: number;
  loadingItems: Record<number, boolean>;
  error: string | null;
}

// Create the context with undefined default value
const CartContext = createContext<CartContextType | undefined>(undefined);

// Key for storing session ID in localStorage
const SESSION_ID_KEY = 'cart_session_id';

// Helper function to generate a temporary ID within PostgreSQL integer range
const generateTempId = () => {
  // Generate a random number between 1 and 1000000
  // This is temporary and will be replaced by the real ID from the database
  return Math.floor(Math.random() * 1000000) + 1;
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loadingItems, setLoadingItems] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Helper to manage loading state for individual items
  const setItemLoading = (itemId: number, loading: boolean) => {
    setLoadingItems(prev => ({ ...prev, [itemId]: loading }));
  };

  // Helper for making API requests with error handling
  const fetchWithErrorHandling = async (
    url: string, 
    options: RequestInit
  ): Promise<CartResponse> => {
    try {
      console.log('Making request to:', url, 'with options:', {
        ...options,
        body: options.body ? JSON.parse(options.body as string) : undefined
      });
  
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
  
      const data = await response.json();
      console.log('Response received:', data);
  
      if (!response.ok) {
        throw new Error(data.error || 'Operation failed');
      }
  
      return data;
    } catch (err) {
      console.error('Request failed:', err);
      throw new Error(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  // Initialize cart and load existing items
  useEffect(() => {
    const initializeCart = async () => {
      try {
        // Get existing session ID or create new one
        let currentSessionId = localStorage.getItem(SESSION_ID_KEY);
        if (!currentSessionId) {
          currentSessionId = uuidv4();
          localStorage.setItem(SESSION_ID_KEY, currentSessionId);
        }
        setSessionId(currentSessionId);

        // Fetch cart items from database
        const response = await fetch(`/api/cart?sessionId=${currentSessionId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch cart');
        }
        
        const cartItems = await response.json();
        setItems(cartItems);
      } catch (err) {
        console.error('Cart initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize cart');
      } finally {
        setIsInitialized(true);
      }
    };

    if (!isInitialized) {
      initializeCart();
    }
  }, [isInitialized]);

  // Calculate total price
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addItem = async (productId: number, quantity: number) => {
    console.log('addItem called with:', { productId, quantity, sessionId });
    
    if (!sessionId) {
      console.error('Cart not initialized - no sessionId');
      setError('Cart not initialized');
      return;
    }
  
    try {
      setItemLoading(productId, true);
      setError(null);
  
      console.log('Making API call to add item');
      const data = await fetchWithErrorHandling('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ 
          sessionId, 
          productId, 
          quantity 
        })
      });
  
      console.log('API call successful, updating items:', data.items);
      if (data.items) {
        setItems(data.items);
      }
  
    } catch (err) {
      console.error('Error in addItem:', err);
      setError(err instanceof Error ? err.message : 'Failed to add item');
      throw err; // Re-throw to handle in component
    } finally {
      setItemLoading(productId, false);
    }
  };
  // Remove item from cart with optimistic update
  const removeItem = async (cartItemId: number) => {
    if (!sessionId) {
      setError('Cart not initialized');
      return;
    }

    try {
      setItemLoading(cartItemId, true);
      setError(null);

      // Store the current items state for potential rollback
      const previousItems = [...items];
      
      // Optimistically update the local state
      setItems(items.filter(item => item.cart_item_id !== cartItemId));

      // Sync with the backend
      try {
        const data = await fetchWithErrorHandling('/api/cart/remove', {
          method: 'DELETE',
          body: JSON.stringify({ sessionId, cartItemId })
        });

        // Update with real data from backend
        if (data.items) {
          setItems(data.items);
        }
      } catch (err) {
        // If backend sync fails, revert to the previous state
        setItems(previousItems);
        throw err;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
    } finally {
      setItemLoading(cartItemId, false);
    }
  };

 // Inside CartContext.tsx, update the updateQuantity function:
const updateQuantity = async (cartItemId: number, quantity: number) => {
  if (!sessionId) {
    setError('Cart not initialized');
    return;
  }

  if (quantity < 1) {
    setError('Quantity must be at least 1');
    return;
  }

  try {
    setItemLoading(cartItemId, true);
    setError(null);

    // Find the current item
    const currentItem = items.find(item => item.cart_item_id === cartItemId);
    if (!currentItem) {
      throw new Error('Item not found in cart');
    }

    // Keep current state for rollback
    const previousItems = [...items];
    
    // Optimistically update local state
    setItems(items.map(item =>
      item.cart_item_id === cartItemId
        ? { ...item, quantity }
        : item
    ));

    try {
      const data = await fetchWithErrorHandling('/api/cart/update', {
        method: 'PUT',
        body: JSON.stringify({
          sessionId,
          cartItemId: currentItem.cart_item_id,  // Make sure we're using the correct ID
          quantity
        })
      });

      if (data.items) {
        setItems(data.items);
      }
    } catch (err) {
      // Rollback on failure
      setItems(previousItems);
      throw err;
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to update quantity');
  } finally {
    setItemLoading(cartItemId, false);
  }
}; 

  // Clear entire cart
  const clearCart = async () => {
    if (!sessionId) {
      setError('Cart not initialized');
      return;
    }

    try {
      setError(null);
      
      // Store previous state for potential rollback
      const previousItems = [...items];
      
      // Clear local state immediately
      setItems([]);

      // Sync with backend
      try {
        await fetchWithErrorHandling('/api/cart/clear', {
          method: 'DELETE',
          body: JSON.stringify({ sessionId })
        });
      } catch (err) {
        // Rollback on failure
        setItems(previousItems);
        throw err;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cart');
    }
  };

  // Clean up session when user leaves
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem(SESSION_ID_KEY);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Don't render until cart is initialized
  if (!isInitialized) {
    return null;
  }

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      total,
      loadingItems,
      error
    }}>
      {children}
    </CartContext.Provider>
  );
}

// Custom hook to use cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}