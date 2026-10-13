"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { siteConfig } from '../siteConfig';

interface WeatherInfo {
  city: string;
  temp: number;
  text: string;
  isMock?: boolean;
}

// 社交图标 (内联 SVG，免依赖)
const GithubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.7.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/></svg>
);
const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6L22 7"/></svg>
);
const QqIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 1.5c-3.6 0-6.2 2.6-6.2 6.4 0 .8.1 1.6.3 2.4-.7 1-1.7 2.7-2.1 4.4-.3 1.2-.1 2.2.3 2.4.4.2 1.2-.4 1.9-1.5.3 1 1 2 1.9 2.7-1.2.4-2 1-2 1.7 0 1.2 2.6 2.1 5.9 2.1s5.9-.9 5.9-2.1c0-.7-.8-1.3-2-1.7.9-.7 1.6-1.7 1.9-2.7.7 1.1 1.5 1.7 1.9 1.5.4-.2.6-1.2.3-2.4-.4-1.7-1.4-3.4-2.1-4.4.2-.8.3-1.6.3-2.4 0-3.8-2.6-6.4-6.2-6.4z"/></svg>
);
const WechatIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M8.7 4C4.9 4 1.8 6.6 1.8 9.9c0 1.9 1 3.5 2.6 4.6l-.7 2.1 2.4-1.2c.6.2 1.3.3 2 .3h.4a5.5 5.5 0 0 1-.2-1.5c0-3.1 3-5.6 6.6-5.6h.4C14.6 6 12 4 8.7 4zM6.4 7.3a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8zm4.6 0a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8zm4.4 2.8c-3.2 0-5.8 2.1-5.8 4.8s2.6 4.8 5.8 4.8c.6 0 1.2-.1 1.7-.2l2 1-.6-1.7c1.4-.9 2.4-2.3 2.4-3.9 0-2.7-2.5-4.8-5.5-4.8zm-2 2.5a.8.8 0 1 1 0 1.5.8.8 0 0 1 0-1.5zm4 0a.8.8 0 1 1 0 1.5.8.8 0 0 1 0-1.5z"/></svg>
);

export default function HeroSection() {
  const [now, setNow] = useState<string>('');
  const [weather, setWeather] = useState<WeatherInfo | null>(null);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    };
    tick();
    const t = setInterval(tick, 10000);

    fetch('/api/weather')
      .then(r => r.json())
      .then((d) => {
        // /api/weather 返回和风 V7 原始结构：{ code, now: { temp, text, icon, ... } }
        if (d && d.code === '200' && d.now) {
          setWeather({ city: '东莞市', temp: parseInt(d.now.temp), text: d.now.text, isMock: false });
        } else {
          setWeather({ city: '东莞市', temp: 22, text: '气候模拟', isMock: true });
        }
      })
      .catch(() => setWeather({ city: '东莞市', temp: 22, text: '气候模拟', isMock: true }));
    return () => clearInterval(t);
  }, []);

  const socials = [
    { name: 'GitHub', url: siteConfig.social.github, Icon: GithubIcon },
    { name: 'Email', url: `mailto:${siteConfig.social.email}`, Icon: MailIcon },
    { name: 'QQ', url: `https://wpa.qq.com/msgrd?v=3&site=qq&menu=yes&uin=${siteConfig.social.qq}`, Icon: QqIcon },
    { name: 'WeChat', url: `weixin://`, Icon: WechatIcon },
  ].filter(s => s.url);

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
      {/* 全屏背景图 + 渐变压暗 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${siteConfig.bgImages[0]})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />

      {/* 主内容 */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 -mt-10">
        {/* 头像 + 旋转虚线环 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative w-36 h-36 sm:w-44 sm:h-44 mb-8"
        >
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/60 animate-[spin_16s_linear_infinite]" />
          <div className="absolute inset-2 rounded-full overflow-hidden border-2 border-white/40 shadow-2xl shadow-black/50 bg-black/30">
            <img src={siteConfig.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          </div>
        </motion.div>

        {/* 大标题 */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="text-5xl sm:text-7xl font-black tracking-tight bg-gradient-to-r from-pink-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent drop-shadow-lg"
        >
          {siteConfig.title}
        </motion.h1>

        {/* 座右铭 */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-5 max-w-2xl text-white/90 text-base sm:text-lg leading-relaxed drop-shadow"
        >
          {siteConfig.bio}
        </motion.p>

        {/* 社交图标 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="mt-8 flex items-center gap-5"
        >
          {socials.map(({ name, url, Icon }) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title={name}
              className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/25 flex items-center justify-center text-white/90 hover:text-white hover:bg-white/25 hover:scale-110 transition-all shadow-lg"
            >
              <Icon />
            </a>
          ))}
        </motion.div>

        {/* 时间 · 城市 · 天气 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-8 flex items-center gap-3 text-white/85 text-sm sm:text-base font-medium drop-shadow"
        >
          <span>{now || '··:··'}</span>
          <span className="opacity-50">·</span>
          <span>东莞</span>
          <span className="opacity-50">·</span>
          <span>
            {weather ? `${weather.text} ${weather.temp}°C` : '天气加载中…'}
          </span>
        </motion.div>
      </div>

      {/* 下滑箭头 */}
      <motion.a
        href="#home-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/70 hover:text-white transition-colors"
        aria-label="向下滚动"
      >
        <motion.svg
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </motion.svg>
      </motion.a>
    </section>
  );
}
