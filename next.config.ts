import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow SVG rendering via next/image (needed for logo favicon.svg)
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",

    // Remote patterns for Supabase Storage and Unsplash dummy images
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/admin/dashboard",
        permanent: false,
      },
      {
        source: "/dashboard/:path*",
        destination: "/admin/dashboard/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
