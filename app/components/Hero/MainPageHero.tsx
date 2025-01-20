import Image from "next/image";
import React from "react";

const MainPageHero: React.FC = () => {
  return (
    <div
      id="hero"
      className="hero min-h-screen bg-base-200"
    >
      <div className="hero-content flex-col lg:flex-row-reverse">
        <Image
          src="/headphone.png"
          alt="Headphones Plus"
          width={500}
          height={500}
          className="max-w-lg rounded-lg shadow-2xl"
        />
        <div>
          <h1 className="text-5xl font-bold">
            Elevate Your Listening Experience
          </h1>
          <p className="py-6">
            Discover the cutting-edge technology and unparalleled sound quality
            of Headphones Plus. Immerse yourself in a world of audio perfection,
            tailored to your unique hearing profile.
          </p>
          <button className="btn btn-primary">Explore Our Headphones</button>
        </div>
      </div>
    </div>
  );
};

export default MainPageHero;
