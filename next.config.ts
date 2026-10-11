import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许从 127.0.0.1 访问 dev 资源(Next 16 默认拦截跨源 dev 请求,会导致白屏)
  allowedDevOrigins: ["127.0.0.1", "localhost"],

  // 🚨 核心修改 1：关掉纯静态导出，让 Vercel 帮你把 API 跑起来！
  // output: 'export',

  // 🚨 核心修改 2：Vercel 不需要强制加斜杠，关掉它能避免很多 API 路径匹配错误
  // trailingSlash: true,

  // 下面这些可以保留
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true, // 忽略 TS 错误，方便快速部署
  },
};

export default nextConfig;