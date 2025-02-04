import React from 'react';
import Link from 'next/link';

const PaymentSuccessPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-green-600">Payment Successful!</h1>
        <p className="text-gray-600">Thank you for your purchase.</p>
        <Link href="/" className="btn btn-primary">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;