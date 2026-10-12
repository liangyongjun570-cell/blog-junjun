"use client";

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export interface NoteItem { slug: string; title: string; cover: string; dateLabel: string; description: string; }
export interface EventItem { text: string; dateLabel: string; }
export interface FragmentItem { src: string; dateLabel: string; caption: string; }
export interface AlbumCard { title: string; cover: string; description: string; count: number; dateLabel: string; }

interface Props {
  notes: NoteItem[];
  totalPosts: number;
  events: EventItem[];
  stats: { posts: number; chatters: number };
  fragments: FragmentItem[];
  albumCards: AlbumCard[];
}

/* ---------- 通用小节标题：粉色竖条 + 标题 + 副标题 + 右侧插槽 ---------- */
function SectionHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div className="flex items-baseline gap-3">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-pink-400 to-fuchsia-500 shadow-md shadow-pink-400/40" />
          <h2 className="text-xl sm:text-2xl font-black tracking-wide text-slate-800 dark:text-white">{title}</h2>
        </div>
        {subtitle && <span className="hidden sm:inline text-xs text-slate-500 dark:text-white/40">{subtitle}</span>}
      </div>
      {right}
    </div>
  );
}

function MoreLink({ href }: { href: string }) {
  return (
    <Link href={href} className="group flex items-center gap-0.5 text-sm text-slate-500 dark:text-white/45 hover:text-pink-400 dark:hover:text-pink-300 transition-colors">
      更多
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 transition-transform group-hover:translate-x-0.5"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </Link>
  );
}

const cardCls = "rounded-3xl bg-white/40 dark:bg-slate-900/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl transition-colors duration-700";
const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
};

export default function HomeShowcase({ notes, totalPosts, events, stats, fragments, albumCards }: Props) {
  const fragRef = useRef<HTMLDivElement>(null);
  const scrollFrag = (dir: number) => fragRef.current?.scrollBy({ left: dir * 480, behavior: 'smooth' });

  return (
    <div className="flex flex-col gap-12 w-full">
      {/* ══════════ 第一行：近期笔记 + 站点动态 ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        {/* 近期笔记 */}
        <motion.div {...fadeUp} transition={{ duration: 0.6 }} className="lg:col-span-6 flex flex-col">
          <SectionHeader title="近期笔记" right={<MoreLink href="/posts" />} />
          <div className={`${cardCls} p-2 sm:p-3 flex-1`}>
            {notes.length === 0 && (
              <div className="py-10 text-center text-sm text-slate-400 dark:text-white/40">还没有文章，快去写第一篇吧～</div>
            )}
            <div className="flex flex-col">
              {notes.map((n, i) => (
                <Link
                  key={n.slug}
                  href={`/posts/${n.slug}`}
                  className="group flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3.5 rounded-2xl hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
                >
                  <span className="w-9 flex-shrink-0 text-right font-serif italic font-black text-2xl text-slate-300 dark:text-white/15 group-hover:text-pink-400 dark:group-hover:text-pink-300 transition-colors">
                    {String(Math.max(totalPosts - i, 1)).padStart(2, '0')}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={n.cover}
                    alt=""
                    className="w-20 h-14 sm:w-24 sm:h-16 rounded-xl object-cover border border-white/20 dark:border-white/10 shadow-md flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm sm:text-[15px] text-slate-800 dark:text-white/90 truncate group-hover:text-pink-400 dark:group-hover:text-pink-300 transition-colors">
                      {n.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-white/40 mt-1.5 truncate">
                      {n.dateLabel} · {n.description || '暂无简介'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 站点动态 */}
        <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.1 }} className="lg:col-span-6 flex flex-col">
          <SectionHeader
            title="站点动态"
            right={<span className="text-xs sm:text-sm text-slate-400 dark:text-white/40">文章 {stats.posts} · 碎片 {stats.chatters}</span>}
          />
          <div className={`${cardCls} px-5 sm:px-6 py-4 flex-1`}>
            {events.length === 0 && (
              <div className="py-10 text-center text-sm text-slate-400 dark:text-white/40">暂无动态</div>
            )}
            <div className="relative">
              <div className="absolute left-[7px] top-3 bottom-3 w-px bg-gradient-to-b from-pink-400/70 via-pink-400/30 to-transparent" />
              {events.map((e, i) => (
                <div key={i} className="relative flex items-center justify-between gap-4 py-[13px] pl-7">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[15px] h-[15px] rounded-full border-2 border-pink-400 bg-white dark:bg-slate-900 shadow-sm" />
                  <span className="text-sm text-slate-600 dark:text-white/70 truncate">{e.text}</span>
                  <span className="text-xs text-slate-400 dark:text-white/35 flex-shrink-0">{e.dateLabel}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ══════════ 随想碎片 ══════════ */}
      <motion.div {...fadeUp} transition={{ duration: 0.6 }} className="w-full">
        <SectionHeader
          title="随想碎片"
          subtitle="拾光成片，心事斑斓"
          right={
            <div className="flex items-center gap-2">
              <button onClick={() => scrollFrag(-1)} aria-label="向左滚动" className="w-8 h-8 rounded-full bg-white/50 dark:bg-white/10 border border-white/40 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-white/60 hover:text-pink-400 hover:scale-110 transition-all">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button onClick={() => scrollFrag(1)} aria-label="向右滚动" className="w-8 h-8 rounded-full bg-white/50 dark:bg-white/10 border border-white/40 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-white/60 hover:text-pink-400 hover:scale-110 transition-all">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          }
        />
        <div
          ref={fragRef}
          className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {fragments.length === 0 && (
            <div className={`${cardCls} w-full py-10 text-center text-sm text-slate-400 dark:text-white/40`}>还没有碎片记录</div>
          )}
          {fragments.map((f, i) => (
            <div key={i} className="relative w-52 h-36 sm:w-60 sm:h-40 rounded-2xl overflow-hidden flex-shrink-0 group shadow-lg border border-white/20 dark:border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.src} alt={f.caption} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/50 text-white/90 text-xs backdrop-blur-sm">
                {f.dateLabel}
              </span>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent pt-6 pb-2 px-3 flex items-end justify-between gap-2">
                <span className="text-white text-xs truncate drop-shadow">{f.caption}</span>
                <span className="px-1.5 py-0.5 rounded bg-pink-400/80 text-white text-[10px] flex-shrink-0">碎片</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ══════════ 生活回想 ══════════ */}
      <motion.div {...fadeUp} transition={{ duration: 0.6 }} className="w-full">
        <SectionHeader title="生活回想" subtitle="念念不忘，必有回响" right={<MoreLink href="/photowall" />} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {albumCards.map((a, i) => (
            <Link key={i} href="/photowall" className="relative h-44 rounded-3xl overflow-hidden group shadow-xl border border-white/20 dark:border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.cover} alt={a.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <h3 className="text-white font-bold text-lg truncate drop-shadow">{a.title}</h3>
                <p className="text-white/70 text-xs mt-0.5 truncate">
                  {a.count > 0 ? `${a.count} 张照片` : a.description || '记录生活的瞬间'}{a.dateLabel ? ` · ${a.dateLabel}` : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
