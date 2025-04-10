"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Package,
  CreditCard,
  Mail
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { useCart } from "@/app/components/Cart/CartContext";

// Define types for our order data
interface OrderItem {
  name: string;
  quantity: number;
  price_at_time: number;
  image_url: string;
}

interface OrderDetails {
  order_id: number;
  total_price: number;
  status: string;
  payment_status: string;
  stripe_status: string;
  email: string;
  items: OrderItem[];
  created_at: string;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  console.log("Payment success page attempting to load");

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [verificationInProgress, setVerificationInProgress] = useState(false);

  // Get URL parameters from Stripe redirect
  const paymentIntent = searchParams.get("payment_intent");

  // Function to verify payment with retries
  const verifyPayment = useCallback(async () => {
    if (verificationInProgress) return;
    if (orderDetails) {
      console.log("Payment already verified, skipping verification");
      return;
    }

    try {
      setVerificationInProgress(true);
      setIsLoading(true);

      if (!paymentIntent) {
        throw new Error("No payment intent found");
      }

      console.log(
        `Verifying payment (attempt ${retryCount + 1}): ${paymentIntent}`
      );

      // Call our payment verification API
      const response = await fetch(
        `/api/payment-verify?payment_intent=${paymentIntent}`
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404 && retryCount < 3) {
          // Order not found but still retries left - could be a timing issue with the webhook
          console.log("Order not found, will retry verification");
          setRetryCount((prevCount) => prevCount + 1);
          return; // Will trigger another retry via useEffect
        }

        throw new Error(data.error || "Failed to verify payment");
      }

      if (data.success) {
        console.log("Payment verification successful:", data.order.order_id);
        const order = data.order;
        // Convert total_price to a number in case it's returned as a string
        order.total_price = Number(order.total_price);

        setOrderDetails(order);

        // Only clear cart if payment was successful
        if (order.stripe_status === "succeeded") {
          try {
            await clearCart();
            console.log("Cart cleared successfully");
          } catch (clearError) {
            console.error("Failed to clear cart:", clearError);
            // Continue despite cart clear failure
          }
        }
      } else {
        throw new Error(data.error || "Payment verification failed");
      }
    } catch (err) {
      console.error("Payment verification error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
      setVerificationInProgress(false);
    }
  }, [
    clearCart,
    paymentIntent,
    retryCount,
    verificationInProgress,
    orderDetails
  ]);

  // Manual retry function for user-initiated retries
  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    verifyPayment();
  };

  useEffect(() => {
    // Only run verification if not already verified and not too many retries
    if (!orderDetails && !error && retryCount < 4) {
      // Add a delay that increases with each retry to allow for webhook processing
      const timer = setTimeout(() => {
        verifyPayment();
      }, 2000 + retryCount * 1500); // Increasing delay for each retry

      return () => clearTimeout(timer);
    }
  }, [paymentIntent, retryCount, verifyPayment, orderDetails, error]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(0_0%_3.9%)] flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)]">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-16 w-16 animate-spin text-[hsl(220_70%_50%)]" />
            <p className="mt-4 text-[hsl(0_0%_98%)]">
              {retryCount > 0
                ? `Verifying your payment (attempt ${retryCount + 1})...`
                : "Verifying your payment..."}
            </p>
            {retryCount > 0 && (
              <p className="mt-2 text-sm text-[hsl(0_0%_63.9%)]">
                This is taking longer than expected. Please wait...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !orderDetails) {
    return (
      <div className="min-h-screen bg-[hsl(0_0%_3.9%)] flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)]">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-[hsl(0_0%_98%)]">
              Payment Verification Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-[hsl(0_0%_63.9%)]">
              {error ||
                "We couldn't verify your payment. Please contact support."}
            </p>
            {error?.includes("Order not found") && (
              <p className="mt-4 text-sm text-[hsl(0_0%_83.9%)]">
                Your payment may have been processed, but we&apos;re having
                trouble locating your order details. Rest assured, if your
                payment was successful, your order is being processed.
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Link href="/">
              <Button className="bg-[hsl(220_70%_50%)] hover:bg-[hsl(220_70%_45%)] text-[hsl(0_0%_98%)]">
                Return to Home
              </Button>
            </Link>
            {error?.includes("Order not found") && (
              <Button
                onClick={handleRetry}
                disabled={verificationInProgress}
                className="bg-[hsl(140_40%_40%)] hover:bg-[hsl(140_40%_35%)] text-[hsl(0_0%_98%)]"
              >
                {verificationInProgress ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking
                  </>
                ) : (
                  "Try Again"
                )}
              </Button>
            )}
            <Link href="/cart">
              <Button
                variant="outline"
                className="border-[hsl(220_70%_50%)] text-[hsl(220_70%_50%)] hover:bg-[hsl(220_70%_50%)] hover:text-[hsl(0_0%_98%)]"
              >
                View Cart
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const isSuccess = orderDetails.stripe_status === "succeeded";
  const orderDate = new Date(orderDetails.created_at).toLocaleDateString();

  // Success/Failure state
  return (
    <div className="min-h-screen bg-[hsl(0_0%_3.9%)] py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Status Card */}
        <Card className="bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)]">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              {isSuccess ? (
                <CheckCircle className="h-16 w-16 text-green-500" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-[hsl(0_0%_98%)]">
              {isSuccess ? "Payment Successful!" : "Payment Failed"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Order Summary */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[hsl(0_0%_98%)]">
                <Package className="h-5 w-5" />
                <span className="font-semibold">Order Summary</span>
              </div>

              <div className="space-y-3">
                {orderDetails.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between text-[hsl(0_0%_63.9%)]"
                  >
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>
                      ${(item.price_at_time * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}

                <Separator className="my-2 bg-[hsl(0_0%_9%)]" />

                <div className="flex justify-between font-bold text-[hsl(0_0%_98%)]">
                  <span>Total</span>
                  <span>${orderDetails.total_price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[hsl(0_0%_98%)]">
                <CreditCard className="h-5 w-5" />
                <span className="font-semibold">Order Details</span>
              </div>

              <div className="space-y-2 text-[hsl(0_0%_63.9%)]">
                <div className="flex justify-between">
                  <span>Order Number</span>
                  <span className="text-[hsl(0_0%_98%)]">
                    #{orderDetails.order_id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Date</span>
                  <span className="text-[hsl(0_0%_98%)]">{orderDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Status</span>
                  <span
                    className={isSuccess ? "text-green-500" : "text-red-500"}
                  >
                    {isSuccess ? "Paid" : "Failed"}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[hsl(0_0%_98%)]">
                <Mail className="h-5 w-5" />
                <span className="font-semibold">Contact Information</span>
              </div>

              <p className="text-[hsl(0_0%_63.9%)]">
                A confirmation email has been sent to {orderDetails.email}
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex justify-center gap-4">
            <Link href="/">
              <Button className="bg-[hsl(220_70%_50%)] hover:bg-[hsl(220_70%_45%)] text-[hsl(0_0%_98%)]">
                Continue Shopping
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
