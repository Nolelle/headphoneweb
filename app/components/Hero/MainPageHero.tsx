import Image from "next/image";
import React from "react";
import { Button } from "../ui/button";
import Link from "next/link";

const MainPageHero: React.FC = () => {
  return (
    <section
      id="hero"
      className="py-16 md:py-0 min-h-[90vh] md:min-h-screen bg-[hsl(0_0%_3.9%)] flex items-center justify-center w-full"
    >
      <div className="container max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row-reverse items-center justify-between gap-8 md:gap-12">
          {/* Image Container */}
          <div className="w-full sm:w-3/4 lg:w-1/2 relative mt-8 lg:mt-0">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[hsl(220_70%_50%)] to-[hsl(260,100%,77%)] opacity-30 blur-xl rounded-full" />
              <Image
                src="/h_1_bg.png"
                alt="Headphones"
                width={450}
                height={450}
                className="relative rounded-xl rotate-12 w-full max-w-[350px] sm:max-w-[400px] mx-auto h-auto"
                priority
              />
            </div>
          </div>

          {/* Content Container */}
          <div className="w-full lg:w-1/2 space-y-4 md:space-y-6 text-center lg:text-left mt-8 lg:mt-0">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[hsl(0_0%_98%)]">
              Elevate Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(220_70%_50%)] to-[hsl(260,100%,77%)]">
                Listening
              </span>{" "}
              Experience
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-[hsl(0_0%_63.9%)] max-w-2xl mx-auto lg:mx-0">
              Discover the cutting-edge technology and unparalleled sound
              quality of Bone+. Immerse yourself in a world of audio perfection,
              tailored to your unique hearing profile.
            </p>

            <div className="pt-4 md:pt-6">
              <Link href="/#headphone">
                <Button
                  size="lg"
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[hsl(220_70%_50%)] to-[hsl(260,100%,77%)] text-[hsl(0_0%_98%)] hover:opacity-90 transition-opacity text-base md:text-lg"
                >
                  Learn more about Bone+!
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MainPageHero;
