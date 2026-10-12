"use client";
import { useEffect, useRef, useState } from 'react';
import { useMusic } from './MusicProvider';
// 🌟 核心引入：Next.js 路由钩子
import { useRouter } from 'next/navigation';

const formatTime = (time: number) => {
  if (!time || isNaN(time)) return "00:00";
  const m = Math.floor(time / 60).toString().padStart(2, '0');
  const s = Math.floor(time % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const BAR_COUNT = 36;

export default function CloudPlayer() {
  const { playlist, currentSong, isPlaying, progress, currentTime, duration, currentLyric, isLoading, togglePlay, nextSong, prevSong, handleSeek, getAnalyser } = useMusic();
  const [displayedLyric, setDisplayedLyric] = useState("");
  // 🌟 初始化路由
  const router = useRouter();

  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    let i = 0;
    setDisplayedLyric("");
    const target = currentLyric || "";
    if (!target) return;

    const typingInterval = setInterval(() => {
      if (i <= target.length) {
        setDisplayedLyric(target.slice(0, i));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, [currentLyric]);

  // 🌟 频谱 + 低音脉冲：rAF 直改 DOM，不触发 React 重渲染
  useEffect(() => {
    let raf = 0;
    let zeroFrames = 0;
    let simulated = false; // 拿不到真实频谱（跨域/旧缓存）时用节拍模拟兜底
    const prev = new Array(BAR_COUNT).fill(0);
    let beatSmooth = 0;

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      const canvas = canvasRef.current;
      const card = cardRef.current;
      if (!canvas || !card) return;

      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const target = new Array(BAR_COUNT).fill(0);
      let beat = 0;

      if (isPlayingRef.current) {
        const analyser = getAnalyser();
        if (analyser && !simulated) {
          const data = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(data);
          let energy = 0;
          const step = Math.max(1, Math.floor(data.length / BAR_COUNT));
          for (let i = 0; i < BAR_COUNT; i++) {
            let sum = 0;
            for (let j = 0; j < step; j++) sum += data[i * step + j] || 0;
            target[i] = sum / step / 255;
            energy += target[i];
          }
          // 持续拿不到数据（CORS 被污染等）→ 切换到模拟节拍
          if (energy < 0.3) { zeroFrames++; if (zeroFrames > 120) simulated = true; }
          else zeroFrames = 0;
          beat = Math.min(1, (data[1] + data[2] + data[3]) / (3 * 200));
        }
        if (!analyser || simulated) {
          // 模拟节拍：低频重击 + 错落波动
          const thump = Math.pow(Math.abs(Math.sin(t / 480)), 4);
          for (let i = 0; i < BAR_COUNT; i++) {
            const wave = Math.sin(t / (170 + (i % 7) * 45) + i * 1.7) * 0.5 + 0.5;
            const edge = 1 - Math.abs(i - BAR_COUNT / 2) / (BAR_COUNT * 1.6);
            target[i] = Math.min(1, wave * (0.3 + 0.7 * thump) * (0.35 + edge));
          }
          beat = thump;
        }
      }

      // 平滑：上升快、下落慢，视觉更有弹性
      for (let i = 0; i < BAR_COUNT; i++) {
        prev[i] += (target[i] - prev[i]) * (target[i] > prev[i] ? 0.55 : 0.18);
      }
      beatSmooth += (beat - beatSmooth) * 0.25;

      // 低音脉冲注入 CSS 变量：封面缩放 / 按钮光晕 / 背景光效
      card.style.setProperty('--beat', beatSmooth.toFixed(3));

      // 绘制频谱条
      const gap = 2;
      const bw = (w - gap * (BAR_COUNT - 1)) / BAR_COUNT;
      const grad = ctx.createLinearGradient(0, h, 0, 0);
      grad.addColorStop(0, '#ec4899');
      grad.addColorStop(0.55, '#a78bfa');
      grad.addColorStop(1, '#60a5fa');
      ctx.fillStyle = grad;
      for (let i = 0; i < BAR_COUNT; i++) {
        const bh = Math.max(2, prev[i] * h * 0.92);
        const x = i * (bw + gap);
        const y = h - bh;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(x, y, bw, bh, 2);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, bw, bh);
        }
      }
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [getAnalyser]);

  if (isLoading) {
    return (
      <div className="h-full w-full rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 flex flex-col items-center justify-center transition-colors duration-700">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-slate-800 dark:text-white font-bold tracking-widest animate-pulse text-sm">CONNECTING...</span>
      </div>
    );
  }

  if (playlist.length === 0 || !currentSong) {
    return (
      <div className="h-full w-full rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 flex flex-col items-center justify-center transition-all duration-700">
        <div className="w-16 h-16 mb-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shadow-inner opacity-50">
          <svg className="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
        </div>
        <span className="text-slate-500 dark:text-slate-400 font-bold tracking-widest text-xs uppercase">No Music Available</span>
        <span className="text-[10px] text-slate-400 mt-1">请检查播放列表或网络连接</span>
      </div>
    );
  }

  // 🌟 拦截事件防冒泡的专属函数
  const safeTogglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    togglePlay();
  };

  const safePrevSong = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    prevSong();
  };

  const safeNextSong = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    nextSong();
  };

  const safeHandleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    handleSeek(e);
  };

  return (
    <>
      <style>{`
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #6366f1; cursor: pointer; transition: transform 0.1s; }
        input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.3); }
        @keyframes islandWave { 0%, 100% { height: 3px; } 50% { height: 13px; } }
        .island-wave { animation: islandWave 0.8s ease-in-out infinite; transform-origin: bottom; will-change: height; }
      `}</style>

      {/* 🌟 终极逻辑：在外层 Div 直接绑定 onClick 进行页面跳转 */}
      <div
        ref={cardRef}
        onClick={() => router.push('/music')}
        className="h-full w-full rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 pt-8 flex flex-col justify-between transition-all duration-700 hover:scale-[1.02] relative group overflow-hidden cursor-pointer"
      >
        {/* 随低音呼吸的双色光晕 */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/25 blur-[50px] rounded-full pointer-events-none" style={{ opacity: 'calc(0.3 + var(--beat, 0) * 0.7)' }}></div>
        <div className="absolute -bottom-24 -left-20 w-48 h-48 bg-pink-500/20 blur-[50px] rounded-full pointer-events-none" style={{ opacity: 'calc(0.2 + var(--beat, 0) * 0.8)' }}></div>

        {/* 🌟 灵动岛：顶部胶囊，播放时展开 + 随节拍跳动 */}
        <div
          className={`absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center rounded-full bg-slate-900/95 dark:bg-black/90 text-white shadow-lg shadow-black/40 border border-white/10 backdrop-blur transition-all duration-500 ease-out ${isPlaying ? 'pl-3.5 pr-4 py-1.5 gap-2' : 'px-3.5 py-1'}`}
        >
          {isPlaying ? (
            <>
              <span className="flex items-end gap-[2.5px] h-[14px]">
                {[0, 1, 2, 3, 4].map(i => (
                  <span key={i} className="island-wave w-[3px] rounded-sm bg-gradient-to-t from-pink-400 to-indigo-400" style={{ animationDelay: `${i * 0.13}s`, animationDuration: `${0.65 + i * 0.08}s` }} />
                ))}
              </span>
              <span className="text-[10px] font-bold tracking-wider truncate max-w-[110px] sm:max-w-[150px]">{currentSong.title}</span>
            </>
          ) : (
            <span className="text-[10px] font-black tracking-[0.25em] text-white/60">♪ MUSIC</span>
          )}
        </div>

        <div className="flex items-center gap-5 relative z-10 mb-4 mt-2">
          {/* 封面：外层随低音脉冲，内层保持旋转 */}
          <div className="w-20 h-20 flex-shrink-0" style={{ transform: 'scale(calc(1 + var(--beat, 0) * 0.09))' }}>
            <div
              className="w-full h-full rounded-full border-2 border-white/50 shadow-lg overflow-hidden relative animate-[spin_6s_linear_infinite]"
              style={{ animationPlayState: isPlaying ? 'running' : 'paused', willChange: 'transform' }}
            >
              <img src={currentSong.cover} alt="cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white/80 backdrop-blur-sm rounded-full border border-gray-300 shadow-inner"></div>
            </div>
          </div>

          <div className="flex-col overflow-hidden w-full">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 tracking-widest uppercase bg-white/50 dark:bg-slate-900/50 px-2 py-0.5 rounded-sm shadow-sm transition-colors duration-700">Cloud Music</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate drop-shadow-sm transition-colors duration-700">{currentSong.title}</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium truncate drop-shadow-sm transition-colors duration-700">{currentSong.artist}</p>
          </div>
        </div>

        <div className="relative z-10 mb-2 h-6 overflow-hidden">
           <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate">{displayedLyric}</p>
        </div>

        <div className="relative z-10 mt-auto">
          {/* 🌟 实时频谱：真分析器数据，拿不到时自动切模拟节拍 */}
          <div className="h-12 mb-3 rounded-xl overflow-hidden bg-white/30 dark:bg-white/5 border border-white/30 dark:border-white/10 shadow-inner">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>

          {/* 🌟 核心拦截：把进度条的点击也拦住 */}
          <div
             className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-bold mb-3 transition-colors duration-700"
             onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
             onPointerDown={(e) => { e.stopPropagation(); }}
          >
            <span className="w-10 text-right">{formatTime(currentTime)}</span>
            <input
              type="range" min="0" max="100"
              value={progress}
              onChange={safeHandleSeek}
              className="flex-1 h-1.5 bg-white/40 dark:bg-slate-700/50 rounded-full appearance-none outline-none cursor-pointer shadow-inner"
              style={{ background: `linear-gradient(to right, #818cf8 ${progress}%, rgba(148,163,184,0.4) ${progress}%)` }}
            />
            <span className="w-10">{formatTime(duration)}</span>
          </div>

          {/* 🌟 核心拦截：使用我们上面写的 safe 函数，阻止事件冒泡 */}
          <div className="flex items-center justify-center gap-6">
            <button onClick={safePrevSong} className="text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors drop-shadow-sm relative z-20">
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>

            <button
              onClick={safeTogglePlay}
              className="w-12 h-12 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-600 hover:scale-110 transition-all border-2 border-white/50 dark:border-slate-600 relative z-20"
              style={{ boxShadow: '0 0 calc(10px + var(--beat, 0) * 22px) rgba(99, 102, 241, 0.55)' }}
            >
              {isPlaying ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
            </button>

            <button onClick={safeNextSong} className="text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors drop-shadow-sm relative z-20">
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
