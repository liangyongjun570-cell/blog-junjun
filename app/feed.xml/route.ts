import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { siteConfig } from '../../siteConfig';

export const dynamic = 'force-dynamic';

function esc(s: string) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/** RSS 订阅源：/feed.xml */
export async function GET(_req: NextRequest) {
  const base = (siteConfig.siteUrl || 'https://www.junjun.site').replace(/\/$/, '');
  const postsDir = path.join(process.cwd(), 'posts');

  let items = '';
  try {
    const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
    const posts = files.map(f => {
      const { data, content } = matter(fs.readFileSync(path.join(postsDir, f), 'utf8'));
      return {
        slug: f.replace(/\.md$/, ''),
        title: data.title || f,
        date: new Date(data.date || '1970-01-01'),
        description: data.description || content.replace(/[#*`>\[\]!]/g, '').trim().slice(0, 120),
      };
    }).filter(p => !isNaN(p.date.getTime()))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 20);

    items = posts.map(p => `
    <item>
      <title>${esc(p.title)}</title>
      <link>${base}/posts/${p.slug}</link>
      <guid isPermaLink="true">${base}/posts/${p.slug}</guid>
      <pubDate>${p.date.toUTCString()}</pubDate>
      <description>${esc(p.description)}</description>
    </item>`).join('');
  } catch { /* 没有文章就输出空频道 */ }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(siteConfig.title)}</title>
    <link>${base}</link>
    <description>${esc(siteConfig.bio || '')}</description>
    <language>zh-CN</language>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
