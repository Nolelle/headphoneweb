"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { AspectRatio } from "../ui/aspect-ratio";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Separator } from "../ui/separator";
import { useCart } from "../Cart/CartContext";

const Checkout = () => {
  // Use cart context instead of hardcoded items
  const { cartItem } = useCart();

  // Transform cart item into array format expected by the component
  const cartItems = cartItem
    ? [
        {
          id: cartItem.id,
          name: cartItem.name,
          price: cartItem.price,
          quantity: cartItem.quantity,
          image: cartItem.image,
        },
      ]
    : [];

  // Calculate total from cart items
  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Processing payment...", { formData, cartItems, total });
  };

  // Common input class for consistent styling
  const inputClassName =
    "bg-[hsl(0_0%_3.9%)] border-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)] placeholder:text-[hsl(0_0%_63.9%)] focus:ring-[hsl(220_70%_50%)] focus:border-[hsl(220_70%_50%)]";

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8 text-center md:text-left">
          Checkout
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form Section */}
          <Card className="bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)]">
            <CardHeader>
              <CardTitle className="text-[hsl(0_0%_98%)]">
                Shipping & Payment Details
              </CardTitle>
              <CardDescription className="text-[hsl(0_0%_63.9%)]">
                Enter your information to complete the purchase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[hsl(0_0%_98%)]">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className={inputClassName}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[hsl(0_0%_98%)]">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className={inputClassName}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-[hsl(0_0%_98%)]">
                      Shipping Address
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="123 Main St, City, Country"
                      className={inputClassName}
                      required
                    />
                  </div>
                </div>

                {/* Payment Information */}
                <div className="space-y-4">
                  <Separator className="my-4" />
                  <h3 className="text-lg font-semibold text-[hsl(0_0%_98%)]">
                    Payment Information
                  </h3>

                  <div className="space-y-2">
                    <Label
                      htmlFor="cardNumber"
                      className="text-[hsl(0_0%_98%)]"
                    >
                      Card Number
                    </Label>
                    <Input
                      id="cardNumber"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleChange}
                      placeholder="1234 5678 9012 3456"
                      className={inputClassName}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="expiryDate"
                        className="text-[hsl(0_0%_98%)]"
                      >
                        Expiry Date
                      </Label>
                      <Input
                        id="expiryDate"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleChange}
                        placeholder="MM/YY"
                        className={inputClassName}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cvv" className="text-[hsl(0_0%_98%)]">
                        CVV
                      </Label>
                      <Input
                        id="cvv"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleChange}
                        placeholder="123"
                        className={inputClassName}
                        required
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[hsl(220_70%_50%)] hover:bg-[hsl(220_70%_45%)] text-[hsl(0_0%_98%)]"
                  size="lg"
                >
                  Pay ${total.toFixed(2)}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Order Summary Section */}
          <div className="space-y-6">
            <Card className="bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)]">
              <CardHeader>
                <CardTitle className="text-[hsl(0_0%_98%)]">
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.length === 0 ? (
                  <p className="text-[hsl(0_0%_63.9%)]">Your cart is empty</p>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 bg-[hsl(0_0%_3.9%)] rounded-lg"
                    >
                      <div className="w-20 flex-shrink-0">
                        <AspectRatio
                          ratio={4 / 3}
                          className="bg-[hsl(0_0%_3.9%)] rounded-md overflow-hidden"
                        >
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 80px, 120px"
                          />
                        </AspectRatio>
                      </div>

                      <div className="flex-grow flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-[hsl(0_0%_98%)]">
                            {item.name}
                          </h3>
                          <p className="text-sm text-[hsl(0_0%_63.9%)]">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[hsl(220_70%_50%)]">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Order Totals */}
                <div className="space-y-3 pt-4">
                  <Separator />
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
                  <Separator />
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
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
