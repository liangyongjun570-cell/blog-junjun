"use client";

import { useEffect, useState } from 'react';

/**
 * 🌟 表情反应组件
 * 一排 emoji，访客点击 +1（再点取消），数据存 GitHub 仓库（无需登录）
 * target 唯一键：posts/<slug> | chatters/<slug> | moments/<id>
 */

const EMOJIS = [
  { key: 'like', emoji: '👍', label: '赞' },
  { key: 'heart', emoji: '❤️', label: '爱' },
  { key: 'laugh', emoji: '😂', label: '笑' },
  { key: 'wow', emoji: '🤯', label: '哇' },
  { key: 'party', emoji: '🎉', label: '贺' },
];

const MINE_KEY = (target: string) => `jr_reactions_${target}`;

type Counts = Record<string, number>;

export default function Reactions({ target, size = 'md' }: { target: string; size?: 'sm' | 'md' }) {
  const [counts, setCounts] = useState<Counts>({});
  const [mine, setMine] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // 读计数 + 本机已点亮的表情
  useEffect(() => {
    let alive = true;
    fetch(`/api/reactions?target=${encodeURIComponent(target)}`)
      .then(r => r.json())
      .then(d => { if (alive && d.ok) setCounts(d.reactions || {}); })
      .catch(() => {})
      .finally(() => { if (alive) setLoaded(true); });
    try {
      const saved = JSON.parse(localStorage.getItem(MINE_KEY(target)) || '[]');
      if (Array.isArray(saved)) setMine(saved);
    } catch { /* 忽略 */ }
    return () => { alive = false; };
  }, [target]);

  const toggle = async (emojiKey: string) => {
    if (busy) return;
    const isMine = mine.includes(emojiKey);
    const delta = isMine ? -1 : 1;

    // 乐观更新
    setCounts(prev => ({
      ...prev,
      [emojiKey]: Math.max(0, (Number(prev[emojiKey]) || 0) + delta),
    }));
    setMine(prev => {
      const next = isMine ? prev.filter(k => k !== emojiKey) : [...prev, emojiKey];
      try { localStorage.setItem(MINE_KEY(target), JSON.stringify(next)); } catch { /* 忽略 */ }
      return next;
    });

    setBusy(emojiKey);
    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, emoji: emojiKey, delta }),
      });
      const d = await res.json();
      // 以服务器返回为准
      if (d.ok && d.reactions) setCounts(d.reactions);
    } catch { /* 失败保留乐观值，下次刷新会校正 */ }
    setBusy(null);
  };

  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1.5 text-sm';

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
      {EMOJIS.map(({ key, emoji, label }) => {
        const count = Number(counts[key]) || 0;
        const isMine = mine.includes(key);
        return (
          <button
            key={key}
            onClick={() => toggle(key)}
            title={label}
            className={`flex items-center gap-1 rounded-full font-bold border backdrop-blur-sm transition-all duration-200 select-none ${pad}
              ${isMine
                ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'bg-white/50 dark:bg-slate-800/50 border-white/40 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-indigo-400/50 hover:bg-indigo-500/10 hover:text-indigo-500 dark:hover:text-indigo-300'}
              active:scale-95 hover:scale-105`}
          >
            <span className={`${isMine ? 'scale-110' : 'scale-100'} transition-transform duration-200 inline-block`}>{emoji}</span>
            {count > 0 && <span className="tabular-nums">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
