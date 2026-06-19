/** @type {import('next').NextConfig} */
const nextConfig = {
  // Для Docker standalone (VPS)
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
