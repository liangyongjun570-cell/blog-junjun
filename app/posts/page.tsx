import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import PostsArchiveClient from './PostsArchiveClient';
import PostHeatmap from '../../components/PostHeatmap';
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
          year: String(d.getFullYear()),
          dateLabel: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`,
        };
      }).sort((a, b) => b.d.getTime() - a.d.getTime() || b.slug.localeCompare(a.slug));
    }
  } catch (e) {}

  const totalCount = allPosts.length;

  // 🌟 热力图数据：文章 + 杂谈按日期聚合
  const heatmapData: { date: string; count: number }[] = [];
  const dayMap = new Map<string, number>();
  for (const p of allPosts) {
    const key = p.dateLabel || '';
    if (key) dayMap.set(key, (dayMap.get(key) || 0) + 1);
  }
  try {
    const chattersDirectory = path.join(process.cwd(), 'chatters');
    if (fs.existsSync(chattersDirectory)) {
      for (const f of fs.readdirSync(chattersDirectory).filter(n => n.endsWith('.md'))) {
        const { data } = matter(fs.readFileSync(path.join(chattersDirectory, f), 'utf8'));
        const d = toDate(data.date || '1970-01-01');
        if (d.getTime() > 0) {
          const key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
          dayMap.set(key, (dayMap.get(key) || 0) + 1);
        }
      }
    }
  } catch (e) {}
  for (const [date, count] of dayMap) heatmapData.push({ date, count });

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
              共 {totalCount} 篇 · 字字皆心血，篇篇是生活
            </p>
          </header>

          {/* 🌟 发文热力图 */}
          <div className="mb-8">
            <PostHeatmap data={heatmapData} />
          </div>

          <PostsArchiveClient posts={allPosts.map(({ d, ...p }: any) => p)} />
        </div>
      </PageTransition>
    </div>
  );
}
