"use client";
import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { ChevronUp } from "lucide-react";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent
} from "@/app/components/ui/tooltip";

const AboutUs = () => {
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.pageYOffset > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-[hsl(0_0%_3.9%)] px-4 sm:px-6 py-16 lg:py-20 flex justify-center items-center min-h-fit lg:min-h-screen">
      <div className="border-4 border-white p-4 sm:p-8 rounded-lg max-w-3xl w-full">
        <section>
          <h2 className="mb-4 text-3xl sm:text-4xl tracking-tighter font-extrabold text-white text-center sm:text-left">
            About Us
          </h2>
          <p className="text-2xl sm:text-4xl font-semibold text-white -tracking-wider text-center sm:text-left">
            Founded in 2024,
          </p>
          <p className="text-lg sm:text-2xl text-white mt-4">
            Headphone Plus emerged from a simple yet powerful idea: everyone
            deserves to experience music in its purest form.
            <br className="hidden sm:block" />
            <br />
            Our journey began when a team of audio engineers and music
            enthusiasts came together with a shared vision of creating
            headphones that could adapt to each individual&apos;s unique sound
            profile.
          </p>
        </section>
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
                aria-label="Scroll to top"
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

export default AboutUs;
