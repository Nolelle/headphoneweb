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
      logDebug(`API Request to ${url}`, options);
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();
      logDebug('API Response', data);

      if (!response.ok) {
        throw new Error(data.error || 'Operation failed');
      }

      return data;
    } catch (err) {
      logDebug('API Error', err);
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
        const cartItems = await response.json();
        
        logDebug('Loaded initial cart items', cartItems);
        setItems(cartItems);
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
      setError('Cart not initialized');
      return;
    }

    logDebug('Adding item', { productId, quantity });
    
    try {
      setItemLoading(productId, true);
      setError(null);

      // Create optimistic update
      const optimisticItem: CartItem = {
        cart_item_id: Date.now(), // Temporary ID
        product_id: productId,
        name: "Bone+ Headphones",
        price: 199.99,
        quantity: quantity,
        stock_quantity: 100,
        image_url: "/h_1.png"
      };

      // Update local state immediately
      setItems(prev => {
        const existingItem = prev.find(item => item.product_id === productId);
        if (existingItem) {
          return prev.map(item =>
            item.product_id === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [...prev, optimisticItem];
      });

      // Sync with backend
      const data = await fetchWithErrorHandling('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ sessionId, productId, quantity })
      });

      if (data.items) {
        setItems(data.items);
      }
      
      logDebug('Item added successfully', data.items);
    } catch (err) {
      logDebug('Add item error', err);
      // Revert optimistic update on error
      setItems(prev => prev.filter(item => item.cart_item_id !== Date.now()));
      setError(err instanceof Error ? err.message : 'Failed to add item');
      throw err; // Re-throw for component handling
    } finally {
      setItemLoading(productId, false);
    }
  };

  // Remove item from cart
  const removeItem = async (cartItemId: number) => {
    if (!sessionId) {
      setError('Cart not initialized');
      return;
    }

    logDebug('Removing item', { cartItemId });
    
    try {
      setItemLoading(cartItemId, true);
      setError(null);

      // Store current state for potential rollback
      const previousItems = [...items];
      
      // Optimistic update
      setItems(items.filter(item => item.cart_item_id !== cartItemId));

      // Sync with backend
      const data = await fetchWithErrorHandling('/api/cart/remove', {
        method: 'DELETE',
        body: JSON.stringify({ sessionId, cartItemId })
      });

      if (data.items) {
        setItems(data.items);
      }
      
      logDebug('Item removed successfully', data.items);
    } catch (err) {
      logDebug('Remove item error', err);
      // Rollback on error
      setItems(previousItems);
      setError(err instanceof Error ? err.message : 'Failed to remove item');
      throw err;
    } finally {
      setItemLoading(cartItemId, false);
    }
  };

  // Update item quantity
  const updateQuantity = async (cartItemId: number, quantity: number) => {
    if (!sessionId) {
      setError('Cart not initialized');
      return;
    }

    if (quantity < 1) {
      setError('Quantity must be at least 1');
      return;
    }

    logDebug('Updating quantity', { cartItemId, quantity });
    
    try {
      setItemLoading(cartItemId, true);
      setError(null);

      // Store current state for potential rollback
      const previousItems = [...items];
      
      // Optimistic update
      setItems(items.map(item =>
        item.cart_item_id === cartItemId
          ? { ...item, quantity }
          : item
      ));

      // Sync with backend
      const data = await fetchWithErrorHandling('/api/cart/update', {
        method: 'PUT',
        body: JSON.stringify({ sessionId, cartItemId, quantity })
      });

      if (data.items) {
        setItems(data.items);
      }
      
      logDebug('Quantity updated successfully', data.items);
    } catch (err) {
      logDebug('Update quantity error', err);
      // Rollback on error
      setItems(previousItems);
      setError(err instanceof Error ? err.message : 'Failed to update quantity');
      throw err;
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