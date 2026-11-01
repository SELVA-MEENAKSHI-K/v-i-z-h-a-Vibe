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
          // Content Security Policy. Scoped to what VizhaVibe actually loads:
          //  - scripts: self + inline (Next's hydration bootstrap & styled-jsx);
          //    'unsafe-eval' only in development (Next HMR / React Refresh need
          //    it). Production omits 'unsafe-eval'. 'wasm-unsafe-eval' is kept so
          //    Three.js/draco WASM decoders can run.
          //  - styles: self + inline (styled-jsx <style jsx> and Tailwind's
          //    injected styles require 'unsafe-inline').
          //  - img/media: self + data/blob (SmartImage fallbacks, 3D canvas
          //    textures) + the remote image hosts whitelisted for next/image.
          //  - connect: self + the provider endpoints we call client/server-side
          //    (Firebase auth, Geoapify, OpenAI-compatible gateways).
          //  - frame-ancestors 'none' (defence-in-depth with X-Frame-Options).
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          // Prevent MIME-type sniffing.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Clickjacking protection (no framing by other origins).
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Limit referrer leakage to other origins.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Opt out of powerful browser features we don't use.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)" },
          // Encourage HTTPS once deployed (safe to send; browsers ignore on http).
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
};

// Build the CSP once. Dev needs 'unsafe-eval' for HMR/React Refresh; production
// drops it. Everything else is identical so behaviour matches in both modes.
const isDev = process.env.NODE_ENV !== "production";
const scriptSrc = ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'", isDev ? "'unsafe-eval'" : ""].filter(Boolean).join(" ");
// Hosts the @react-three/drei runtime fetches from. The <Environment preset=…>
// HDRIs are served from the drei-assets repo via githack/githubusercontent, and
// draco/basis/meshopt decoders are loaded from gstatic/jsdelivr. These are
// fetched by the browser (connect-src) and some decoders run as blob workers.
const threeDConnect = [
  "https://raw.githack.com",
  "https://*.githack.com",
  "https://raw.githubusercontent.com",
  "https://www.gstatic.com",
  "https://fonts.gstatic.com",
  "https://cdn.jsdelivr.net",
].join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  // img-src also covers 3D textures / basis images pulled from the decoder CDNs.
  "img-src 'self' data: blob: https://places.googleapis.com https://maps.googleapis.com https://lh3.googleusercontent.com https://upload.wikimedia.org https://www.gstatic.com https://cdn.jsdelivr.net",
  "media-src 'self' data: blob:",
  // font-src covers drei <Text> fonts loaded from Google's font CDN.
  "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
  // connect-src: app/provider endpoints + the 3D asset hosts (HDR/draco/fonts).
  `connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://api.geoapify.com https://api.openai.com ${threeDConnect}`,
  // frame-src: Firebase auth popups + the keyless OpenStreetMap map embed.
  "frame-src 'self' https://*.firebaseapp.com https://www.openstreetmap.org",
  // Draco/basis decoders run as blob-URL workers.
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
]
  .filter(Boolean)
  .join("; ");

export default nextConfig;
