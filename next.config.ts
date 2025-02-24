import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export', // 静的HTMLを生成する
  images: {
    unoptimized: true, // 画像最適化を無効化
  }
};

export default nextConfig;
