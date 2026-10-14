export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 relative z-10">
      <div className="w-10 h-10 rounded-full border-4 border-pink-400 border-t-transparent animate-spin" />
      <p className="text-xs font-black text-slate-400 dark:text-white/40 tracking-[0.3em] uppercase">
        Loading…
      </p>
    </div>
  );
}
