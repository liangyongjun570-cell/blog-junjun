"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-6 text-center relative z-10">
      <span className="text-6xl animate-bounce">🛠️</span>
      <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-widest">
        页面打了个盹儿
      </h1>
      <p className="text-sm text-slate-500 dark:text-white/40 font-medium max-w-md break-all">
        出了点小故障{error?.digest ? `（编号 ${error.digest}）` : ''}，重试一下通常就好了。
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-black text-sm shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5 transition-all active:scale-95"
      >
        再试一次
      </button>
    </div>
  );
}
