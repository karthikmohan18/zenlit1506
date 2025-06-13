import nextPwa from 'next-pwa'

const withPWA = nextPwa({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable strict mode to prevent double rendering
  experimental: {
    appDir: true,
  },
  // Add this to handle client-side routing properly
  async rewrites() {
    return []
  },
}

export default withPWA(nextConfig)