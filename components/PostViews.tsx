"use client";

import { useEffect, useState } from 'react';

/**
 * 🌟 全站真实阅读量：调用 /api/views 按 slug 计数（存服务端，所有设备共享同一数字）
 * sessionStorage 防止同一次会话刷新重复计数；接口失败时回退 localStorage 本地计数
 */
export default function PostViews({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    try {
      const flagKey = `post-viewed-${slug}`;
      const isFirstViewThisSession = !sessionStorage.getItem(flagKey);
      if (isFirstViewThisSession) sessionStorage.setItem(flagKey, '1');

      // 会话内重复浏览也要展示数字：GET 查询；首次进入用 POST 计数
      fetch(isFirstViewThisSession ? '/api/views' : `/api/views?slug=${encodeURIComponent(slug)}`, {
        method: isFirstViewThisSession ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        ...(isFirstViewThisSession ? { body: JSON.stringify({ slug }) } : {}),
      })
        .then(r => r.json())
        .then(d => {
          if (d && d.ok && typeof d.views === 'number') setViews(d.views);
          else setViews(null);
        })
        .catch(() => {
          // 服务不可用：回退本地计数，至少显示个大概
          try {
            const key = `post-views-${slug}`;
            let n = parseInt(localStorage.getItem(key) || '0', 10) || 0;
            if (isFirstViewThisSession) {
              n += 1;
              localStorage.setItem(key, String(n));
            }
            setViews(n);
          } catch {
            setViews(null);
          }
        });
    } catch {
      setViews(null);
    }
  }, [slug]);

  return <span>{views === null ? '…' : views} 阅读</span>;
}
