import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ['pdf-lib', '@pdf-lib/fontkit'],
};

export default nextConfig;
