import React from 'react';
import Checkout from './../components/Checkout/Checkout';

export default function CheckoutPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-grow container mx-auto p-6">
                <Checkout />
            </main>
        </div>
    );
}
