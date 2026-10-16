"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { siteConfig } from '../siteConfig';

interface NeighborPost { slug: string; title: string; }
interface Props {
  slug: string;
  title: string;
  tags: string[];
  prev: NeighborPost | null; // 上一篇（更早）
  next: NeighborPost | null; // 下一篇（更新）
}

const EMOJIS = [
  { icon: '👍', label: '点赞', key: 'like' },
  { icon: '👎', label: '踩', key: 'dislike' },
  { icon: '😄', label: '开心', key: 'happy' },
  { icon: '🎉', label: '庆祝', key: 'celebrate' },
  { icon: '💖', label: '喜欢', key: 'love' },
  { icon: '😲', label: '惊叹', key: 'wow' },
];

export default function ArticleFooter({ slug, title, tags, prev, next }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [subMsg, setSubMsg] = useState('');
  const [copyMsg, setCopyMsg] = useState('');
  const [pageUrl, setPageUrl] = useState('');

  // 🌟 全员实时累计：计数存服务端 GitHub 仓库（/api/reactions），所有访客共享同一份数字
  // mine 只记录本机点过哪个（localStorage），用于高亮和取消
  useEffect(() => {
    setPageUrl(window.location.href);
    try { setMine(JSON.parse(localStorage.getItem(`post-reactions-${slug}`) || 'null').mine || null); } catch {}
    let alive = true;
    fetch(`/api/reactions?target=${encodeURIComponent(`posts/${slug}`)}`)
      .then(r => r.json())
      .then(d => { if (alive && d.ok && d.reactions) setCounts(d.reactions); })
      .catch(() => {});
    return () => { alive = false; };
  }, [slug]);

  // 服务端结算：delta 组合（单选切换 = 旧的 -1 + 新的 +1）
  const pushDelta = async (key: string, delta: number) => {
    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: `posts/${slug}`, emoji: key, delta }),
      });
      const d = await res.json();
      if (d.ok && d.reactions) setCounts(d.reactions); // 以服务端返回为准
    } catch { /* 网络失败保留乐观值 */ }
  };

  const react = (emo: { label: string; key: string }) => {
    // 乐观更新（显示立刻响应）
    const c = { ...counts };
    let nextMine: string | null = emo.label;
    if (mine === emo.label) {
      c[emo.key] = Math.max((c[emo.key] || 1) - 1, 0);
      nextMine = null;
      pushDelta(emo.key, -1);
    } else {
      if (mine) {
        const oldKey = EMOJIS.find(e => e.label === mine)?.key;
        if (oldKey) {
          c[oldKey] = Math.max((c[oldKey] || 1) - 1, 0);
          pushDelta(oldKey, -1);
        }
      }
      c[emo.key] = (c[emo.key] || 0) + 1;
      pushDelta(emo.key, 1);
    }
    setCounts(c);
    setMine(nextMine);
    try { localStorage.setItem(`post-reactions-${slug}`, JSON.stringify({ mine: nextMine })); } catch {}
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(pageUrl); } catch {}
    setCopyMsg('链接已复制 ✓'); setTimeout(() => setCopyMsg(''), 1800);
  };

  const subscribe = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setSubMsg('请输入有效的邮箱地址'); return; }
    try {
      const r = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const d = await r.json();
      setSubMsg(d.message || (d.ok ? '订阅成功 ✨' : '订阅失败，稍后再试试'));
      if (d.ok) setEmail('');
    } catch {
      setSubMsg('网络出错了，请稍后再试');
    }
    setTimeout(() => setSubMsg(''), 3000);
  };

  const glass = "bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/40 dark:border-white/10";

  return (
    <div className="mt-12 md:mt-14 flex flex-col gap-6">

      {/* ═══ 表情打分 ═══ */}
      <div className="text-center">
        <p className="text-base font-bold text-slate-700 dark:text-white/85 mb-4">你认为这篇文章怎么样？</p>
        <div className="flex items-start justify-center gap-3 sm:gap-5 flex-wrap">
          {EMOJIS.map(e => {
            const active = mine === e.label;
            return (
              <button key={e.label} onClick={() => react(e)} className="relative group flex flex-col items-center gap-1.5" aria-label={e.label}>
                <span className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-2xl sm:text-3xl transition-all duration-300 border ${active ? 'bg-pink-500/20 border-pink-400 shadow-[0_0_16px_rgba(244,114,182,0.5)] scale-110' : `${glass} group-hover:border-pink-300 group-hover:scale-110 group-hover:-translate-y-1`}`}>
                  {e.icon}
                  {(counts[e.label] || 0) > 0 && (
                    <span className={`absolute -top-1.5 -right-1 min-w-[19px] px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none text-white flex items-center justify-center shadow-lg transition-colors ${active ? 'bg-pink-500 ring-2 ring-pink-300/60' : 'bg-pink-500/90 ring-2 ring-slate-200/80 dark:ring-slate-900/80 group-hover:bg-pink-400'}`}>{counts[e.label]}</span>
                  )}
                </span>
                <span className={`text-[10px] font-bold ${active ? 'text-pink-500 dark:text-pink-300' : 'text-slate-500 dark:text-white/45'}`}>{e.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ 订阅推送 ═══ */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 dark:from-black/80 dark:via-slate-900/80 dark:to-black/80 border border-white/10 shadow-xl text-center relative overflow-hidden">
        <span className="absolute -top-10 -right-10 w-40 h-40 bg-pink-500/15 blur-3xl rounded-full pointer-events-none" />
        <h3 className="text-lg sm:text-xl font-black text-white mb-4">订阅最新内容推送</h3>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto">
          <div className="flex items-center flex-1 w-full gap-2 rounded-xl bg-white/10 border border-white/15 px-4 py-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-white/50 flex-shrink-0"><path d="M4 6h16v12H4z" /><path d="m4 7 8 6 8-6" /></svg>
            <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && subscribe()} placeholder="输入您的电子邮箱" className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none" />
          </div>
          <button onClick={subscribe} className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl bg-pink-500 hover:bg-pink-400 text-white text-sm font-bold transition-all hover:shadow-lg hover:shadow-pink-500/30 whitespace-nowrap">
            立即订阅 <span aria-hidden>→</span>
          </button>
        </div>
        {subMsg && <p className="mt-3 text-xs text-pink-300 font-bold">{subMsg}</p>}
      </div>

      {/* ═══ 版权声明 ═══ */}
      <div className={`relative rounded-3xl p-5 sm:p-6 ${glass} shadow-lg overflow-hidden`}>
        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-serif italic font-black text-7xl text-pink-400/10 select-none pointer-events-none">©</span>
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="px-2 py-0.5 rounded-md bg-pink-500 text-white text-[11px] font-black tracking-wider">原创</span>
          <h4 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white/90 truncate">{title}</h4>
        </div>
        <p className="mt-2.5 text-xs sm:text-sm text-slate-500 dark:text-white/50 flex items-center gap-1.5 flex-wrap">
          本文链接：
          <a href={pageUrl} className="text-pink-500 dark:text-pink-300 underline underline-offset-4 decoration-pink-300/50 hover:decoration-pink-400 break-all">{title}</a>
        </p>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-white/50">
          本文采用 <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh" target="_blank" rel="noopener noreferrer" className="text-pink-500 dark:text-pink-300 underline underline-offset-4 decoration-pink-300/50 hover:decoration-pink-400">CC BY-NC-SA 4.0</a> 许可协议，转载请注明出处。
        </p>
      </div>

      {/* ═══ 分享 ═══ */}
      <div className={`flex items-center gap-3 flex-wrap rounded-3xl px-5 py-4 ${glass} shadow-lg relative`}>
        <span className="text-sm font-bold text-slate-600 dark:text-white/60">分享：</span>
        <button onClick={copyLink} title="复制链接" className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-900/5 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:text-pink-500 hover:bg-pink-500/10 dark:hover:text-pink-300 transition-all hover:scale-110">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4.5 h-4.5 w-[18px] h-[18px]"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
        </button>
        <button onClick={copyLink} title="微信分享（复制链接后发给朋友）" className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-900/5 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:text-pink-500 hover:bg-pink-500/10 dark:hover:text-pink-300 transition-all hover:scale-110">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M8.7 4C4.9 4 1.8 6.6 1.8 9.9c0 1.9 1 3.5 2.7 4.7l-.7 2.1 2.4-1.2c.7.2 1.4.4 2.2.4h.4a5 5 0 0 1-.2-1.5c0-3.1 3-5.6 6.7-5.6h.4C15 6.2 12.1 4 8.7 4zM6.5 7.4a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8zm4.6 0a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8zM22.2 14c0-2.8-2.8-5.1-6.1-5.1S10 11.2 10 14s2.8 5.1 6.1 5.1c.7 0 1.4-.1 2-.3l2.1 1.1-.6-1.9c1.6-1 2.6-2.5 2.6-4zm-8.2-1.2a.8.8 0 1 1 0-1.6.8.8 0 0 1 0 1.6zm4.2 0a.8.8 0 1 1 0-1.6.8.8 0 0 1 0 1.6z"/></svg>
        </button>
        <a href={`https://service.weibo.com/share/share.php?title=${encodeURIComponent(title)}&url=${encodeURIComponent(pageUrl)}`} target="_blank" rel="noopener noreferrer" title="分享到微博" className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-900/5 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:text-pink-500 hover:bg-pink-500/10 dark:hover:text-pink-300 transition-all hover:scale-110">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M10.9 8.6c-3.9.4-7.3 3-7.3 5.9 0 2.9 3 4.7 6.7 4.7 4.6 0 7.9-2.4 7.9-5.1 0-2.6-2.8-4-5.6-4.4-.5-.1-.8-.4-.6-.9.5-1.3.6-2.4 0-3-.7-.7-2.3-.4-4 .3 0 0-.9.4-.7-.3.3-1.2.1-2.2-.8-2.4-1.5-.3-3.9 1.5-4.9 3.6l.8.3c.7-1.3 2.2-2.7 3-2.6.6.1.5.9.2 1.7-.4 1.1.1 1.6 1.3 1.2zm.4 8.9c-2.5.3-4.7-.8-4.9-2.4-.2-1.6 1.7-3.1 4.1-3.4 2.5-.3 4.7.8 4.9 2.4.2 1.7-1.6 3.1-4.1 3.4zm-1.2-4.4c-1.3.2-2.3 1-2.2 1.9.1.9 1.2 1.4 2.5 1.2 1.3-.2 2.3-1 2.2-1.9-.1-.9-1.2-1.4-2.5-1.2zM19.8 4.5c-.9-1-2.2-1.4-3.4-1.2h-.1a.55.55 0 0 0 .1 1.1c.8-.1 1.7.2 2.3.9.6.7.8 1.6.6 2.4a.55.55 0 0 0 1.1.3c.3-1.3 0-2.6-.6-3.5zm-2.9 1.3c-.5-.5-1.1-.8-1.8-.7a.5.5 0 0 0-.4.6c.1.3.3.5.6.4.3 0 .6.1.8.4.2.2.3.6.2.9a.5.5 0 0 0 .4.6c.3 0 .5-.2.6-.4.2-.7 0-1.3-.4-1.8z"/></svg>
        </a>
        <a href={`https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer" title="分享到QQ" className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-900/5 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:text-pink-500 hover:bg-pink-500/10 dark:hover:text-pink-300 transition-all hover:scale-110">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M12 2C8.7 2 6.3 4.3 6.3 7.6c0 .5-.4 1.2-.8 1.9-.7 1.2-1.6 2.6-1.9 4.2-.2 1 0 1.8.5 2 .5.3 1.2 0 1.8-.6.3-.3.6-.7.9-1.1.3.7.8 1.3 1.4 1.8-1.2.4-2.6 1.2-2.6 2.2 0 1.3 2.5 2 4.4 2h4c1.9 0 4.4-.7 4.4-2 0-1-1.4-1.8-2.6-2.2.6-.5 1.1-1.1 1.4-1.8.3.4.6.8.9 1.1.6.6 1.3.9 1.8.6.5-.2.7-1 .5-2-.3-1.6-1.2-3-1.9-4.2-.4-.7-.8-1.4-.8-1.9C17.7 4.3 15.3 2 12 2z"/></svg>
        </a>
        {copyMsg && <span className="text-xs text-pink-500 dark:text-pink-300 font-bold">{copyMsg}</span>}
      </div>

      {/* ═══ 标签 ═══ */}
      {tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {tags.map(t => (
            <span key={t} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-pink-400/10 text-pink-500 dark:text-pink-300 border border-pink-400/25"><span className="opacity-60">◆</span> {t}</span>
          ))}
        </div>
      )}

      {/* ═══ 上一篇 / 下一篇 ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {prev ? (
          <Link href={`/posts/${prev.slug}`} className={`group flex items-center gap-3 rounded-2xl p-4 ${glass} shadow-lg hover:border-pink-300/60 transition-all hover:-translate-y-0.5`}>
            <span className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center bg-slate-900/5 dark:bg-white/5 text-slate-500 dark:text-white/50 group-hover:text-pink-500 dark:group-hover:text-pink-300 transition-colors"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
            <span className="min-w-0">
              <span className="block text-[11px] text-slate-400 dark:text-white/40 font-bold">上一篇</span>
              <span className="block text-sm font-bold text-slate-800 dark:text-white/85 truncate group-hover:text-pink-500 dark:group-hover:text-pink-300 transition-colors">{prev.title}</span>
            </span>
          </Link>
        ) : (
          <div className={`flex items-center gap-3 rounded-2xl p-4 ${glass} opacity-60`}>
            <span className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center bg-slate-900/5 dark:bg-white/5 text-slate-400"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
            <span><span className="block text-[11px] text-slate-400 dark:text-white/40 font-bold">上一篇</span><span className="block text-sm font-bold text-slate-400 dark:text-white/40">已经是第一篇文章啦~</span></span>
          </div>
        )}
        {next ? (
          <Link href={`/posts/${next.slug}`} className="group flex items-center justify-between gap-3 rounded-2xl p-4 text-right flex-row-reverse bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-lg hover:border-pink-300/60 transition-all hover:-translate-y-0.5">
            <span className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center bg-slate-900/5 dark:bg-white/5 text-slate-500 dark:text-white/50 group-hover:text-pink-500 dark:group-hover:text-pink-300 transition-colors"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
            <span className="min-w-0">
              <span className="block text-[11px] text-slate-400 dark:text-white/40 font-bold">下一篇</span>
              <span className="block text-sm font-bold text-slate-800 dark:text-white/85 truncate group-hover:text-pink-500 dark:group-hover:text-pink-300 transition-colors">{next.title}</span>
            </span>
          </Link>
        ) : (
          <div className="flex items-center justify-end gap-3 rounded-2xl p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-lg opacity-70">
            <span className="text-right"><span className="block text-[11px] text-slate-400 dark:text-white/40 font-bold">下一篇</span><span className="block text-sm font-bold text-pink-400/70">已经是最新文章啦~</span></span>
            <span className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center bg-slate-900/5 dark:bg-white/5 text-slate-400"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
          </div>
        )}
      </div>

      {/* 评论交流标题 */}
      <div className="flex items-baseline gap-3 border-t border-slate-300/40 dark:border-white/10 pt-8">
        <h3 className="relative text-xl sm:text-2xl font-black tracking-wide text-slate-800 dark:text-white">
          <span className="mr-1.5">💬</span>评论交流
          <span className="absolute left-0 -bottom-1.5 h-[6px] w-full rounded-full -skew-x-12 bg-gradient-to-r from-pink-400/60 via-fuchsia-400/35 to-transparent" />
        </h3>
        <span className="text-xs text-slate-400 dark:text-white/35">欢迎留下你的想法</span>
      </div>
    </div>
  );
}
