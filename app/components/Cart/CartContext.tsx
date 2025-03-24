"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

// Define the cart item type (adjust as needed based on your actual data structure)
interface CartItem {
  cart_item_id: string;
  product_id: number;
  quantity: number;
  price: number;
  name: string;
  stock_quantity: number;
  image_url: string;
}

interface CartResponse {
  items: CartItem[];
  total?: number;
  error?: string;
}

// Define the shape of the cart context
interface CartContextType {
  items: CartItem[];
  addItem: (productId: number, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  total: number;
  loadingItems: Record<string, boolean>;
  error: string | null;
  isLoading: boolean; // Added loading state
}

// Create the context with undefined default value
const CartContext = createContext<CartContextType | undefined>(undefined);

// Key for storing session ID in localStorage
const SESSION_ID_KEY = "cart_session_id";

export function CartProvider({ children }: { children: React.ReactNode }) {
  // State management
  const [items, setItems] = useState<CartItem[]>([]);
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Initialize as true

  // Debug logging function - only active in development
  const logDebug = (action: string, details?: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[CartContext] ${action}:`, details || "");
    }
  };

  // Helper to manage loading state for individual items
  const setItemLoading = (itemId: string, loading: boolean) => {
    setLoadingItems((prev) => ({ ...prev, [itemId]: loading }));
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
          "Content-Type": "application/json",
          ...options.headers
        }
      });

      const responseText = await response.text();
      let data: CartResponse;
      try {
        data = responseText ? JSON.parse(responseText) : { items: [] };
      } catch {
        console.error("JSON Parse Error:", {
          responseText,
          status: response.status,
          url: response.url
        });
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        throw new Error(data?.error || `Server error: ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error("API Error:", {
        url,
        error: err,
        method: options.method
      });
      throw new Error(err instanceof Error ? err.message : "Operation failed");
    }
  };

  // Initialize cart and load existing items
  useEffect(() => {
    const initializeCart = async () => {
      setIsLoading(true); // Start loading
      try {
        logDebug("Initializing cart");

        // Get existing session ID or create new one
        let currentSessionId = localStorage.getItem(SESSION_ID_KEY);
        if (!currentSessionId) {
          currentSessionId = uuidv4();
          localStorage.setItem(SESSION_ID_KEY, currentSessionId);
          logDebug("Created new session ID", currentSessionId);
        }

        setSessionId(currentSessionId);

        // Fetch existing cart items
        const data = await fetchWithErrorHandling(
          `/api/cart?sessionId=${currentSessionId}`,
          { method: "GET" }
        );

        logDebug("Loaded initial cart items", data);
        setItems(data.items || []);
      } catch (err) {
        logDebug("Initialization error", err);
        setError(
          err instanceof Error ? err.message : "Failed to initialize cart"
        );
      } finally {
        setIsLoading(false); // Done loading
        setIsInitialized(true);
      }
    };

    if (!isInitialized) {
      initializeCart();
    }
  }, [isInitialized]);

  // Calculate total price of items in cart
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Add item to cart
  const addItem = async (productId: number, quantity: number) => {
    if (!sessionId) {
      throw new Error("Cart not initialized");
    }

    const tempId = uuidv4(); // Temporary ID until server response
    try {
      setItemLoading(tempId, true);
      setError(null);

      const data = await fetchWithErrorHandling("/api/cart", {
        method: "POST",
        body: JSON.stringify({ sessionId, productId, quantity })
      });

      if (data.items) {
        setItems(data.items);
        toast.success("Item added to cart");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item");
      throw err;
    } finally {
      setItemLoading(tempId, false);
    }
  };

  // Remove item from cart
  const removeItem = async (cartItemId: string) => {
    if (!sessionId) {
      toast.error("Cart not initialized");
      return;
    }

    try {
      setItemLoading(cartItemId, true);
      setError(null);

      // Optimistic update
      setItems(items.filter((item) => item.cart_item_id !== cartItemId));

      const data = await fetchWithErrorHandling(
        `/api/cart/remove?sessionId=${sessionId}&cartItemId=${cartItemId}`,
        { method: "DELETE" }
      );

      if (data.items) {
        setItems(data.items);
        toast.success("Item removed from cart");
      }
    } catch (err) {
      logDebug("Remove item error", err);
      // Fetch current cart state on error instead of using previousItems
      fetchWithErrorHandling(`/api/cart?sessionId=${sessionId}`, {
        method: "GET"
      }).then((data) => setItems(data.items || []));
      toast.error(err instanceof Error ? err.message : "Failed to remove item");
      throw err;
    } finally {
      setItemLoading(cartItemId, false);
    }
  };

  // Update item quantity
  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (!sessionId) {
      throw new Error("Cart not initialized");
    }

    try {
      setItemLoading(cartItemId, true);
      setError(null);

      const data = await fetchWithErrorHandling("/api/cart/update", {
        method: "PUT",
        body: JSON.stringify({ sessionId, cartItemId, quantity })
      });

      if (data.items) {
        setItems(data.items);
      }
    } catch (err) {
      console.error("Update failed:", err);
      // Fetch current cart state on error
      fetchWithErrorHandling(`/api/cart?sessionId=${sessionId}`, {
        method: "GET"
      }).then((data) => setItems(data.items || []));
      throw err;
    } finally {
      setItemLoading(cartItemId, false);
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!sessionId) {
      setError("Cart not initialized");
      return;
    }

    logDebug("Clearing cart");
    try {
      setError(null);
      setItems([]); // Optimistic update

      await fetchWithErrorHandling("/api/cart/clear", {
        method: "DELETE",
        body: JSON.stringify({ sessionId })
      });

      logDebug("Cart cleared successfully");
    } catch (err) {
      logDebug("Clear cart error", err);
      // Fetch current cart state on error
      fetchWithErrorHandling(`/api/cart?sessionId=${sessionId}`, {
        method: "GET"
      }).then((data) => setItems(data.items || []));
      setError(err instanceof Error ? err.message : "Failed to clear cart");
      throw err;
    }
  };

  // Clean up session when user leaves
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem(SESSION_ID_KEY);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Log state changes in development
  useEffect(() => {
    logDebug("Cart state updated", { items, total });
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
        error,
        isLoading // Expose loading state
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
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
