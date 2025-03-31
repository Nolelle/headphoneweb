"use client";
import React, { useState, useEffect } from "react";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { Carousel } from "@/app/components/ui/carousel";
import {
  CarouselItem,
  CarouselContent,
  CarouselNext,
  CarouselPrevious
} from "@/app/components/ui/carousel";
import {
  Accordion,
  AccordionTrigger,
  AccordionItem,
  AccordionContent
} from "../ui/accordion";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/app/components/ui/tooltip";
import Image from "next/image";
import { useCart } from "../Cart/CartContext";
import { toast } from "sonner";
import { ChevronUp } from "lucide-react";

// Interface defining the structure of a product
interface Product {
  product_id: number;
  name: string;
  price: number;
  stock_quantity: number;
  image_url: string;
}

const ProductInfo: React.FC = () => {
  // State management for adding to cart and scroll to top
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addItem } = useCart(); // Remove unused 'items' variable

  // Scroll to top functionality
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.pageYOffset > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Product details hardcoded for now
  const product: Product = {
    product_id: 1,
    name: "Bone+ Headphone",
    price: 199.99,
    stock_quantity: 10,
    image_url: "/h_1.png"
  };

  // Handler for adding item to cart with robust error handling
  const handleAddToCart = async () => {
    if (isAddingToCart) return;

    try {
      setIsAddingToCart(true);

      const stockResponse = await fetch("/api/products/check-stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: product.product_id,
          quantity: 1
        })
      });

      // More robust response handling
      const responseText = await stockResponse.text();
      console.log("Stock check raw response:", responseText);

      let stockData;
      try {
        stockData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Response parsing error:", {
          responseText,
          parseError
        });
        throw new Error("Invalid server response");
      }

      if (!stockResponse.ok) {
        throw new Error(stockData.error || "Stock check failed");
      }

      // Proceed with cart addition
      await addItem(product.product_id, 1);

      toast.success("Added to cart");
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add to cart"
      );
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Scroll to top functionality
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-[hsl(0_0%_3.9%)] px-4 sm:px-6 lg:px-8 py-8 lg:pt-20">
      <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-white text-center lg:text-left">
        Product Information
      </h2>
      <div className="flex flex-col lg:flex-row text-white gap-8 lg:gap-32">
        <div className="w-full lg:max-w-[550px] mx-auto lg:mx-0">
          <Carousel className="w-full">
            <CarouselContent className="flex">
              <CarouselItem>
                <Image
                  src="/h_1.png"
                  width={500}
                  height={500}
                  alt="Bone+ Headphones Front View"
                  className="mx-auto"
                />
              </CarouselItem>
              <CarouselItem>
                <Image
                  src="/h_2.png"
                  width={500}
                  height={500}
                  alt="Bone+ Headphones Side View"
                  className="mx-auto"
                />
              </CarouselItem>
              <CarouselItem>
                <Image
                  src="/h_3.png"
                  width={500}
                  height={500}
                  alt="Bone+ Headphones Detail View"
                  className="mx-auto"
                />
              </CarouselItem>
              <CarouselItem>
                <Image
                  src="/h_4.png"
                  width={500}
                  height={500}
                  alt="Bone+ Headphones Wear View"
                  className="mx-auto"
                />
              </CarouselItem>
              <CarouselItem>
                <Image
                  src="/h_5.png"
                  width={500}
                  height={500}
                  alt="Bone+ Headphones Lifestyle View"
                  className="mx-auto"
                />
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="bg-black hover:bg-gradient-to-r from-[hsl(220_70%_50%)] to-[hsl(260,100%,77%)]" />
            <CarouselNext className="bg-black hover:bg-gradient-to-r from-[hsl(220_70%_50%)] to-[hsl(260,100%,77%)]" />
          </Carousel>
        </div>

        <div className="w-full mt-8 lg:mt-0">
          <ul className="list-disc text-white mx-auto max-w-md lg:max-w-none">
            <li className="text-3xl tracking-tight font-extrabold text-white mb-3 -ml-6 list-none text-center lg:text-left">
              Features
            </li>
            <li className="text-xl lg:text-2xl font-sans font-bold">
              Super Lightweight
            </li>
            <Separator className="my-2" />
            <li className="text-xl lg:text-2xl font-sans font-bold">
              Comfortable fit
            </li>
            <Separator className="my-2" />
            <li className="text-xl lg:text-2xl font-sans font-bold">
              Long battery life
            </li>
            <Separator className="my-2" />
            <li className="text-xl lg:text-2xl font-sans font-bold">
              Noise cancellation
            </li>
            <Separator className="my-2" />
            <li className="text-xl lg:text-2xl font-sans font-bold">
              Bluetooth support
            </li>
            <Separator className="my-2" />
            <li className="text-xl lg:text-2xl font-sans font-bold">
              Personalised audio spectrum
            </li>
            <Separator className="my-2" />
            <li className="text-xl lg:text-2xl font-sans font-bold">
              Make a different preset for different environment
            </li>
            <div className="mt-6 text-center lg:text-left">
              <p className="text-2xl">${product.price.toFixed(2)}</p>
              <div className="mt-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="w-full sm:w-52 bg-gradient-to-r from-[hsl(220_70%_50%)] to-[hsl(260,100%,77%)] text-[hsl(0_0%_98%)] hover:opacity-80 transition-opacity rounded-xl p-3"
                >
                  {isAddingToCart ? "Adding..." : "Add to Cart"}
                </Button>
              </div>
            </div>
          </ul>
        </div>
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
            <TooltipContent
              side="top"
              align="center"
            >
              <p>Scroll to top</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <Accordion
        type="single"
        collapsible
        className=""
      >
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-3xl tracking-tight font-extrabold text-white">
            Specifications
          </AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc ml-6 text-white flex flex-col">
              <li className="text-2xl font-sans font-bold">
                Product dimensions: 19.5cm * 15.7cm / 7.6in * 6.2in
              </li>
              <Separator className="my-2" />
              <li className="text-2xl font-sans font-bold">
                Product weight: 240gms / 0.53lbs{" "}
              </li>
              <Separator className="my-2" />
              <li className="text-2xl font-sans font-bold">
                Material: Aluminum
              </li>
              <Separator className="my-2" />
              <li className="text-2xl font-sans font-bold">Unit count: 1.00</li>
              <Separator className="my-2" />
              <li className="text-2xl font-sans font-bold">
                Connectivity: Bluetooth Low Energy
              </li>
              <Separator className="my-2" />
              <li className="text-2xl font-sans font-bold">Rechargable: Yes</li>
              <Separator className="my-2" />
              <li className="text-2xl font-sans font-bold">
                Android Application: Bone+
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ProductInfo;
