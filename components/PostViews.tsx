"use client";

import { useEffect, useState } from 'react';

/**
 * 🌟 全站真实访问计数：每次页面加载 +1（PV 模式，数据存 GitHub 仓库所有访客共享）
 * 先 GET 快速显示当前值，再 POST 补 +1 更新，页面几乎无感等待。
 * label：显示文案（文章="阅读"，页面级="次访问"）
 */
export default function PostViews({ slug, label = '阅读' }: { slug: string; label?: string }) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    try {
      // ① 先 GET 当前值，立刻显示
      fetch(`/api/views?slug=${encodeURIComponent(slug)}`)
        .then(r => r.json())
        .then(d => { if (alive && d && d.ok && typeof d.views === 'number') setViews(d.views); })
        .catch(() => {});

      // ② 本次访问：POST 计数 +1，拿到新值后覆盖显示
      fetch('/api/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })
        .then(r => r.json())
        .then(d => { if (alive && d && d.ok && typeof d.views === 'number') setViews(d.views); })
        .catch(() => {
          // 服务不可用：回退本地计数
          if (!alive) return;
          try {
            const key = `post-views-${slug}`;
            const n = (parseInt(localStorage.getItem(key) || '0', 10) || 0) + 1;
            localStorage.setItem(key, String(n));
            setViews(n);
          } catch { /* 忽略 */ }
        });
    } catch { /* 忽略 */ }
    return () => { alive = false; };
  }, [slug]);

  return <span className="tabular-nums">{views === null ? '…' : views} {label}</span>;
}
