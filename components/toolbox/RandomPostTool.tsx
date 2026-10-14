"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 🌟 手气不错工具：打开即掷骰子，随机跳到一篇文章/杂谈
 */

export default function RandomPostTool() {
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    fetch('/api/random')
      .then(r => r.json())
      .then(d => {
        if (!alive || !d.ok) return;
        router.push(d.type === 'post' ? `/posts/${d.slug}` : `/chatter/${d.slug}`);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
      <span className="text-4xl animate-bounce">🎲</span>
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">骰子滚动中，正在前往一篇随机文章…</p>
    </div>
  );
}
