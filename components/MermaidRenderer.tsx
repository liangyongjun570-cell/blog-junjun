"use client";

import { useEffect } from 'react';

/**
 * 🌟 Mermaid 图表渲染器
 * 扫描文章里 ```mermaid 代码块，客户端渲染成流程图/时序图/状态图
 * CDN 按需加载：页面里没有 mermaid 代码块就一个字节都不下载
 */

let mermaidPromise: Promise<any> | null = null;

function loadMermaid(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject();
  const w = window as any;
  if (w.mermaid) return Promise.resolve(w.mermaid);
  if (mermaidPromise) return mermaidPromise;

  mermaidPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
    s.async = true;
    s.onload = () => (w.mermaid ? resolve(w.mermaid) : reject(new Error('mermaid missing')));
    s.onerror = () => { mermaidPromise = null; reject(new Error('mermaid cdn failed')); };
    document.head.appendChild(s);
  });
  return mermaidPromise;
}

export default function MermaidRenderer() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const nodes = document.querySelectorAll('pre code.language-mermaid');
      if (!nodes.length) return;

      let mermaid: any;
      try {
        mermaid = await loadMermaid();
      } catch {
        return; // CDN 挂了就保留原代码块展示
      }
      if (cancelled) return;

      const dark = document.documentElement.classList.contains('dark');
      mermaid.initialize({
        startOnLoad: false,
        theme: dark ? 'dark' : 'default',
        securityLevel: 'loose',
        fontFamily: 'inherit',
      });

      for (const [i, node] of Array.from(nodes).entries()) {
        if (cancelled) return;
        const pre = node.closest('pre');
        const code = node.textContent || '';
        if (!pre || !code.trim()) continue;
        try {
          const { svg } = await mermaid.render(`mmd-${Date.now()}-${i}`, code);
          const div = document.createElement('div');
          div.innerHTML = svg;
          div.className = 'mermaid-chart my-6 md:my-8 flex justify-center overflow-x-auto rounded-2xl';
          div.querySelectorAll('svg').forEach((s: SVGSVGElement) => { s.style.maxWidth = '100%'; s.style.height = 'auto'; });
          pre.replaceWith(div);
        } catch { /* 语法错误保留原代码块展示 */ }
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return null;
}
