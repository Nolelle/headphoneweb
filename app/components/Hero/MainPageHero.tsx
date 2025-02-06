import Image from "next/image";
import React from "react";
import { Button } from "../ui/button";

const MainPageHero: React.FC = () => {
  return (
    <section 
      id="hero"
      className="min-h-screen bg-[hsl(0_0%_3.9%)] flex items-center justify-center px-4 sm:px-6 lg:px-8"
    >
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row-reverse items-center justify-between gap-12">
          {/* Image Container */}
          <div className="lg:w-1/2 relative">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[hsl(220_70%_50%)] to-[hsl(260,100%,77%)] opacity-30 blur-xl rounded-full" />
              <Image
                src="/h_1_bg.png"
                alt="Headphones"
                width={500}
                height={500}
                className="relative rounded-xl rotate-12 mx-auto"
                priority
              />
            </div>
          </div>

          {/* Content Container */}
          <div className="lg:w-1/2 space-y-6 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[hsl(0_0%_98%)]">
              Elevate Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(220_70%_50%)] to-[hsl(260,100%,77%)]">
                Listening
              </span>{" "}
              Experience
            </h1>
            
            <p className="text-lg sm:text-xl text-[hsl(0_0%_63.9%)] max-w-2xl">
              Discover the cutting-edge technology and unparalleled sound quality
              of Bone+. Immerse yourself in a world of audio perfection,
              tailored to your unique hearing profile.
            </p>
            
            <div className="pt-4">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-[hsl(220_70%_50%)] to-[hsl(260,100%,77%)] text-[hsl(0_0%_98%)] hover:opacity-90 transition-opacity"
              >
                Explore Our Headphones
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MainPageHero;