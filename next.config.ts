/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: "/a/**", // allow semua gambar di /a/
      },
    ],
  },
  rewrites: async () => [
    {
      source: "/hashtag/:tag",
      destination: "/search?q=%23:tag",
    },
  ],
  serverExternalPackages: ["@node-rs/argon2"],
  eslint: {
    // Unblock production builds on Vercel even if lint errors exist
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
