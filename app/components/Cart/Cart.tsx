"use client";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter } from "../ui/card";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { AspectRatio } from "../ui/aspect-ratio";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "./CartContext";

const Cart = () => {
  const { cartItem, increaseQuantity, decreaseQuantity, total } = useCart();

  return (
    <div className="min-h-screen bg-[hsl(0_0%_3.9%)]">
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center gap-2 mb-12">
          <ShoppingCart className="h-8 w-8 text-[hsl(0_0%_98%)]" />
          <h1 className="text-4xl md:text-5xl font-bold text-center text-[hsl(0_0%_98%)]">
            Your Shopping Cart
          </h1>
        </div>

        {cartItem ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)]">
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                {/* Product Image */}
                <div className="w-full max-w-[300px] mx-auto md:mx-0">
                  <AspectRatio
                    ratio={4 / 3}
                    className="bg-[hsl(0_0%_3.9%)] rounded-md overflow-hidden"
                  >
                    <Image
                      src={cartItem.image}
                      alt={cartItem.name}
                      width={400}
                      height={300}
                      className="object-cover"
                      priority
                    />
                  </AspectRatio>
                </div>

                {/* Product Details */}
                <div className="space-y-3 md:col-span-2">
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold text-[hsl(0_0%_98%)]">
                      {cartItem.name}
                    </h2>
                    <p className="text-2xl font-bold text-[hsl(220_70%_50%)]">
                      ${(cartItem.price * cartItem.quantity).toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-4">
                    <span className="text-[hsl(0_0%_63.9%)]">Quantity:</span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={decreaseQuantity}
                        disabled={cartItem.quantity <= 1}
                        className="h-8 w-8 bg-transparent border-[hsl(0_0%_14.9%)] hover:bg-[hsl(0_0%_14.9%)] hover:text-[hsl(0_0%_98%)]"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>

                      <Badge
                        variant="secondary"
                        className="h-8 min-w-[2rem] flex items-center justify-center bg-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)]"
                      >
                        {cartItem.quantity}
                      </Badge>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={increaseQuantity}
                        disabled={cartItem.quantity >= cartItem.maxQuantity}
                        className="h-8 w-8 bg-transparent border-[hsl(0_0%_14.9%)] hover:bg-[hsl(0_0%_14.9%)] hover:text-[hsl(0_0%_98%)]"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)]">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[hsl(0_0%_63.9%)]">Subtotal</span>
                    <span className="text-[hsl(0_0%_98%)]">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[hsl(0_0%_63.9%)]">Shipping</span>
                    <span className="text-[hsl(0_0%_98%)]">Free</span>
                  </div>
                  <Separator className="bg-[hsl(0_0%_14.9%)]" />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-[hsl(0_0%_98%)]">
                      Total
                    </span>
                    <span className="text-lg font-bold text-[hsl(220_70%_50%)]">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Link href="/checkout" className="w-full">
                  <Button
                    size="lg"
                    className="w-full bg-[hsl(220_70%_50%)] hover:bg-[hsl(220_70%_45%)] text-[hsl(0_0%_98%)]"
                  >
                    Proceed to Checkout
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <Card className="max-w-3xl mx-auto bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)]">
            <CardContent className="p-6 text-center">
              <p className="text-[hsl(0_0%_63.9%)]">Your cart is empty</p>
              <Link href="/" className="mt-4 inline-block">
                <Button className="bg-[hsl(220_70%_50%)] hover:bg-[hsl(220_70%_45%)] text-[hsl(0_0%_98%)]">
                  Continue Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Cart;
