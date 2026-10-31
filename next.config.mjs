/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Google Places photo host (only used when a live API key is configured).
      { protocol: "https", hostname: "places.googleapis.com" },
      { protocol: "https", hostname: "maps.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Wikimedia Commons — real, openly-licensed food photographs for the menu.
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
    // Security hardening for the Image Optimization API:
    // - Never process/inline remote SVG (SVGs can carry scripts → XSS/RCE).
    // - Force a restrictive CSP + sandbox on any optimized image response.
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Disable the x-powered-by header (avoid leaking the framework/version).
  poweredByHeader: false,
  experimental: {
    // Keep three.js server-friendly; it is only ever rendered client-side.
  },
  // Baseline security headers applied to every response.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Prevent MIME-type sniffing.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Clickjacking protection (no framing by other origins).
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Limit referrer leakage to other origins.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Opt out of powerful browser features we don't use.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), usb=()" },
          // Encourage HTTPS once deployed (safe to send; browsers ignore on http).
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
