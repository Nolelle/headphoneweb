'use client'
import React, { useState } from 'react';
// import {Separator} from "@/components/ui/separator";

interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
}

const ProductInfo: React.FC = () => {
  // Define the cart state with type annotation
  const [cart, setCart] = useState<Product[]>([]); // cart is an array of Product objects


  // Define the product information
  const product = {
    id: 1,
    name: 'Headphones',
    price: 199.99,
    imageUrl: '/headphone.png',
    description: 'Super Lightweight, Comfortable fit, Long battery life, etc.',
  };

  // Handle adding product to the cart
  const addToCart = () => {
    setCart([...cart, product]);
    console.log('Product added to cart:', product);
  };

  return (
    <div className='bg-base-200'>
      <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
          Product Information
        </h2>
      <div className='flex'>
          <img src="/headphone.png" alt="Headphones" height={30} width={400} className='-mb-20' />
          <ul className='list-disc'>
            <li className='text-3xl tracking-tight font-extrabold text-gray-900 dark:text-white mt-20 mb-3 -ml-6 list-none'>Features</li>
            <li className='text-2xl font-sans font-bold'>Super Lightweight</li>
            {/* <Separator className="my-4" /> */}

            <li className='text-2xl font-sans font-bold'>Comfortable fit</li>
            {/* <Separator className="my-4" /> */}

            <li className='text-2xl font-sans font-bold'>Long battery life</li>
            {/* <Separator className="my-4" /> */}

            <li className='text-2xl font-sans font-bold'>Noise cancellation</li>
            {/* <Separator className="my-4" /> */}

            <li className='text-2xl font-sans font-bold'>Bluetooth support</li>
            {/* <Separator className="my-4" /> */}

            <li className='text-2xl font-sans font-bold'>Personalised audio spectrum</li>
            {/* <Separator className="my-4" /> */}

            <li className='text-2xl font-sans font-bold'>Make a different preset for different environment</li>
          </ul>
      </div>
      <br />
      
      <button id='' className="btn btn-primary mt-10 ml-5" onClick={addToCart}>Add to cart</button>
      <ul className='list-disc ml-10'>
        <li className='text-3xl tracking-tight font-extrabold text-gray-900 dark:text-white mt-20 mb-3 -ml-6' >Specifications</li>
        <li className='text-2xl font-sans font-bold'>Product dimensions: #cm * #cm / #in * #in</li>
        <li className='text-2xl font-sans font-bold'>Product weight: #gms / #lbs </li>
        <li className='text-2xl font-sans font-bold'>Unit count: 1.00</li>
      </ul>
    </div>
  )
}

export default ProductInfo