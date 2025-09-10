/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['avatar.vercel.sh'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  transpilePackages: [
    '@radix-ui/react-dialog',
    '@radix-ui/react-dismissable-layer',
    '@radix-ui/react-menu',
    '@radix-ui/react-select',
    '@radix-ui/react-tooltip',
    '@radix-ui/react-visually-hidden'
  ],
};

export default nextConfig;