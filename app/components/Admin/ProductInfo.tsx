'use client'
import React, { useState } from 'react';
import { Separator } from '@radix-ui/react-dropdown-menu';
import { Carousel } from '@/app/components/ui/carousel';
import { CarouselItem, CarouselContent, CarouselNext, CarouselPrevious } from '@/app/components/ui/carousel';
import { Accordion, AccordionTrigger, AccordionItem, AccordionContent } from '../ui/accordion';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip"
import Image from 'next/image';
import { useCart } from '../Cart/CartContext';
import { toast } from 'sonner';

interface Product {
  product_id: number;
  name: string;
  price: number;
  stock_quantity: number;
  image_url: string;
}

const ProductInfo: React.FC = () => {
  // Get cart context
  const { addItem, items } = useCart();
  
  // State for loading and error handling
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Product details
  const product: Product = {
    product_id: 1,
    name: 'Bone+ Headphone',
    price: 199.99,
    stock_quantity: 10,
    image_url: '/h_1.png'
  };

  // Check if product is already in cart
  const cartItem = items.find(item => item.product_id === product.product_id);
  const currentQuantity = cartItem?.quantity || 0;

  const handleAddToCart = async () => {
    if (isAddingToCart) return;

    try {
      setIsAddingToCart(true);
      
      // Check if adding one more would exceed stock
      if (currentQuantity + 1 > product.stock_quantity) {
        toast.error('Cannot add more of this item', {
          description: `Only ${product.stock_quantity} units available`,
        });
        return;
      }

      // Add item to cart
      await addItem(product.product_id, 1);
      
      // Show success message
      toast.success('Added to cart', {
        description: `${product.name} has been added to your cart`,
      });
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Failed to add to cart', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className='bg-[hsl(0_0%_3.9%)] px-4 sm:px-6 lg:px-8 py-8 lg:pt-20'>
      <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-white">
        Product Information
      </h2>
      <div className='flex text-white gap-32'>
        {/* Product Image Carousel */}
        <Carousel className='mx-10 w-full max-w-[550px]'>
          <CarouselContent>
            <CarouselItem><Image src="/h_1.png" width={500} height={500} alt="icon 1"/></CarouselItem>
            <CarouselItem><Image src="/h_2.png" width={500} height={500} alt="icon 2"/></CarouselItem>
            <CarouselItem><Image src="/h_3.png" width={500} height={500} alt="icon 3"/></CarouselItem>
            <CarouselItem><Image src="/h_4.png" width={500} height={500} alt="icon 4"/></CarouselItem>
            <CarouselItem><Image src="/h_5.png" width={500} height={500} alt="icon 5"/></CarouselItem>
          </CarouselContent>
          <CarouselPrevious className='bg-black hover:bg-gradient-to-r from-[hsl(220_70%_50%)] to-[hsl(260,100%,77%)]'/>
          <CarouselNext className='bg-black hover:bg-gradient-to-r from-[hsl(220_70%_50%)] to-[hsl(260,100%,77%)] mr-10'/>
        </Carousel>

        {/* Product Features */}
        <ul className='list-disc text-white'>
          <li className='text-3xl tracking-tight font-extrabold text-white mb-3 -ml-6 list-none'>Features</li>
          <li className='text-2xl font-sans font-bold'>Super Lightweight</li>
          <Separator className="my-2" />
          <li className='text-2xl font-sans font-bold'>Comfortable fit</li>
          <Separator className="my-2" />
          <li className='text-2xl font-sans font-bold'>Long battery life</li>
          <Separator className="my-2" />
          <li className='text-2xl font-sans font-bold'>Noise cancellation</li>
          <Separator className="my-2" />
          <li className='text-2xl font-sans font-bold'>Bluetooth support</li>
          <Separator className="my-2" />
          <li className='text-2xl font-sans font-bold'>Personalised audio spectrum</li>
          <Separator className="my-2" />
          <li className='text-2xl font-sans font-bold'>Make a different preset for different environment</li>
          <br />
          <li className='list-none text-2xl'>${product.price.toFixed(2)}</li>
          <br />
          
          {/* Add to Cart Button */}
          <Button 
            onClick={handleAddToCart}
            disabled={isAddingToCart || currentQuantity >= product.stock_quantity}
            className="w-52 bg-gradient-to-r from-[hsl(220_70%_50%)] to-[hsl(260,100%,77%)] text-[hsl(0_0%_98%)] 
                     hover:opacity-80 transition-opacity rounded-xl p-3 relative"
          >
            {isAddingToCart ? (
              <>
                <span className="opacity-0">Add to Cart</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[hsl(0_0%_98%)] border-t-transparent" />
                </div>
              </>
            ) : currentQuantity >= product.stock_quantity ? (
              'Out of Stock'
            ) : (
              'Add to Cart'
            )}
          </Button>
        </ul>
      </div>

      {/* Scroll to Top */}
      <div className='-mt-10'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <a href="" ><Image src="/up_icon.png" width={30} height={30} alt="up"/></a>
            </TooltipTrigger>
            <TooltipContent side="top" align="start">
              <p>Go to the top</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Specifications */}
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger className='text-3xl tracking-tight font-extrabold text-white'>
            Specifications
          </AccordionTrigger>
          <AccordionContent>
            <ul className='list-disc ml-6 text-white flex flex-col'>
              <li className='text-2xl font-sans font-bold'>Product dimensions: 19.5cm * 15.7cm / 7.6in * 6.2in</li>
              <Separator className='my-2' />
              <li className='text-2xl font-sans font-bold'>Product weight: 240gms / 0.53lbs </li>
              <Separator className='my-2' />
              <li className='text-2xl font-sans font-bold'>Material: Aluminum</li>
              <Separator className='my-2'/>
              <li className='text-2xl font-sans font-bold'>Unit count: 1.00</li>
              <Separator className='my-2'/>
              <li className='text-2xl font-sans font-bold'>Connectivity: Bluetooth Low Energy</li>
              <Separator className='my-2'/>
              <li className='text-2xl font-sans font-bold'>Rechargable: Yes</li>
              <Separator className='my-2'/>
              <li className='text-2xl font-sans font-bold'>Android Application: Bone+</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ProductInfo;