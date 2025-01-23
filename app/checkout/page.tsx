import React from 'react';
import Checkout from '../components/Checkout/Checkout';

export default function CheckoutPage() {
    return (
        // Remove the container class from here to prevent unwanted margins
        // Add bg-[hsl(0_0%_3.9%)] to ensure consistent dark background
        <div className="min-h-screen flex flex-col bg-[hsl(0_0%_3.9%)]">
            {/* Add px-0 to remove horizontal padding at small screens */}
            <main className="flex-grow w-full">
                {/* Move container class to an inner div for proper content width control */}
                <div className="container mx-auto px-4 md:px-6 py-6">
                    <Checkout />
                </div>
            </main>
        </div>
    );
}