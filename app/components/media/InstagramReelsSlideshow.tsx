"use client";

import { useState, useEffect, useRef } from "react";
import styles from './InstagramReelsSlideshow.module.css';
import getConfig from 'next/config';

// Get the public runtime config
const { publicRuntimeConfig } = getConfig() || { publicRuntimeConfig: {} };

// Define type for Instagram embed script
declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}

// Get Instagram reels from config or use fallback if not available
const reels = publicRuntimeConfig.instagramReels || [
  "DRUNChhDTvY",
  "DRPA20GDSgN",
  "DQwJZ-ZDVWZ",
  "DQimhLvgpvh"
];

export default function InstagramReelsSlideshow() {
  const [currentReel, setCurrentReel] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const embedContainerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  // Change slide and ensure proper cleanup
  const changeReel = (newIndex: number) => {
    // Only reload if different
    if (newIndex !== currentReel) {
      // Set loading state
      setIsLoading(true);
      
      // First set current reel to trigger UI update
      setCurrentReel(newIndex);
      
      // Clear previous embed contents
      if (embedContainerRef.current) {
        const container = embedContainerRef.current;
        
        try {
          // Create a new blockquote element for the Instagram embed
          const blockquote = document.createElement('blockquote');
          blockquote.className = 'instagram-media';
          blockquote.setAttribute('data-instgrm-permalink', `https://www.instagram.com/p/${reels[newIndex]}/`);
          blockquote.setAttribute('data-instgrm-version', '14');
          blockquote.style.background = '#FFF';
          blockquote.style.borderRadius = '0';
          blockquote.style.border = 'none';
          blockquote.style.boxShadow = 'none';
          blockquote.style.margin = '0';
          blockquote.style.maxWidth = '540px';
          blockquote.style.minWidth = '326px';
          blockquote.style.padding = '0';
          blockquote.style.width = 'calc(100% - 2px)';
          blockquote.style.overflow = 'hidden';
          blockquote.style.maxHeight = '100%';
          
          // Add a data attribute for better Instagram mobile display
          blockquote.setAttribute('data-instgrm-captioned', '');
          
          // Create a wrapper div with the proper class
          const wrapper = document.createElement('div');
          wrapper.className = styles.reelWrapper;
          wrapper.appendChild(blockquote);
          
          // Clear the container
          while (container.firstChild) {
            container.removeChild(container.firstChild);
          }
          
          // Add the new embed
          container.appendChild(wrapper);
          
          // Process the embed
          setTimeout(() => {
            if (window.instgrm && window.instgrm.Embeds) {
              window.instgrm.Embeds.process();
            }
            
            // Set a timeout to remove loading state
            setTimeout(() => {
              setIsLoading(false);
            }, 800);
          }, 100);
        } catch (error) {
          console.error('Error changing Instagram reel:', error);
          setIsLoading(false);
        }
      }
    }
  };

  const nextReel = () => changeReel((currentReel + 1) % reels.length);
  const prevReel = () => changeReel((currentReel - 1 + reels.length) % reels.length);

  // Load Instagram embed script
  useEffect(() => {
    setIsClient(true);
    
    // Check if the Instagram embed script is already loaded
    if (!document.getElementById('instagram-embed-script')) {
      const script = document.createElement('script');
      script.id = 'instagram-embed-script';
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      script.defer = true;
      
      // Store the script reference
      scriptRef.current = script;
      
      script.onload = () => {
        // Process embeds when script loads
        if (window.instgrm && window.instgrm.Embeds) {
          window.instgrm.Embeds.process();
          // Set a timeout to remove loading state
          setTimeout(() => {
            setIsLoading(false);
          }, 800);
        }
      };
      
      document.body.appendChild(script);
    } else {
      // Process embeds when component mounts if script already exists
      if (window.instgrm && window.instgrm.Embeds) {
        window.instgrm.Embeds.process();
        // Set a timeout to remove loading state
        setTimeout(() => {
          setIsLoading(false);
        }, 800);
      }
    }
    
    // Set initial loading state
    setIsLoading(true);
    
    // Cleanup function - properly handle script removal
    return () => {
      // Only remove if we've added the script ourselves
      if (scriptRef.current) {
        try {
          const currentScript = document.getElementById('instagram-embed-script');
          if (currentScript && currentScript.parentNode) {
            currentScript.parentNode.removeChild(currentScript);
          }
        } catch (error) {
          console.error("Error removing Instagram script:", error);
        }
        scriptRef.current = null;
      }
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keys if not in an input, textarea, etc
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      if (e.key === 'ArrowLeft') {
        prevReel();
      } else if (e.key === 'ArrowRight') {
        nextReel();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentReel]); // Re-add when currentReel changes for proper closure references

  return (
    <div 
      className={styles.container}
      role="region"
      aria-label="Instagram reels slideshow"
    >
      {!isClient ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingText}>Loading Instagram Reels...</div>
        </div>
      ) : (
        <>
          <div 
            className={styles.reelsContainer} 
            ref={embedContainerRef}
          >
            {/* Initial render - just an empty wrapper that will be filled by the script */}
            <div className={styles.reelWrapper}>
              <blockquote
                className="instagram-media"
                data-instgrm-permalink={`https://www.instagram.com/p/${reels[currentReel]}/`}
                data-instgrm-version="14"
                data-instgrm-captioned=""
                style={{
                  background: '#FFF',
                  borderRadius: '0',
                  border: 'none',
                  boxShadow: 'none',
                  margin: '0',
                  maxWidth: '540px',
                  minWidth: '326px',
                  padding: '0',
                  width: 'calc(100% - 2px)',
                  overflow: 'hidden',
                  maxHeight: '100%'
                }}
              >
                {/* Instagram will fill this with the embed content */}
              </blockquote>
            </div>
          </div>
          
          {/* Loading overlay */}
          {isLoading && (
            <div className={styles.loadingOverlay} aria-hidden="true">
              <div className={styles.spinner} aria-label="Loading content"></div>
            </div>
          )}
          
          <div 
            className={styles.controls}
            role="group"
            aria-label="Slideshow controls"
          >
            <button
              onClick={prevReel}
              className={styles.button}
              aria-label="Previous reel"
              disabled={isLoading}
            >
              ‹
            </button>
            <div 
              className={styles.counter}
              role="status"
              aria-label="Reel position"
            >
              {currentReel + 1} / {reels.length}
            </div>
            <button
              onClick={nextReel}
              className={styles.button}
              aria-label="Next reel"
              disabled={isLoading}
            >
              ›
            </button>
          </div>
        </>
      )}
    </div>
  );
} 