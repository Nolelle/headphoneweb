// components/Checkout/CheckoutForm.tsx
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
  onPaymentSuccess: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onPaymentSuccess }) => {
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

      // Payment successful - redirect handled by return_url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Payment Form Section */}
      <Card className="bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)]">
        <CardHeader>
          <CardTitle className="text-[hsl(0_0%_98%)] flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Secure Checkout
          </CardTitle>
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
                  required
                  className="bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)]"
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
                  required
                  className="bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-[hsl(0_0%_98%)]">
                  Address
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)]"
                />
              </div>
            </div>

            {/* Stripe Payment Element */}
            <div className="space-y-4">
              <Label className="text-[hsl(0_0%_98%)]">Card Details</Label>
              <PaymentElement />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isLoading || !stripe || !elements}
              className="w-full bg-[hsl(220_70%_50%)] hover:bg-[hsl(220_70%_45%)] text-[hsl(0_0%_98%)]"
            >
              {isLoading ? "Processing..." : `Pay $${total.toFixed(2)}`}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Order Summary Section */}
      <Card className="bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)]">
        <CardHeader>
          <CardTitle className="text-[hsl(0_0%_98%)]">Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.cart_item_id} className="flex justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[hsl(0_0%_98%)]">{item.name}</span>
                  <span className="text-[hsl(0_0%_63.9%)]">x{item.quantity}</span>
                </div>
                <span className="text-[hsl(0_0%_98%)]">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            
            <Separator className="my-4" />
            
            <div className="flex justify-between text-lg font-bold">
              <span className="text-[hsl(0_0%_98%)]">Total</span>
              <span className="text-[hsl(220_70%_50%)]">
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