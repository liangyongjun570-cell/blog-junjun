import type { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { siteConfig } from '../siteConfig';

export const dynamic = 'force-dynamic';

function toDate(raw: any): Date {
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d;
  } catch {}
  return new Date('2026-01-01');
}

/** 动态 sitemap：全部静态页 + 文章 + 杂谈 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (siteConfig.siteUrl || 'https://www.junjun.site').replace(/\/$/, '');
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    '', '/posts', '/chatter', '/moments', '/timeline', '/photowall',
    '/music', '/friends', '/projects', '/about', '/tree',
  ].map(route => ({
    url: `${base}${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.7,
  }));

  const mdRoutes: MetadataRoute.Sitemap = [];
  const scan = (dir: 'posts' | 'chatters', prefix: string, priority: number) => {
    try {
      const full = path.join(process.cwd(), dir);
      if (!fs.existsSync(full)) return;
      for (const f of fs.readdirSync(full).filter(x => x.endsWith('.md'))) {
        try {
          const { data } = matter(fs.readFileSync(path.join(full, f), 'utf8'));
          mdRoutes.push({
            url: `${base}${prefix}/${f.replace(/\.md$/, '')}`,
            lastModified: toDate(data.date),
            changeFrequency: 'monthly',
            priority,
          });
        } catch {}
      }
    } catch {}
  };
  scan('posts', '/posts', 0.9);
  scan('chatters', '/chatter', 0.8);

  return [...staticRoutes, ...mdRoutes];
}
