"use client"
import React, { useState } from 'react';

const Checkout = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        address: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Processing payment...', formData);
        // Add Stripe integration here
    };

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-grow container mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6">Checkout</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        type="text" 
                        name="name" 
                        placeholder="Full Name" 
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                    <input 
                        type="email" 
                        name="email" 
                        placeholder="Email" 
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                    <input 
                        type="text" 
                        name="address" 
                        placeholder="Shipping Address" 
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                    <input 
                        type="text" 
                        name="cardNumber" 
                        placeholder="Card Number" 
                        value={formData.cardNumber}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                    <input 
                        type="text" 
                        name="expiryDate" 
                        placeholder="MM/YY" 
                        value={formData.expiryDate}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                    <input 
                        type="text" 
                        name="cvv" 
                        placeholder="CVV" 
                        value={formData.cvv}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Pay Now</button>
                </form>
            </main>
        </div>
    );
};

export default Checkout;
