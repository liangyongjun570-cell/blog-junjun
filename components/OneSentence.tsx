"use client";

import { useEffect, useState } from 'react';

/**
 * 🌟 一言：每次刷新随机显示一句话（诗词/文学/哲学）
 * API: v1.hitokoto.cn（免费公共接口，无需密钥）
 */

type Hitokoto = { hitokoto: string; from?: string; from_who?: string };

export default function OneSentence() {
  const [data, setData] = useState<Hitokoto | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('https://v1.hitokoto.cn/?c=i&c=d&c=k&c=e&max_length=40')
      .then(r => r.json())
      .then(d => { if (alive && d.hitokoto) setData(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!data) return null;

  return (
    <div className="w-full max-w-3xl mx-auto mb-3 text-center select-none">
      <p className="font-serif italic text-xs md:text-sm text-slate-600 dark:text-slate-300 opacity-90">
        <span className="text-indigo-400 mr-1">「</span>
        {data.hitokoto}
        <span className="text-indigo-400 ml-1">」</span>
        {(data.from_who || data.from) && (
          <span className="ml-2 not-italic text-[10px] text-slate-400 dark:text-slate-500 font-bold">
            —— {data.from_who || ''}{data.from ? `《${data.from}》` : ''}
          </span>
        )}
      </p>
    </div>
  );
}
