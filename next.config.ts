import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  reloadOnOnline: true,
  cacheOnFrontEndNav: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
    runtimeCaching: [
      // Supabase REST data: network-first (freshness with offline fallback).
      {
        urlPattern: /\/rest\/v1\//,
        handler: "NetworkFirst",
        options: {
          cacheName: "supabase-api",
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
        },
      },
      // JS / CSS: stale-while-revalidate.
      {
        urlPattern: /\.(?:js|css)$/i,
        handler: "StaleWhileRevalidate",
        options: { cacheName: "static-resources" },
      },
      // Images: cache-first.
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "images",
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      // Fonts: cache-first (long-lived).
      {
        urlPattern: /\.(?:woff2?|ttf|otf)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "fonts",
          expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
