"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { CartItem, CartResponse } from "./CartTypes";
import { toast } from 'sonner'

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

export function CartProvider({ children }: { children: React.ReactNode }) {
  // State management
  const [items, setItems] = useState<CartItem[]>([]);
  const [loadingItems, setLoadingItems] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Debug logging function - only active in development
  const logDebug = (action: string, details?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CartContext] ${action}:`, details || '');
    }
  };

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
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
  
      // Add error logging to help debug
      const responseText = await response.text();
      
      let data;
      try {
        // Only try to parse if we have content
        data = responseText ? JSON.parse(responseText) : null;
      } catch (parseError) {
        console.error('JSON Parse Error:', {
          responseText,
          status: response.status,
          url: response.url
        });
        throw new Error('Invalid response from server');
      }
  
      if (!response.ok) {
        throw new Error(data?.error || `Server error: ${response.status}`);
      }
  
      if (!data) {
        throw new Error('Empty response from server');
      }
  
      return data;
    } catch (err) {
      console.error('API Error:', {
        url,
        error: err,
        method: options.method
      });
      throw new Error(err instanceof Error ? err.message : 'Operation failed');
    }
  };


  // Initialize cart and load existing items
  useEffect(() => {
    const initializeCart = async () => {
      try {
        logDebug('Initializing cart');
        
        // Get existing session ID or create new one
        let currentSessionId = localStorage.getItem(SESSION_ID_KEY);
        if (!currentSessionId) {
          currentSessionId = uuidv4();
          localStorage.setItem(SESSION_ID_KEY, currentSessionId);
          logDebug('Created new session ID', currentSessionId);
        }
        
        setSessionId(currentSessionId);

        // Fetch existing cart items
        const response = await fetch(`/api/cart?sessionId=${currentSessionId}`);
        const data = await response.json();
        
        logDebug('Loaded initial cart items', data);
        setItems(data.items || []);
      } catch (err) {
        logDebug('Initialization error', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize cart');
      } finally {
        setIsInitialized(true);
      }
    };

    if (!isInitialized) {
      initializeCart();
    }
  }, [isInitialized]);

  // Calculate total price of items in cart
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Add item to cart
  const addItem = async (productId: number, quantity: number) => {
    if (!sessionId) {
      throw new Error('Cart not initialized');
    }
  
    try {
      setItemLoading(productId, true);
      setError(null);
  
      // We'll remove the optimistic update since we need the real DB IDs
      const data = await fetchWithErrorHandling('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ sessionId, productId, quantity })
      });
  
      if (data.items) {
        setItems(data.items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
      throw err;
    } finally {
      setItemLoading(productId, false);
    }
  };

  // Remove item from cart
  const removeItem = async (cartItemId: number) => {
    if (!sessionId) {
      toast.error("Cart not initialized");
      return;
    }

    try {
      setItemLoading(cartItemId, true);
      setError(null);

      // Store current state for potential rollback
      const previousItems = [...items];
      
      // Optimistic update
      setItems(items.filter(item => item.cart_item_id !== cartItemId));

      // Changed from '/api/cart/remove' to '/api/cart/remove/route'
      const data = await fetchWithErrorHandling(`/api/cart/remove?sessionId=${sessionId}&cartItemId=${cartItemId}`, {
        method: 'DELETE'
      });

      if (data.items) {
        setItems(data.items);
        toast.success("Item removed from cart");
      }
    } catch (err) {
      logDebug('Remove item error', err);
      setItems(previousItems);
      toast.error(err instanceof Error ? err.message : "Failed to remove item");
      throw err;
    } finally {
      setItemLoading(cartItemId, false);
    }
  };

  
  const updateQuantity = async (cartItemId: number, quantity: number) => {
    console.log('Starting quantity update:', { cartItemId, quantity });
    
    if (!sessionId) {
      throw new Error('Cart not initialized');
    }
  
    const previousItems = [...items];
    
    try {
      setItemLoading(cartItemId, true);
      setError(null);
  
      console.log('Making API request with:', {
        sessionId,
        cartItemId,
        quantity
      });
  
      const data = await fetchWithErrorHandling('/api/cart/update', {
        method: 'PUT',
        body: JSON.stringify({ sessionId, cartItemId, quantity })
      });
  
      console.log('Received API response:', data);
  
      if (data.items) {
        setItems(data.items);
      }
    } catch (err) {
      console.error('Update failed:', err);
      setItems(previousItems);
      throw err;
    } finally {
      setItemLoading(cartItemId, false);
    }
  };

  const clearCart = async () => {
    if (!sessionId) {
      setError('Cart not initialized');
      return;
    }

    logDebug('Clearing cart');
    
    try {
      setError(null);
      
      // Store current state for potential rollback
      const previousItems = [...items];
      
      // Optimistic update
      setItems([]);

      // Sync with backend
      await fetchWithErrorHandling('/api/cart/clear', {
        method: 'DELETE',
        body: JSON.stringify({ sessionId })
      });
      
      logDebug('Cart cleared successfully');
    } catch (err) {
      logDebug('Clear cart error', err);
      // Rollback on error
      setItems(previousItems);
      setError(err instanceof Error ? err.message : 'Failed to clear cart');
      throw err;
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

  // Log state changes in development
  useEffect(() => {
    logDebug('Cart state updated', { items, total });
  }, [items, total]);

  // Don't render until cart is initialized
  if (!isInitialized) {
    return null;
  }

  return (
    <CartContext.Provider 
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        loadingItems,
        error
      }}
      data-testid="cart-provider"
    >
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

const removeFromCart = async (cartItemId: string) => {
  try {
    // Store previous items before removal
    const previousItems = [...items];
    
    // Optimistically update UI
    setItems(items.filter(item => item.cart_item_id !== cartItemId));

    const response = await fetchWithErrorHandling(
      `/api/cart/remove?sessionId=${sessionId}&cartItemId=${cartItemId}`,
      {
        method: "DELETE"
      }
    );

    if (!response?.items) {
      // Revert to previous state if API call fails
      setItems(previousItems);
      throw new Error("Failed to remove item from cart");
    }

    // Update with server response
    setItems(response.items);
    toast.success("Item removed from cart");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Failed to remove item");
    console.error("Failed to remove item from cart:", error);
  }
};