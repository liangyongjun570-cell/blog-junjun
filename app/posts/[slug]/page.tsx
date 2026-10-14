import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm'; // 🌟 核心引入：支持删除线和表格等 GFM 语法
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// 引入高亮主题
import 'highlight.js/styles/atom-one-dark.css';

import Navbar from '../../../components/Navbar';
import PageTransition from '../../../components/PageTransition';
import { siteConfig } from '../../../siteConfig';
import ClientSocials from '../../../components/ClientSocials';
import ClientTOC from '../../../components/ClientTOC';
import BackButton from '../../../components/BackButton';
import Comments from '../../../components/Comments';
import Reactions from '../../../components/Reactions';
import SidebarLyric from '../../../components/SidebarLyric';
import ArticleFooter from '../../../components/ArticleFooter';
import ArticleAuthorCard from '../../../components/ArticleAuthorCard';
import PostViews from '../../../components/PostViews';

export async function generateStaticParams() {
  const postsDirectory = path.join(process.cwd(), 'posts');
  if (!fs.existsSync(postsDirectory)) return [];

  const filenames = fs.readdirSync(postsDirectory);

  return filenames
    .filter((name) => name.endsWith('.md'))
    .map((name) => ({
      slug: name.replace(/\.md$/, ''),
    }));
}

function extractToc(content: string) {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const toc = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    toc.push({
      level: match[1].length,
      text: match[2].trim(),
      id: match[2].trim().toLowerCase().replace(/\s+/g, '-')
    });
  }
  return toc;
}

async function getPostData(slug: string) {
  const fullPath = path.join(process.cwd(), 'posts', `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  let { data, content } = matter(fileContents);

  // ==========================================
  // 🌟 前台渲染清洗区：终极防吞换行补丁！
  // ==========================================

  // 1. 强行修复数字列表缺少空格导致无法渲染为列表的 Bug (1.百度 -> 1. 百度)
  content = content.replace(/^(\s*\d+)\.([^ \n])/gm, '$1. $2');

  // 2. 🌟 拯救被 Markdown 引擎吞噬的“连续空行”！
  // 统一换行符，并清理纯空格的废弃空行
  content = content.replace(/\r\n/g, '\n').replace(/^[ \t]+$/gm, '');

  // 将代码块切开保护，只处理正文的连续空行！
  const blocks = content.split(/(```[\s\S]*?```)/g);
  content = blocks.map((block, index) => {
    // 奇数索引是代码块，原样返回，绝对不碰！
    if (index % 2 === 1) return block;

    // 偶数索引是正文。把 3 个以上的连续 \n 替换为真实的 <br/> 标签。
    // （3 个 \n 相当于中间空了 1 行真正的空白）
    return block.replace(/\n{3,}/g, (match) => {
      const brCount = match.length - 2;
      return '\n\n' + '<br/>'.repeat(brCount) + '\n\n';
    });
  }).join('');

  // ==========================================

  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    // 🌟 allowDangerousHtml 必须开启，这样上面生成的 <br/> 才能顺利通过变成真正的换行！
    .use(remarkRehype, { allowDangerousHtml: true })
    // 🌟 核心升级：开启代码语言自动侦测，并限制白名单，大幅提高 C++ 和常用语言的猜中率！
    // @ts-ignore
    .use(rehypeHighlight, {
      detect: true,
      ignoreMissing: true,
      subset: ['cpp', 'c', 'python', 'java', 'javascript', 'typescript', 'go', 'rust', 'bash', 'json', 'html', 'css', 'sql', 'xml']
    })
    .use(rehypeKatex)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(content);

  // 🌟 标题净化：扒掉标题末尾误入的 <br>/&nbsp;/空白，
  // 否则 h2 荧光笔色块（按盒子底部 38% 绘制）会悬空到空行上，变成一块脱节的紫斑
  let contentHtml = processedContent.toString();
  contentHtml = contentHtml.replace(/(<h[1-6][^>]*>)([\s\S]*?)((?:<br\s*\/?>|&nbsp;|\s)+)(<\/h[1-6]>)/gi, '$1$2$4');

  // 🌟 图片排版：把连续的图片（段落里只有图、或顶层 img）合并成图片行——两张 50% 刚好并排一行
  // ① 先把"只装了图片的段落"拆壳，露出 img
  contentHtml = contentHtml.replace(/<p[^>]*>\s*((?:<img[^>]*>\s*)+)<\/p>/gi, '$1');
  // ② 再把连续出现的 img 兄弟包进弹性行容器
  contentHtml = contentHtml.replace(/(?:<img[^>]*>\s*){2,}/gi, (m) => `<div class="img-row">${m.trim()}</div>`);

  // 🌟 外部链接（http/https）一律新标签页打开，不让读者离开当前页
  contentHtml = contentHtml.replace(
    /<a\s+href="(https?:\/\/[^"]*)"/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer"'
  );

  return {
    slug,
    contentHtml,
    toc: extractToc(content),
    title: data.title,
    description: data.description || '',
    date: data.date,
    tags: data.tags && Array.isArray(data.tags) ? data.tags : [],
    cover: data.cover || siteConfig.defaultPostCover
  };
}

function getRecentPosts(currentSlug: string) {
  const postsDirectory = path.join(process.cwd(), 'posts');
  let fileNames: string[] = [];
  try { fileNames = fs.readdirSync(postsDirectory).filter(f => f.endsWith('.md')); } catch(e) {}
  if (!fileNames) return [];
  return fileNames.map(f => {
    const s = f.replace(/\.md$/, '');
    const c = fs.readFileSync(path.join(postsDirectory, f), 'utf8');
    const { data } = matter(c);
    return { slug: s, title: data.title || '无标题', date: data.date };
  }).filter(p => p.slug !== currentSlug).slice(0, 3);
}

/* 按时间倒序排列全部文章，计算上一篇（更早）/ 下一篇（更新）与总数 */
function getNeighbors(currentSlug: string) {
  const postsDirectory = path.join(process.cwd(), 'posts');
  let all: { slug: string; title: string; t: number }[] = [];
  try {
    all = fs.readdirSync(postsDirectory).filter(f => f.endsWith('.md')).map(f => {
      const { data } = matter(fs.readFileSync(path.join(postsDirectory, f), 'utf8'));
      const t = new Date(data.date || '1970-01-01').getTime() || 0;
      return { slug: f.replace(/\.md$/, ''), title: data.title || '无标题', t };
    }).sort((a, b) => b.t - a.t || b.slug.localeCompare(a.slug));
  } catch (e) {}
  const idx = all.findIndex(p => p.slug === currentSlug);
  return {
    postsCount: all.length,
    index: idx >= 0 ? idx + 1 : all.length,
    prev: idx >= 0 && idx + 1 < all.length ? { slug: all[idx + 1].slug, title: all[idx + 1].title } : null,
    next: idx > 0 ? { slug: all[idx - 1].slug, title: all[idx - 1].title } : null,
  };
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const postData = await getPostData(resolvedParams.slug);
  const recentPosts = getRecentPosts(resolvedParams.slug);
  const { postsCount, index: postIndex, prev, next } = getNeighbors(resolvedParams.slug);

  // 预计阅读时长：按正文非空白字符数 / 400字每分钟估算
  const plainLen = postData.contentHtml.replace(/<[^>]+>/g, '').replace(/\s/g, '').length;
  const readMins = Math.max(1, Math.ceil(plainLen / 400));

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>

        {/* 🌸 大封面横幅：超大标题压图 + 副标题 + 作者信息行 + 分类标签 */}
        <div className="w-[95%] md:w-[90%] max-w-6xl mx-auto mt-24 md:mt-28 relative z-10">
          <div className="relative h-[300px] sm:h-[360px] md:h-[420px] rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/10 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={postData.cover} alt="封面" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/5" />

            <div className="absolute top-4 left-4 z-10"><BackButton /></div>

            {/* 衬线编号水印（呼应首页杂志编号美学） */}
            <div className="absolute top-3 right-6 text-right select-none pointer-events-none" aria-hidden>
              <p className="text-[10px] font-bold tracking-[0.4em] text-white/40 uppercase drop-shadow">Article</p>
              <p className="font-serif italic font-black text-6xl md:text-8xl leading-none text-white/20 group-hover:text-pink-300/35 transition-colors duration-700 drop-shadow">
                {String(Math.max(postIndex, 1)).padStart(2, '0')}
              </p>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-10">
              <h1 className="text-2xl sm:text-4xl md:text-5xl xl:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-[0_4px_18px_rgba(0,0,0,0.65)] max-w-[85%]">
                {postData.title}
              </h1>
              {postData.description && (
                <p className="mt-2 md:mt-3 text-pink-300 italic font-black text-sm sm:text-lg md:text-2xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] max-w-[85%]">
                  {postData.description}
                </p>
              )}

              {/* 信息行：毛玻璃胶囊（含预计阅读时长） */}
              <div className="mt-4 md:mt-5 inline-flex flex-wrap items-center gap-x-3.5 gap-y-2 rounded-full bg-black/35 backdrop-blur-md border border-white/20 px-4 md:px-5 py-2 md:py-2.5 text-white/90 text-xs md:text-sm shadow-lg">
                <span className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={siteConfig.avatarUrl} alt="作者" className="w-6 h-6 md:w-7 md:h-7 rounded-full object-cover ring-2 ring-pink-300/60 shadow" />
                  <span className="font-bold drop-shadow">{siteConfig.authorName}</span>
                </span>
                <span className="w-px h-3.5 bg-white/25" aria-hidden />
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" /></svg>
                  {postData.date}
                </span>
                <span className="w-px h-3.5 bg-white/25" aria-hidden />
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  <PostViews slug={resolvedParams.slug} />
                </span>
                <span className="w-px h-3.5 bg-white/25" aria-hidden />
                <span className="flex items-center gap-1.5 text-pink-300 font-bold">
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
                  约 {readMins} 分钟
                </span>
              </div>
            </div>

            {/* 分类贴纸：歪贴 + 胶带（呼应拍立得墙） */}
            {postData.tags.length > 0 && (
              <div className="absolute bottom-5 right-5 md:bottom-9 md:right-9 rotate-[-5deg] hover:rotate-0 hover:scale-110 transition-transform duration-300">
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-pink-200/60 -rotate-6 rounded-sm shadow-sm" aria-hidden />
                <div className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-br from-pink-400 to-fuchsia-400 text-white text-xs md:text-sm font-black shadow-lg shadow-pink-500/40">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 md:w-4 md:h-4"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                  {postData.tags[0]}
                </div>
              </div>
            )}
          </div>
        </div>

        <main className="w-[95%] md:w-[90%] max-w-6xl mx-auto mt-6 md:mt-8 flex flex-col lg:flex-row gap-6 md:gap-8 relative z-10">

          <article className="flex-1 bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden transition-colors duration-700">

            <div className="p-5 md:p-12 relative">
              <div className="relative">
                <style>{`
                  .prose h1 { font-size: 1.8rem !important; font-weight: 900 !important; margin-bottom: 1.2rem !important; margin-top: 2rem !important; line-height: 1.3 !important; color: inherit !important; }
                  .prose h2 { font-size: 1.5rem !important; font-weight: 800 !important; margin-bottom: 1rem !important; margin-top: 1.5rem !important; color: inherit !important; width: fit-content !important; padding: 0 0.35rem 0.1rem !important; border-radius: 0.35rem !important; background: linear-gradient(transparent 62%, rgba(249, 168, 212, 0.38) 62%) !important; }
                  .prose h2::before { content: '\\2726'; color: #f472b6; margin-right: 0.45rem; font-size: 0.8em; }
                  .prose h3 { font-size: 1.2rem !important; font-weight: 700 !important; margin-bottom: 0.8rem !important; color: inherit !important; }
                  .prose p { font-size: 0.95rem !important; line-height: 1.75 !important; color: inherit !important; }
                  
                  .prose a { color: #6366f1 !important; text-decoration: none !important; font-weight: 600 !important; border-bottom: 1px dashed #6366f1 !important; transition: all 0.3s ease !important; }
                  .prose a:hover { color: #4f46e5 !important; border-bottom-style: solid !important; background-color: rgba(99, 102, 241, 0.1) !important; padding: 0 0.2rem !important; border-radius: 0.2rem !important; }
                  .dark .prose a { color: #818cf8 !important; border-bottom-color: #818cf8 !important; }
                  .dark .prose a:hover { color: #a5b4fc !important; background-color: rgba(129, 140, 248, 0.15) !important; }

                  .prose ul { list-style-type: disc !important; padding-left: 1.5rem !important; font-size: 0.95rem !important; }
                  .prose ol { list-style-type: decimal !important; padding-left: 1.5rem !important; font-size: 0.95rem !important; }
                  .prose li { display: list-item !important; margin-bottom: 0.5rem !important; }
                  
                  .prose ul ul, .prose ol ul { list-style-type: circle !important; margin-top: 0.25rem !important; margin-bottom: 0.25rem !important; }
                  .prose ol ol, .prose ul ol { list-style-type: lower-alpha !important; margin-top: 0.25rem !important; margin-bottom: 0.25rem !important; }
                  
                  .prose del { text-decoration-color: inherit !important; opacity: 0.6; }
                  
                  /* 🌟 引用块专属果冻极客风样式补丁 */
                  .prose blockquote {
                    border-left: 4px solid #6366f1 !important;
                    background-color: rgba(99, 102, 241, 0.05) !important;
                    padding: 1rem 1.5rem !important;
                    margin: 1.5rem 0 !important;
                    border-radius: 0 1.25rem 1.25rem 0 !important;
                    font-style: italic !important;
                    color: #64748b !important;
                  }
                  .prose blockquote p {
                    margin: 0 !important; 
                    color: inherit !important;
                  }
                  .dark .prose blockquote {
                    border-left-color: #818cf8 !important;
                    background-color: rgba(129, 140, 248, 0.1) !important;
                    color: #94a3b8 !important;
                  }
                  
                  .prose pre {
                    background-color: #282c34 !important; color: #abb2bf !important;
                    padding: 1rem !important; border-radius: 0.75rem !important;
                    overflow-x: auto !important; box-shadow: inset 0 0 10px rgba(0,0,0,0.3) !important;
                    margin-top: 1rem !important; margin-bottom: 1rem !important;
                  }
                  
                  .prose pre code, .prose p code, .prose li code { 
                    font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, ui-monospace, monospace !important; 
                    font-variant-ligatures: contextual !important; 
                  }
                  .prose pre code { 
                    background-color: transparent !important; 
                    padding: 0 !important; 
                    color: inherit !important; 
                    font-size: 0.85em !important; 
                  }
                  
                  .prose code::before, .prose code::after { content: none !important; }
                  .prose p code, .prose li code { background-color: rgba(99, 102, 241, 0.1) !important; color: #6366f1 !important; padding: 0.1rem 0.3rem !important; border-radius: 0.25rem !important; font-weight: 600 !important; font-size: 0.85em !important; }
                  .dark .prose p code, .dark .prose li code { background-color: rgba(99, 102, 241, 0.2) !important; color: #818cf8 !important; }
                  .prose img { display: block !important; margin: 1.5rem auto !important; border-radius: 1rem !important; box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important; max-width: 100% !important; height: auto !important; }

                  /* 🌟 图片行：连续图片并排（两张 50% 刚好一行，多张自动换行） */
                  .prose .img-row { display: flex !important; flex-wrap: wrap; gap: 1rem; justify-content: center; align-items: flex-start; margin: 2rem 0 !important; }
                  .prose .img-row img { margin: 0 !important; }
                  .prose .img-row:has(img:nth-child(2)) img { width: calc(50% - 0.5rem) !important; }
                  /* 编辑器里手动设过宽度的图优先：100% 独占一行、25% 可四张一行 */
                  .prose .img-row:has(img:nth-child(2)) img[data-w="25%"] { width: 25% !important; }
                  .prose .img-row:has(img:nth-child(2)) img[data-w="50%"] { width: calc(50% - 0.5rem) !important; }
                  .prose .img-row:has(img:nth-child(2)) img[data-w="75%"] { width: 75% !important; }
                  .prose .img-row:has(img:nth-child(2)) img[data-w="100%"] { width: 100% !important; }

                  .prose pre code .hljs-comment, .prose pre code .hljs-quote { color: #5c6370 !important; font-style: italic !important; }
                  .prose pre code .hljs-doctag, .prose pre code .hljs-keyword, .prose pre code .hljs-formula { color: #c678dd !important; }
                  .prose pre code .hljs-keyword.type_, .prose pre code .hljs-type { color: #c678dd !important; } 
                  .prose pre code .hljs-section, .prose pre code .hljs-name, .prose pre code .hljs-selector-tag, .prose pre code .hljs-deletion, .prose pre code .hljs-subst { color: #e06c75 !important; }
                  .prose pre code .hljs-literal { color: #56b6c2 !important; }
                  .prose pre code .hljs-string, .prose pre code .hljs-regexp, .prose pre code .hljs-addition, .prose pre code .hljs-attribute, .prose pre code .hljs-meta-string { color: #98c379 !important; }
                  .prose pre code .hljs-built_in, .prose pre code .hljs-class .hljs-title, .prose pre code .hljs-title.class_ { color: #e6c07b !important; } 
                  .prose pre code .hljs-attr, .prose pre code .hljs-variable, .prose pre code .hljs-template-variable, .prose pre code .hljs-selector-class, .prose pre code .hljs-selector-attr, .prose pre code .hljs-selector-pseudo, .prose pre code .hljs-number { color: #d19a66 !important; }
                  .prose pre code .hljs-symbol, .prose pre code .hljs-bullet, .prose pre code .hljs-link, .prose pre code .hljs-meta, .prose pre code .hljs-selector-id, .prose pre code .hljs-title, .prose pre code .hljs-title.function_ { color: #61aeee !important; } 

                  @media (min-width: 768px) {
                    .prose h1 { font-size: 3rem !important; font-weight: 950 !important; margin-bottom: 2rem !important; margin-top: 3rem !important; line-height: 1.1 !important; }
                    .prose h2 { font-size: 2.2rem !important; margin-bottom: 1.5rem !important; margin-top: 2rem !important; }
                    .prose h2::before { font-size: 0.75em; }
                    .prose h3 { font-size: 1.5rem !important; margin-bottom: 1rem !important; }
                    .prose p { font-size: 1.15rem !important; line-height: 1.85 !important; }
                    
                    .prose ul, .prose ol { padding-left: 2rem !important; font-size: 1.1rem !important; }
                    
                    .prose pre { padding: 1.25rem !important; margin-top: 1.5rem !important; margin-bottom: 1.5rem !important; }
                    .prose pre code { font-size: 0.9em !important; }
                    .prose p code, .prose li code { padding: 0.2rem 0.4rem !important; font-size: 0.9em !important; border-radius: 0.375rem !important;}
                    .prose img { margin: 2rem auto !important; border-radius: 2rem !important; box-shadow: 0 20px 50px rgba(0,0,0,0.15) !important; }
                  }
                `}</style>

                <div
                  id="article-content"
                  className="prose prose-slate dark:prose-invert prose-base md:prose-lg max-w-none text-slate-800 dark:text-slate-200 transition-colors duration-700 scroll-smooth"
                  dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
                />
              </div>

              <ArticleFooter
                slug={resolvedParams.slug}
                title={postData.title || ''}
                tags={postData.tags}
                prev={prev}
                next={next}
              />

              {/* 🌟 表情反应：点一下 +1，再点取消 */}
              <div className="mt-8">
                <Reactions target={`posts/${resolvedParams.slug}`} />
              </div>

              <div className="mt-8">
                <Comments />
              </div>

            </div>
          </article>

          <aside className="w-full lg:w-[320px] flex flex-col gap-6 flex-shrink-0">
            {postData.toc.length > 0 && (
              <ClientTOC toc={postData.toc} />
            )}

            <ArticleAuthorCard postsCount={postsCount} />

            <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-xl">
              <h3 className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white mb-4 text-sm tracking-wider">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-pink-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                相关推荐
              </h3>
              <div className="space-y-3">
                {recentPosts.map(p => (
                  <Link key={p.slug} href={`/posts/${p.slug}`} className="group flex items-start gap-2">
                    <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-pink-400/70 flex-shrink-0 group-hover:bg-pink-400 transition-colors" />
                    <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-pink-500 dark:group-hover:text-pink-300 transition-colors line-clamp-1 leading-5">{p.title}</h4>
                  </Link>
                ))}
                {recentPosts.length === 0 && <p className="text-xs text-slate-400">暂无更多文章</p>}
              </div>
            </div>

            <SidebarLyric />
          </aside>
        </main>
      </PageTransition>
    </div>
  );
}