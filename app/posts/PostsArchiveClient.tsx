"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';

/* 🌟 全部笔记归档：客户端搜索（标题/简介/标签）+ 年份分组 */

type Post = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  cover: string;
  dateLabel: string;
  year: string;
};

export default function PostsArchiveClient({ posts }: { posts: Post[] }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return posts;
    return posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some((t: string) => t.toLowerCase().includes(q))
    );
  }, [posts, q]);

  const groups = useMemo(() => {
    const gs: { year: string; posts: Post[] }[] = [];
    filtered.forEach(p => {
      const g = gs.find(x => x.year === p.year);
      if (g) g.posts.push(p);
      else gs.push({ year: p.year, posts: [p] });
    });
    return gs;
  }, [filtered]);

  return (
    <>
      {/* 🔍 搜索框 */}
      <div className="relative max-w-md mb-10 group">
        <div className="absolute inset-0 bg-pink-400/5 blur-xl group-focus-within:bg-pink-400/10 transition-all rounded-full" />
        <input
          type="text"
          placeholder="搜索标题、简介或标签…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-white/40 dark:bg-slate-900/50 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-full px-5 py-3 pl-12 pr-12 text-sm outline-none focus:ring-2 focus:ring-pink-400/60 transition-all shadow-sm"
        />
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-400 transition-colors" />
        {query && (
          <button onClick={() => setQuery('')} aria-label="清空搜索" className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors">
            <X size={14} className="text-slate-500" />
          </button>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="rounded-3xl bg-white/40 dark:bg-slate-900/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl py-16 text-center text-sm text-slate-400 dark:text-white/40">
          还没有文章，快去写第一篇吧～
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl bg-white/40 dark:bg-slate-900/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl py-16 text-center text-sm text-slate-400 dark:text-white/40">
          搜索不到「{query}」相关的笔记，换个关键词试试？
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {groups.map(g => (
            <section key={g.year}>
              {/* 年份分隔 */}
              <div className="flex items-center gap-4 mb-5">
                <span className="font-serif italic font-black text-3xl text-slate-300 dark:text-white/15 select-none">{g.year}</span>
                <span className="flex-1 h-px bg-gradient-to-r from-pink-400/40 to-transparent" />
                <span className="text-xs text-slate-400 dark:text-white/35">{g.posts.length} 篇</span>
              </div>

              <div className="flex flex-col gap-3">
                {g.posts.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/posts/${p.slug}`}
                    className="group flex items-center gap-4 rounded-2xl p-3 pr-5 border border-white/40 dark:border-white/10 bg-white/40 dark:bg-slate-900/50 backdrop-blur-md hover:border-pink-300/70 dark:hover:border-pink-300/30 hover:shadow-lg hover:shadow-pink-300/10 transition-all"
                  >
                    {/* 衬线编号 */}
                    <span className="w-10 flex-shrink-0 text-right font-serif italic font-black text-2xl text-slate-300 dark:text-white/15 group-hover:text-pink-400 dark:group-hover:text-pink-300 transition-colors">
                      {String(posts.length - posts.indexOf(p)).padStart(2, '0')}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.cover} alt="" className="w-20 h-14 rounded-xl object-cover flex-shrink-0 shadow-sm" loading="lazy" />
                    <div className="flex-1 min-w-0">
                      <h2 className="font-bold text-slate-800 dark:text-white/90 truncate group-hover:text-pink-400 dark:group-hover:text-pink-300 transition-colors">
                        {p.title}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-white/40 mt-1 line-clamp-1">{p.description}</p>
                      {p.tags.length > 0 && (
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          {p.tags.slice(0, 4).map((t: string) => (
                            <span key={t} className="px-1.5 py-0.5 rounded-md bg-pink-400/10 dark:bg-pink-300/10 text-pink-500 dark:text-pink-300/80 text-[10px] font-bold">
                              # {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-[11px] text-slate-400 dark:text-white/30 font-mono hidden sm:block">{p.dateLabel}</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
