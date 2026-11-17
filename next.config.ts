import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Bread Modular Original module pages moved under /original/modules so the
  // Eurorack modules can own /modules. Keep old links (and rankings) alive.
  async redirects() {
    return [
      { source: '/modules/:path+', destination: '/original/modules/:path+', permanent: true },
      // No Eurorack modules page yet: temporary, so /modules can come back later
      { source: '/modules', destination: '/original/modules', permanent: false },
      // The case configurator moved from /case (the STL files stay at /case/stl)
      { source: '/case', destination: '/eurorack-case', permanent: true },
    ];
  },
  async headers() {
    return [
      { source: '/case/stl/:file*', headers: [{ key: 'Content-Type', value: 'model/stl' }] },
    ];
  },
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
        source: '/original/modules/:path*.md',
        destination: '/api/modules/:path*.md',
      },
      {
        source: '/blog/:path*.md',
        destination: '/api/blog/:path*.md',
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'i.vimeocdn.com',
      },
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
};

export default nextConfig;
