"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * 🌟 404 彩蛋：像素猫接小鱼（方向键/触屏按钮操作，30 秒限时，最高分本地保存）
 */

type Fish = { x: number; y: number; v: number; size: number; bad: boolean };

export default function CatCatchGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const stateRef = useRef({ catX: 0.5, fish: [] as Fish[], score: 0, keys: { left: false, right: false }, raf: 0, t: 0 });

  useEffect(() => {
    try { setBest(Number(localStorage.getItem('jr_404_best') || 0)); } catch { /* 忽略 */ }
  }, []);

  const stop = useCallback(() => {
    setRunning(false);
    cancelAnimationFrame(stateRef.current.raf);
    setScore((s) => {
      setBest((b) => {
        const nb = Math.max(b, s);
        try { localStorage.setItem('jr_404_best', String(nb)); } catch { /* 忽略 */ }
        return nb;
      });
      return s;
    });
  }, []);

  const start = useCallback(() => {
    stateRef.current = { catX: 0.5, fish: [], score: 0, keys: { left: false, right: false }, raf: 0, t: 0 };
    setScore(0);
    setRunning(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = (canvas.width = canvas.offsetWidth * 2);
    const H = (canvas.height = 360 * 2);
    ctx.scale(1, 1);

    let last = performance.now();
    let elapsed = 0;
    const DURATION = 30;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      elapsed += dt;
      const st = stateRef.current;

      // 移动
      if (st.keys.left) st.catX = Math.max(0.04, st.catX - dt * 0.9);
      if (st.keys.right) st.catX = Math.min(0.96, st.catX + dt * 0.9);

      // 生成鱼（偶尔生成炸弹 💣）
      st.t += dt;
      if (st.t > 0.55) {
        st.t = 0;
        st.fish.push({
          x: 0.05 + Math.random() * 0.9,
          y: -0.05,
          v: 0.25 + Math.random() * 0.35,
          size: 26,
          bad: Math.random() < 0.18,
        });
      }

      // 更新与碰撞
      const catY = 0.86;
      st.fish.forEach((f) => { f.y += f.v * dt; });
      st.fish = st.fish.filter((f) => {
        const caught = f.y > catY - 0.05 && f.y < catY + 0.05 && Math.abs(f.x - st.catX) < 0.06;
        if (caught) {
          if (f.bad) { st.score = Math.max(0, st.score - 3); setScore(st.score); }
          else { st.score += 1; setScore(st.score); }
          return false;
        }
        return f.y < 1.05;
      });

      // 绘制
      ctx.clearRect(0, 0, W, H);
      // 背景
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(99,102,241,0.08)');
      grad.addColorStop(1, 'rgba(236,72,153,0.08)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.font = `${26 * 2}px serif`;
      ctx.textAlign = 'center';
      st.fish.forEach((f) => ctx.fillText(f.bad ? '💣' : '🐟', f.x * W, f.y * H));
      ctx.font = `${34 * 2}px serif`;
      ctx.fillText('🐱', st.catX * W, catY * H);
      // 剩余时间
      ctx.font = `bold ${16 * 2}px sans-serif`;
      ctx.fillStyle = '#6366f1';
      ctx.textAlign = 'left';
      ctx.fillText(`⏱ ${Math.max(0, (DURATION - elapsed)).toFixed(0)}s`, 20, 40);

      if (elapsed >= DURATION) { stop(); return; }
      st.raf = requestAnimationFrame(loop);
    };
    stateRef.current.raf = requestAnimationFrame(loop);
  }, [stop]);

  // 键盘控制
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') stateRef.current.keys.left = true;
      if (e.key === 'ArrowRight') stateRef.current.keys.right = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') stateRef.current.keys.left = false;
      if (e.key === 'ArrowRight') stateRef.current.keys.right = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      cancelAnimationFrame(stateRef.current.raf);
    };
  }, []);

  const touch = (dir: 'left' | 'right', on: boolean) => () => {
    stateRef.current.keys[dir] = on;
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-4 bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-white/10 shadow-xl p-5 select-none">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-black text-slate-900 dark:text-white text-sm tracking-wider">🎣 猫猫接小鱼 <span className="text-[10px] text-slate-400 font-bold">（等 404 的间隙玩一局）</span></h3>
        <div className="text-[11px] font-black text-slate-500 dark:text-slate-400">
          本局 <span className="text-indigo-500 dark:text-indigo-400 tabular-nums">{score}</span> 分 · 最高 <span className="text-pink-500 dark:text-pink-400 tabular-nums">{best}</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-[180px] md:h-[180px] rounded-2xl bg-slate-100/60 dark:bg-slate-900/40 touch-none"
      />

      <div className="flex items-center justify-center gap-3 mt-3">
        {!running ? (
          <button onClick={start} className="px-6 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-black text-xs shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5 transition-all active:scale-95">
            {score > 0 ? '再来一局 🎮' : '开始游戏 ▶'}
          </button>
        ) : (
          <button onClick={stop} className="px-6 py-2 rounded-full border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-300 font-black text-xs hover:border-pink-400/60 hover:text-pink-400 transition-all active:scale-95">
            结束这局
          </button>
        )}
        <div className="flex gap-2 md:hidden">
          <button onTouchStart={touch('left', true)} onTouchEnd={touch('left', false)} className="w-12 h-10 rounded-xl bg-white/70 dark:bg-slate-700 font-black text-lg">←</button>
          <button onTouchStart={touch('right', true)} onTouchEnd={touch('right', false)} className="w-12 h-10 rounded-xl bg-white/70 dark:bg-slate-700 font-black text-lg">→</button>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 font-bold text-center mt-2 hidden md:block">← → 方向键移动 · 吃 🐟 +1 分 · 碰 💣 -3 分 · 限时 30 秒</p>
    </div>
  );
}
