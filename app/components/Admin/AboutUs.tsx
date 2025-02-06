import React from 'react'

const AboutUs = () => {
  return (
    <div className="bg-[hsl(0_0%_3.9%)] px-6">
      <section className='px-4'>
      <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-white">
          About Us
        </h2>
        <p className='text-2xl text-white'>
          Headphones Plus provides a personalised audio experience to it&apos;s users.
          
        </p>
        <p className='text-white text-3xl font-bold'>  
          They&apos;re just like regular headphones... but <span className='text-transparent italic bg-clip-text bg-gradient-to-r from-[hsl(220_70%_50%)] to-[hsl(260,100%,77%)]'>better </span> .
        </p>
        <br />
      </section>
    </div>
  )
}

export default AboutUs