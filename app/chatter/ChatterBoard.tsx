"use client";
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { siteConfig } from '../../siteConfig';

type Chatter = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  mood?: string;
  cover?: string;
  source?: { text: string; url: string } | null;
  content: string;
};

// 🎨 分区主题色：rgb 三元组用于聚光灯/辉光，hex 用于文字点缀
const SECTION_META: Record<string, { rgb: string; hex: string }> = {
  "AI 动态": { rgb: "129,140,248", hex: "#818cf8" },
  "Web3 加密艺术": { rgb: "244,114,182", hex: "#f472b6" },
  "开源项目": { rgb: "52,211,153", hex: "#34d399" },
  "其他": { rgb: "251,191,36", hex: "#fbbf24" },
};

function accentOf(tags?: string[]) {
  for (const t of tags || []) {
    if (SECTION_META[t]) return SECTION_META[t];
  }
  return SECTION_META["其他"];
}

// 把「为什么值得看」从正文里拆出来做成高亮块
function splitReason(preview: string) {
  const key = "为什么值得看";
  const i = preview.indexOf(key);
  if (i === -1) return { main: preview, reason: "" };
  return {
    main: preview.slice(0, i).trim(),
    reason: preview.slice(i + key.length).replace(/^[：:]?\s*/, "").trim(),
  };
}

export default function ChatterBoard({ chatters }: { chatters: Chatter[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState("全部");

  // 📡 科技情报站分区：固定显示四个栏目，避免某天缺稿时分区按钮消失
  const SECTION_TAGS = ["AI 动态", "Web3 加密艺术", "开源项目", "其他"];

  const allTags = useMemo(() => {
    const tags = new Set<string>(SECTION_TAGS);
    chatters.forEach(c => c.tags?.forEach(t => tags.add(t)));
    return ["全部", ...Array.from(tags)];
  }, [chatters]);

  // 每个分区的卡片数量角标
  const counts = useMemo(() => {
    const map: Record<string, number> = { "全部": chatters.length };
    chatters.forEach(c => c.tags?.forEach(t => { map[t] = (map[t] || 0) + 1; }));
    return map;
  }, [chatters]);

  const filteredChatters = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return chatters.filter(chatter => {
      const matchSearch = !query ||
        chatter.title.toLowerCase().includes(query) ||
        chatter.content.toLowerCase().includes(query);
      const matchTag = activeTag === "全部" || chatter.tags?.includes(activeTag);
      return matchSearch && matchTag;
    });
  }, [chatters, searchQuery, activeTag]);

  // 🖱️ 鼠标追随聚光灯：把光标坐标写进 CSS 变量
  const handleSpotlight = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-10 py-6 md:py-10 pt-24 md:pt-28 relative z-10">

      {/* 页头：标题 + 呼吸渐变光带 */}
      <div className="mb-8 md:mb-14 text-center">
        <h1 className="text-3xl md:text-5xl font-black mb-3 md:mb-4 tracking-tighter text-slate-900 dark:text-white">
          {siteConfig.chatterTitle || "源石研究笔记"}
        </h1>
        <div className="mx-auto w-24 md:w-40 h-[3px] rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-pink-500 bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite] opacity-80 mb-3 md:mb-4" />
        <p className="text-xs md:text-base text-slate-500 dark:text-slate-400 font-medium italic opacity-80">
          “ {siteConfig.chatterDescription || "日常碎片与灵感记录"} ”
        </p>
      </div>

      <div className="mb-8 md:mb-12 flex flex-col items-center gap-5 md:gap-8">
        <div className="relative w-full max-w-lg group px-2 md:px-0">
          <input
            type="text"
            placeholder="搜寻被遗忘的思绪..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 pl-10 md:pl-14 text-sm md:text-base text-slate-800 dark:text-white shadow-lg md:shadow-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-400 font-medium"
          />
          <svg className="w-4 h-4 md:w-6 md:h-6 absolute left-5 md:left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        {/* 分区按钮：渐变激活态 + 数量角标 */}
        <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 px-2 md:px-0">
          {allTags.map(tag => {
            const active = activeTag === tag;
            const count = counts[tag] || 0;
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`relative px-3 py-1.5 md:px-5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black transition-all duration-500 border ${
                  active
                  ? 'text-white border-transparent bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite] shadow-md md:shadow-lg md:shadow-fuchsia-500/30 scale-105'
                  : 'bg-white/30 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 border-white/20 dark:border-white/5 hover:bg-white/60 dark:hover:bg-slate-700/60 hover:scale-105'
                }`}
              >
                {tag === "全部" ? tag : `# ${tag}`}
                {count > 0 && (
                  <span className={`ml-1.5 inline-flex items-center justify-center min-w-[14px] md:min-w-[18px] h-[14px] md:h-[18px] px-1 rounded-full text-[8px] md:text-[10px] font-black ${
                    active ? 'bg-white/25 text-white' : 'bg-slate-500/10 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                  }`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 瀑布流卡片墙 */}
      <motion.div layout className="columns-2 lg:columns-3 gap-3 md:gap-6 space-y-3 md:space-y-6">
        <AnimatePresence mode='popLayout'>
          {filteredChatters.map((chatter) => {
            const a = accentOf(chatter.tags);
            const { main, reason } = splitReason(chatter.content || "");
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                key={chatter.slug}
                className="break-inside-avoid"
              >
                <Link
                  href={`/chatter/${chatter.slug}`}
                  onMouseMove={handleSpotlight}
                  className="group relative block rounded-2xl md:rounded-[28px] bg-white/40 dark:bg-slate-900/50 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-md md:shadow-xl transition-all duration-500 overflow-hidden hover:-translate-y-1.5 hover:shadow-[0_24px_70px_-18px_rgba(var(--acc-rgb),0.45)] dark:hover:border-white/20"
                  style={{ "--acc-rgb": a.rgb } as React.CSSProperties}
                >
                  {/* 🖱️ 鼠标追随聚光灯 */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"
                    style={{ background: `radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgba(${a.rgb},0.14), transparent 65%)` }}
                  />
                  {/* ✨ 顶部渐变光丝：悬浮时点亮 */}
                  <div
                    className="absolute top-0 left-5 right-5 h-px z-10 transition-opacity duration-500 opacity-30 group-hover:opacity-100"
                    style={{ background: `linear-gradient(90deg, transparent, ${a.hex}, transparent)` }}
                  />
                  {/* 🌊 悬浮流光扫过 */}
                  <div className="pointer-events-none absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
                    <div className="absolute -inset-y-8 -left-1/2 w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[sweep_0.9s_ease-out_1]" />
                  </div>

                  {chatter.cover && (
                    <div className="w-full h-28 md:h-52 overflow-hidden relative z-0">
                      <img src={chatter.cover} alt="cover" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
                    </div>
                  )}

                  <div className="relative z-10 p-3.5 md:p-7">
                    {/* 头部行：日期 + 分区徽章（呼吸灯） */}
                    <div className="flex items-center justify-between gap-2 mb-2 md:mb-4">
                      <div className="flex items-center gap-1.5 md:gap-2 text-[8px] md:text-[10px] font-black tracking-wider md:tracking-[0.2em] text-slate-400 dark:text-slate-500 font-mono uppercase">
                        <span className="inline-block w-1 h-1 md:w-1.5 md:h-1.5 rounded-full" style={{ background: a.hex }} />
                        {chatter.date}
                      </div>
                      {chatter.mood && (
                        <span className="relative inline-flex items-center gap-1 text-[8px] md:text-[10px] font-black px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-full border" style={{ color: a.hex, borderColor: `rgba(${a.rgb},0.35)`, background: `rgba(${a.rgb},0.08)` }}>
                          <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: a.hex }} />
                            <span className="relative inline-flex rounded-full h-full w-full" style={{ background: a.hex }} />
                          </span>
                          {chatter.mood}
                        </span>
                      )}
                    </div>

                    {chatter.title && (
                      <h3 className="text-sm md:text-xl font-bold text-slate-800 dark:text-white mb-1.5 md:mb-3 leading-tight transition-all duration-300 line-clamp-2 md:line-clamp-none group-hover:translate-x-0.5" >
                        <span className="bg-none transition-all duration-300 group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:text-transparent" style={{ "--tw-gradient-from": a.hex, "--tw-gradient-to": `rgba(${a.rgb},0.6)` } as React.CSSProperties}>{chatter.title}</span>
                      </h3>
                    )}

                    {/* 正文预览（已剥 markdown）+ 「为什么值得看」高亮块 */}
                    <div className="text-[10px] md:text-sm text-slate-600 dark:text-slate-300 leading-snug md:leading-relaxed line-clamp-4 md:line-clamp-5 space-y-1.5 md:space-y-2">
                      {reason ? (
                        <>
                          {main && <p className="opacity-90">{main}</p>}
                          <div className="rounded-lg md:rounded-xl border px-2 py-1.5 md:px-3 md:py-2.5" style={{ borderColor: `rgba(${a.rgb},0.25)`, background: `rgba(${a.rgb},0.07)` }}>
                            <span className="font-black mr-1" style={{ color: a.hex }}>💡 为什么值得看</span>
                            <span className="opacity-90">{reason}</span>
                          </div>
                        </>
                      ) : (
                        <p className="opacity-90">{main}</p>
                      )}
                    </div>

                    {/* 来源胶囊 */}
                    {chatter.source && (
                      <div className="mt-2 md:mt-4 inline-flex items-center gap-1 md:gap-1.5 max-w-full text-[8px] md:text-[11px] font-bold text-slate-500 dark:text-slate-400 rounded-md md:rounded-lg border border-slate-400/15 dark:border-white/10 bg-slate-500/5 dark:bg-white/5 px-1.5 py-0.5 md:px-2.5 md:py-1 transition-all duration-300 group-hover:border-slate-400/30">
                        <svg className="w-2 h-2 md:w-3 md:h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
                        <span className="truncate">{chatter.source.text}</span>
                      </div>
                    )}

                    {/* 底部：分区标签 + 阅读全文箭头 */}
                    <div className="mt-2.5 md:mt-5 flex items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1 md:gap-2">
                        {chatter.tags?.slice(0, 2).map(t => {
                          const ta = SECTION_META[t] || a;
                          return (
                            <span key={t} className="text-[8px] md:text-[9px] font-black px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-md border transition-all duration-300" style={{ color: ta.hex, borderColor: `rgba(${ta.rgb},0.25)`, background: `rgba(${ta.rgb},0.06)` }}>
                              #{t}
                            </span>
                          );
                        })}
                      </div>
                      <span className="inline-flex items-center gap-0.5 md:gap-1 text-[8px] md:text-[10px] font-black shrink-0 transition-all duration-300 group-hover:gap-1.5 md:group-hover:gap-2" style={{ color: a.hex }}>
                        阅读全文
                        <svg className="w-2 h-2 md:w-3 md:h-3 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12l-7.5 7.5M21 12H3" /></svg>
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
