'use client'
import React, { useState } from 'react';
import { Separator } from '@radix-ui/react-dropdown-menu';
import { Carousel } from '@/app/components/ui/carousel';
import { CarouselItem, CarouselContent, CarouselNext, CarouselPrevious } from '@/app/components/ui/carousel';
import { Accordion, AccordionTrigger, AccordionItem, AccordionContent } from '../ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { useCart } from '../Cart/CartContext';
import { Button } from '../ui/button';
import { toast } from 'sonner';

const ProductInfo: React.FC = () => {
  // Get addItem function from cart context
  const { addItem } = useCart();
  
  // State to manage loading state during cart addition
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Product details - in a real app, this would likely come from a database or API
  const product = {
    product_id: 1,
    name: 'Bone+ Headphone',
    price: 999.99,
    stock_quantity: 10,
    image_url: '/h_1.png'
  };

  // Handler for adding item to cart
  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true);
      
      // Add item to cart - quantity hardcoded to 1 for now
      await addItem(product.product_id, 1);
      
      // Show success message
      toast.success('Added to cart successfully!');
    } catch (error) {
      // Show error message if something goes wrong
      toast.error(error instanceof Error ? error.message : 'Failed to add to cart');
    } finally {
      // Reset loading state whether successful or not
      setIsAddingToCart(false);
    }
  };

  return (
    <div className='bg-[hsl(0_0%_3.9%)] px-4 sm:px-6 lg:px-8 pt-20'>
      <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-white">
        Product Information
      </h2>
      <div className='flex text-white gap-32'>
        {/* Product Image Carousel */}
        <Carousel className='mx-10 w-full max-w-[550px]'>
          <CarouselContent className='flex'>
            <CarouselItem><img src="/h_1.png" width={500} alt="icon 1"/></CarouselItem>
            <CarouselItem><img src="/h_2.png" width={500} alt="icon 2"/></CarouselItem> 
            <CarouselItem><img src="/h_3.png" width={500} alt="icon 3"/></CarouselItem>
            <CarouselItem><img src="/h_4.png" width={500} alt="icon 4"/></CarouselItem>
            <CarouselItem><img src="/h_5.png" width={500} alt="icon 5"/></CarouselItem>
          </CarouselContent>
          <CarouselPrevious className='bg-black hover:bg-gradient-to-r from-[hsl(220_70%_50%)] to-[hsl(260,100%,77%)]'/>
          <CarouselNext className='bg-black hover:bg-gradient-to-r from-[hsl(220_70%_50%)] to-[hsl(260,100%,77%)] mr-10'/>
        </Carousel>
          
        {/* Product Features and Add to Cart */}
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
            disabled={isAddingToCart}
            className="w-52 bg-gradient-to-r from-[hsl(220_70%_50%)] to-[hsl(260,100%,77%)] text-[hsl(0_0%_98%)] 
                     hover:opacity-80 transition-opacity rounded-xl p-3"
          >
            {isAddingToCart ? 'Adding...' : 'Add to Cart'}
          </Button>
        </ul>
      </div>
     
      {/* Specifications Accordion */}
      <div className='-mt-10'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <a href="" ><img src="up_icon.png" width={30} alt="up"/></a>
            </TooltipTrigger>
            <TooltipContent>
              <p>Go to the top</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <Accordion type="single" collapsible className="">
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
              <li className='text-2xl font-sans font-bold'>Android Application: Headphones Plus</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ProductInfo;