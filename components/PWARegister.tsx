"use client";

import { useEffect } from 'react';

/**
 * 🌟 PWA Service Worker 注册（仅生产环境生效，本地 dev 不注册避免缓存干扰）
 */

export default function PWARegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return null;
}
