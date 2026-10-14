"use client";

import { useEffect } from 'react';

/**
 * 🌟 访问统计：仅 Vercel 生产环境加载（本地开发自动跳过）
 * 依赖 @vercel/analytics 包；Vercel 后台 → Analytics 页查看数据
 */
export default function Analytics() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') return;

    // 动态加载 @vercel/analytics，失败静默（不影响页面）
    import('@vercel/analytics').then(({ inject }) => inject())
      .catch(() => {});
  }, []);

  return null;
}
