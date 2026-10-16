"use client";

import { useEffect, useState } from 'react';

/**
 * 🌟 全站真实阅读量：调用 /api/views 按 slug 计数（存服务端，所有设备共享同一数字）
 * sessionStorage 防止同一次会话刷新重复计数；接口失败时回退 localStorage 本地计数
 *
 * 体验优化：先 GET 快速显示当前值（读一次 GitHub），首次会话再 POST 补 +1 更新，
 * 避免盯着 "…" 等两秒（读+写两次 GitHub API 串行）。
 */
export default function PostViews({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    try {
      const flagKey = `post-viewed-${slug}`;
      const isFirstViewThisSession = !sessionStorage.getItem(flagKey);
      if (isFirstViewThisSession) sessionStorage.setItem(flagKey, '1');

      // ① 先 GET 当前值，立刻显示（大多数访客的路径）
      fetch(`/api/views?slug=${encodeURIComponent(slug)}`)
        .then(r => r.json())
        .then(d => { if (alive && d && d.ok && typeof d.views === 'number') setViews(d.views); })
        .catch(() => {});

      // ② 本会话首次浏览：POST 计数 +1，拿到新值后覆盖显示
      if (isFirstViewThisSession) {
        fetch('/api/views', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug }),
        })
          .then(r => r.json())
          .then(d => { if (alive && d && d.ok && typeof d.views === 'number') setViews(d.views); })
          .catch(() => {
            // 服务不可用：回退本地计数，至少显示个大概
            if (!alive) return;
            try {
              const key = `post-views-${slug}`;
              const n = (parseInt(localStorage.getItem(key) || '0', 10) || 0) + 1;
              localStorage.setItem(key, String(n));
              setViews(n);
            } catch { /* 忽略 */ }
          });
      }
    } catch { /* 忽略 */ }
    return () => { alive = false; };
  }, [slug]);

  return <span>{views === null ? '…' : views} 阅读</span>;
}
