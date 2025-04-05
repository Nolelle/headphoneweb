"use client";
import React, { useState, useEffect } from "react";
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
    name: "Bone+ Headphone",
    price: 199.99,
    stock_quantity: 10,
    image_url: "/h_1.png"
  };

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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className="bg-[hsl(0_0%_3.9%)] w-full"
      id="headphone"
    >
      <div className="container mx-auto max-w-6xl px-4 py-12 lg:py-16 pt-32 lg:pt-36">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left Column - Product Images */}
          <div className="w-full lg:w-1/2">
            <div className="sticky top-20">
              <Carousel className="w-full max-w-xl mx-auto">
                <CarouselContent>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <CarouselItem key={num}>
                      <div className="p-1">
                        <div className="flex items-center justify-center bg-[hsl(0_0%_5%)] rounded-lg p-2 h-[400px] sm:h-[480px] md:h-[520px]">
                          <Image
                            src={`/h_${num}.png`}
                            width={500}
                            height={500}
                            alt={`Bone+ Headphones View ${num}`}
                            className="max-h-full w-auto object-contain"
                          />
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex justify-between absolute top-1/2 -translate-y-1/2 left-0 right-0 px-2">
                  <CarouselPrevious
                    className="relative left-0 right-auto bg-black hover:bg-gradient-to-r from-[hsl(220_70%_50%)] to-[hsl(260,100%,77%)] opacity-100 always-visible"
                    variant="outline"
                  />
                  <CarouselNext
                    className="relative right-0 left-auto bg-black hover:bg-gradient-to-r from-[hsl(220_70%_50%)] to-[hsl(260,100%,77%)] opacity-100 always-visible"
                    variant="outline"
                  />
                </div>
              </Carousel>

              <div className="flex justify-center mt-6 gap-2 flex-wrap">
                {[1, 2, 3, 4, 5].map((num) => (
                  <div
                    key={num}
                    className="w-16 h-16 rounded-md bg-[hsl(0_0%_5%)] p-1 cursor-pointer hover:ring-2 hover:ring-[hsl(220_70%_50%)] transition-all"
                  >
                    <Image
                      src={`/h_${num}.png`}
                      width={60}
                      height={60}
                      alt={`Thumbnail ${num}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Product Details */}
          <div className="w-full lg:w-1/2">
            <div className="lg:pl-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                {product.name}
              </h1>

              <div className="mb-6">
                <p className="text-2xl font-bold text-white">
                  ${product.price.toFixed(2)}
                </p>
                <p className="text-[hsl(0_0%_63.9%)] mt-1">
                  Free shipping on all continental US orders
                </p>
              </div>

              <div className="mb-8">
                <Button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="w-full py-6 bg-gradient-to-r from-[hsl(220_70%_50%)] to-[hsl(260,100%,77%)] text-[hsl(0_0%_98%)] hover:opacity-90 transition-opacity rounded-xl text-lg font-medium"
                >
                  {isAddingToCart ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[hsl(0_0%_98%)] border-t-transparent" />
                      <span>Adding to Cart...</span>
                    </div>
                  ) : (
                    "Add to Cart"
                  )}
                </Button>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Features
                </h2>
                <ul className="space-y-3 text-[hsl(0_0%_83.1%)]">
                  <li className="flex items-start">
                    <span className="text-[hsl(220_70%_50%)] mr-2">•</span>
                    Super Lightweight Design
                  </li>
                  <li className="flex items-start">
                    <span className="text-[hsl(220_70%_50%)] mr-2">•</span>
                    Ergonomic Comfortable Fit
                  </li>
                  <li className="flex items-start">
                    <span className="text-[hsl(220_70%_50%)] mr-2">•</span>
                    Extended Battery Life up to 24 Hours
                  </li>
                  <li className="flex items-start">
                    <span className="text-[hsl(220_70%_50%)] mr-2">•</span>
                    Advanced Noise Cancellation Technology
                  </li>
                  <li className="flex items-start">
                    <span className="text-[hsl(220_70%_50%)] mr-2">•</span>
                    Bluetooth 5.0 Connectivity
                  </li>
                  <li className="flex items-start">
                    <span className="text-[hsl(220_70%_50%)] mr-2">•</span>
                    Personalized Audio Spectrum Adjustment
                  </li>
                  <li className="flex items-start">
                    <span className="text-[hsl(220_70%_50%)] mr-2">•</span>
                    Multiple Environment Sound Presets
                  </li>
                </ul>
              </div>

              <Accordion
                type="single"
                collapsible
                className="w-full"
              >
                <AccordionItem
                  value="specifications"
                  className="border-b border-[hsl(0_0%_14.9%)]"
                >
                  <AccordionTrigger className="text-white py-4">
                    <span className="text-xl font-semibold">
                      Specifications
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="py-2 space-y-3 text-[hsl(0_0%_83.1%)]">
                      <p className="flex justify-between">
                        <span className="text-[hsl(0_0%_63.9%)]">
                          Dimensions:
                        </span>
                        <span>19.5cm × 15.7cm (7.6in × 6.2in)</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-[hsl(0_0%_63.9%)]">Weight:</span>
                        <span>240g (0.53lbs)</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-[hsl(0_0%_63.9%)]">
                          Material:
                        </span>
                        <span>Aluminum & Premium Leather</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-[hsl(0_0%_63.9%)]">
                          Connectivity:
                        </span>
                        <span>Bluetooth Low Energy</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-[hsl(0_0%_63.9%)]">
                          Battery Life:
                        </span>
                        <span>Up to 24 hours</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-[hsl(0_0%_63.9%)]">
                          Rechargeable:
                        </span>
                        <span>Yes, USB-C</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-[hsl(0_0%_63.9%)]">
                          Compatibility:
                        </span>
                        <span>iOS & Android with Bone+ App</span>
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="delivery"
                  className="border-b border-[hsl(0_0%_14.9%)]"
                >
                  <AccordionTrigger className="text-white py-4">
                    <span className="text-xl font-semibold">
                      Shipping & Returns
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="py-2 space-y-4 text-[hsl(0_0%_83.1%)]">
                      <p>
                        Free standard shipping on all orders within the
                        continental United States.
                      </p>
                      <p>
                        Orders typically ship within 1-2 business days. Delivery
                        times vary based on location.
                      </p>
                      <p>
                        30-day return policy on all unused items in original
                        packaging.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
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
    </div>
  );
};

export default ProductInfo;
