"use client";
import React, { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { useCart } from "../Cart/CartContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { Lock } from "lucide-react";

interface CheckoutFormProps {
  onSubmit: (email: string) => Promise<void>;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onSubmit }) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { items, total, clearCart } = useCart();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));

  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First create the payment intent with the email
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
          payment_method_data: {
            billing_details: {
              name: formData.name,
              email: formData.email,
              address: {
                line1: formData.address
              }
            }
          }
        }
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
      {/* Payment Form Section */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-50 flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Secure Checkout
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-200">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="bg-gray-800 border-gray-700 text-gray-100 
                    placeholder:text-gray-500 focus:border-blue-500 
                    focus:ring-blue-500 hover:border-gray-600"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-200">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="bg-gray-800 border-gray-700 text-gray-100 
                    placeholder:text-gray-500 focus:border-blue-500 
                    focus:ring-blue-500 hover:border-gray-600"
                  placeholder="Enter your email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-gray-200">
                  Address
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="bg-gray-800 border-gray-700 text-gray-100 
                    placeholder:text-gray-500 focus:border-blue-500 
                    focus:ring-blue-500 hover:border-gray-600"
                  placeholder="Enter your shipping address"
                />
              </div>
            </div>

            {/* Stripe Payment Element */}
            <div className="space-y-4">
              <Label className="text-gray-200">Card Details</Label>
              <div className="bg-gray-800 p-4 rounded-md border border-gray-700">
                <PaymentElement />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-900/50 border border-red-800">
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isLoading || !stripe || !elements}
              className="w-full bg-blue-600 hover:bg-blue-700 text-gray-50 
                disabled:opacity-50 disabled:cursor-not-allowed h-12 font-medium"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-50 border-t-transparent" />
                  Processing...
                </div>
              ) : (
                `Pay $${total.toFixed(2)}`
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Order Summary Section */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-50">Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.cart_item_id} className="flex justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-100">{item.name}</span>
                  <span className="text-gray-400">x{item.quantity}</span>
                </div>
                <span className="text-gray-100">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            
            <Separator className="bg-gray-800" />
            
            <div className="flex justify-between text-lg font-bold">
              <span className="text-gray-50">Total</span>
              <span className="text-blue-500">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    
  );
};

export default CheckoutForm;