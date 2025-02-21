"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import styles from './ImageSlideshow.module.css';

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
    <div className={styles.imageContainer}>
      <Image
        src={slides[0].src}
        alt={slides[0].alt}
        fill
        sizes="(max-width: 768px) 100vw, 1024px"
        className={styles.image}
        priority
        onError={(e) => {
          console.error('Error loading image:', slides[0].src, e);
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
      className={styles.container}
      role="region"
      aria-label="Product image slideshow"
    >
      {!isClient ? (
        <BaseImage />
      ) : (
        <>
          {slides.map((slide, index) => (
            <div key={slide.src} className={styles.imageContainer}>
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                sizes="(max-width: 768px) 100vw, 1024px"
                className={`${styles.image} ${
                  index === currentSlide ? styles.visible : styles.hidden
                }`}
                priority={index === 0}
                onError={(e) => {
                  console.error('Error loading image:', slide.src, e);
                }}
              />
            </div>
          ))}
          <div 
            className={styles.controls}
            role="group"
            aria-label="Slideshow controls"
          >
            <button
              onClick={prevSlide}
              className={styles.button}
              aria-label="Previous slide"
            >
              ‹
            </button>
            <div 
              className={styles.counter}
              role="status"
              aria-label="Slide position"
            >
              {currentSlide + 1}
            </div>
            <button
              onClick={nextSlide}
              className={styles.button}
              aria-label="Next slide"
            >
              ›
            </button>
          </div>
          <div className={styles.srOnly} role="status" aria-live="polite">
            {slides[currentSlide].description}
          </div>
        </>
      )}
    </div>
  );
} 