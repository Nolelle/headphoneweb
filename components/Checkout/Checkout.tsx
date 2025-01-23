"use client";
import React, { useState } from 'react';
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Separator } from "../ui/separator";

const Checkout = () => {
    // Sample cart items - in a real app, these would likely come from a cart context or store
    const cartItems = [
        { id: 1, name: "Product 1", price: 100, quantity: 2 },
        { id: 2, name: "Product 2", price: 50, quantity: 1 },
    ];

    // Calculate total using reduce
    const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    // Form state management
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        address: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
    });

    // Handle form field changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Processing payment...', { formData, cartItems, total });
        // Stripe integration would go here
    };

    return (
        <div className="min-h-screen bg-[hsl(0_0%_3.9%)] text-[hsl(0_0%_98%)]">
            <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold mb-8 text-center md:text-left">Checkout</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Checkout Form Section */}
                    <Card className="bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)]">
                        <CardHeader>
                            <CardTitle>Shipping & Payment Details</CardTitle>
                            <CardDescription className="text-[hsl(0_0%_63.9%)]">
                                Enter your information to complete the purchase
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Personal Information */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="John Doe"
                                            className="bg-[hsl(0_0%_3.9%)] border-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)] placeholder:text-[hsl(0_0%_63.9%)]"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="john@example.com"
                                            className="bg-[hsl(0_0%_3.9%)] border-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)] placeholder:text-[hsl(0_0%_63.9%)]"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">Shipping Address</Label>
                                        <Input
                                            id="address"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            placeholder="123 Main St, City, Country"
                                            className="bg-[hsl(0_0%_3.9%)] border-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)] placeholder:text-[hsl(0_0%_63.9%)]"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Payment Information */}
                                <div className="space-y-4">
                                    <Separator className="my-4" />
                                    <h3 className="text-lg font-semibold">Payment Information</h3>

                                    <div className="space-y-2">
                                        <Label htmlFor="cardNumber">Card Number</Label>
                                        <Input
                                            id="cardNumber"
                                            name="cardNumber"
                                            value={formData.cardNumber}
                                            onChange={handleChange}
                                            placeholder="1234 5678 9012 3456"
                                            className="bg-[hsl(0_0%_3.9%)] border-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)] placeholder:text-[hsl(0_0%_63.9%)]"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="expiryDate">Expiry Date</Label>
                                            <Input
                                                id="expiryDate"
                                                name="expiryDate"
                                                value={formData.expiryDate}
                                                onChange={handleChange}
                                                placeholder="MM/YY"
                                                className="bg-[hsl(0_0%_3.9%)] border-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)] placeholder:text-[hsl(0_0%_63.9%)]"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="cvv">CVV</Label>
                                            <Input
                                                id="cvv"
                                                name="cvv"
                                                value={formData.cvv}
                                                onChange={handleChange}
                                                placeholder="123"
                                                className="bg-[hsl(0_0%_3.9%)] border-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)] placeholder:text-[hsl(0_0%_63.9%)]"
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
                                    Pay ${total}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Order Summary Section */}
                    <div className="space-y-6">
                        <Card className="bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)]">
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Cart Items */}
                                {cartItems.map((item) => (
                                    <div 
                                        key={item.id} 
                                        className="flex justify-between items-center p-4 bg-[hsl(0_0%_3.9%)] rounded-lg"
                                    >
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
                                                ${item.price * item.quantity}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {/* Order Totals */}
                                <div className="space-y-3 pt-4">
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                        <span className="text-[hsl(0_0%_63.9%)]">Subtotal</span>
                                        <span>${total}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[hsl(0_0%_63.9%)]">Shipping</span>
                                        <span>Free</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold">Total</span>
                                        <span className="text-lg font-bold text-[hsl(220_70%_50%)]">
                                            ${total}
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