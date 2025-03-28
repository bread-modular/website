import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'img.youtube.com',  // For YouTube thumbnails
      'i.ytimg.com',      // Alternative YouTube image domain
      'i.vimeocdn.com',   // In case Vimeo is used in the future
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.youtube.com',
      },
      {
        protocol: 'https',
        hostname: '**.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: '**.vimeocdn.com',
      },
    ],
  },
  
  // Public runtime configuration
  publicRuntimeConfig: {
    // Instagram reels from Bread Modular
    instagramReels: [
      "DHnqtG8isU9",
      "DHaq6cZiEcB",
      "DG5NOzLCgHW",
      "DGSlo9VtFTv"
    ],
  },
};

export default nextConfig;
