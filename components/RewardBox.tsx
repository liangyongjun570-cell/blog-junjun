"use client";

import { useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * 🌟 打赏盒子：文章底部"请作者喝杯奶茶"按钮 → 弹出微信/支付宝收款码
 * 二维码图片路径：/reward-wechat.jpg 与 /reward-alipay.jpg（放到 public/ 即可生效）
 * 图片不存在时自动显示占位提示
 *
 * ⚠️ 弹窗必须用 Portal 挂到 body：文章外层 PageTransition 的 framer-motion
 *    transform 会劫持 fixed 定位（弹窗被钉在文章容器里，要滚半天才能看到）
 */

function QRSlot({ src, label }: { src: string; label: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-40 h-40 rounded-2xl bg-white/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden shadow-inner">
        {failed ? (
          <span className="text-[10px] text-slate-400 font-bold text-center px-3 leading-relaxed">
            {label}占位<br />将收款码图片放入<br />public/{src.replace('/', '')}
          </span>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={src} alt={label} className="w-full h-full object-contain" onError={() => setFailed(true)} />
        )}
      </div>
      <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
}

export default function RewardBox() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => setOpen(true)}
          className="px-5 py-2.5 rounded-full border border-pink-400/40 bg-pink-500/5 dark:bg-pink-400/10 text-pink-500 dark:text-pink-300 font-black text-xs hover:bg-pink-500/15 hover:border-pink-400/70 hover:-translate-y-0.5 transition-all active:scale-95"
        >
          ☕ 觉得有用？请作者喝杯奶茶
        </button>
      </div>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20 max-w-md w-full relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-black"
              aria-label="关闭"
            >
              ×
            </button>
            <h3 className="text-center font-black text-slate-900 dark:text-white mb-1">感谢支持 ❤️</h3>
            <p className="text-center text-[11px] font-bold text-slate-400 mb-5">扫一扫，请我喝一杯快乐水</p>
            <div className="flex justify-center gap-6">
              <QRSlot src="/reward-wechat.jpg" label="微信" />
              <QRSlot src="/reward-alipay.jpg" label="支付宝" />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
