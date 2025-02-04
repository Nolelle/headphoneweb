"use client";
import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/stripe-js';
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Card, CardContent } from "../ui/card";

interface CheckoutFormProps {
  clientSecret: string;
  total: number;
  formData: {
    name: string;
    email: string;
    address: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    email: string;
    address: string;
  }>>;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ 
  clientSecret, 
  total, 
  formData, 
  setFormData 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
          payment_method_data: {
            billing_details: {
              name: formData.name,
              email: formData.email,
              address: {
                line1: formData.address,
              },
            },
          },
        },
      });

      if (error) {
        setErrorMessage(error.message || 'An error occurred during payment');
        setLoading(false);
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-[hsl(0_0%_98%)]">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            name="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            required
            className="bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)] placeholder:text-[hsl(0_0%_63.9%)] focus:ring-[hsl(220_70%_50%)] focus:ring-offset-0 focus:border-[hsl(220_70%_50%)]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            name="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            className="bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)] placeholder:text-[hsl(0_0%_63.9%)] focus:ring-[hsl(220_70%_50%)] focus:ring-offset-0 focus:border-[hsl(220_70%_50%)]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Shipping Address</Label>
          <Input
            id="address"
            type="text"
            name="address"
            placeholder="123 Main St, City, Country"
            value={formData.address}
            onChange={handleChange}
            required
            className="bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)] placeholder:text-[hsl(0_0%_63.9%)] focus:ring-[hsl(220_70%_50%)] focus:ring-offset-0 focus:border-[hsl(220_70%_50%)]"
          />
        </div>
      </div>

      <Card className="border-0 shadow-none">
        <CardContent className="p-4 bg-[hsl(0_0%_14.9%)]">
          <PaymentElement className="text-[hsl(0_0%_98%)]" />
        </CardContent>
      </Card>

      {errorMessage && (
        <Alert variant="destructive" className="border-0">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Button 
        type="submit" 
        disabled={!stripe || loading}
        className="w-full bg-[hsl(220_70%_50%)] hover:bg-[hsl(220_70%_45%)] text-[hsl(0_0%_98%)] disabled:opacity-50"
        size="lg"
      >
        {loading ? 'Processing...' : `Pay $${total}`}
      </Button>
    </form>
  );
};

export default CheckoutForm;