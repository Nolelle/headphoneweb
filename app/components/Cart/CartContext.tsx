"use client";
import React, { createContext, useContext, useState } from "react";

export interface CartItem {
  cart_item_id: number;
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  stock_quantity: number;
  image_url: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (productId: number, quantity: number) => Promise<void>;
  removeItem: (cartItemId: number) => Promise<void>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  total: number;
  loadingItems: Record<number, boolean>; // Track loading state per item
  error: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Hardcoded test items based on your seed data
const testItems: CartItem[] = [
  {
    cart_item_id: 1,
    product_id: 1,
    name: "QuietComfort 45",
    price: 299.99,
    quantity: 1,
    stock_quantity: 50,
    image_url: "/images/qc45-black.webp"
  },
  {
    cart_item_id: 2,
    product_id: 2,
    name: "SoundSport Wireless",
    price: 129.99,
    quantity: 2,
    stock_quantity: 75,
    image_url: "/images/soundsport-blue.webp"
  },
  {
    cart_item_id: 3,
    product_id: 3,
    name: "Studio Pro",
    price: 349.99,
    quantity: 1,
    stock_quantity: 25,
    image_url: "/images/studio-pro-silver.webp"
  }
];

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(testItems);
  const [loadingItems, setLoadingItems] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // Calculate total price
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Helper to manage loading state for specific items
  const setItemLoading = (itemId: number, loading: boolean) => {
    setLoadingItems(prev => ({
      ...prev,
      [itemId]: loading
    }));
  };

  const addItem = async (productId: number, quantity: number) => {
    try {
      setItemLoading(productId, true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
      setError(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setItemLoading(productId, false);
    }
  };

  const removeItem = async (cartItemId: number) => {
    try {
      setItemLoading(cartItemId, true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setItems(items.filter(item => item.cart_item_id !== cartItemId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove item");
    } finally {
      setItemLoading(cartItemId, false);
    }
  };

  const updateQuantity = async (cartItemId: number, quantity: number) => {
    try {
      setItemLoading(cartItemId, true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setItems(items.map(item =>
        item.cart_item_id === cartItemId
          ? { ...item, quantity }
          : item
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update quantity");
    } finally {
      setItemLoading(cartItemId, false);
    }
  };

  const clearCart = async () => {
    try {
      // For clear cart, we don't need item-specific loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      setItems([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear cart");
    }
  };

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
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}