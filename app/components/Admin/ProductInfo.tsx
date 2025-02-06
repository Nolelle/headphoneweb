'use client'
import React, { useState } from 'react';
import {Separator} from "@/components/ui/separator";
import { Carousel } from '@/app/components/ui/carousel';
import { CarouselItem, CarouselContent,CarouselNext, CarouselPrevious } from '@/app/components/ui/carousel';
import { Accordion, AccordionTrigger, AccordionItem, AccordionContent } from '../ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip"


interface Product {
  id: number;
  name: string;
  price: number;
}

const ProductInfo: React.FC = () => {
  const [cart, setCart] = useState<Product[]>([]);

  const product = {
    id: 1,
    name: 'Headphones',
    price: 199.99,
  };

  // Handle adding product to the cart
  const addToCart = () => {
    setCart([...cart, product]);
    console.log('Product added to cart:', product);
  };

  return (
    <div className=' bg-[hsl(0_0%_3.9%)] px-4 sm:px-6 lg:px-8 pt-20'>
      <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-white">
          Product Information
        </h2>
      <div className='flex text-white gap-32'>
        <Carousel className='mx-10 w-full max-w-[550px]'>
          <CarouselContent className='flex'>
           <CarouselItem className=''><img src="/h_1.png" width={500} alt="icon 1"/></CarouselItem>
           <CarouselItem className=''><img src="/h_2.png" width={500} alt="icon 2"/></CarouselItem> 
           <CarouselItem className=''><img src="/h_3.png" width={500} alt="icon 3"/></CarouselItem>
           <CarouselItem className=''><img src="/h_4.png" width={500} alt="icon 4"/></CarouselItem>
           <CarouselItem className=''><img src="/h_5.png" width={500} alt="icon 5"/></CarouselItem>
          </CarouselContent>
          <CarouselPrevious className='bg-black hover:bg-gradient-to-r from-[hsl(220_70%_50%)] to-[hsl(260,100%,77%)]'/>
          <CarouselNext className='bg-black hover:bg-gradient-to-r from-[hsl(220_70%_50%)] to-[hsl(260,100%,77%)] mr-10'/>
        </Carousel>
          
          <ul className='list-disc text-white'>
            <li className='text-3xl tracking-tight font-extrabold text-white   mb-3 -ml-6 list-none'>Features</li>
            <li className='text-2xl font-sans font-bold'>Super Lightweight</li>
            <Separator className="my-2" />

            <li className='text-2xl font-sans font-bold'>Comfortable fit</li>
            <Separator className="my-2" />

            <li className='text-2xl font-sans font-bold'>Long battery life</li>
            <Separator className="my-2" />

            <li className='text-2xl font-sans font-bold'>Noise cancellation</li>
            <Separator className="my-2" />

            <li className='text-2xl font-sans font-bold'>Bluetooth support</li>
            <Separator className="my-2 " />

            <li className='text-2xl font-sans font-bold'>Personalised audio spectrum</li>
            <Separator className="my-2" />

            <li className='text-2xl font-sans font-bold'>Make a different preset for different environment</li>
            <br />
            <li className='list-none text-2xl'>$999.99</li>
            <br />
            <button id='addToCart'  className="w-52 bg-gradient-to-r from-[hsl(220_70%_50%)] to-[hsl(260,100%,77%)] text-[hsl(0_0%_98%)] hover:opacity-80 transition-opacity rounded-xl p-3 ml-auto text-border border-cyan-200" onClick={addToCart}>Add to cart</button>
          </ul>
      </div>
     
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
          <AccordionTrigger className='text-3xl tracking-tight font-extrabold text-white'>Specifications</AccordionTrigger>
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
  )
} 

export default ProductInfo