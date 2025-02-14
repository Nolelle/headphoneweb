'use client'
import React, { useState, useEffect } from 'react';
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
import { ChevronUp } from 'lucide-react';

interface Product {
  product_id: number;
  name: string;
  price: number;
  stock_quantity: number;
  image_url: string;
}

const ProductInfo: React.FC = () => {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addItem } = useCart();

  const [showScrollToTop, setShowScrollToTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.pageYOffset > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const product: Product = {
    product_id: 1,
    name: 'Bone+ Headphone',
    price: 199.99,
    stock_quantity: 10,
    image_url: '/h_1.png'
  };

  const handleAddToCart = async () => {
    if (isAddingToCart) return;
    try {
      setIsAddingToCart(true);
      await addItem(product.product_id, 1);
      toast.success('Added to cart', {
        description: `${product.name} has been added to your cart`,
        duration: 3000,
      });
    } catch (error) {
      toast.error('Failed to add to cart', {
        description: error instanceof Error ? error.message : 'An error occurred while adding the item to cart',
        duration: 4000,
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className='bg-[hsl(0_0%_3.9%)] px-4 sm:px-6 lg:px-8 py-8 lg:pt-20'>
      <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-white">
        Product Information
      </h2>
      <div className='flex text-white gap-32'>
        <Carousel className='mx-10 w-full max-w-[550px]'>
          <CarouselContent className='flex'>
            <CarouselItem><Image src="/h_1.png" width={500} height={500} alt="Bone+ Headphones Front View"/></CarouselItem>
            <CarouselItem><Image src="/h_2.png" width={500} height={500} alt="Bone+ Headphones Side View"/></CarouselItem> 
            <CarouselItem><Image src="/h_3.png" width={500} height={500} alt="Bone+ Headphones Detail View"/></CarouselItem>
            <CarouselItem><Image src="/h_4.png" width={500} height={500} alt="Bone+ Headphones Wear View"/></CarouselItem>
            <CarouselItem><Image src="/h_5.png" width={500} height={500} alt="Bone+ Headphones Lifestyle View"/></CarouselItem>
          </CarouselContent>
          <CarouselPrevious className='bg-black hover:bg-gradient-to-r from-[hsl(220_70%_50%)] to-[hsl(260,100%,77%)]'/>
          <CarouselNext className='bg-black hover:bg-gradient-to-r from-[hsl(220_70%_50%)] to-[hsl(260,100%,77%)] mr-10'/>
        </Carousel>
          
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
          <Button 
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className="w-52 bg-gradient-to-r from-[hsl(220_70%_50%)] to-[hsl(260,100%,77%)] text-[hsl(0_0%_98%)] hover:opacity-80 transition-opacity rounded-xl p-3"
          >
            {isAddingToCart ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[hsl(0_0%_98%)] border-t-transparent" />
                Adding...
              </div>
            ) : (
              'Add to Cart'
            )}
          </Button>
        </ul>
      </div>

      {showScrollToTop && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="fixed bottom-4 right-4 z-50 rounded-full bg-[hsl(0_0%_14.9%)] text-[hsl(0_0%_98%)] hover:bg-[hsl(0_0%_83.1%)] hover:text-[hsl(0_0%_3.9%)]"
                onClick={scrollToTop}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" align="center">
              <p>Scroll to top</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
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
              <li className='text-2xl font-sans font-bold'>Android Application: Bone+</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ProductInfo;
