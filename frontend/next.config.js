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
      {
        protocol: 'https',
        hostname: 'notesofani.onrender.com',
      },
    ],
  },

  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      (process.env.NEXT_PUBLIC_API_BASE_URL
        ? process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/api\/v1\/?$/, '')
        : (process.env.NODE_ENV === 'development'
            ? 'http://localhost:5000'
            : 'https://notesofani.onrender.com'));

    return [
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;