/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;