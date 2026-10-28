/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production';

// Scripts and styles must allow 'unsafe-inline': Next.js inlines its page data and the theme script
// (a nonce-based policy would force every page to render dynamically).
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://books.google.com", // book covers in the research panel
  "font-src 'self'",
  "media-src 'self' https://s3.amazonaws.com/lang_src/", // letter pronunciation recordings
  `connect-src 'self'${isDev ? ' ws:' : ''}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
];

const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  // Native module: load it from node_modules at runtime rather than bundling it
  serverExternalPackages: ['better-sqlite3'],
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
