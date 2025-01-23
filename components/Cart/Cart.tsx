"use client";
import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Separator } from "../ui/separator";

const Cart = () => {
  const cartItems = [
    { id: 1, name: "Product 1", price: 100, quantity: 2 },
    { id: 2, name: "Product 2", price: 50, quantity: 1 },
  ];

  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-[hsl(0_0%_3.9%)] text-[hsl(0_0%_98%)]">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-12">
          Your Shopping Cart
        </h1>

        {cartItems.length === 0 ? (
          <Card className="max-w-md mx-auto bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)]">
            <CardContent className="pt-6">
              <p className="text-center text-lg text-[hsl(0_0%_63.9%)]">
                Your cart is empty.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {cartItems.map((item) => (
              <Card 
                key={item.id} 
                className="bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)]"
              >
                <CardContent className="flex justify-between items-center p-6">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-[hsl(0_0%_98%)]">
                      {item.name}
                    </h2>
                    <p className="text-[hsl(0_0%_63.9%)]">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[hsl(220_70%_50%)]">
                      ${item.price * item.quantity}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="mt-8 bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)]">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[hsl(0_0%_63.9%)]">Subtotal</span>
                    <span className="text-[hsl(0_0%_98%)]">${total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[hsl(0_0%_63.9%)]">Shipping</span>
                    <span className="text-[hsl(0_0%_98%)]">Free</span>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-[hsl(0_0%_98%)]">Total</span>
                    <span className="text-xl font-bold text-[hsl(220_70%_50%)]">
                      ${total}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Link href="/checkout" className="w-full">
                  <Button 
                    className="w-full bg-[hsl(220_70%_50%)] hover:bg-[hsl(220_70%_45%)] text-[hsl(0_0%_98%)]"
                    size="lg"
                  >
                    Proceed to Checkout
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;