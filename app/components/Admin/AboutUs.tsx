import React from 'react'

const AboutUs = () => {
  return (
    <div className="bg-[hsl(0_0%_3.9%)] px-6 lg:pt-20 flex justify-center items-center min-h-screen">
      <div className="border-4 border-white p-8 rounded-lg max-w-3xl w-full">
        <section className='px-4'> 
          <h2 className="mb-4 text-4xl tracking-tighter font-extrabold text-white">
            About Us
          </h2>
          <p className='text-4xl font-semibold text-white -tracking-wider'>
            Founded in 2024,
          </p>
          <p className='text-2xl text-white'>
          <br /> Headphone Plus emerged from a simple yet powerful idea: everyone deserves to experience music in its purest form. <br />
          <br /> Our journey began when a team of audio engineers and music enthusiasts came together with a shared vision of creating headphones that could adapt to each individual&apos;s unique sound profile.
          </p>
        </section>
      </div>
    </div>

  )
}

export default AboutUs