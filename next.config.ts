import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/llms.txt',
        destination: '/api/llms',
      },
      {
        source: '/llms-full.txt',
        destination: '/api/llms-full',
      },
      {
        source: '/docs/:path*.md',
        destination: '/api/docs/:path*.md',
      },
      {
        source: '/modules/:path*.md',
        destination: '/api/modules/:path*.md',
      },
      {
        source: '/blog/:path*.md',
        destination: '/api/blog/:path*.md',
      },
    ];
  },
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
    // Instagram reels from Bread Modular (latest reels fetched from @breadmodular)
    instagramReels: [
      "DRUNChhDTvY",
      "DRPA20GDSgN",
      "DQwJZ-ZDVWZ",
      "DQimhLvgpvh",
      "DPsmPQXAh_J",
      "DPlc5SXDQ5n",
      "DPixNBqDapA"
    ],
  },
};

export default nextConfig;
