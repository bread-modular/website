"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

const slides = [
  {
    src: "/images/home-slide/01.JPEG",
    alt: "Bread Modular Synthesizer - Modern and minimalistic design",
    description: "A sleek and modern modular synthesizer with clean design"
  },
  {
    src: "/images/home-slide/02.JPEG",
    alt: "Bread Modular Interface - USB-C and MIDI connectivity",
    description: "Advanced connectivity options including USB-C and MIDI"
  },
  {
    src: "/images/home-slide/03.JPEG",
    alt: "Bread Modular Components - Open source hardware",
    description: "High-quality electronic components and open source design"
  }
];

// Server-side rendered base image
function BaseImage() {
  return (
    <div className="absolute inset-0">
      <Image
        src={slides[0].src}
        alt={slides[0].alt}
        fill
        sizes="(max-width: 768px) 100vw, 1024px"
        className="object-cover"
        priority
        onError={(e) => {
          console.error('Error loading image:', slides[0].src);
        }}
      />
    </div>
  );
}

// Client-side slideshow enhancement
export default function ImageSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isClient, setIsClient] = useState(false);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  useEffect(() => {
    setIsClient(true);
    const timer = setInterval(nextSlide, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div 
      className="w-full aspect-[16/9] relative bg-neutral-100"
      role="region"
      aria-label="Product image slideshow"
    >
      {!isClient ? (
        <BaseImage />
      ) : (
        <>
          {slides.map((slide, index) => (
            <div key={slide.src} className="absolute inset-0">
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                sizes="(max-width: 768px) 100vw, 1024px"
                className={`object-cover transition-opacity duration-500 ${
                  index === currentSlide ? "opacity-100" : "opacity-0"
                }`}
                priority={index === 0}
                onError={(e) => {
                  console.error('Error loading image:', slide.src);
                }}
              />
            </div>
          ))}
          <div 
            className="absolute bottom-4 sm:bottom-8 right-4 sm:right-8 flex items-center gap-2"
            role="group"
            aria-label="Slideshow controls"
          >
            <button
              onClick={prevSlide}
              className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white px-2 sm:px-3 py-1 transition-all"
              aria-label="Previous slide"
            >
              ←
            </button>
            <div 
              className="text-black bg-white bg-opacity-50 px-2 sm:px-3 py-1 min-w-[3rem] text-center text-sm sm:text-base"
              role="status"
              aria-label="Slide position"
            >
              {currentSlide + 1}/{slides.length}
            </div>
            <button
              onClick={nextSlide}
              className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white px-2 sm:px-3 py-1 transition-all"
              aria-label="Next slide"
            >
              →
            </button>
          </div>
          <div className="sr-only" role="status" aria-live="polite">
            {slides[currentSlide].description}
          </div>
        </>
      )}
    </div>
  );
} 