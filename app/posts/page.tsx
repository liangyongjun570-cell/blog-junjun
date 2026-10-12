import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { siteConfig } from '../../siteConfig';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '全部笔记 | ' + siteConfig.title,
  description: '所有文章归档',
};

function toDate(raw: any): Date {
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d;
  } catch {}
  return new Date('1970-01-01');
}

export default function PostsArchivePage() {
  const postsDirectory = path.join(process.cwd(), 'posts');
  let allPosts: any[] = [];
  try {
    if (fs.existsSync(postsDirectory)) {
      const fileNames = fs.readdirSync(postsDirectory).filter(f => f.endsWith('.md'));
      allPosts = fileNames.map(fileName => {
        const { data, content } = matter(fs.readFileSync(path.join(postsDirectory, fileName), 'utf8'));
        const rawDate = data.date || '1970-01-01';
        const d = toDate(rawDate);
        return {
          slug: fileName.replace(/\.md$/, ''),
          title: data.title || '无题',
          description: data.description || content.replace(/[#>*`!\[\]()\n]/g, ' ').trim().substring(0, 80) || '暂无简介',
          tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
          cover: data.cover || siteConfig.defaultPostCover,
          date: rawDate,
          d,
          dateLabel: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`,
        };
      }).sort((a, b) => b.d.getTime() - a.d.getTime() || b.slug.localeCompare(a.slug));
    }
  } catch (e) {}

  // 按年份分组
  const groups: { year: string; posts: any[] }[] = [];
  allPosts.forEach(p => {
    const year = String(p.d.getFullYear());
    const g = groups.find(x => x.year === year);
    if (g) g.posts.push(p);
    else groups.push({ year, posts: [p] });
  });

  return (
    <div className="min-h-screen relative pb-10">
      <Navbar />
      <PageTransition>
        <div className="w-full max-w-4xl mx-auto mt-24 sm:mt-28 px-4 sm:px-6 relative z-10">
          {/* 页头 */}
          <header className="mb-10">
            <h1 className="relative inline-block text-3xl sm:text-4xl font-black tracking-wide text-slate-800 dark:text-white">
              全部笔记
              <span className="absolute left-0 -bottom-2 h-[8px] w-full rounded-full -skew-x-12 bg-gradient-to-r from-pink-400/60 via-fuchsia-400/35 to-transparent" />
            </h1>
            <p className="mt-4 text-sm text-slate-500 dark:text-white/40 font-serif italic">
              共 {allPosts.length} 篇 · 字字皆心血，篇篇是生活
            </p>
          </header>

          {allPosts.length === 0 ? (
            <div className="rounded-3xl bg-white/40 dark:bg-slate-900/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl py-16 text-center text-sm text-slate-400 dark:text-white/40">
              还没有文章，快去写第一篇吧～
            </div>
          ) : (
            <div className="flex flex-col gap-12">
              {groups.map(g => (
                <section key={g.year}>
                  {/* 年份分隔 */}
                  <div className="flex items-center gap-4 mb-5">
                    <span className="font-serif italic font-black text-3xl text-slate-300 dark:text-white/15 select-none">{g.year}</span>
                    <span className="flex-1 h-px bg-gradient-to-r from-pink-400/40 to-transparent" />
                    <span className="text-xs text-slate-400 dark:text-white/35">{g.posts.length} 篇</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {g.posts.map((p, i) => (
                      <Link
                        key={p.slug}
                        href={`/posts/${p.slug}`}
                        className="group flex items-center gap-4 rounded-2xl p-3 pr-5 border border-white/40 dark:border-white/10 bg-white/40 dark:bg-slate-900/50 backdrop-blur-md hover:border-pink-300/70 dark:hover:border-pink-300/30 hover:shadow-lg hover:shadow-pink-300/10 transition-all"
                      >
                        {/* 衬线编号 */}
                        <span className="w-10 flex-shrink-0 text-right font-serif italic font-black text-2xl text-slate-300 dark:text-white/15 group-hover:text-pink-400 dark:group-hover:text-pink-300 transition-colors">
                          {String(allPosts.length - allPosts.indexOf(p)).padStart(2, '0')}
                        </span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.cover} alt="" className="w-20 h-14 rounded-xl object-cover flex-shrink-0 shadow-sm" />
                        <div className="flex-1 min-w-0">
                          <h2 className="font-bold text-slate-800 dark:text-white/90 truncate group-hover:text-pink-400 dark:group-hover:text-pink-300 transition-colors">
                            {p.title}
                          </h2>
                          <p className="text-xs text-slate-500 dark:text-white/40 mt-1 line-clamp-1">{p.description}</p>
                          {p.tags.length > 0 && (
                            <div className="flex gap-1.5 mt-1.5 flex-wrap">
                              {p.tags.slice(0, 4).map((t: string) => (
                                <span key={t} className="px-1.5 py-0.5 rounded-md bg-pink-400/10 dark:bg-pink-300/10 text-pink-500 dark:text-pink-300/80 text-[10px] font-bold">
                                  # {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="flex-shrink-0 text-[11px] text-slate-400 dark:text-white/30 font-mono hidden sm:block">{p.dateLabel}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </PageTransition>
    </div>
  );
}
