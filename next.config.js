import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "qqsawzyugzqftromgvay.supabase.co",
        port: "",
        // Pathname ini mengizinkan semua gambar dari bucket 'design-assets' Anda
        pathname: "/storage/v1/object/public/design-assets/**",
      },
    ],
  },
};

export default config;
