'use client';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/app/lib/stripe';
import { ReactNode } from 'react';

interface StripeProviderProps {
  children: ReactNode;
  options?: any;
}

export function StripeProvider({ children, options }: StripeProviderProps) {
  return (
    <Elements stripe={getStripe()} options={options}>
      {children}
    </Elements>
  );
}