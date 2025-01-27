// CartContext.tsx
"use client";
import React, { createContext, useContext, useState } from "react";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  maxQuantity: number;
  image: string;
}

interface CartContextType {
  cartItem: CartItem;
  increaseQuantity: () => void;
  decreaseQuantity: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItem, setCartItem] = useState<CartItem>({
    id: 1,
    name: "QuietComfort Headphones",
    price: 299.99,
    quantity: 1,
    maxQuantity: 10,
    image: "/QuietComfort Black 400x300.webp",
  });

  const total = cartItem.price * cartItem.quantity;

  const increaseQuantity = () => {
    if (cartItem.quantity < cartItem.maxQuantity) {
      setCartItem((prev) => ({
        ...prev,
        quantity: prev.quantity + 1,
      }));
    }
  };

  const decreaseQuantity = () => {
    if (cartItem.quantity > 1) {
      setCartItem((prev) => ({
        ...prev,
        quantity: prev.quantity - 1,
      }));
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItem,
        increaseQuantity,
        decreaseQuantity,
        total,
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
