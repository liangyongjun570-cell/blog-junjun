import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import { siteConfig } from '../siteConfig';
import CloudPlayer from '../components/CloudPlayer';
import ThemeToggleBlock from '../components/ThemeToggleBlock';
import WeatherWidget from '../components/WeatherWidget';
import SiteDashboard from '../components/SiteDashboard';
import { albums } from '../data/albums';
import { ToastProvider } from '../components/ToastProvider';
import HeroSection from '../components/HeroSection';
import HomeShowcase, { NoteItem, EventItem, FragmentItem, AlbumCard } from '../components/HomeShowcase';

function toDate(raw: any): Date {
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d;
  } catch {}
  return new Date('1970-01-01');
}

function formatUpdateTime(dateString: string) {
  if (!dateString || dateString === '1970-01-01') return '刚刚更新';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    if (hours === '00' && mins === '00') return `${year}.${month}.${day}`;
    return `${year}.${month}.${day} ${hours}:${mins}`;
  } catch { return dateString; }
}

export default function Home() {
  /* ---------------- 文章 ---------------- */
  const postsDirectory = path.join(process.cwd(), 'posts');
  let allPosts: any[] = [];
  try {
    if (fs.existsSync(postsDirectory)) {
      const fileNames = fs.readdirSync(postsDirectory).filter(f => f.endsWith('.md'));
      allPosts = fileNames.map(fileName => {
        const fullPath = path.join(postsDirectory, fileName);
        const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));
        const rawDate = data.date || '1970-01-01';
        return {
          slug: fileName.replace(/\.md$/, ''),
          ...data,
          title: data.title || '',
          description: data.description || '',
          tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
          cover: data.cover || siteConfig.defaultPostCover,
          content: content || '',
          date: rawDate,
          d: toDate(rawDate),
          formattedDate: formatUpdateTime(rawDate)
        };
      }).sort((a, b) => b.d.getTime() - a.d.getTime() || b.slug.localeCompare(a.slug));
    }
  } catch (e) {}

  /* ---------------- 碎片（说说） ---------------- */
  const chattersDirectory = path.join(process.cwd(), 'chatters');
  let allChatters: any[] = [];
  try {
    if (fs.existsSync(chattersDirectory)) {
      const chatterFiles = fs.readdirSync(chattersDirectory).filter(f => f.endsWith('.md'));
      allChatters = chatterFiles.map(fileName => {
        const fullPath = path.join(chattersDirectory, fileName);
        const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));
        const rawDate = data.date || '1970-01-01';
        return {
          slug: fileName.replace(/\.md$/, ''),
          title: data.title || '碎片记录',
          description: data.description || content.substring(0, 60),
          cover: data.cover || '/records-default.jpg',
          date: rawDate,
          d: toDate(rawDate),
          formattedDate: formatUpdateTime(rawDate)
        };
      }).sort((a, b) => b.d.getTime() - a.d.getTime() || b.slug.localeCompare(a.slug));
    }
  } catch (e) {}

  const chatterCount = allChatters.length;

  /* ---------------- 近期笔记 ---------------- */
  const notes: NoteItem[] = allPosts.slice(0, 6).map(p => {
    const d = p.d;
    return {
      slug: p.slug,
      title: p.title,
      cover: p.cover,
      dateLabel: `${d.getMonth() + 1}月${d.getDate()}日`,
      description: p.description,
    };
  });

  /* ---------------- 站点动态时间线 ---------------- */
  const events: { text: string; dateLabel: string; t: number }[] = [];
  allPosts.slice(0, 5).forEach(p => {
    events.push({ text: `发布了文章 ${p.title}`, dateLabel: '', t: p.d.getTime() });
    (p.tags || []).slice(0, 3).forEach((tag: string) => {
      events.push({ text: `添加了标签 ${tag}`, dateLabel: '', t: p.d.getTime() });
    });
  });
  allChatters.slice(0, 4).forEach(c => {
    events.push({ text: `更新了碎碎念 ${c.title}`, dateLabel: '', t: c.d.getTime() });
  });
  albums.slice(0, 3).forEach(a => {
    events.push({ text: `创建了相册 ${a.title}`, dateLabel: '', t: toDate(a.date).getTime() });
  });
  events.sort((a, b) => b.t - a.t);
  const timelineEvents: EventItem[] = events.slice(0, 8).map(e => {
    const d = new Date(e.t);
    return {
      text: e.text,
      dateLabel: isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}月${d.getDate()}日`,
    };
  });

  /* ---------------- 随想碎片 ---------------- */
  const fragments: FragmentItem[] = [];
  allChatters.forEach(c => {
    const d = c.d;
    fragments.push({
      src: c.cover,
      dateLabel: `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      caption: c.title,
    });
  });
  albums.forEach(a => {
    (a.photos || []).forEach((ph: any) => {
      const d = toDate(a.date);
      fragments.push({
        src: ph.url,
        dateLabel: `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        caption: ph.caption || a.title || '相册照片',
      });
    });
  });
  // 数据不足时用文章配图补位，保证视觉效果
  const fallbackFrags: FragmentItem[] = [
    { src: '/images/blog-begin-cover.jpg', dateLabel: '', caption: '博客开端' },
    { src: '/images/blog-begin-plc.jpg', dateLabel: '', caption: '工控日常' },
    { src: '/images/blog-begin-code.jpg', dateLabel: '', caption: '深夜代码' },
    { src: '/images/blog-begin-launch.jpg', dateLabel: '', caption: '小站上线' },
  ];
  for (const fb of fallbackFrags) {
    if (fragments.length >= 4) break;
    fragments.push(fb);
  }

  /* ---------------- 生活回想（相册） ---------------- */
  const albumCards: AlbumCard[] = albums.map(a => {
    const d = toDate(a.date);
    return {
      title: a.title || '未命名相册',
      cover: a.cover || (a.photos && a.photos[0]?.url) || siteConfig.photoWallImage,
      description: a.description || '',
      count: (a.photos || []).length,
      dateLabel: isNaN(d.getTime()) ? '' : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`,
    };
  });
  if (albumCards.length === 0) {
    albumCards.push({ title: '照片墙', cover: siteConfig.photoWallImage, description: '记录生活的每个瞬间', count: 0, dateLabel: '' });
  }

  return (
    <ToastProvider>
      <div className="min-h-screen relative pb-10">
        <Navbar />
        <HeroSection />
        <PageTransition>
          <div id="home-content" className="w-full max-w-6xl mx-auto mt-16 sm:mt-20 px-4 sm:px-6 lg:px-10 relative z-10 scroll-mt-24">
            <main className="flex flex-col gap-10 w-full">

              {/* 近期笔记 + 站点动态 + 随想碎片 + 生活回想 */}
              <HomeShowcase
                notes={notes}
                totalPosts={allPosts.length}
                events={timelineEvents}
                stats={{ posts: allPosts.length, chatters: chatterCount }}
                fragments={fragments.slice(0, 12)}
                albumCards={albumCards}
              />

              {/* 工具行：音乐播放器 + 天气 + 主题切换 */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 w-full">
                <div className="sm:col-span-2 flex flex-col min-h-[200px]">
                  <CloudPlayer />
                </div>
                <div className="sm:col-span-1 flex flex-col min-h-[120px]">
                  <WeatherWidget />
                </div>
                <div className="sm:col-span-1 flex flex-col min-h-[120px]">
                  <ThemeToggleBlock />
                </div>
              </div>

              {/* 底部数据面板 */}
              <div className="w-full mt-2"><SiteDashboard /></div>
            </main>
          </div>
        </PageTransition>
      </div>
    </ToastProvider>
  );
}
