"use client";

import { useMemo } from 'react';

/**
 * 🌟 发文热力图（GitHub Contributions 风格）
 * 传入 [{ date: 'YYYY-MM-DD', count: n }]，渲染最近 12 个月的格子
 */

type DayData = { date: string; count: number };

const LEVEL_CLASSES = [
  'bg-slate-200/70 dark:bg-slate-700/40',           // 0
  'bg-indigo-200 dark:bg-indigo-900/70',            // 1
  'bg-indigo-300 dark:bg-indigo-700/80',            // 2
  'bg-indigo-400 dark:bg-indigo-500/80',            // 3
  'bg-indigo-500 dark:bg-indigo-400',               // 4
];

function levelOf(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

export default function PostHeatmap({ data }: { data: DayData[] }) {
  const { weeks, total, activeDays, rangeLabel } = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of data) map.set(d.date, (map.get(d.date) || 0) + d.count);

    // 以今天为终点，向前推整 52 周（从周一开始）
    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    // 本周的周日作为最后一列的末尾
    const endSunday = new Date(end);
    endSunday.setDate(end.getDate() + (7 - ((end.getDay() + 6) % 7 + 1)));

    const start = new Date(endSunday);
    start.setDate(start.getDate() - 52 * 7 + 1); // 53 列

    const weeks: (DayData & { key: string })[][] = [];
    let total = 0, activeDays = 0;
    const cursor = new Date(start);
    for (let w = 0; w < 53; w++) {
      const col: DayData & { key: string }[] = [];
      for (let d = 0; d < 7; d++) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
        const count = map.get(key) || 0;
        if (count > 0) { total += count; activeDays++; }
        col.push({ date: key, count, key });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(col);
    }

    const startD = new Date(start);
    const rangeLabel = `${startD.getFullYear()}.${String(startD.getMonth() + 1).padStart(2, '0')} - ${end.getFullYear()}.${String(end.getMonth() + 1).padStart(2, '0')}`;
    return { weeks, total, activeDays, rangeLabel };
  }, [data]);

  if (!data?.length) return null;

  return (
    <div className="w-full bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-white/10 shadow-xl p-5 md:p-7 overflow-x-auto">
      <div className="flex items-baseline justify-between mb-4 min-w-max">
        <h3 className="font-black text-slate-900 dark:text-white text-sm tracking-wider flex items-center gap-2">
          🟪 更新热力图
          <span className="text-[10px] font-bold text-slate-400">{rangeLabel}</span>
        </h3>
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
          近一年创作 <span className="text-indigo-500 dark:text-indigo-400 font-black tabular-nums">{total}</span> 篇 · 活跃 <span className="text-indigo-500 dark:text-indigo-400 font-black tabular-nums">{activeDays}</span> 天
        </p>
      </div>

      <div className="flex gap-[3px] min-w-max">
        {weeks.map((col, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {col.map(day => (
              <div
                key={day.key}
                title={day.count > 0 ? `${day.date}：${day.count} 篇` : day.date}
                className={`w-[11px] h-[11px] rounded-[3px] ${LEVEL_CLASSES[levelOf(day.count)]} ${day.count > 0 ? 'hover:ring-2 hover:ring-indigo-400/60' : ''} transition-all`}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] font-bold text-slate-400 min-w-max">
        <span>少</span>
        {LEVEL_CLASSES.map((c, i) => <span key={i} className={`w-[10px] h-[10px] rounded-[3px] inline-block ${c}`} />)}
        <span>多</span>
      </div>
    </div>
  );
}
