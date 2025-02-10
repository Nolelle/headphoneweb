"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { CartItem, CartResponse } from "./CartTypes";

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

const CartContext = createContext<CartContextType | undefined>(undefined);

const SESSION_ID_KEY = 'cart_session_id';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loadingItems, setLoadingItems] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize session ID and load cart data
  useEffect(() => {
    const initializeCart = async () => {
      try {
        // Get existing session ID from localStorage or create new one
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

  // Helper to manage loading state
  const setItemLoading = (itemId: number, loading: boolean) => {
    setLoadingItems(prev => ({ ...prev, [itemId]: loading }));
  };

  // Helper for making API requests
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Operation failed');
      }

      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  const addItem = async (productId: number, quantity: number) => {
    if (!sessionId) {
      setError('Cart not initialized');
      return;
    }

    try {
      setItemLoading(productId, true);
      setError(null);
      
      const existingItem = items.find(item => item.product_id === productId);
      if (existingItem) {
        setItems(items.map(item =>
          item.product_id === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ));
      } else {
        const newItem: CartItem = {
          cart_item_id: items.length + 1,
          product_id: productId,
          name: "Bone+ Headphones",
          price: 199.99,
          quantity: quantity,
          stock_quantity: 100,
          image_url: "/images/test-product.webp"
        };
        setItems([...items, newItem]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setItemLoading(productId, false);
    }
  };

  const removeItem = async (cartItemId: number) => {
    if (!sessionId) {
      setError('Cart not initialized');
      return;
    }

    try {
      setItemLoading(cartItemId, true);
      setError(null);
      
      const data = await fetchWithErrorHandling('/api/cart/remove', {
        method: 'DELETE',
        body: JSON.stringify({ sessionId, cartItemId })
      });

      if (data.items) {
        setItems(data.items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
    } finally {
      setItemLoading(cartItemId, false);
    }
  };

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
      
      const data = await fetchWithErrorHandling('/api/cart/update', {
        method: 'PUT',
        body: JSON.stringify({ sessionId, cartItemId, quantity })
      });

      if (data.items) {
        setItems(data.items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quantity');
    } finally {
      setItemLoading(cartItemId, false);
    }
  };

  const clearCart = async () => {
    if (!sessionId) {
      setError('Cart not initialized');
      return;
    }

    try {
      setError(null);
      
      await fetchWithErrorHandling('/api/cart/clear', {
        method: 'DELETE',
        body: JSON.stringify({ sessionId })
      });

      setItems([]);
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

  // Provide loading state while cart is initializing
  if (!isInitialized) {
    return null; // Or a loading spinner component
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

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}