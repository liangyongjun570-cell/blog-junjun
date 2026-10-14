import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center relative z-10">
      <p className="font-serif italic font-black text-[7rem] sm:text-[10rem] leading-none bg-gradient-to-r from-pink-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent select-none">
        404
      </p>
      <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-widest">
        这条链接走进了迷雾里 🌫️
      </h1>
      <p className="text-sm text-slate-500 dark:text-white/40 font-medium">
        页面可能被挪走了，或者从来没存在过——先回首页看看吧。
      </p>
      <div className="flex gap-4 mt-2">
        <Link
          href="/"
          className="px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white font-black text-sm shadow-lg shadow-fuchsia-500/30 hover:-translate-y-0.5 hover:shadow-fuchsia-500/50 transition-all active:scale-95"
        >
          回首页
        </Link>
        <Link
          href="/posts"
          className="px-6 py-3 rounded-full border border-white/40 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-md text-slate-700 dark:text-white/80 font-black text-sm hover:border-pink-400/60 hover:text-pink-400 transition-all active:scale-95"
        >
          看看文章
        </Link>
      </div>
    </div>
  );
}
