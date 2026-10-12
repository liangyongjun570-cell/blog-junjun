"use client";

import { useEffect, useState } from 'react';

/* 文章阅读量：localStorage 按slug累计，sessionStorage 防止同一次会话刷新重复计数 */
export default function PostViews({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    try {
      const key = `post-views-${slug}`;
      const flagKey = `post-viewed-${slug}`;
      let n = parseInt(localStorage.getItem(key) || '0', 10) || 0;
      if (!sessionStorage.getItem(flagKey)) {
        n += 1;
        localStorage.setItem(key, String(n));
        sessionStorage.setItem(flagKey, '1');
      }
      setViews(n);
    } catch {
      setViews(null);
    }
  }, [slug]);

  return <span>{views === null ? '…' : views} 阅读</span>;
}
