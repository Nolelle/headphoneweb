"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { ErrorBoundary } from "../ErrorBoundary";

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

// Helper function to safely get or create a session ID
const getOrCreateSessionId = (): string => {
  try {
    let sessionId = localStorage.getItem(SESSION_ID_KEY);

    // Check if the retrieved sessionId is valid
    if (
      !sessionId ||
      sessionId.trim() === "" ||
      sessionId === "null" ||
      sessionId === "undefined"
    ) {
      // Generate new UUID and store it
      sessionId = uuidv4();
      localStorage.setItem(SESSION_ID_KEY, sessionId);
      if (process.env.NODE_ENV !== "test") {
        console.log(
          "[CartContext] Created new session ID:",
          sessionId.substring(0, 8) + "..."
        );
      }
    } else {
      if (process.env.NODE_ENV !== "test") {
        console.log(
          "[CartContext] Using existing session ID:",
          sessionId.substring(0, 8) + "..."
        );
      }
    }

    return sessionId;
  } catch (error) {
    // If localStorage fails, generate a temporary session ID
    if (process.env.NODE_ENV !== "test") {
      console.error("[CartContext] Error accessing localStorage:", error);
    }
    return uuidv4();
  }
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  // State management
  const [items, setItems] = useState<CartItem[]>([]);
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Initialize as true

  // Debug logging function - not active in test environment
  const logDebug = (action: string, details?: unknown) => {
    if (process.env.NODE_ENV !== "test") {
      console.log(`[CartContext] ${action}:`, details || "");
    }
  };

  // Helper to manage loading state for individual items
  const setItemLoading = (itemId: string, loading: boolean) => {
    setLoadingItems((prev) => ({ ...prev, [itemId]: loading }));
  };

  // Helper for making API requests with error handling
  const fetchWithErrorHandling = useCallback(
    async (url: string, options: RequestInit): Promise<CartResponse> => {
      try {
        logDebug("API Request", { url, method: options.method });

        const response = await fetch(url, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...options.headers
          }
        });

        let responseText = "";
        try {
          responseText = await response.text();
        } catch (textError) {
          console.error("Error reading response text:", textError);
          // Return empty results if we can't even read the response
          return { items: [] };
        }

        logDebug("API Response", {
          url,
          status: response.status,
          responseLength: responseText?.length || 0,
          responsePreview: responseText?.substring(0, 100)
        });

        // Enhanced validation: check response content type before attempting to parse
        const contentType = response.headers.get("content-type");
        if (contentType && !contentType.includes("application/json")) {
          if (process.env.NODE_ENV !== "test") {
            console.warn("Response is not JSON format:", contentType);
          }
          return { items: [] }; // Return empty cart for non-JSON responses
        }

        // Check for empty response
        if (!responseText || responseText.trim() === "") {
          if (process.env.NODE_ENV !== "test") {
            console.warn("Empty response received from server");
          }
          return { items: [] };
        }

        let data: CartResponse;
        try {
          // Simple sanity check before parsing - must start with { and end with }
          if (
            !responseText.trim().startsWith("{") ||
            !responseText.trim().endsWith("}")
          ) {
            if (process.env.NODE_ENV !== "test") {
              console.warn("Response doesn't appear to be JSON object format");
            }
            return { items: [] };
          }

          data = JSON.parse(responseText);

          // Ensure data.items is always an array
          if (!data.items) {
            data.items = [];
          }
        } catch (parseError) {
          if (process.env.NODE_ENV !== "test") {
            console.error("JSON Parse Error:", {
              responseText, // This might be truncated in console
              status: response.status,
              url: response.url,
              contentType: response.headers.get("content-type"),
              parseError:
                parseError instanceof Error
                  ? parseError.message
                  : String(parseError)
            });

            // Add detailed logging of the full response
            console.log("Full response causing parse error:", responseText);

            // Log more details about response characteristics
            console.log("Response analysis:", {
              length: responseText?.length || 0,
              firstChar: responseText?.[0] || "none",
              lastChar: responseText?.[responseText.length - 1] || "none",
              containsHTML:
                responseText?.includes("<!DOCTYPE") ||
                responseText?.includes("<html"),
              containsBOM: responseText?.charCodeAt(0) === 0xfeff,
              isEmptyOrWhitespace: !responseText || /^\s*$/.test(responseText)
            });
          }

          // Recovery mechanism - try to clean up the response text
          if (responseText) {
            try {
              // Check if it's an HTML error page
              if (
                responseText.includes("<!DOCTYPE html>") ||
                responseText.includes("<html>")
              ) {
                if (process.env.NODE_ENV !== "test") {
                  console.warn("Received HTML instead of JSON response");
                }
                return { items: [] };
              }

              // Try to extract a valid JSON object if there's additional text
              const jsonMatch = responseText.match(/\{.*\}/s);
              if (jsonMatch) {
                const extractedJson = jsonMatch[0];
                if (process.env.NODE_ENV !== "test") {
                  console.log(
                    "Attempting to parse extracted JSON:",
                    extractedJson.substring(0, 100)
                  );
                }
                data = JSON.parse(extractedJson);
                // Ensure items property exists
                if (!data.items) {
                  data.items = [];
                }
                return data;
              }
            } catch (secondaryError) {
              if (process.env.NODE_ENV !== "test") {
                console.error("Recovery attempt failed:", secondaryError);
              }
            }
          }

          // If all recovery attempts fail, return empty cart
          if (process.env.NODE_ENV !== "test") {
            console.warn("Using fallback empty response");
          }
          return { items: [] };
        }

        if (!response.ok) {
          // If server returned an error but with valid JSON, ensure items exists
          if (!data.items) {
            data.items = [];
          }
          throw new Error(data?.error || `Server error: ${response.status}`);
        }

        return data;
      } catch (err) {
        if (process.env.NODE_ENV !== "test") {
          console.error("API Error:", {
            url,
            error: err,
            method: options.method,
            online:
              typeof navigator !== "undefined" ? navigator.onLine : "unknown"
          });
        }
        throw new Error(
          err instanceof Error ? err.message : "Operation failed"
        );
      }
    },
    []
  );

  // Helper for retrying failed operations
  const retryOperation = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      retries = 3,
      delay = 300
    ): Promise<T> => {
      let lastError;
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          // Add timeout to prevent hanging requests
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(
              () => {
                reject(
                  new Error(
                    `Operation timed out after ${
                      attempt === 1 ? 5000 : attempt * 3000
                    }ms`
                  )
                );
              },
              attempt === 1 ? 5000 : attempt * 3000
            ); // Increase timeout for subsequent attempts
          });

          // Race the operation against the timeout
          const result = await Promise.race([operation(), timeoutPromise]);
          return result as T;
        } catch (error) {
          lastError = error;
          logDebug(`Attempt ${attempt} failed`, error);

          // Collect more diagnostic information
          if (process.env.NODE_ENV !== "test") {
            console.warn(`Retry attempt ${attempt}/${retries} failed:`, {
              error: error instanceof Error ? error.message : String(error),
              timestamp: new Date().toISOString(),
              isOnline:
                typeof navigator !== "undefined"
                  ? navigator.onLine
                  : "Not in browser"
            });
          }

          if (attempt < retries) {
            // Calculate backoff with jitter to prevent thundering herd
            const jitter = Math.random() * 300;
            const backoff = Math.min(
              delay * Math.pow(1.5, attempt - 1) + jitter,
              10000
            );

            logDebug(`Retrying in ${Math.round(backoff)}ms...`);
            await new Promise((resolve) => setTimeout(resolve, backoff));
          }
        }
      }
      throw lastError;
    },
    []
  );

  // Initialize cart and load existing items
  useEffect(() => {
    const initializeCart = async () => {
      setIsLoading(true); // Start loading
      try {
        // Check if we're on the payment success page
        const isPaymentSuccessPage =
          typeof window !== "undefined" &&
          window.location.pathname.includes("payment-success");

        logDebug(
          `Initializing cart (isPaymentSuccessPage: ${isPaymentSuccessPage})`
        );

        // Get or create session ID using our helper function
        const currentSessionId = getOrCreateSessionId();
        setSessionId(currentSessionId);

        // Add a counter for initialization attempts
        let initAttempt = 0;
        const maxInitAttempts = 2;

        const loadCart = async (): Promise<CartResponse> => {
          initAttempt++;
          logDebug(`Cart initialization attempt ${initAttempt}`);

          try {
            // Fetch existing cart items with retry
            return await retryOperation(() =>
              fetchWithErrorHandling(
                `/api/cart?sessionId=${currentSessionId}`,
                {
                  method: "GET"
                }
              )
            );
          } catch (initError) {
            // Special handling for payment success page
            if (isPaymentSuccessPage) {
              if (process.env.NODE_ENV !== "test") {
                console.log(
                  "On payment success page - using empty cart as expected"
                );
              }
              return { items: [] };
            }

            // If this is our last attempt, use a local fallback
            if (initAttempt >= maxInitAttempts) {
              if (process.env.NODE_ENV !== "test") {
                console.warn(
                  "All cart initialization attempts failed, using empty cart"
                );
              }
              return { items: [] };
            }
            throw initError; // Otherwise let it retry
          }
        };

        // Try to load the cart with fallback
        const data = await loadCart();

        logDebug("Loaded initial cart items", data);
        setItems(data.items || []);

        // On payment success page, we might need to clear the cart
        if (isPaymentSuccessPage && data.items.length > 0) {
          console.log("Payment successful, clearing cart items");
          // Either clear cart here or let the order processing handle it
        }
      } catch (err) {
        logDebug("Initialization error", err);
        // Log additional info about the error
        console.error("Cart initialization failed:", {
          error: err,
          message: err instanceof Error ? err.message : String(err),
          sessionId: sessionId ? `${sessionId.substring(0, 8)}...` : "none",
          isOnline: navigator.onLine,
          timestamp: new Date().toISOString()
        });

        // Set a more user-friendly error
        const errMessage =
          err instanceof Error ? err.message : "Failed to initialize cart";

        // Check for specific types of errors
        const isNetworkError =
          navigator.onLine === false ||
          (err instanceof Error &&
            (err.message.includes("network") ||
              err.message.includes("fetch") ||
              err.message.includes("connection")));

        setError(
          isNetworkError
            ? "Network issue. Please check your connection."
            : errMessage
        );

        // If there's a network issue, we'll use an empty cart for now
        if (isNetworkError) {
          setItems([]);
        }
      } finally {
        setIsLoading(false); // Done loading
        setIsInitialized(true);
      }
    };

    if (!isInitialized) {
      initializeCart();
    }

    // Add a recovery mechanism for when the app comes back online
    const handleOnline = () => {
      if (isInitialized && navigator.onLine) {
        logDebug("Network back online, refreshing cart");
        initializeCart();
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [isInitialized, sessionId, fetchWithErrorHandling, retryOperation]);

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
      if (process.env.NODE_ENV !== "test") {
        console.error("Update failed:", err);
      }
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

// Higher-order component for safer cart provider with error boundary
export function SafeCartProvider({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-orange-50 border border-orange-200 rounded">
          <h3 className="font-medium text-orange-800">Cart system error</h3>
          <p className="text-sm text-orange-700 mt-1">
            There was a problem loading your cart. You can continue shopping but
            some cart features may be limited.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            Refresh
          </button>
        </div>
      }
    >
      <CartProvider>{children}</CartProvider>
    </ErrorBoundary>
  );
}
