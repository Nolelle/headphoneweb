"use client";
import Link from "next/link";
import React from "react";

const Cart = () => {
  const cartItems = [
    { id: 1, name: "Product 1", price: 100, quantity: 2 },
    { id: 2, name: "Product 2", price: 50, quantity: 1 },
  ];

  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-base-200 text-gray-900">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-5xl font-bold text-center text-primary mb-12">
          Your Shopping Cart
        </h1>
        {cartItems.length === 0 ? (
          <p className="text-center text-lg text-gray-700">Your cart is empty.</p>
        ) : (
          <div className="space-y-6">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-6 bg-base-100 shadow-lg rounded-lg"
              >
                <div>
                  <h2 className="text-2xl font-bold text-accent">{item.name}</h2>
                  <p className="text-gray-500">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    ${item.price * item.quantity}
                  </p>
                </div>
              </div>
            ))}
            <div className="text-right mt-8">
              <h2 className="text-3xl font-bold text-secondary">
                Total: ${total}
              </h2>
              <Link href="/checkout" className="btn btn-lg mt-6">
                Proceed to Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
