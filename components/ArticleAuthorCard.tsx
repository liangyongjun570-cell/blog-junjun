"use client";

import { useEffect, useState } from 'react';
import { siteConfig } from '../siteConfig';
import ClientSocials from './ClientSocials';

export default function ArticleAuthorCard({ postsCount }: { postsCount: number }) {
  const [visits, setVisits] = useState<number>(0);

  useEffect(() => {
    try {
      const key = 'site-visit-count';
      const next = (parseInt(localStorage.getItem(key) || '0', 10) || 0) + 1;
      localStorage.setItem(key, String(next));
      setVisits(next);
    } catch { setVisits(1); }
  }, []);

  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

  return (
    <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-xl text-center transition-colors duration-700">
      <h3 className="flex items-center justify-center gap-1.5 font-black text-slate-900 dark:text-white mb-4 text-sm tracking-wider">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-pink-400"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
        关于作者
      </h3>
      <div className="w-20 h-20 mx-auto rounded-full p-1 bg-gradient-to-tr from-pink-400 to-fuchsia-500 shadow-md mb-3 transition-transform duration-500 hover:rotate-3">
        <img src={siteConfig.avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover bg-white" />
      </div>
      <p className="text-base font-black text-slate-900 dark:text-white">{siteConfig.authorName}</p>
      <p className="text-[11px] text-slate-500 dark:text-white/45 mt-1 mb-4">个人博客 / 学习交流 / 生活日常</p>
      <div className="flex items-center justify-center gap-8">
        <div>
          <p className="text-lg font-black text-pink-500 dark:text-pink-300 leading-none">{fmt(postsCount)}</p>
          <p className="text-[10px] text-slate-400 dark:text-white/40 mt-1">文章</p>
        </div>
        <span className="w-px h-7 bg-slate-200 dark:bg-white/10" />
        <div>
          <p className="text-lg font-black text-pink-500 dark:text-pink-300 leading-none">{fmt(visits)}</p>
          <p className="text-[10px] text-slate-400 dark:text-white/40 mt-1">访问</p>
        </div>
      </div>
      <div className="mt-4"><ClientSocials /></div>
    </div>
  );
}
