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

/* ---------- 小节标题：马克笔划线风格 ---------- */
function SectionHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div className="flex items-baseline gap-3">
        <h2 className="relative text-2xl sm:text-3xl font-black tracking-wide text-slate-800 dark:text-white">
          {title}
          <span className="absolute left-0 -bottom-1.5 h-[7px] w-full rounded-full -skew-x-12 bg-gradient-to-r from-pink-400/60 via-fuchsia-400/35 to-transparent" />
        </h2>
        {subtitle && <span className="hidden sm:inline text-xs text-slate-500 dark:text-white/40 font-serif italic">{subtitle}</span>}
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

const glass = "bg-white/40 dark:bg-slate-900/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl transition-colors duration-700";
const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
};
const noBar = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

/* ---------- 胶片齿孔 ---------- */
function Perforations() {
  return (
    <div className="flex justify-between px-1" aria-hidden>
      {Array.from({ length: 16 }).map((_, i) => (
        <span key={i} className="w-4 h-2 sm:w-5 sm:h-2.5 rounded-[3px] bg-white/15 flex-shrink-0" />
      ))}
    </div>
  );
}

export default function HomeShowcase({ notes, totalPosts, events, stats, fragments, albumCards }: Props) {
  const fragRef = useRef<HTMLDivElement>(null);
  const scrollFrag = (dir: number) => fragRef.current?.scrollBy({ left: dir * 460, behavior: 'smooth' });

  const featured = notes[0];
  const restNotes = notes.slice(1);
  const polaroidRot = ['-rotate-2', 'rotate-2', '-rotate-1', 'rotate-3'];

  return (
    <div className="flex flex-col gap-14 w-full">

      {/* ══════════ 近期笔记：头版大图 + 双列 compact ══════════ */}
      <motion.section {...fadeUp} transition={{ duration: 0.6 }} className="w-full">
        <SectionHeader title="近期笔记" right={<MoreLink href="/posts" />} />
        {featured ? (
          <div className="flex flex-col gap-4">
            {/* 头版特写 */}
            <Link
              href={`/posts/${featured.slug}`}
              className="group relative block h-52 sm:h-64 rounded-3xl overflow-hidden shadow-xl border border-white/20 dark:border-white/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featured.cover} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <span className="absolute top-3 right-6 font-serif italic font-black text-6xl sm:text-7xl text-white/20 group-hover:text-pink-300/50 transition-colors select-none drop-shadow">
                {String(Math.max(totalPosts, 1)).padStart(2, '0')}
              </span>
              <div className="absolute bottom-5 left-6 right-16 sm:right-28">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-pink-400/90 text-white text-[11px] font-bold tracking-wider shadow-md shadow-pink-400/40">最新</span>
                <h3 className="mt-2 text-xl sm:text-2xl font-black text-white truncate drop-shadow">{featured.title}</h3>
                <p className="text-white/70 text-xs sm:text-sm mt-1 line-clamp-1">{featured.dateLabel} · {featured.description || '暂无简介'}</p>
              </div>
            </Link>

            {/* 其余文章：双列紧凑卡 */}
            {restNotes.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {restNotes.map((n, i) => (
                  <Link
                    key={n.slug}
                    href={`/posts/${n.slug}`}
                    className="group flex items-center gap-3 rounded-2xl p-3 border border-white/40 dark:border-white/10 bg-white/40 dark:bg-slate-900/50 backdrop-blur-md hover:border-pink-300/70 dark:hover:border-pink-300/30 hover:shadow-lg hover:shadow-pink-300/10 transition-all"
                  >
                    <span className="w-8 flex-shrink-0 text-right font-serif italic font-black text-xl text-slate-300 dark:text-white/15 group-hover:text-pink-400 dark:group-hover:text-pink-300 transition-colors">
                      {String(Math.max(totalPosts - 1 - i, 1)).padStart(2, '0')}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={n.cover} alt="" className="w-16 h-12 rounded-lg object-cover flex-shrink-0 shadow-sm" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-slate-800 dark:text-white/90 truncate group-hover:text-pink-400 dark:group-hover:text-pink-300 transition-colors">{n.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5 truncate">{n.dateLabel} · {n.description || '暂无简介'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={`${glass} rounded-3xl py-12 text-center text-sm text-slate-400 dark:text-white/40`}>还没有文章，快去写第一篇吧～</div>
        )}
      </motion.section>

      {/* ══════════ 站点动态：横向时间轨道 ══════════ */}
      <motion.section {...fadeUp} transition={{ duration: 0.6 }} className="w-full">
        <SectionHeader
          title="站点动态"
          right={<span className="text-xs sm:text-sm text-slate-400 dark:text-white/40">文章 {stats.posts} · 碎片 {stats.chatters}</span>}
        />
        <div className={`${glass} rounded-3xl relative overflow-hidden`}>
          {/* 🌸 站点动态背景（86 蕾娜） */}
          <div className="absolute inset-0 pointer-events-none">
            <img src="/images/widget-timeline.jpg" alt="" className="w-full h-full object-cover" style={{ objectPosition: '50% 3%' }} />
            <div className="absolute inset-0 bg-white/65 dark:bg-slate-900/78 transition-colors duration-700"></div>
          </div>
          <div className={`relative px-4 sm:px-8 py-6 overflow-x-auto ${noBar}`}>
          {events.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400 dark:text-white/40">暂无动态</div>
          ) : (
            <div className="relative min-w-max mx-auto">
              {/* 横向主线 */}
              <div className="absolute left-0 right-6 top-1/2 h-[2px] bg-gradient-to-r from-pink-400/80 via-pink-400/40 to-transparent rounded-full" />
              <div className="flex">
                {events.map((e, i) => (
                  <div key={i} className="relative w-44 sm:w-48 h-44 flex-shrink-0">
                    {/* 连接线 */}
                    <span className={`absolute left-1/2 w-px h-5 bg-pink-400/50 ${i % 2 ? 'top-1/2' : 'bottom-1/2'}`} />
                    {/* 发光节点 */}
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-pink-400 shadow-[0_0_12px_3px_rgba(244,114,182,0.55)] ring-4 ring-pink-400/15" />
                    {/* 事件卡：上下交错 */}
                    <div className={`absolute left-1/2 -translate-x-1/2 w-40 ${i % 2 ? 'top-1/2 mt-6' : 'bottom-1/2 mb-6'}`}>
                      <div className="rounded-xl border border-pink-200/60 dark:border-pink-300/10 bg-white/70 dark:bg-white/5 backdrop-blur-sm px-3 py-2.5 hover:border-pink-400/60 transition-colors">
                        <p className="text-xs leading-relaxed text-slate-700 dark:text-white/80 line-clamp-2">{e.text}</p>
                        <p className="text-[10px] text-pink-400 dark:text-pink-300/80 mt-1.5 font-bold">{e.dateLabel}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      </motion.section>

      {/* ══════════ 随想碎片：电影胶片 ══════════ */}
      <motion.section {...fadeUp} transition={{ duration: 0.6 }} className="w-full">
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
        <div className="relative rounded-3xl bg-slate-900/85 dark:bg-black/70 backdrop-blur-md border border-white/10 shadow-2xl px-4 sm:px-6 py-4 overflow-hidden">
          <Perforations />
          <div ref={fragRef} className={`flex gap-4 overflow-x-auto py-4 ${noBar}`}>
            {fragments.length === 0 && (
              <div className="w-full py-10 text-center text-sm text-white/40">还没有碎片记录</div>
            )}
            {fragments.map((f, i) => (
              <div
                key={i}
                className={`relative w-48 sm:w-56 flex-shrink-0 rounded-xl overflow-hidden shadow-lg group ${i % 2 ? 'translate-y-2' : '-translate-y-1'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.src} alt={f.caption} className="w-full h-32 sm:h-36 object-cover transition-transform duration-500 group-hover:scale-110 group-hover:rotate-1" />
                {f.dateLabel && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/50 text-white/90 text-xs backdrop-blur-sm">{f.dateLabel}</span>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent pt-8 pb-2 px-3 flex items-end justify-between gap-2">
                  <span className="text-white text-xs truncate drop-shadow">{f.caption}</span>
                  <span className="px-1.5 py-0.5 rounded bg-pink-400/80 text-white text-[10px] flex-shrink-0">碎片</span>
                </div>
              </div>
            ))}
          </div>
          <Perforations />
        </div>
      </motion.section>

      {/* ══════════ 生活回想：拍立得墙 ══════════ */}
      <motion.section {...fadeUp} transition={{ duration: 0.6 }} className="w-full">
        <SectionHeader title="生活回想" subtitle="念念不忘，必有回响" right={<MoreLink href="/photowall" />} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 pt-2 pb-4 px-1">
          {albumCards.map((a, i) => (
            <Link
              key={i}
              href="/photowall"
              className={`group relative bg-white dark:bg-slate-800 p-3 pb-4 rounded-lg shadow-xl border border-black/5 dark:border-white/10 hover:rotate-0 hover:scale-[1.04] hover:z-10 hover:shadow-2xl transition-all duration-300 ${polaroidRot[i % 4]}`}
            >
              {/* 顶部胶带 */}
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-5 bg-pink-300/50 dark:bg-pink-400/30 -rotate-3 rounded-sm" aria-hidden />
              <div className="h-32 sm:h-40 overflow-hidden rounded-sm bg-slate-100 dark:bg-slate-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.cover} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <p className="mt-3 text-center font-serif italic font-bold text-sm text-slate-700 dark:text-white/85 truncate">{a.title}</p>
              <p className="text-center text-[10px] text-slate-400 dark:text-white/40 mt-0.5">
                {a.count > 0 ? `${a.count} 张照片` : a.description || '生活瞬间'}{a.dateLabel ? ` · ${a.dateLabel}` : ''}
              </p>
            </Link>
          ))}
          {/* 补位卡片：引导去照片墙 */}
          {albumCards.length < 4 && (
            <Link
              href="/photowall"
              className="group flex flex-col items-center justify-center gap-2 min-h-[180px] sm:min-h-[220px] rounded-lg border-2 border-dashed border-pink-300/50 dark:border-pink-300/20 text-slate-400 dark:text-white/40 hover:text-pink-400 hover:border-pink-400/70 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 transition-transform group-hover:rotate-90"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
              <span className="text-sm">去照片墙记录生活</span>
            </Link>
          )}
        </div>
      </motion.section>
    </div>
  );
}
