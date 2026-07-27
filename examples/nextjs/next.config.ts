import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@pyrpc/client', '@pyrpc/react', '@pyrpc/next', '@pyrpc/types'],
};

export default nextConfig;
