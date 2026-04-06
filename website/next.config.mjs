/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "rimh2.domainstatic.com.au",
      },
      {
        protocol: "https",
        hostname: "bucket-api.domain.com.au",
      },
    ],
  },
};

export default nextConfig;
