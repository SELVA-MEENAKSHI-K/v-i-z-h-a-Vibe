/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Google Places photo host (only used when a live API key is configured).
      { protocol: "https", hostname: "places.googleapis.com" },
      { protocol: "https", hostname: "maps.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  experimental: {
    // Keep three.js server-friendly; it is only ever rendered client-side.
  },
};

export default nextConfig;
